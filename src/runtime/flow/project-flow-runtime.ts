import type { ProjectDocument } from "../../core/model/project";
import type { FlowGraph, FlowNode } from "../../core/model/flow";
import type { LiteralValue } from "../../core/model/value";
import {
  executeFlowGraph,
  type FlowExecutionResult,
} from "./flow-engine";

export interface UIEventDescriptor {
  readonly pageId: string;
  readonly componentInstancePath: readonly string[];
  readonly localId: string;
  readonly event: "click";
}

export interface OverlayActionDescriptor {
  readonly overlayInstanceId: string;
  readonly action: "activate" | "deactivate" | "toggle";
}

export interface ProjectFlowServices {
  readonly changeOverlay?: (action: OverlayActionDescriptor) => void;
}

/** Project FlowをBrowser Runtime用Handlerで実行する。 */
export function executeProjectFlow(
  graph: FlowGraph,
  services: ProjectFlowServices = {},
): Promise<FlowExecutionResult> {
  return executeFlowGraph(graph, {
    "trigger.ui-event": () => ({}),
    "data.constant": executeConstant,
    "overlay.action": (node) => executeOverlayAction(node, graph, services),
  });
}

/** UI Eventに一致するProject Flowを実行する。 */
export async function executeUIEventFlows(
  project: ProjectDocument,
  event: UIEventDescriptor,
  services: ProjectFlowServices,
): Promise<readonly FlowExecutionResult[]> {
  const matches = Object.values(project.flows.graphs).flatMap((graph) => {
    const entryIds = graph.nodes
      .filter((node) => matchesUIEvent(graph, node, event))
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

function executeConstant(node: FlowNode) {
  const value = node.config.value;
  if (!isLiteralValue(value)) {
    throw new Error("data.constant requires a literal config.value.");
  }
  return { value };
}

function executeOverlayAction(
  node: FlowNode,
  graph: FlowGraph,
  services: ProjectFlowServices,
) {
  const variableId = node.config.variableId;
  const variable = typeof variableId === "string"
    ? graph.variables?.[variableId]
    : undefined;
  const action = node.config.action;
  if (variable?.target.kind !== "overlay-instance" ||
      (action !== "activate" &&
        action !== "deactivate" &&
        action !== "toggle")) {
    throw new Error("overlay.action requires a target Overlay and action.");
  }
  if (!services.changeOverlay) {
    throw new Error("overlay.action requires a Page Overlay Manager.");
  }
  services.changeOverlay({
    overlayInstanceId: variable.target.overlayInstanceId,
    action,
  });
  return {};
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
  return variable?.target.kind === "component-instance" &&
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
