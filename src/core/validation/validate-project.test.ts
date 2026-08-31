import { describe, expect, it } from "vitest";
import type { ProjectDocument } from "../model/project";
import { validateProject } from "./validate-project";

type DeepWritable<T> = T extends readonly (infer Item)[]
  ? DeepWritable<Item>[]
  : T extends object
    ? { -readonly [Key in keyof T]: DeepWritable<T[Key]> }
    : T;

const validProject: ProjectDocument = {
  meta: {
    id: "project-validation-fixture",
    name: "Validation Fixture",
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
          "component-instance-card": {
            id: "component-instance-card",
            componentId: "component-card",
            componentVersion: "1.0.0"
          }
        }
      }
    }
  },
  flows: {
    graphs: {
      "flow-load": {
        id: "flow-load",
        name: "Load",
        variables: {},
        nodes: [
          {
            id: "flow-node-load",
            type: "trigger.lifecycle",
            config: {},
            inputs: {},
            outputs: {}
          }
        ],
        edges: []
      }
    }
  },
  state: {
    states: {
      "state-user": {
        id: "state-user",
        name: "User",
        schema: {
          type: "object",
          properties: {
            name: { type: "string" }
          },
          required: ["name"]
        },
        initialValue: { name: "" }
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
      "component-card": {
        source: {
          kind: "base",
          libraryId: "library-base",
          libraryVersion: "1.0.0"
        },
        component: {
          id: "component-card",
          name: "Card",
          version: "1.0.0",
          contentTree: {
            rootNodeId: "content-node-card",
            nodes: {
              "content-node-card": {
                id: "content-node-card",
                name: "Card",
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
          },
          flowGraphs: {}
        }
      }
    },
    localLibrary: {
      id: "library-local",
      name: "Local",
      assets: {}
    }
  },
  settings: { environment: {} }
};

function createDraft(): DeepWritable<ProjectDocument> {
  return structuredClone(validProject) as DeepWritable<ProjectDocument>;
}

function validateDraft(
  draft: DeepWritable<ProjectDocument>,
) {
  return validateProject(draft as unknown as ProjectDocument);
}

describe("project validation", () => {
  // ID、Component Version、Content Tree、Flow、State、Resourceが整合する
  // ProjectではDiagnosticを生成しないことを確認する。
  it("accepts a structurally valid project", () => {
    expect(validateProject(validProject)).toEqual([]);
  });

  // 読み書き対象外のSchema Versionと、Entity種別に合わないStable IDを
  // 保存前に独立したDiagnostic Codeで検出することを確認する。
  it("rejects unsupported schemas and invalid IDs", () => {
    const draft = createDraft();
    draft.meta.schemaVersion = "2" as "1";
    draft.ui.pages["ui-page-main"].id = "component-main";

    const codes = validateDraft(draft).map(({ code }) => code);

    expect(codes).toContain("UNSUPPORTED_SCHEMA_VERSION");
    expect(codes).toContain("INVALID_STABLE_ID");
    expect(codes).toContain("COLLECTION_KEY_MISMATCH");
  });

  // Collection Keyだけを変えて同じStable IDを複製した不正Dataを、
  // Key不一致とは別にProject Scope内のID重複として検出する。
  it("detects duplicate stable IDs", () => {
    const draft = createDraft();
    draft.state.states["state-user-alias"] = structuredClone(
      draft.state.states["state-user"],
    );

    const codes = validateDraft(draft).map(({ code }) => code);

    expect(codes).toContain("COLLECTION_KEY_MISMATCH");
    expect(codes).toContain("DUPLICATE_STABLE_ID");
  });

  // Imported Snapshotが取得元LibraryのStable IDとVersionを保持し、
  // 取得元を再現できない不完全なMetadataを拒否することを確認する。
  it("detects invalid imported library sources", () => {
    const draft = createDraft();
    const source = draft.components
      .importedAssets["component-card"].source;
    source.kind = "local" as "base";
    source.libraryId = "component-not-a-library";
    source.libraryVersion = "   ";

    const codes = validateDraft(draft).map(({ code }) => code);

    expect(codes).toContain("INVALID_STABLE_ID");
    expect(codes).toContain("INVALID_LIBRARY_SOURCE");
  });

  // Imported SnapshotとLocal Libraryへ同じComponent IDを保存した場合、
  // Resolverがどちらかを暗黙に優先しないようID重複として検出する。
  it("detects component IDs shared by imported and local assets", () => {
    const draft = createDraft();
    draft.components.localLibrary.assets["component-card"] =
      structuredClone(
        draft.components.importedAssets["component-card"].component,
      );

    const codes = validateDraft(draft).map(({ code }) => code);

    expect(codes).toContain("DUPLICATE_STABLE_ID");
    expect(codes).toContain("AMBIGUOUS_COMPONENT");
    expect(codes).not.toContain("MISSING_COMPONENT");
  });

  // Component IDが存在しない場合と、取り込み済みAssetとVersionが違う場合を
  // 別の構造Errorとして検出することを確認する。
  it("detects missing components and version mismatches", () => {
    const missing = createDraft();
    missing.ui.pages["ui-page-main"]
      .componentInstances["component-instance-card"]
      .componentId = "component-missing";

    const mismatch = createDraft();
    mismatch.ui.pages["ui-page-main"]
      .componentInstances["component-instance-card"]
      .componentVersion = "2.0.0";

    expect(validateDraft(missing).map(({ code }) => code))
      .toContain("MISSING_COMPONENT");
    expect(validateDraft(mismatch).map(({ code }) => code))
      .toContain("COMPONENT_VERSION_MISMATCH");
  });

  // Default Slotを定義・参照できず、Content Node同士の循環も
  // Content Treeの構造Errorとして検出することを確認する。
  it("detects reserved slots and circular content trees", () => {
    const draft = createDraft();
    const root = draft.components.importedAssets["component-card"]
      .component.contentTree?.nodes["content-node-card"];

    if (root?.type !== "container") {
      throw new Error("Expected a container root");
    }

    root.slots[0].id = "default";
    root.children.push({
      target: {
        type: "content-node",
        nodeId: "content-node-card"
      },
      slotId: "default"
    });

    const codes = validateDraft(draft).map(({ code }) => code);

    expect(codes).toContain("RESERVED_DEFAULT_SLOT");
    expect(codes).toContain("CIRCULAR_CONTENT_TREE");
  });

  // Default Slotと同様に、空文字のNamed SlotおよびChild Placementを
  // 有効な配置先として扱わないことを確認する。
  it("rejects empty named slot IDs", () => {
    const draft = createDraft();
    const root = draft.components.importedAssets["component-card"]
      .component.contentTree?.nodes["content-node-card"];

    if (root?.type !== "container") {
      throw new Error("Expected a container root");
    }

    root.slots[0].id = "";
    root.children.push({
      target: {
        type: "content-node",
        nodeId: "content-node-card"
      },
      slotId: ""
    });

    expect(validateDraft(draft).map(({ code }) => code))
      .toContain("MISSING_SLOT");
  });

  // Collectionへ存在するだけで親のChild Placementから参照されないNodeや、
  // 複数回配置されたNodeを暗黙の追加Rootとして扱わないことを確認する。
  it("detects invalid content tree parent counts", () => {
    const draft = createDraft();
    const tree = draft.components.importedAssets["component-card"]
      .component.contentTree;

    if (tree === null) {
      throw new Error("Expected a content tree");
    }

    tree.nodes["content-node-orphan"] = {
      id: "content-node-orphan",
      name: "Orphan",
      type: "container",
      state: {},
      slots: [],
      children: [],
      layout: null,
      size: {
        width: { type: "fit" },
        height: { type: "fit" }
      }
    };

    expect(validateDraft(draft).map(({ code }) => code))
      .toContain("INVALID_PARENT_REFERENCE");
  });

  // Edgeが存在しないNodeを指す場合と、Flow内のStructured Referenceが
  // 削除済みResourceを指す場合を同じValidation Pipelineで検出する。
  it("detects broken flow edges and references", () => {
    const draft = createDraft();
    const graph = draft.flows.graphs["flow-load"];
    graph.nodes[0].config = {
      resource: {
        $ref: {
          kind: "resource",
          id: "resource-missing"
        }
      }
    };
    graph.edges.push({
      id: "edge-missing-target",
      fromNode: "flow-node-load",
      fromPort: "default",
      toNode: "flow-node-missing",
      toPort: "in"
    });

    const codes = validateDraft(draft).map(({ code }) => code);

    expect(codes).toContain("MISSING_FLOW_NODE");
    expect(codes).toContain("MISSING_REFERENCE_TARGET");
  });

  // Text Content Nodeへ埋め込んだStructured ReferenceもFlow設定と同様に走査し、
  // 削除済みApplication Stateを描画しようとするProjectを保存前に拒否する。
  it("detects broken references in text content", () => {
    const draft = createDraft();
    const tree = draft.components.importedAssets["component-card"]
      .component.contentTree;

    if (tree === null) {
      throw new Error("Expected a content tree");
    }

    tree.nodes["content-node-label"] = {
      id: "content-node-label",
      name: "Label",
      type: "text",
      state: {},
      value: {
        $ref: {
          kind: "application-state",
          id: "state-missing",
          path: ["name"]
        }
      },
      slots: [],
      children: [],
      layout: null,
      size: {
        width: { type: "fit" },
        height: { type: "fit" }
      }
    };

    const root = tree.nodes["content-node-card"];
    if (root.type !== "container") {
      throw new Error("Expected a container root");
    }
    root.children.push({
      target: {
        type: "content-node",
        nodeId: "content-node-label"
      },
      slotId: "content"
    });

    expect(validateDraft(draft).map(({ code }) => code))
      .toContain("MISSING_REFERENCE_TARGET");
  });

  // SchemaとInitial Valueを別々に正しいものとして扱わず、
  // 両者の形が一致しないStateを拒否することを確認する。
  it("detects state initial values that violate their schema", () => {
    const draft = createDraft();
    draft.state.states["state-user"].initialValue = {
      name: 42
    };

    expect(validateDraft(draft).map(({ code }) => code))
      .toContain("INVALID_STATE_INITIAL_VALUE");
  });

  // requiredへSchemaに存在しないPropertyや同じPropertyを重複指定した
  // 不正なState SchemaをInitial Value検証より前に検出する。
  it("detects invalid state schemas", () => {
    const draft = createDraft();
    const schema = draft.state.states["state-user"].schema;

    if (schema.type !== "object") {
      throw new Error("Expected an object schema");
    }
    schema.required.push("missing", "missing");

    expect(validateDraft(draft).map(({ code }) => code))
      .toContain("INVALID_STATE_SCHEMA");
  });

  // Componentが自身を子Instanceとして配置する再帰構造を検出し、
  // Rendererが無限にComponentを展開する状態を防ぐことを確認する。
  it("detects circular component composition", () => {
    const draft = createDraft();
    const tree = draft.components.importedAssets["component-card"]
      .component.contentTree;

    if (tree === null) {
      throw new Error("Expected a content tree");
    }

    tree.componentInstances["component-instance-nested-card"] = {
      id: "component-instance-nested-card",
      componentId: "component-card",
      componentVersion: "1.0.0"
    };

    const root = tree.nodes["content-node-card"];
    if (root.type !== "container") {
      throw new Error("Expected a container root");
    }
    root.children.push({
      target: {
        type: "component-instance",
        componentInstanceId: "component-instance-nested-card"
      },
      slotId: "content"
    });

    expect(validateDraft(draft).map(({ code }) => code))
      .toContain("CIRCULAR_COMPONENT_COMPOSITION");
  });

  // Page IDをReferenceに含めないExplicit Pathが複数Pageで解決される場合、
  // 先に見つかったTargetを採用せず曖昧なReferenceとして拒否する。
  it("detects component references that are ambiguous across pages", () => {
    const draft = createDraft();
    draft.ui.pages["ui-page-secondary"] = structuredClone(
      draft.ui.pages["ui-page-main"],
    );
    draft.ui.pages["ui-page-secondary"].id = "ui-page-secondary";
    draft.flows.graphs["flow-load"].nodes[0].config = {
      target: {
        kind: "content-node",
        componentInstancePath: ["component-instance-card"],
        localId: "content-node-card"
      }
    };

    expect(validateDraft(draft).map(({ code }) => code))
      .toContain("AMBIGUOUS_REFERENCE_TARGET");
  });
});
