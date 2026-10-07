import { expect, test, type Page, type Locator } from "@playwright/test";
import { openFields } from "./details-helpers";
const tree = (page: Page, id: string) => page.locator('[data-tree-node="' + id + '"]');
const button = (page: Page, id: string) => page.locator('.canvas-stage [data-object-id="' + id + '"] .component-button');
const contents = (page: Page, id: string) => page.locator('[data-slot-owner="' + id + '"][data-slot-key="contents"] > .slot-heading');
async function before(source: Locator, target: Locator): Promise<void> {
  const box = await target.boundingBox(); if (!box) throw new Error("Missing row");
  await source.dragTo(target, { targetPosition: { x: box.width / 2, y: 2 } });
}
test.beforeEach(async ({ page }) => { await page.goto("/"); });
test("supports text, image, icon-only and mixed content in ordered arrays", async ({ page }) => {
  const library = page.locator('[data-library-kind="button"]');
  await expect(library.locator(".component-icon")).toHaveCount(0);
  await expect(library.locator(".toggle-group")).toHaveCount(0);
  await page.getByRole("button", { name: "ボタンを追加", exact: true }).click();
  await expect(button(page, "button-1")).toHaveAccessibleName("ボタン");
  await expect(button(page, "button-1")).toHaveCSS("min-width", "96px");
  await expect(button(page, "button-1")).toHaveCSS("min-height", "48px");
  await expect(button(page, "button-1")).toHaveCSS("padding", "8px 16px");
  const defaultBox = await button(page, "button-1").boundingBox();
  expect(defaultBox?.width).toBeGreaterThanOrEqual(96);
  expect(defaultBox?.height).toBeGreaterThanOrEqual(48);
  await page.locator('[data-library-kind="icon"]').dragTo(contents(page, "button-1"));
  await page.locator('[data-library-kind="image"]').dragTo(contents(page, "button-1"));
  expect(await button(page, "button-1").locator("[data-button-content]").evaluateAll((elements) => elements.map((element) => element.getAttribute("data-button-content")))).toEqual(["button-1:text", "icon-2", "image-3"]);
  await before(tree(page, "icon-2"), tree(page, "button-1:text"));
  await expect(button(page, "button-1").locator("[data-button-content]").first()).toHaveAttribute("data-button-content", "icon-2");
  await tree(page, "button-1:text").click(); await page.getByRole("button", { name: "選択したオブジェクトを削除", exact: true }).click();
  await tree(page, "image-3").click(); await page.getByRole("button", { name: "選択したオブジェクトを削除", exact: true }).click();
  await expect(button(page, "button-1")).toHaveAccessibleName("情報");
  await expect(button(page, "button-1").locator(".component-icon")).toHaveAttribute("aria-hidden", "true");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(button(page, "button-1").locator(".component-icon")).toBeVisible();
  await expect(button(page, "button-1").locator(".component-text")).toHaveCount(0);
});
test("keeps content and its order while moving a whole button to Overlay", async ({ page }) => {
  await page.getByRole("button", { name: "ボタンを追加", exact: true }).click();
  await page.locator('[data-library-kind="image"]').dragTo(contents(page, "button-1"));
  await before(tree(page, "image-2"), tree(page, "button-1:text"));
  await tree(page, "button-1:text").click();
  await openFields(page, "value");
  await page.getByRole("complementary", { name: "Comの詳細", exact: true }).getByLabel("Text", { exact: true }).fill("ロゴ付き");
  await page.getByRole("button", { name: "Button Com 01の枝を開閉", exact: true }).click();
  await tree(page, "button-1").dragTo(page.getByRole("button", { name: "Overlay slot", exact: true }));
  await expect(button(page, "button-1")).toHaveAccessibleName("ロゴ付き");
  await expect(button(page, "button-1").locator("[data-button-content]").first()).toHaveAttribute("data-button-content", "image-2");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(button(page, "button-1").locator(".component-image")).toBeVisible();
});
