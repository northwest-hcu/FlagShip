import { describe, expect, it } from "vitest";
import type { ProjectDocument } from "./model/project";
import {
  parseProjectJson,
  ProjectSerializationError,
  serializeProject,
} from "./serialization";

const project: ProjectDocument = {
  meta: {
    id: "project-serialization",
    name: "Serialization Fixture",
    schemaVersion: "1",
    createdAt: "2026-08-30T00:00:00Z",
    updatedAt: "2026-08-30T00:00:00Z"
  },
  ui: {
    pages: {
      "ui-page-main": {
        id: "ui-page-main",
        name: "Main",
        overlayInstances: {},
        componentInstances: {
          "component-instance-message": {
            id: "component-instance-message",
            componentId: "component-message",
            componentVersion: "0.1.0"
          }
        }
      }
    }
  },
  flows: { graphs: {} },
  state: { states: {} },
  resources: { resources: {} },
  components: {
    importedAssets: {},
    localLibrary: {
      id: "library-local",
      name: "Local",
      assets: {
        "component-message": {
          id: "component-message",
          name: "Message",
          version: "0.1.0",
          contentTree: {
            rootNodeId: "content-node-message",
            nodes: {
              "content-node-message": {
                id: "content-node-message",
                name: "Message",
                type: "text",
                state: {},
                value: "Hello",
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
          flowGraphs: {}
        }
      }
    }
  },
  settings: { environment: {} }
};

describe("project serialization", () => {
  // UI Page、Local Component、Text Content Nodeを含むProjectをJSONへ変換し、
  // Dataを欠落させず同じ構造へ復元できることを確認する。
  it("round-trips a representative project", () => {
    const serialized = serializeProject(project);

    expect(serialized.endsWith("\n")).toBe(true);
    expect(parseProjectJson(serialized)).toEqual(project);
  });

  // JSON.stringifyが通常は省略するundefinedを保存前に拒否し、
  // 問題位置をProject Pathとして返すことを確認する。
  it("rejects values that JSON would silently omit", () => {
    const invalid = structuredClone(project) as ProjectDocument & {
      transient?: undefined;
    };
    invalid.transient = undefined;

    expect(() => serializeProject(invalid)).toThrowError(
      expect.objectContaining({
        code: "NON_SERIALIZABLE_VALUE",
        path: ["transient"]
      }),
    );
  });

  // JSONがnullへ置換する非有限NumberとSparse Arrayを拒否し、
  // 保存後に値の意味が変わらないことを保証する。
  it("rejects lossy JSON values", () => {
    const nonFinite = structuredClone(project) as ProjectDocument & {
      invalidNumber?: number;
    };
    nonFinite.invalidNumber = Number.POSITIVE_INFINITY;

    expect(() => serializeProject(nonFinite)).toThrowError(
      expect.objectContaining({
        code: "NON_SERIALIZABLE_VALUE",
        path: ["invalidNumber"]
      }),
    );

    const sparse = structuredClone(project) as ProjectDocument & {
      invalidArray?: unknown[];
    };
    sparse.invalidArray = new Array(1);

    expect(() => serializeProject(sparse)).toThrowError(
      expect.objectContaining({
        code: "NON_SERIALIZABLE_VALUE",
        path: ["invalidArray", 0]
      }),
    );
  });

  // Projectへ循環参照やDate等のClass Instanceを混ぜず、
  // Canonical ModelをPlain JSON Dataに限定することを確認する。
  it("rejects circular and non-plain objects", () => {
    const circular = structuredClone(project) as ProjectDocument & {
      self?: unknown;
    };
    circular.self = circular;

    expect(() => serializeProject(circular)).toThrowError(
      expect.objectContaining({
        code: "NON_SERIALIZABLE_VALUE",
        path: ["self"]
      }),
    );

    const withDate = structuredClone(project) as ProjectDocument & {
      date?: Date;
    };
    withDate.date = new Date("2026-08-30T00:00:00Z");

    expect(() => serializeProject(withDate)).toThrowError(
      expect.objectContaining({
        code: "NON_SERIALIZABLE_VALUE",
        path: ["date"]
      }),
    );
  });

  // JSONが無視する非列挙Property、ArrayのNamed Property、および
  // 読込時に処理を実行するGetterをPersistent Dataとして拒否する。
  it("rejects properties that are not plain enumerable data", () => {
    const hidden = structuredClone(project) as ProjectDocument & {
      hidden?: string;
    };
    Object.defineProperty(hidden, "hidden", {
      value: "not serialized",
      enumerable: false
    });

    expect(() => serializeProject(hidden)).toThrowError(
      expect.objectContaining({
        code: "NON_SERIALIZABLE_VALUE",
        path: ["hidden"]
      }),
    );

    const withGetter = structuredClone(project) as ProjectDocument & {
      computed?: string;
    };
    Object.defineProperty(withGetter, "computed", {
      get: () => "computed",
      enumerable: true
    });

    expect(() => serializeProject(withGetter)).toThrowError(
      expect.objectContaining({
        code: "NON_SERIALIZABLE_VALUE",
        path: ["computed"]
      }),
    );

    const namedArray = [] as unknown[] & { label?: string };
    namedArray.label = "ignored by JSON";
    const withNamedArray = structuredClone(project) as ProjectDocument & {
      values?: typeof namedArray;
    };
    withNamedArray.values = namedArray;

    expect(() => serializeProject(withNamedArray)).toThrowError(
      expect.objectContaining({
        code: "NON_SERIALIZABLE_VALUE",
        path: ["values", "label"]
      }),
    );
  });

  // Syntax ErrorをNative JSON Errorの文言へ依存させず、
  // UIが扱える固定Codeへ変換することを確認する。
  it("reports invalid JSON with a stable error code", () => {
    expect(() => parseProjectJson("{"))
      .toThrowError(ProjectSerializationError);
    expect(() => parseProjectJson("{")).toThrowError(
      expect.objectContaining({
        code: "INVALID_JSON",
        path: []
      }),
    );
  });
});
