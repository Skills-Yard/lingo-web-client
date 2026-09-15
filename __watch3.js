const { chromium } = require("playwright");

async function sampleAll(page, label, n = 18, interval = 130) {
  const samples = [];
  for (let i = 0; i < n; i++) {
    const rect = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll("p.animate-pop-in, span.relative.block, div.rounded-\\[12px\\].rounded-bl-sm").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && el.textContent && el.textContent.trim()) {
          out.push({ tag: el.tagName, cls: el.className.slice(0, 40), text: el.textContent.trim().slice(0, 30), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) });
        }
      });
      return out;
    });
    samples.push(rect);
    await page.waitForTimeout(interval);
  }
  console.log(`--- ${label} ---`);
  console.log(JSON.stringify(samples));
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE ERR:", m.text()); });

  await page.goto("http://localhost:3000/review", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const switchBtn = await page.$('button:has-text("Current")');
  if (switchBtn) { await switchBtn.click(); await page.waitForTimeout(300); }

  const next = () => page.locator('button:has-text("Next")').first();

  // Screen 1 -> 2
  await next().click();
  await page.waitForTimeout(1600); // let heading finish typing
  await page.screenshot({ path: "s2_pre_reveal.png" });

  // Tap the reveal card (screen 2) to reveal the prompt bubble.
  const card = page.locator('button[aria-label]').last();
  await card.click();
  await page.waitForTimeout(300);
  await sampleAll(page, "screen2-post-reveal-prompt");
  await page.screenshot({ path: "s2_post_reveal.png" });

  // Advance to screen 3 (teacher-intro).
  await next().click();
  await page.waitForTimeout(300);
  await sampleAll(page, "screen3-teacher-intro");
  await page.screenshot({ path: "s3_done.png" });

  await browser.close();
})();
