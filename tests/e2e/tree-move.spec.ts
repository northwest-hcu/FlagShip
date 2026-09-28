import { expect, test, type Locator, type Page } from "@playwright/test";
import { openFields } from "./details-helpers";

const node = (page: Page, id: string) => page.locator('[data-tree-node="' + id + '"]');
const object = (page: Page, id: string) => page.locator('.canvas-stage [data-object-id="' + id + '"]');
const slot = (page: Page, owner: string, key: string) => page.locator('[data-slot-owner="' + owner + '"][data-slot-key="' + key + '"]');
const details = (page: Page) => page.getByRole("complementary", { name: "コンポーネントの詳細", exact: true });

async function order(source: Locator, target: Locator, direction: "above" | "below"): Promise<void> {
  const box = await target.boundingBox();
  if (!box) throw new Error("Missing tree row");
  await source.dragTo(target, { targetPosition: { x: box.width / 2, y: direction === "above" ? 2 : box.height - 2 } });
}
async function ids(locator: Locator): Promise<string[]> {
  return locator.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-tree-node")!));
}

test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("aligns both slot frame edges with the parent component background", async ({ page }, testInfo) => {
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  await page.locator('[data-library-kind="button"]').dragTo(page.getByRole("button", { name: "Container Component 01 Children slot", exact: true }));
  const pairs = [
    [page.getByRole("button", { name: "Page Component 01", exact: true }), slot(page, "page-1", "context")],
    [page.getByRole("button", { name: "Page Component 01", exact: true }), slot(page, "page-1", "overlay")],
    [node(page, "container-1"), slot(page, "container-1", "children")],
    [node(page, "button-2"), slot(page, "button-2", "contents")],
  ];
  for (const [parent, frame] of pairs) {
    const parentBox = await parent.boundingBox(), frameBox = await frame.boundingBox();
    if (!parentBox || !frameBox) throw new Error("Missing parent component or slot frame");
    expect(frameBox.x).toBeCloseTo(parentBox.x, 2);
    expect(frameBox.x + frameBox.width).toBeCloseTo(parentBox.x + parentBox.width, 2);
  }
  const heading = slot(page, "button-2", "contents").locator(".slot-label");
  const child = node(page, "button-2:text").locator("span").first();
  const labelStart = await heading.evaluate((element) => element.getBoundingClientRect().left + parseFloat(getComputedStyle(element).paddingLeft));
  expect((await child.boundingBox())?.x).toBeCloseTo(labelStart, 0);
  await page.locator(".page-tree").screenshot({ path: testInfo.outputPath("tree-alignment.png") });
});

test("reorders root rows in both directions and places library items before a row", async ({ page }) => {
  for (const name of ["テキスト", "アイコン", "テキスト"]) await page.getByRole("button", { name: name + "を追加", exact: true }).click();
  const rows = page.locator('#page-1-context-tree [data-tree-node][data-tree-depth="0"]');
  await order(node(page, "text-3"), node(page, "text-1"), "above");
  expect(await ids(rows)).toEqual(["text-3", "text-1", "icon-2"]);
  await order(node(page, "text-3"), node(page, "icon-2"), "below");
  expect(await ids(rows)).toEqual(["text-1", "icon-2", "text-3"]);
  await order(page.locator('[data-library-kind="button"]'), node(page, "text-1"), "above");
  expect(await ids(rows)).toEqual(["button-4", "text-1", "icon-2", "text-3"]);
  const before = await object(page, "button-4").boundingBox(), after = await object(page, "text-1").boundingBox();
  if (!before || !after) throw new Error("Missing reordered objects");
  expect(before.y + before.height).toBeLessThan(after.y);
  await expect(page.locator("[data-drop-order], .drop-active")).toHaveCount(0);
});

