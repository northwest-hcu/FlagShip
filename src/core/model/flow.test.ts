import { describe, expect, it } from "vitest";
import type { FlowDocument } from "./flow";

// Trigger、Condition、Resource Requestを接続した代表的なFlowを定義する。
// satisfiesによって、NodeとEdgeの必須Propertyを型検査する。
const flowDocument = {
  flows: {
    "flow-save-user": {
      id: "flow-save-user",
      name: "Save User",
      nodes: [
        {
          id: "flow-node-click-save",
          type: "trigger.ui-event",
          config: {
            target: {
              $ref: {
                scope: "uiNode",
                id: "node-save-button"
              }
            },
            event: "click"
          },
          inputs: {},
          outputs: {},
          metadata: {
            position: { x: 80, y: 160 }
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
                  scope: "state",
                  id: "state-form",
                  path: ["valid"]
                }
              },
              right: true
            }
          },
          inputs: {},
          outputs: {},
          metadata: {
            position: { x: 320, y: 160 }
          }
        },

        {
          id: "flow-node-create-user",
          type: "resource.request",
          config: {
            resource: {
              $ref: {
                scope: "resource",
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
                  scope: "state",
                  id: "state-form",
                  path: ["name"]
                }
              },
              email: {
                $ref: {
                  scope: "state",
                  id: "state-form",
                  path: ["email"]
                }
              }
            }
          },
          outputs: {
            data: { type: "unknown" },
            status: { type: "number" }
          },
          metadata: {
            position: { x: 560, y: 80 }
          }
        },

        {
          id: "flow-node-show-validation",
          type: "ui.action",
          config: {
            target: {
              $ref: {
                scope: "uiNode",
                id: "node-validation-popover"
              }
            },
            action: "open"
          },
          inputs: {},
          outputs: {},
          metadata: {
            position: { x: 560, y: 240 }
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
    }
  }
} satisfies FlowDocument;

describe("flow document model", () => {
  // Flow IDをKeyとしたDocumentから、Stable IDとDisplay Nameを持つ
  // Flow Definitionを取得できることを確認する。
  it("keeps flow identity explicit", () => {
    const flow =
      flowDocument.flows["flow-save-user"];

    expect(flow.id).toBe("flow-save-user");
    expect(flow.name).toBe("Save User");
  });

  // trueとfalseを独立したOutput PortとしてEdgeへ保存し、
  // 分岐先をNode内部の暗黙処理にしないことを確認する。
  it("stores execution branches as explicit edge ports", () => {
    const flow =
      flowDocument.flows["flow-save-user"];

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
      flowDocument.flows["flow-save-user"];

    const request = flow.nodes.find(
      (node) =>
        node.id === "flow-node-create-user"
    );

    expect(request?.inputs.body).toEqual({
      name: {
        $ref: {
          scope: "state",
          id: "state-form",
          path: ["name"]
        }
      },
      email: {
        $ref: {
          scope: "state",
          id: "state-form",
          path: ["email"]
        }
      }
    });
  });

  // Flow Editor上の座標がNodeの実行設定ではなく
  // metadataへ保存され、Canvas上の移動が
  // Application Behaviorを変更しないことを確認する。
  it("keeps editor geometry outside execution semantics", () => {
    const flow =
      flowDocument.flows["flow-save-user"];

    const trigger = flow.nodes.find(
      (node) =>
        node.id === "flow-node-click-save"
    );

    expect(
      trigger?.metadata?.position
    ).toEqual({
      x: 80,
      y: 160
    });

    expect(
      "position" in (trigger?.config ?? {})
    ).toBe(false);
  });
});