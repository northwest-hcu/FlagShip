import type {
  FlowGraph,
  FlowNode,
  FlowNodeOutputs,
} from "../../core/model/flow";

export interface FlowNodeExecutionContext {
  readonly outputs: Readonly<Record<string, FlowNodeOutputs>>;
}

export type FlowNodeHandler = (
  node: FlowNode,
  context: FlowNodeExecutionContext,
) => FlowNodeOutputs | Promise<FlowNodeOutputs>;

export interface FlowNodeExecutionResult {
  readonly nodeId: string;
  readonly type: string;
  readonly outputs: FlowNodeOutputs;
}

export interface FlowExecutionDiagnostic {
  readonly code:
    | "INVALID_FLOW_EDGE"
    | "UNSUPPORTED_FLOW_NODE_TYPE"
    | "FLOW_NODE_FAILED"
    | "FLOW_CYCLE";
  readonly message: string;
  readonly nodeId?: string;
}

export type FlowExecutionResult =
  | {
      readonly status: "completed";
      readonly nodes: readonly FlowNodeExecutionResult[];
    }
  | {
      readonly status: "failed";
      readonly nodes: readonly FlowNodeExecutionResult[];
      readonly diagnostic: FlowExecutionDiagnostic;
    };

/** Edge順にFlow Graphを実行し、Node出力とDiagnosticを返す。 */
export async function executeFlowGraph(
  graph: FlowGraph,
  handlers: Readonly<Record<string, FlowNodeHandler>>,
): Promise<FlowExecutionResult> {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const incoming = new Map(graph.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(graph.nodes.map((node) => [node.id, [] as string[]]));

  for (const edge of graph.edges) {
    if (!nodesById.has(edge.fromNode) || !nodesById.has(edge.toNode)) {
      return failed([], {
        code: "INVALID_FLOW_EDGE",
        message: `Edge '${edge.id}' references a missing Flow Node.`,
      });
    }
    incoming.set(edge.toNode, (incoming.get(edge.toNode) ?? 0) + 1);
    outgoing.get(edge.fromNode)?.push(edge.toNode);
  }

  const queue = graph.nodes
    .filter((node) => incoming.get(node.id) === 0)
    .map((node) => node.id);
  const outputs: Record<string, FlowNodeOutputs> = {};
  const results: FlowNodeExecutionResult[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodesById.get(nodeId)!;
    const handler = handlers[node.type];
    if (!handler) {
      return failed(results, {
        code: "UNSUPPORTED_FLOW_NODE_TYPE",
        message: `Flow Node type '${node.type}' is not executable.`,
        nodeId,
      });
    }

    try {
      const nodeOutputs = await handler(node, { outputs });
      outputs[nodeId] = nodeOutputs;
      results.push({ nodeId, type: node.type, outputs: nodeOutputs });
    } catch (error) {
      return failed(results, {
        code: "FLOW_NODE_FAILED",
        message: error instanceof Error ? error.message : "Flow Node failed.",
        nodeId,
      });
    }

    for (const targetId of outgoing.get(nodeId) ?? []) {
      const nextIncoming = (incoming.get(targetId) ?? 0) - 1;
      incoming.set(targetId, nextIncoming);
      if (nextIncoming === 0) queue.push(targetId);
    }
  }

  if (results.length !== graph.nodes.length) {
    return failed(results, {
      code: "FLOW_CYCLE",
      message: "Flow Graph contains a cycle.",
    });
  }

  return { status: "completed", nodes: results };
}

function failed(
  nodes: readonly FlowNodeExecutionResult[],
  diagnostic: FlowExecutionDiagnostic,
): FlowExecutionResult {
  return { status: "failed", nodes, diagnostic };
}
