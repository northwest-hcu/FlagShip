import { expect, test } from "@playwright/test";
import { openFields } from "./details-helpers";
test("searches the full catalog and renders all eight local Google icon fonts", async ({ page }) => {
  await page.route("https://**", (route) => route.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "アイコンを追加", exact: true }).click();
  const icon = page.locator('.canvas-stage [data-object-id="icon-1"] .component-icon');
  await icon.click({ force: true });
  const pane = page.getByRole("complementary", { name: "Comの詳細", exact: true });
  await openFields(page, "symbol", "font");
  await expect(pane.locator(".icon-result-count")).toHaveText("4299 / 4299");
  await pane.getByLabel("アイコンを検索", { exact: true }).fill("rocket_launch");
  await pane.getByRole("group", { name: "Symbol", exact: true }).getByRole("button", { name: "rocket_launch", exact: true }).click();
  await expect(icon).toHaveAttribute("data-icon-symbol", "rocket_launch");
  await pane.getByLabel("アイコンを検索", { exact: true }).fill("home");
  await pane.getByRole("group", { name: "Symbol", exact: true }).getByRole("button", { name: "home", exact: true }).click();
  const fonts = [
    ["symbols-outlined", "Symbols / Outlined"], ["symbols-rounded", "Symbols / Rounded"], ["symbols-sharp", "Symbols / Sharp"],
    ["icons-filled", "Icons / Filled"], ["icons-outlined", "Icons / Outlined"], ["icons-rounded", "Icons / Rounded"],
    ["icons-sharp", "Icons / Sharp"], ["icons-two-tone", "Icons / Two Tone"],
  ];
  for (const [font, label] of fonts) {
    await pane.getByRole("group", { name: "Font", exact: true }).getByRole("button", { name: label, exact: true }).click();
    await expect(icon).toHaveAttribute("data-icon-font", font);
    const loaded = await page.evaluate(async (name) => (await document.fonts.load('32px "FlagShip ' + name + '"')).map((face) => face.status), font);
    expect(loaded).toEqual(["loaded"]);
  }
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(icon).toHaveAttribute("data-icon-font", "icons-two-tone");
  await expect(icon).toHaveAttribute("data-icon-symbol", "home");
});

test("uses arbitrary icon image URLs in Button slots and preserves Google settings", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "ボタンを追加", exact: true }).click();
  await page.locator('[data-library-kind="icon"]').dragTo(page.getByRole("button", { name: "Button Com 01 Contents slot", exact: true }));
  await page.locator('[data-tree-node="icon-2"]').click();
  const pane = page.getByRole("complementary", { name: "Comの詳細", exact: true });
  await openFields(page, "source");
  await pane.getByLabel("Source", { exact: true }).fill("/images/sample-landscape.svg");
  await page.locator('[data-tree-node="button-1"]').click();
  const image = page.locator('.canvas-stage [data-object-id="button-1"] .icon-image');
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("src", "/images/sample-landscape.svg");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(image).toBeVisible();
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.locator('[data-tree-node="icon-2"]').click();
  await openFields(page, "source");
  await pane.getByLabel("Source", { exact: true }).fill("");
  await expect(image).toHaveCount(0);
  await expect(page.locator('.canvas-stage [data-object-id="button-1"] .icon-glyph')).toBeVisible();
});
