import { describe, expect, it } from "vitest";
import type { UIDocument } from "./ui";

// UI Documentの代表例を定義する。
// satisfiesによって、必須Propertyの不足や不正な値を型検査で検出する。
const uiDocument = {
  roots: ["node-home-page"],
  nodes: {
    // ApplicationのRootとなり、Content Surfaceへ描画するPage Node。
    "node-home-page": {
      id: "node-home-page",
      type: "ui-page",
      name: "Home Page",
      parentId: null,
      slot: null,
      children: ["node-user-card"],
      props: {},
      layout: {
        type: "stack",
        direction: "vertical",
        gap: "md",
        align: "stretch"
      },
      size: {
        width: { type: "fill" },
        height: { type: "fill" }
      },
      presentation: { surface: "content" }
    },

    // Named Slotを持ち、子Nodeの配置をSlot Contractへ委譲するCard Node。
    "node-user-card": {
      id: "node-user-card",
      type: "ui-card",
      name: "User Card",
      parentId: "node-home-page",
      slot: null,
      children: [
        "node-save-button",
        "node-validation-popover"
      ],
      props: {},
      layout: { type: "slot" },
      size: {
        width: { type: "fill" },
        height: { type: "fit" }
      },
      presentation: { surface: "content" }
    },

    // Cardのactions Slotに所属し、State ReferenceをPropertyに持つButton Node。
    "node-save-button": {
      id: "node-save-button",
      type: "ui-button",
      name: "Save Button",
      parentId: "node-user-card",
      slot: "actions",
      children: [],
      props: {
        label: "Save",
        disabled: {
          $ref: {
            scope: "state",
            id: "state-form",
            path: ["submitting"]
          }
        }
      },
      layout: null,
      size: {
        width: { type: "fit" },
        height: { type: "fit" }
      },
      presentation: { surface: "content" }
    },

    // Logical ParentはCardのまま維持し、Save Buttonを基準として
    // Anchored Overlay Surfaceへ描画するPopover Node。
    "node-validation-popover": {
      id: "node-validation-popover",
      type: "ui-popover",
      name: "Validation Popover",
      parentId: "node-user-card",
      slot: null,
      children: [],
      props: {},
      layout: null,
      size: {
        width: { type: "fit" },
        height: { type: "fit" }
      },
      presentation: {
        surface: "overlay.anchored",
        anchor: "node-save-button",
        placement: "bottom-start"
      }
    }
  }
} satisfies UIDocument;

describe("UI document model", () => {
  // Root、Parent、Child、Named Slotが明示的に保存され、
  // Logical OwnershipをDOM構造から推測する必要がないことを確認する。
  it("keeps roots and logical ownership explicit", () => {
    expect(uiDocument.roots).toEqual([
      "node-home-page"
    ]);

    expect(
      uiDocument.nodes["node-home-page"].parentId
    ).toBeNull();

    expect(
      uiDocument.nodes["node-save-button"].parentId
    ).toBe("node-user-card");

    expect(
      uiDocument.nodes["node-save-button"].slot
    ).toBe("actions");
  });

  // Overlayへ描画するNodeでもLogical Parentを維持し、
  // Logical OwnershipとPhysical Renderingが分離されていることを確認する。
  it("keeps overlay rendering separate from logical ownership", () => {
    const popover =
      uiDocument.nodes["node-validation-popover"];

    expect(popover.parentId).toBe(
      "node-user-card"
    );

    expect(popover.presentation).toEqual({
      surface: "overlay.anchored",
      anchor: "node-save-button",
      placement: "bottom-start"
    });
  });

  // Component PropertyのDynamic Valueが通常文字列ではなく、
  // $refを持つStructured Referenceとして保存されることを確認する。
  it("stores property bindings as structured references", () => {
    expect(
      uiDocument.nodes["node-save-button"]
        .props.disabled
    ).toEqual({
      $ref: {
        scope: "state",
        id: "state-form",
        path: ["submitting"]
      }
    });
  });
});