import { describe, expect, it } from "vitest";
import type {
  PersistentStateValue,
  StateDocument,
} from "./state";

const stateDocument: StateDocument = {
  states: {
    "state-user": {
      id: "state-user",
      name: "Current User",
      schema: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" }
        },
        required: ["id", "name"]
      },
      initialValue: {
        id: "",
        name: ""
      }
    }
  }
};

const formState: PersistentStateValue = {
  schema: {
    type: "object",
    properties: {
      form: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" }
        },
        required: ["name", "email"]
      }
    },
    required: ["form"]
  },
  initialValue: {
    form: {
      name: "",
      email: ""
    }
  }
};

describe("state ownership model", () => {
  // State DocumentがApplication全体で共有するStateだけをIDで管理し、
  // PageやComponentのOwner情報を持たないことを確認する。
  it("keeps the state document application-scoped", () => {
    const userState = stateDocument.states["state-user"];

    expect(userState.id).toBe("state-user");
    expect("scope" in userState).toBe(false);
    expect("ownerId" in userState).toBe(false);
  });

  // Component Instanceごとに生成するForm StateがSchemaだけでなく、
  // 実際の初期値も同じPersistent Model内に保持することを確認する。
  it("pairs content state schema with its initial value", () => {
    expect(formState.initialValue).toEqual({
      form: {
        name: "",
        email: ""
      }
    });
  });

  // Preview中のCurrent Value等を永続Stateへ混ぜず、
  // SchemaとInitial Valueだけを保存することを確認する。
  it("excludes runtime current values", () => {
    expect("currentValue" in formState).toBe(false);
    expect("executionId" in formState).toBe(false);
  });
});
