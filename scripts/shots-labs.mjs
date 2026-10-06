// Visual QA for Visual Labs: node scripts/shots-labs.mjs <outDir> [baseUrl] [scheme]
import { chromium, devices } from "@playwright/test";
const out = process.argv[2];
const base = process.argv[3] ?? "http://localhost:3100";
const scheme = process.argv[4] ?? "light";
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"], colorScheme: scheme });
const page = await ctx.newPage();
await page.goto(base + "/");
await page.getByTestId("onboard-next").click();
await page.getByTestId("onboard-next").click();
await page.getByTestId("onboard-start").click();
await page.getByTestId("question").waitFor();
const labs = ["family","raas","nephron","potassium","clot","rescue","gauge","monitor","priority","room","sim","status","timeline","body","palace","sort","swipe","chart","compare","drip"];
for (const l of labs) {
  await page.goto(`${base}/visual/play?lab=${l}`);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${scheme}-lab-${l}.png`, fullPage: true });
}
await page.goto(base + "/visual"); await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/${scheme}-visual-hub.png`, fullPage: true });
await page.goto(base + "/practice"); await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/${scheme}-practice.png` });
await browser.close();
console.log("done");
