import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => { await page.goto("/"); });

async function cursorPosition(page: Page): Promise<{ x: number; y: number }> {
  return page.locator(".virtual-cursor").evaluate((element) => ({
    x: Number.parseFloat((element as HTMLElement).style.left), y: Number.parseFloat((element as HTMLElement).style.top),
  }));
}

async function moveCursor(page: Page, x: number, y: number): Promise<void> {
  const start = await cursorPosition(page);
  for (const [delta, positive, negative] of [[x - start.x, "ArrowRight", "ArrowLeft"], [y - start.y, "ArrowDown", "ArrowUp"]] as const) {
    let remaining = Math.abs(delta);
    const key = delta >= 0 ? positive : negative;
    for (const [step, modifier] of [[48, "Shift+"], [12, ""], [2, "Alt+"]] as const) {
      while (remaining >= step) { await page.keyboard.press(modifier + key); remaining -= step; }
    }
  }
}

async function scrollPositions(page: Page): Promise<number[]> {
  return page.locator(".registry-scroll, .canvas-viewport").evaluateAll((elements) => elements.map((element) => element.scrollTop));
}

test("captures cursor arrows before Library scrolling and resize handlers, and restores normal keys when disabled", async ({ page }) => {
  const sample = page.getByRole("button", { name: "ボタンの見本", exact: true });
  await sample.focus();
  await page.keyboard.press("Control+Shift+P");
  const before = await cursorPosition(page);
  const scroll = await scrollPositions(page);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  expect(await cursorPosition(page)).toEqual({ x: before.x + 12, y: before.y + 12 });
  expect(await scrollPositions(page)).toEqual(scroll);
  const resize = page.getByRole("button", { name: "RegistryとTreeの横幅を変更" });
  await resize.focus();
  const width = (await page.locator("#tree-panel").boundingBox())!.width;
  await page.keyboard.press("ArrowRight");
  expect((await page.locator("#tree-panel").boundingBox())!.width).toBe(width);
  await page.keyboard.press("Control+Shift+P");
  await expect(page.locator(".virtual-cursor")).toHaveCount(0);
  await page.keyboard.press("ArrowRight");
  expect((await page.locator("#tree-panel").boundingBox())!.width).toBeGreaterThan(width);
});

test("places a grabbed Library item with cursor arrows and moves it between slots with Tab focus", async ({ page }) => {
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  const container = page.locator('.canvas-stage [data-object-id="container-1"]');
  const box = (await container.boundingBox())!;
  await page.getByRole("button", { name: "アイコンの見本", exact: true }).focus();
  await page.keyboard.press("Control+Shift+P");
  await page.keyboard.press("Control+Enter");
  await expect(page.locator(".virtual-cursor")).toHaveAttribute("data-grabbed", "true");
  const scroll = await scrollPositions(page);
  await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2);
  expect(await scrollPositions(page)).toEqual(scroll);
  await page.keyboard.press("Control+Enter");
  await expect(container.locator('[data-object-id="icon-2"]')).toBeVisible();
  await expect(page.locator(".virtual-cursor")).toHaveAttribute("data-grabbed", "false");
  await expect(page.locator("[data-layout-id], [data-layout-group-id]")).toHaveCount(0);

  await container.locator('[data-object-id="icon-2"]').focus();
  await page.keyboard.press("Control+Enter");
  await page.keyboard.press("Escape");
  await expect(container.locator('[data-object-id="icon-2"]')).toBeVisible();
  await expect(page.locator(".virtual-cursor")).toHaveAttribute("data-grabbed", "false");
  await container.locator('[data-object-id="icon-2"]').focus();
  await page.keyboard.press("Control+Enter");
  await page.getByRole("button", { name: "Overlay slot", exact: true }).focus();
  await page.keyboard.press("Control+Enter");
  await expect(page.locator('[data-canvas-root="overlay"] [data-object-id="icon-2"]')).toBeVisible();
  await expect(page.locator('[data-slot-owner="container-1"] [data-tree-node="icon-2"]')).toHaveCount(0);
});

