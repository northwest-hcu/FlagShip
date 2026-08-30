import type { ProjectDocument } from "../core/model/project";
import type {
  ComponentInstance,
  ContentNode,
  UIPage,
} from "../core/model/ui";
import { resolveProjectComponent } from "../runtime/components/component-resolver";

export interface LayerSlot {
  readonly key: string;
  readonly id: string;
  readonly name: string;
  readonly parentInstanceId: string;
  readonly parentContentNodeId: string;
  readonly children: readonly LayerItem[];
}

export interface LayerItem {
  readonly key: string;
  readonly id: string;
  readonly name: string;
  readonly draggable: boolean;
  readonly pageIndex?: number;
  readonly slots: readonly LayerSlot[];
}

/** Page Content Surfaceへ投影するComponent InstanceをLayers用に変換する。 */
export function createContentSurfaceLayers(
  project: ProjectDocument,
  page: UIPage,
): readonly LayerItem[] {
  return Object.values(page.componentInstances).flatMap((instance, pageIndex) => {
    const component = resolveProjectComponent(
      project,
      instance.componentId,
      instance.componentVersion,
    );
    if (component?.contentTree === null || component === undefined) return [];

    return [createLayerItem(
      project,
      instance,
      Object.values(component.contentTree.nodes),
      `content:${instance.id}`,
      true,
      pageIndex,
    )];
  });
}

/** Page Overlay Surfaceへ投影するOverlay TreeをLayers用に変換する。 */
export function createOverlaySurfaceLayers(
  project: ProjectDocument,
  page: UIPage,
): readonly LayerItem[] {
  return flattenInstances(Object.values(page.componentInstances)).flatMap(
    ({ instance, pageIndex, topLevel }) => {
      const component = resolveProjectComponent(
        project,
        instance.componentId,
        instance.componentVersion,
      );
      if (component === undefined) return [];

      return Object.values(component.overlayTrees).map((overlay) =>
        createLayerItem(
          project,
          instance,
          Object.values(overlay.contentTree.nodes),
          `overlay:${instance.id}:${overlay.id}`,
          topLevel,
          pageIndex,
          component.name === overlay.name
            ? component.name
            : `${component.name} / ${overlay.name}`,
        ));
    },
  );
}

/** Drop中のNamed SlotをLayers上の一意なKeyへ変換する。 */
export function layerSlotKey(
  parentInstanceId: string,
  parentContentNodeId: string,
  slotId: string,
): string {
  return `${parentInstanceId}:${parentContentNodeId}:${slotId}`;
}

function createLayerItem(
  project: ProjectDocument,
  instance: ComponentInstance,
  nodes: readonly ContentNode[],
  key: string,
  draggable: boolean,
  pageIndex?: number,
  displayName?: string,
): LayerItem {
  const component = resolveProjectComponent(
    project,
    instance.componentId,
    instance.componentVersion,
  );
  return {
    key,
    id: instance.id,
    name: displayName ?? component?.name ?? instance.componentId,
    draggable,
    pageIndex,
    slots: nodes.flatMap((node) => node.slots.map((slot) => ({
      key: layerSlotKey(instance.id, node.id, slot.id),
      id: slot.id,
      name: slot.name,
      parentInstanceId: instance.id,
      parentContentNodeId: node.id,
      children: (instance.children ?? [])
        .filter((placement) =>
          placement.parentContentNodeId === node.id &&
          placement.slotId === slot.id)
        .map((placement) => createNestedContentLayer(
          project,
          placement.instance,
        )),
    }))),
  };
}

function createNestedContentLayer(
  project: ProjectDocument,
  instance: ComponentInstance,
): LayerItem {
  const component = resolveProjectComponent(
    project,
    instance.componentId,
    instance.componentVersion,
  );
  const nodes = component?.contentTree === null || component === undefined
    ? []
    : Object.values(component.contentTree.nodes);
  return createLayerItem(
    project,
    instance,
    nodes,
    `content:${instance.id}`,
    false,
  );
}

function flattenInstances(
  roots: readonly ComponentInstance[],
): readonly {
  readonly instance: ComponentInstance;
  readonly pageIndex: number;
  readonly topLevel: boolean;
}[] {
  return roots.flatMap((root, pageIndex) => [
    { instance: root, pageIndex, topLevel: true },
    ...flattenChildren(root, pageIndex),
  ]);
}

function flattenChildren(
  parent: ComponentInstance,
  pageIndex: number,
): readonly {
  readonly instance: ComponentInstance;
  readonly pageIndex: number;
  readonly topLevel: false;
}[] {
  return (parent.children ?? []).flatMap(({ instance }) => [
    { instance, pageIndex, topLevel: false as const },
    ...flattenChildren(instance, pageIndex),
  ]);
}
