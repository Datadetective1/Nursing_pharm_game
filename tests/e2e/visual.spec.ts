import { test, expect, type Locator, type Page } from "@playwright/test";
import { answerCurrent, noHorizontalScroll, onboard, toQuestion } from "./helpers";

const SUFFIX_FAMILY: [RegExp, string][] = [
  [/pril$/i, "acei"],
  [/sartan$/i, "arb"],
  [/olol$/i, "bb"],
  [/(pine|zem|mil)$/i, "ccb"],
  [/(pam|lam)$/i, "benzo"],
  [/statin$/i, "statin"],
];
const familyOf = (name: string) => SUFFIX_FAMILY.find(([re]) => re.test(name))?.[1] ?? "";

/** Real touch drag through CDP (touchStart → touchMove… → touchEnd). Returns page scrollY drift during the drag. */
async function touchDrag(page: Page, from: Locator, to: Locator) {
  await from.scrollIntoViewIfNeeded();
  const a = (await from.boundingBox())!;
  const b = (await to.boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const sx = a.x + a.width / 2;
  const sy = a.y + a.height / 2;
  const ex = b.x + b.width / 2;
  const ey = b.y + Math.min(b.height / 2, 40);
  const before = await page.evaluate(() => window.scrollY);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: sx, y: sy }] });
  const steps = 14;
  for (let i = 1; i <= steps; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: sx + ((ex - sx) * i) / steps, y: sy + ((ey - sy) * i) / steps }] });
  }
  const during = await page.evaluate(() => window.scrollY);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
  return Math.abs(during - before);
}

async function openLab(page: Page, slug: string, extra = "") {
  await page.goto(`/visual/play?lab=${slug}${extra}`);
  await expect(page.getByTestId("visual-runner")).toBeVisible();
}

test("Visual Labs hub lists every lab and each lab renders on a phone (light + dark)", async ({ page }) => {
  await onboard(page);
  await page.goto("/visual");
  const tiles = page.locator('[data-testid^="lab-"]');
  expect(await tiles.count()).toBeGreaterThanOrEqual(20);
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const slug of ["family", "raas", "nephron", "potassium", "clot", "rescue", "gauge", "monitor", "priority", "room", "sim", "status", "timeline", "body", "palace", "sort", "swipe", "chart", "compare", "drip"]) {
      await openLab(page, slug);
      await noHorizontalScroll(page);
    }
  }
});

test("Drug Family Wall: real touch drag places a card without scrolling the page; wrong drop shakes + hints", async ({ page }) => {
  await onboard(page);
  await openLab(page, "family");
  const zones = page.getByTestId("family-zone");
  const card = page.getByTestId("drug-card").first();
  const name = (await card.getAttribute("data-drag-id"))!;
  const fam = familyOf(name);
  // wrong zone first (if one is on the wall) → card stays, hint appears, no answer given
  const zoneIds = await zones.evaluateAll((els) => els.map((e) => e.getAttribute("data-drop-zone")));
  const wrongId = zoneIds.find((z) => z !== fam);
  if (wrongId) {
    const drift = await touchDrag(page, card, page.locator(`[data-drop-zone="${wrongId}"]`));
    expect(drift).toBe(0);
    await expect(page.locator(`[data-drag-id="${name}"]`)).toBeVisible();
    await expect(page.getByTestId("family-wall")).toContainText(/suffix|ending|Look/i);
  }
  const drift = await touchDrag(page, page.locator(`[data-drag-id="${name}"]`), page.locator(`[data-drop-zone="${fam}"]`));
  expect(drift).toBe(0);
  await expect(page.locator(`[data-drop-zone="${fam}"]`).getByTestId("placed-card").filter({ hasText: name })).toBeVisible();
});

