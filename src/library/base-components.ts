import type { Component } from "../core/model/component";
import type { PersistentStateValue } from "../core/model/state";
import type { ContentNode, ContentTree, UISize } from "../core/model/ui";
import type { LiteralValue } from "../core/model/value";

const fitSize: UISize = {
  width: { type: "fit" },
  height: { type: "fit" },
};

const fillWidthSize: UISize = {
  width: { type: "fill" },
  height: { type: "fit" },
};

function objectState(
  properties: Readonly<
    Record<string, { readonly type: "string" | "boolean" }>
  >,
  initialValue: Readonly<Record<string, LiteralValue>>,
): PersistentStateValue {
  return {
    schema: {
      type: "object",
      properties,
      required: Object.keys(properties),
    },
    initialValue,
  };
}

function tree(root: ContentNode, nodes: readonly ContentNode[] = []): ContentTree {
  return {
    rootNodeId: root.id,
    nodes: Object.fromEntries(
      [root, ...nodes].map((node) => [node.id, node]),
    ),
    componentInstances: {},
  };
}

function textNode(id: string, name: string, value: string): ContentNode {
  return {
    id,
    name,
    type: "text",
    value,
    state: {},
    slots: [],
    children: [],
    layout: null,
    size: fitSize,
  };
}

const textComponent: Component = {
  id: "component-base-text",
  name: "Text",
  version: "1.0.0",
  contentTree: tree({
    id: "content-node-text",
    name: "Text",
    type: "text",
    value: "テキスト",
    state: objectState(
      { text: { type: "string" } },
      { text: "テキスト" },
    ),
    slots: [],
    children: [],
    layout: null,
    size: fitSize,
  }),
  flowGraphs: {},
};

const inputComponent: Component = {
  id: "component-base-input",
  name: "Input",
  version: "1.0.0",
  contentTree: tree({
    id: "content-node-input",
    name: "Input",
    type: "input",
    state: objectState(
      {
        value: { type: "string" },
        placeholder: { type: "string" },
        disabled: { type: "boolean" },
      },
      { value: "", placeholder: "入力してください", disabled: false },
    ),
    slots: [],
    children: [],
    layout: null,
    size: fillWidthSize,
  }),
  flowGraphs: {},
};

const iconComponent: Component = {
  id: "component-base-icon",
  name: "Icon",
  version: "1.0.0",
  contentTree: tree({
    id: "content-node-icon",
    name: "Icon",
    type: "icon",
    state: objectState(
      {
        name: { type: "string" },
        label: { type: "string" },
      },
      { name: "star", label: "お気に入り" },
    ),
    slots: [],
    children: [],
    layout: null,
    size: fitSize,
  }),
  flowGraphs: {},
};

const buttonComponent: Component = {
  id: "component-base-button",
  name: "Button",
  version: "1.0.0",
  contentTree: tree({
    id: "content-node-button",
    name: "Button",
    type: "button",
    state: objectState(
      {
        label: { type: "string" },
        disabled: { type: "boolean" },
      },
      { label: "ボタン", disabled: false },
    ),
    slots: [{ id: "content", name: "Content" }],
    children: [],
    layout: { type: "slot" },
    size: fitSize,
  }),
  flowGraphs: {},
};

const imageComponent: Component = {
  id: "component-base-image",
  name: "Image",
  version: "1.0.0",
  contentTree: tree({
    id: "content-node-image",
    name: "Image",
    type: "image",
    state: objectState(
      {
        src: { type: "string" },
        alt: { type: "string" },
      },
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23dbeafe'/%3E%3Cpath d='M40 145l70-65 48 42 38-33 84 56' fill='none' stroke='%233b82f6' stroke-width='12'/%3E%3Ccircle cx='235' cy='50' r='18' fill='%233b82f6'/%3E%3C/svg%3E",
        alt: "サンプル画像",
      },
    ),
    slots: [],
    children: [],
    layout: null,
    size: fillWidthSize,
  }),
  flowGraphs: {},
};

const cardRoot: ContentNode = {
  id: "content-node-card",
  name: "Card",
  type: "container",
  state: {},
  slots: [
    { id: "header", name: "Header" },
    { id: "content", name: "Content" },
    { id: "footer", name: "Footer" },
  ],
  children: [
    {
      target: { type: "content-node", nodeId: "content-node-card-header" },
      slotId: "header",
    },
    {
      target: { type: "content-node", nodeId: "content-node-card-content" },
      slotId: "content",
    },
    {
      target: { type: "content-node", nodeId: "content-node-card-footer" },
      slotId: "footer",
    },
  ],
  layout: { type: "slot" },
  size: fillWidthSize,
};

const cardComponent: Component = {
  id: "component-base-card",
  name: "Card",
  version: "1.0.0",
  contentTree: tree(cardRoot, [
    textNode("content-node-card-header", "Header", "カード見出し"),
    textNode("content-node-card-content", "Content", "カード本文"),
    textNode("content-node-card-footer", "Footer", "補足"),
  ]),
  flowGraphs: {},
};

const modalRoot: ContentNode = {
  id: "content-node-modal",
  name: "Modal Window",
  type: "container",
  state: objectState(
    { open: { type: "boolean" } },
    { open: false },
  ),
  slots: [
    { id: "header", name: "Header" },
    { id: "content", name: "Content" },
    { id: "footer", name: "Footer" },
  ],
  children: [
    {
      target: { type: "content-node", nodeId: "content-node-modal-header" },
      slotId: "header",
    },
    {
      target: { type: "content-node", nodeId: "content-node-modal-content" },
      slotId: "content",
    },
    {
      target: { type: "content-node", nodeId: "content-node-modal-footer" },
      slotId: "footer",
    },
  ],
  layout: { type: "slot" },
  size: fillWidthSize,
};

const modalTree = tree(modalRoot, [
  textNode("content-node-modal-header", "Header", "モーダル見出し"),
  textNode("content-node-modal-content", "Content", "モーダル本文"),
  textNode("content-node-modal-footer", "Footer", "操作領域"),
]);

const modalComponent: Component = {
  id: "component-base-modal",
  name: "Modal",
  version: "1.0.0",
  contentTree: modalTree,
  allowedSurface: "overlay",
  flowGraphs: {},
};

/** FlagShip Baseが提供する最小Component Set。 */
export const baseComponents: Readonly<Record<string, Component>> = Object.fromEntries(
  [
    textComponent,
    inputComponent,
    modalComponent,
    iconComponent,
    buttonComponent,
    imageComponent,
    cardComponent,
  ].map((component) => [component.id, component]),
);
