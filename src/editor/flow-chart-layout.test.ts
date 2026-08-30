import { describe, expect, it } from "vitest";
import type { FlowGraph } from "../core/model/flow";
import { createFlowChartLayout } from "./flow-chart-layout";

function graph(edges: FlowGraph["edges"]): FlowGraph {
  return {
    id: "flow-chart",
    name: "Flow Chart",
    nodes: ["root", "left", "right"].map((id) => ({
      id: `flow-node-${id}`,
      type: "data.constant",
      config: {},
      inputs: {},
      outputs: {},
    })),
    edges,
  };
}

describe("createFlowChartLayout", () => {
  it("places children below their parent and branches them horizontally", () => {
    const layout = createFlowChartLayout(graph([
      {
        id: "edge-left",
        fromNode: "flow-node-root",
        fromPort: "next",
        toNode: "flow-node-left",
        toPort: "in",
      },
      {
        id: "edge-right",
        fromNode: "flow-node-root",
        fromPort: "next",
        toNode: "flow-node-right",
        toPort: "in",
      },
    ]));
    const [root, left, right] = layout.nodes;

    expect(left.y).toBeGreaterThan(root.y);
    expect(right.y).toBe(left.y);
    expect(left.x).not.toBe(right.x);
    expect(layout.edges).toHaveLength(2);
  });
});
