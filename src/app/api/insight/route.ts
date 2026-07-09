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
 "officerNote": string (1-2 sentences FOR THE FIELD OFFICER, also in ${LANG_NAME[lang] ?? "simple English"}: suggested intervention + urgency)
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

  // Offline / fallback templates — all 5 languages
  const stressed = pulse.riskScore >= 45;
  const F: Record<string, { insight: string; actions: string[]; officerNote: string }> = {
    en: stressed
      ? { insight: "The next few months may see expenses higher than income. Input costs are up and the season is lean. Small steps now can prevent bigger trouble. You are not alone — your field officer can help.",
          actions: ["Talk to your lender about EMI rescheduling this week", "Postpone large purchases for 2 months", "Record daily sales on UPI"],
          officerNote: "Schedule a visit this week; discuss EMI restructuring and input-cost mitigation." }
      : { insight: "Your cash flow looks steady. Keep building a small reserve for the lean season. Well done!",
          actions: ["Add a little extra to savings weekly", "Plan next season's stock now", "Take all payments on UPI"],
          officerNote: "Routine monitoring; enterprise on track." },
    hi: stressed
      ? { insight: "अगले महीनों में खर्च आय से ज़्यादा रह सकता है। लागत बढ़ी है और सीज़न भी धीमा है। अभी छोटे कदम उठाने से बड़ा नुकसान रुक सकता है। आप अकेले नहीं हैं — फ़ील्ड अधिकारी मदद के लिए तैयार हैं।",
          actions: ["इस हफ़्ते ऋणदाता से EMI पुनर्निर्धारण पर बात करें", "बड़े खर्च 2 महीने के लिए टालें", "रोज़ की बिक्री UPI पर दर्ज करें"],
          officerNote: "इस हफ़्ते भेंट तय करें; EMI पुनर्गठन और लागत घटाने पर चर्चा करें।" }
      : { insight: "आपका नकदी-प्रवाह ठीक चल रहा है। आने वाले सीज़न के लिए थोड़ी बचत बढ़ाते रहें। बढ़िया काम!",
          actions: ["हर हफ़्ते बचत में थोड़ा और डालें", "अगले सीज़न का स्टॉक अभी से प्लान करें", "सभी बिक्री UPI पर लें"],
          officerNote: "नियमित निगरानी; उद्यम सही राह पर है।" },
    bn: stressed
      ? { insight: "আগামী মাসগুলিতে খরচ আয়ের চেয়ে বেশি হতে পারে। কাঁচামালের দাম বেড়েছে, মৌসুমও মন্দা। এখনই ছোট পদক্ষেপ নিলে বড় ক্ষতি আটকানো যাবে। আপনি একা নন — ফিল্ড অফিসার সাহায্যের জন্য আছেন।",
          actions: ["এই সপ্তাহে ব্যাংকের সাথে EMI পুনর্বিন্যাস নিয়ে কথা বলুন", "বড় খরচ ২ মাস পিছিয়ে দিন", "প্রতিদিনের বিক্রি UPI-তে নথিভুক্ত করুন"],
          officerNote: "এই সপ্তাহে পরিদর্শন করুন; EMI পুনর্গঠন ও খরচ কমানো নিয়ে আলোচনা করুন।" }
      : { insight: "আপনার নগদ-প্রবাহ ঠিক আছে। মন্দা মৌসুমের জন্য একটু একটু সঞ্চয় বাড়াতে থাকুন। খুব ভালো!",
          actions: ["প্রতি সপ্তাহে সঞ্চয়ে একটু বেশি রাখুন", "আগামী মৌসুমের স্টক এখনই পরিকল্পনা করুন", "সব বিক্রি UPI-তে নিন"],
          officerNote: "নিয়মিত নজরদারি; উদ্যোগ সঠিক পথে।" },
    mr: stressed
      ? { insight: "पुढील महिन्यांत खर्च उत्पन्नापेक्षा जास्त राहू शकतो. कच्च्या मालाचे भाव वाढले आहेत आणि हंगामही मंद आहे. आत्ताच छोटी पावले उचलल्यास मोठे नुकसान टळू शकते. तुम्ही एकटे नाही — फील्ड अधिकारी मदतीसाठी आहेत.",
          actions: ["या आठवड्यात बँकेशी EMI पुनर्रचनेबद्दल बोला", "मोठे खर्च २ महिने पुढे ढकला", "रोजची विक्री UPI वर नोंदवा"],
          officerNote: "या आठवड्यात भेट ठरवा; EMI पुनर्रचना व खर्च कपातीवर चर्चा करा." }
      : { insight: "तुमचा रोख-प्रवाह व्यवस्थित आहे. मंद हंगामासाठी थोडी थोडी बचत वाढवत राहा. छान काम!",
          actions: ["दर आठवड्याला बचतीत थोडे जास्त टाका", "पुढील हंगामाचा माल आत्ताच नियोजित करा", "सर्व विक्री UPI वर घ्या"],
          officerNote: "नियमित देखरेख; उद्योग योग्य मार्गावर." },
    ta: stressed
      ? { insight: "அடுத்த மாதங்களில் செலவு வருமானத்தை விட அதிகமாக இருக்கலாம். மூலப்பொருள் விலை உயர்ந்துள்ளது, பருவமும் மந்தமாக உள்ளது. இப்போதே சிறு நடவடிக்கைகள் எடுத்தால் பெரிய இழப்பைத் தடுக்கலாம். நீங்கள் தனியாக இல்லை — கள அலுவலர் உதவ தயார்.",
          actions: ["இந்த வாரம் வங்கியிடம் EMI மறுசீரமைப்பு பற்றி பேசுங்கள்", "பெரிய செலவுகளை 2 மாதம் தள்ளிவையுங்கள்", "தினசரி விற்பனையை UPI-யில் பதிவு செய்யுங்கள்"],
          officerNote: "இந்த வாரம் விஜயம் திட்டமிடுங்கள்; EMI மறுசீரமைப்பு மற்றும் செலவு குறைப்பு குறித்து விவாதியுங்கள்." }
      : { insight: "உங்கள் பணப்புழக்கம் சீராக உள்ளது. மந்தமான பருவத்திற்காக சிறிது சிறிதாக சேமிப்பை வளர்த்துக் கொள்ளுங்கள். நல்ல முயற்சி!",
          actions: ["ஒவ்வொரு வாரமும் சேமிப்பில் கொஞ்சம் கூடுதலாக போடுங்கள்", "அடுத்த பருவ சரக்கை இப்போதே திட்டமிடுங்கள்", "எல்லா விற்பனையும் UPI-யில் பெறுங்கள்"],
          officerNote: "வழக்கமான கண்காணிப்பு; நிறுவனம் சரியான பாதையில்." },
  };
  const fallback = F[lang] ?? F.en;
  return NextResponse.json({ ...fallback, live: false });
}
