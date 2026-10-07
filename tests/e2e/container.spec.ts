import { expect, test, type Page } from "@playwright/test";
import { openFields } from "./details-helpers";
const object = (page: Page, id: string) => page.locator('.canvas-stage [data-object-id="' + id + '"]');
const details = (page: Page) => page.getByRole("complementary", { name: "Comの詳細", exact: true });
test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("fits contents and applies numeric padding/margin in Canvas and Preview", async ({ page }) => {
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  await page.locator('[data-library-kind="icon"]').dragTo(page.getByRole("button", { name: "Container Com 01 Children slot", exact: true }));
  await page.locator('[data-tree-node="container-1"]').click();
  await openFields(page, "widthMode", "padding", "margin");
  await details(page).getByRole("group", { name: "Width Mode", exact: true }).getByRole("button", { name: "内容に合わせる", exact: true }).click();
  const container = object(page, "container-1").locator("> .component-container");
  await expect(details(page).getByLabel("Padding", { exact: true })).toHaveValue("10");
  await expect(details(page).getByLabel("Margin", { exact: true })).toHaveValue("10");
  await expect(container).toHaveCSS("padding", "10px"); await expect(container).toHaveCSS("margin", "10px");
  const child = await object(page, "icon-2").boundingBox();
  const box = await container.boundingBox();
  if (!child || !box) throw new Error("Missing container contents");
  expect(box.width).toBeCloseTo(child.width + 20);
  expect(box.height).toBeCloseTo(child.height + 20);
  await details(page).getByLabel("Padding", { exact: true }).fill("0");
  await details(page).getByLabel("Margin", { exact: true }).fill("0");
  await expect(container).toHaveCSS("padding", "0px"); await expect(container).toHaveCSS("margin", "0px");
  expect((await container.boundingBox())?.width).toBeCloseTo(child.width);
  await details(page).getByLabel("Padding", { exact: true }).fill("12.5");
  await details(page).getByLabel("Margin", { exact: true }).fill("20");
  await expect(container).toHaveCSS("padding", "12.5px"); await expect(container).toHaveCSS("margin", "20px");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(container).toHaveCSS("padding", "12.5px"); await expect(container).toHaveCSS("margin", "20px");
});

test("applies the default horizontal direction immediately and keeps it after child drops", async ({ page }) => {
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  const slot = page.getByRole("button", { name: "Container Com 01 Children slot", exact: true });
  await page.locator('[data-library-kind="button"]').dragTo(slot);
  await page.locator('[data-library-kind="icon"]').dragTo(slot);
  await page.locator('[data-tree-node="container-1"]').click();
  await openFields(page, "direction");
  await expect(details(page).getByRole("group", { name: "Direction", exact: true }).getByRole("button", { name: "横並び", exact: true })).toHaveAttribute("aria-pressed", "true");
  const container = object(page, "container-1").locator("> .component-container");
  await expect(container).toHaveCSS("flex-direction", "row");
  const firstBox = await object(page, "button-2").boundingBox();
  const secondBox = await object(page, "icon-3").boundingBox();
  if (!firstBox || !secondBox) throw new Error("Missing initial children");
  expect(secondBox.x).toBeGreaterThan(firstBox.x + firstBox.width);
  expect(secondBox.y).toBe(firstBox.y);
  const target = object(page, "icon-3");
  const targetBox = await target.boundingBox();
  if (!targetBox) throw new Error("Missing target");
  await page.locator('[data-library-kind="text"]').dragTo(target, { targetPosition: { x: targetBox.width / 2, y: 2 } });
  await expect(object(page, "container-1").locator(".scene-layout")).toHaveCount(0);
  await page.locator('[data-tree-node="container-1"]').click();
  await openFields(page, "direction");
  for (const label of ["縦並び", "横並び", "縦並び", "横並び"]) {
    await details(page).getByRole("group", { name: "Direction", exact: true }).getByRole("button", { name: label, exact: true }).click();
    const boxes = await Promise.all(["button-2", "text-4", "icon-3"].map((id) => object(page,id).boundingBox()));
    for (let index = 1; index < boxes.length; index++) {
      const before = boxes[index - 1], after = boxes[index];
      if (!before || !after) throw new Error("Missing child");
      if (label === "横並び") { expect(after.x).toBeGreaterThan(before.x + before.width); expect(after.y).toBe(before.y); }
      else { expect(after.y).toBeGreaterThan(before.y + before.height); expect(after.x).toBe(before.x); }
    }
  }
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(container).toHaveCSS("flex-direction", "row");
});

