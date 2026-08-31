import { describe, expect, it } from "vitest";
import type { FlowGraph } from "./model/flow";
import type { ProjectDocument } from "./model/project";
import {
  resolveComponentInstancePath,
  resolveCurrentComponentReferenceTarget,
  resolveProjectComponent,
  resolveProjectReferenceTarget,
  resolveReferencePath,
} from "./references";

const saveFlow: FlowGraph = {
  id: "flow-save-user",
  name: "Save User",
  variables: {},
  nodes: [
    {
      id: "flow-node-create-user",
      type: "resource.request",
      config: {},
      inputs: {},
      outputs: { data: { type: "unknown" } }
    }
  ],
  edges: []
};

const project: ProjectDocument = {
  meta: {
    id: "project-user-app",
    name: "User App",
    schemaVersion: "1",
    createdAt: "2026-08-29T00:00:00Z",
    updatedAt: "2026-08-29T00:00:00Z"
  },
  ui: {
    pages: {
      "ui-page-main": {
        id: "ui-page-main",
        name: "Main",
        overlayInstances: {},
        componentInstances: {
          "component-instance-user-form": {
            id: "component-instance-user-form",
            componentId: "component-user-form",
            componentVersion: "1.0.0"
          }
        }
      }
    }
  },
  flows: { graphs: { "flow-save-user": saveFlow } },
  state: {
    states: {
      "state-user": {
        id: "state-user",
        name: "Current User",
        schema: { type: "unknown" },
        initialValue: null
      }
    }
  },
  resources: {
    resources: {
      "resource-backend": {
        id: "resource-backend",
        name: "Backend",
        type: "rest",
        baseUrl: "https://example.invalid",
        commonHeaders: {}
      }
    }
  },
  components: {
    importedAssets: {
      "component-user-form": {
        source: {
          kind: "public",
          libraryId: "library-form-theme",
          libraryVersion: "1.2.0"
        },
        component: {
          id: "component-user-form",
          name: "User Form",
          version: "1.0.0",
          contentTree: {
            rootNodeId: "content-node-user-form",
            nodes: {
              "content-node-user-form": {
                id: "content-node-user-form",
                name: "User Form",
                type: "container",
                state: {
                  schema: {
                    type: "object",
                    properties: {
                      form: {
                        type: "object",
                        properties: {
                          name: { type: "string" }
                        },
                        required: ["name"]
                      }
                    },
                    required: ["form"]
                  },
                  initialValue: { form: { name: "" } }
                },
                slots: [{ id: "footer", name: "Footer" }],
                children: [
                  {
                    target: {
                      type: "component-instance",
                      componentInstanceId: "component-instance-save-button"
                    },
                    slotId: "footer"
                  }
                ],
                layout: { type: "slot" },
                size: {
                  width: { type: "fill" },
                  height: { type: "fit" }
                }
              }
            },
            componentInstances: {
              "component-instance-save-button": {
                id: "component-instance-save-button",
                componentId: "component-button",
                componentVersion: "1.0.0"
              }
            }
          },
          overlayTrees: {
            "overlay-validation": {
              id: "overlay-validation",
              name: "Validation",
              openTrigger: null,
              positioning: {
                type: "viewport",
                alignment: "center"
              },
              contentTree: {
                rootNodeId: "content-node-validation-message",
                nodes: {
                  "content-node-validation-message": {
                    id: "content-node-validation-message",
                    name: "Validation Message",
                    type: "text",
                    value: "Invalid",
                    state: {},
                    slots: [],
                    children: [],
                    layout: null,
                    size: {
                      width: { type: "fit" },
                      height: { type: "fit" }
                    }
                  }
                },
                componentInstances: {}
              }
            }
          },
          flowGraphs: { "flow-save-user": saveFlow }
        }
      }
    },
    localLibrary: {
      id: "library-local",
      name: "Local",
      assets: {
        "component-button": {
          id: "component-button",
          name: "Button",
          version: "1.0.0",
          contentTree: {
            rootNodeId: "content-node-button",
            nodes: {
              "content-node-button": {
                id: "content-node-button",
                name: "Button",
                type: "container",
                state: {},
                slots: [],
                children: [],
                layout: null,
                size: {
                  width: { type: "fit" },
                  height: { type: "fit" }
                }
              }
            },
            componentInstances: {}
          },
          overlayTrees: {},
          flowGraphs: {}
        }
      }
    }
  },
  settings: { environment: {} }
};

