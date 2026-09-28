import { describe, expect, it } from "vitest";
import { childrenOf, createPage, layoutContainer, withField, withSlot, type ContainerType, type Pages, type WidgetNode } from "./component-model";
import {
  canDrop, createComponent, dropDirection, findComponent, insertComponent,
  listComponents, moveComponent, removeComponent, canDropInPages, placeInPages,
  type ComponentKind, type Direction, type Scene,
} from "./scene";

function seed(...kinds: ComponentKind[]): Scene {
  return { context: kinds.map((kind, index) => createComponent(kind, index + 1)), overlay: [] };
}

describe("component placement", () => {
  it.each([
    ["above", ["image-3", "button-1", "icon-2"]],
    ["left", ["image-3", "button-1", "icon-2"]],
    ["below", ["button-1", "image-3", "icon-2"]],
    ["right", ["button-1", "image-3", "icon-2"]],
  ] as [Direction, string[]][])("keeps the correct layer order for %s", (direction, expected) => {
    const scene = seed("button", "icon");
    const next = insertComponent(scene, createComponent("image", 3), { root: "context", id: "button-1", direction });
    expect(listComponents(next.context).map((node) => node.id)).toEqual(expected);
    expect(listComponents(scene.context).map((node) => node.id)).toEqual(["button-1", "icon-2"]);
    expect(next.overlay).toBe(scene.overlay);
  });

  it("retains horizontal placement when adding an object above one side", () => {
    let scene = seed("button");
    scene = insertComponent(scene, createComponent("icon", 2), { root: "context", id: "button-1", direction: "right" });
    scene = insertComponent(scene, createComponent("image", 3), { root: "context", id: "icon-2", direction: "above" });
    expect(scene.context).toMatchObject([{ kind: "container", coreType: "container", layoutOnly: true, fields: { direction: { value: "horizontal" }, children: { value: [
      { id: "button-1" },
      { kind: "container", coreType: "container", layoutOnly: true, fields: { direction: { value: "vertical" }, children: { value: [{ id: "image-3" }, { id: "icon-2" }] } } },
    ] } } }]);
    expect(listComponents(scene.context).map((node) => node.id)).toEqual(["button-1", "image-3", "icon-2"]);
  });

  it("places children inside a container and preserves their order", () => {
    let scene = seed("container");
    scene = insertComponent(scene, createComponent("textbox", 2), { root: "context", id: "container-1", direction: "inside" });
    scene = insertComponent(scene, createComponent("button", 3), { root: "context", id: "textbox-2", direction: "above" });
    expect(childrenOf(findComponent(scene.context, "container-1")!).map((node) => node.kind)).toEqual(["button", "textbox"]);
    expect(scene.context).toHaveLength(1);
  });

  it("rejects an invalid target, leaf interior, and duplicate identifier without changing the scene", () => {
    const scene = seed("button");
    const node = createComponent("image", 2);
    expect(insertComponent(scene, node, { root: "context", id: "missing", direction: "above" })).toBe(scene);
    expect(insertComponent(scene, node, { root: "context", id: "button-1", direction: "inside" })).toBe(scene);
    expect(insertComponent(scene, scene.context[0] as ReturnType<typeof createComponent>, { root: "overlay", id: null, direction: "inside" })).toBe(scene);
  });

  it("moves existing objects relative to the target after detaching them", () => {
    const scene = seed("button", "image", "icon");
    const next = moveComponent(scene, { type: "instance", root: "context", id: "button-1" }, { root: "context", id: "image-2", direction: "below" });
    expect(listComponents(next.context).map((node) => node.id)).toEqual(["image-2", "button-1", "icon-3"]);
    expect(listComponents(scene.context).map((node) => node.id)).toEqual(["button-1", "image-2", "icon-3"]);
  });

  it("prevents moving a container into itself or a descendant", () => {
    let scene = seed("container");
    scene = insertComponent(scene, createComponent("container", 2), { root: "context", id: "container-1", direction: "inside" });
    const source = { type: "instance", root: "context", id: "container-1" } as const;
    for (const id of ["container-1", "container-2"]) {
      const target = { root: "context", id, direction: "inside" } as const;
      expect(canDrop(scene, source, target)).toBe(false);
      expect(moveComponent(scene, source, target)).toBe(scene);
    }
  });

  it("moves a container and its contents across layers", () => {
    let scene = seed("container");
    scene = insertComponent(scene, createComponent("button", 2), { root: "context", id: "container-1", direction: "inside" });
    const next = moveComponent(scene, { type: "instance", root: "context", id: "container-1" }, { root: "overlay", id: null, direction: "inside" });
    expect(next.context).toEqual([]);
    expect(listComponents(next.overlay).map((node) => node.id)).toEqual(["container-1", "button-2"]);
  });

  it.each(["text", "image", "icon"] as const)("preserves button contents %s through nested and cross-root moves", (kind) => {
    const content = createComponent(kind, 4);
    const button = withSlot(createComponent("button", 2), "contents", [content]) as WidgetNode;
    let scene = seed("container");
    scene = insertComponent(scene, button, { root: "context", id: "container-1", direction: "inside" });
    scene = insertComponent(scene, createComponent("image", 3), { root: "context", id: "button-2", direction: "left" });
    scene = moveComponent(scene, { type: "instance", root: "context", id: "button-2" }, { root: "overlay", id: null, direction: "inside" });
    expect(childrenOf(findComponent(scene.overlay, "button-2")!)).toEqual([content]);
    expect(findComponent(scene.context, "button-2")).toBeUndefined();
    expect(findComponent(scene.context, "image-3")).toBeDefined();
  });

  it("collapses unused layout groups when an object is removed", () => {
    const scene = insertComponent(seed("button"), createComponent("image", 2), { root: "context", id: "button-1", direction: "left" });
    expect(removeComponent(scene.context, "button-1")).toEqual([createComponent("image", 2)]);
    expect(removeComponent(scene.context, "image-2")).toEqual([createComponent("button", 1)]);
  });
});

