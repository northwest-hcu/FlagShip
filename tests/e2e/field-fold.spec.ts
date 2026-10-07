import { expect, test, type Page } from "@playwright/test";
import { applyCustomColor, openCustomColor, openFields } from "./details-helpers";

const details = (page: Page) => page.getByRole("complementary", { name: "Comの詳細", exact: true });
const field = (page: Page, key: string) => details(page).locator('[data-field-key="' + key + '"]');
const toggle = (page: Page, key: string) => field(page, key).getByRole("button", { name: /フィールドを開閉$/ });
const tree = (page: Page, id: string) => page.locator('[data-tree-node="' + id + '"]');
const add = (page: Page, name: string) => page.getByRole("button", { name: name + "を追加", exact: true }).click();

test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("shows basic fields and retains independent field states and values per component", async ({ page }) => {
  await add(page, "テキスト"); await add(page, "テキスト");
  await tree(page, "text-1").click();
  await expect(toggle(page, "name")).toHaveAttribute("aria-expanded", "true");
  await expect(toggle(page, "value")).toHaveAttribute("aria-expanded", "true");
  await expect(details(page).getByLabel("Text", { exact: true })).toBeVisible();
  await openFields(page, "name", "value", "color", "background");
  await details(page).getByLabel("Name", { exact: true }).fill("本文");
  await details(page).getByLabel("Text", { exact: true }).fill("閉じても保持する本文");
  await openCustomColor(page);
  await details(page).getByLabel("Color R", { exact: true }).fill("100");
  await applyCustomColor(page);
  await expect(toggle(page, "value")).toHaveAttribute("aria-expanded", "true");
  await expect(toggle(page, "value")).toHaveText("−");

  await toggle(page, "name").click();
  await toggle(page, "value").press("Space");
  await toggle(page, "color").click();
  for (const key of ["name", "value", "color"]) {
    await expect(toggle(page, key)).toHaveAttribute("aria-expanded", "false");
    await expect(toggle(page, key)).toHaveText("+");
    await expect(field(page, key).locator(".field-type")).toBeVisible();
    await expect(field(page, key).locator(".field-description")).toBeHidden();
    await expect(field(page, key).locator(".field-body")).toBeHidden();
  }
  await expect(field(page, "background").locator(".field-body")).toBeVisible();
  await expect(page.locator('.canvas-stage [data-object-id="text-1"] .component-text')).toHaveText("閉じても保持する本文");

  await tree(page, "text-2").click();
  for (const key of ["name", "value"]) await expect(toggle(page, key)).toHaveAttribute("aria-expanded", "true");
  for (const key of ["color", "background"]) await expect(toggle(page, key)).toHaveAttribute("aria-expanded", "false");
  await tree(page, "text-1").click();
  for (const key of ["name", "value", "color"]) await expect(toggle(page, key)).toHaveAttribute("aria-expanded", "false");
  await expect(toggle(page, "background")).toHaveAttribute("aria-expanded", "true");

  await toggle(page, "value").press("Enter");
  await toggle(page, "name").press("Space");
  await toggle(page, "color").click();
  await expect(details(page).getByLabel("Text", { exact: true })).toHaveValue("閉じても保持する本文");
  await expect(details(page).getByLabel("Name", { exact: true })).toHaveValue("本文");
  await expect(details(page).getByLabel("Color RGBピッカー", { exact: true })).toHaveCount(0);
  await openCustomColor(page);
  await expect(details(page).getByLabel("Color R", { exact: true })).toHaveValue("100");
});

test("folds enum and numeric fields and restores folds through Tree selection", async ({ page }, testInfo) => {
  await add(page, "コンテナ");
  await page.locator('[data-library-kind="button"]').dragTo(page.getByRole("button", { name: "Container Com 01 Children slot", exact: true }));
  await tree(page, "container-1").click();
  await openFields(page, "direction", "padding", "margin");
  await details(page).getByRole("group", { name: "Direction", exact: true }).getByRole("button", { name: "横並び", exact: true }).click();
  await details(page).getByLabel("Padding", { exact: true }).fill("24");
  await details(page).getByLabel("Margin", { exact: true }).fill("6");

  const keys = ["name", "color", "background", "direction", "padding", "margin"];
  for (const key of keys) {
    if (await toggle(page, key).getAttribute("aria-expanded") === "true") await toggle(page, key).click();
    await expect(field(page, key).locator(".field-body")).toBeHidden();
  }
  await expect(tree(page, "button-2")).toBeVisible();
  await expect(field(page, "children")).toHaveCount(0);
  await tree(page, "button-2").click();
  await expect(field(page, "contents")).toHaveCount(0);
  await tree(page, "container-1").click();
  for (const key of keys) await expect(toggle(page, key)).toHaveAttribute("aria-expanded", "false");
  await details(page).screenshot({ path: testInfo.outputPath("details-fields-collapsed.png") });

  await openFields(page, "direction", "padding", "margin");
  await expect(details(page).getByRole("group", { name: "Direction", exact: true }).getByRole("button", { name: "横並び", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(details(page).getByLabel("Padding", { exact: true })).toHaveValue("24");
  await expect(details(page).getByLabel("Margin", { exact: true })).toHaveValue("6");
  await tree(page, "button-2").click();
  await expect(details(page).locator("[data-component-type]")).toHaveAttribute("data-component-type", "Com");
});

test("keeps icon search and selection while its field is folded", async ({ page }) => {
  await add(page, "アイコン");
  await tree(page, "icon-1").click();
  await openFields(page, "symbol", "font", "alt");
  await details(page).getByLabel("アイコンを検索", { exact: true }).fill("check");
  await details(page).getByRole("group", { name: "Symbol", exact: true }).getByRole("button", { name: "check", exact: true }).click();
  await expect(details(page).getByLabel("アイコンを検索", { exact: true })).toHaveValue("check");
  await toggle(page, "symbol").click();
  await expect(field(page, "symbol").locator(".field-body")).toBeHidden();
  await expect(field(page, "font").locator(".field-body")).toBeVisible();
  await expect(field(page, "alt").locator(".field-body")).toBeVisible();

  await toggle(page, "symbol").press("Enter");
  await expect(details(page).getByLabel("アイコンを検索", { exact: true })).toHaveValue("check");
  await expect(details(page).getByRole("group", { name: "Symbol", exact: true }).getByRole("button", { name: "check", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('.canvas-stage [data-object-id="icon-1"] .component-icon')).toHaveAttribute("data-icon-symbol", "check");
  await toggle(page, "symbol").click();
  await details(page).getByRole("group", { name: "Font", exact: true }).getByRole("button", { name: "Symbols / Rounded", exact: true }).click();
  await toggle(page, "symbol").click();
  await expect(details(page).getByLabel("アイコンを検索", { exact: true })).toHaveValue("");
  await expect(details(page).locator(".icon-current > span").last()).toHaveText("check");
});
