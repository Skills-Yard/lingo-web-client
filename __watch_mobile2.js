const { chromium } = require("playwright");

async function sampleAll(page, label, n = 16, interval = 120) {
  const samples = [];
  for (let i = 0; i < n; i++) {
    const rect = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll("p.animate-pop-in, div[class*='rounded-2xl'][class*='border-primary']").forEach((el) => {
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

  const next = () => page.locator('footer button:has-text("Next")').first();
  await next().click();
  await page.waitForTimeout(1700); // heading fully typed

  const card = page.getByText("Tap to reveal");
  await card.click({ timeout: 5000 }).catch((e) => console.log("card click failed", e.message));
  await page.waitForTimeout(150);
  await page.keyboard.press("Escape");
  // Immediately start sampling — don't wait long, catch the prompt bubble typing.
  await sampleAll(page, "MOBILE screen2 prompt bubble (right after reveal)");
  await page.screenshot({ path: "m_s2_prompt.png" });

  await browser.close();
})();
