import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Flow", exact: true }).click();
  await page.getByRole("button", { name: "+ Flow", exact: true }).click();
  await page.getByRole("button", { name: "Page Load", exact: true }).click();
  await page.keyboard.press("Escape");
});

async function setZoom(page: Page, percentage: number): Promise<void> {
  await page.getByRole("button", { name: "Flow Graphを100%に戻す" }).click();
  for (let index = 0; index < Math.abs(percentage - 100) / 10; index++) {
    await page.getByRole("button", { name: percentage < 100 ? "Flow Graphを縮小" : "Flow Graphを拡大", exact: true }).click();
  }
  await expect(page.locator(".flow-board")).toHaveAttribute("data-flow-zoom", String(percentage / 100));
}

async function scroll(page: Page): Promise<{ x: number; y: number }> {
  return page.locator(".flow-graph").evaluate((element) => ({ x: element.scrollLeft, y: element.scrollTop }));
}

async function expectEdgeAttached(page: Page): Promise<void> {
  const gap = await page.locator("[data-flow-edge-id]").evaluate((element) => {
    const path = element as SVGPathElement;
    const matrix = path.getScreenCTM()!;
    const start = path.getPointAtLength(0).matrixTransform(matrix);
    const end = path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix);
    const output = document.querySelector("[data-flow-output]")!.getBoundingClientRect();
    const input = document.querySelector("[data-flow-input]")!.getBoundingClientRect();
    return Math.max(Math.abs(start.x - output.right), Math.abs(start.y - (output.top + output.bottom) / 2),
      Math.abs(end.x - (input.left + input.right) / 2), Math.abs(end.y - (input.top + input.bottom) / 2));
  });
  expect(gap).toBeLessThan(2);
}

test("zooms, scrolls in both axes and pans the Graph background without moving Nodes", async ({ page }) => {
  const node = page.locator(".flow-node-block");
  const original = await node.getAttribute("style");
  await setZoom(page, 150);
  const graph = page.locator(".flow-graph");
  const box = (await graph.boundingBox())!;
  await page.mouse.move(box.x + box.width - 100, box.y + box.height - 100);
  const before = await scroll(page);
  await page.mouse.wheel(120, 140);
  await expect.poll(async () => (await scroll(page)).x).toBeGreaterThan(before.x);
  await expect.poll(async () => (await scroll(page)).y).toBeGreaterThan(before.y);
  const wheeled = await scroll(page);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 50, box.y + box.height - 50, { steps: 5 });
  await page.mouse.up();
  expect((await scroll(page)).x).toBeLessThan(wheeled.x);
  expect((await scroll(page)).y).toBeLessThan(wheeled.y);
  await expect(node).toHaveAttribute("style", original!);
  await page.keyboard.down("Control");
  await page.mouse.wheel(0, -120);
  await page.keyboard.up("Control");
  await expect.poll(async () => Number(await page.locator(".flow-board").getAttribute("data-flow-zoom"))).toBeGreaterThan(1.5);
  await page.getByRole("button", { name: "Flow Graphを100%に戻す" }).click();
  await expect(page.locator(".flow-board")).toHaveAttribute("data-flow-zoom", "1");
});

test("keeps drops, card movement and connection endpoints in graph coordinates after zooming", async ({ page }) => {
  await setZoom(page, 50);
  const graph = page.locator(".flow-graph");
  const box = (await graph.boundingBox())!;
  const board = (await page.locator(".flow-board").boundingBox())!;
  const target = { x: Math.floor(box.width * .55), y: Math.floor(box.height * .55) };
  await page.locator('[data-flow-node-kind="logic.condition"]').dragTo(graph, { targetPosition: target });
  const card = page.locator('[data-flow-node-id="flow-1-logic-condition-1"]');
  const position = await card.evaluate((element) => ({ x: parseFloat((element as HTMLElement).style.left), y: parseFloat((element as HTMLElement).style.top) }));
  expect(position.x).toBeCloseTo((box.x + target.x - board.x) / .5 - 109, 0);
  expect(position.y).toBeCloseTo((box.y + target.y - board.y) / .5 - 55, 0);
  await page.keyboard.press("Escape");
  const main = (await card.locator(".flow-node-main").boundingBox())!;
  await page.mouse.move(main.x + 15, main.y + 15);
  await page.mouse.down();
  await page.mouse.move(main.x + 65, main.y + 35, { steps: 5 });
  await page.mouse.up();
  const moved = await card.evaluate((element) => ({ x: parseFloat((element as HTMLElement).style.left), y: parseFloat((element as HTMLElement).style.top) }));
  expect(moved).toEqual({ x: position.x + 100, y: position.y + 40 });
  await page.keyboard.press("Escape");
  await page.locator('[data-flow-node-id="flow-1-trigger-load-1"] [data-flow-output]').dragTo(card.locator("[data-flow-input]"));
  await expect(page.locator("[data-flow-edge-id]")).toHaveCount(1);
  await expectEdgeAttached(page);
  await page.keyboard.press("Escape");
  await setZoom(page, 150);
  await expectEdgeAttached(page);
});

test("scrolls the Graph with the virtual cursor and moves a grabbed Node at a changed zoom", async ({ page }) => {
  await setZoom(page, 150);
  const graph = page.locator(".flow-graph");
  await graph.focus();
  await page.keyboard.press("Control+Shift+P");
  const libraryScroll = await page.locator(".registry-scroll").evaluate((element) => element.scrollTop);
  const before = await scroll(page);
  await page.keyboard.press("PageDown");
  await page.keyboard.press("Shift+PageDown");
  expect((await scroll(page)).x).toBeGreaterThan(before.x);
  expect((await scroll(page)).y).toBeGreaterThan(before.y);
  await page.keyboard.press("PageUp");
  await page.keyboard.press("Shift+PageUp");
  const node = page.locator('[data-flow-node-id="flow-1-trigger-load-1"]');
  await node.locator(".flow-node-main").focus();
  await page.keyboard.press("Control+Enter");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Control+Enter");
  const position = await node.evaluate((element) => ({ x: parseFloat((element as HTMLElement).style.left), y: parseFloat((element as HTMLElement).style.top) }));
  expect(position).toEqual({ x: 48, y: 56 });
  expect(await page.locator(".registry-scroll").evaluate((element) => element.scrollTop)).toBe(libraryScroll);
});
