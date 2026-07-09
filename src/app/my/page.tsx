"use client";

// DHARA — Enterprise app ("My Enterprise")
// The view a SHG treasurer or entrepreneur sees on a low-end phone:
// big type, one screen, voice-first, in her language. All pulse math on-device.

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Volume2, Square, Sparkles, WifiOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import raw from "@/data/enterprises.json";
import { computePulse, Enterprise } from "@/lib/forecast";
import { Lang, LANGS, t, ttsLocale, SECTOR_LABEL } from "@/lib/i18n";
import { speak, stopSpeak } from "@/lib/voice";
import DharaOrb from "@/components/DharaOrb";

type Insight = { insight: string; actions: string[]; live: boolean };

export default function MyEnterprise() {
  const [lang, setLang] = useState<Lang>("hi");
  const data = raw as unknown as Enterprise[];
  const [id, setId] = useState("bhuj-craft");
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const ent = data.find((e) => e.id === id)!;
  const pulse = useMemo(() => computePulse(ent), [ent]);
  const S = (k: string) => t(lang, k);

  const ask = async () => {
    setLoading(true);
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
            flags: pulse.flags.map((f) => ({ title: f.title, detail: f.detail })),
            forecast: pulse.forecast.map((f) => ({ label: f.label, net: f.net })),
            drivers: pulse.drivers,
          },
        }),
      });
      const d = await res.json();
      setInsight(d);
      // auto-speak — voice-first by default
      setSpeaking(true);
      const ok = speak(`${d.insight} ${d.actions.join(". ")}`, ttsLocale(lang), () => setSpeaking(false));
      if (!ok) setSpeaking(false);
    } catch {
      setInsight({ insight: S("offline"), actions: [], live: false });
    }
    setLoading(false);
  };

  const bandColor = pulse.riskBand === "healthy" ? "text-leaf" : pulse.riskBand === "watch" ? "text-amber" : "text-alert";

  return (
    <main className="min-h-screen field-bg noise flex flex-col items-center py-6 px-4">
      {/* top */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <Link href="/" className="p-2 rounded-lg hover:bg-white transition-colors" aria-label="Back">
          <ArrowLeft className="w-4 h-4 text-ink-soft" />
        </Link>
        <div className="flex gap-1 rounded-xl bg-white/70 p-1">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setInsight(null);
                stopSpeak();
                setSpeaking(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${lang === l.code ? "bg-leaf text-white" : "text-ink-soft"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <Image src="/nabard-logo.png" alt="NABARD" width={44} height={30} className="h-7 w-auto rounded" />
      </div>

      {/* phone frame */}
      <div className="w-full max-w-md rounded-[2.4rem] bg-surface border border-line card-elevate overflow-hidden">
        <div className="bg-gradient-to-br from-forest to-leaf text-white px-6 pt-6 pb-5 text-center">
          <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-lime mb-1">{S("enterpriseView")}</p>
          <select
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setInsight(null);
              stopSpeak();
            }}
            className="bg-transparent font-display text-xl font-bold text-white text-center outline-none w-full [&>option]:text-forest"
          >
            {data.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <p className="text-xs text-white/70 mt-1">{SECTOR_LABEL[lang][ent.sector]} · {ent.village}, {ent.district.split(",")[0]}</p>

          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="font-display text-3xl font-bold">₹{Math.round(ent.months[ent.months.length - 1].savings / 1000)}k</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60">{S("savings")}</p>
            </div>
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff30" strokeWidth="11" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={pulse.riskScore >= 45 ? "#ffb4a0" : "#baf7d0"}
                  strokeWidth="11" strokeLinecap="round"
                  strokeDasharray={251} strokeDashoffset={251 - (251 * (100 - pulse.riskScore)) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-bold">{100 - pulse.riskScore}</span>
                <span className="text-[8px] uppercase tracking-wide text-white/60">health</span>
              </div>
            </div>
            <div className="text-center">
              <p className={`font-display text-2xl font-bold`}>{pulse.emiCover}×</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60">{S("emiCover")}</p>
            </div>
          </div>
          <p className={`mt-2 font-display font-bold ${pulse.riskBand === "healthy" ? "text-lime" : pulse.riskBand === "watch" ? "text-amber" : "text-[#ffb4a0]"}`}>
            {S(pulse.riskBand)}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* alerts */}
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-ink-faint mb-2">{S("alerts")}</p>
            {pulse.flags.length === 0 ? (
              <p className="text-sm text-leaf font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {S("noAlerts")}
              </p>
            ) : (
              <div className="space-y-2">
                {pulse.flags.slice(0, 3).map((f) => (
                  <div key={f.id} className={`flex items-start gap-2.5 rounded-2xl p-3 ${f.severity === "high" ? "bg-alert/[0.07] border border-alert/30" : "bg-amber/[0.08] border border-amber/30"}`}>
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${f.severity === "high" ? "text-alert" : "text-amber"}`} />
                    <p className="text-[13px] text-ink leading-snug font-medium">{f.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DHARA speaks */}
          <div className="pulse-card lit rounded-3xl p-5 text-white text-center">
            <div className="pulse-slit mb-4" />
            <div className="flex justify-center"><DharaOrb size={84} speaking={speaking} /></div>
            {!insight && !loading && (
              <button onClick={ask} className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-lime text-forest font-bold px-6 py-3.5 hover:brightness-110 transition-all text-base">
                <Sparkles className="w-5 h-5" /> {S("insight")}
              </button>
            )}
            {loading && (
              <div className="flex items-center justify-center gap-2 text-xs text-white/60 py-4">
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-lime inline-block" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-lime inline-block" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-lime inline-block" />
                {S("liveInsight")}
              </div>
            )}
            {insight && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-left">
                <p className="text-[15px] leading-relaxed text-white/95">{insight.insight}</p>
                {insight.actions.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {insight.actions.map((a, i) => (
                      <li key={i} className="text-sm text-white/85 flex gap-2">
                        <span className="text-lime font-bold shrink-0">{i + 1}.</span> {a}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex justify-center">
                  {!speaking ? (
                    <button
                      onClick={() => {
                        setSpeaking(true);
                        const ok = speak(`${insight.insight} ${insight.actions.join(". ")}`, ttsLocale(lang), () => setSpeaking(false));
                        if (!ok) setSpeaking(false);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-white/15 text-white text-sm font-semibold px-5 py-2.5 hover:bg-white/25 transition-colors"
                    >
                      <Volume2 className="w-4 h-4" /> {S("listen")}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        stopSpeak();
                        setSpeaking(false);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-alert/80 text-white text-sm font-semibold px-5 py-2.5"
                    >
                      <Square className="w-4 h-4" /> {S("stop")}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          <p className="text-center text-[10px] text-ink-faint flex items-center justify-center gap-1.5">
            <WifiOff className="w-3 h-3" /> {S("offline")}
          </p>
        </div>
      </div>
    </main>
  );
}
