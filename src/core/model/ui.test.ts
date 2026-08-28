import { describe, expect, it } from "vitest";
import type {
  ContentTree,
  UIDocument,
} from "./ui";

// UI DocumentがUI PageをStable IDで管理できることを確認する代表例。
const uiDocument = {
  pages: {
    "ui-page-users": {
      id: "ui-page-users",
      name: "Users",
    },
  },
} satisfies UIDocument;

// User Form Componentが所有するContent Treeの代表例。
// Root以外の子は、親が定義した名前付きSlotへ必ず明示的に配置する。
const userFormContentTree: ContentTree = {
  rootNodeId: "content-node-user-form",
  nodes: {
    "content-node-user-form": {
      id: "content-node-user-form",
      name: "User Form",
      type: "container",
      state: {
        form: {
          name: "",
          email: "",
        },
      },
      slots: [
        { id: "header", name: "Header" },
        { id: "fields", name: "Fields" },
        { id: "footer", name: "Footer" },
      ],
      children: [
        {
          target: {
            type: "content-node",
            nodeId: "content-node-form-title",
          },
          slotId: "header",
        },
        {
          target: {
            type: "component-instance",
            componentInstanceId: "component-instance-name-input",
          },
          slotId: "fields",
        },
        {
          target: {
            type: "component-instance",
            componentInstanceId: "component-instance-email-input",
          },
          slotId: "fields",
        },
        {
          target: {
            type: "component-instance",
            componentInstanceId: "component-instance-save-button",
          },
          slotId: "footer",
        },
      ],
      layout: { type: "slot" },
      size: {
        width: { type: "fill" },
        height: { type: "fit" },
      },
    },

    // Raw StringをTreeへ直接入れず、Stable IDを持つLeaf Nodeとして保持する。
    "content-node-form-title": {
      id: "content-node-form-title",
      name: "Form Title",
      type: "text",
      value: "Create user",
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
};

describe("UI document model", () => {
  // UI DocumentがPageを直接Nodeとして扱わず、pages Collectionで管理することを確認する。
  it("keeps UI pages in an explicit collection", () => {
    expect(uiDocument.pages["ui-page-users"]).toEqual({
      id: "ui-page-users",
      name: "Users",
    });
  });

  // Content TreeのRootが他のNodeと同じCollectionからStable IDで解決できることを確認する。
  it("keeps one explicit root content node", () => {
    expect(userFormContentTree.rootNodeId).toBe(
      "content-node-user-form",
    );

    expect(
      userFormContentTree.nodes[userFormContentTree.rootNodeId].name,
    ).toBe("User Form");
  });

  // すべてのChild Placementが、親に存在する名前付きSlotを明示することを確認する。
  it("places every child in an explicit named slot", () => {
    const root = userFormContentTree.nodes[
      userFormContentTree.rootNodeId
    ];

    expect(root.type).toBe("container");

    if (root.type !== "container") {
      throw new Error("Expected the root to be a container");
    }

    const slotIds = new Set(
      root.slots.map((slot) => slot.id),
    );

    expect(
      root.children.every(
        (child) =>
          child.slotId !== "default" &&
          slotIds.has(child.slotId),
      ),
    ).toBe(true);
  });

  // Text Content NodeがRaw Stringの代わりにStable IDとValueを持つLeafになることを確認する。
  it("stores text as a leaf content node", () => {
    const textNode = userFormContentTree.nodes[
      "content-node-form-title"
    ];

    expect(textNode.type).toBe("text");

    if (textNode.type !== "text") {
      throw new Error("Expected a text content node");
    }

    expect(textNode.value).toBe("Create user");
    expect(textNode.slots).toEqual([]);
    expect(textNode.children).toEqual([]);
    expect(textNode.layout).toBeNull();
  });

  // Form入力の初期値がApplication共有Stateではなく、Content Node Stateに属することを確認する。
  it("keeps form initial state on its content node", () => {
    expect(
      userFormContentTree.nodes["content-node-user-form"].state,
    ).toEqual({
      form: {
        name: "",
        email: "",
      },
    });
  });
});
