import { describe, expect, it } from "vitest";
import type {
  FlowDocument,
  FlowGraph,
} from "./flow";

// Trigger、Condition、Resource Requestを接続した代表的なFlow Graphを定義する。
// 型注釈によって、Application共通とComponent固有のどちらでも使う
// Flow Graph Schemaの必須Propertyを型検査する。
const saveUserFlowGraph: FlowGraph = {
  id: "flow-save-user",
  name: "Save User",
  variables: {},
  nodes: [
    {
      id: "flow-node-click-save",
      type: "trigger.ui-event",
          config: {
            target: {
              kind: "content-node",
              scope: "current-component-instance",
              componentInstancePath: ["component-instance-save-button"],
              localId: "content-node-button"
            },
        event: "click"
      },
      inputs: {},
      outputs: {},
      metadata: {
        x: 80,
        y: 160
      }
    },

    {
      id: "flow-node-is-valid",
      type: "logic.condition",
      config: {
        expression: {
          type: "eq",
              left: {
                $ref: {
                  kind: "content-node-state",
                  scope: "current-component-instance",
                  localId: "content-node-user-form",
                  path: ["form", "valid"]
            }
          },
          right: true
        }
      },
      inputs: {},
      outputs: {},
      metadata: {
        x: 320,
        y: 160
      }
    },

    {
      id: "flow-node-create-user",
      type: "resource.request",
      config: {
            resource: {
              $ref: {
                kind: "resource",
                id: "resource-backend"
          }
        },
        method: "POST",
        path: "/users"
      },
      inputs: {
        body: {
          name: {
                $ref: {
                  kind: "content-node-state",
                  scope: "current-component-instance",
                  localId: "content-node-user-form",
                  path: ["form", "name"]
            }
          },
          email: {
                $ref: {
                  kind: "content-node-state",
                  scope: "current-component-instance",
                  localId: "content-node-user-form",
                  path: ["form", "email"]
            }
          }
        }
      },
      outputs: {
        data: { type: "unknown" },
        status: { type: "number" }
      },
      metadata: {
        x: 560,
        y: 80
      }
    },

    {
      id: "flow-node-show-validation",
      type: "overlay.action",
      config: {
        target: {
          kind: "overlay-tree",
          scope: "current-component-instance",
          localId: "overlay-validation"
        },
        action: "activate"
      },
      inputs: {},
      outputs: {},
      metadata: {
        x: 560,
        y: 240
      }
    }
  ],

  edges: [
    {
      id: "edge-trigger-condition",
      fromNode: "flow-node-click-save",
      fromPort: "default",
      toNode: "flow-node-is-valid",
      toPort: "in"
    },

    {
      id: "edge-condition-true",
      fromNode: "flow-node-is-valid",
      fromPort: "true",
      toNode: "flow-node-create-user",
      toPort: "in"
    },

    {
      id: "edge-condition-false",
      fromNode: "flow-node-is-valid",
      fromPort: "false",
      toNode: "flow-node-show-validation",
      toPort: "in"
    }
  ]
};

const flowDocument = {
  graphs: {
    "flow-save-user": saveUserFlowGraph
  }
} satisfies FlowDocument;

const componentFlowGraphs = {
  "flow-save-user": saveUserFlowGraph
} satisfies Readonly<Record<string, FlowGraph>>;

describe("flow document model", () => {
  // Flow Graph IDをKeyとしたDocumentから、Stable IDとDisplay Nameを持つ
  // Flow Graphを取得できることを確認する。
  it("keeps flow graph identity explicit", () => {
    const flow =
      flowDocument.graphs["flow-save-user"];

    expect(flow.id).toBe("flow-save-user");
    expect(flow.name).toBe("Save User");
  });

  // Application共通GraphとComponent固有Graphが別のDefinition型へ
  // 分岐せず、同じFlow Graph Schemaを使用できることを確認する。
  it("reuses the flow graph schema for components", () => {
    expect(
      componentFlowGraphs["flow-save-user"]
    ).toBe(saveUserFlowGraph);
  });

  // trueとfalseを独立したOutput PortとしてEdgeへ保存し、
  // 分岐先をNode内部の暗黙処理にしないことを確認する。
  it("stores execution branches as explicit edge ports", () => {
    const flow =
      flowDocument.graphs["flow-save-user"];

    const conditionEdges = flow.edges.filter(
      (edge) =>
        edge.fromNode === "flow-node-is-valid"
    );

    expect(
      conditionEdges.map((edge) => edge.fromPort)
    ).toEqual(["true", "false"]);
  });

  // Resource Requestの入力値が通常文字列ではなく、
  // Stable IDとPathを持つStructured Referenceとして
  // 保存されることを確認する。
  it("stores data dependencies as structured references", () => {
    const flow =
      flowDocument.graphs["flow-save-user"];

    const request = flow.nodes.find(
      (node) =>
        node.id === "flow-node-create-user"
    );

    expect(request?.inputs.body).toEqual({
      name: {
        $ref: {
          kind: "content-node-state",
          scope: "current-component-instance",
          localId: "content-node-user-form",
          path: ["form", "name"]
        }
      },
      email: {
        $ref: {
          kind: "content-node-state",
          scope: "current-component-instance",
          localId: "content-node-user-form",
          path: ["form", "email"]
        }
      }
    });
  });

  // Flow Editor上の座標がNodeの実行設定ではなく
  // metadataへ保存され、Canvas上の移動が
  // Application Behaviorを変更しないことを確認する。
  it("keeps editor geometry outside execution semantics", () => {
    const flow =
      flowDocument.graphs["flow-save-user"];

    const trigger = flow.nodes.find(
      (node) =>
        node.id === "flow-node-click-save"
    );

    expect(
      trigger?.metadata
    ).toEqual({
      x: 80,
      y: 160
    });

    expect(
      "position" in (trigger?.config ?? {})
    ).toBe(false);
  });

  // Flow Graphが永続Modelだけを保持し、Runtimeごとに異なるExecution IDや
  // Current NodeをProject Documentへ保存しないことを確認する。
  it("excludes runtime flow execution state", () => {
    expect("executionId" in saveUserFlowGraph).toBe(false);
    expect("currentNodes" in saveUserFlowGraph).toBe(false);
  });
});
