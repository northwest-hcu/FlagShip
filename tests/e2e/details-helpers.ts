import type { Page } from "@playwright/test";

export async function openFields(page: Page, ...keys: string[]): Promise<void> {
  const pane = page.getByRole("complementary", { name: "コンポーネントの詳細", exact: true });
  for (const key of keys) {
    const toggle = pane.locator('[data-field-key="' + key + '"]').getByRole("button", { name: /フィールドを開閉$/ });
    if (await toggle.getAttribute("aria-expanded") === "false") await toggle.click();
  }
}

export async function openCustomColor(page: Page, key = "color"): Promise<void> {
  await openFields(page, key);
  const field = page.locator('.details-pane [data-field-key="' + key + '"]');
  if (!await field.locator(".color-custom").isVisible()) await field.getByRole("button", { name: /をカスタム$/ }).click();
}

export async function applyCustomColor(page: Page, key = "color"): Promise<void> {
  await page.locator('.details-pane [data-field-key="' + key + '"]').getByRole("button", { name: /のカスタム色を適用$/ }).click();
}
