import { expect, test, type Page } from "@playwright/test";
const treeNode = (page: Page, id: string) => page.locator('[data-tree-node="' + id + '"]');
const branch = (page: Page, label: string) => page.getByRole("button", { name: label + "の枝を開閉", exact: true });
test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("folds component and slot branches independently with plus/minus", async ({ page }) => {
  await page.getByRole("button", { name: "テキストボックスを追加", exact: true }).click();
  const component = branch(page, "Text Box Component 01");
  const label = page.getByRole("button", { name: "Text Box Component 01 Label slot", exact: true });
  await label.click();
  await expect(label).toContainText("+");
  await expect(treeNode(page, "textbox-1:label")).toBeHidden();
  await expect(treeNode(page, "textbox-1:input")).toHaveCount(0);
  await component.click();
  await expect(component).toHaveText("+");
  await expect(label).toBeHidden();
  await expect(page.getByRole("complementary", { name: "コンポーネントの詳細", exact: true })).toHaveCount(0);
  await component.press("Enter");
  await expect(component).toHaveText("−");
  await expect(label).toBeVisible();
  await expect(treeNode(page, "textbox-1:label")).toBeHidden();
  await label.press("Space");
  await expect(treeNode(page, "textbox-1:label")).toBeVisible();
  await treeNode(page, "textbox-1").click();
  await expect(page.getByRole("complementary", { name: "コンポーネントの詳細", exact: true })).toBeVisible();
});

test("folds Page and root slots without changing Canvas or selected fields", async ({ page }) => {
  await page.getByRole("button", { name: "ボタンを追加", exact: true }).click();
  const root = branch(page, "Page Component 01 Context slot");
  await root.click();
  await expect(root).toHaveText("+");
  await expect(treeNode(page, "button-1")).toBeHidden();
  await expect(page.locator('.canvas-stage [data-object-id="button-1"]')).toBeVisible();
  await branch(page, "Page Component 01").click();
  await expect(root).toBeHidden();
  await branch(page, "Page Component 01").click();
  await expect(root).toHaveAttribute("aria-expanded", "false");
  await root.click();
  await expect(treeNode(page, "button-1")).toBeVisible();
  await page.getByRole("button", { name: "Overlay slot", exact: true }).click();
  await expect(root).toHaveAttribute("aria-expanded", "true");
  const overlay = branch(page, "Page Component 01 Overlay slot");
  await overlay.click();
  await expect(overlay).toHaveText("+");
  await expect(page.locator('[data-canvas-root="overlay"]')).toBeVisible();
});

test("accepts drops into a closed slot and preserves its fold state", async ({ page }) => {
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  const children = page.getByRole("button", { name: "Container Component 01 Children slot", exact: true });
  await children.click();
  await page.locator('[data-library-kind="button"]').dragTo(children);
  await expect(page.locator('.canvas-stage [data-object-id="button-2"]')).toBeVisible();
  await expect(treeNode(page, "button-2")).toBeHidden();
  await expect(children).toHaveAttribute("aria-expanded", "false");
  await branch(page, "Container Component 01").click();
  await branch(page, "Container Component 01").click();
  await children.click();
  await expect(treeNode(page, "button-2")).toBeVisible();
});