describe("tree order moves", () => {
  it.each([
    ["text-4", "button-2", "above", ["text-4", "button-2", "icon-3"]],
    ["button-2", "text-4", "below", ["icon-3", "text-4", "button-2"]],
  ] as [string, string, Direction, string[]][])("moves %s %s %s without changing horizontal layout", (id, targetId, direction, order) => {
    const container = withSlot(withField(createComponent("container", 1), "direction", "horizontal"), "children", [
      createComponent("button", 2), createComponent("icon", 3), createComponent("text", 4),
    ]) as ContainerType;
    const scene: Scene = { context: [container], overlay: [] };
    const next = moveComponent(scene, { type: "instance", root: "context", id }, { root: "context", id: targetId, direction, orderOnly: true });
    const updated = findComponent(next.context, container.id) as ContainerType;
    expect(updated.fields.direction.value).toBe("horizontal");
    expect(updated.fields.children.value.map((node) => node.id)).toEqual(order);
    expect(container.fields.children.value.map((node) => node.id)).toEqual(["button-2", "icon-3", "text-4"]);
  });

  it("preserves an existing automatic layout group when ordering around its child", () => {
    const group = layoutContainer("horizontal", [createComponent("button", 1), createComponent("icon", 2)]);
    const scene: Scene = { context: [group, createComponent("image", 3)], overlay: [] };
    const next = moveComponent(scene, { type: "instance", root: "context", id: "image-3" }, { root: "context", id: "icon-2", direction: "above", orderOnly: true });
    expect(next.context).toHaveLength(1);
    const updated = next.context[0] as ContainerType;
    expect(updated.id).toBe(group.id);
    expect(updated.fields.direction.value).toBe("horizontal");
    expect(updated.fields.children.value.map((node) => node.id)).toEqual(["button-1", "image-3", "icon-2"]);
  });

  it("detaches a typed slot component before its parent and can move it back", () => {
    const button = createComponent("button", 1);
    const text = button.fields.contents.value[0];
    const scene: Scene = { context: [button], overlay: [] };
    const next = moveComponent(scene, { type: "instance", root: "context", id: text.id }, { root: "context", id: button.id, direction: "above", orderOnly: true });
    expect(next.context.map((node) => node.id)).toEqual([text.id, button.id]);
    expect(findComponent(next.context, button.id)).toMatchObject({ fields: { contents: { value: [] } } });
    expect(next.context[0]).toBe(text);
    expect(button.fields.contents.value[0]).toBe(text);
    const restored = moveComponent(next, { type: "instance", root: "context", id: text.id }, { root: "context", id: button.id, slotKey: "contents", direction: "inside" });
    expect(restored.context).toEqual(scene.context);
  });
});

