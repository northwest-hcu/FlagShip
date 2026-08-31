import { describe, expect, it } from "vitest";
import type { FlowGraph } from "../../core/model/flow";
import type { LiteralValue } from "../../core/model/value";
import { executeFlowGraph } from "./flow-engine";

function graph(edges: FlowGraph["edges"] = []): FlowGraph {
  return {
    id: "flow-test",
    name: "Test Flow",
    variables: {},
    nodes: [
      {
        id: "flow-node-first",
        type: "data.constant",
        config: { value: "first" },
        inputs: {},
        outputs: {},
      },
      {
        id: "flow-node-second",
        type: "data.constant",
        config: { value: "second" },
        inputs: {},
        outputs: {},
      },
    ],
    edges,
  };
}

const handlers = {
  "data.constant": (node: FlowGraph["nodes"][number]) => ({
    value: (node.config.value ?? null) as LiteralValue,
  }),
};

describe("executeFlowGraph", () => {
  it("executes Nodes in Edge order", async () => {
    const result = await executeFlowGraph(graph([{
      id: "edge-test",
      fromNode: "flow-node-second",
      fromPort: "value",
      toNode: "flow-node-first",
      toPort: "in",
    }]), handlers);

    expect(result.status).toBe("completed");
    expect(result.nodes.map((node) => node.nodeId)).toEqual([
      "flow-node-second",
      "flow-node-first",
    ]);
  });

  it("reports an unsupported Node type", async () => {
    const source = graph();
    const unsupported: FlowGraph = {
      ...source,
      nodes: [
        { ...source.nodes[0], type: "state.set" },
        ...source.nodes.slice(1),
      ],
    };

    const result = await executeFlowGraph(unsupported, handlers);

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.diagnostic.code).toBe("UNSUPPORTED_FLOW_NODE_TYPE");
    }
  });

  it("reports a cyclic Flow Graph", async () => {
    const result = await executeFlowGraph(graph([
      {
        id: "edge-forward",
        fromNode: "flow-node-first",
        fromPort: "value",
        toNode: "flow-node-second",
        toPort: "in",
      },
      {
        id: "edge-back",
        fromNode: "flow-node-second",
        fromPort: "value",
        toNode: "flow-node-first",
        toPort: "in",
      },
    ]), handlers);

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.diagnostic.code).toBe("FLOW_CYCLE");
    }
  });
});
