// Visual QA for feedback explainers + new screens: node scripts/shots-flow.mjs <outDir> [baseUrl] [scheme]
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

async function toQuestion() {
  await page.locator('[data-testid="question"], [data-testid="session-activity"]').first().waitFor();
  for (let i = 0; i < 4 && (await page.getByTestId("session-activity").count()); i++) {
    await page.getByTestId("activity-skip").click();
    await page.locator('[data-testid="question"], [data-testid="session-activity"]').first().waitFor();
  }
}
async function answer() {
  const q = page.getByTestId("question");
  const type = await q.getAttribute("data-qtype");
  if (type === "mcq" || type === "tf") await q.getByTestId("option").first().click();
  else if (type === "sata") { await q.getByTestId("option").nth(0).click(); await q.getByTestId("option").nth(1).click(); }
  else if (type === "fill") { await q.getByTestId("fill-input").fill("1"); const u = q.getByTestId("unit-option"); if (await u.count()) await u.first().click(); }
  else if (type === "match") { const l = q.getByTestId("match-left"); for (let i = 0; i < (await l.count()); i++) { await l.nth(i).click(); await q.getByTestId("match-right").nth(i).click(); } }
  else if (type === "order") { while (await q.getByTestId("order-item").count()) await q.getByTestId("order-item").first().click(); }
  const check = page.getByTestId("check");
  if (await check.count()) await check.click(); else await page.getByTestId("conf-confident").click();
  await page.getByTestId("feedback").waitFor();
}
const sets = { antidote: "hep-antidote,dig-antidote", suffix: "htn-suffix", hold: "op-hold", gauge: "hep-lab,ac-levels", potassium: "k-updown,ace-hyperk", clot: "coag-classes", raas: "ace-moa,arb-moa", nephron: "loop-moa,thz-moa", body: "op-se,dig-tox", compare: "lmwh-moa", timeline: "se-steps,lip-seq" };
for (const [kind, concepts] of Object.entries(sets)) {
  await page.goto(`${base}/play?mode=focus&concepts=${concepts}`);
  let got = false;
  for (let i = 0; i < 6 && !got; i++) {
    await toQuestion();
    await answer();
    const ex = page.getByTestId("visual-explainer");
    if ((await ex.count()) && (await ex.getAttribute("data-kind")) === kind) got = true;
    else await page.getByTestId("next").click();
  }
  await page.waitForTimeout(900);
  await page.getByTestId("feedback").screenshot({ path: `${out}/${scheme}-fb-${kind}${got ? "" : "-MISSING"}.png` });
}
for (const [name, path] of [["home", "/"], ["progress", "/progress"]]) {
  await page.goto(base + path); await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${scheme}-${name}.png`, fullPage: true });
}
for (const l of ["room", "gauge", "rescue", "priority", "palace"]) {
  await page.goto(`${base}/visual/play?lab=${l}`); await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${scheme}-lab2-${l}.png`, fullPage: true });
}
await page.goto(base + "/exam"); await page.getByTestId("exam-start").click(); await page.getByTestId("exam-runner").waitFor(); await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/${scheme}-exam-q.png` });
await browser.close();
console.log("done");
