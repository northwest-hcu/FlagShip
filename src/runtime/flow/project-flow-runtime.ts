import type { ProjectDocument } from "../../core/model/project";
import type { FlowGraph, FlowNode } from "../../core/model/flow";
import type { LiteralValue } from "../../core/model/value";
import {
  executeFlowGraph,
  type FlowExecutionResult,
} from "./flow-engine";
import type { RuntimeStateChange } from "../state/runtime-state";

export interface UIEventDescriptor {
  readonly pageId: string;
  readonly componentInstancePath: readonly string[];
  readonly localId: string;
  readonly event: "click";
}

export interface ProjectFlowServices {
  readonly setState?: (change: RuntimeStateChange) => void;
}

/** Preview表示中に繰り返し実行するFlowと間隔。 */
export interface ProjectScheduleFlow {
  /** Schedule Triggerから到達可能なNodeだけを含むGraph。 */
  readonly graph: FlowGraph;

  /** Browser Timerへ渡すミリ秒単位の実行間隔。 */
  readonly intervalMs: number;
}

/** Project FlowをBrowser Runtime用Handlerで実行する。 */
export function executeProjectFlow(
  graph: FlowGraph,
  services: ProjectFlowServices = {},
): Promise<FlowExecutionResult> {
  return executeFlowGraph(graph, {
    "trigger.ui-event": () => ({}),
    "trigger.page-load": () => ({}),
    "trigger.schedule": () => ({}),
    "state.set": (node) => executeStateSet(node, graph, services),
  });
}

/** PageのPreview開始時に一致するLoad Flowを1回実行する。 */
export async function executePageLoadFlows(
  project: ProjectDocument,
  pageId: string,
  services: ProjectFlowServices,
): Promise<readonly FlowExecutionResult[]> {
  return executeMatchingTriggerFlows(
    project,
    (node) => node.type === "trigger.page-load" &&
      node.config.pageId === pageId,
    services,
  );
}

/** Pageで実行するForeground Scheduleと実行間隔を返す。 */
export function listScheduleFlows(
  project: ProjectDocument,
  pageId: string,
): readonly ProjectScheduleFlow[] {
  return Object.values(project.flows.graphs).flatMap((graph) =>
    graph.nodes.flatMap((node) => {
      const intervalMs = node.config.intervalMs;
      return node.type === "trigger.schedule" &&
          node.config.pageId === pageId &&
          typeof intervalMs === "number" &&
          Number.isFinite(intervalMs) &&
          intervalMs >= 100
        ? [{ graph: reachableGraph(graph, [node.id]), intervalMs }]
        : [];
    })
  );
}

/** UI Eventに一致するProject Flowを実行する。 */
export async function executeUIEventFlows(
  project: ProjectDocument,
  event: UIEventDescriptor,
  services: ProjectFlowServices,
): Promise<readonly FlowExecutionResult[]> {
  return executeMatchingTriggerFlows(
    project,
    (node, graph) => matchesUIEvent(graph, node, event),
    services,
  );
}

async function executeMatchingTriggerFlows(
  project: ProjectDocument,
  matchesTrigger: (node: FlowNode, graph: FlowGraph) => boolean,
  services: ProjectFlowServices,
): Promise<readonly FlowExecutionResult[]> {
  const matches = Object.values(project.flows.graphs).flatMap((graph) => {
    const entryIds = graph.nodes
      .filter((node) => matchesTrigger(node, graph))
      .map((node) => node.id);
    return entryIds.length === 0 ? [] : [reachableGraph(graph, entryIds)];
  });
  const results: FlowExecutionResult[] = [];
  for (const graph of matches) {
    results.push(await executeProjectFlow(graph, services));
  }
  return results;
}

function reachableGraph(
  graph: FlowGraph,
  entryIds: readonly string[],
): FlowGraph {
  const reachable = new Set(entryIds);
  const queue = [...entryIds];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of graph.edges.filter((item) => item.fromNode === current)) {
      if (reachable.has(edge.toNode)) continue;
      reachable.add(edge.toNode);
      queue.push(edge.toNode);
    }
  }
  return {
    ...graph,
    nodes: graph.nodes.filter((node) => reachable.has(node.id)),
    edges: graph.edges.filter((edge) =>
      reachable.has(edge.fromNode) && reachable.has(edge.toNode)),
  };
}

function executeStateSet(
  node: FlowNode,
  graph: FlowGraph,
  services: ProjectFlowServices,
) {
  const variableId = node.config.variableId;
  const variable = typeof variableId === "string"
    ? graph.variables?.[variableId]
    : undefined;
  const localId = node.config.localId;
  const key = node.config.key;
  const value = node.config.value;
  if (!variable ||
      typeof localId !== "string" ||
      typeof key !== "string" ||
      !isLiteralValue(value)) {
    throw new Error(
      "state.set requires a Component variable, UI Node, state key, and literal value.",
    );
  }
  if (!services.setState) {
    throw new Error("state.set requires a Runtime State manager.");
  }
  services.setState({
    pageId: variable.target.pageId,
    componentInstancePath: variable.target.componentInstancePath,
    localId,
    key,
    value,
  });
  return { value };
}

function matchesUIEvent(
  graph: FlowGraph,
  node: FlowNode,
  event: UIEventDescriptor,
): boolean {
  if (node.type !== "trigger.ui-event" ||
      node.config.event !== event.event) return false;
  const variableId = node.config.variableId;
  const variable = typeof variableId === "string"
    ? graph.variables?.[variableId]
    : undefined;
  return variable !== undefined &&
    variable.target.pageId === event.pageId &&
    node.config.localId === event.localId &&
    samePath(
      variable.target.componentInstancePath,
      event.componentInstancePath,
    );
}

function samePath(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function isLiteralValue(value: unknown): value is LiteralValue {
  if (value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.every(isLiteralValue);
  if (typeof value !== "object" || "$ref" in value) return false;
  return Object.values(value).every(isLiteralValue);
}
