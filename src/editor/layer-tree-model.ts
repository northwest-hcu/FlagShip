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
  readonly visible: boolean;
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
  return Object.values(page.overlayInstances ?? {}).flatMap(
    (overlayInstance, pageIndex) => {
      const instance = overlayInstance.componentInstance;
      const component = resolveProjectComponent(
        project,
        instance.componentId,
        instance.componentVersion,
      );
      const overlay = component?.overlayTrees[overlayInstance.overlayTreeId];
      if (!component || !overlay) return [];
      return [createLayerItem(
        project,
        instance,
        Object.values(overlay.contentTree.nodes),
        `overlay:${overlayInstance.id}`,
        true,
        pageIndex,
        component.name,
      )];
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
    visible: instance.visible !== false,
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