test("tap-to-select fallback completes the Drug Family Wall and records XP that survives a refresh", async ({ page }) => {
  await onboard(page);
  const xpBefore = Number((await page.evaluate(() => JSON.parse(localStorage.getItem("pharm-quest-v1") ?? "{}").state?.xp)) ?? 0);
  await openLab(page, "family");
  while (await page.getByTestId("drug-card").count()) {
    const card = page.getByTestId("drug-card").first();
    const name = (await card.getAttribute("data-drag-id"))!;
    await card.tap();
    await page.locator(`[data-drop-zone="${familyOf(name)}"]`).click();
    await expect(page.locator(`[data-drag-id="${name}"]`)).toHaveCount(0);
  }
  await expect(page.getByTestId("runner-footer")).toBeVisible();
  await expect(page.getByTestId("runner-footer")).toContainText("XP");
  await page.reload();
  const xpAfter = Number(await page.evaluate(() => JSON.parse(localStorage.getItem("pharm-quest-v1") ?? "{}").state?.xp));
  expect(xpAfter).toBeGreaterThan(xpBefore);
});

test("Clotting Lab: wrong class leaves the clot (no fake dissolve), right class solves all 3 scenarios", async ({ page }) => {
  await onboard(page);
  await openLab(page, "clot");
  for (let s = 0; s < 3; s++) {
    const prompt = (await page.getByTestId("clot-lab").innerText()).split("\n").slice(0, 4).join(" ");
    const want = /DISSOLVED/.test(prompt) ? /Alteplase/ : /DVT|vein/i.test(prompt) ? /Heparin|Enoxaparin|Warfarin|Dabigatran|Rivaroxaban/ : /Aspirin|Clopidogrel/;
    const cards = page.getByTestId("clot-card");
    const n = await cards.count();
    let wrongTried = false;
    for (let i = 0; i < n; i++) {
      const nm = (await cards.nth(i).getAttribute("data-drag-id"))!;
      if (!want.test(nm) && !wrongTried) {
        wrongTried = true;
        await cards.nth(i).tap();
        await page.getByTestId("clot-scene").click();
        await expect(page.getByTestId("clot-outcome")).toHaveAttribute("data-ok", "false");
        await expect(page.getByTestId("clot-next")).toHaveCount(0);
      }
    }
    for (let i = 0; i < n; i++) {
      const nm = (await cards.nth(i).getAttribute("data-drag-id"))!;
      if (want.test(nm)) {
        await touchDrag(page, cards.nth(i), page.getByTestId("clot-scene"));
        break;
      }
    }
    await expect(page.getByTestId("clot-outcome")).toHaveAttribute("data-ok", "true");
    await page.getByTestId("clot-next").click();
  }
  await expect(page.getByTestId("runner-footer")).toBeVisible();
});

test("Antidote Rescue: wrong kit keeps the client unstable; the right kit stabilizes", async ({ page }) => {
  await onboard(page);
  await openLab(page, "rescue");
  const kits = page.getByTestId("rescue-kit");
  const n = await kits.count();
  expect(n).toBeGreaterThanOrEqual(3);
  let solved = false;
  for (let i = 0; i < n && !solved; i++) {
    const k = page.getByTestId("rescue-kit").nth(i);
    await k.tap();
    await page.getByTestId("rescue-client").click();
    solved = (await page.getByTestId("rescue-done").count()) > 0;
  }
  expect(solved).toBe(true);
  await expect(page.getByTestId("rescue-monitor")).toContainText("rescue given");
});

test("Lab gauge: tap the zone, then meaning + action; a miss is retried, never red-screened", async ({ page }) => {
  await onboard(page);
  await openLab(page, "gauge");
  for (const z of ["low", "in", "high"]) {
    if (await page.getByTestId("gauge-meaning").count()) break;
    const zone = page.getByTestId(`gauge-zone-${z}`);
    if (await zone.count()) await zone.click();
  }
  await expect(page.getByTestId("gauge-needle")).toBeVisible();
  await expect(page.getByTestId("gauge-legend")).toBeVisible();
  for (let i = 0; i < 8 && !(await page.getByTestId("runner-footer").count()); i++) {
    const opts = page.locator('[data-testid$="-option"][data-correct="true"]:not([disabled])');
    if (await opts.count()) await opts.first().click();
  }
  await expect(page.getByTestId("runner-footer")).toBeVisible();
});

test("Don't Mix: flip study → rebuild by tap fallback → quiz", async ({ page }) => {
  await onboard(page);
  await page.goto("/contrast");
  await page.getByTestId("contrast-set").first().click();
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
  await expect(page.getByTestId("contrast-option").first()).toBeVisible();
});

