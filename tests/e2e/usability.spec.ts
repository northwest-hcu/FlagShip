import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("keeps selection separate from the Canvas insertion target and supports Tab and Enter placement", async ({ page }) => {
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  await expect(page.locator(".insertion-target-banner")).toContainText("Context");
  await page.locator('[data-tree-node="container-1"]').click();
  await expect(page.locator(".insertion-target-banner")).toContainText("Context");
  await expect(page.getByRole("complementary", { name: "Comの詳細" }).getByRole("button", { name: "Children", exact: true })).toHaveCount(0);
  const children = page.getByRole("button", { name: "Container Com 01 Children slot", exact: true });
  await children.click();
  await children.click();
  await expect(page.locator(".insertion-target-banner")).toContainText("Children");
  await page.getByRole("button", { name: "ボタンを追加", exact: true }).click();
  await expect(page.locator('[data-slot-owner="container-1"] [data-tree-node="button-2"]')).toHaveCount(1);
  await page.keyboard.press("Escape");
  await page.locator('[data-library-kind="textinput"]').dragTo(page.locator('.canvas-stage [data-object-id="container-1"]'));
  await expect(page.locator('.canvas-stage [data-object-id="container-1"] [data-object-id="textinput-3"]')).toBeVisible();
  await expect(page.locator('[data-slot-owner="page-1"][data-slot-key="context"] > div > .widget-tree > li > .tree-row > [data-tree-node]')).toHaveCount(1);

  await expect(page.getByRole("button", { name: /位置を選ぶ/ })).toHaveCount(0);
  await page.getByRole("button", { name: "アイコンの見本", exact: true }).focus();
  await page.keyboard.press("Control+Enter");
  await expect(page.locator(".workspace-status")).toContainText("掴みました");
  await page.locator('[data-tree-node="button-2"]').locator("..").getByRole("button", { name: /の枝を開閉$/ }).focus();
  await page.keyboard.press("Tab");
  await expect(page.locator('[data-tree-node="button-2"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-slot-owner="container-1"] [data-tree-node][data-tree-depth="1"]')).toHaveCount(3);
  const order = await page.locator('[data-slot-owner="container-1"] [data-tree-node][data-tree-depth="1"]').evaluateAll((items) => items.map((item) => item.getAttribute("data-tree-node")));
  expect(order).toEqual(["button-2", "icon-4", "textinput-3"]);
});

test("selects and moves the Text Box label as a child Com", async ({ page }) => {
  await page.getByRole("button", { name: "テキストボックスを追加", exact: true }).click();
  const label = page.locator('.canvas-stage [data-object-id="textbox-1:label"]');
  await label.click();
  await expect(page.getByRole("complementary", { name: "Comの詳細" })).toContainText("Text Com");
  await label.dragTo(page.getByRole("button", { name: "Overlay slot", exact: true }));
  await expect(page.locator('[data-slot-owner="page-1"][data-slot-key="overlay"] [data-tree-node="textbox-1:label"]')).toBeVisible();
  await expect(page.locator('[data-slot-owner="textbox-1"] [data-tree-node="textbox-1:input"]')).toBeVisible();
});

test("shows an empty Flow choice and connects Nodes with clicks", async ({ page }) => {
  await page.getByRole("button", { name: "Flow", exact: true }).click();
  await page.getByRole("button", { name: "+ Flow", exact: true }).click();
  await expect(page.locator(".flow-node-block")).toHaveCount(0);
  await expect(page.locator(".flow-list-status")).toHaveText("要設定");
  await page.getByRole("button", { name: "Page Load", exact: true }).click();
  await expect(page.locator(".flow-node-block")).toHaveCount(1);
  await expect(page.locator(".flow-list-status")).toHaveText("設定済");

  await page.getByRole("button", { name: "Navigate Pageを追加" }).click();
  const navigate = page.locator('[data-flow-node-id="flow-1-action-navigate-1"]');
  await expect(navigate).toHaveClass(/invalid/);
  await expect(page.getByRole("region", { name: "検証結果" })).toContainText("遷移先Pageを設定してください");
  await page.locator('[data-flow-node-id="flow-1-trigger-load-1"] [data-flow-output]').click();
  await expect(page.locator(".flow-connect-hint")).toContainText("接続先Nodeをクリック");
  await navigate.getByRole("button", { name: "Navigate Pageの設定" }).click();
  await expect(page.locator("[data-flow-edge-id]")).toHaveCount(1);
  await page.getByRole("combobox", { name: "遷移先Page" }).selectOption("page-1");
  await expect(navigate).not.toHaveClass(/invalid/);
  await expect(page.locator(".flow-list-status")).toHaveText("設定済");
});

test("opens a Com's existing Click Flow from Events", async ({ page }) => {
  await page.getByRole("button", { name: "テキストを追加", exact: true }).click();
  await page.locator('[data-tree-node="text-1"]').click();
  await page.getByRole("complementary", { name: "Comの詳細" }).getByRole("button", { name: "+ Click Flow" }).click();
  await expect(page.locator(".flow-node-block")).toHaveCount(0);
  await page.getByRole("button", { name: /のClick$/ }).click();
  await expect(page.locator(".flow-node-block")).toHaveCount(1);
  await page.getByRole("button", { name: "Canvas", exact: true }).click();
  await page.getByRole("complementary", { name: "Comの詳細" }).getByRole("button", { name: "Click Flowを開く" }).click();
  await expect(page.locator(".flow-list-item")).toHaveCount(1);
  await expect(page.locator(".flow-node-block")).toHaveCount(1);
});

test("uses overlay Inspectors in a narrow split view", async ({ page }) => {
  await page.getByRole("button", { name: "左右分割" }).click();
  await page.getByRole("button", { name: "ボタンを追加", exact: true }).click();
  const canvas = page.locator("#canvas-pane");
  const viewport = canvas.locator(".canvas-viewport");
  const before = await viewport.boundingBox();
  await canvas.locator('[data-object-id="button-1"]').click();
  const after = await viewport.boundingBox();
  expect(before && after).toBeTruthy();
  expect(after!.width).toBeGreaterThanOrEqual(before!.width);
  await expect(canvas.locator(".inspector-scrim")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(canvas.locator("#component-details")).toBeHidden();
});