test("uses Enter and click for the same selection and grabbed child placement", async ({ page }) => {
  await page.getByRole("button", { name: "テキストボックスを追加", exact: true }).click();
  const label = page.locator('.canvas-stage [data-object-id="textbox-1:label"]');
  await label.focus();
  await page.keyboard.press("Enter");
  await expect(label).toHaveClass(/selected/);
  await expect(page.getByRole("complementary", { name: "Comの詳細" })).toContainText("Text Com");
  await page.keyboard.press("Escape");
  await label.click();
  await expect(label).toHaveClass(/selected/);
  await expect(page.getByRole("complementary", { name: "Comの詳細" })).toContainText("Text Com");
  await page.keyboard.press("Escape");

  await label.focus();
  await page.keyboard.press("Control+Shift+P");
  await page.keyboard.press("Enter");
  await expect(label).toHaveClass(/selected/);
  const name = page.getByRole("complementary", { name: "Comの詳細" }).getByRole("textbox", { name: "Name", exact: true });
  const field = (await name.boundingBox())!;
  await moveCursor(page, field.x + field.width / 2, field.y + field.height / 2);
  await page.keyboard.press("Enter");
  await expect(name).toBeFocused();
  await page.keyboard.press("Control+Shift+P");
  await page.keyboard.press("Escape");

  await label.focus();
  await page.keyboard.press("Control+Enter");
  await page.getByRole("button", { name: "Overlay slot", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-canvas-root="overlay"] [data-object-id="textbox-1:label"]')).toBeVisible();
  await expect(page.locator('[data-slot-owner="textbox-1"] [data-tree-node="textbox-1:input"]')).toBeVisible();
  await page.locator('.canvas-stage [data-object-id="textbox-1:label"]').focus();
  await page.keyboard.press("Control+Enter");
  await page.locator('[data-slot-owner="textbox-1"][data-slot-key="children"] > .slot-heading').click();
  await expect(page.locator('.canvas-stage [data-object-id="textbox-1"] [data-object-id="textbox-1:label"]')).toBeVisible();
  await expect(page.locator('.canvas-stage [data-object-id="textbox-1"] [data-object-id="textbox-1:input"]')).toBeVisible();
});

test("places and moves Flow Nodes using the virtual cursor", async ({ page }) => {
  await page.getByRole("button", { name: "Flow", exact: true }).click();
  await page.getByRole("button", { name: "+ Flow", exact: true }).click();
  const board = (await page.locator(".flow-board").boundingBox())!;
  await page.getByRole("button", { name: "Conditionの見本", exact: true }).focus();
  await page.keyboard.press("Control+Shift+P");
  await page.keyboard.press("Control+Enter");
  await moveCursor(page, board.x + 260, board.y + 100);
  await page.keyboard.press("Control+Enter");
  const card = page.locator('[data-flow-node-id="flow-1-logic-condition-1"]');
  await expect(card).toBeVisible();
  const before = await card.evaluate((element) => ({ x: Number.parseFloat((element as HTMLElement).style.left), y: Number.parseFloat((element as HTMLElement).style.top) }));
  await card.locator(".flow-node-main").focus();
  await page.keyboard.press("Control+Enter");
  await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Control+Enter");
  const after = await card.evaluate((element) => ({ x: Number.parseFloat((element as HTMLElement).style.left), y: Number.parseFloat((element as HTMLElement).style.top) }));
  expect(after).toEqual({ x: before.x + 48, y: before.y + 12 });
  await expect(page.locator(".virtual-cursor")).toHaveAttribute("data-grabbed", "false");
});

test("scrolls the region under the cursor and reaches an offscreen Container while holding a Com", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.getByRole("button", { name: "テキストを追加", exact: true }).click();
  for (let index = 0; index < 7; index++) await page.getByRole("button", { name: "複数行入力を追加", exact: true }).click();
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  await page.getByRole("button", { name: "ボタンの見本", exact: true }).focus();
  await page.keyboard.press("Control+Shift+P");
  const libraryBefore = await page.locator(".registry-scroll").evaluate((element) => element.scrollTop);
  await page.keyboard.press("PageDown");
  expect(await page.locator(".registry-scroll").evaluate((element) => element.scrollTop)).toBeGreaterThan(libraryBefore);
  await page.keyboard.press("PageUp");
  await page.locator('.canvas-stage [data-object-id="text-1"]').focus();
  await page.keyboard.press("Control+Enter");
  const canvas = page.locator(".canvas-viewport");
  const bounds = (await canvas.boundingBox())!;
  const libraryScroll = await page.locator(".registry-scroll").evaluate((element) => element.scrollTop);
  await moveCursor(page, bounds.x + bounds.width / 2, bounds.y + bounds.height - 25);
  const before = await canvas.evaluate((element) => element.scrollTop);
  await page.keyboard.press("Shift+ArrowDown");
  expect(await canvas.evaluate((element) => element.scrollTop)).toBeGreaterThan(before);
  const container = page.locator('.canvas-stage [data-object-id="container-9"]');
  for (let index = 0; index < 30; index++) {
    const box = (await container.boundingBox())!;
    if (box.y + box.height < bounds.y + bounds.height - 20) break;
    await page.keyboard.press("Shift+ArrowDown");
  }
  const box = (await container.boundingBox())!;
  expect(box.y + box.height).toBeLessThan(bounds.y + bounds.height - 20);
  await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2);
  await page.keyboard.press("Control+Enter");
  await expect(container.locator('[data-object-id="text-1"]')).toBeVisible();
  expect(await page.locator(".registry-scroll").evaluate((element) => element.scrollTop)).toBe(libraryScroll);
});
