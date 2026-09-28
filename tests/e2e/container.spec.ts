import { expect, test, type Page } from "@playwright/test";
import { openFields } from "./details-helpers";
const object = (page: Page, id: string) => page.locator('.canvas-stage [data-object-id="' + id + '"]');
const details = (page: Page) => page.getByRole("complementary", { name: "コンポーネントの詳細", exact: true });
test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("fits contents and applies numeric padding/margin in Canvas and Preview", async ({ page }) => {
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  await page.locator('[data-library-kind="icon"]').dragTo(page.getByRole("button", { name: "Container Component 01 Children slot", exact: true }));
  await page.locator('[data-tree-node="container-1"]').click();
  await openFields(page, "padding", "margin");
  const container = object(page, "container-1").locator("> .component-container");
  await expect(details(page).getByLabel("Padding", { exact: true })).toHaveValue("10");
  await expect(details(page).getByLabel("Margin", { exact: true })).toHaveValue("10");
  await expect(container).toHaveCSS("padding", "10px"); await expect(container).toHaveCSS("margin", "10px");
  const child = await object(page, "icon-2").boundingBox();
  const box = await container.boundingBox();
  if (!child || !box) throw new Error("Missing container contents");
  expect(box.width).toBeCloseTo(child.width + 20);
  expect(box.height).toBeCloseTo(child.height + 20);
  await details(page).getByLabel("Padding", { exact: true }).fill("0");
  await details(page).getByLabel("Margin", { exact: true }).fill("0");
  await expect(container).toHaveCSS("padding", "0px"); await expect(container).toHaveCSS("margin", "0px");
  expect((await container.boundingBox())?.width).toBeCloseTo(child.width);
  await details(page).getByLabel("Padding", { exact: true }).fill("12.5");
  await details(page).getByLabel("Margin", { exact: true }).fill("20");
  await expect(container).toHaveCSS("padding", "12.5px"); await expect(container).toHaveCSS("margin", "20px");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(container).toHaveCSS("padding", "12.5px"); await expect(container).toHaveCSS("margin", "20px");
});

test("changes both directions even after drag placement creates layout groups", async ({ page }) => {
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  const slot = page.getByRole("button", { name: "Container Component 01 Children slot", exact: true });
  await page.locator('[data-library-kind="button"]').dragTo(slot);
  await page.locator('[data-library-kind="icon"]').dragTo(slot);
  await page.locator('[data-tree-node="container-1"]').click();
  await openFields(page, "direction");
  await details(page).getByRole("group", { name: "Direction", exact: true }).getByRole("button", { name: "横並び", exact: true }).click();
  const target = object(page, "icon-3");
  const targetBox = await target.boundingBox();
  if (!targetBox) throw new Error("Missing target");
  await page.locator('[data-library-kind="text"]').dragTo(target, { targetPosition: { x: targetBox.width / 2, y: 2 } });
  await page.locator('[data-tree-node="container-1"]').click();
  await openFields(page, "direction");
  for (const label of ["縦並び", "横並び", "縦並び", "横並び"]) {
    await details(page).getByRole("group", { name: "Direction", exact: true }).getByRole("button", { name: label, exact: true }).click();
    const boxes = await Promise.all(["button-2", "text-4", "icon-3"].map((id) => object(page,id).boundingBox()));
    for (let index = 1; index < boxes.length; index++) {
      const before = boxes[index - 1], after = boxes[index];
      if (!before || !after) throw new Error("Missing child");
      if (label === "横並び") { expect(after.x).toBeGreaterThan(before.x + before.width); expect(after.y).toBe(before.y); }
      else { expect(after.y).toBeGreaterThan(before.y + before.height); expect(after.x).toBe(before.x); }
    }
  }
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  const container = object(page, "container-1").locator("> .component-container");
  await expect(container).toHaveCSS("flex-direction", "row");
});
