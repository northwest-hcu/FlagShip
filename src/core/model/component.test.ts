import { describe, expect, it } from "vitest";
import type {
  Component,
  ComponentLibraryCatalog,
} from "./component";

const modalComponent: Component = {
  id: "component-modal",
  name: "Modal",
  version: "1.0.0",
  contentTree: null,
  overlayTrees: {
    "overlay-modal": {
      id: "overlay-modal",
      name: "Modal",
      openTrigger: null,
      positioning: {
        type: "viewport",
        alignment: "center"
      },
      contentTree: {
        rootNodeId: "content-node-modal-window",
        nodes: {
          "content-node-modal-window": {
            id: "content-node-modal-window",
            name: "Modal Window",
            type: "container",
            state: {},
            slots: [
              { id: "header", name: "Header" },
              { id: "body", name: "Body" },
              { id: "footer", name: "Footer" }
            ],
            children: [],
            layout: { type: "slot" },
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
  flowGraphs: {}
};

const popupButtonComponent: Component = {
  id: "component-popup-button",
  name: "Popup Button",
  version: "1.0.0",
  contentTree: {
    rootNodeId: "content-node-popup-button",
    nodes: {
      "content-node-popup-button": {
        id: "content-node-popup-button",
        name: "Popup Button",
        type: "container",
        state: {},
        slots: [{ id: "trigger", name: "Trigger" }],
        children: [
          {
            target: {
              type: "component-instance",
              componentInstanceId: "component-instance-trigger-button"
            },
            slotId: "trigger"
          }
        ],
        layout: { type: "slot" },
        size: {
          width: { type: "fit" },
          height: { type: "fit" }
        }
      }
    },
    componentInstances: {
      "component-instance-trigger-button": {
        id: "component-instance-trigger-button",
        componentId: "component-button",
        componentVersion: "1.0.0"
      }
    }
  },
  overlayTrees: {
    "overlay-popup": {
      id: "overlay-popup",
      name: "Popup",
      openTrigger: {
        id: "trigger-open-popup",
        triggerTypeId: "ui.click",
        config: {
          target: {
            kind: "content-node",
            scope: "current-component-instance",
            componentInstancePath: ["component-instance-trigger-button"],
            localId: "content-node-button"
          }
        }
      },
      positioning: {
        type: "anchor",
        anchor: {
          kind: "content-node",
          scope: "current-component-instance",
          componentInstancePath: ["component-instance-trigger-button"],
          localId: "content-node-button"
        },
        placement: "bottom"
      },
      contentTree: {
        rootNodeId: "content-node-popup-window",
        nodes: {
          "content-node-popup-window": {
            id: "content-node-popup-window",
            name: "Popup Window",
            type: "container",
            state: {},
            slots: [{ id: "content", name: "Content" }],
            children: [],
            layout: { type: "slot" },
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
  flowGraphs: {}
};

const libraryCatalog: ComponentLibraryCatalog = {
  libraries: {
    "library-base": {
      kind: "base",
      id: "library-base",
      name: "FlagShip Base",
      version: "1.0.0",
      assets: { "component-modal": modalComponent }
    },
    "library-popup-theme": {
      kind: "public",
      id: "library-popup-theme",
      name: "Popup Theme",
      version: "2.0.0",
      assets: {
        "component-popup-button": popupButtonComponent
      }
    }
  }
};

describe("component model", () => {
  // Modalは通常Contentを持たないOverlay専用Componentとして保存でき、
  // 外部Buttonとの接続を暗黙に作らないことを確認する。
  it("keeps a modal unbound by default", () => {
    expect(modalComponent.contentTree).toBeNull();
    expect(
      modalComponent.overlayTrees["overlay-modal"]
        .openTrigger
    ).toBeNull();
  });

  // Popup Buttonは通常Buttonと異なり、内部Event Sourceに接続済みの
  // Open Triggerを明示的に保持できることを確認する。
  it("stores a popup button with an explicit open trigger", () => {
    expect(
      popupButtonComponent.overlayTrees["overlay-popup"]
        .openTrigger
    ).toEqual({
      id: "trigger-open-popup",
      triggerTypeId: "ui.click",
      config: {
        target: {
          kind: "content-node",
          scope: "current-component-instance",
          componentInstancePath: ["component-instance-trigger-button"],
          localId: "content-node-button"
        }
      }
    });
  });

  // Overlayの表示内容がComponent直下のContent Treeと混ざらず、
  // Overlay Tree自身のContent Treeに属することを確認する。
  it("keeps overlay content inside the overlay tree", () => {
    expect(
      modalComponent.overlayTrees["overlay-modal"]
        .contentTree.rootNodeId
    ).toBe("content-node-modal-window");
  });

  // 標準Libraryと追加導入Libraryを同じCatalogから選択でき、取得元区分を
  // Component Selectorの構造へ反映しないことを確認する。
  it("stores all installed libraries in one catalog", () => {
    expect(
      libraryCatalog.libraries["library-base"]
        .assets["component-modal"],
    ).toBe(modalComponent);
    expect(
      libraryCatalog.libraries["library-popup-theme"]
        .assets["component-popup-button"],
    ).toBe(popupButtonComponent);
  });
});
