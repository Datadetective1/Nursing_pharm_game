// Before/after UI QA: node scripts/qa/shots.mjs <outDir> <baseUrl> [extra paths comma-separated]
// Seeds the existing-user v1 fixture into localStorage, then screenshots the core screens (phone viewport).
import { chromium, devices } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
const [out, base = "http://localhost:3100", extra = ""] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const fixture = readFileSync(new URL("../../tests/fixtures/v1-existing-user.json", import.meta.url), "utf8");
const paths = [["home", "/"], ["quest", "/quest"], ["practice", "/practice"], ["progress", "/progress"], ["exam", "/exam"], ["node", "/node?id=heparins"], ["vault", "/vault"], ["settings", "/settings"]];
for (const p of extra.split(",").filter(Boolean)) paths.push([p.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, ""), p]);
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"], colorScheme: "light" });
await ctx.addInitScript((f) => { if (!localStorage.getItem("pharm-quest-v1")) localStorage.setItem("pharm-quest-v1", f); }, fixture);
const page = await ctx.newPage();
for (const [name, path] of paths) {
  await page.goto(base + path);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  const w = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (w > 1) console.log("HORIZONTAL OVERFLOW", name, w);
}
const st = await page.evaluate(() => localStorage.getItem("pharm-quest-v1"));
console.log("stored xp/streak:", JSON.parse(st).state.xp, JSON.parse(st).state.streak.count, "version", JSON.parse(st).version);
await browser.close();
console.log("done", paths.length);
