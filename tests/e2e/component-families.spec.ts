import { expect, test, type Page } from "@playwright/test";
import { openFields } from "./details-helpers";
const tree = (page: Page, id: string) => page.locator('[data-tree-node="' + id + '"]');
const object = (page: Page, id: string) => page.locator('.canvas-stage [data-object-id="' + id + '"]');
const details = (page: Page) => page.getByRole("complementary", { name: "Comの詳細", exact: true });
const add = (page: Page, name: string) => page.getByRole("button", { name: name + "を追加", exact: true }).click();
test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("owns and retains values across Text Box, Textarea and Select", async ({ page }) => {
  for (const name of ["テキストボックス", "複数行入力", "選択入力"]) await add(page, name);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await object(page, "textbox-1").getByRole("textbox").fill("一行の値");
  await object(page, "textarea-2").getByRole("textbox").fill("一行目\n二行目");
  await object(page, "select-3").getByRole("combobox").selectOption("second");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await tree(page, "textarea-2").click();
  await openFields(page, "value");
  await expect(details(page).getByLabel("Value", { exact: true })).toHaveValue("一行目\n二行目");
  await tree(page, "select-3").click();
  await openFields(page, "value");
  await expect(details(page).getByRole("group", { name: "Value", exact: true }).getByRole("button", { name: "選択肢2", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(details(page).locator("select")).toHaveCount(0);
  await tree(page, "textbox-1").dragTo(page.getByRole("button", { name: "Overlay slot", exact: true }));
  await expect(object(page, "textbox-1").getByRole("textbox")).toHaveValue("一行の値");
});

test("masks Text Input values in a Text Box", async ({ page }, testInfo) => {
  await add(page, "テキストボックス");
  await expect(tree(page, "textbox-1:input")).toBeVisible();
  await tree(page, "textbox-1:input").click();
  await openFields(page, "value", "passwordMask");
  await details(page).getByLabel("Value", { exact: true }).fill("secret123");
  const mask = details(page).getByRole("group", { name: "Password Mask", exact: true });
  const input = object(page, "textbox-1").locator("input");
  await expect(details(page).locator('[data-field-key="passwordMask"] .field-type')).toHaveText("Password MaskBoolean");
  await expect(input).toHaveAttribute("type", "text");
  await mask.getByRole("button", { name: "ON", exact: true }).click();
  await expect(input).toHaveAttribute("type", "password");
  await expect(input).toHaveValue("secret123");
  await expect(input).toHaveAccessibleName("テキストボックス");
  await details(page).getByRole("button", { name: "Password Maskフィールドを開閉", exact: true }).click();
  await expect(mask).toBeHidden();
  await expect(input).toHaveAttribute("type", "password");
  await details(page).getByRole("button", { name: "Password Maskフィールドを開閉", exact: true }).click();
  await expect(mask.getByRole("button", { name: "ON", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await input.fill("changed456");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await openFields(page, "value", "passwordMask");
  await expect(details(page).getByLabel("Value", { exact: true })).toHaveValue("changed456");
  await mask.getByRole("button", { name: "OFF", exact: true }).click();
  await expect(input).toHaveAttribute("type", "text");
  await expect(input).toHaveValue("changed456");
  await tree(page, "textbox-1:label").click();
  await openFields(page, "value");
  await details(page).getByLabel("Text", { exact: true }).fill("");
  await expect(input).toHaveAccessibleName("テキストボックス");
  await expect(object(page, "textbox-1:label").locator(".component-text")).toBeEmpty();
  await page.screenshot({ path: testInfo.outputPath("textbox-mask.png") });
});

test("keeps Calendar dates independent without residual Text labels", async ({ page }, testInfo) => {
  await add(page, "テキストボックス"); await add(page, "カレンダー");
  await tree(page, "textbox-1:input").click();
  await openFields(page, "value");
  await details(page).getByLabel("Value", { exact: true }).fill("テキスト");
  await tree(page, "calendar-2").click();
  await openFields(page, "value");
  const calendar = object(page, "calendar-2");
  const input = calendar.locator("input");
  await expect(input).toHaveAttribute("type", "date");
  await expect(input).toHaveValue("");
  await expect(input).toHaveAccessibleName("カレンダー");
  await expect(calendar).toHaveText("");
  await expect(calendar.locator("label, .component-text")).toHaveCount(0);
  await expect(details(page).getByLabel("Value", { exact: true })).toHaveAttribute("type", "date");
  await expect(details(page).locator('[data-field-key="inputType"]')).toHaveCount(0);
  await details(page).getByLabel("Value", { exact: true }).fill("2026-09-29");
  await expect(input).toHaveValue("2026-09-29");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await input.fill("2026-10-01");
  await expect(calendar).toHaveText("");
  await expect(object(page, "textbox-1").locator("input")).toHaveValue("テキスト");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await openFields(page, "value");
  await expect(details(page).getByLabel("Value", { exact: true })).toHaveValue("2026-10-01");
  await calendar.screenshot({ path: testInfo.outputPath("calendar-without-text.png") });
  await details(page).getByLabel("Value", { exact: true }).fill("");
  await expect(input).toHaveValue("");
});

test("renders number, email, URL and telephone as separate value-owning controls", async ({ page }) => {
  const variants = [
    { name: "数値入力", kind: "number", value: "12.5" },
    { name: "メール入力", kind: "email", value: "test@example.com" },
    { name: "URL入力", kind: "url", value: "https://example.com" },
    { name: "電話番号入力", kind: "tel", value: "090-1234-5678" },
  ];
  for (const variant of variants) await add(page, variant.name);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  for (const [index, variant] of variants.entries()) {
    const input = object(page, variant.kind + "-" + (index + 1)).locator("input");
    await expect(input).toHaveAttribute("type", variant.kind);
    await input.fill(variant.value);
  }
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  for (const [index, variant] of variants.entries()) {
    await tree(page, variant.kind + "-" + (index + 1)).click();
    await openFields(page, "value");
    await expect(details(page).getByLabel("Value", { exact: true })).toHaveValue(variant.value);
    await expect(details(page).locator('[data-field-key="inputType"]')).toHaveCount(0);
  }
});

test("renders sized Paragraph, inline Text and Shape as a line", async ({ page }) => {
  await add(page, "段落"); await add(page, "テキスト"); await add(page, "図形");
  await tree(page, "paragraph-1:text").click();
  await openFields(page, "value");
  await details(page).getByLabel("Text", { exact: true }).fill("段落の本文");
  await expect(object(page, "paragraph-1").locator("p.component-paragraph")).toHaveText("段落の本文");
  await expect(object(page, "text-2").locator("span.component-text")).toBeVisible();
  await tree(page, "paragraph-1").click();
  await openFields(page, "width", "height", "margin", "padding");
  for (const [name, value] of [["Width", "180"], ["Height", "80"], ["Margin", "12"], ["Padding", "8"]]) {
    await details(page).getByLabel(name, { exact: true }).fill(value);
  }
  const paragraph = object(page, "paragraph-1").locator("p.component-paragraph");
  await expect(paragraph).toHaveCSS("width", "180px");
  await expect(paragraph).toHaveCSS("height", "80px");
  await expect(paragraph).toHaveCSS("margin", "12px");
  await expect(paragraph).toHaveCSS("padding", "8px");
  await page.locator('[data-library-kind="text"]').dragTo(page.getByRole("button", { name: "Paragraph Com 01 Text slot", exact: true }));
  await expect(page.locator('[data-slot-owner="paragraph-1"][data-slot-key="text"] .slot-type')).toHaveText("Text Com[]");
  await expect(paragraph.locator(".component-text")).toHaveCount(2);
  await expect(paragraph).toHaveText("段落の本文テキスト");
  await page.locator('[data-library-kind="text"]').dragTo(object(page, "paragraph-1"));
  await expect(paragraph.locator(".component-text")).toHaveCount(3);
  await expect(paragraph).toHaveText("段落の本文テキストテキスト");
  await expect(object(page, "shape-3").locator("svg line")).toHaveCount(1);
  await tree(page, "shape-3").click();
  await openFields(page, "height", "shape");
  await details(page).getByLabel("Height", { exact: true }).fill("80");
  await details(page).getByRole("group", { name: "Shape", exact: true }).getByRole("button", { name: "四角", exact: true }).click();
  await expect(object(page, "shape-3").locator("svg rect")).toHaveCount(1);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(paragraph).toHaveText("段落の本文テキストテキスト");
  await expect(paragraph).toHaveCSS("width", "180px");
  await expect(paragraph).toHaveCSS("margin", "12px");
  await expect(object(page, "shape-3").locator("svg")).toHaveAttribute("height", "80");
});
