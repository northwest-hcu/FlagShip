import { describe, expect, it } from "vitest";
import type { ProjectDocument } from "./project";

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
  flows: { graphs: {} },
  state: { states: {} },
  resources: { resources: {} },
  components: {
    assets: {
      "component-user-form": {
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
              state: {},
              slots: [],
              children: [],
              layout: null,
              size: {
                width: { type: "fill" },
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
  },
  settings: { environment: {} }
};

describe("project composition model", () => {
  // UI Pageが配置済みComponent Instanceを所有し、Instanceは利用する
  // Component IDとVersionだけを保持することを確認する。
  it("places component instances on UI pages", () => {
    const instance = project.ui.pages["ui-page-main"]
      .componentInstances["component-instance-user-form"];

    expect(instance).toEqual({
      id: "component-instance-user-form",
      componentId: "component-user-form",
      componentVersion: "1.0.0"
    });
    expect("parentId" in instance).toBe(false);
    expect("slotId" in instance).toBe(false);
  });

  // Projectへ取り込んだComponent AssetのVersionと、Instanceが固定した
  // Versionを明示的に照合できることを確認する。
  it("pins an imported component version", () => {
    const instance = project.ui.pages["ui-page-main"]
      .componentInstances["component-instance-user-form"];
    const component = project.components.assets[
      instance.componentId
    ];

    expect(component.version).toBe(instance.componentVersion);
  });

  // Component内のContent Node、Overlay Tree、Flow Graphを
  // Instanceへ複製せず、Component Assetから解決することを確認する。
  it("keeps reusable definitions on the component asset", () => {
    const instance = project.ui.pages["ui-page-main"]
      .componentInstances["component-instance-user-form"];

    expect("contentTree" in instance).toBe(false);
    expect(
      project.components.assets[instance.componentId]
        .contentTree?.rootNodeId
    ).toBe("content-node-user-form");
  });
});