test("reorders children while preserving the container's horizontal direction", async ({ page }) => {
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  const destination = page.getByRole("button", { name: "Container Component 01 Children slot", exact: true });
  for (const kind of ["button", "icon", "text"]) await page.locator('[data-library-kind="' + kind + '"]').dragTo(destination);
  await node(page, "container-1").click();
  await openFields(page, "direction");
  await details(page).getByRole("group", { name: "Direction", exact: true }).getByRole("button", { name: "横並び", exact: true }).click();
  await order(node(page, "text-4"), node(page, "button-2"), "above");
  expect(await ids(slot(page, "container-1", "children").locator('[data-tree-depth="1"]'))).toEqual(["text-4", "button-2", "icon-3"]);
  const boxes = await Promise.all(["text-4", "button-2", "icon-3"].map((id) => object(page, id).boundingBox()));
  for (let index = 1; index < boxes.length; index++) {
    const before = boxes[index - 1], after = boxes[index];
    if (!before || !after) throw new Error("Missing horizontal children");
    expect(after.x).toBeGreaterThan(before.x + before.width);
    expect(after.y).toBe(before.y);
  }
  await node(page, "container-1").click();
  await openFields(page, "direction");
  await expect(details(page).getByRole("group", { name: "Direction", exact: true }).getByRole("button", { name: "横並び", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("detaches typed slot contents around the parent and moves them back without losing edits", async ({ page }) => {
  await page.getByRole("button", { name: "ボタンを追加", exact: true }).click();
  await node(page, "button-1:text").click();
  await openFields(page, "value");
  await details(page).getByLabel("Text", { exact: true }).fill("移動しても保持");
  await order(node(page, "button-1:text"), node(page, "button-1"), "above");
  await expect(slot(page, "button-1", "contents").locator(".slot-empty")).toHaveText("Empty slot");
  expect(await ids(page.locator('#page-1-context-tree [data-tree-depth="0"]'))).toEqual(["button-1:text", "button-1"]);
  await expect(object(page, "button-1:text")).toHaveText("移動しても保持");
  await node(page, "button-1:text").dragTo(slot(page, "button-1", "contents").locator(".slot-empty"));
  await expect(slot(page, "button-1", "contents").locator('[data-tree-node="button-1:text"]')).toBeVisible();
  await expect(object(page, "button-1").getByRole("button", { name: "移動しても保持", exact: true })).toBeVisible();
  await page.locator('[data-library-kind="icon"]').dragTo(slot(page, "button-1", "contents").locator("> .slot-heading"));
  await order(node(page, "icon-2"), node(page, "button-1"), "below");
  await expect(slot(page, "button-1", "contents").locator('[data-tree-node="icon-2"]')).toHaveCount(0);
  expect(await ids(page.locator('#page-1-context-tree [data-tree-depth="0"]'))).toEqual(["button-1", "icon-2"]);
});

test("moves out of nested slots to a root, across pages, and rejects cycles and incompatible slots", async ({ page }) => {
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  await page.locator('[data-library-kind="container"]').dragTo(page.getByRole("button", { name: "Container Component 01 Children slot", exact: true }));
  await page.locator('[data-library-kind="button"]').dragTo(page.getByRole("button", { name: "Container Component 02 Children slot", exact: true }));
  await order(node(page, "container-1"), node(page, "button-3"), "above");
  await expect(slot(page, "container-1", "children").locator('[data-tree-node="container-2"]')).toBeVisible();
  await node(page, "container-2").dragTo(page.getByRole("button", { name: "Button Component 03 Contents slot", exact: true }));
  await expect(slot(page, "container-1", "children").locator('[data-tree-node="container-2"]')).toBeVisible();
  await node(page, "button-3").dragTo(page.getByRole("button", { name: "Overlay slot", exact: true }));
  await expect(slot(page, "container-2", "children").locator(".slot-empty")).toHaveText("Empty slot");
  await expect(page.locator('#page-1-overlay-tree [data-tree-depth="0"]')).toHaveCount(1);
  await page.getByRole("button", { name: "ページを追加", exact: true }).click();
  await page.locator('[data-page-id="page-2"]').getByRole("button", { name: "Context slot", exact: true }).click();
  await page.getByRole("button", { name: "テキストを追加", exact: true }).click();
  await order(node(page, "button-3"), node(page, "text-4"), "above");
  expect(await ids(page.locator('#page-2-context-tree [data-tree-depth="0"]'))).toEqual(["button-3", "text-4"]);
  await expect(page.locator('#page-1-overlay-tree [data-tree-node]')).toHaveCount(0);
  await expect(object(page, "button-3").getByRole("button", { name: "ボタン", exact: true })).toBeVisible();
});
