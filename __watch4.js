const { chromium } = require("playwright");

async function sampleAll(page, label, n = 18, interval = 130) {
  const samples = [];
  for (let i = 0; i < n; i++) {
    const rect = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll("p.animate-pop-in, div.rounded-\\[12px\\].rounded-bl-sm, span.inline-block").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && el.textContent && el.textContent.trim()) {
          out.push({ tag: el.tagName, text: el.textContent.trim().slice(0, 30), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) });
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

  await page.goto("http://localhost:3000/review", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const switchBtn = await page.$('button:has-text("Current")');
  if (switchBtn) { await switchBtn.click(); await page.waitForTimeout(300); }

  const next = () => page.locator('footer button:has-text("Next")').first();

  await next().click();
  await page.waitForTimeout(1600);

  const card = page.getByText("Tap to reveal");
  await card.click();
  await page.waitForTimeout(200);
  // Modal probably opened - close it via Escape or an X/close button.
  await page.screenshot({ path: "s2_modal.png" });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  await sampleAll(page, "screen2-post-reveal-prompt");
  await page.screenshot({ path: "s2_post_reveal2.png" });

  await next().click();
  await page.waitForTimeout(300);
  await sampleAll(page, "screen3-teacher-intro");
  await page.screenshot({ path: "s3_done2.png" });

  await browser.close();
})();