async function choose(page: Page, field: string, label: string): Promise<void> {
  await openFields(page, field);
  const labels: Record<string, string> = { direction: "Direction", widthMode: "Width Mode", horizontalAlign: "Horizontal Align",
    verticalAlign: "Vertical Align", stretchChildren: "Stretch Children", inputLabel: "Input Label" };
  await details(page).getByRole("group", { name: labels[field], exact: true })
    .getByRole("button", { name: label, exact: true }).click();
}

async function textBoxGeometry(page: Page, id: string): Promise<number[]> {
  return object(page, id).evaluate((element) => {
    const box = element.querySelector(".component-container")!;
    const text = box.querySelector(".component-text")!.getBoundingClientRect();
    const input = box.querySelector(".component-input")!.getBoundingClientRect();
    const bounds = box.getBoundingClientRect();
    return [bounds.width, bounds.height, text.x - bounds.x, text.y - bounds.y, text.width, text.height,
      input.x - bounds.x, input.y - bounds.y, input.width, input.height];
  });
}

test("recreates the Text Box preset from an ordinary Container, Text and Text Input", async ({ page }) => {
  await page.getByRole("button", { name: "テキストボックスを追加", exact: true }).click();
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  const slot = page.getByRole("button", { name: "Container Com 02 Children slot", exact: true });
  await page.locator('[data-library-kind="text"]').dragTo(slot);
  await page.locator('[data-library-kind="textinput"]').dragTo(slot);
  await page.locator('[data-tree-node="text-3"]').click();
  await openFields(page, "value");
  await details(page).getByRole("textbox", { name: "Text", exact: true }).fill("テキストボックス");
  await page.locator('[data-tree-node="textinput-4"]').click();
  await openFields(page, "alt");
  await details(page).getByRole("textbox", { name: "Alt", exact: true }).fill("テキストボックス");
  await page.locator('[data-tree-node="container-2"]').click();
  await choose(page, "direction", "縦並び");
  await choose(page, "widthMode", "px指定");
  await openFields(page, "width", "gap", "padding", "margin");
  await details(page).getByLabel("Width", { exact: true }).fill("288");
  await details(page).getByLabel("Gap", { exact: true }).fill("8");
  await details(page).getByLabel("Padding", { exact: true }).fill("0");
  await details(page).getByLabel("Margin", { exact: true }).fill("0");
  await choose(page, "stretchChildren", "ON");
  await choose(page, "inputLabel", "先頭Textを使う");
  await page.keyboard.press("Escape");
  await expect(object(page, "container-2").locator("input")).toHaveAccessibleName("テキストボックス");
  await expect(page.locator(".component-textbox")).toHaveCount(0);
  const preset = await textBoxGeometry(page, "textbox-1"), manual = await textBoxGeometry(page, "container-2");
  for (let index = 0; index < preset.length; index++) expect(manual[index]).toBeCloseTo(preset[index], 1);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  const preview = await textBoxGeometry(page, "container-2");
  for (let index = 0; index < preset.length; index++) expect(preview[index]).toBeCloseTo(preset[index], 1);
  await object(page, "container-2").getByRole("textbox", { name: "テキストボックス", exact: true }).fill("手動で構成した入力");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(object(page, "container-2").locator("input")).toHaveValue("手動で構成した入力");
  await page.locator('[data-tree-node="container-2"]').click();
  await choose(page, "widthMode", "親の幅100%");
  await page.keyboard.press("Escape");
  const inner = (await object(page, "container-2").locator("> .component-container").boundingBox())!;
  expect((await object(page, "textinput-4").locator("input").boundingBox())!.width).toBeCloseTo(inner.width, 1);
});