describe("reference resolution", () => {
  // Base／Publicから取り込んだSnapshotとProject固有Local Componentを
  // 同じComponent ID解決APIから取得できることを確認する。
  it("resolves imported and local project components", () => {
    expect(
      resolveProjectComponent(project, "component-user-form")?.name,
    ).toBe("User Form");
    expect(
      resolveProjectComponent(project, "component-button")?.name,
    ).toBe("Button");
  });

  // UI Page直下からNested Component Instanceまでの各Segmentをたどり、
  // Instanceが固定したVersionのComponent Assetを解決することを確認する。
  it("resolves an explicit component instance path", () => {
    const resolved = resolveComponentInstancePath(
      project,
      "ui-page-main",
      [
        "component-instance-user-form",
        "component-instance-save-button"
      ],
    );

    expect(resolved?.component.id).toBe("component-button");
    expect(resolved?.instance.id)
      .toBe("component-instance-save-button");
  });

  // Project共通ReferenceがUI Page直下からのPathとLocal IDを使い、
  // Nested Component内部のContent Nodeを解決できることを確認する。
  it("resolves an explicit local entity reference", () => {
    const target = resolveProjectReferenceTarget(
      project,
      {
        kind: "content-node",
        componentInstancePath: [
          "component-instance-user-form",
          "component-instance-save-button"
        ],
        localId: "content-node-button"
      },
      { pageId: "ui-page-main" },
    );

    expect(target).toMatchObject({
      id: "content-node-button",
      type: "container"
    });
  });

  // Component固有FlowのCurrent Instance Pathへ相対Pathを連結し、
  // 子Component内のLocal Entityを解決することを確認する。
  it("resolves a current component relative reference", () => {
    const target = resolveProjectReferenceTarget(
      project,
      {
        kind: "content-node",
        scope: "current-component-instance",
        componentInstancePath: ["component-instance-save-button"],
        localId: "content-node-button"
      },
      {
        pageId: "ui-page-main",
        currentComponentInstancePath: [
          "component-instance-user-form"
        ]
      },
    );

    expect(target).toMatchObject({ id: "content-node-button" });
  });

  // UI Pageへまだ配置されていないLibrary Componentでも、Component Assetを
  // 基点としてCurrent Scopeの子Instance Pathを静的検証できることを確認する。
  it("resolves current references from a component asset", () => {
    const component = project.components.importedAssets[
      "component-user-form"
    ].component;
    const target = resolveCurrentComponentReferenceTarget(
      project,
      component,
      {
        kind: "content-node",
        scope: "current-component-instance",
        componentInstancePath: ["component-instance-save-button"],
        localId: "content-node-button"
      },
    );

    expect(target).toMatchObject({ id: "content-node-button" });
  });

  // Application State、Resource、Project共通Flow Graph、Flow Node Outputが
  // Display NameではなくStable IDから解決されることを確認する。
  it("resolves project-level entities", () => {
    expect(resolveProjectReferenceTarget(project, {
      kind: "application-state",
      id: "state-user"
    })).toMatchObject({ id: "state-user" });

    expect(resolveProjectReferenceTarget(project, {
      kind: "resource",
      id: "resource-backend"
    })).toMatchObject({ id: "resource-backend" });

    expect(resolveProjectReferenceTarget(project, {
      kind: "flow-graph",
      id: "flow-save-user"
    })).toBe(saveFlow);

    expect(resolveProjectReferenceTarget(
      project,
      {
        kind: "flow-node-output",
        id: "flow-node-create-user",
        path: ["data"]
      },
      { currentFlowGraph: saveFlow },
    )).toMatchObject({ id: "flow-node-create-user" });
  });

  // Page、Instance、Component Version、Local IDのいずれかが欠けた場合に
  // 別Entityへ推測でFallbackせず、Missing Targetとして扱うことを確認する。
  it("returns undefined for missing reference targets", () => {
    expect(resolveProjectReferenceTarget(
      project,
      {
        kind: "content-node",
        componentInstancePath: ["component-instance-missing"],
        localId: "content-node-button"
      },
      { pageId: "ui-page-main" },
    )).toBeUndefined();

    expect(resolveProjectReferenceTarget(project, {
      kind: "resource",
      id: "resource-missing"
    })).toBeUndefined();
  });

  // 数値SegmentをArrayだけへ適用し、ObjectではOwn Propertyだけをたどることで、
  // 範囲外IndexやPrototype経由のPropertyを参照しないことを確認する。
  it("walks only valid own-property paths", () => {
    expect(resolveReferencePath(
      { users: [{ email: "a@example.com" }] },
      ["users", 0, "email"],
    )).toBe("a@example.com");
    expect(resolveReferencePath(["first"], [1])).toBeUndefined();

    const inherited = Object.create({ secret: "hidden" }) as object;
    expect(resolveReferencePath(inherited, ["secret"]))
      .toBeUndefined();
  });
});
