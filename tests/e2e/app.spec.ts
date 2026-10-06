import { test, expect } from "@playwright/test";
import { answerCurrent, noHorizontalScroll, onboard } from "./helpers";

test("first launch: 3 onboarding questions → mission starts → answers persist across refresh", async ({ page }) => {
  await onboard(page);
  const type = await answerCurrent(page);
  expect(type).toBeTruthy();
  await page.getByTestId("next").click();
  await answerCurrent(page);
  await page.goto("/");
  await expect(page.getByTestId("readiness-card")).toBeVisible();
  const xp = await page.getByTestId("xp").innerText();
  await page.reload();
  await expect(page.getByTestId("readiness-card")).toBeVisible();
  await expect(page.getByTestId("xp")).toHaveText(xp);
  await expect(page.getByTestId("onboarding")).toHaveCount(0);
  await expect(page.getByTestId("streak")).toContainText("1 day");
});

test("Quick 5 runs start to finish and shows a summary with XP", async ({ page }) => {
  await onboard(page);
  await page.goto("/play?mode=quick5");
  for (let i = 0; i < 5; i++) {
    await answerCurrent(page);
    await page.getByTestId("next").click();
  }
  await expect(page.getByTestId("summary")).toBeVisible();
  await expect(page.getByTestId("summary-xp")).toBeVisible();
  // Another round restarts
  await page.getByTestId("again").click();
  await expect(page.getByTestId("question")).toBeVisible();
});

