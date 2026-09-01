import { describe, expect, it } from "vitest";
import {
  readRuntimeNodeState,
  writeRuntimeState,
  type RuntimeState,
} from "./runtime-state";

describe("Runtime State", () => {
  // 同じUI NodeのPropertyを順番に更新しても、既存Propertyを失わないことを確認する。
  it("updates one UI Node state field immutably", () => {
    const initial: RuntimeState = {};
    const address = {
      pageId: "ui-page-main",
      componentInstancePath: ["component-instance-modal"],
      localId: "content-node-modal",
    };
    const opened = writeRuntimeState(initial, {
      ...address,
      key: "open",
      value: true,
    });
    const titled = writeRuntimeState(opened, {
      ...address,
      key: "title",
      value: "確認",
    });

    expect(initial).toEqual({});
    expect(readRuntimeNodeState(titled, address)).toEqual({
      open: true,
      title: "確認",
    });
  });

  // PageやComponent Instanceが異なるStateを同じLocal IDでも混同しないことを確認する。
  it("isolates state by page and component instance path", () => {
    const state = writeRuntimeState({}, {
      pageId: "ui-page-main",
      componentInstancePath: ["component-instance-modal"],
      localId: "content-node-modal",
      key: "open",
      value: true,
    });

    expect(readRuntimeNodeState(state, {
      pageId: "ui-page-other",
      componentInstancePath: ["component-instance-modal"],
      localId: "content-node-modal",
    })).toBeUndefined();
  });
});
