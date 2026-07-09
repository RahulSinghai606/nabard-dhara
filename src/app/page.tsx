"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  PlayCircle,
  Activity,
  BrainCircuit,
  Siren,
  MessagesSquare,
  WifiOff,
  Languages,
  ShieldCheck,
  Database,
  TrendingUp,
  Users,
  Landmark,
  HandCoins,
  Sprout,
} from "lucide-react";
import DharaOrb from "@/components/DharaOrb";
import FlowingMenu from "@/components/FlowingMenu";
import ExpandImage from "@/components/ExpandImage";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const ENGINE = [
  { Icon: Activity, name: "Enterprise Pulse", desc: "A living financial twin per SHG/FPO/entrepreneur — ledgers, UPI proxies, mandi prices, weather and crop signals in one heartbeat." },
  { Icon: BrainCircuit, name: "Sector-aware Forecast", desc: "Dedicated seasonality models for dairy, poultry, food processing, handicrafts and rural retail — 3–6 months ahead, with confidence bands." },
  { Icon: Siren, name: "Explainable Risk Flagger", desc: "Every alert carries its reasons as weighted factors — no black boxes in front of a farmer or a field officer." },
  { Icon: MessagesSquare, name: "Insight Engine", desc: "Plain-language, voice-first advice in the enterprise's own language — read aloud, not read out of reach." },
];

const BHARAT = [
  { Icon: WifiOff, title: "Offline-first", desc: "Forecast engine runs on-device in the browser — no network needed to compute the pulse" },
  { Icon: Languages, title: "5 languages, voice-first", desc: "Full UI + spoken insights in English, हिन्दी, বাংলা, मराठी, தமிழ்" },
  { Icon: ShieldCheck, title: "No sensitive PII", desc: "Aggregated, consented proxies only — UPI trends, never transactions of persons" },
  { Icon: Database, title: "Simulated datasets", desc: "Reproducible generator committed in-repo, per hackathon rules" },
];

const IMPACT = [
  { Icon: TrendingUp, big: "3–6 mo", label: "Forecast horizon", sub: "cash flows predicted ahead — storms flagged before they hit" },
  { Icon: Siren, big: "8–12 wks", label: "Earlier stress detection", sub: "vs. manual quarterly reviews — interventions before default" },
  { Icon: Users, big: "1 Cr+", label: "SHGs addressable", sub: "through NABARD's network, plus a fast-growing FPO base" },
  { Icon: Landmark, big: "DPG", label: "Digital public good", sub: "licensing to banks, RRBs & MFIs for appraisal and early warning" },
  { Icon: HandCoins, big: "Score", label: "Rural Cash-Flow Score", sub: "bankable evidence converting grant beneficiaries into credit customers" },
  { Icon: Sprout, big: "5", label: "Sector models", sub: "dairy · poultry · food processing · handicrafts · rural retail" },
];