test("wrong answer shows full error-based feedback, follow-up, and lands in the Mistake Vault", async ({ page }) => {
  await onboard(page);
  await page.goto("/play?mode=world&world=w6");
  // answer until we get one wrong
  let wrong = false;
  for (let i = 0; i < 12 && !wrong; i++) {
    if (await page.getByTestId("summary").count()) break;
    await answerCurrent(page, { wrongOnPurpose: true });
    const fb = page.getByTestId("feedback");
    if ((await fb.getAttribute("data-correct")) === "false") {
      wrong = true;
      await expect(fb).toContainText("Not quite");
      await expect(fb).toContainText("You chose");
      await expect(page.getByTestId("correct-answer")).toBeVisible();
      await expect(fb).toContainText("Why");
      const fu = page.getByTestId("follow-up");
      if (await fu.count()) {
        await fu.click();
        await expect(page.getByTestId("question")).toBeVisible();
      }
    } else await page.getByTestId("next").click();
  }
  expect(wrong).toBe(true);
  await page.goto("/vault");
  await expect(page.getByTestId("vault-item").first()).toBeVisible();
  const openBefore = await page.getByTestId("vault-item").count();
  // retry one from the vault
  await page.getByTestId("vault-retry").first().click();
  await expect(page.getByTestId("question")).toBeVisible();
  await page.goto("/vault");
  // mark one as understood → it moves to Fixed
  const openNow = await page.getByTestId("vault-item").count();
  if (openNow > 0) {
    await page.getByTestId("vault-understand").first().click();
    await expect(page.getByTestId("vault-item")).toHaveCount(openNow - 1);
  }
  await page.getByRole("button", { name: /Fixed \(/ }).click();
  await expect(page.getByTestId("vault-item").first()).toBeVisible();
  expect(openBefore).toBeGreaterThan(0);
});

test("boss battle: 3 hearts and a result screen", async ({ page }) => {
  await onboard(page);
  await page.goto("/play?mode=boss&world=w7");
  await expect(page.getByTestId("hearts")).toBeVisible();
  for (let i = 0; i < 10; i++) {
    if (await page.getByTestId("summary").count()) break;
    await answerCurrent(page, { wrongOnPurpose: true });
    await page.getByTestId("next").click();
  }
  await expect(page.getByTestId("summary")).toBeVisible();
  await expect(page.getByTestId("summary-title")).toBeVisible();
});

test("exam simulator: 50 questions, resume after refresh, submit, results + Study My Misses", async ({ page }) => {
  await onboard(page);
  await page.goto("/exam");
  await page.getByTestId("exam-start").click();
  await expect(page.getByTestId("exam-position")).toContainText("/ 50");
  // answer 3, then refresh
  for (let i = 0; i < 3; i++) {
    const q = page.getByTestId("question");
    const type = await q.getAttribute("data-qtype");
    if (type === "fill") await q.getByTestId("fill-input").fill("1");
    else await q.getByTestId("option").first().click();
    await page.getByTestId("exam-next").click();
  }
  // no answers revealed during the exam
  await expect(page.getByTestId("feedback")).toHaveCount(0);
  await page.reload();
  await page.getByTestId("exam-resume").click();
  await expect(page.getByTestId("exam-position")).toContainText("Question 4");
  await page.getByTestId("exam-grid-btn").click();
  await page.getByTestId("exam-submit-grid").click();
  await page.getByTestId("exam-confirm-submit").click();
  await expect(page.getByTestId("exam-result")).toBeVisible();
  await expect(page.getByTestId("exam-score")).toContainText("%");
  await page.getByTestId("study-misses").click();
  await expect(page.getByTestId("question")).toBeVisible();
});

test("Dosage Dojo: number + unit, then step-by-step solution", async ({ page }) => {
  await onboard(page);
  await page.goto("/dojo");
  await page.getByTestId("dojo-calc-gtts").click();
  await page.getByTestId("scratchpad").fill("100 x 15 / 60");
  await page.getByTestId("fill-input").fill("25");
  await page.getByTestId("unit-option").first().click();
  await page.getByTestId("check").click();
  await expect(page.getByTestId("feedback")).toContainText("Step by step");
  await expect(page.getByTestId("dojo-score")).toContainText("/1");
});

test("Antidote Arena speed round + match board", async ({ page }) => {
  await onboard(page);
  await page.goto("/arena");
  await page.getByTestId("arena-speed").click();
  for (let i = 0; i < 8; i++) {
    await page.getByTestId("arena-option").first().click();
    await page.getByTestId("arena-next").click();
  }
  await expect(page.getByTestId("arena-result")).toBeVisible();
  await page.goto("/arena");
  await page.getByTestId("arena-match").click();
  await expect(page.getByTestId("board-drug")).toHaveCount(5);
});

test("Lab Lock, Contrast, Rapid Review flows", async ({ page }) => {
  await onboard(page);
  await page.goto("/lab");
  const steps = await page.locator('[aria-label="tumblers"] > div').count();
  for (let i = 0; i < steps; i++) {
    await page.getByTestId("lab-option").first().click();
    if (i < steps - 1) await page.getByTestId("lab-next").click();
  }
  await expect(page.getByTestId("lab-new")).toBeVisible();

  await page.goto("/contrast");
  await page.getByTestId("contrast-set").first().click();
  // study (flip every row) → rebuild the table (tap fallback) → quiz
  const rows = page.getByTestId("flip-row");
  for (let i = 0; i < (await rows.count()); i++) await rows.nth(i).click();
  await page.getByTestId("contrast-rebuild").click();
  while (await page.getByTestId("compare-piece").count()) {
    const p = page.getByTestId("compare-piece").first();
    const id = (await p.getAttribute("data-drag-id"))!;
    await p.tap();
    await page.locator(`[data-drop-zone="${id}"]`).click();
  }
  await page.getByTestId("contrast-start").click();
  for (let i = 0; i < 10; i++) {
    if (await page.getByTestId("contrast-done").count()) break;
    await page.getByTestId("contrast-option").first().click();
    await page.getByTestId("contrast-next").click();
  }
  await expect(page.getByTestId("contrast-done")).toBeVisible();

  await page.goto("/rapid");
  await page.getByTestId("rapid-5").click();
  await page.getByTestId("rapid-start").click();
  await expect(page.getByTestId("rapid-timer")).toBeVisible();
  await page.getByTestId("rapid-reveal").click();
  await page.getByTestId("rapid-got").click();
  await page.getByTestId("rapid-reveal").click();
  await page.getByTestId("rapid-missed").click();
  await expect(page.getByTestId("rapid-card")).toBeVisible();
});

test("every main screen fits a phone (no horizontal scroll) and bottom nav works", async ({ page }) => {
  await onboard(page);
  for (const path of ["/", "/quest", "/practice", "/progress", "/exam", "/vault", "/arena", "/lab", "/contrast", "/dojo", "/rapid", "/settings", "/sources", "/node?id=heparins"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await noHorizontalScroll(page);
  }
  await page.goto("/");
  for (const label of ["Quest", "Practice", "Progress", "Exam", "Home"]) {
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(label === "Home" ? /\/$/ : new RegExp(label.toLowerCase()));
  }
});

test("quest map shows 4 worlds + bosses, node page shows reveal-able drug cards", async ({ page }) => {
  await onboard(page);
  await page.goto("/quest");
  for (const w of ["w5", "w6", "w7", "w8"]) {
    await expect(page.getByTestId(`world-${w}`)).toBeVisible();
    await expect(page.getByTestId(`boss-${w}`)).toBeVisible();
  }
  await page.getByTestId("node-warfarin").click();
  await page.getByRole("button", { name: /Drug cards/ }).click();
  const card = page.getByTestId("drug-card").first();
  await expect(card).toBeVisible();
  await card.getByTestId("chunk").first().click();
  await page.getByTestId("practice-node").click();
  await expect(page.getByTestId("question")).toBeVisible();
});

test("dark mode toggle applies and persists", async ({ page }) => {
  await onboard(page);
  await page.goto("/settings");
  await page.getByTestId("theme-dark").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByTestId("theme-light").click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
