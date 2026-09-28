import { expect, test, type Page } from "@playwright/test";
import { openFields } from "./details-helpers";
const pane = (page: Page) => page.getByRole("complementary", { name: "コンポーネントの詳細", exact: true });
const crumbs = (page: Page) => pane(page).getByRole("navigation", { name: "コンポーネントのパンくず", exact: true });
test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("returns from a nested Text Component to Button, Container and Page without losing edits", async ({ page }) => {
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  await page.locator('[data-library-kind="button"]').dragTo(page.getByRole("button", { name: "Container Component 01 Children slot", exact: true }));
  await page.locator('[data-tree-node="container-1"]').click();
  await expect(pane(page).locator('[data-field-key="children"]')).toHaveCount(0);
  await page.locator('[data-tree-node="button-2"]').click();
  await expect(pane(page).locator('[data-field-key="contents"]')).toHaveCount(0);
  await page.locator('[data-tree-node="button-2:text"]').click();
  await expect(crumbs(page).locator("li")).toHaveText([
    "Page Component 01", "Context slot", "Container Component 01", "Children slot", "Button Component 02", "Contents slot", "Text Component",
  ]);
  await expect(crumbs(page).locator('[aria-current="page"]')).toHaveText("Text Component");
  await openFields(page, "value");
  await pane(page).getByLabel("Text", { exact: true }).fill("保存");
  await crumbs(page).getByRole("button", { name: "Button Component 02の詳細へ戻る", exact: true }).click();
  await expect(pane(page).locator('[data-field-key="contents"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Button Component 02 Contents slot", exact: true })).toBeVisible();
  await expect(page.locator('.canvas-stage [data-object-id="button-2"] .component-button')).toHaveAccessibleName("保存");
  await crumbs(page).getByRole("button", { name: "Container Component 01の詳細へ戻る", exact: true }).click();
  await openFields(page, "padding");
  await expect(pane(page).getByLabel("Padding", { exact: true })).toBeVisible();
  await crumbs(page).getByRole("button", { name: "Page Component 01の詳細へ戻る", exact: true }).click();
  await openFields(page, "path");
  await expect(pane(page).getByLabel("Path", { exact: true })).toHaveValue("/");
  await expect(crumbs(page).locator("li")).toHaveText(["Page Component 01"]);
  await expect(page.locator(".canvas-stage [data-object-id]")).toHaveCount(2);
});

test("follows the correct root when returning to Page and choosing a child from another slot", async ({ page }) => {
  await page.getByRole("button", { name: "テキストを追加", exact: true }).click();
  await page.getByRole("button", { name: "Overlay slot", exact: true }).click();
  await page.getByRole("button", { name: "アイコンを追加", exact: true }).click();
  await page.locator('[data-tree-node="icon-2"]').click();
  await expect(crumbs(page).locator("li")).toHaveText(["Page Component 01", "Overlay slot", "Icon Component 02"]);
  await crumbs(page).getByRole("button", { name: "Page Component 01の詳細へ戻る", exact: true }).click();
  await expect(pane(page).locator('[data-field-key="context"], [data-field-key="overlay"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Context slot", exact: true }).click();
  await page.locator('[data-tree-node="text-1"]').click();
  await expect(pane(page).locator("[data-component-type]")).toHaveAttribute("data-component-type", "Text Component");
  await expect(crumbs(page).locator("li")).toHaveText(["Page Component 01", "Context slot", "Text Component 01"]);
  await expect(page.locator('[data-canvas-root="context"] [data-object-id="text-1"]')).toBeVisible();
});

test("removes tree bullets and distinguishes component types from primitive field types", async ({ page }) => {
  await page.getByRole("button", { name: "ボタンを追加", exact: true }).click();
  await expect(page.locator(".tree-section")).not.toContainText("·");
  await expect(page.locator(".tree-kind")).toHaveCount(0);
  await expect(page.locator('[data-tree-node="button-1:text"]')).toHaveText("Text Component");
  await expect(page.getByRole("button", { name: "Text Componentの枝を開閉", exact: true })).toHaveCount(0);
  await page.locator('[data-tree-node="button-1"]').click();
  await expect(pane(page).locator('[data-field-key="name"] .field-type')).toHaveText("NameString");
  await expect(pane(page).locator('[data-field-key="contents"]')).toHaveCount(0);
  await expect(page.locator('[data-slot-owner="button-1"][data-slot-key="contents"] .slot-type')).toHaveText("(Text Com | Image Com)[]");
  await expect(page.getByRole("button", { name: "Context slot", exact: true }).locator(".slot-type")).toHaveText("Com[]");
  await expect(pane(page).locator('[data-field-key="background"] .field-type')).toHaveText("BackgroundColor");
  await page.locator('[data-tree-node="button-1:text"]').click();
  await expect(pane(page).locator('[data-field-key="value"] .field-type')).toHaveText("TextString");
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  await page.locator('[data-tree-node="container-2"]').click();
  await expect(pane(page).locator('[data-field-key="padding"] .field-type')).toHaveText("PaddingNumber");
  await expect(pane(page).locator('[data-field-key="direction"] .field-type')).toHaveText("DirectionEnum");
  await expect(page.locator('[data-slot-owner="container-2"][data-slot-key="children"] .slot-type')).toHaveText("Com[]");
  await page.getByRole("button", { name: "テキストボックスを追加", exact: true }).click();
  await expect(page.locator('[data-slot-owner="textbox-3"][data-slot-key="label"] .slot-type')).toHaveText("Text Com");
  await expect(page.locator('[data-tree-node="textbox-3:label"]')).toHaveText("Label Text Component");
});
