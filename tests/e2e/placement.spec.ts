import { expect, test, type Locator, type Page } from "@playwright/test";

type Direction = "above" | "below" | "left" | "right" | "inside";

function object(page: Page, id: string): Locator {
  return page.locator(`.canvas-stage [data-object-id="${id}"]`);
}

async function drag(source: Locator, target: Locator, direction: Direction): Promise<void> {
  const box = await target.boundingBox();
  if (!box) throw new Error("Drop target is missing");
  const positions = {
    above: { x: box.width / 2, y: 2 },
    below: { x: box.width / 2, y: box.height - 2 },
    left: { x: 2, y: box.height / 2 },
    right: { x: box.width - 2, y: box.height / 2 },
    inside: { x: box.width / 2, y: box.height / 2 },
  };
  await source.dragTo(target, { targetPosition: positions[direction] });
}

async function add(page: Page, name: string): Promise<void> {
  await page.getByRole("button", { name: `${name}を追加`, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("drags all five component types from their library previews into Context slot", async ({ page }) => {
  for (const [index, kind] of ["button", "container", "textbox", "image", "icon"].entries()) {
    const stage = page.locator('[data-canvas-root="context"]');
    const box = await stage.boundingBox();
    if (!box) throw new Error("Canvas is missing");
    await page.locator(`[data-library-kind="${kind}"]`).dragTo(stage, { targetPosition: { x: box.width - 24, y: box.height - 24 } });
    await expect(object(page, `${kind}-${index + 1}`)).toBeVisible();
  }
  await expect(page.locator('#page-1-context-tree [data-tree-node][data-tree-depth="0"]')).toHaveCount(5);
  await expect(page.locator("#page-1-overlay-tree [data-tree-node]")).toHaveCount(0);
  await expect(object(page, "button-1").getByRole("button", { name: "ボタン", exact: true })).toBeVisible();
  await expect(object(page, "textbox-3").getByLabel("テキストボックス")).toBeVisible();
  await expect(object(page, "image-4").getByRole("img")).toHaveAttribute("alt", "山と太陽を描いたサンプル画像");
  await expect(object(page, "icon-5").getByRole("img", { name: "情報" })).toBeVisible();
});

for (const direction of ["above", "below", "left", "right"] as const) {
  test(`places ${direction} with the matching geometry and tree order`, async ({ page }) => {
    await add(page, "ボタン");
    await drag(page.locator('[data-library-kind="icon"]'), object(page, "button-1"), direction);
    const target = object(page, "button-1");
    const inserted = object(page, "icon-2");
    await expect(inserted).toBeVisible();
    const first = await target.boundingBox();
    const second = await inserted.boundingBox();
    if (!first || !second) throw new Error("Placed object is missing");
    if (direction === "above") expect(second.y + second.height).toBeLessThan(first.y);
    if (direction === "below") expect(second.y).toBeGreaterThan(first.y + first.height);
    if (direction === "left") expect(second.x + second.width).toBeLessThan(first.x);
    if (direction === "right") expect(second.x).toBeGreaterThan(first.x + first.width);
    expect(await page.locator('#page-1-context-tree [data-tree-node][data-tree-depth="0"]').evaluateAll((elements) => elements.map((element) => element.getAttribute("data-tree-node"))))
      .toEqual(direction === "above" || direction === "left" ? ["icon-2", "button-1"] : ["button-1", "icon-2"]);
  });
}

test("nests inside a container and removes only editing guides in Preview", async ({ page }) => {
  await add(page, "コンテナ");
  await drag(page.locator('[data-library-kind="textbox"]'), object(page, "container-1"), "inside");
  await expect(object(page, "container-1").locator('[data-object-id="textbox-2"]')).toBeVisible();
  await expect(page.locator('#page-1-context-tree [data-slot-owner="container-1"] [data-tree-node="textbox-2"]')).toBeVisible();
  await expect(object(page, "container-1")).toHaveCSS("outline-style", "dashed");
  const editingBox = await object(page, "container-1").boundingBox();
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(object(page, "container-1")).toHaveCSS("outline-style", "none");
  expect(await object(page, "container-1").boundingBox()).toEqual(editingBox);
  await object(page, "textbox-2").getByLabel("テキストボックス").fill("入力できます");
  await expect(object(page, "textbox-2").getByLabel("テキストボックス")).toHaveValue("入力できます");
  await expect(object(page, "textbox-2").locator("input")).toHaveCSS("border-top-style", "solid");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(object(page, "container-1")).toHaveClass(/editing/);
});

test("keeps Context and Overlay contents independent and previews both slots", async ({ page }) => {
  await add(page, "ボタン");
  await page.getByRole("button", { name: "Overlay slot", exact: true }).click();
  await expect(object(page, "button-1")).toHaveCount(0);
  await add(page, "アイコン");
  await expect(object(page, "icon-2")).toBeVisible();
  await page.getByRole("button", { name: "Context slot", exact: true }).click();
  await expect(object(page, "button-1")).toBeVisible();
  await expect(object(page, "icon-2")).toHaveCount(0);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(object(page, "button-1")).toBeVisible();
  await expect(page.locator('.overlay-surface [data-object-id="icon-2"]')).toBeVisible();
});

test("moves a placed component into a container and rejects a cyclic move", async ({ page }) => {
  await add(page, "ボタン");
  await add(page, "コンテナ");
  await drag(object(page, "button-1"), object(page, "container-2"), "inside");
  await expect(object(page, "container-2").locator('[data-object-id="button-1"]')).toBeVisible();
  await drag(page.locator('[data-library-kind="container"]'), object(page, "container-2"), "inside");
  await expect(object(page, "container-2").locator('[data-object-id="container-3"]')).toBeVisible();
  await drag(page.locator('[data-tree-node="container-2"]'), object(page, "container-3"), "inside");
  await expect(object(page, "container-2").locator('[data-object-id="container-3"]')).toBeVisible();
  await expect(page.locator(".canvas-stage [data-object-id]")).toHaveCount(3);
});

test("moves a whole container to Overlay and deletes its children with it", async ({ page }) => {
  await add(page, "コンテナ");
  await drag(page.locator('[data-library-kind="button"]'), object(page, "container-1"), "inside");
  await page.locator('[data-tree-node="container-1"]').dragTo(page.getByRole("button", { name: "Overlay slot", exact: true }));
  await expect(page.locator('[data-canvas-root="overlay"]')).toBeVisible();
  await expect(object(page, "container-1").locator('[data-object-id="button-2"]')).toBeVisible();
  await expect(page.locator('#page-1-context-tree [data-tree-node][data-tree-depth="0"]')).toHaveCount(0);
  await page.getByRole("button", { name: "選択したオブジェクトを削除", exact: true }).click();
  await expect(page.locator(".canvas-stage [data-object-id]")).toHaveCount(0);
  await expect(page.locator("#page-1-overlay-tree [data-tree-node]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "選択したオブジェクトを削除", exact: true })).toBeDisabled();
});
