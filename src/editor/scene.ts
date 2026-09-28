import {
  acceptsKind, acceptsWidget, childrenOf, createComponent, isLayout, layoutContainer, slotsOf, slotNodes, withSlot,
  type Axis, type ComponentKind, type PageSlot, type Pages, type PageComponent, type WidgetNode,
} from "./component-model";
export { COMPONENT_CATALOG, createComponent } from "./component-model";
export type { Axis, ComponentKind, ComponentNode, SceneNode } from "./component-model";
export type Direction = "above" | "below" | "left" | "right" | "inside";
export type Scene = Record<PageSlot, WidgetNode[]>;
export interface DropTarget { root: PageSlot; id: string | null; direction: Direction; slotKey?: string; pageId?: string; orderOnly?: boolean }
export type DragSource =
  | { type: "library"; kind: ComponentKind }
  | { type: "instance"; root: PageSlot; id: string; pageId?: string };

export function findComponent(nodes: WidgetNode[], id: string): WidgetNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findComponent(childrenOf(node), id);
    if (child) return child;
  }
}
// Placement order excludes the internal Text/Icon parts of composite widgets.
export function listComponents(nodes: WidgetNode[]): WidgetNode[] {
  return nodes.flatMap((node) => isLayout(node) ? listComponents(node.fields.children.value)
    : [node, ...listComponents(node.kind === "container" ? node.fields.children.value : [])]);
}
function inArray(nodes: WidgetNode[], id: string, kind: ComponentKind): boolean {
  for (const node of nodes) {
    if (node.id === id) return true;
    for (const [, slot] of slotsOf(node)) {
      if (slot.multiple && slotNodes(slot).some((child) => child.id === id)) return acceptsKind(slot, kind);
      if (slot.multiple && inArray(slotNodes(slot), id, kind)) return true;
      if (!slot.multiple && slotNodes(slot).some((child) => child.id !== id && inArray(childrenOf(child), id, kind))) return true;
    }
  }
  return false;
}
function acceptsTarget(scene: Scene, kind: ComponentKind, target: DropTarget): boolean {
  if (target.id === null) return true;
  const destination = findComponent(scene[target.root], target.id);
  if (!destination) return false;
  const key = target.slotKey ?? (target.direction === "inside" && destination.kind === "container" ? "children" : undefined);
  if (key) {
    const slot = slotsOf(destination).find(([name]) => name === key)?.[1];
    return !!slot && acceptsKind(slot, kind);
  }
  return target.direction !== "inside" && inArray(scene[target.root], target.id, kind);
}
export function canDrop(scene: Scene, source: DragSource, target: DropTarget): boolean {
  const moving = source.type === "instance" ? findComponent(scene[source.root], source.id) : undefined;
  if (source.type === "instance" && !moving) return false;
  if (!acceptsTarget(scene, moving?.kind ?? (source as Extract<DragSource, { type: "library" }>).kind, target)) return false;
  return !moving || !target.id || !(moving.id === target.id || findComponent(childrenOf(moving), target.id));
}
function insertAt(nodes: WidgetNode[], axis: Axis, node: WidgetNode, target: DropTarget): WidgetNode[] | null {
  for (let index = 0; index < nodes.length; index++) {
    const current = nodes[index];
    if (current.id === target.id) {
      const key = target.slotKey ?? (target.direction === "inside" && current.kind === "container" ? "children" : undefined);
      const next = nodes.slice();
      if (key) {
        const slot = slotsOf(current).find(([name]) => name === key)?.[1];
        if (!slot || !acceptsWidget(slot, node)) return null;
        next[index] = withSlot(current, key, slot.multiple ? [...slotNodes(slot), node] : node) as WidgetNode;
      } else {
        if (target.direction === "inside") return null;
        const desired = target.direction === "left" || target.direction === "right" ? "horizontal" : "vertical";
        const before = target.direction === "above" || target.direction === "left";
        // Tree changes array order without introducing a different spatial layout.
        if (target.orderOnly || axis === desired) next.splice(index + (before ? 0 : 1), 0, node);
        else next[index] = layoutContainer(desired, before ? [node, current] : [current, node]);
      }
      return next;
    }
    for (const [key, slot] of slotsOf(current)) {
      const childNodes = slotNodes(slot);
      if (!slot.multiple && childNodes.some((child) => child.id === target.id) && !target.slotKey) continue;
      const childAxis = current.kind === "container" ? current.fields.direction.value : "vertical";
      const inserted = insertAt(childNodes, childAxis, node, { ...target, orderOnly: target.orderOnly || (slot.multiple && current.kind !== "container") });
      if (inserted) {
        if (!slot.multiple && inserted.length !== 1 || !inserted.every((child) => acceptsWidget(slot, child))) return null;
        const next = nodes.slice();
        next[index] = withSlot(current, key, slot.multiple ? inserted : inserted[0] ?? null) as WidgetNode;
        return next;
      }
    }
  }
  return null;
}
export function insertComponent(scene: Scene, node: WidgetNode, target: DropTarget): Scene {
  if (findComponent(scene.context, node.id) || findComponent(scene.overlay, node.id)) return scene;
  if (!acceptsTarget(scene, node.kind, target)) return scene;
  const nodes = target.id === null ? [...scene[target.root], node] : insertAt(scene[target.root], "vertical", node, target);
  return nodes ? { ...scene, [target.root]: nodes } : scene;
}
function removeFromNode(node: WidgetNode, id: string): WidgetNode {
  let next = node;
  for (const [key, slot] of slotsOf(node)) {
    const old = slotNodes(slot);
    const children = removeComponent(old, id);
    if (children !== old) next = withSlot(next, key, slot.multiple ? children : children[0] ?? null) as WidgetNode;
  }
  return next;
}
export function removeComponent(nodes: WidgetNode[], id: string): WidgetNode[] {
  let changed = false;
  const next = nodes.flatMap((node): WidgetNode[] => {
    if (node.id === id) { changed = true; return []; }
    const updated = removeFromNode(node, id);
    if (updated !== node) changed = true;
    if (isLayout(updated) && updated.fields.children.value.length < 2) return updated.fields.children.value;
    return [updated];
  });
  return changed ? next : nodes;
}
export function moveComponent(scene: Scene, source: Extract<DragSource, { type: "instance" }>, target: DropTarget): Scene {
  if (!canDrop(scene, source, target)) return scene;
  const moving = findComponent(scene[source.root], source.id)!;
  const detached = { ...scene, [source.root]: removeComponent(scene[source.root], source.id) };
  const inserted = insertComponent(detached, moving, target);
  return inserted === detached ? scene : inserted;
}
export function replaceComponent(nodes: WidgetNode[], replacement: WidgetNode): WidgetNode[] {
  return nodes.map((node) => {
    if (node.id === replacement.id) return replacement;
    let next = node;
    for (const [key, slot] of slotsOf(node)) {
      const children = replaceComponent(slotNodes(slot), replacement);
      next = withSlot(next, key, slot.multiple ? children : children[0] ?? null) as WidgetNode;
    }
    return next;
  });
}
export function pageScene(page: PageComponent): Scene {
  return { context: page.fields.context.value, overlay: page.fields.overlay.value };
}
export function withScene(page: PageComponent, scene: Scene): PageComponent {
  return { ...page, fields: { ...page.fields,
    context: { ...page.fields.context, value: scene.context }, overlay: { ...page.fields.overlay, value: scene.overlay },
  } };
}
export function canDropInPages(pages: Pages, source: DragSource, target: DropTarget): boolean {
  const destination = pages.find((page) => page.id === target.pageId);
  if (!destination) return false;
  if (source.type === "library") return canDrop(pageScene(destination), source, target);
  const origin = pages.find((page) => page.id === source.pageId);
  const moving = origin && findComponent(origin.fields[source.root].value, source.id);
  if (!moving) return false;
  if (origin === destination) return canDrop(pageScene(destination), source, target);
  return canDrop(pageScene(destination), { type: "library", kind: moving.kind }, target);
}
export function placeInPages(pages: Pages, node: WidgetNode, source: DragSource, target: DropTarget): Pages {
  if (!canDropInPages(pages, source, target)) return pages;
  const destination = pages.find((page) => page.id === target.pageId)!;
  if (source.type === "instance" && source.pageId === destination.id) {
    const scene = pageScene(destination);
    const next = moveComponent(scene, source, target);
    return next === scene ? pages : pages.map((page) => page === destination ? withScene(page, next) : page);
  }
  const scene = pageScene(destination);
  const inserted = insertComponent(scene, node, target);
  if (inserted === scene) return pages;
  return pages.map((page) => {
    if (page === destination) return withScene(page, inserted);
    if (source.type === "instance" && page.id === source.pageId) {
      return withScene(page, { ...pageScene(page), [source.root]: removeComponent(page.fields[source.root].value, source.id) });
    }
    return page;
  });
}
export function dropDirection(x: number, y: number, bounds: { left: number; top: number; width: number; height: number }, acceptsChildren: boolean): Direction {
  const horizontal = (x - bounds.left) / Math.max(1, bounds.width);
  const vertical = (y - bounds.top) / Math.max(1, bounds.height);
  if (acceptsChildren && horizontal > .25 && horizontal < .75 && vertical > .25 && vertical < .75) return "inside";
  const edges: [Direction, number][] = [["above", vertical], ["below", 1 - vertical], ["left", horizontal], ["right", 1 - horizontal]];
  return edges.reduce((closest, edge) => edge[1] < closest[1] ? edge : closest)[0];
}
