import { createStableId } from "../core/id";
import type {
  Component,
  ComponentLibraryCatalog,
} from "../core/model/component";
import type { ProjectDocument } from "../core/model/project";
import type {
  ComponentInstance,
} from "../core/model/ui";
import type { LiteralValue } from "../core/model/value";
import { resolveProjectComponent } from "../runtime/components/component-resolver";
import {
  findComponentNode,
  findInstance,
  removeNestedInstance,
  updateInstance,
} from "./component-instance-tree";

/** Component Selectorに表示するLibrary Component。 */
export interface SelectableComponent {
  /** Project外の導入済みLibraryか、Project内Local Libraryか。 */
  readonly origin: "external" | "local";
  readonly libraryId: string;
  readonly libraryName: string;
  readonly libraryVersion: string | null;
  readonly sourceKind: "base" | "public" | null;
  readonly component: Component;
}

/** Component配置後のProjectと選択対象Instance。 */
export interface PlaceComponentResult {
  readonly project: ProjectDocument;
  readonly componentInstanceId: string;
}

/** Named Slotへ子Componentを追加した結果。 */
export type AddSlotComponentResult = PlaceComponentResult;

const localTextComponent: Component = {
  id: "component-local-text",
  name: "Local Text",
  version: "0.1.0",
  contentTree: {
    rootNodeId: "content-node-local-text",
    nodes: {
      "content-node-local-text": {
        id: "content-node-local-text",
        name: "Local Text",
        type: "text",
        value: "このProjectだけで使うテキスト",
        state: {},
        slots: [],
        children: [],
        layout: null,
        size: {
          width: { type: "fit" },
          height: { type: "fit" },
        },
      },
    },
    componentInstances: {},
  },
  overlayTrees: {},
  flowGraphs: {},
};

/** GUI確認に使用する空のProject Documentを作成する。 */
export function createEditorProject(): ProjectDocument {
  const now = new Date().toISOString();

  return {
    meta: {
      id: "project-editor-preview",
      name: "Untitled Application",
      schemaVersion: "1",
      createdAt: now,
      updatedAt: now,
    },
    ui: {
      pages: {
        "ui-page-main": {
          id: "ui-page-main",
          name: "Main",
          componentInstances: {},
        },
      },
    },
    flows: { graphs: {} },
    state: { states: {} },
    resources: { resources: {} },
    components: {
      importedAssets: {},
      localLibrary: {
        id: "library-local",
        name: "Local",
        assets: {
          [localTextComponent.id]: localTextComponent,
        },
      },
    },
    settings: { environment: {} },
  };
}

/** 導入済みLibraryとLocal LibraryをSelector用の共通形式へ変換する。 */
export function listSelectableComponents(
  project: ProjectDocument,
  catalog: ComponentLibraryCatalog,
): readonly SelectableComponent[] {
  const externalLibraries = Object.values(catalog.libraries);
  const externalComponents = externalLibraries.flatMap((library) =>
    Object.values(library.assets).map((component) => ({
      origin: "external" as const,
      libraryId: library.id,
      libraryName: library.name,
      libraryVersion: library.version,
      sourceKind: library.kind,
      component,
    })),
  );
  const localLibrary = project.components.localLibrary;
  const localComponents = Object.values(localLibrary.assets).map(
    (component) => ({
      origin: "local" as const,
      libraryId: localLibrary.id,
      libraryName: localLibrary.name,
      libraryVersion: null,
      sourceKind: null,
      component,
    }),
  );

  return [...externalComponents, ...localComponents];
}

