import { NextRequest, NextResponse } from "next/server";
import { reason, extractJson } from "@/lib/reasoning";

export const maxDuration = 60;

// Insight Engine: turns the on-device forecast + risk flags into plain-language,
// voice-ready advice in the user's language. The FORECAST MATH never depends on
// this — offline, the app falls back to template insights. This endpoint only
// makes the explanation more human.

const LANG_NAME: Record<string, string> = {
  en: "simple English",
  hi: "simple Hindi (Devanagari script)",
  bn: "simple Bengali (Bengali script)",
  mr: "simple Marathi (Devanagari script)",
  ta: "simple Tamil (Tamil script)",
};

export async function POST(req: NextRequest) {
  const { lang, enterprise, pulse } = (await req.json()) as {
    lang: string;
    enterprise: { name: string; sector: string; type: string; district: string; loan: { emi: number; lender: string } };
    pulse: {
      riskScore: number;
      riskBand: string;
      runwayMonths: number;
      emiCover: number;
      flags: { title: string; detail: string }[];
      forecast: { label: string; net: number }[];
      drivers: { upiTrend: number; mandiTrend: number; rainStress: boolean };
    };
  };

  const system = `You are DHARA, NABARD's cash-flow coach for rural micro enterprises (built by Kellton). You speak like a trusted, practical village advisor — warm, concrete, zero jargon. Numbers in Indian style (₹, lakhs).
Write in ${LANG_NAME[lang] ?? "simple English"}. Keep sentences short — they will be READ ALOUD by text-to-speech to users who may not read well.

Respond STRICT JSON only:
{
 "insight": string (3-5 short sentences: what the forecast says, why the flags exist in plain cause-effect words, and encouragement — voice-friendly),
 "actions": [string, string, string] (3 concrete, doable-this-week actions, each under 15 words, most impactful first),
 "officerNote": string (1-2 sentences FOR THE FIELD OFFICER in English: suggested intervention + urgency)
}`;

  const user = `Enterprise: ${enterprise.name} (${enterprise.type}, ${enterprise.sector}, ${enterprise.district}). EMI ₹${enterprise.loan.emi}/month to ${enterprise.loan.lender}.
Risk: ${pulse.riskBand} (score ${pulse.riskScore}/100). Reserve runway ${pulse.runwayMonths} months. EMI cover ${pulse.emiCover}×.
Flags:\n${pulse.flags.map((f) => `- ${f.title}: ${f.detail}`).join("\n") || "- none"}
6-month net cash flow forecast: ${pulse.forecast.map((f) => `${f.label}: ₹${f.net}`).join(", ")}
Signals: UPI trend ${(pulse.drivers.upiTrend * 100).toFixed(0)}%, input price trend ${(pulse.drivers.mandiTrend * 100).toFixed(0)}%, monsoon stress: ${pulse.drivers.rainStress}.

Return the JSON.`;

  const raw = await reason({ system, user, maxTokens: 900 });
  if (raw) {
    const parsed = extractJson<{ insight: string; actions: string[]; officerNote: string }>(raw);
    if (parsed?.insight && parsed?.actions?.length) {
      return NextResponse.json({ ...parsed, live: true });
    }
  }

  // Offline / fallback templates (en + hi)
  const stressed = pulse.riskScore >= 45;
  const fallback =
    lang === "hi"
      ? {
          insight: stressed
            ? "अगले महीनों में खर्च आय से ज़्यादा रह सकता है। लागत बढ़ी है और सीज़न भी धीमा है। अभी छोटे कदम उठाने से बड़ा नुकसान रुक सकता है। आप अकेले नहीं हैं — फ़ील्ड अधिकारी मदद के लिए तैयार हैं।"
            : "आपका नकदी-प्रवाह ठीक चल रहा है। आने वाले सीज़न के लिए थोड़ी बचत बढ़ाते रहें। बढ़िया काम!",
          actions: stressed
            ? ["इस हफ़्ते ऋणदाता से EMI पुनर्निर्धारण पर बात करें", "बड़े खर्च 2 महीने के लिए टालें", "रोज़ की बिक्री UPI पर दर्ज करें"]
            : ["हर हफ़्ते बचत में थोड़ा और डालें", "अगले सीज़न का स्टॉक अभी से प्लान करें", "सभी बिक्री UPI पर लें"],
          officerNote: stressed ? "Schedule a visit this week; discuss EMI restructuring and input-cost mitigation." : "Routine monitoring; enterprise on track.",
        }
      : {
          insight: stressed
            ? "The next few months may see expenses higher than income. Input costs are up and the season is lean. Small steps now can prevent bigger trouble. You are not alone — your field officer can help."
            : "Your cash flow looks steady. Keep building a small reserve for the lean season. Well done!",
          actions: stressed
            ? ["Talk to your lender about EMI rescheduling this week", "Postpone large purchases for 2 months", "Record daily sales on UPI"]
            : ["Add a little extra to savings weekly", "Plan next season's stock now", "Take all payments on UPI"],
          officerNote: stressed ? "Schedule a visit this week; discuss EMI restructuring and input-cost mitigation." : "Routine monitoring; enterprise on track.",
        };
  return NextResponse.json({ ...fallback, live: false });
}
