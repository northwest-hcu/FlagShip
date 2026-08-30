import { createStableId } from "../core/id";
import type {
  Component,
  ComponentLibraryCatalog,
} from "../core/model/component";
import type { ProjectDocument } from "../core/model/project";

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

  const componentInstanceId = createStableId("component-instance");
  const component = selection.component;
  const importedAssets = selection.origin === "local"
    ? project.components.importedAssets
    : {
        ...project.components.importedAssets,
        [component.id]: {
          source: {
            kind: selection.sourceKind!,
            libraryId: selection.libraryId,
            libraryVersion: selection.libraryVersion!,
          },
          component: structuredClone(component),
        },
      };

  const componentInstances = {
    ...page.componentInstances,
    [componentInstanceId]: {
      id: componentInstanceId,
      componentId: component.id,
      componentVersion: component.version,
    },
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
  if (!page?.componentInstances[componentInstanceId]) return project;

  return replacePageInstances(
    project,
    pageId,
    Object.keys(page.componentInstances).filter(
      (id) => id !== componentInstanceId,
    ),
  );
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