test("aligns children left, center, right and top, center, bottom in both directions", async ({ page }) => {
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  const slot = page.getByRole("button", { name: "Container Com 01 Children slot", exact: true });
  await page.locator('[data-library-kind="icon"]').dragTo(slot);
  await page.locator('[data-library-kind="textinput"]').dragTo(slot);
  await page.locator('[data-tree-node="container-1"]').click();
  await choose(page, "widthMode", "px指定");
  await openFields(page, "width", "height", "margin");
  await details(page).getByLabel("Width", { exact: true }).fill("420");
  await details(page).getByLabel("Height", { exact: true }).fill("200");
  await details(page).getByLabel("Margin", { exact: true }).fill("0");
  for (const direction of ["横並び", "縦並び"]) {
    await choose(page, "direction", direction);
    for (const [horizontal, vertical, factor] of [["左揃え", "上揃え", 0], ["中央揃え", "中央揃え", .5], ["右揃え", "下揃え", 1]] as const) {
      await choose(page, "horizontalAlign", horizontal);
      await choose(page, "verticalAlign", vertical);
      const box = (await object(page, "container-1").locator("> .component-container").boundingBox())!;
      const first = (await object(page, "icon-2").boundingBox())!, second = (await object(page, "textinput-3").boundingBox())!;
      const groupWidth = direction === "横並び" ? first.width + second.width + 16 : first.width;
      const groupHeight = direction === "縦並び" ? first.height + second.height + 16 : first.height;
      expect(first.x).toBeCloseTo(box.x + 10 + (box.width - 20 - groupWidth) * factor, 1);
      expect(first.y).toBeCloseTo(box.y + 10 + (box.height - 20 - groupHeight) * factor, 1);
      if (direction === "横並び") expect(second.x - first.x - first.width).toBeCloseTo(16, 1);
      else expect(second.y - first.y - first.height).toBeCloseTo(16, 1);
    }
  }
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  const box = (await object(page, "container-1").locator("> .component-container").boundingBox())!;
  const input = (await object(page, "textinput-3").boundingBox())!;
  expect(input.x + input.width).toBeCloseTo(box.x + box.width - 10, 1);
  expect(input.y + input.height).toBeCloseTo(box.y + box.height - 10, 1);
  await expect(page.locator("[data-layout-id]")).toHaveCount(0);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.locator('[data-tree-node="container-1"]').click();
  await choose(page, "direction", "横並び");
  await choose(page, "stretchChildren", "ON");
  await openFields(page, "verticalAlign");
  await expect(details(page).getByRole("group", { name: "Vertical Align", exact: true }).getByRole("button", { name: "下揃え", exact: true })).toBeDisabled();
  expect((await object(page, "textinput-3").locator("input").boundingBox())!.height).toBeCloseTo(180, 1);
});

test("uses the parent's width including margins and adapts nested 100% Containers", async ({ page }) => {
  await page.getByRole("button", { name: "コンテナを追加", exact: true }).click();
  await page.locator('[data-tree-node="container-1"]').click();
  await openFields(page, "widthMode", "width");
  await expect(details(page).getByRole("group", { name: "Width Mode", exact: true }).getByRole("button", { name: "親の幅100%", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(details(page).getByLabel("Width", { exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  const parent = (await page.locator(".canvas-stage > .scene-layout").first().boundingBox())!;
  const fill = (await object(page, "container-1").locator("> .component-container").boundingBox())!;
  expect(fill.width + 20).toBeCloseTo(parent.width, 1);
  await page.setViewportSize({ width: 1200, height: 1200 });
  const resized = (await object(page, "container-1").locator("> .component-container").boundingBox())!;
  const resizedParent = (await page.locator(".canvas-stage > .scene-layout").first().boundingBox())!;
  expect(resized.width).toBeLessThan(fill.width);
  expect(resized.width + 20).toBeCloseTo(resizedParent.width, 1);
  await page.locator('[data-library-kind="container"]').dragTo(page.getByRole("button", { name: "Container Com 01 Children slot", exact: true }));
  await page.locator('[data-tree-node="container-1"]').click();
  await choose(page, "widthMode", "px指定");
  await openFields(page, "width");
  await details(page).getByLabel("Width", { exact: true }).fill("420");
  const child = object(page, "container-2").locator("> .component-container");
  const before = (await child.boundingBox())!;
  expect(before.width).toBeCloseTo(380, 1);
  await details(page).getByLabel("Width", { exact: true }).fill("500");
  expect((await child.boundingBox())!.width - before.width).toBeCloseTo(80, 1);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  expect((await child.boundingBox())!.width).toBeCloseTo(460, 1);
});
