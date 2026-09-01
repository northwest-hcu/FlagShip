import type {
  Component,
  ComponentLibraryCatalog,
} from "../core/model/component";
import { baseComponents } from "./base-components";

const verticalStackComponent: Component = {
  id: "component-base-vertical-stack",
  name: "Vertical Stack",
  version: "1.0.0",
  contentTree: {
    rootNodeId: "content-node-stack",
    nodes: {
      "content-node-stack": {
        id: "content-node-stack",
        name: "Vertical Stack",
        type: "container",
        state: {},
        slots: [{ id: "content", name: "Content" }],
        children: [
          {
            target: {
              type: "content-node",
              nodeId: "content-node-stack-first",
            },
            slotId: "content",
          },
          {
            target: {
              type: "content-node",
              nodeId: "content-node-stack-second",
            },
            slotId: "content",
          },
        ],
        layout: {
          type: "stack",
          direction: "vertical",
          gap: "sm",
          padding: "md",
        },
        size: {
          width: { type: "fill" },
          height: { type: "fit" },
        },
      },
      "content-node-stack-first": {
        id: "content-node-stack-first",
        name: "First Text",
        type: "text",
        value: "1つ目の項目",
        state: {},
        slots: [],
        children: [],
        layout: null,
        size: {
          width: { type: "fit" },
          height: { type: "fit" },
        },
      },
      "content-node-stack-second": {
        id: "content-node-stack-second",
        name: "Second Text",
        type: "text",
        value: "2つ目の項目",
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

const noticeComponent: Component = {
  id: "component-public-notice",
  name: "Notice",
  version: "1.0.0",
  contentTree: {
    rootNodeId: "content-node-notice",
    nodes: {
      "content-node-notice": {
        id: "content-node-notice",
        name: "Notice",
        type: "text",
        value: "Simple Themeから追加したお知らせ",
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

/** Editorで選択できる初期Component Library Catalog。 */
export const componentLibraryCatalog: ComponentLibraryCatalog = {
  libraries: {
    "library-flagship-base": {
      kind: "base",
      id: "library-flagship-base",
      name: "FlagShip Base",
      version: "1.0.0",
      assets: {
        ...baseComponents,
        [verticalStackComponent.id]: verticalStackComponent,
      },
    },
    "library-simple-theme": {
      kind: "public",
      id: "library-simple-theme",
      name: "Simple Theme",
      version: "1.0.0",
      assets: {
        [noticeComponent.id]: noticeComponent,
      },
    },
  },
};
