"use client";

// DHARA Field Officer Cockpit
// Every number on this page is computed ON-DEVICE by src/lib/forecast.ts —
// ranked risk list, Enterprise Pulse chart, explainable flags. The LLM is only
// used (optionally) to phrase insights in the officer's / enterprise's language.

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Activity,
  Siren,
  Volume2,
  Square,
  Mic,
  Plus,
  Sparkles,
  WifiOff,
  X,
  TrendingUp,
  TrendingDown,
  CloudRain,
  Landmark,
  Users,
} from "lucide-react";
import raw from "@/data/enterprises.json";
import { computePulse, Enterprise, MonthRow } from "@/lib/forecast";
import { Lang, LANGS, t, ttsLocale, SECTOR_LABEL, TYPE_LABEL, flagText, factorName, localizeMonthLabel } from "@/lib/i18n";
import { speak, stopSpeak, listenOnce } from "@/lib/voice";
import PulseChart from "@/components/PulseChart";
import AnimatedStepper, { Step } from "@/components/AnimatedStepper";
import DharaOrb from "@/components/DharaOrb";

const BAND_STYLE: Record<string, string> = {
  healthy: "text-leaf bg-leaf/10",
  watch: "text-amber bg-amber/10",
  stress: "text-alert bg-alert/10",
  critical: "text-white bg-alert",
};

type Insight = { insight: string; actions: string[]; officerNote: string; live: boolean };