/** Library ComponentをProjectへ取り込み、指定したPageへInstanceを追加する。 */
export function placeComponentOnPage(
  project: ProjectDocument,
  pageId: string,
  selection: SelectableComponent,
  targetIndex?: number,
): PlaceComponentResult {
  const page = project.ui.pages[pageId];

  if (!page) {
    throw new Error(`UI Page '${pageId}' was not found.`);
  }

  const instance = createComponentInstance(selection);
  const componentInstanceId = instance.id;
  const importedAssets = importSelectedComponent(project, selection);

  const componentInstances = {
    ...page.componentInstances,
    [componentInstanceId]: instance,
  };
  const instanceIds = Object.keys(componentInstances);
  const insertedId = instanceIds.pop()!;
  const insertionIndex = targetIndex === undefined
    ? instanceIds.length
    : Math.min(Math.max(targetIndex, 0), instanceIds.length);
  instanceIds.splice(insertionIndex, 0, insertedId);

  return {
    componentInstanceId,
    project: {
      ...project,
      meta: {
        ...project.meta,
        updatedAt: new Date().toISOString(),
      },
      ui: {
        ...project.ui,
        pages: {
          ...project.ui.pages,
          [pageId]: {
            ...page,
            componentInstances: Object.fromEntries(
              instanceIds.map((id) => [id, componentInstances[id]]),
            ),
          },
        },
      },
      components: {
        ...project.components,
        importedAssets,
      },
    },
  };
}

/** Page内にあるRootまたはSlot内のComponent Instanceを取得する。 */
export function findPageComponentInstance(
  project: ProjectDocument,
  pageId: string,
  componentInstanceId: string,
): ComponentInstance | undefined {
  const roots = Object.values(
    project.ui.pages[pageId]?.componentInstances ?? {},
  );

  for (const root of roots) {
    const found = findInstance(root, componentInstanceId);
    if (found) return found;
  }

  return undefined;
}

/** Component InstanceのContent Node State初期値を上書きする。 */
export function updateComponentInstanceState(
  project: ProjectDocument,
  pageId: string,
  componentInstanceId: string,
  contentNodeId: string,
  value: LiteralValue,
): ProjectDocument {
  return updatePageInstance(
    project,
    pageId,
    componentInstanceId,
    (instance) => ({
      ...instance,
      state: { ...instance.state, [contentNodeId]: value },
    }),
  );
}

/** 選択したLibrary ComponentをInstanceのNamed Slotへ追加する。 */
export function addComponentToSlot(
  project: ProjectDocument,
  pageId: string,
  parentInstanceId: string,
  parentContentNodeId: string,
  slotId: string,
  selection: SelectableComponent,
): AddSlotComponentResult {
  if (slotId === "" || slotId === "default") {
    throw new Error("A named Slot ID is required.");
  }

  const parent = findPageComponentInstance(project, pageId, parentInstanceId);
  if (!parent) throw new Error(`Component Instance '${parentInstanceId}' was not found.`);
  const parentComponent = resolveProjectComponent(
    project,
    parent.componentId,
    parent.componentVersion,
  );
  const parentNode = parentComponent === undefined
    ? undefined
    : findComponentNode(parentComponent, parentContentNodeId);
  if (!parentNode || !("slots" in parentNode) ||
      !parentNode.slots.some((slot) => slot.id === slotId)) {
    throw new Error(`Named Slot '${slotId}' was not found.`);
  }

  const child = createComponentInstance(selection);
  const withImportedAsset: ProjectDocument = {
    ...project,
    components: {
      ...project.components,
      importedAssets: importSelectedComponent(project, selection),
    },
  };
  const nextProject = updatePageInstance(
    withImportedAsset,
    pageId,
    parentInstanceId,
    (instance) => ({
      ...instance,
      children: [
        ...(instance.children ?? []),
        { parentContentNodeId, slotId, instance: child },
      ],
    }),
  );

  return { project: nextProject, componentInstanceId: child.id };
}

/** Named Slotへ配置した子Component Instanceを削除する。 */
export function removeSlotComponent(
  project: ProjectDocument,
  pageId: string,
  parentInstanceId: string,
  childInstanceId: string,
): ProjectDocument {
  return updatePageInstance(
    project,
    pageId,
    parentInstanceId,
    (instance) => ({
      ...instance,
      children: (instance.children ?? []).filter(
        (placement) => placement.instance.id !== childInstanceId,
      ),
    }),
  );
}

