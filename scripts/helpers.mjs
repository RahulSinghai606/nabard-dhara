export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function caption(page, text, sub = "", navy = "#101b3e") {
  await page.evaluate(
    ({ text, sub, navy }) => {
      let el = document.getElementById("vid-cap");
      if (!el) {
        el = document.createElement("div");
        el.id = "vid-cap";
        el.style.cssText = `position:fixed;left:50%;bottom:42px;transform:translateX(-50%);z-index:99999;max-width:940px;padding:16px 30px;border-radius:18px;background:${navy}EE;backdrop-filter:blur(10px);color:#fff;font-family:system-ui,-apple-system,sans-serif;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.3);transition:opacity .45s ease;pointer-events:none;`;
        document.body.appendChild(el);
      }
      if (!text) { el.style.opacity = "0"; return; }
      el.style.opacity = "1";
      el.innerHTML =
        `<div style="font-size:19px;font-weight:700;line-height:1.35">${text}</div>` +
        (sub ? `<div style="font-size:14px;color:#8fd8f5;margin-top:4px;font-weight:500">${sub}</div>` : "");
    },
    { text, sub, navy }
  );
}

export async function smoothScroll(page, to, duration) {
  await page.evaluate(
    ({ to, duration }) =>
      new Promise((res) => {
        const from = window.scrollY;
        const start = performance.now();
        const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        const step = (now) => {
          const p = Math.min((now - start) / duration, 1);
          window.scrollTo(0, from + (to - from) * ease(p));
          if (p < 1) requestAnimationFrame(step);
          else res();
        };
        requestAnimationFrame(step);
      }),
    { to, duration }
  );
}

export async function titleCard(page, { kicker, title, accentDot, subtitle, sub2, bg }) {
  await page.setContent(`
    <body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:${bg};font-family:system-ui,-apple-system,sans-serif;">
      <div style="text-align:center">
        <div style="font-size:15px;letter-spacing:.35em;color:#2aa9e8;font-weight:700;margin-bottom:22px">${kicker}</div>
        <div style="font-size:96px;font-weight:800;color:#12305e;letter-spacing:-.03em;line-height:1">${title}<span style="color:${accentDot}">.</span></div>
        <div style="font-size:26px;color:#45536e;margin-top:26px;font-weight:600">${subtitle}</div>
        <div style="font-size:17px;color:#8794ad;margin-top:14px">${sub2}</div>
      </div>
    </body>`);
}

export async function endCard(page, { quote, quoteAccent, line, bg }) {
  await page.setContent(`
    <body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:${bg};font-family:system-ui,-apple-system,sans-serif;">
      <div style="text-align:center;color:#fff">
        <div style="font-size:52px;font-weight:800;letter-spacing:-.02em;line-height:1.25">${quote}<br/><span style="color:#2aa9e8">${quoteAccent}</span></div>
        <div style="font-size:21px;color:rgba(255,255,255,.75);margin-top:28px;font-weight:500">${line}</div>
        <div style="font-size:15px;color:rgba(255,255,255,.5);margin-top:16px">Team Kellton · accelerated on KAI · all demo data synthetic</div>
      </div>
    </body>`);
}

export async function typeAndSend(page, selector, text, delay = 22) {
  const input = page.locator(selector);
  await input.click();
  await input.pressSequentially(text, { delay });
  await page.click('button[aria-label="Send"]');
}

export async function clickBtn(page, needle) {
  await page.waitForFunction(
    (n) => [...document.querySelectorAll("button")].some((b) => b.textContent.includes(n) && !b.disabled),
    needle,
    { timeout: 150000 }
  );
  await page.evaluate((n) => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(n) && !x.disabled);
    b.click();
  }, needle);
}
