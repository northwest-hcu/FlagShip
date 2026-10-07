import { expect, test } from "@playwright/test";
import { openFields } from "./details-helpers";

test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("copies a selected Com with its child content and unique IDs", async ({ page }) => {
  await page.getByRole("button", { name: "ボタンを追加", exact: true }).click();
  await page.locator('[data-tree-node="button-1:text"]').click();
  await openFields(page, "value");
  await page.getByRole("complementary", { name: "Comの詳細" }).getByLabel("Text", { exact: true }).fill("保存");
  const original = page.locator('[data-tree-node="button-1"]');
  await original.click();
  await original.press("ControlOrMeta+C");
  await original.press("ControlOrMeta+V");
  await expect(page.locator('[data-tree-node="button-2"]')).toBeVisible();
  await expect(page.locator('[data-tree-node="button-2:text"]')).toBeVisible();
  await expect(page.locator('[data-object-id="button-2"] .component-button')).toHaveAccessibleName("保存");
  await expect(page.locator('[data-tree-node="button-2"]')).toHaveText("Button Com 01 Copy");
  await expect(page.getByRole("navigation", { name: /パンくず/ })).toHaveCount(0);
});

test("hides a Com only in the editor and restores it from Tree", async ({ page }) => {
  await page.getByRole("button", { name: "テキストを追加", exact: true }).click();
  const visibility = page.getByRole("button", { name: "Text Com 01を非表示", exact: true });
  await visibility.click();
  await expect(page.locator('.canvas-viewport [data-object-id="text-1"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.locator('.canvas-viewport [data-object-id="text-1"]')).toBeVisible();
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.locator('.canvas-viewport [data-object-id="text-1"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Text Com 01を表示", exact: true }).click();
  await expect(page.locator('.canvas-viewport [data-object-id="text-1"]')).toBeVisible();
});

test("renders a Text link in Preview and leaves unlinked Text as a span", async ({ page }) => {
  await page.getByRole("button", { name: "テキストを追加", exact: true }).click();
  await expect(page.locator('[data-object-id="text-1"] span.component-text')).toBeVisible();
  await page.locator('[data-tree-node="text-1"]').click();
  await openFields(page, "link");
  const link = page.getByRole("complementary", { name: "Comの詳細" }).getByLabel("Link", { exact: true });
  await link.fill("javascript:alert(1)");
  await expect(page.locator('[data-object-id="text-1"] a')).toHaveCount(0);
  await link.fill("https://example.com/docs");
  await expect(page.locator('[data-object-id="text-1"] a.component-text')).toHaveAttribute("href", "https://example.com/docs");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.locator('[data-object-id="text-1"] a.component-text')).toHaveAttribute("href", "https://example.com/docs");
});

test("copies a page with its children to a fresh path", async ({ page }) => {
  await page.getByRole("button", { name: "テキストを追加", exact: true }).click();
  const firstPage = page.getByRole("button", { name: "Page Com 01", exact: true });
  await firstPage.click();
  await firstPage.press("ControlOrMeta+C");
  await firstPage.press("ControlOrMeta+V");
  await expect(page.locator('[data-page-id="page-2"] [data-tree-node="text-2"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Page Com 01 Copy", exact: true })).toBeVisible();
  await expect(page.locator('[data-canvas-root="context"] [data-object-id="text-2"]')).toBeVisible();
  await expect(page.locator('.canvas-root')).toContainText("/page-2");
});

test("deletes a selected page and keeps a usable page when deleting the last one", async ({ page }) => {
  await page.getByRole("button", { name: "ページを追加", exact: true }).click();
  await page.getByRole("button", { name: "Page Com 02", exact: true }).click();
  await page.getByRole("button", { name: "選択したオブジェクトを削除", exact: true }).click();
  await expect(page.locator('[data-page-id="page-2"]')).toHaveCount(0);
  await expect(page.locator('[data-page-id="page-1"]')).toBeVisible();
  await page.getByRole("button", { name: "Page Com 01", exact: true }).click();
  await page.keyboard.press("Delete");
  await expect(page.locator('[data-page-id="page-1"]')).toHaveCount(0);
  await expect(page.locator('[data-page-id="page-3"]')).toBeVisible();
  await expect(page.locator('[data-canvas-root="context"]')).toBeVisible();
});
