import { expect, test, type Page } from "@playwright/test";
import { openFields } from "./details-helpers";

const tree = (page: Page, id: string) => page.locator('[data-tree-node="' + id + '"]');
const object = (page: Page, id: string) => page.locator('.canvas-stage [data-object-id="' + id + '"]');
const details = (page: Page) => page.getByRole("complementary", { name: "Comの詳細", exact: true });
test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("edits Text font, size, weight, line height and spacing and preserves them in Preview", async ({ page }) => {
  await page.getByRole("button", { name: "テキストを追加", exact: true }).click();
  await tree(page, "text-1").click();
  const text = object(page, "text-1").locator(".component-text");
  await expect(text).toHaveCSS("font-size", "16px");
  await expect(text).toHaveCSS("font-family", /Share Tech Mono/);
  await openFields(page, "font", "fontSize", "fontWeight", "lineHeight", "letterSpacing");
  await details(page).getByRole("group", { name: "Font", exact: true }).getByRole("button", { name: "Serif", exact: true }).click();
  await details(page).getByLabel("Font Size", { exact: true }).fill("24");
  await details(page).getByRole("group", { name: "Font Weight", exact: true }).getByRole("button", { name: "Bold", exact: true }).click();
  await details(page).getByLabel("Line Height", { exact: true }).fill("1.8");
  await details(page).getByLabel("Letter Spacing", { exact: true }).fill("2.5");
  await expect(details(page).locator('[data-field-key="lineHeight"] .numeric-field > span')).toHaveCount(0);
  await expect(details(page).locator('[data-field-key="fontSize"] .numeric-field > span')).toHaveText("px");
  await expect(text).toHaveCSS("font-family", "serif");
  await expect(text).toHaveCSS("font-size", "24px");
  await expect(text).toHaveCSS("font-weight", "700");
  await expect(text).toHaveCSS("line-height", "43.2px");
  await expect(text).toHaveCSS("letter-spacing", "2.5px");
  await tree(page, "text-1").dragTo(page.getByRole("button", { name: "Overlay slot", exact: true }));
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(text).toHaveCSS("font-size", "24px");
  await expect(text).toHaveCSS("font-family", "serif");
  await expect(text).toHaveCSS("line-height", "43.2px");
  await expect(text).toHaveCSS("letter-spacing", "2.5px");
});

test("edits Button dimensions, padding and corners and styles Text in composite components", async ({ page }, testInfo) => {
  for (const name of ["ボタン", "テキストボックス", "段落", "テキスト"]) await page.getByRole("button", { name: name + "を追加", exact: true }).click();
  await tree(page, "button-1").click();
  await openFields(page, "width", "height", "paddingHorizontal", "paddingVertical", "borderRadius");
  for (const [name, value] of [["Width", "240"], ["Height", "80"], ["Horizontal Padding", "20"], ["Vertical Padding", "10"], ["Border Radius", "24"]]) {
    await details(page).getByLabel(name, { exact: true }).fill(value);
  }
  const button = object(page, "button-1").locator(".component-button");
  await expect(button).toHaveCSS("width", "240px");
  await expect(button).toHaveCSS("height", "80px");
  await expect(button).toHaveCSS("padding", "10px 20px");
  await expect(button).toHaveCSS("border-radius", "24px");
  await tree(page, "button-1:text").click();
  await openFields(page, "fontSize", "fontWeight");
  await details(page).getByLabel("Font Size", { exact: true }).fill("28");
  await details(page).getByRole("group", { name: "Font Weight", exact: true }).getByRole("button", { name: "Bold", exact: true }).click();
  await expect(button.locator(".component-text")).toHaveCSS("font-size", "28px");
  await expect(button.locator(".component-text")).toHaveCSS("font-weight", "700");
  for (const [id, size] of [["textbox-2:label", "20"], ["paragraph-3:text", "22"], ["text-4", "18"]]) {
    await tree(page, id).click();
    await openFields(page, "fontSize");
    await details(page).getByLabel("Font Size", { exact: true }).fill(size);
  }
  await expect(object(page, "textbox-2:label").locator(".component-text")).toHaveCSS("font-size", "20px");
  await expect(object(page, "textbox-2").locator("input")).toHaveCSS("font-size", "16px");
  await expect(object(page, "paragraph-3").locator(".component-text")).toHaveCSS("font-size", "22px");
  await expect(object(page, "text-4").locator(".component-text")).toHaveCSS("font-size", "18px");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(button).toHaveCSS("width", "240px");
  await expect(button).toHaveCSS("border-radius", "24px");
  await expect(button.locator(".component-text")).toHaveCSS("font-size", "28px");
  await page.screenshot({ path: testInfo.outputPath("component-styles.png") });
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await tree(page, "button-1").click();
  await openFields(page, "width", "height", "borderRadius");
  await details(page).getByLabel("Width", { exact: true }).fill("0");
  await details(page).getByLabel("Height", { exact: true }).fill("0");
  await details(page).getByLabel("Border Radius", { exact: true }).fill("0");
  await expect(button).toHaveCSS("border-radius", "0px");
  const bounds = await button.boundingBox();
  if (!bounds) throw new Error("Missing Button");
  expect(bounds.width).toBeLessThan(240);
  expect(bounds.height).toBeLessThan(80);
});
