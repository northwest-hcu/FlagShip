import { createStableId } from "../core/id";
import type { FlowGraph } from "../core/model/flow";
import type { ProjectDocument } from "../core/model/project";

/** Flow Editorから追加できる、現在の設計で定義済みのNode種別。 */
export const EDITABLE_FLOW_NODE_TYPES = [
  "data.constant",
  "resource.request",
  "state.set",
  "overlay.action",
] as const;

export type EditableFlowNodeType =
  (typeof EDITABLE_FLOW_NODE_TYPES)[number];

export interface AddFlowGraphResult {
  readonly project: ProjectDocument;
  readonly flowGraphId: string;
}

/** 空のProject Flow Graphを追加する。 */
export function addFlowGraph(project: ProjectDocument): AddFlowGraphResult {
  const flowGraphId = createStableId("flow");
  const graph: FlowGraph = {
    id: flowGraphId,
    name: `Flow ${Object.keys(project.flows.graphs).length + 1}`,
    nodes: [],
    edges: [],
  };

  return {
    flowGraphId,
    project: replaceGraphs(project, {
      ...project.flows.graphs,
      [flowGraphId]: graph,
    }),
  };
}

/** 指定したFlow Graphへ未設定のFlow Nodeを追加する。 */
export function addFlowNode(
  project: ProjectDocument,
  flowGraphId: string,
  type: EditableFlowNodeType,
): ProjectDocument {
  const graph = project.flows.graphs[flowGraphId];
  if (!graph) return project;

  const previousNode = graph.nodes.at(-1);
  const flowNodeId = createStableId("flow-node");

  return replaceGraph(project, {
    ...graph,
    nodes: [
      ...graph.nodes,
      {
        id: flowNodeId,
        type,
        config: type === "data.constant"
          ? { value: "Hello Flow" }
          : {},
        inputs: {},
        outputs: {},
        metadata: { x: 24, y: 24 + graph.nodes.length * 96 },
      },
    ],
    edges: previousNode === undefined
      ? graph.edges
      : [
          ...graph.edges,
          {
            id: createStableId("edge"),
            fromNode: previousNode.id,
            fromPort: "next",
            toNode: flowNodeId,
            toPort: "in",
          },
        ],
  });
}

/** Flow GraphからNodeと接続Edgeを削除する。 */
export function removeFlowNode(
  project: ProjectDocument,
  flowGraphId: string,
  flowNodeId: string,
): ProjectDocument {
  const graph = project.flows.graphs[flowGraphId];
  if (!graph) return project;

  return replaceGraph(project, {
    ...graph,
    nodes: graph.nodes.filter((node) => node.id !== flowNodeId),
    edges: graph.edges.filter((edge) =>
      edge.fromNode !== flowNodeId && edge.toNode !== flowNodeId),
  });
}

function replaceGraph(
  project: ProjectDocument,
  graph: FlowGraph,
): ProjectDocument {
  return replaceGraphs(project, {
    ...project.flows.graphs,
    [graph.id]: graph,
  });
}

function replaceGraphs(
  project: ProjectDocument,
  graphs: ProjectDocument["flows"]["graphs"],
): ProjectDocument {
  return {
    ...project,
    meta: { ...project.meta, updatedAt: new Date().toISOString() },
    flows: { graphs },
  };
}
