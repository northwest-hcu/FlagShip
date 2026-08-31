import { createStableId } from "../core/id";
import type { ProjectDocument } from "../core/model/project";
import type {
  ComponentInstance,
  OverlayAlignment,
  OverlayInstance,
} from "../core/model/ui";
import { findInstance, removeNestedInstance, updateInstance } from "./component-instance-tree";
import {
  createComponentInstance,
  importSelectedComponent,
  type PlaceComponentResult,
  type SelectableComponent,
} from "./editor-project";

/** Overlay専用ComponentをPageのOverlay Root直下へ配置する。 */
export function placeOverlayOnPage(
  project: ProjectDocument,
  pageId: string,
  selection: SelectableComponent,
  targetIndex?: number,
): PlaceComponentResult {
  const page = project.ui.pages[pageId];
  if (!page) throw new Error(`UI Page '${pageId}' was not found.`);
  const overlayTree = Object.values(selection.component.overlayTrees)[0];
  if (!overlayTree) {
    throw new Error(`Component '${selection.component.id}' has no Overlay Tree.`);
  }

  const componentInstance = createComponentInstance(selection);
  const overlay: OverlayInstance = {
    id: createStableId("overlay-instance"),
    surface: "overlay",
    overlayTreeId: overlayTree.id,
    componentInstance,
    alignment: "center",
    contentBlock: true,
    visible: true,
  };
  const overlays = { ...(page.overlayInstances ?? {}), [overlay.id]: overlay };
  const ids = Object.keys(overlays);
  const insertedId = ids.pop()!;
  const index = targetIndex === undefined
    ? ids.length
    : Math.min(Math.max(targetIndex, 0), ids.length);
  ids.splice(index, 0, insertedId);

  return {
    componentInstanceId: componentInstance.id,
    project: replaceOverlayMap(
      {
        ...project,
        components: {
          ...project.components,
          importedAssets: importSelectedComponent(project, selection),
        },
      },
      pageId,
      Object.fromEntries(ids.map((id) => [id, overlays[id]])),
    ),
  };
}

/** Overlay Root以下にあるComponent Instanceを取得する。 */
export function findOverlayComponentInstance(
  project: ProjectDocument,
  pageId: string,
  componentInstanceId: string,
): ComponentInstance | undefined {
  for (const overlay of Object.values(
    project.ui.pages[pageId]?.overlayInstances ?? {},
  )) {
    const found = findInstance(overlay.componentInstance, componentInstanceId);
    if (found) return found;
  }
  return undefined;
}

/** Root Component Instance IDからOverlay Instanceを取得する。 */
export function findOverlayInstance(
  project: ProjectDocument,
  pageId: string,
  componentInstanceId: string,
): OverlayInstance | undefined {
  return Object.values(project.ui.pages[pageId]?.overlayInstances ?? {}).find(
    (overlay) => overlay.componentInstance.id === componentInstanceId,
  );
}

/** Overlayの9点配置または背景幕設定を更新する。 */
export function updateOverlaySettings(
  project: ProjectDocument,
  pageId: string,
  overlayInstanceId: string,
  settings: {
    readonly alignment?: OverlayAlignment;
    readonly contentBlock?: boolean;
  },
): ProjectDocument {
  const page = project.ui.pages[pageId];
  const overlay = page?.overlayInstances?.[overlayInstanceId];
  if (!page || !overlay) return project;
  return replaceOverlayMap(project, pageId, {
    ...page.overlayInstances,
    [overlayInstanceId]: { ...overlay, ...settings },
  });
}

/** Overlay Instanceまたはその子Component Instanceの表示を切り替える。 */
export function toggleOverlayVisibility(
  project: ProjectDocument,
  pageId: string,
  componentInstanceId: string,
): ProjectDocument {
  return updateOverlayComponent(project, pageId, componentInstanceId, (instance) => ({
    ...instance,
    visible: instance.visible === false,
  }));
}

/** Overlay Root以下のComponent Instanceを削除する。 */
export function removeOverlayComponent(
  project: ProjectDocument,
  pageId: string,
  componentInstanceId: string,
): ProjectDocument {
  const page = project.ui.pages[pageId];
  if (!page) return project;
  let changed = false;
  const overlays = Object.fromEntries(Object.entries(page.overlayInstances ?? {}).flatMap(
    ([id, overlay]) => {
      if (overlay.componentInstance.id === componentInstanceId) {
        changed = true;
        return [];
      }
      const next = removeNestedInstance(overlay.componentInstance, componentInstanceId);
      if (next !== overlay.componentInstance) changed = true;
      return [[id, { ...overlay, componentInstance: next }]];
    },
  ));
  return changed ? replaceOverlayMap(project, pageId, overlays) : project;
}

/** Page直下のOverlay InstanceをDrop位置へ移動する。 */
export function moveOverlayOnPage(
  project: ProjectDocument,
  pageId: string,
  componentInstanceId: string,
  targetIndex: number,
): ProjectDocument {
  const page = project.ui.pages[pageId];
  const entries = Object.entries(page?.overlayInstances ?? {});
  const sourceIndex = entries.findIndex(
    ([, overlay]) => overlay.componentInstance.id === componentInstanceId,
  );
  if (sourceIndex < 0) return project;
  const [source] = entries.splice(sourceIndex, 1);
  const adjusted = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  entries.splice(Math.min(Math.max(adjusted, 0), entries.length), 0, source);
  return replaceOverlayMap(project, pageId, Object.fromEntries(entries));
}

/** Overlay Root以下のComponent Instanceを更新する。 */
export function updateOverlayComponent(
  project: ProjectDocument,
  pageId: string,
  componentInstanceId: string,
  update: (instance: ComponentInstance) => ComponentInstance,
): ProjectDocument {
  const page = project.ui.pages[pageId];
  if (!page) return project;
  let changed = false;
  const overlays = Object.fromEntries(Object.entries(page.overlayInstances ?? {}).map(
    ([id, overlay]) => {
      const next = updateInstance(overlay.componentInstance, componentInstanceId, update);
      if (next !== overlay.componentInstance) changed = true;
      return [id, { ...overlay, componentInstance: next }];
    },
  ));
  return changed ? replaceOverlayMap(project, pageId, overlays) : project;
}

function replaceOverlayMap(
  project: ProjectDocument,
  pageId: string,
  overlayInstances: Readonly<Record<string, OverlayInstance>>,
): ProjectDocument {
  const page = project.ui.pages[pageId];
  return {
    ...project,
    meta: { ...project.meta, updatedAt: new Date().toISOString() },
    ui: {
      ...project.ui,
      pages: {
        ...project.ui.pages,
        [pageId]: { ...page, overlayInstances },
      },
    },
  };
}
