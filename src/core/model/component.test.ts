import { describe, expect, it } from "vitest";
import type { Component, ComponentLibraryCatalog } from "./component";

const modalComponent: Component = {
  id: "component-modal",
  name: "Modal",
  version: "1.0.0",
  allowedSurface: "overlay",
  contentTree: {
    rootNodeId: "content-node-modal",
    nodes: {
      "content-node-modal": {
        id: "content-node-modal",
        name: "Modal",
        type: "container",
        state: {},
        slots: [{ id: "content", name: "Content" }],
        children: [],
        layout: { type: "slot" },
        size: {
          width: { type: "fit" },
          height: { type: "fit" },
        },
      },
    },
    componentInstances: {},
  },
  flowGraphs: {},
};

const libraryCatalog: ComponentLibraryCatalog = {
  libraries: {
    "library-base": {
      kind: "base",
      id: "library-base",
      name: "FlagShip Base",
      version: "1.0.0",
      assets: { "component-modal": modalComponent },
    },
  },
};

describe("component model", () => {
  // Modalも他のComponentと同じく単一Content Treeを持ち、
  // 配置先だけがOverlay Surfaceへ制約されることを確認する。
  it("models Modal as one Component with an Overlay placement constraint", () => {
    expect(modalComponent.allowedSurface).toBe("overlay");
    expect(modalComponent.contentTree.rootNodeId).toBe("content-node-modal");
    expect(modalComponent.flowGraphs).toEqual({});
  });

  // Library種別をComponentの構造へ持ち込まず、同じCatalogから選択できることを確認する。
  it("stores the Modal in the common library catalog", () => {
    expect(libraryCatalog.libraries["library-base"].assets["component-modal"])
      .toBe(modalComponent);
  });
});
