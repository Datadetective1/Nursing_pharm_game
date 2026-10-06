import { expect, type Page } from "@playwright/test";

/** Seed localStorage with a finished onboarding so tests start on the real home screen. */
export async function onboard(page: Page) {
  await page.goto("/");
  await page.getByTestId("onboarding").waitFor();
  await page.getByTestId("onboard-next").click();
  await page.getByTestId("minutes-5").click();
  await page.getByTestId("onboard-next").click();
  await page.getByTestId("conf-somewhat").click();
  await page.getByTestId("onboard-start").click();
  await page.waitForURL(/\/play\?mode=mission/);
  await page.locator(ITEM).first().waitFor();
}

/** Any session item: a question, an activity, or a teach-first micro-lesson. */
export const ITEM = '[data-testid="question"], [data-testid="session-activity"], [data-testid="session-teach"]';

/** Walk through an in-session micro-lesson (tap/check steps answered correctly). */
export async function finishTeach(page: Page) {
  for (let i = 0; i < 6 && (await page.getByTestId("session-teach").count()); i++) {
    const tap = page.locator('[data-testid="tap-target"][data-correct="true"]');
    if (await tap.count()) await tap.first().click();
    const chk = page.locator('[data-testid="check-option"][data-correct="true"]');
    if (await chk.count()) await chk.first().click();
    const skip = page.getByTestId("activity-skip-lesson");
    if (await skip.count()) await skip.click();
    await page.getByTestId("lesson-next").click();
    await page.waitForTimeout(150);
  }
}

/** Sessions interleave visual activities with questions; swap any activity for a question. */
export async function toQuestion(page: Page) {
  await page.locator(ITEM).first().waitFor();
  for (let i = 0; i < 8 && !(await page.getByTestId("question").count()); i++) {
    if (await page.getByTestId("session-teach").count()) await finishTeach(page);
    else if (await page.getByTestId("session-activity").count()) await page.getByTestId("activity-skip").click();
    await page.locator(ITEM).first().waitFor();
  }
}

/** Answer whatever question is on screen (any type). Returns the question type. */
export async function answerCurrent(page: Page, opts: { wrongOnPurpose?: boolean } = {}) {
  await toQuestion(page);
  const q = page.getByTestId("question");
  await q.waitFor();
  const type = await q.getAttribute("data-qtype");
  switch (type) {
    case "mcq":
    case "tf":
      await q.getByTestId("option").first().click();
      break;
    case "sata": {
      const opts2 = q.getByTestId("option");
      await opts2.nth(0).click();
      await opts2.nth(1).click();
      break;
    }
    case "fill": {
      await q.getByTestId("fill-input").fill(opts.wrongOnPurpose ? "zzzz" : "1");
      const units = q.getByTestId("unit-option");
      if (await units.count()) await units.first().click();
      break;
    }
    case "match": {
      const lefts = q.getByTestId("match-left");
      const n = await lefts.count();
      for (let i = 0; i < n; i++) {
        await lefts.nth(i).click();
        await q.getByTestId("match-right").nth(i).click();
      }
      break;
    }
    case "order": {
      while (await q.getByTestId("order-item").count()) await q.getByTestId("order-item").first().click();
      break;
    }
  }
  // commit: either the Check button or a confidence button
  const check = page.getByTestId("check");
  if (await check.count()) await check.click();
  else await page.getByTestId("conf-confident").click();
  // guided practice: a first wrong answer shows a hint instead of feedback → answer again
  await page.locator('[data-testid="feedback"], [data-testid="guided-hint"]').first().waitFor();
  if (!(await page.getByTestId("feedback").count())) {
    if (type === "mcq") await q.locator('[data-testid="option"]:not([disabled])').first().click();
    if (type === "fill") await q.getByTestId("fill-input").fill(opts.wrongOnPurpose ? "zzzzz" : "2");
    await page.getByTestId("check").click();
  }
  await expect(page.getByTestId("feedback")).toBeVisible();
  return type;
}

export async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}
