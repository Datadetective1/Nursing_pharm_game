// Visual QA helper: node scripts/screens.mjs <outDir> [baseUrl]
import { chromium, devices } from "@playwright/test";
const out = process.argv[2];
const base = process.argv[3] ?? "http://localhost:3100";
const browser = await chromium.launch();
for (const scheme of ["light", "dark"]) {
  const ctx = await browser.newContext({ ...devices["iPhone 13"], colorScheme: scheme });
  const page = await ctx.newPage();
  await page.goto(base + "/");
  await page.screenshot({ path: `${out}/${scheme}-00-onboarding.png` });
  await page.getByTestId("onboard-next").click();
  await page.getByTestId("onboard-next").click();
  await page.getByTestId("onboard-start").click();
  await page.getByTestId("question").waitFor();
  await page.screenshot({ path: `${out}/${scheme}-01-question.png`, fullPage: true });
  // answer a few, capture feedback
  for (let i = 0; i < 3; i++) {
    const q = page.getByTestId("question");
    const t = await q.getAttribute("data-qtype");
    if (t === "fill") await q.getByTestId("fill-input").fill("zz");
    else if (t === "match") { const l = q.getByTestId("match-left"); const n = await l.count(); for (let k = 0; k < n; k++) { await l.nth(k).click(); await q.getByTestId("match-right").nth(k).click(); } }
    else if (t === "order") { while (await q.getByTestId("order-item").count()) await q.getByTestId("order-item").first().click(); }
    else await q.getByTestId("option").first().click();
    if (await page.getByTestId("check").count()) await page.getByTestId("check").click(); else await page.getByTestId("conf-unsure").click();
    await page.getByTestId("feedback").waitFor(); await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/${scheme}-02-feedback-${i}.png`, fullPage: true });
    await page.getByTestId("next").click();
  }
  for (const [name, path] of [["home", "/"], ["quest", "/quest"], ["practice", "/practice"], ["progress", "/progress"], ["exam", "/exam"], ["node", "/node?id=heparins"], ["vault", "/vault"], ["arena", "/arena"], ["dojo", "/dojo"], ["rapid", "/rapid"], ["contrast", "/contrast"], ["lab", "/lab"], ["settings", "/settings"]]) {
    await page.goto(base + path);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/${scheme}-10-${name}.png`, fullPage: name !== "home" ? false : true });
  }
  await page.goto(base + "/play?mode=boss&world=w7");
  await page.getByTestId("question").waitFor();
  await page.screenshot({ path: `${out}/${scheme}-20-boss.png` });
  await page.goto(base + "/dojo");
  await page.getByTestId("dojo-calc-mgkg").click();
  await page.screenshot({ path: `${out}/${scheme}-21-dojo-q.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
console.log("done");