/** Page直下のComponent InstanceをDrop位置へ移動する。 */
export function movePageComponent(
  project: ProjectDocument,
  pageId: string,
  componentInstanceId: string,
  targetIndex: number,
): ProjectDocument {
  const page = project.ui.pages[pageId];
  if (!page?.componentInstances[componentInstanceId]) return project;

  const currentIds = Object.keys(page.componentInstances);
  const sourceIndex = currentIds.indexOf(componentInstanceId);
  const remainingIds = currentIds.filter((id) => id !== componentInstanceId);
  const adjustedIndex = sourceIndex < targetIndex
    ? targetIndex - 1
    : targetIndex;
  const insertionIndex = Math.min(
    Math.max(adjustedIndex, 0),
    remainingIds.length,
  );
  remainingIds.splice(insertionIndex, 0, componentInstanceId);

  return replacePageInstances(project, pageId, remainingIds);
}

/** Page直下のComponent Instanceを削除する。 */
export function removePageComponent(
  project: ProjectDocument,
  pageId: string,
  componentInstanceId: string,
): ProjectDocument {
  const page = project.ui.pages[pageId];
  if (!page) return project;

  if (!page.componentInstances[componentInstanceId]) {
    let changed = false;
    const componentInstances = Object.fromEntries(
      Object.entries(page.componentInstances).map(([id, instance]) => {
        const next = removeNestedInstance(instance, componentInstanceId);
        if (next !== instance) changed = true;
        return [id, next];
      }),
    );
    if (!changed) return project;

    return replacePageInstanceMap(project, pageId, componentInstances);
  }

  return replacePageInstances(
    project,
    pageId,
    Object.keys(page.componentInstances).filter(
      (id) => id !== componentInstanceId,
    ),
  );
}

function createComponentInstance(
  selection: SelectableComponent,
): ComponentInstance {
  return {
    id: createStableId("component-instance"),
    componentId: selection.component.id,
    componentVersion: selection.component.version,
    state: {},
    children: [],
  };
}

function importSelectedComponent(
  project: ProjectDocument,
  selection: SelectableComponent,
): ProjectDocument["components"]["importedAssets"] {
  if (selection.origin === "local") {
    return project.components.importedAssets;
  }

  return {
    ...project.components.importedAssets,
    [selection.component.id]: {
      source: {
        kind: selection.sourceKind!,
        libraryId: selection.libraryId,
        libraryVersion: selection.libraryVersion!,
      },
      component: structuredClone(selection.component),
    },
  };
}

function updatePageInstance(
  project: ProjectDocument,
  pageId: string,
  componentInstanceId: string,
  update: (instance: ComponentInstance) => ComponentInstance,
): ProjectDocument {
  const page = project.ui.pages[pageId];
  if (!page) return project;
  let changed = false;
  const componentInstances = Object.fromEntries(
    Object.entries(page.componentInstances).map(([id, instance]) => {
      const next = updateInstance(instance, componentInstanceId, update);
      if (next !== instance) changed = true;
      return [id, next];
    }),
  );
  if (!changed) return project;
  return replacePageInstanceMap(project, pageId, componentInstances);
}

function replacePageInstanceMap(
  project: ProjectDocument,
  pageId: string,
  componentInstances: ProjectDocument["ui"]["pages"][string]["componentInstances"],
): ProjectDocument {
  const page = project.ui.pages[pageId];
  return {
    ...project,
    meta: { ...project.meta, updatedAt: new Date().toISOString() },
    ui: {
      ...project.ui,
      pages: {
        ...project.ui.pages,
        [pageId]: { ...page, componentInstances },
      },
    },
  };
}

function replacePageInstances(
  project: ProjectDocument,
  pageId: string,
  instanceIds: readonly string[],
): ProjectDocument {
  const page = project.ui.pages[pageId];

  return {
    ...project,
    meta: { ...project.meta, updatedAt: new Date().toISOString() },
    ui: {
      ...project.ui,
      pages: {
        ...project.ui.pages,
        [pageId]: {
          ...page,
          componentInstances: Object.fromEntries(
            instanceIds.map((id) => [id, page.componentInstances[id]]),
          ),
        },
      },
    },
  };
}
