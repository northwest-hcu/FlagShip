import type { Component } from "../core/model/component";
import type {
  ComponentInstance,
  ContentNode,
} from "../core/model/ui";

/** 子を含むComponent Instance TreeからIDでInstanceを探す。 */
export function findInstance(
  instance: ComponentInstance,
  componentInstanceId: string,
): ComponentInstance | undefined {
  if (instance.id === componentInstanceId) return instance;
  for (const placement of instance.children ?? []) {
    const found = findInstance(placement.instance, componentInstanceId);
    if (found) return found;
  }
  return undefined;
}

/** ComponentのContent TreeからNodeを探す。 */
export function findComponentNode(
  component: Component,
  contentNodeId: string,
): ContentNode | undefined {
  return component.contentTree.nodes[contentNodeId];
}

/** IDが一致するInstanceだけを更新し、親Treeを再構築する。 */
export function updateInstance(
  instance: ComponentInstance,
  componentInstanceId: string,
  update: (instance: ComponentInstance) => ComponentInstance,
): ComponentInstance {
  if (instance.id === componentInstanceId) return update(instance);
  let changed = false;
  const children = (instance.children ?? []).map((placement) => {
    const child = updateInstance(
      placement.instance,
      componentInstanceId,
      update,
    );
    if (child !== placement.instance) changed = true;
    return child === placement.instance
      ? placement
      : { ...placement, instance: child };
  });
  return changed ? { ...instance, children } : instance;
}

/** 指定した子InstanceをTreeから削除する。 */
export function removeNestedInstance(
  instance: ComponentInstance,
  componentInstanceId: string,
): ComponentInstance {
  let changed = false;
  const children = (instance.children ?? []).flatMap((placement) => {
    if (placement.instance.id === componentInstanceId) {
      changed = true;
      return [];
    }
    const child = removeNestedInstance(
      placement.instance,
      componentInstanceId,
    );
    if (child !== placement.instance) changed = true;
    return [child === placement.instance
      ? placement
      : { ...placement, instance: child }];
  });
  return changed ? { ...instance, children } : instance;
}
