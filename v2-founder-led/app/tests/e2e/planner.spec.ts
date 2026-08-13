import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const evidenceDir = resolve("evidence/qa");

async function fillReadyStrengthPlan(page: Page, journey: "new_space" | "upgrade" = "new_space", budget = "2500", expected: "checked" | "infeasible" = "checked") {
  const updateRequirement = async (action: () => Promise<unknown>) => {
    await Promise.all([
      page.waitForResponse((response) => response.request().method() === "PATCH" && response.url().includes("/requirements") && response.ok()),
      action(),
    ]);
  };
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/chat") && response.ok()),
    page.getByLabel("Planning journey", { exact: true }).getByRole("button", { name: journey === "upgrade" ? "Upgrade equipment" : "Plan a gym" }).click(),
  ]);
  if (journey === "upgrade") {
    await Promise.all([
      page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/existing-equipment") && response.ok()),
      page.getByLabel("Northstar rack").selectOption("h30-half-rack-entry"),
    ]);
    await expect(page.locator(".confirmed-line")).toContainText("H30 Half Rack");
  }
  const room = page.locator(".room-fields");
  await updateRequirement(() => room.getByRole("spinbutton", { name: /length/i }).fill("4"));
  await updateRequirement(() => room.getByRole("spinbutton", { name: /width/i }).fill("3"));
  await updateRequirement(() => room.getByRole("spinbutton", { name: /height/i }).fill("2.4"));
  await expect(page.getByTestId("planner-2d")).toBeVisible();
  const trainingChoice = page.getByRole("button", { name: journey === "upgrade" ? "Gymnastics / open floor" : "Weight lifting", exact: true });
  if (!(await trainingChoice.evaluate((button) => button.classList.contains("active")))) await updateRequirement(() => trainingChoice.click());
  await updateRequirement(() => page.getByLabel("Experience").selectOption("beginner"));
  await updateRequirement(() => page.getByLabel("Maximum").fill(budget));
  await expect(page.getByText("Ready for a checked plan")).toBeVisible();
  await page.getByRole("button", { name: "Build plan" }).click();
  await expect(page.getByText(expected === "checked" ? "Checked plan" : "Plan needs a change", { exact: true })).toBeVisible();
}

async function canvasVariance(page: Page, selector: string) {
  return page.locator(selector).evaluate((canvas: HTMLCanvasElement) => {
    const context2d = canvas.getContext("2d");
    if (context2d) {
      const data = context2d.getImageData(0, 0, Math.min(canvas.width, 500), Math.min(canvas.height, 500)).data;
      let min = 255; let max = 0; let coloured = 0;
      for (let index = 0; index < data.length; index += 16) { min = Math.min(min, data[index], data[index + 1], data[index + 2]); max = Math.max(max, data[index], data[index + 1], data[index + 2]); if (Math.max(data[index], data[index + 1], data[index + 2]) - Math.min(data[index], data[index + 1], data[index + 2]) > 12) coloured += 1; }
      return { range: max - min, coloured };
    }
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return { range: 0, coloured: 0 };
    const width = Math.min(canvas.width, 500); const height = Math.min(canvas.height, 500);
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let min = 255; let max = 0; let coloured = 0;
    for (let index = 0; index < pixels.length; index += 16) { min = Math.min(min, pixels[index], pixels[index + 1], pixels[index + 2]); max = Math.max(max, pixels[index], pixels[index + 1], pixels[index + 2]); if (Math.max(pixels[index], pixels[index + 1], pixels[index + 2]) - Math.min(pixels[index], pixels[index + 1], pixels[index + 2]) > 12) coloured += 1; }
    return { range: max - min, coloured };
  });
}

test.beforeAll(async () => { await mkdir(evidenceDir, { recursive: true }); });

test("new-space journey produces a checked quote and synchronised nonblank views", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Mara Quinn")).toBeVisible();
  await fillReadyStrengthPlan(page);
  await expect(page.locator(".equipment-row")).toHaveCount(6);
  await expect(page.locator(".placement-table tbody tr")).toHaveCount(2);

  const twoD = await canvasVariance(page, "[data-testid='planner-2d'] canvas");
  expect(twoD.range).toBeGreaterThan(30);
  expect(twoD.coloured).toBeGreaterThan(20);
  await page.screenshot({ path: resolve(evidenceDir, "desktop-plan-1440x900.png"), fullPage: true });

  await page.getByRole("tab", { name: "Quote" }).click();
  await expect(page.getByText("Budget headroom")).toBeVisible();
  await expect(page.locator(".quote-line")).not.toHaveCount(0);
  await page.screenshot({ path: resolve(evidenceDir, "desktop-quote-1440x900.png"), fullPage: true });

  await page.getByRole("button", { name: "3D room" }).click();
  const threeCanvas = page.locator("canvas[data-testid='three-canvas']");
  await expect(threeCanvas).toHaveAttribute("data-render-ready", "true");
  const threeD = await canvasVariance(page, "canvas[data-testid='three-canvas']");
  expect(threeD.range).toBeGreaterThan(25);
  expect(threeD.coloured).toBeGreaterThan(20);
  await page.screenshot({ path: resolve(evidenceDir, "desktop-3d-1440x900.png"), fullPage: true });
});

