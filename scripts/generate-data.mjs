// DHARA — Simulated dataset generator (hackathon rule: mock/simulated data only)
// Generates 24 months of financials + proxy signals for 8 rural micro enterprises
// across the 5 mandated sectors, with realistic seasonality and injected stress
// patterns. Deterministic (seeded) so the dataset is reproducible.
// Run: node scripts/generate-data.mjs  →  src/data/enterprises.json

import { writeFileSync, mkdirSync } from "fs";

// seeded RNG (mulberry32)
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Months: Aug 2024 → Jul 2026 (24 months of history)
const MONTHS = [];
for (let i = 0; i < 24; i++) {
  const d = new Date(2024, 7 + i, 1);
  MONTHS.push({ y: d.getFullYear(), m: d.getMonth() }); // m: 0-11
}
const LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Sector seasonality templates (income multiplier per calendar month, Jan..Dec)
// Grounded in real patterns: dairy peaks in winter (flush season), poultry dips in
// summer heat + peaks in winter demand, food processing peaks post-harvest &
// festive, handicrafts peak Oct-Dec (festive/wedding + tourist), retail peaks festive.
const SEASONALITY = {
  dairy:      [1.18, 1.15, 1.05, 0.92, 0.82, 0.78, 0.85, 0.95, 1.00, 1.08, 1.12, 1.20],
  poultry:    [1.12, 1.10, 0.98, 0.85, 0.78, 0.82, 0.90, 0.95, 1.02, 1.10, 1.18, 1.20],
  food:       [1.05, 1.08, 1.15, 1.10, 0.95, 0.85, 0.82, 0.90, 1.02, 1.20, 1.18, 1.10],
  handicraft: [0.85, 0.80, 0.90, 0.95, 0.88, 0.80, 0.85, 1.00, 1.15, 1.35, 1.30, 1.17],
  retail:     [1.02, 0.95, 1.00, 1.05, 0.98, 0.92, 0.95, 1.05, 1.10, 1.25, 1.20, 1.03],
};

// commodity/mandi price index per sector (base 100, monthly walk + shocks)
function priceSeries(rand, drift, shockAt = -1, shockSize = 0) {
  const out = [];
  let p = 100;
  for (let i = 0; i < 24; i++) {
    p = p * (1 + drift + (rand() - 0.5) * 0.03);
    if (i === shockAt) p *= 1 + shockSize;
    out.push(Math.round(p * 10) / 10);
  }
  return out;
}

// rainfall anomaly % vs normal (monsoon months matter)
function rainSeries(rand, deficitYear2 = false) {
  return MONTHS.map(({ m }, i) => {
    const monsoon = m >= 5 && m <= 8; // Jun-Sep
    let a = (rand() - 0.5) * 20;
    if (monsoon && deficitYear2 && i >= 12) a -= 28; // second-year monsoon deficit
    return Math.round(a);
  });
}

