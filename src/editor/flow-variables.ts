import type { FlowInstanceTarget, FlowVariable } from "../core/model/flow";
import type { ProjectDocument } from "../core/model/project";
import type { ComponentInstance, ContentNode } from "../core/model/ui";
import { resolveProjectComponent } from "../runtime/components/component-resolver";

export interface FlowVariableCandidate {
  readonly key: string;
  readonly name: string;
  readonly target: FlowInstanceTarget;
  readonly nodes: readonly Pick<ContentNode, "id" | "name" | "type">[];
}

/** Page上のComponent InstanceとOverlay InstanceをFlow変数候補にする。 */
export function listFlowVariableCandidates(
  project: ProjectDocument,
  pageId: string,
): readonly FlowVariableCandidate[] {
  const page = project.ui.pages[pageId];
  if (!page) return [];
  const candidates: FlowVariableCandidate[] = [];
  for (const instance of Object.values(page.componentInstances)) {
    collectComponentCandidates(
      project,
      pageId,
      instance,
      [instance.id],
      candidates,
      [],
    );
  }
  for (const overlay of Object.values(page.overlayInstances ?? {})) {
    const component = resolveProjectComponent(
      project,
      overlay.componentInstance.componentId,
      overlay.componentInstance.componentVersion,
    );
    const tree = component?.overlayTrees[overlay.overlayTreeId]?.contentTree;
    candidates.push({
      key: `overlay:${overlay.id}`,
      name: `${component?.name ?? overlay.componentInstance.componentId} (Overlay)`,
      target: { kind: "overlay-instance", pageId, overlayInstanceId: overlay.id },
      nodes: [],
    });
    collectComponentCandidates(
      project,
      pageId,
      overlay.componentInstance,
      [overlay.componentInstance.id],
      candidates,
      [],
      tree ? Object.values(tree.nodes) : [],
    );
  }
  return candidates;
}

/** Component Variableから選択可能なLocal UI Nodeを返す。 */
export function nodesForFlowVariable(
  variable: FlowVariable,
  candidates: readonly FlowVariableCandidate[],
): readonly FlowVariableCandidate["nodes"][number][] {
  return candidates.find((candidate) =>
    sameTarget(candidate.target, variable.target))?.nodes ?? [];
}

function collectComponentCandidates(
  project: ProjectDocument,
  pageId: string,
  instance: ComponentInstance,
  path: readonly string[],
  candidates: FlowVariableCandidate[],
  parentNames: readonly string[],
  rootNodes?: readonly ContentNode[],
): void {
  const component = resolveProjectComponent(
    project,
    instance.componentId,
    instance.componentVersion,
  );
  if (!component) return;
  const names = [...parentNames, component.name];
  candidates.push({
    key: `component:${path.join("/")}`,
    name: names.join(" / "),
    target: { kind: "component-instance", pageId, componentInstancePath: path },
    nodes: rootNodes ?? Object.values(component.contentTree?.nodes ?? {}),
  });
  for (const placement of instance.children ?? []) {
    collectComponentCandidates(
      project,
      pageId,
      placement.instance,
      [...path, placement.instance.id],
      candidates,
      names,
    );
  }
}

function sameTarget(left: FlowInstanceTarget, right: FlowInstanceTarget): boolean {
  if (left.kind !== right.kind || left.pageId !== right.pageId) return false;
  if (left.kind === "overlay-instance" && right.kind === "overlay-instance") {
    return left.overlayInstanceId === right.overlayInstanceId;
  }
  return left.kind === "component-instance" && right.kind === "component-instance" &&
    left.componentInstancePath.join("/") === right.componentInstancePath.join("/");
}
