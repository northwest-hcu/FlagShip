import type { ProjectDocument } from "../core/model/project";
import type { ComponentInstance } from "../core/model/ui";
import { resolveProjectComponent } from "../runtime/components/component-resolver";
import {
  findComponentNode,
  findInstance,
  removeNestedInstance,
  updateInstance,
} from "./component-instance-tree";
import {
  findPageComponentInstance,
  movePageComponent,
} from "./editor-project";

/** RootまたはNamed Slot内のComponent InstanceをContent Surface直下へ移動する。 */
export function moveComponentToPage(
  project: ProjectDocument,
  pageId: string,
  componentInstanceId: string,
  targetIndex: number,
): ProjectDocument {
  const page = project.ui.pages[pageId];
  if (!page) return project;
  if (page.componentInstances[componentInstanceId]) {
    return movePageComponent(project, pageId, componentInstanceId, targetIndex);
  }
  if (page.overlayInstances?.[componentInstanceId]) return project;

  const detached = detachComponentInstance(project, pageId, componentInstanceId);
  if (!detached) return project;
  const nextPage = detached.project.ui.pages[pageId];
  const entries = Object.entries(nextPage.componentInstances);
  const insertionIndex = Math.min(Math.max(targetIndex, 0), entries.length);
  entries.splice(insertionIndex, 0, [componentInstanceId, detached.instance]);
  return replacePageTreeMaps(
    detached.project,
    pageId,
    Object.fromEntries(entries),
    nextPage.overlayInstances ?? {},
  );
}

/** Rootまたは別のNamed Slot内のComponent Instanceを指定Slotへ移動する。 */
export function moveComponentToSlot(
  project: ProjectDocument,
  pageId: string,
  componentInstanceId: string,
  parentInstanceId: string,
  parentContentNodeId: string,
  slotId: string,
): ProjectDocument {
  if (slotId === "" || slotId === "default") return project;
  const source = findPageComponentInstance(project, pageId, componentInstanceId);
  const parent = findPageComponentInstance(project, pageId, parentInstanceId);
  if (!source || !parent || source.id === parent.id) return project;
  if (findInstance(source, parent.id)) return project;

  const sourceComponent = resolveProjectComponent(
    project,
    source.componentId,
    source.componentVersion,
  );
  if (!sourceComponent || sourceComponent.allowedSurface === "overlay") {
    return project;
  }
  const parentComponent = resolveProjectComponent(
    project,
    parent.componentId,
    parent.componentVersion,
  );
  const parentNode = parentComponent === undefined
    ? undefined
    : findComponentNode(parentComponent, parentContentNodeId);
  if (!parentNode?.slots.some((slot) => slot.id === slotId)) return project;

  const detached = detachComponentInstance(project, pageId, componentInstanceId);
  if (!detached) return project;
  return updatePageInstance(
    detached.project,
    pageId,
    parentInstanceId,
    (instance) => ({
      ...instance,
      children: [
        ...(instance.children ?? []),
        { parentContentNodeId, slotId, instance: detached.instance },
      ],
    }),
  );
}

function detachComponentInstance(
  project: ProjectDocument,
  pageId: string,
  componentInstanceId: string,
): { readonly project: ProjectDocument; readonly instance: ComponentInstance } | undefined {
  const page = project.ui.pages[pageId];
  const instance = findPageComponentInstance(project, pageId, componentInstanceId);
  if (!page || !instance) return undefined;

  const componentInstances = Object.fromEntries(
    Object.entries(page.componentInstances).flatMap(([id, root]) =>
      root.id === componentInstanceId
        ? []
        : [[id, removeNestedInstance(root, componentInstanceId)]]),
  );
  const overlayInstances = Object.fromEntries(
    Object.entries(page.overlayInstances ?? {}).flatMap(([id, root]) =>
      root.id === componentInstanceId
        ? []
        : [[id, removeNestedInstance(root, componentInstanceId)]]),
  );

  return {
    instance,
    project: replacePageTreeMaps(
      project,
      pageId,
      componentInstances,
      overlayInstances,
    ),
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
  const overlayInstances = Object.fromEntries(
    Object.entries(page.overlayInstances ?? {}).map(([id, root]) => {
      const next = updateInstance(root, componentInstanceId, update);
      if (next !== root) changed = true;
      return [id, next];
    }),
  );
  return changed
    ? replacePageTreeMaps(
        project,
        pageId,
        componentInstances,
        overlayInstances,
      )
    : project;
}

function replacePageTreeMaps(
  project: ProjectDocument,
  pageId: string,
  componentInstances: ProjectDocument["ui"]["pages"][string]["componentInstances"],
  overlayInstances: NonNullable<ProjectDocument["ui"]["pages"][string]["overlayInstances"]>,
): ProjectDocument {
  const page = project.ui.pages[pageId];
  return {
    ...project,
    meta: { ...project.meta, updatedAt: new Date().toISOString() },
    ui: {
      ...project.ui,
      pages: {
        ...project.ui.pages,
        [pageId]: { ...page, componentInstances, overlayInstances },
      },
    },
  };
}