const ENTERPRISES = [
  {
    id: "lakshmi-dairy", name: "Lakshmi Mahila Dairy SHG", sector: "dairy",
    type: "SHG", members: 14, village: "Karamsad", district: "Anand, Gujarat",
    since: 2019, baseIncome: 96000, expenseRatio: 0.71, seed: 101,
    loan: { outstanding: 240000, emi: 11200, lender: "DCCB Anand" },
    savingsBase: 68000, upiShare: 0.55,
    note: "Milk pooling + ghee unit. Healthy, winter-flush driven.",
    stress: { type: "none" },
  },
  {
    id: "sundarban-poultry", name: "Sundarban Poultry FPO", sector: "poultry",
    type: "FPO", members: 62, village: "Gosaba", district: "South 24 Parganas, WB",
    since: 2021, baseIncome: 210000, expenseRatio: 0.78, seed: 202,
    loan: { outstanding: 650000, emi: 28400, lender: "Bangiya Gramin Vikash Bank" },
    savingsBase: 145000, upiShare: 0.42,
    note: "Broiler + eggs. Feed-price exposed.",
    stress: { type: "feed-spike", month: 19, size: 0.24 }, // maize price spike
  },
  {
    id: "shakti-pickles", name: "Shakti Gruh Udyog (Pickles & Papad)", sector: "food",
    type: "SHG", members: 11, village: "Wai", district: "Satara, Maharashtra",
    since: 2018, baseIncome: 74000, expenseRatio: 0.64, seed: 303,
    loan: { outstanding: 90000, emi: 4600, lender: "SHG Bank Linkage — BoM" },
    savingsBase: 52000, upiShare: 0.61,
    note: "Post-harvest processing. Strong, expanding to quick-commerce.",
    stress: { type: "none" },
  },
  {
    id: "bhuj-craft", name: "Bhuj Bandhani Craft Collective", sector: "handicraft",
    type: "SHG", members: 23, village: "Bhujodi", district: "Kachchh, Gujarat",
    since: 2017, baseIncome: 118000, expenseRatio: 0.58, seed: 404,
    loan: { outstanding: 310000, emi: 14800, lender: "GSCB" },
    savingsBase: 84000, upiShare: 0.47,
    note: "Tie-dye textiles. Festive/export peaks, deep lean season Jan-Mar.",
    stress: { type: "demand-slump", month: 20, size: -0.45 }, // export order cancelled
  },
  {
    id: "kisan-kirana", name: "Kisan Kirana & Agri-Inputs", sector: "retail",
    type: "Entrepreneur", members: 1, village: "Piparia", district: "Hoshangabad, MP",
    since: 2020, baseIncome: 152000, expenseRatio: 0.83, seed: 505,
    loan: { outstanding: 180000, emi: 8900, lender: "MP Gramin Bank (Mudra)" },
    savingsBase: 39000, upiShare: 0.68,
    note: "Village shop + seed/fertiliser counter. Thin margins, UPI heavy.",
    stress: { type: "upi-decline", month: 18, size: -0.32 }, // new competitor
  },
  {
    id: "yamuna-dairy", name: "Yamuna Dugdh Utpadak Samiti", sector: "dairy",
    type: "FPO", members: 88, village: "Chata", district: "Mathura, UP",
    since: 2016, baseIncome: 380000, expenseRatio: 0.76, seed: 606,
    loan: { outstanding: 1150000, emi: 47500, lender: "Prathama UP Gramin Bank" },
    savingsBase: 260000, upiShare: 0.5,
    note: "Bulk milk chilling. Fodder cost exposed to monsoon deficit.",
    stress: { type: "weather", size: -0.18 }, // monsoon deficit year 2 → fodder cost up
  },
  {
    id: "meen-foods", name: "Meenakshi Millet Foods SHG", sector: "food",
    type: "SHG", members: 9, village: "Kolli Hills", district: "Namakkal, TN",
    since: 2022, baseIncome: 58000, expenseRatio: 0.69, seed: 707,
    loan: { outstanding: 150000, emi: 7300, lender: "TN Grama Bank" },
    savingsBase: 31000, upiShare: 0.58,
    note: "Millet snacks; young unit, seasonal raw-material working capital strain.",
    stress: { type: "wc-strain", month: 21, size: -0.15 },
  },
  {
    id: "rann-craft", name: "Rann Leather & Mirror Works", sector: "handicraft",
    type: "Entrepreneur", members: 4, village: "Hodka", district: "Kachchh, Gujarat",
    since: 2019, baseIncome: 66000, expenseRatio: 0.6, seed: 808,
    loan: { outstanding: 70000, emi: 3400, lender: "SEWA Bank" },
    savingsBase: 42000, upiShare: 0.52,
    note: "Tourist-season driven (Rann Utsav Nov-Feb).",
    stress: { type: "none" },
  },
];

const out = ENTERPRISES.map((e) => {
  const rand = rng(e.seed);
  const seas = SEASONALITY[e.sector];
  const growth = 0.006 + rand() * 0.008; // 0.6-1.4%/month secular growth
  const priceDrift = e.sector === "poultry" ? 0.004 : 0.002;
  const shock = e.stress.type === "feed-spike" ? { at: e.stress.month, size: e.stress.size } : { at: -1, size: 0 };
  const mandi = priceSeries(rng(e.seed + 1), priceDrift, shock.at, shock.size);
  const rain = rainSeries(rng(e.seed + 2), e.stress.type === "weather");

  let savings = e.savingsBase;
  const months = MONTHS.map(({ y, m }, i) => {
    let income = e.baseIncome * seas[m] * Math.pow(1 + growth, i) * (0.94 + rand() * 0.12);
    let expenseRatio = e.expenseRatio * (0.96 + rand() * 0.08);

    // stress injections
    if (e.stress.type === "feed-spike" && i >= e.stress.month) expenseRatio *= 1 + (mandi[i] / mandi[e.stress.month - 1] - 1) * 0.7;
    if (e.stress.type === "demand-slump" && i >= e.stress.month) income *= 1 + e.stress.size * Math.min(1, (i - e.stress.month + 1) / 2);
    if (e.stress.type === "upi-decline" && i >= e.stress.month) income *= 1 + e.stress.size * Math.min(1, (i - e.stress.month + 1) / 3);
    if (e.stress.type === "weather" && i >= 13 && rain[i] < -15) { expenseRatio *= 1.18; income *= 0.94; } // fodder cost + yield dip
    if (e.stress.type === "wc-strain" && i >= e.stress.month) { expenseRatio *= 1.16; income *= 0.95; }

    const expenses = income * expenseRatio;
    const net = income - expenses - e.loan.emi;
    savings = Math.max(4000, savings + net * 0.8);
    const upiTxns = Math.round((income * e.upiShare) / 380 * (0.9 + rand() * 0.2));

    return {
      label: `${LABELS[m]} ${String(y).slice(2)}`,
      month: m, year: y,
      income: Math.round(income),
      expenses: Math.round(expenses),
      net: Math.round(net),
      savings: Math.round(savings),
      upiTxns,
      mandiIndex: mandi[i],
      rainAnomaly: rain[i],
    };
  });

  return { ...e, months };
});

mkdirSync("src/data", { recursive: true });
writeFileSync("src/data/enterprises.json", JSON.stringify(out, null, 1));
console.log(`Generated ${out.length} enterprises × 24 months → src/data/enterprises.json`);
