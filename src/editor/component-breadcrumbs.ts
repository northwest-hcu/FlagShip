import { displayName, isLayout, slotNodes, slotsOf, type ComponentNode } from "./component-model";

export type ComponentBreadcrumb =
  | { kind: "component"; key: string; id: string; label: string }
  | { kind: "slot"; key: string; label: string };

/** 選択履歴ではなく現在の親子関係から経路を作り、編集用の並びグループは省略する。 */
export function componentBreadcrumbs(root: ComponentNode, selectedId: string): ComponentBreadcrumb[] {
  const current: ComponentBreadcrumb[] = isLayout(root) ? [] : [{ kind: "component", key: "component:" + root.id, id: root.id, label: displayName(root) }];
  if (root.id === selectedId) return current;
  for (const [key, slot] of slotsOf(root)) {
    for (const child of slotNodes(slot)) {
      const path = componentBreadcrumbs(child, selectedId);
      if (path.length) {
        const via: ComponentBreadcrumb[] = isLayout(root) ? [] : [{ kind: "slot", key: "slot:" + root.id + ":" + key, label: slot.name + " slot" }];
        return [...current, ...via, ...path];
      }
    }
  }
  return [];
}
