const { chromium } = require("playwright");

async function sampleAll(page, label, n = 20, interval = 120) {
  const samples = [];
  for (let i = 0; i < n; i++) {
    const rect = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll("p.animate-pop-in, span.inline-block, div[class*='rounded-bl-sm']").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && el.textContent && el.textContent.trim()) {
          out.push({ text: el.textContent.trim().slice(0, 28), left: Math.round(r.left), width: Math.round(r.width) });
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
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto("http://localhost:3000/review", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const switchBtn = await page.$('button:has-text("Current")');
  if (switchBtn) { await switchBtn.click(); await page.waitForTimeout(300); }

  await page.screenshot({ path: "m_s1_initial.png" });
  await sampleAll(page, "MOBILE screen1-greeting");
  await page.screenshot({ path: "m_s1_done.png" });

  const next = () => page.locator('footer button:has-text("Next")').first();
  await next().click();
  await page.waitForTimeout(300);
  await sampleAll(page, "MOBILE screen2-intro");
  await page.screenshot({ path: "m_s2_done.png" });

  // Tap reveal card
  const card = page.getByText("Tap to reveal");
  await card.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(200);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  await sampleAll(page, "MOBILE screen2-post-reveal");
  await page.screenshot({ path: "m_s2_post.png" });

  await next().click({ timeout: 8000 }).catch(async (e) => { console.log("next click1 failed", e.message); });
  await page.waitForTimeout(300);
  await sampleAll(page, "MOBILE screen3-teacher-intro");
  await page.screenshot({ path: "m_s3_done.png" });

  await browser.close();
})();
