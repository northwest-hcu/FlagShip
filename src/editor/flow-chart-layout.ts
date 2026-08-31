import type { FlowGraph } from "../core/model/flow";

export const FLOW_NODE_WIDTH = 240;
export const FLOW_NODE_HEIGHT = 280;
const HORIZONTAL_GAP = 32;
const VERTICAL_GAP = 48;
const PADDING = 16;

export interface FlowChartNodeLayout {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

export interface FlowChartEdgeLayout {
  readonly id: string;
  readonly path: string;
}

export interface FlowChartLayout {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly FlowChartNodeLayout[];
  readonly edges: readonly FlowChartEdgeLayout[];
}

/** Edgeの向きからFlow Nodeの階層と接続線を計算する。 */
export function createFlowChartLayout(graph: FlowGraph): FlowChartLayout {
  if (graph.nodes.length === 0) {
    return { width: 0, height: 0, nodes: [], edges: [] };
  }

  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const validEdges = graph.edges.filter((edge) =>
    nodeIds.has(edge.fromNode) && nodeIds.has(edge.toNode));
  const incoming = new Map(graph.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(
    graph.nodes.map((node) => [node.id, [] as string[]]),
  );

  for (const edge of validEdges) {
    incoming.set(edge.toNode, (incoming.get(edge.toNode) ?? 0) + 1);
    outgoing.get(edge.fromNode)?.push(edge.toNode);
  }

  const levels = new Map(graph.nodes.map((node) => [node.id, 0]));
  const queue = graph.nodes
    .filter((node) => incoming.get(node.id) === 0)
    .map((node) => node.id);
  const visited = new Set<string>();

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    visited.add(nodeId);

    for (const targetId of outgoing.get(nodeId) ?? []) {
      levels.set(
        targetId,
        Math.max(levels.get(targetId) ?? 0, (levels.get(nodeId) ?? 0) + 1),
      );
      const remaining = (incoming.get(targetId) ?? 0) - 1;
      incoming.set(targetId, remaining);
      if (remaining === 0) queue.push(targetId);
    }
  }

  const lastLevel = Math.max(0, ...levels.values());
  for (const node of graph.nodes) {
    if (!visited.has(node.id)) levels.set(node.id, lastLevel + 1);
  }

  const rows = new Map<number, string[]>();
  for (const node of graph.nodes) {
    const level = levels.get(node.id) ?? 0;
    rows.set(level, [...(rows.get(level) ?? []), node.id]);
  }

  const widestRow = Math.max(...Array.from(rows.values(), (row) => row.length));
  const width = PADDING * 2 +
    widestRow * FLOW_NODE_WIDTH +
    Math.max(0, widestRow - 1) * HORIZONTAL_GAP;
  const orderedLevels = [...rows.keys()].sort((left, right) => left - right);
  const positions = new Map<string, FlowChartNodeLayout>();

  for (const [rowIndex, level] of orderedLevels.entries()) {
    const row = rows.get(level) ?? [];
    const rowWidth = row.length * FLOW_NODE_WIDTH +
      Math.max(0, row.length - 1) * HORIZONTAL_GAP;
    const startX = (width - rowWidth) / 2;
    row.forEach((id, columnIndex) => {
      positions.set(id, {
        id,
        x: startX + columnIndex * (FLOW_NODE_WIDTH + HORIZONTAL_GAP),
        y: PADDING + rowIndex * (FLOW_NODE_HEIGHT + VERTICAL_GAP),
      });
    });
  }

  const height = PADDING * 2 +
    orderedLevels.length * FLOW_NODE_HEIGHT +
    Math.max(0, orderedLevels.length - 1) * VERTICAL_GAP;
  const edges = validEdges.flatMap((edge) => {
    const from = positions.get(edge.fromNode);
    const to = positions.get(edge.toNode);
    if (!from || !to) return [];

    const startX = from.x + FLOW_NODE_WIDTH / 2;
    const startY = from.y + FLOW_NODE_HEIGHT;
    const endX = to.x + FLOW_NODE_WIDTH / 2;
    const endY = to.y;
    const middleY = (startY + endY) / 2;
    return [{
      id: edge.id,
      path: `M ${startX} ${startY} C ${startX} ${middleY}, ${endX} ${middleY}, ${endX} ${endY}`,
    }];
  });

  return {
    width,
    height,
    nodes: graph.nodes.map((node) => positions.get(node.id)!),
    edges,
  };
}
