import { describe, expect, it } from "vitest";
import {
  createStableId,
  getStableIdPrefix,
  isStableId,
} from "./id";

describe("stable IDs", () => {
  // 生成したIDが要求したEntity Prefixを持ち、同じPrefixでも
  // 複数回の生成結果が衝突しないことを確認する。
  it("creates unique IDs for each entity kind", () => {
    const first = createStableId("component-instance");
    const second = createStableId("component-instance");

    expect(first).not.toBe(second);
    expect(isStableId(first, "component-instance")).toBe(true);
    expect(isStableId(second, "component-instance")).toBe(true);
  });

  // Prefixが共通するflowとflow-node、componentとcomponent-instanceを
  // 最長一致で区別し、誤ったEntity種別として受理しないことを確認する。
  it("distinguishes overlapping prefixes", () => {
    expect(getStableIdPrefix("flow-node-create-user"))
      .toBe("flow-node");
    expect(isStableId("flow-node-create-user", "flow"))
      .toBe(false);
    expect(getStableIdPrefix("component-instance-save-button"))
      .toBe("component-instance");
    expect(isStableId(
      "component-instance-save-button",
      "component",
    )).toBe(false);
    expect(isStableId("library-base", "library")).toBe(true);
  });

  // 未定義Prefix、大文字、空Suffix、連続Hyphenを拒否し、
  // 任意Kebab CaseをStable IDとして誤認しないことを確認する。
  it("rejects malformed or unknown IDs", () => {
    expect(isStableId("unknown-example")).toBe(false);
    expect(isStableId("flow-")).toBe(false);
    expect(isStableId("Flow-save-user")).toBe(false);
    expect(isStableId("flow-save--user")).toBe(false);
    expect(isStableId(null)).toBe(false);
  });
});
