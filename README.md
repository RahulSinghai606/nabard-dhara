<div align="center">

# DHARA — Dynamic Health & Risk Analytics

**Dhara means flow. We predict the cash flow 3–6 months ahead — and flag the storms before they hit.**

An offline-first, voice-first cash-flow intelligence platform for rural micro enterprises —
SHGs, FPOs and village entrepreneurs across dairy, poultry, food processing, handicrafts and rural retail.

*NABARD Hackathon @ GFF 2026 · AI-Driven Cash Flow Prediction & Risk Flagging · Team Kellton, accelerated on KAI*

</div>

---

## What actually works here (not a mock-up)

- **On-device forecast engine** (`src/lib/forecast.ts`) — multiplicative seasonal decomposition + robust trend regression + UPI/mandi/weather signal adjustment, computed **in the browser**. The ranked risk list, forecasts, confidence bands and risk scores need **zero network** — that's the offline-first constraint answered honestly, not retrofitted.
- **Simulated dataset generator** (`scripts/generate-data.mjs`) — seeded & reproducible: 8 enterprises × 24 months across all 5 mandated sectors, with realistic seasonality (winter milk flush, festive handicraft peaks…) and injected stress patterns (maize feed-price spike, export-order slump, monsoon deficit, UPI decline). Regenerate anytime: `node scripts/generate-data.mjs`.
- **Explainable Risk Flagger** — every alert ships with SHAP-style factor attribution rendered as plain-language weighted reasons ("Why this flag?"). No black boxes in front of a farmer or a field officer.
- **Multilingual, voice-first** — the entire UI switches between **English, हिन्दी, বাংলা, मराठी, தமிழ்**; the Insight Engine (LLM, server-side) writes advice in the chosen language, and the browser's TTS **reads it aloud**. Voice data entry via on-device ASR where available. Offline → template insights; the forecast math never depends on the LLM.
- **Both mandated interfaces** — field-officer cockpit (`/cockpit`: ranked risk list, profiles, forecast view, risk panel) and enterprise app (`/my`: alerts, actionable steps, big-type phone layout) plus voice-first record entry that **recomputes the pulse live on save**.

## Process flow

```
Enterprise records income/expenses (voice or 3-step form, offline)
  → merges with proxy signals: UPI trends · mandi/commodity prices · rainfall anomaly
    → Enterprise Pulse (financial twin) updates
      → sector-aware Forecast Engine: 3–6 month cash flows + 80% confidence band   [on-device]
        → Risk Flagger: climate / market / repayment stress with factor attribution [on-device]
          → Insight Engine: plain-language, voice-first advice in 5 languages       [LLM, offline fallback]
            → Officer cockpit: ranked risks, profiles, forecasts, risk panel
              → interventions & outcomes flow back into the pulse
```

## Built for Bharat — constraints as design principles

| Hackathon constraint | How DHARA answers it |
|---|---|
| Mock/simulated datasets | Seeded generator committed in-repo, reproducible |
| Works offline / low network | Forecast + risk engine run fully on-device; LLM optional with fallbacks |
| No sensitive PII | Aggregated, consented proxies only — UPI *trends*, never personal transactions |
| Multilingual (optional) | Treated as core: 5-language UI + spoken insights + voice entry |

## Run it

```bash
npm install
node scripts/generate-data.mjs   # regenerate the simulated dataset (optional — committed)
cp .env.example .env.local        # Azure AI Foundry creds (only for live multilingual insights)
npm run dev                       # http://localhost:3000
```

## Key files

| Layer | Where |
|---|---|
| Dataset generator (simulated, seeded) | `scripts/generate-data.mjs` → `src/data/enterprises.json` |
| On-device forecast + risk engine | `src/lib/forecast.ts` |
| 5-language UI strings + TTS locales | `src/lib/i18n.ts` |
| Voice (TTS/ASR helpers) | `src/lib/voice.ts` |
| Insight Engine API (LLM + offline fallback) | `src/app/api/insight/route.ts` |
| Officer cockpit / Enterprise app | `src/app/cockpit/page.tsx` · `src/app/my/page.tsx` |
| Pulse chart (pure SVG) | `src/components/PulseChart.tsx` |

**Stack:** Next.js 16 · TypeScript · Tailwind v4 · GSAP · Framer Motion · Web Speech (TTS/ASR, Bhashini-aligned path in production) · Azure AI Foundry (server-side, optional)

---

*Prototype on fully simulated data per hackathon rules · projected impact figures to be validated in pilot.*
