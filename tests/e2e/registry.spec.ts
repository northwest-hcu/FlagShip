import { expect, test, type Locator } from "@playwright/test";

async function alignedEdges(locators: Locator[], checkLeft = false): Promise<void> {
  const boxes = await Promise.all(locators.map((locator) => locator.boundingBox()));
  if (boxes.some((box) => !box)) throw new Error("An alignment target is missing.");
  const [first, ...rest] = boxes as NonNullable<(typeof boxes)[number]>[];
  for (const box of rest) {
    expect(Math.abs(box.x + box.width - first.x - first.width)).toBeLessThan(1);
    if (checkLeft) expect(Math.abs(box.x - first.x)).toBeLessThan(1);
  }
}

test.beforeEach(async ({ page }) => { await page.goto("/"); });

test("filters a flat registry and aligns its controls with the results", async ({ page }) => {
  const results = page.locator(".registry-results");
  const search = page.getByRole("searchbox", { name: "コンポーネント名で検索" });
  const libraryFilter = page.getByRole("combobox", { name: "ライブラリで絞り込む" });
  const divider = results.locator(':scope > .registry-library-divider[data-library-id="default"]');
  await expect(divider).toBeVisible();
  await expect(results.locator(":scope > [data-library-kind]")).toHaveCount(17);
  await expect(libraryFilter).toHaveValue("");
  const searchBox = await search.boundingBox();
  const dividerBox = await divider.boundingBox();
  const scrollBox = await page.locator(".registry-scroll").boundingBox();
  const panelBox = await page.locator("#tree-panel").boundingBox();
  expect(searchBox && dividerBox && scrollBox && panelBox).toBeTruthy();
  expect(Math.abs(searchBox!.x - dividerBox!.x)).toBeLessThan(1);
  expect(Math.abs(searchBox!.width - dividerBox!.width)).toBeLessThan(1);
  expect(Math.abs(scrollBox!.x + scrollBox!.width - panelBox!.x - panelBox!.width)).toBeLessThan(1);

  await libraryFilter.selectOption("default");
  await search.fill("  paragraph  ");
  await expect(results.locator(":scope > [data-library-kind]")).toHaveCount(1);
  await expect(page.locator('[data-library-kind="paragraph"]')).toBeVisible();
  await page.locator('[data-library-kind="paragraph"]').dragTo(page.locator('[data-canvas-root="context"]'));
  await expect(page.locator('.canvas-stage [data-object-id="paragraph-1"]')).toBeVisible();

  await libraryFilter.selectOption("");
  await search.fill("ボタン");
  await expect(results.locator(":scope > [data-library-kind]")).toHaveCount(1);
  await expect(page.locator('[data-library-kind="button"]')).toBeVisible();
  await search.fill("存在しない名前");
  await expect(results.locator(":scope > [data-library-kind]")).toHaveCount(0);
  await expect(page.getByText("一致するコンポーネントはありません")).toBeVisible();
  await search.fill("");
  await expect(results.locator(":scope > [data-library-kind]")).toHaveCount(17);
});

test("keeps Registry cards and Tree creation controls aligned across Canvas and Flow", async ({ page }) => {
  const canvasSearch = (await page.getByRole("searchbox", { name: "コンポーネント名で検索" }).boundingBox())!;
  const canvasDivider = (await page.locator(".registry-results > .registry-library-divider").first().boundingBox())!;
  const canvasCard = (await page.locator(".registry-results > [data-library-kind]").first().boundingBox())!;
  const canvasAdd = (await page.getByRole("button", { name: "ページを追加" }).boundingBox())!;

  await page.getByRole("button", { name: "Flow", exact: true }).click();
  const flowSearch = (await page.getByRole("searchbox", { name: "Flow Node名で検索" }).boundingBox())!;
  const flowDivider = (await page.locator(".flow-library-results > .registry-library-divider").first().boundingBox())!;
  const flowCard = (await page.locator(".flow-library-results > [data-flow-node-kind]").first().boundingBox())!;
  const flowAdd = (await page.getByRole("button", { name: "+ Flow", exact: true }).boundingBox())!;
  for (const [canvasBox, flowBox] of [[canvasSearch, flowSearch], [canvasDivider, flowDivider], [canvasCard, flowCard]]) {
    expect(flowBox.x).toBeCloseTo(canvasBox.x, 0);
    expect(flowBox.y).toBeCloseTo(canvasBox.y, 0);
    expect(flowBox.width).toBeCloseTo(canvasBox.width, 0);
    expect(flowBox.height).toBeCloseTo(canvasBox.height, 0);
  }

  await page.getByRole("button", { name: "+ Flow", exact: true }).click();
  const flowRow = (await page.locator(".flow-list-item").boundingBox())!;
  for (const box of [flowSearch, flowCard, flowAdd, flowRow]) expect(box.x).toBeCloseTo(canvasSearch.x, 0);
  expect(canvasAdd.x).toBeGreaterThan(canvasSearch.x);
});

test("uses the same right edge for Registry and Tree with reserved scrollbars", async ({ page }) => {
  const registrySearch = page.getByRole("searchbox", { name: "コンポーネント名で検索" });
  const pageAdd = page.getByRole("button", { name: "ページを追加" });
  const pageRow = page.locator(".page-tree .page-object").first();
  await alignedEdges([
    registrySearch,
    page.getByRole("combobox", { name: "ライブラリで絞り込む" }),
    page.locator(".registry-results > .registry-library-divider").first(),
    page.locator(".registry-results > [data-library-kind]").nth(1),
    page.getByRole("button", { name: "Libraryを縮小" }),
    page.getByRole("button", { name: "Treeを縮小" }),
    pageAdd,
    pageRow,
  ]);
  await alignedEdges([pageAdd, pageRow], true);

  for (let index = 0; index < 12; index++) await pageAdd.click();
  expect(await page.locator(".tree-section").evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await alignedEdges([registrySearch, pageAdd, pageRow]);
  await registrySearch.fill("存在しない名前");
  await alignedEdges([registrySearch, pageAdd, pageRow]);

  await page.getByRole("button", { name: "Flow", exact: true }).click();
  await page.getByRole("button", { name: "+ Flow", exact: true }).click();
  const flowSearch = page.getByRole("searchbox", { name: "Flow Node名で検索" });
  const flowDivider = page.locator(".flow-library-results > .registry-library-divider").first();
  const flowAdd = page.getByRole("button", { name: "+ Flow", exact: true });
  const flowRow = page.locator(".flow-list-item");
  await alignedEdges([flowSearch, flowDivider, page.locator(".flow-library-results > [data-flow-node-kind]").nth(1), flowAdd, flowRow]);
  await alignedEdges([flowSearch, flowDivider, flowAdd, flowRow], true);
});