export default function Cockpit() {
  const [lang, setLang] = useState<Lang>("en");
  const [data, setData] = useState<Enterprise[]>(raw as unknown as Enterprise[]);
  const [selectedId, setSelectedId] = useState<string>("sundarban-poultry");
  const [insight, setInsight] = useState<Insight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [entryOpen, setEntryOpen] = useState(false);
  const [entry, setEntry] = useState({ income: "", expenses: "", note: "" });
  const [listening, setListening] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  // on-device: compute pulse for every enterprise → ranked risk list
  const pulses = useMemo(() => {
    const map = new Map(data.map((e) => [e.id, computePulse(e)]));
    return map;
  }, [data]);

  const ranked = useMemo(
    () => [...data].sort((a, b) => (pulses.get(b.id)!.riskScore - pulses.get(a.id)!.riskScore)),
    [data, pulses]
  );

  const ent = data.find((e) => e.id === selectedId)!;
  const pulse = pulses.get(selectedId)!;

  const select = (id: string) => {
    setSelectedId(id);
    setInsight(null);
    stopSpeak();
    setSpeaking(false);
  };

  const askDhara = async () => {
    setInsightLoading(true);
    setInsight(null);
    try {
      const res = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          enterprise: { name: ent.name, sector: ent.sector, type: ent.type, district: ent.district, loan: ent.loan },
          pulse: {
            riskScore: pulse.riskScore,
            riskBand: pulse.riskBand,
            runwayMonths: pulse.runwayMonths,
            emiCover: pulse.emiCover,
            flags: pulse.flags.map((f) => flagText("en", f.id, f.params, SECTOR_LABEL.en[ent.sector])),
            forecast: pulse.forecast.map((f) => ({ label: f.label, net: f.net })),
            drivers: pulse.drivers,
          },
        }),
      });
      setInsight(await res.json());
    } catch {
      setInsight({
        insight: t(lang, "offline"),
        actions: [],
        officerNote: "Offline — on-device flags remain fully available.",
        live: false,
      });
    }
    setInsightLoading(false);
  };

  const listen = () => {
    if (!insight) return;
    const text = `${insight.insight} ${insight.actions.join(". ")}`;
    setSpeaking(true);
    const ok = speak(text, ttsLocale(lang), () => setSpeaking(false));
    if (!ok) setSpeaking(false);
  };

  const voiceFill = async (field: "income" | "expenses" | "note") => {
    setListening(field);
    try {
      const text = await listenOnce(ttsLocale(lang));
      if (field === "note") setEntry((s) => ({ ...s, note: text }));
      else {
        const num = text.replace(/[^0-9]/g, "");
        setEntry((s) => ({ ...s, [field]: num || s[field] }));
      }
    } catch {
      /* unsupported/silent — user types instead */
    }
    setListening(null);
  };

  const saveEntry = () => {
    const income = parseInt(entry.income || "0", 10);
    const expenses = parseInt(entry.expenses || "0", 10);
    if (!income && !expenses) return;
    setData((prev) =>
      prev.map((e) => {
        if (e.id !== selectedId) return e;
        const last = e.months[e.months.length - 1];
        const m = (last.month + 1) % 12;
        const y = last.year + (last.month === 11 ? 1 : 0);
        const LB = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const net = income - expenses - e.loan.emi;
        const row: MonthRow = {
          label: `${LB[m]} ${String(y).slice(2)}`,
          month: m,
          year: y,
          income,
          expenses,
          net,
          savings: Math.max(0, last.savings + net * 0.8),
          upiTxns: Math.round((income * 0.5) / 380),
          mandiIndex: last.mandiIndex,
          rainAnomaly: last.rainAnomaly,
        };
        return { ...e, months: [...e.months, row] };
      })
    );
    setEntryOpen(false);
    setEntry({ income: "", expenses: "", note: "" });
    setInsight(null);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2600);
  };

  const S = (k: string) => t(lang, k);

  return (
    <main className="min-h-screen field-bg noise">
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg hover:bg-bg transition-colors" aria-label="Back">
              <ArrowLeft className="w-4 h-4 text-ink-soft" />
            </Link>
            <Image src="/kellton-logo.jpg" alt="Kellton" width={84} height={24} className="h-5 w-auto rounded" />
            <span className="h-5 w-px bg-line" />
            <span className="font-display font-bold text-forest">
              DHARA <span className="text-gradient">{S("cockpit")}</span>
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* language switcher — the star */}
            <div className="flex gap-1 rounded-xl bg-bg-soft p-1">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setInsight(null);
                    stopSpeak();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${lang === l.code ? "bg-leaf text-white card-elevate" : "text-ink-soft hover:text-forest"}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-semibold text-leaf bg-leaf/10 rounded-full px-3 py-1">
              <WifiOff className="w-3.5 h-3.5" /> {S("offline")}
            </span>
            <Image src="/nabard-logo.png" alt="NABARD" width={52} height={34} className="h-8 w-auto rounded" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-[320px_1fr_400px] gap-5">
        {/* ── ranked risk list ── */}
        <aside className="space-y-3">
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-ink-faint px-1">
            {S("enterprises")} · {S("riskScore")} ↓
          </p>
          {ranked.map((e) => {
            const p = pulses.get(e.id)!;
            const active = e.id === selectedId;
            return (
              <button
                key={e.id}
                onClick={() => select(e.id)}
                className={`w-full text-left rounded-2xl p-4 transition-all border ${active ? "bg-surface border-sprout card-elevate -translate-y-0.5" : "glass border-transparent hover:border-line hover:bg-white"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--line)" strokeWidth="12" />
                      <circle
                        cx="50" cy="50" r="42" fill="none"
                        stroke={p.riskScore >= 45 ? "#d4553a" : p.riskScore >= 22 ? "#e8a13d" : "#1e7d46"}
                        strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={264} strokeDashoffset={264 - (264 * p.riskScore) / 100}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[13px] font-display font-bold text-forest">{p.riskScore}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-forest text-sm leading-snug truncate">{e.name}</p>
                    <p className="text-[11px] text-ink-soft truncate">
                      {SECTOR_LABEL[lang][e.sector]} · {TYPE_LABEL[lang][e.type] ?? e.type} · {e.district.split(",")[0]}
                    </p>
                    <span className={`inline-block mt-1 text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${BAND_STYLE[p.riskBand]}`}>
                      {S(p.riskBand)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* ── pulse ── */}
        <section className="space-y-5 min-w-0">
          {/* profile */}
          <div className="rounded-3xl bg-gradient-to-br from-forest to-leaf text-white px-6 py-5 card-elevate">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-display text-2xl font-bold leading-snug">{ent.name}</h2>
                <p className="text-sm text-white/75 mt-0.5">
                  {SECTOR_LABEL[lang][ent.sector]} · {TYPE_LABEL[lang][ent.type] ?? ent.type} · {S("village")} {ent.village}, {ent.district} · {ent.members} {S("membersLabel")} · {S("estd")} {ent.since}
                </p>
              </div>
              <button
                onClick={() => setEntryOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white text-forest text-sm font-bold px-4 py-2.5 hover:bg-lime hover:text-forest transition-colors"
              >
                <Plus className="w-4 h-4" /> {S("addRecord")}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-white/10 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-white/60">{S("riskScore")}</p>
                <p className="font-display text-2xl font-bold">{pulse.riskScore}<span className="text-sm text-white/60">/100</span></p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-white/60">{S("emiCover")}</p>
                <p className="font-display text-2xl font-bold">{pulse.emiCover}×</p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-white/60">{S("runway")}</p>
                <p className="font-display text-2xl font-bold">{pulse.runwayMonths >= 99 ? "∞" : pulse.runwayMonths} <span className="text-sm text-white/60">{S("months")}</span></p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wide text-white/60">{S("lender")} · {S("emi")}</p>
                <p className="font-display text-lg font-bold leading-tight">₹{ent.loan.emi.toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-white/60 truncate">{ent.loan.lender}</p>
              </div>
            </div>
          </div>

          {/* chart */}
          <div className="rounded-3xl bg-surface border border-line card-elevate p-5">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <p className="font-display font-bold text-forest flex items-center gap-2">
                <Activity className="w-5 h-5 text-leaf" /> {S("forecast")} · {S("nextSix")}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-ink-soft">
                <span className="inline-flex items-center gap-1">
                  {pulse.drivers.upiTrend >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-leaf" /> : <TrendingDown className="w-3.5 h-3.5 text-alert" />}
                  {S("upiProxy")} {(pulse.drivers.upiTrend * 100).toFixed(0)}%
                </span>
                <span className="inline-flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-amber" /> {S("mandi")} {pulse.drivers.mandiTrend >= 0 ? "+" : ""}{(pulse.drivers.mandiTrend * 100).toFixed(0)}%
                </span>
                {pulse.drivers.rainStress && (
                  <span className="inline-flex items-center gap-1 text-alert font-semibold">
                    <CloudRain className="w-3.5 h-3.5" /> {S("rain")}
                  </span>
                )}
              </div>
            </div>
            <PulseChart
              history={ent.months}
              forecast={pulse.forecast}
              labels={{ income: S("income"), net: S("netLabel"), forecast: S("forecast") }}
              formatLabel={(lb) => localizeMonthLabel(lang, lb)}
            />
            <p className="text-[10px] text-ink-faint mt-1 text-center">{S("chartNote")}</p>
          </div>
        </section>

        {/* ── risk panel + insight ── */}
        <section className="space-y-5">
          <div className="rounded-3xl bg-surface border border-line card-elevate p-5">
            <p className="font-display font-bold text-forest flex items-center gap-2 mb-3">
              <Siren className="w-5 h-5 text-alert" /> {S("riskPanel")}
            </p>
            {pulse.flags.length === 0 ? (
              <p className="text-sm text-leaf font-semibold py-4 text-center">{S("noAlerts")}</p>
            ) : (
              <div className="space-y-3">
                {pulse.flags.map((f) => {
                  const ft = flagText(lang, f.id, f.params, SECTOR_LABEL[lang][ent.sector]);
                  return (
                  <div key={f.id} className={`rounded-2xl border p-4 ${f.severity === "high" ? "border-alert/50 bg-alert/[0.05]" : f.severity === "medium" ? "border-amber/50 bg-amber/[0.06]" : "border-line bg-bg"}`}>
                    <div className="flex items-start gap-2">
                      <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${f.severity === "high" ? "bg-alert animate-pulse" : f.severity === "medium" ? "bg-amber" : "bg-sprout"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-forest leading-snug">{ft.title}</p>
                        <p className="text-xs text-ink-soft mt-1 leading-relaxed">{ft.detail}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 ml-4">
                      <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-ink-faint mb-1.5">{S("whyFlag")}</p>
                      {f.factors.map((fa) => (
                        <div key={fa.key} className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] text-ink-soft w-44 truncate">{factorName(lang, fa.key)}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
                            <div className={`h-full ${fa.direction === "down" ? "bg-alert/70" : "bg-leaf/70"}`} style={{ width: `${fa.weight}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-ink-faint w-8 text-right">{fa.weight}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* insight */}
          <div className="pulse-card lit rounded-3xl p-5 text-white relative overflow-hidden">
            <div className="pulse-slit mb-4" />
            <div className="flex items-center gap-3 mb-3">
              <DharaOrb size={52} speaking={speaking} />
              <div>
                <p className="font-display font-bold">{S("insight")}</p>
                <p className="text-[11px] text-white/60">{LANGS.find((l) => l.code === lang)?.label} · {S("voiceFirst")}</p>
              </div>
              <button
                onClick={askDhara}
                disabled={insightLoading}
                className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-lime text-forest text-xs font-bold px-3.5 py-2 hover:brightness-110 transition-all disabled:opacity-60"
              >
                <Sparkles className="w-3.5 h-3.5" /> {insightLoading ? "…" : S("askDhara")}
              </button>
            </div>

            {insightLoading && (
              <div className="flex items-center gap-2 text-xs text-white/60 py-3">
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-lime inline-block" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-lime inline-block" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-lime inline-block" />
                {S("liveInsight")}
              </div>
            )}

            {insight && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-sm leading-relaxed text-white/90">{insight.insight}</p>
                {insight.actions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-lime mb-1.5">{S("actions")}</p>
                    <ul className="space-y-1">
                      {insight.actions.map((a, i) => (
                        <li key={i} className="text-sm text-white/85 flex gap-2">
                          <span className="text-lime font-bold">{i + 1}.</span> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2">
                  {!speaking ? (
                    <button onClick={listen} className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 text-white text-xs font-semibold px-3 py-2 hover:bg-white/25 transition-colors">
                      <Volume2 className="w-3.5 h-3.5" /> {S("listen")}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        stopSpeak();
                        setSpeaking(false);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-alert/80 text-white text-xs font-semibold px-3 py-2"
                    >
                      <Square className="w-3.5 h-3.5" /> {S("stop")}
                    </button>
                  )}
                  <span className={`text-[10px] ${insight.live ? "text-lime" : "text-amber"}`}>{insight.live ? S("liveTag") : S("offlineTag")}</span>
                </div>
                {insight.officerNote && (
                  <p className="mt-3 text-[11px] text-white/60 border-t border-white/10 pt-2">
                    <span className="font-bold text-white/80">{S("officerNoteLabel")}:</span> {insight.officerNote}
                  </p>
                )}
              </motion.div>
            )}
            {!insight && !insightLoading && <p className="text-xs text-white/50">{S("standbyHint")}</p>}
          </div>
        </section>
      </div>

      {/* saved toast */}
      <AnimatePresence>
        {savedToast && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-forest text-white px-6 py-3 card-elevate font-semibold text-sm">
            ✓ {S("saved")}
          </motion.div>
        )}
      </AnimatePresence>

      {/* record entry modal — voice-first stepper */}
      <AnimatePresence>
        {entryOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-forest/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }} className="w-full max-w-lg relative">
              <button onClick={() => setEntryOpen(false)} className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-surface border border-line card-elevate" aria-label="Close">
                <X className="w-4 h-4 text-ink-soft" />
              </button>
              <AnimatedStepper
                nextButtonText={t(lang, "review").split(" ")[0]}
                backButtonText={S("back")}
                completeText="✓"
                onFinalStepCompleted={saveEntry}
                canProceed={(step) => (step === 1 ? !!entry.income : step === 2 ? !!entry.expenses : true)}
              >
                <Step title={S("entryIncome")}>
                  <VoiceField
                    value={entry.income}
                    placeholder="₹ 85,000"
                    listening={listening === "income"}
                    onChange={(v) => setEntry((s) => ({ ...s, income: v.replace(/[^0-9]/g, "") }))}
                    onMic={() => voiceFill("income")}
                    hint={S("speakEntry")}
                  />
                </Step>
                <Step title={S("entryExpense")}>
                  <VoiceField
                    value={entry.expenses}
                    placeholder="₹ 62,000"
                    listening={listening === "expenses"}
                    onChange={(v) => setEntry((s) => ({ ...s, expenses: v.replace(/[^0-9]/g, "") }))}
                    onMic={() => voiceFill("expenses")}
                    hint={S("speakEntry")}
                  />
                </Step>
                <Step title={S("review")}>
                  <div className="rounded-2xl bg-bg border border-line p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-ink-faint">{S("income")}</span><span className="font-bold text-forest">₹{parseInt(entry.income || "0").toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span className="text-ink-faint">{S("expenses")}</span><span className="font-bold text-forest">₹{parseInt(entry.expenses || "0").toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between"><span className="text-ink-faint">EMI</span><span className="font-bold text-forest">₹{ent.loan.emi.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between border-t border-line pt-2"><span className="text-ink-faint">Net</span><span className={`font-bold ${parseInt(entry.income || "0") - parseInt(entry.expenses || "0") - ent.loan.emi >= 0 ? "text-leaf" : "text-alert"}`}>₹{(parseInt(entry.income || "0") - parseInt(entry.expenses || "0") - ent.loan.emi).toLocaleString("en-IN")}</span></div>
                  </div>
                  <p className="text-[11px] text-ink-faint mt-2">The pulse, forecast and flags recompute on this device the moment you save.</p>
                </Step>
              </AnimatedStepper>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-[11px] text-ink-faint pb-6 flex items-center justify-center gap-2">
        <Users className="w-3.5 h-3.5" /> DHARA concept demo · NABARD Hackathon GFF 2026 · simulated data · Team Kellton, accelerated on KAI
      </p>
    </main>
  );
}

function VoiceField({
  value,
  onChange,
  onMic,
  listening,
  placeholder,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  onMic: () => void;
  listening: boolean;
  placeholder: string;
  hint: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode="numeric"
          className="flex-1 h-14 px-4 rounded-2xl border border-line bg-bg text-2xl font-display font-bold text-forest outline-none focus:border-sprout transition-colors"
        />
        <button
          onClick={onMic}
          className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${listening ? "bg-alert text-white animate-pulse" : "bg-leaf text-white hover:bg-forest"}`}
          aria-label="Speak"
        >
          <Mic className="w-6 h-6" />
        </button>
      </div>
      <p className="text-[11px] text-ink-faint mt-2">🎙 {hint}</p>
    </div>
  );
}
