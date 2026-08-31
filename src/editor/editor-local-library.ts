import type { Component } from "../core/model/component";

const localTextComponent: Component = {
  id: "component-local-text",
  name: "Local Text",
  version: "0.1.0",
  contentTree: {
    rootNodeId: "content-node-local-text",
    nodes: {
      "content-node-local-text": {
        id: "content-node-local-text",
        name: "Local Text",
        type: "text",
        value: "このProjectだけで使うテキスト",
        state: {},
        slots: [],
        children: [],
        layout: null,
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

/** GUI確認用Projectが最初から持つLocal Component。 */
export const editorLocalLibraryAssets: Readonly<Record<string, Component>> = {
  [localTextComponent.id]: localTextComponent,
};
