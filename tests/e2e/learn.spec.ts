import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ITEM, answerCurrent, finishTeach, noHorizontalScroll, onboard } from "./helpers";

const V1 = readFileSync(path.resolve("tests/fixtures/v1-existing-user.json"), "utf8");

async function seedV1(page: Page) {
  await page.addInitScript((f) => {
    if (!localStorage.getItem("pharm-quest-v1")) localStorage.setItem("pharm-quest-v1", f);
  }, V1);
}

const sel = (s: string) => encodeURIComponent(s);

test("TEST A — Module 6 › Diuretics › Loop Diuretics › Learn teaches before any question", async ({ page }) => {
  await onboard(page);
  await page.goto("/library");
  await page.getByTestId("lib-group-g-diuretics").getByText("Study all").click();
  await expect(page.getByTestId("unit-title")).toHaveText("Diuretics");
  await page.getByTestId("child-u-loop").click();
  await expect(page.getByTestId("unit-title")).toHaveText("Loop Diuretics");
  await page.getByTestId("action-learn").click();
  await page.getByTestId("unit-start").click();
  await expect(page.getByTestId("learn-page")).toBeVisible();
  // teaching first: the opening screen is a lesson screen, not a question
  await expect(page.getByTestId("lesson-step")).toBeVisible();
  await expect(page.getByTestId("question")).toHaveCount(0);
  expect(await page.getByTestId("lesson-step").getAttribute("data-kind")).not.toBe("check");
  await noHorizontalScroll(page);
  // finish the lesson
  for (let i = 0; i < 14 && !(await page.getByTestId("learn-done").count()); i++) {
    const tap = page.locator('[data-testid="tap-target"][data-correct="true"]');
    if (await tap.count()) await tap.first().click();
    const chk = page.locator('[data-testid="check-option"][data-correct="true"]');
    if (await chk.count()) await chk.first().click();
    const skip = page.getByTestId("activity-skip-lesson");
    if (await skip.count()) await skip.click();
    await page.getByTestId("lesson-next").click();
  }
  await expect(page.getByTestId("lesson-summary")).toContainText("You just learned");
  await page.getByTestId("learn-practice").click();
  await page.waitForURL(/mode=practice/);
  await expect(page.locator(ITEM).first()).toBeVisible();
  // Learn now shows done on the unit
  await page.goto(`/unit?sel=${sel("unit:u-loop")}`);
  await expect(page.getByTestId("stage-tracker")).toContainText("✓");
});

test("TEST B — Continue Quest teaches an unseen concept before testing it", async ({ page }) => {
  await onboard(page);
  await page.goto("/");
  await expect(page.getByTestId("continue-plan")).toContainText("New lesson");
  await page.getByTestId("continue-quest").click();
  await expect(page.getByTestId("session-teach")).toBeVisible();
  await expect(page.getByTestId("teach-badge")).toContainText("Learn first");
  await finishTeach(page);
  // the first question after the lesson is guided practice (hints, no penalty)
  await page.locator('[data-testid="question"], [data-testid="session-teach"]').first().waitFor();
  await expect(page.getByTestId("guided-badge")).toBeVisible();
});

test("TEST C — Module 7 › Anticoagulants › Heparin › Practice stays on heparin", async ({ page }) => {
  await onboard(page);
  await page.goto("/library");
  await page.getByTestId("lib-search").fill("heparin");
  await expect(page.getByTestId("lib-hit").first()).toContainText("Heparin");
  await expect(page.getByTestId("lib-hit").first()).toContainText("Module 7");
  await page.getByTestId("lib-hit").first().getByTestId("hit-practice").click();
  await page.waitForURL(/mode=practice/);
  const seen: string[] = [];
  for (let i = 0; i < 6; i++) {
    await page.locator(ITEM).first().waitFor();
    if (await page.getByTestId("session-teach").count()) {
      seen.push(`teach:${await page.getByTestId("session-teach").getAttribute("data-concept")}`);
      await finishTeach(page);
      continue;
    }
    if (await page.getByTestId("session-activity").count()) {
      await page.getByTestId("activity-skip").click();
      continue;
    }
    seen.push(await page.getByTestId("stem").innerText());
    await answerCurrent(page);
    await page.getByTestId("next").click();
  }
  const text = seen.join(" | ").toLowerCase();
  expect(text).toMatch(/heparin|hep-|aptt|protamine|hit|platelet|bleed/);
  expect(text).not.toMatch(/digoxin|phenytoin|statin|nitroglycerin/);
});

test("TEST D — Module 8 › Anticonvulsants › Test is independent (no teaching, no hints)", async ({ page }) => {
  await onboard(page);
  await page.goto(`/unit?sel=${sel("group:g-anticonv")}`);
  await page.getByTestId("action-test").click();
  await page.getByTestId("unit-start").click();
  await page.waitForURL(/mode=test/);
  for (let i = 0; i < 3; i++) {
    await expect(page.getByTestId("question")).toBeVisible();
    await expect(page.getByTestId("session-teach")).toHaveCount(0);
    await expect(page.getByTestId("hint-btn")).toHaveCount(0);
    await expect(page.getByTestId("guided-badge")).toHaveCount(0);
    const q = page.getByTestId("question");
    if (await q.getByTestId("fill-input").count()) await q.getByTestId("fill-input").fill("10");
    else await q.getByTestId("option").first().click();
    await page.getByTestId("check").click();
    await expect(page.getByTestId("feedback")).toBeVisible();
    await page.getByTestId("next").click();
  }
});

test("TEST E + F — existing learner upgrades intact; repeated misses offer RELEARN", async ({ page }) => {
  await seedV1(page);
  await page.goto("/");
  await expect(page.getByTestId("xp")).toContainText("1840");
  await expect(page.getByTestId("streak")).toContainText("6 days");
  await expect(page.getByTestId("readiness-card")).toContainText("Exam 2");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("pharm-quest-v1")!));
  expect(stored.version).toBe(2);
  expect(Object.keys(stored.state.mistakes)).toHaveLength(8);
  expect(stored.state.profile.examDate).toBe("2026-10-15");
  expect(stored.state.learn["op-hold"].testedOut).toBeTruthy();

  await page.goto("/vault");
  await expect(page.getByTestId("vault-item")).toHaveCount(8);
  await expect(page.getByTestId("vault-relearn")).toContainText("We should review");
  const item = page.getByTestId("vault-item").filter({ hasText: "vitamin K" }).first();
  await expect(item.getByTestId("vault-relearn-btn")).toBeVisible();
  await expect(item.getByTestId("vault-retry")).toContainText("Try again");
  await expect(item.getByTestId("vault-similar")).toContainText("Similar");
  await page.getByTestId("vault-teach-me").first().click();
  await page.waitForURL(/\/learn\?concept=/);
  await expect(page.getByTestId("lesson-step")).toBeVisible();
});

test("new screens fit a phone (no horizontal scroll)", async ({ page }) => {
  await seedV1(page);
  for (const p of ["/library", `/unit?sel=${sel("unit:u-heparin")}`, `/unit?sel=${sel("module:w7")}`, `/learn?sel=${sel("unit:u-acei")}`, "/vault", "/practice", "/"]) {
    await page.goto(p);
    await page.waitForTimeout(300);
    await noHorizontalScroll(page);
  }
});
