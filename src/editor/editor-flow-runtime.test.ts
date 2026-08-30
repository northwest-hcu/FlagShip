import { describe, expect, it } from "vitest";
import type { FlowGraph } from "../core/model/flow";
import { executeEditorFlow } from "./editor-flow-runtime";

function constantFlow(value: FlowGraph["nodes"][number]["config"][string]): FlowGraph {
  return {
    id: "flow-constant-test",
    name: "Constant Test",
    nodes: [{
      id: "flow-node-constant-test",
      type: "data.constant",
      config: { value },
      inputs: {},
      outputs: {},
    }],
    edges: [],
  };
}

describe("executeEditorFlow", () => {
  it("returns a Literal Value from data.constant", async () => {
    const result = await executeEditorFlow(constantFlow("Hello Flow"));

    expect(result).toMatchObject({
      status: "completed",
      nodes: [{ outputs: { value: "Hello Flow" } }],
    });
  });

  it("rejects a Structured Reference as a constant", async () => {
    const result = await executeEditorFlow(constantFlow({
      $ref: { kind: "state", id: "state-user" },
    }));

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.diagnostic.code).toBe("FLOW_NODE_FAILED");
    }
  });
});
