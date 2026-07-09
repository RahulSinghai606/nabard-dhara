// ─────────────────────────────────────────────────────────────
// DHARA Forecast & Risk Engine — runs entirely ON-DEVICE (browser).
// Classical, explainable ML: multiplicative seasonal decomposition +
// robust trend regression + external-signal adjustment, with a
// SHAP-style factor attribution for every risk flag.
// No network needed → true offline-first inference.
// ─────────────────────────────────────────────────────────────

export type MonthRow = {
  label: string;
  month: number;
  year: number;
  income: number;
  expenses: number;
  net: number;
  savings: number;
  upiTxns: number;
  mandiIndex: number;
  rainAnomaly: number;
};

export type Enterprise = {
  id: string;
  name: string;
  sector: "dairy" | "poultry" | "food" | "handicraft" | "retail";
  type: string;
  members: number;
  village: string;
  district: string;
  since: number;
  note: string;
  loan: { outstanding: number; emi: number; lender: string };
  months: MonthRow[];
};

export type ForecastPoint = {
  label: string;
  month: number;
  income: number;
  expenses: number;
  net: number;
  lo: number; // income band
  hi: number;
  savingsProj: number;
};

export type Factor = { name: string; weight: number; direction: "up" | "down" };

export type RiskFlag = {
  id: string;
  severity: "high" | "medium" | "watch";
  title: string;
  detail: string;
  factors: Factor[];
};

