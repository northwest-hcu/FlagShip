import { expect, test, type Page } from "@playwright/test";
import { openFields } from "./details-helpers";
const treeNode = (page: Page, id: string) => page.locator('[data-tree-node="' + id + '"]');
const branch = (page: Page, label: string) => page.getByRole("button", { name: label + "の枝を開閉", exact: true });
test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("keeps component names two lines high and truncates overflow", async ({ page }) => {
  const libraryName = page.locator('[data-library-kind="text"] .component-name-label');
  await expect(libraryName).toHaveCSS("-webkit-line-clamp", "2");
  await page.getByRole("button", { name: "テキストを追加", exact: true }).click();
  const row = treeNode(page, "text-1");
  const name = row.locator(".component-name-label");
  const shortHeight = await row.evaluate((element) => element.getBoundingClientRect().height);
  const longName = "長いコンポーネント名".repeat(12);
  await row.click();
  await openFields(page, "name");
  await page.getByRole("complementary", { name: "Comの詳細" }).getByLabel("Name", { exact: true }).fill(longName);
  await expect(row).toHaveAttribute("title", longName);
  await expect(name).toHaveCSS("-webkit-line-clamp", "2");
  expect(await row.evaluate((element) => element.getBoundingClientRect().height)).toBe(shortHeight);
  expect(await name.evaluate((element) => element.scrollHeight)).toBeGreaterThan(await name.evaluate((element) => element.clientHeight));
});

test("folds component and slot branches independently with plus/minus", async ({ page }) => {
  await page.getByRole("button", { name: "テキストボックスを追加", exact: true }).click();
  const component = branch(page, "Text Box Com 01");
  const label = page.getByRole("button", { name: "Text Box Com 01 子コンポーネント slot", exact: true });
  await label.click();
  await expect(label).toContainText("+");
  await expect(treeNode(page, "textbox-1:label")).toBeHidden();
  await expect(treeNode(page, "textbox-1:input")).toBeHidden();
  await component.click();
  await expect(component).toHaveText("+");
  await expect(label).toBeHidden();
  await expect(page.getByRole("complementary", { name: "Comの詳細", exact: true })).toHaveCount(0);
  await component.press("Enter");
  await expect(component).toHaveText("−");
  await expect(label).toBeVisible();
  await expect(treeNode(page, "textbox-1:label")).toBeHidden();
  await label.press("Space");
  await expect(treeNode(page, "textbox-1:label")).toBeVisible();
  await treeNode(page, "textbox-1").click();
  await expect(page.getByRole("complementary", { name: "Comの詳細", exact: true })).toBeVisible();
});

test("folds Page and root slots without changing Canvas or selected fields", async ({ page }) => {
  await page.getByRole("button", { name: "ボタンを追加", exact: true }).click();
  const root = branch(page, "Page Com 01 Context slot");
  await root.click();
  await expect(root).toHaveText("+");
  await expect(treeNode(page, "button-1")).toBeHidden();
  await expect(page.locator('.canvas-stage [data-object-id="button-1"]')).toBeVisible();
  await branch(page, "Page Com 01").click();
  await expect(root).toBeHidden();
  await branch(page, "Page Com 01").click();
  await expect(root).toHaveAttribute("aria-expanded", "false");
  await root.click();
  await expect(treeNode(page, "button-1")).toBeVisible();
  await page.getByRole("button", { name: "Overlay slot", exact: true }).click();
  await expect(root).toHaveAttribute("aria-expanded", "true");
  const overlay = branch(page, "Page Com 01 Overlay slot");
  await overlay.click();
  await expect(overlay).toHaveText("+");
  await expect(page.locator('[data-canvas-root="overlay"]')).toBeVisible();
});

test("accepts drops into a closed slot and preserves its fold state", async ({ page }) => {
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  const children = page.getByRole("button", { name: "Container Com 01 Children slot", exact: true });
  await children.click();
  await page.locator('[data-library-kind="button"]').dragTo(children);
  await expect(page.locator('.canvas-stage [data-object-id="button-2"]')).toBeVisible();
  await expect(treeNode(page, "button-2")).toBeHidden();
  await expect(children).toHaveAttribute("aria-expanded", "false");
  await branch(page, "Container Com 01").click();
  await branch(page, "Container Com 01").click();
  await children.click();
  await expect(treeNode(page, "button-2")).toBeVisible();
});