describe("drop hit testing", () => {
  const bounds = { left: 40, top: 100, width: 200, height: 100 };
  it.each([
    [140, 102, "above"], [140, 198, "below"], [42, 150, "left"], [238, 150, "right"], [140, 150, "inside"],
  ] as [number, number, Direction][])("detects (%i, %i) as %s", (x, y, direction) => {
    expect(dropDirection(x, y, bounds, true)).toBe(direction);
  });
  it("never suggests placing inside a leaf component", () => {
    expect(dropDirection(140, 150, bounds, false)).not.toBe("inside");
  });
});

describe("typed slots and page scopes", () => {
  it("replaces a single typed slot without changing the source", () => {
    const scene = seed("paragraph");
    const next = insertComponent(scene, createComponent("text", 2), { root: "context", id: "paragraph-1", slotKey: "text", direction: "inside" });
    expect(findComponent(next.context, "text-2")).toBeDefined();
    expect(findComponent(next.context, "paragraph-1:text")).toBeUndefined();
    expect(findComponent(scene.context, "paragraph-1:text")).toBeDefined();
  });
  it("rejects an incompatible move into a typed slot without detaching it", () => {
    const scene = seed("button", "container");
    const source = { type: "instance", root: "context", id: "container-2" } as const;
    const target = { root: "context", id: "button-1", slotKey: "contents", direction: "inside" } as const;
    expect(canDrop(scene, source, target)).toBe(false);
    expect(moveComponent(scene, source, target)).toBe(scene);
  });
  it("detaches an Icon from a button leaving an empty contents slot", () => {
    const icon = createComponent("icon", 2);
    const scene: Scene = { context: [withSlot(createComponent("button", 1), "contents", [icon]) as WidgetNode], overlay: [] };
    const next = moveComponent(scene, { type: "instance", root: "context", id: icon.id }, { root: "overlay", id: null, direction: "inside" });
    expect(findComponent(next.context, "button-1")).toMatchObject({ fields: { contents: { value: [] } } });
    expect(next.overlay).toEqual([icon]);
  });
  it("rejects directional placement around a single-value slot", () => {
    const scene = seed("paragraph", "image");
    expect(moveComponent(scene, { type: "instance", root: "context", id: "image-2" }, { root: "context", id: "paragraph-1:text", direction: "above" })).toBe(scene);
  });
  it("orders image and text array entries without creating layout containers", () => {
    const button = createComponent("button", 1);
    let scene: Scene = { context: [button], overlay: [] };
    scene = insertComponent(scene, createComponent("icon", 2), { root: "context", id: "button-1:text", direction: "left" });
    expect(childrenOf(scene.context[0]).map((node) => node.kind)).toEqual(["icon", "text"]);
    scene = insertComponent(scene, createComponent("image", 3), { root: "context", id: "button-1:text", direction: "below" });
    expect(childrenOf(scene.context[0]).map((node) => node.kind)).toEqual(["icon", "text", "image"]);
    const rejected = insertComponent(scene, createComponent("textbox", 4), { root: "context", id: "button-1:text", direction: "above" });
    expect(rejected).toBe(scene);
  });
  it("moves across pages and roots while retaining metadata and untouched pages", () => {
    const icon = createComponent("icon", 1);
    const first = withSlot(createPage(1), "context", [icon]) as ReturnType<typeof createPage>;
    const pages: Pages = [first, createPage(2), createPage(3)];
    const source = { type: "instance", pageId: first.id, root: "context", id: icon.id } as const;
    const target = { pageId: "page-2", root: "overlay", id: null, direction: "inside" } as const;
    const next = placeInPages(pages, icon, source, target);
    expect(next[0].fields.context.value).toEqual([]);
    expect(next[1].fields.overlay.value).toEqual([icon]);
    expect(next[1].fields.context.value).toEqual([]);
    expect(next[1].fields.overlay.description).toBe(pages[1].fields.overlay.description);
    expect(next[2]).toBe(pages[2]);
    expect(pages[0].fields.context.value).toEqual([icon]);
  });
  it("does not detach from a page if the destination page or slot is invalid", () => {
    const icon = createComponent("icon", 1);
    const pages = [withSlot(createPage(1), "context", [icon]) as ReturnType<typeof createPage>, createPage(2)];
    const source = { type: "instance", pageId: "page-1", root: "context", id: icon.id } as const;
    for (const target of [
      { pageId: "missing", root: "overlay", id: null, direction: "inside" },
      { pageId: "page-2", root: "context", id: "missing", slotKey: "text", direction: "inside" },
    ] as const) {
      expect(canDropInPages(pages, source, target)).toBe(false);
      expect(placeInPages(pages, icon, source, target)).toBe(pages);
    }
  });
});
