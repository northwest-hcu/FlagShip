import { expect, test, type Locator, type Page } from "@playwright/test";

async function panelSize(panel: Locator, dimension: "width" | "height"): Promise<number> {
  const box = await panel.boundingBox();
  if (!box) throw new Error("Editor panel is missing.");
  return box[dimension];
}

async function dragBoundary(
  page: Page,
  name: string,
  deltaX: number,
  deltaY: number,
): Promise<void> {
  const handle = page.getByRole("button", { name, exact: true });
  const box = await handle.boundingBox();
  if (!box) throw new Error("Resize handle is missing.");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + deltaX, y + deltaY, { steps: 8 });
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "FlagShip", exact: true })).toBeVisible();
});

test("shows an empty editor frame", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.reload();
  for (const name of ["Registry", "Tree", "Canvas"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(page.locator(".canvas-viewport [data-object-id]")).toHaveCount(0);
  await expect(page.locator("[data-library-kind]")).toHaveCount(17);
  await expect(page.locator('[data-library-kind="input"]')).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Comの詳細", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Context slot", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: "Overlay slot", exact: true })).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("heading", { name: /^(Flow|Inspector)$/ })).toHaveCount(0);
  await expect(page.locator(".resize-handle")).toHaveCount(2);
  const layers = page.getByRole("complementary", { name: "Registry and Tree" });
  const canvas = page.getByRole("region", { name: "Canvas", exact: true });
  expect(await panelSize(canvas, "height")).toBe(await panelSize(layers, "height"));
  expect(errors).toEqual([]);
});

test("switches among Canvas, Flow, vertical split, and horizontal split without losing either editor", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: "編集画面" }).getByRole("button")).toHaveCount(4);
  await page.getByRole("button", { name: "上下分割" }).click();
  const canvasPane = page.locator(".canvas-pane");
  const flowPane = page.locator(".flow-pane");
  await expect(canvasPane).toBeVisible();
  await expect(flowPane).toBeVisible();
  let canvasBox = (await canvasPane.boundingBox())!;
  let flowBox = (await flowPane.boundingBox())!;
  expect(flowBox.y).toBeGreaterThan(canvasBox.y + canvasBox.height);
  await flowPane.locator(".canvas-toolbar").click();
  await expect(page.locator(".library-context")).toHaveText("Flow Library");
  await page.getByRole("button", { name: "+ Flow", exact: true }).click();
  await page.locator('[data-flow-node-kind="trigger.schedule"]').getByRole("button", { name: "Schedule Triggerを追加" }).click();

  await page.getByRole("button", { name: "左右分割" }).click();
  canvasBox = (await canvasPane.boundingBox())!;
  flowBox = (await flowPane.boundingBox())!;
  expect(flowBox.x).toBeGreaterThan(canvasBox.x + canvasBox.width);
  await canvasPane.locator(".canvas-toolbar").click();
  await expect(page.locator(".library-context")).toHaveText("Canvas Library");
  await page.getByRole("button", { name: "テキストを追加", exact: true }).click();
  await expect(canvasPane.locator('[data-object-id="text-1"]')).toBeVisible();
  await expect(flowPane.locator(".flow-node-block")).toHaveCount(1);

  await page.getByRole("button", { name: "Flow", exact: true }).click();
  await expect(canvasPane).toHaveCount(0);
  await expect(flowPane.locator(".flow-node-block")).toHaveCount(1);
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  await expect(flowPane).toHaveCount(0);
  await expect(canvasPane.locator('[data-object-id="text-1"]')).toBeVisible();
});

test("resizes both split boundaries with pointer and keyboard while keeping panes usable", async ({ page }) => {
  const canvasPane = page.locator(".canvas-pane");
  const flowPane = page.locator(".flow-pane");

  await page.getByRole("button", { name: "左右分割" }).click();
  const originalWidth = await panelSize(canvasPane, "width");
  await dragBoundary(page, "CanvasとFlowの幅を変更", 80, 0);
  await expect.poll(() => panelSize(canvasPane, "width")).toBeCloseTo(originalWidth + 80, 0);
  const widthHandle = page.getByRole("button", { name: "CanvasとFlowの幅を変更" });
  await widthHandle.press("ArrowLeft");
  await expect.poll(() => panelSize(canvasPane, "width")).toBeCloseTo(originalWidth + 64, 0);
  await dragBoundary(page, "CanvasとFlowの幅を変更", 1000, 0);
  await expect.poll(() => panelSize(flowPane, "width")).toBeGreaterThanOrEqual(240);
  expect(await panelSize(flowPane, "width")).toBeLessThan(originalWidth);

  await page.getByRole("button", { name: "上下分割" }).click();
  const originalHeight = await panelSize(canvasPane, "height");
  await dragBoundary(page, "CanvasとFlowの高さを変更", 0, 65);
  await expect.poll(() => panelSize(canvasPane, "height")).toBeCloseTo(originalHeight + 65, 0);
  const heightHandle = page.getByRole("button", { name: "CanvasとFlowの高さを変更" });
  await heightHandle.press("ArrowUp");
  await expect.poll(() => panelSize(canvasPane, "height")).toBeCloseTo(originalHeight + 49, 0);
  await dragBoundary(page, "CanvasとFlowの高さを変更", 0, -1000);
  await expect.poll(() => panelSize(canvasPane, "height")).toBeGreaterThanOrEqual(170);

  await page.getByRole("button", { name: "左右分割" }).click();
  await expect.poll(() => panelSize(flowPane, "width")).toBeGreaterThanOrEqual(240);
  await page.setViewportSize({ width: 900, height: 720 });
  await expect.poll(() => panelSize(flowPane, "width")).toBeGreaterThanOrEqual(240);
});