export default function Home() {
  const [orbSpeaking, setOrbSpeaking] = useState(false);

  return (
    <main className="relative">
      {/* nav */}
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-4">
          <nav className="glass card-elevate rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/kellton-logo.jpg" alt="Kellton" width={92} height={26} className="h-6 w-auto rounded" />
              <span className="hidden sm:block h-5 w-px bg-line" />
              <span className="font-display font-bold text-forest tracking-tight text-lg">
                DHARA<span className="text-sprout">.</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-ink-soft">
              <a href="#engine" className="hover:text-leaf transition-colors">The engine</a>
              <a href="#sectors" className="hover:text-leaf transition-colors">Sectors</a>
              <a href="#impact" className="hover:text-leaf transition-colors">Impact</a>
            </div>
            <div className="flex items-center gap-3">
              <Image src="/nabard-logo.png" alt="NABARD" width={64} height={40} className="h-9 w-auto rounded" />
              <Link href="/cockpit" className="inline-flex items-center gap-1.5 rounded-xl bg-leaf text-white text-sm font-semibold px-4 py-2 hover:bg-forest transition-colors">
                <Activity className="w-4 h-4" /> Live demo
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* hero */}
      <section className="relative min-h-screen field-bg noise overflow-hidden flex items-center">
        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-24 grid lg:grid-cols-[1.15fr_0.85fr] gap-14 items-center">
          <div>
            <motion.div {...fadeUp} className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold tracking-wide text-leaf mb-7">
              <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
              NABARD HACKATHON · GFF 2026 · CASH-FLOW PREDICTION &amp; RISK FLAGGING
            </motion.div>
            <motion.h1 {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }} className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.04] tracking-tight text-forest">
              See the storm
              <br />
              <span className="text-gradient">before it hits.</span>
            </motion.h1>
            <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.16 }} className="mt-7 max-w-xl text-lg text-ink-soft leading-relaxed">
              <strong className="text-forest">DHARA</strong>
              {" — dhara means flow — builds a living Enterprise Pulse for every SHG, FPO and rural entrepreneur, forecasts cash flow "}
              <strong className="text-forest">3–6 months ahead</strong>
              {", and flags financial stress early — with reasons a farmer can hear, in a language she speaks."}
            </motion.p>
            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.24 }} className="mt-9 flex flex-wrap gap-4">
              <Link href="/cockpit" className="group inline-flex items-center gap-2 rounded-2xl bg-leaf text-white font-semibold px-7 py-4 card-elevate hover:bg-forest transition-all hover:-translate-y-0.5">
                <PlayCircle className="w-5 h-5" /> Open the officer cockpit
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/my" className="inline-flex items-center gap-2 rounded-2xl glass font-semibold text-forest px-7 py-4 hover:bg-white transition-colors">
                <Users className="w-5 h-5" /> Enterprise app
              </Link>
            </motion.div>
            <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }} className="mt-6 text-xs text-ink-faint">
              Forecasts computed on this device · works offline · no sensitive personal data
            </motion.p>
          </div>

          {/* DHARA avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative hidden lg:flex flex-col items-center gap-6"
            onMouseEnter={() => setOrbSpeaking(true)}
            onMouseLeave={() => setOrbSpeaking(false)}
          >
            <DharaOrb size={230} speaking={orbSpeaking} />
            <div className="text-center max-w-xs">
              <p className="font-display text-lg font-bold text-forest">Meet DHARA</p>
              <p className="text-sm text-ink-soft mt-1">
                Your voice-first cash-flow companion. She reads the pulse, explains the risk, and speaks your language — literally.
              </p>
            </div>
          </motion.div>
        </div>

        {/* ticker */}
        <div className="absolute bottom-0 inset-x-0 border-t border-line/70 bg-white/60 backdrop-blur-md py-3 overflow-hidden">
          <div className="flex gap-12 whitespace-nowrap animate-ticker w-max">
            {[
              "Enterprise Pulse · living financial twin",
              "3–6 month forecasts · confidence bands",
              "Explainable risk flags · factor attribution",
              "5 languages · voice-first",
              "Offline-first · on-device inference",
              "No sensitive PII · consented proxies",
              "Built on simulated datasets · reproducible",
            ]
              .concat([
                "Enterprise Pulse · living financial twin",
                "3–6 month forecasts · confidence bands",
                "Explainable risk flags · factor attribution",
                "5 languages · voice-first",
                "Offline-first · on-device inference",
                "No sensitive PII · consented proxies",
                "Built on simulated datasets · reproducible",
              ])
              .map((t, i) => (
                <span key={i} className="text-xs font-semibold tracking-[0.16em] uppercase text-ink-soft flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime" /> {t}
                </span>
              ))}
          </div>
        </div>
      </section>

      {/* full-screen image expansion */}
      <ExpandImage
        src="/field-rice.jpg"
        kicker="The last mile, first"
        title={<>Keep scrolling — <span className="text-gradient">into the field</span></>}
        overlayTitle="Millions of rural enterprises run on instinct. DHARA gives them foresight."
        overlaySub="SHGs, FPOs and village entrepreneurs — thin files, thick potential. Their cash flow already speaks through ledgers, UPI trends, mandi prices and monsoons. DHARA listens."
      />

      {/* engine */}
      <section id="engine" className="relative py-28 bg-surface">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-sprout mb-4">The engine</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-forest">
              Pulse → Forecast → <span className="text-gradient">Flag → Act</span>
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ENGINE.map((a, i) => (
              <motion.div key={a.name} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.06 }} className="rounded-3xl border border-line bg-bg p-7 card-elevate hover:-translate-y-1 transition-transform">
                <a.Icon className="w-7 h-7 text-leaf mb-4" strokeWidth={1.7} />
                <h3 className="font-display text-lg font-bold text-forest">{a.name}</h3>
                <p className="text-sm text-ink-soft mt-2 leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Built for Bharat strip */}
          <motion.div {...fadeUp} className="mt-10 rounded-3xl bg-gradient-to-br from-forest to-leaf p-8 sm:p-10 text-white card-elevate">
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-lime mb-6">Built for Bharat — design principles, not afterthoughts</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {BHARAT.map((b) => (
                <div key={b.title} className="flex gap-3">
                  <b.Icon className="w-6 h-6 text-lime shrink-0" strokeWidth={1.8} />
                  <div>
                    <p className="font-display font-bold">{b.title}</p>
                    <p className="text-sm text-white/75 leading-relaxed mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* sectors — flowing menu */}
      <section id="sectors" className="relative py-24 field-bg noise">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-sprout mb-4">Sector-aware, not one-size-fits-all</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-forest">
              Five sectors, <span className="text-gradient">five heartbeats</span>
            </h2>
            <p className="mt-4 text-ink-soft">Hover a sector — every one carries its own seasonality model. Winter flush ≠ festive rush ≠ tourist season.</p>
          </motion.div>
          <motion.div {...fadeUp} className="h-[480px] rounded-3xl overflow-hidden border border-line card-elevate">
            <FlowingMenu
              items={[
                { text: "Dairy", sub: "winter flush · fodder cost", image: "/field-hills.jpg" },
                { text: "Poultry", sub: "feed-price exposed · heat dips", image: "/field-market.jpg" },
                { text: "Food Processing", sub: "post-harvest · festive peaks", image: "/field-rice.jpg" },
                { text: "Handicrafts", sub: "festive & tourist season", image: "/field-market.jpg" },
                { text: "Rural Retail", sub: "thin margins · UPI heavy", image: "/field-hills.jpg" },
              ]}
            />
          </motion.div>
        </div>
      </section>

      {/* impact */}
      <section id="impact" className="relative py-28 bg-surface">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-sprout mb-4">Value for NABARD</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-forest">
              From grant beneficiaries to <span className="text-gradient">credit customers</span>
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {IMPACT.map((s, i) => (
              <motion.div key={s.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }} className="rounded-3xl border border-line bg-bg p-8 card-elevate hover:-translate-y-1 transition-transform">
                <s.Icon className="w-7 h-7 text-leaf mb-5" strokeWidth={1.7} />
                <p className="font-display text-3xl font-bold text-forest">{s.big}</p>
                <p className="font-semibold text-leaf mt-1">{s.label}</p>
                <p className="text-sm text-ink-soft mt-2 leading-relaxed">{s.sub}</p>
              </motion.div>
            ))}
          </div>
          <motion.p {...fadeUp} className="mt-8 text-center text-xs text-ink-faint">
            Projected targets · prototype on simulated data per hackathon rules
          </motion.p>
        </div>
      </section>

      {/* CTA + footer */}
      <section className="relative py-24 field-bg noise">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.h2 {...fadeUp} className="font-display text-4xl md:text-6xl font-bold text-forest leading-tight">
            &ldquo;Cash flow is a river. <span className="text-gradient">DHARA reads the current.</span>&rdquo;
          </motion.h2>
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="mt-10">
            <Link href="/cockpit" className="group inline-flex items-center gap-2 rounded-2xl bg-leaf text-white font-semibold px-9 py-5 text-lg card-elevate hover:bg-forest transition-all hover:-translate-y-0.5">
              Forecast a real enterprise, live <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
        <footer className="mt-20 border-t border-line/70">
          <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Image src="/kellton-logo.jpg" alt="Kellton" width={100} height={28} className="h-6 w-auto rounded" />
              <span className="h-5 w-px bg-line" />
              <Image src="/nabard-logo.png" alt="NABARD" width={56} height={36} className="h-8 w-auto rounded" />
              <span className="font-display font-bold text-forest">DHARA</span>
            </div>
            <p className="text-xs text-ink-faint text-center md:text-right max-w-md">
              NABARD Hackathon @ GFF 2026 · Team Kellton, accelerated on KAI. All enterprises &amp; data simulated · no sensitive personal data.
            </p>
          </div>
        </footer>
      </section>
    </main>
  );
}
