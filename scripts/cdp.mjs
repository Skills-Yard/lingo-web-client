// Drives headless Chrome over the DevTools protocol (Node 22): open a page, run steps, save screenshots, log console errors.
// Usage: node scripts/cdp.mjs <url> <out-prefix> <waitMs> <width> <height> [steps.json]   (CHROME=/path/to/chrome to override)
// steps.json: [{"eval":"js","print":true},{"wait":ms},{"shot":"name","full":true,"selector":"css"}]. Each eval runs in the page global scope: wrap helpers in an IIFE.
import { spawn } from "node:child_process";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const [url, prefix, waitMs = "8000", width = "1300", height = "1000", stepsFile] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), "cdp-"));
const chrome = spawn(process.env.CHROME ?? "/usr/bin/google-chrome", ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-sandbox", "--disable-gpu", "--autoplay-policy=no-user-gesture-required", `--window-size=${width},${height}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {} await sleep(200); }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const logs = [];
ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } else if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) logs.push(`[console.${msg.params.type}] ` + msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 300)); else if (msg.method === "Runtime.exceptionThrown") logs.push("[exception] " + (msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text).slice(0, 400)); };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Runtime.enable"); await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: +width, height: +height, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url }); await sleep(+waitMs);
const shot = async (name, { full = false, selector } = {}) => {
  let clip;
  if (selector) { const r = await send("Runtime.evaluate", { expression: `(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null; e.scrollIntoView({block:'center'}); const b = e.getBoundingClientRect(); return {x: b.x + scrollX, y: b.y + scrollY, width: b.width, height: b.height, scale: 1}; })()`, returnByValue: true }); clip = r.result.result.value ?? undefined; await sleep(300); }
  if (full && !clip) { const m = await send("Page.getLayoutMetrics"); const c = m.result.cssContentSize ?? m.result.contentSize; clip = { x: 0, y: 0, width: c.width, height: Math.min(c.height, 16000), scale: 1 }; }
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: !!clip, ...(clip ? { clip } : {}) });
  writeFileSync(`${prefix}-${name}.png`, Buffer.from(r.result.data, "base64")); console.log("saved", `${prefix}-${name}.png`);
};
if (stepsFile) for (const step of JSON.parse(readFileSync(stepsFile, "utf8"))) { if (step.eval) { const r = await send("Runtime.evaluate", { expression: step.eval, awaitPromise: true, returnByValue: true }); if (step.print) console.log("eval:", JSON.stringify(r.result.result.value)); } else if (step.wait) await sleep(step.wait); else if (step.shot) await shot(step.shot, step); }
else await shot("page", { full: true });
console.log(logs.length ? "LOGS:\n" + [...new Set(logs)].join("\n") : "no console errors");
ws.close(); chrome.kill(); process.exit(0);
