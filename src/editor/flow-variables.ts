import type { FlowInstanceTarget, FlowVariable } from "../core/model/flow";
import type { ProjectDocument } from "../core/model/project";
import type { ComponentInstance, ContentNode } from "../core/model/ui";
import { resolveProjectComponent } from "../runtime/components/component-resolver";

export interface FlowVariableCandidate {
  readonly key: string;
  readonly name: string;
  readonly target: FlowInstanceTarget;
  readonly nodes: readonly ContentNode[];
}

export interface FlowStateFieldOption {
  readonly key: string;
  readonly type: "string" | "boolean";
}

/** Page上のComponent InstanceをFlow変数候補にする。 */
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
  for (const instance of Object.values(page.overlayInstances ?? {})) {
    const component = resolveProjectComponent(
      project,
      instance.componentId,
      instance.componentVersion,
    );
    collectComponentCandidates(
      project,
      pageId,
      instance,
      [instance.id],
      candidates,
      [],
      component ? Object.values(component.contentTree.nodes) : [],
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

/** Component VariableとUI Nodeから書き換え可能なState Fieldを返す。 */
export function stateFieldsForFlowVariable(
  variable: FlowVariable,
  candidates: readonly FlowVariableCandidate[],
  localId: string,
): readonly FlowStateFieldOption[] {
  const node = nodesForFlowVariable(variable, candidates).find(
    (candidate) => candidate.id === localId,
  );
  if (!node || !("schema" in node.state) ||
      node.state.schema.type !== "object") return [];
  return Object.entries(node.state.schema.properties).flatMap(([key, schema]) =>
    schema.type === "string" || schema.type === "boolean"
      ? [{ key, type: schema.type }]
      : []);
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
    nodes: rootNodes ?? Object.values(component.contentTree.nodes),
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
  return left.pageId === right.pageId &&
    left.componentInstancePath.join("/") === right.componentInstancePath.join("/");
}