test("resizes the sidebar and canvas with the pointer", async ({ page }) => {
  const layers = page.getByRole("complementary", { name: "Registry and Tree" });
  const canvas = page.getByRole("region", { name: "Canvas", exact: true });
  const layersWidth = await panelSize(layers, "width");
  const canvasWidth = await panelSize(canvas, "width");

  await dragBoundary(page, "RegistryとTreeの横幅を変更", 80, 0);
  await expect.poll(() => panelSize(layers, "width")).toBeCloseTo(layersWidth + 80, 0);
  await expect.poll(() => panelSize(canvas, "width")).toBeCloseTo(canvasWidth - 80, 0);
  await dragBoundary(page, "RegistryとTreeの横幅を変更", -80, 0);
  await expect.poll(() => panelSize(layers, "width")).toBeCloseTo(layersWidth, 0);
  await expect.poll(() => panelSize(canvas, "width")).toBeCloseTo(canvasWidth, 0);
});

test("resizes with arrow keys and keeps a usable minimum panel width", async ({ page }) => {
  const layers = page.getByRole("complementary", { name: "Registry and Tree" });
  const canvas = page.getByRole("region", { name: "Canvas", exact: true });
  const layersWidth = await panelSize(layers, "width");
  const layersHandle = page.getByRole("button", { name: "RegistryとTreeの横幅を変更" });

  await layersHandle.press("ArrowLeft");
  await expect.poll(() => panelSize(layers, "width")).toBe(layersWidth - 16);
  for (let index = 0; index < 10; index += 1) await layersHandle.press("ArrowLeft");
  await expect.poll(() => panelSize(layers, "width")).toBe(240);
  await expect(page.getByRole("heading", { name: "Canvas", exact: true })).toBeVisible();
  for (let index = 0; index < 90; index += 1) await layersHandle.press("ArrowRight");
  await expect.poll(() => panelSize(canvas, "width")).toBe(480);
});

test("changes the Registry and Tree height ratio with pointer and keyboard", async ({ page }) => {
  const library = page.locator(".registry-section");
  const tree = page.locator(".tree-section");
  const original = await panelSize(library, "height");
  await dragBoundary(page, "RegistryとTreeの高さの割合を変更", 0, 70);
  await expect.poll(() => panelSize(library, "height")).toBeGreaterThan(original + 50);
  await expect.poll(() => panelSize(tree, "height")).toBeLessThan((await panelSize(page.locator("#tree-panel"), "height")) - original - 50);
  const handle = page.getByRole("button", { name: "RegistryとTreeの高さの割合を変更" });
  const enlarged = await panelSize(library, "height");
  await handle.press("ArrowUp");
  await expect.poll(() => panelSize(library, "height")).toBeLessThan(enlarged);
});

test("collapses Library and Tree independently and restores their widths", async ({ page }) => {
  const layers = page.getByRole("complementary", { name: "Registry and Tree" });
  const width = await panelSize(layers, "width");
  await page.getByRole("button", { name: "Libraryを縮小" }).click();
  await expect(page.locator("#registry-content")).toBeHidden();
  await expect(page.locator("#tree-content")).toBeVisible();
  await expect(page.getByRole("button", { name: "RegistryとTreeの高さの割合を変更" })).toBeHidden();
  await page.getByRole("button", { name: "Treeを縮小" }).click();
  await expect.poll(() => panelSize(layers, "width")).toBe(48);
  await expect(page.getByRole("button", { name: "RegistryとTreeの横幅を変更" })).toBeHidden();
  await page.getByRole("button", { name: "Flow", exact: true }).click();
  await page.getByRole("button", { name: "Libraryを展開" }).click();
  await expect.poll(() => panelSize(layers, "width")).toBe(width);
  await expect(page.locator(".library-context")).toHaveText("Flow Library");
  await expect(page.locator("#tree-content")).toBeHidden();
  await page.getByRole("button", { name: "Treeを展開" }).click();
  await expect(page.getByRole("button", { name: "RegistryとTreeの高さの割合を変更" })).toBeVisible();
});
