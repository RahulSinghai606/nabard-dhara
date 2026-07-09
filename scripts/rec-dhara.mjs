// DHARA demo recording (~2:30)
import { chromium } from "playwright";
import { sleep, caption, smoothScroll, titleCard, endCard, clickBtn } from "./helpers.mjs";

const BASE = "http://localhost:3070";
const OUT = "/private/tmp/claude-502/-Users-rahul-singh-Downloads-Hackathon/63f53a63-53ab-4217-835a-809cc46bc0cb/scratchpad/vid-dhara";
const NAVY = "#0e5132";
const fieldBg = "radial-gradient(1100px 600px at 82% -12%, rgba(127,201,63,.16), transparent 60%), radial-gradient(900px 520px at -8% 30%, rgba(30,125,70,.1), transparent 55%), #f6faf4";

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } } });
  const page = await ctx.newPage();

  // title
  await page.setContent(`
    <body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:${fieldBg};font-family:system-ui,-apple-system,sans-serif;">
      <div style="text-align:center">
        <div style="font-size:15px;letter-spacing:.35em;color:#35a869;font-weight:700;margin-bottom:22px">NABARD HACKATHON · GFF 2026 · TEAM KELLTON</div>
        <div style="font-size:100px;font-weight:800;color:#0e5132;letter-spacing:-.03em;line-height:1">DHARA<span style="color:#7fc93f">.</span></div>
        <div style="font-size:26px;color:#3f5c49;margin-top:26px;font-weight:600">Dynamic Health &amp; Risk Analytics — dhara means flow</div>
        <div style="font-size:17px;color:#7d977f;margin-top:14px">Cash flow, 3–6 months ahead · offline-first · voice-first · 5 languages</div>
      </div>
    </body>`);
  await sleep(5000);

  // hero
  await page.goto(`${BASE}/`, { waitUntil: "load" }); await sleep(1500);
  await caption(page, "Millions of rural enterprises run on instinct. DHARA gives them foresight.", "A living Enterprise Pulse per SHG, FPO and entrepreneur", NAVY);
  await sleep(6000);

  // image expansion
  const xiTop = await page.evaluate(() => document.querySelector(".xi-caption")?.closest(".relative")?.getBoundingClientRect().top + window.scrollY || 900);
  await caption(page, "Keep scrolling — into the field", "The last mile first: offline, voice, no-PII by design", NAVY);
  await smoothScroll(page, xiTop, 1500);
  await sleep(400);
  await smoothScroll(page, xiTop + 1250, 6500);
  await sleep(4000);

  // engine + bharat strip
  const engineTop = await page.evaluate(() => document.getElementById("engine").getBoundingClientRect().top + window.scrollY);
  await caption(page, "Pulse → Forecast → Flag → Act", "Sector-aware models · explainable flags · Built-for-Bharat principles", NAVY);
  await smoothScroll(page, engineTop - 30, 2600);
  await sleep(6000);

  // sectors flowing menu
  const secTop = await page.evaluate(() => document.getElementById("sectors").getBoundingClientRect().top + window.scrollY);
  await caption(page, "Five sectors, five heartbeats", "Winter milk flush ≠ festive handicraft rush — each has its own model", NAVY);
  await smoothScroll(page, secTop + 60, 2200);
  await sleep(600);
  // hover the sector rows to trigger marquees
  const menuBox = await page.evaluate(() => {
    const nav = document.querySelector("#sectors nav");
    const r = nav.getBoundingClientRect();
    return { x: r.left, y: r.top, h: r.height, w: r.width };
  });
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(menuBox.x + menuBox.w / 2, menuBox.y + menuBox.h * (0.1 + i * 0.2), { steps: 12 });
    await sleep(1400);
  }
  await sleep(600);

  // cockpit
  await caption(page, "", "", NAVY);
  await page.goto(`${BASE}/cockpit`, { waitUntil: "load" });
  await caption(page, "The Field Officer Cockpit — every number computed ON this device", "Ranked risk list from the on-device forecast engine · works offline", NAVY);
  await sleep(6500);

  await caption(page, "Sundarban Poultry FPO: risk 88 — critical", "Maize feed-price spike caught by the mandi signal, months before default", NAVY);
  await sleep(6000);
  await caption(page, "Every flag explains itself — weighted factors, no black box", "EMI cover 0.26× · negative months flagged on the forecast band", NAVY);
  await sleep(6000);

  // switch to Hindi
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "हिन्दी"); b?.click(); });
  await caption(page, "One tap — the whole cockpit speaks Hindi", "5 languages: English · हिन्दी · বাংলা · मराठी · தமிழ்", NAVY);
  await sleep(5500);

  // ask dhara
  await clickBtn(page, "Ask DHARA");
  await caption(page, "Ask DHARA — the Insight Engine writes advice in the officer's language", "", NAVY);
  await page.waitForSelector("text=अभी यह करें", { timeout: 90000 }).catch(() => {});
  await page.evaluate(() => { const el = [...document.querySelectorAll("p")].find((p) => p.textContent.includes("धारा की सलाह")); el?.closest(".pulse-card")?.scrollIntoView({ behavior: "smooth", block: "center" }); });
  await caption(page, "Plain Hindi, cause and effect, three doable actions", "And the ▶ Listen button reads it aloud — voice-first for the last mile", NAVY);
  await sleep(11000);

  // add record — live recompute
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(800);
  await clickBtn(page, "नई प्रविष्टि");
  await caption(page, "Voice-first data entry — 3 steps, works offline", "Income → expenses → confirm. The mic speaks her language too.", NAVY);
  await sleep(1200);
  await page.locator('input[inputmode="numeric"]').fill("248000");
  await sleep(1000);
  await clickBtn(page, "जाँचें");
  await sleep(600);
  await page.locator('input[inputmode="numeric"]').fill("241000");
  await sleep(1000);
  await clickBtn(page, "जाँचें");
  await sleep(1600);
  await caption(page, "Save — and the pulse, forecast and flags recompute instantly, on-device", "", NAVY);
  await clickBtn(page, "✓");
  await sleep(5500);

  // enterprise app
  await caption(page, "", "", NAVY);
  await page.goto(`${BASE}/my`, { waitUntil: "load" });
  await caption(page, "And this is what the enterprise sees — big type, her language, one screen", "Bhuj Craft Collective: sales-drop alert + धारा की सलाह, spoken aloud", NAVY);
  await sleep(8000);

  await endCard(page, { quote: "“Cash flow is a river.", quoteAccent: "DHARA reads the current.”", line: "DHARA · NABARD Hackathon GFF 2026 · offline-first · voice-first · 5 languages", bg: "linear-gradient(135deg,#06281a,#0e5132 55%,#1e7d46)" });
  await sleep(4500);

  await ctx.close();
  await browser.close();
  console.log("DONE");
};
run().catch((e) => { console.error(e); process.exit(1); });