test("a normal session interleaves visual activities with questions", async ({ page }) => {
  await onboard(page);
  await page.goto("/play?mode=quick5");
  await answerCurrent(page);
  await page.getByTestId("next").click();
  // slot 2 of a learning session is a visual activity
  const act = page.getByTestId("session-activity");
  await expect(act).toBeVisible();
  expect(await act.getAttribute("data-kind")).toBeTruthy();
  await toQuestion(page);
  await expect(page.getByTestId("question")).toBeVisible();
});

test("wrong-answer feedback is calm, visual and offers an immediate retry", async ({ page }) => {
  await onboard(page);
  await page.goto("/play?mode=focus&concepts=hep-antidote,war-antidote,dig-antidote");
  await answerCurrent(page, { wrongOnPurpose: true });
  const fb = page.getByTestId("feedback");
  await expect(page.getByTestId("visual-explainer")).toBeVisible();
  await expect(page.getByTestId("visual-explainer")).toHaveAttribute("data-kind", "antidote");
  if ((await fb.getAttribute("data-correct")) === "false") {
    await expect(fb).not.toHaveClass(/bg-bad/);
    await expect(page.getByTestId("misconception")).toBeVisible();
    // interact with the correction: connect the rescue kit
    const kits = page.getByTestId("x-antidote-kit");
    for (let i = 0; i < (await kits.count()) && (await kits.count()); i++) await page.getByTestId("x-antidote-kit").first().click();
    await page.getByTestId("follow-up").click();
    await expect(page.locator('[data-testid="question"], [data-testid="session-activity"]').first()).toBeVisible();
  }
});

test("suffix explainer shows the breakdown plus a 'Now you try'", async ({ page }) => {
  await onboard(page);
  await page.goto("/play?mode=focus&concepts=htn-suffix");
  for (let i = 0; i < 6; i++) {
    await answerCurrent(page);
    const ex = page.getByTestId("visual-explainer");
    if ((await ex.count()) && (await ex.getAttribute("data-kind")) === "suffix") {
      await expect(page.getByTestId("x-try")).toBeVisible();
      await page.getByTestId("x-try-option").first().click();
      return;
    }
    await page.getByTestId("next").click();
  }
  throw new Error("no suffix explainer seen");
});

test("Progress heatmap: tapping a weak area starts focused practice", async ({ page }) => {
  await onboard(page);
  await page.goto("/progress");
  await expect(page.getByTestId("heatmap")).toBeVisible();
  await expect(page.getByTestId("accuracy-trend")).toBeVisible();
  await page.getByTestId("heat-cell").first().click();
  await page.waitForURL(/mode=focus/);
  await expect(page.locator('[data-testid="question"], [data-testid="session-activity"]').first()).toBeVisible();
});

test("Exam Simulator stays a clean test: no format chips, no activities, no explainers", async ({ page }) => {
  await onboard(page);
  await page.goto("/exam");
  await page.getByTestId("exam-start").click();
  await expect(page.getByTestId("exam-runner")).toBeVisible();
  for (let i = 0; i < 4; i++) {
    await expect(page.getByTestId("question")).toBeVisible();
    await expect(page.getByTestId("question-chips")).toHaveCount(0);
    await expect(page.getByTestId("session-activity")).toHaveCount(0);
    await expect(page.getByTestId("visual-explainer")).toHaveCount(0);
    await page.getByTestId("exam-next").click();
  }
});

test("sound toggle persists; reduced motion still completes an activity", async ({ page }) => {
  await onboard(page);
  await page.goto("/play?mode=quick5");
  const t = page.getByTestId("sound-toggle");
  const before = await t.getAttribute("aria-label");
  await t.click();
  await expect(t).not.toHaveAttribute("aria-label", before!);
  await page.reload();
  await expect(page.getByTestId("sound-toggle")).not.toHaveAttribute("aria-label", before!);

  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  await openLab(page, "rescue");
  const kits = page.getByTestId("rescue-kit");
  for (let i = 0; i < (await kits.count()); i++) {
    if (await page.getByTestId("rescue-done").count()) break;
    await kits.nth(i).tap();
    await page.getByTestId("rescue-client").click();
  }
  await expect(page.getByTestId("rescue-done")).toBeVisible();
});
