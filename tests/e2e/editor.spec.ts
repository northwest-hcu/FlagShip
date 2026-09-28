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
  for (const name of ["Library", "Tree", "Canvas"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(page.locator(".canvas-viewport [data-object-id]")).toHaveCount(0);
  await expect(page.locator("[data-library-kind]")).toHaveCount(17);
  await expect(page.locator('[data-library-kind="input"]')).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "コンポーネントの詳細", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Context slot", exact: true })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: "Overlay slot", exact: true })).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("heading", { name: /^(Flow|Inspector)$/ })).toHaveCount(0);
  await expect(page.locator(".resize-handle")).toHaveCount(1);
  const layers = page.getByRole("complementary", { name: "Library and Tree" });
  const canvas = page.getByRole("region", { name: "Canvas", exact: true });
  expect(await panelSize(canvas, "height")).toBe(await panelSize(layers, "height"));
  expect(errors).toEqual([]);
});

test("resizes the sidebar and canvas with the pointer", async ({ page }) => {
  const layers = page.getByRole("complementary", { name: "Library and Tree" });
  const canvas = page.getByRole("region", { name: "Canvas", exact: true });
  const layersWidth = await panelSize(layers, "width");
  const canvasWidth = await panelSize(canvas, "width");

  await dragBoundary(page, "LibraryとTreeの横幅を変更", 80, 0);
  await expect.poll(() => panelSize(layers, "width")).toBeCloseTo(layersWidth + 80, 0);
  await expect.poll(() => panelSize(canvas, "width")).toBeCloseTo(canvasWidth - 80, 0);
  await dragBoundary(page, "LibraryとTreeの横幅を変更", -80, 0);
  await expect.poll(() => panelSize(layers, "width")).toBeCloseTo(layersWidth, 0);
  await expect.poll(() => panelSize(canvas, "width")).toBeCloseTo(canvasWidth, 0);
});

test("resizes with arrow keys and keeps a usable minimum panel width", async ({ page }) => {
  const layers = page.getByRole("complementary", { name: "Library and Tree" });
  const canvas = page.getByRole("region", { name: "Canvas", exact: true });
  const layersWidth = await panelSize(layers, "width");
  const layersHandle = page.getByRole("button", { name: "LibraryとTreeの横幅を変更" });

  await layersHandle.press("ArrowLeft");
  await expect.poll(() => panelSize(layers, "width")).toBe(layersWidth - 16);
  for (let index = 0; index < 10; index += 1) await layersHandle.press("ArrowLeft");
  await expect.poll(() => panelSize(layers, "width")).toBe(240);
  await expect(page.getByRole("heading", { name: "Canvas", exact: true })).toBeVisible();
  for (let index = 0; index < 90; index += 1) await layersHandle.press("ArrowRight");
  await expect.poll(() => panelSize(canvas, "width")).toBe(480);
});