test("Mara refines a checked lifting plan one accessory at a time", async ({ page }) => {
  await page.goto("/");
  await fillReadyStrengthPlan(page, "new_space", "5000");
  await expect(page.locator(".equipment-row").filter({ hasText: "J-Hook" })).toBeVisible();
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/items/recommended") && response.ok()),
    page.getByRole("button", { name: "Add spotter arms" }).click(),
  ]);
  await expect(page.locator(".equipment-row").filter({ hasText: "Spotter Arms" })).toBeVisible();
  await expect(page.getByText(/plates are currently shown as a neat floor stack/)).toBeVisible();
  const storageResponse = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/items/recommended"));
  await page.getByRole("button", { name: "Add plate storage" }).click();
  const storageResult = await storageResponse;
  if (storageResult.ok()) {
    await expect(page.locator(".equipment-row").filter({ hasText: "Storage" })).toBeVisible();
    await expect(page.getByText(/updated the room view and quote/).last()).toBeVisible();
  } else {
    await expect(page.getByText(/does not pass the current room checks/)).toBeVisible();
    await expect(page.locator(".equipment-row").filter({ hasText: "Storage" })).toHaveCount(0);
  }
});

test("upgrade journey guides owned-equipment selection and applies a governed attachment", async ({ page }) => {
  await page.goto("/");
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/chat") && response.ok()),
    page.getByLabel("Planning journey", { exact: true }).getByRole("button", { name: "Upgrade equipment" }).click(),
  ]);
  await expect(page.getByText("Choose your equipment here")).toBeVisible();
  const room = page.locator(".room-fields");
  for (const [label, value] of [[/length/i, "4"], [/width/i, "3"], [/height/i, "2.4"]] as const) {
    await Promise.all([
      page.waitForResponse((response) => response.request().method() === "PATCH" && response.url().includes("/requirements") && response.ok()),
      room.getByRole("spinbutton", { name: label }).fill(value),
    ]);
  }
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/existing-equipment") && response.ok()),
    page.getByLabel("Northstar rack").selectOption("h30-half-rack-entry"),
  ]);
  await expect(page.locator(".confirmed-line")).toContainText("H30 Half Rack");
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/items/recommended") && response.ok()),
    page.getByRole("button", { name: "Spotter arms" }).click(),
  ]);
  await expect(page.locator(".equipment-row").filter({ hasText: "Spotter Arms" })).toBeVisible();
  await page.getByRole("tab", { name: "Quote" }).click();
  await expect(page.locator(".quote-line").filter({ hasText: "H30 Half Rack" })).toBeVisible();
});
test("an over-budget plan remains blocked until the exact shortfall is authorised", async ({ page }) => {
  await page.goto("/");
  await fillReadyStrengthPlan(page, "new_space", "500", "infeasible");
  await page.getByRole("tab", { name: "Quote" }).click();
  await expect(page.getByText("Outside the recorded hard cap")).toBeVisible();
  const consent = page.getByRole("button", { name: /^Allow exactly/ });
  await expect(consent).toBeVisible();
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/budget-consent") && response.ok()),
    page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/recommend") && response.ok()),
    consent.click(),
  ]);
  await expect(page.getByText("Current", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Exact exception recorded.")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Allow exactly/ })).toHaveCount(0);
  await page.screenshot({ path: resolve(evidenceDir, "desktop-exact-budget-consent-1440x900.png"), fullPage: true });
});

test("Mara can build a mobile plan from one natural-language message", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await page.getByLabel("Message Mara").fill("Plan a new gym in a 4m x 3m x 2.4m room with no obstruction. I am a beginner focused on strength and versatility with an EUR 2500 budget.");
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/chat") && response.ok()),
    page.getByRole("button", { name: "Send message" }).click(),
  ]);
  await expect(page.getByText("Current", { exact: true }).first()).toBeVisible();
  await expect(page.getByTestId("planner-2d")).toBeVisible();
  const mobileCanvas = await canvasVariance(page, "[data-testid='planner-2d'] canvas");
  await expect.poll(() => page.getByTestId("planner-2d").evaluate((host) => {
    const canvas = host.querySelector("canvas");
    if (!canvas) return false;
    const hostRect = host.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    return canvasRect.width <= hostRect.width + 1 && host.scrollWidth <= host.clientWidth + 1;
  })).toBe(true);
  expect(mobileCanvas.range).toBeGreaterThan(30);
  const toolbarFits = await page.locator(".canvas-toolbar").evaluate((toolbar) => ({ client: toolbar.clientWidth, scroll: toolbar.scrollWidth }));
  expect(toolbarFits.scroll).toBeLessThanOrEqual(toolbarFits.client + 1);
  expect(mobileCanvas.coloured).toBeGreaterThan(20);
  const metrics = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.viewport + 1);
  await page.screenshot({ path: resolve(evidenceDir, "mobile-room-360x800.png"), fullPage: true });
});

test("desktop and tablet breakpoints keep the primary workspace usable", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.getByText("Mara Quinn")).toBeVisible();
  let metrics = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.viewport + 1);
  await page.screenshot({ path: resolve(evidenceDir, "desktop-initial-1280x800.png"), fullPage: true });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.reload();
  await expect(page.getByRole("button", { name: "Plan and quote" })).toBeVisible();
  await page.getByRole("button", { name: "Plan and quote" }).click();
  await expect(page.getByText("Room", { exact: true }).first()).toBeVisible();
  metrics = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.viewport + 1);
  await page.screenshot({ path: resolve(evidenceDir, "tablet-plan-768x1024.png"), fullPage: true });
});

test("mobile remains usable without horizontal clipping and preserves all task tabs", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Planner sections" });
  await expect(navigation).toBeVisible();
  for (const name of ["Chat", "Plan", "Room", "Quote"]) await expect(navigation.getByRole("button", { name: new RegExp(`^${name}`) })).toBeVisible();
  const metrics = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.viewport + 1);
  await navigation.getByRole("button", { name: /^Plan/ }).click();
  await expect(page.getByText("Room", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: resolve(evidenceDir, "mobile-plan-360x800.png"), fullPage: true });
});

test("initial workspace has no serious automated accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Mara Quinn")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
});
