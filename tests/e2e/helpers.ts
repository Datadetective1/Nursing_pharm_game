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
  await page.getByTestId("question").waitFor();
}

/** Answer whatever question is on screen (any type). Returns the question type. */
export async function answerCurrent(page: Page, opts: { wrongOnPurpose?: boolean } = {}) {
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
  await expect(page.getByTestId("feedback")).toBeVisible();
  return type;
}

export async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}