export type PulseResult = {
  forecast: ForecastPoint[];
  flags: RiskFlag[];
  riskScore: number; // 0 (safe) - 100 (critical)
  riskBand: "healthy" | "watch" | "stress" | "critical";
  seasonalIndex: number[]; // per calendar month
  trendPerMonth: number; // ₹/month income trend
  runwayMonths: number;
  emiCover: number; // avg forecast net+emi / emi
  drivers: { upiTrend: number; mandiTrend: number; rainStress: boolean };
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function linreg(ys: number[]): { a: number; b: number } {
  const n = ys.length;
  const xs = ys.map((_, i) => i);
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const b = den ? num / den : 0;
  return { a: my - b * mx, b };
}

export function computePulse(e: Enterprise, horizon = 6): PulseResult {
  const h = e.months;
  const n = h.length;

  // 1) seasonal index (multiplicative): month income / centered level
  const level = h.map((r) => r.income);
  const { a, b } = linreg(level);
  const detrended = level.map((y, i) => y / Math.max(1, a + b * i));
  const seasonalIndex = Array.from({ length: 12 }, (_, m) => {
    const vals = h.filter((r) => r.month === m).map((_, ) => 0);
    const list = h.map((r, i) => ({ m: r.month, v: detrended[i] })).filter((x) => x.m === m).map((x) => x.v);
    void vals;
    return list.length ? list.reduce((s, v) => s + v, 0) / list.length : 1;
  });
  // normalize
  const meanIdx = seasonalIndex.reduce((s, v) => s + v, 0) / 12;
  const seas = seasonalIndex.map((v) => v / meanIdx);

  // 2) residual volatility for confidence band
  const fitted = level.map((_, i) => (a + b * i) * seas[h[i].month]);
  const resid = level.map((y, i) => (y - fitted[i]) / Math.max(1, fitted[i]));
  const sd = Math.sqrt(resid.reduce((s, r) => s + r * r, 0) / n);

  // 3) external signal adjustments (last-6-month trends)
  const last6 = h.slice(-6);
  const prev6 = h.slice(-12, -6);
  const avg = (rows: MonthRow[], k: keyof MonthRow) => rows.reduce((s, r) => s + (r[k] as number), 0) / rows.length;
  const upiTrend = avg(last6, "upiTxns") / Math.max(1, avg(prev6, "upiTxns")) - 1;
  const mandiTrend = avg(last6, "mandiIndex") / Math.max(1, avg(prev6, "mandiIndex")) - 1;
  const rainStress = last6.some((r) => r.rainAnomaly < -18);

  // income adjustment: UPI decline is a demand proxy; cap effects
  const upiAdj = Math.max(-0.12, Math.min(0.08, upiTrend * 0.5));
  // expense adjustment: mandi price rise raises input costs for these sectors
  const costSectors: Record<string, number> = { poultry: 0.7, dairy: 0.5, food: 0.55, retail: 0.35, handicraft: 0.25 };
  const mandiAdj = Math.max(0, mandiTrend) * (costSectors[e.sector] ?? 0.4);
  const rainAdj = rainStress && (e.sector === "dairy" || e.sector === "food") ? 0.06 : 0;

  // expense ratio recent
  const expRatio = avg(last6, "expenses") / Math.max(1, avg(last6, "income"));

  // 4) forecast
  const lastRow = h[n - 1];
  let savings = lastRow.savings;
  const forecast: ForecastPoint[] = [];
  for (let k = 1; k <= horizon; k++) {
    const idx = n - 1 + k;
    const m = (lastRow.month + k) % 12;
    const y = lastRow.year + Math.floor((lastRow.month + k) / 12);
    const baseIncome = (a + b * idx) * seas[m] * (1 + upiAdj);
    const expenses = baseIncome * Math.min(0.97, expRatio * (1 + mandiAdj + rainAdj));
    const net = baseIncome - expenses - e.loan.emi;
    savings = Math.max(0, savings + net * 0.8);
    const band = sd * Math.sqrt(k) * 1.28; // ~80% band, widening
    forecast.push({
      label: `${MONTH_LABELS[m]} ${String(y).slice(2)}`,
      month: m,
      income: Math.round(baseIncome),
      expenses: Math.round(expenses),
      net: Math.round(net),
      lo: Math.round(baseIncome * (1 - band)),
      hi: Math.round(baseIncome * (1 + band)),
      savingsProj: Math.round(savings),
    });
  }

  // 5) risk flags with factor attribution
  const flags: RiskFlag[] = [];
  const avgNet = forecast.reduce((s, f) => s + f.net, 0) / horizon;
  const negMonths = forecast.filter((f) => f.net < 0).length;
  const monthlyBurn = avgNet < 0 ? -avgNet : 0;
  const runwayMonths = monthlyBurn > 0 ? lastRow.savings / monthlyBurn : 99;
  const emiCover = (avgNet + e.loan.emi) / Math.max(1, e.loan.emi);

  // seasonal dip ahead?
  const dipAhead = forecast.some((f) => seas[f.month] < 0.86);
  const upiDecline = upiTrend < -0.08;
  const mandiSpike = mandiTrend > 0.08;

  if (negMonths >= 2) {
    flags.push({
      id: "cashflow",
      severity: negMonths >= 4 ? "high" : "medium",
      title: `Negative cash flow in ${negMonths} of next ${horizon} months`,
      detail: `Average projected net is ₹${Math.round(avgNet).toLocaleString("en-IN")}/month after the ₹${e.loan.emi.toLocaleString("en-IN")} EMI.`,
      factors: attribution([
        ["Input cost trend (mandi)", mandiSpike ? 0.4 : 0.1, "down"],
        ["Seasonal low period", dipAhead ? 0.3 : 0.1, "down"],
        ["Demand proxy (UPI trend)", upiDecline ? 0.35 : 0.05, "down"],
        ["Loan EMI load", e.loan.emi / Math.max(1, avg(last6, "income")) > 0.12 ? 0.25 : 0.1, "down"],
      ]),
    });
  }
  if (runwayMonths < 4 && monthlyBurn > 0) {
    flags.push({
      id: "runway",
      severity: runwayMonths < 2.5 ? "high" : "medium",
      title: `Savings cover only ~${runwayMonths.toFixed(1)} months at projected burn`,
      detail: `Reserves ₹${lastRow.savings.toLocaleString("en-IN")} vs projected shortfall ₹${Math.round(monthlyBurn).toLocaleString("en-IN")}/month.`,
      factors: attribution([
        ["Projected burn rate", 0.5, "down"],
        ["Current reserves", 0.3, "down"],
        ["Seasonal recovery ahead", seas[forecast[horizon - 1].month] > 1.05 ? 0.2 : 0.05, "up"],
      ]),
    });
  }
  if (emiCover < 1.4) {
    flags.push({
      id: "repayment",
      severity: emiCover < 1.05 ? "high" : "medium",
      title: `Repayment stress: EMI cover ${emiCover.toFixed(2)}× (safe ≥ 1.5×)`,
      detail: `${e.loan.lender} EMI ₹${e.loan.emi.toLocaleString("en-IN")} vs projected operating surplus.`,
      factors: attribution([
        ["Operating surplus trend", 0.45, "down"],
        ["Input cost pressure", mandiSpike ? 0.35 : 0.1, "down"],
        ["Income seasonality", dipAhead ? 0.2 : 0.1, "down"],
      ]),
    });
  }
  if (mandiSpike) {
    flags.push({
      id: "market",
      severity: mandiTrend > 0.15 ? "high" : "watch",
      title: `Input price index up ${(mandiTrend * 100).toFixed(0)}% over 6 months`,
      detail: `Commodity/mandi trend is compressing margins for the ${e.sector} sector.`,
      factors: attribution([
        ["Mandi price momentum", 0.6, "down"],
        ["Sector cost pass-through", 0.4, "down"],
      ]),
    });
  }
  if (upiDecline) {
    flags.push({
      id: "demand",
      severity: upiTrend < -0.15 ? "high" : "watch",
      title: `Digital sales proxy down ${Math.abs(upiTrend * 100).toFixed(0)}%`,
      detail: "UPI transaction volume (aggregated, no PII) suggests local demand softening.",
      factors: attribution([
        ["UPI txn trend", 0.55, "down"],
        ["Local competition / footfall", 0.45, "down"],
      ]),
    });
  }
  if (rainStress) {
    flags.push({
      id: "climate",
      severity: "watch",
      title: "Monsoon deficit detected in operating region",
      detail: "Rainfall anomaly below −18% raises fodder/raw-material cost risk next season.",
      factors: attribution([
        ["Rainfall anomaly", 0.6, "down"],
        ["Fodder/input dependence", 0.4, "down"],
      ]),
    });
  }
  if (dipAhead && flags.length === 0) {
    flags.push({
      id: "seasonal",
      severity: "watch",
      title: "Seasonal lean period in forecast window",
      detail: "A known low-income season falls in the next 6 months — plan reserves now.",
      factors: attribution([
        ["Sector seasonality", 0.7, "down"],
        ["Reserve position", 0.3, "up"],
      ]),
    });
  }

  // 6) composite risk score
  const sevScore = flags.reduce((s, f) => s + (f.severity === "high" ? 28 : f.severity === "medium" ? 16 : 7), 0);
  const base = Math.max(0, Math.min(40, (1.6 - emiCover) * 30)) + Math.max(0, Math.min(30, (4 - runwayMonths) * 6));
  const riskScore = Math.max(2, Math.min(98, Math.round(sevScore * 0.7 + base * 0.6)));
  const riskBand = riskScore >= 70 ? "critical" : riskScore >= 45 ? "stress" : riskScore >= 22 ? "watch" : "healthy";

  return {
    forecast,
    flags,
    riskScore,
    riskBand,
    seasonalIndex: seas,
    trendPerMonth: Math.round(b),
    runwayMonths: Math.min(99, Math.round(runwayMonths * 10) / 10),
    emiCover: Math.round(emiCover * 100) / 100,
    drivers: { upiTrend: Math.round(upiTrend * 100) / 100, mandiTrend: Math.round(mandiTrend * 100) / 100, rainStress },
  };
}

function attribution(raw: [string, number, "up" | "down"][]): Factor[] {
  const total = raw.reduce((s, [, w]) => s + w, 0) || 1;
  return raw
    .map(([name, w, direction]) => ({ name, weight: Math.round((w / total) * 100), direction }))
    .sort((x, y) => y.weight - x.weight);
}
