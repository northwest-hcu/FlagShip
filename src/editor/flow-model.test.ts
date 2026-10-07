import { describe, expect, it } from "vitest";
import { createComponent, createPage, type Pages } from "./component-model";
import { addFlowNode, applyFlowFieldValues, conditionPort, constantNodes, createFlow, createFlowNode, evaluateCondition, flowErrors, flowFieldValueKey, flowNodeErrors, flowWatchValues, layoutFlowNodes, nextNode, pageComponents, readFlowValue, removeFlowNode, reorderFlowNode, scalarFields, setFlowEdge, setFlowFieldValue, setScheduleGlobal, variableNodes } from "./flow-model";

function fixture(): Pages {
  const first = createPage(1);
  first.fields.context.value.push(createComponent("text", 1), createComponent("textbox", 2));
  return [first, createPage(2)];
}

describe("Flow graph", () => {
  it("keeps the owning Page through global Schedule toggles and replacement triggers", () => {
    const local = addFlowNode(createFlow("timer", "page-2"), createFlowNode("schedule", "trigger.schedule", 40, 48));
    const global = setScheduleGlobal(local, true);
    expect(global.scope).toEqual({ kind: "project" });
    expect(setScheduleGlobal(global, false).scope).toEqual({ kind: "page", pageId: "page-2" });
    for (const type of ["trigger.event", "trigger.load"] as const) {
      const changed = addFlowNode(removeFlowNode(global, "schedule"), createFlowNode("start", type, 40, 48));
      expect(changed.scope).toEqual({ kind: "page", pageId: "page-2" });
    }
  });
  it("shares local declarations on the same Page and global declarations across Pages", () => {
    const owner = createFlow("owner", "page-1");
    owner.nodes.push(
      { id: "local-var", x: 0, y: 0, type: "action.init-variable", name: "local", initialValue: "page" },
      { id: "global-var", x: 0, y: 0, type: "action.init-variable", name: "shared", initialValue: "project", global: true },
      { id: "local-const", x: 0, y: 0, type: "action.init-constant", name: "local", initialValue: "page", global: false },
      { id: "global-const", x: 0, y: 0, type: "action.init-constant", name: "shared", initialValue: "project", global: true },
    );
    const samePage = createFlow("same", "page-1");
    const otherPage = createFlow("other", "page-2");
    const project = { ...createFlow("project", "page-1"), scope: { kind: "project" as const } };
    const flows = [owner, samePage, otherPage, project];
    expect(variableNodes(samePage, flows).map((node) => node.id)).toEqual(["local-var", "global-var"]);
    expect(constantNodes(samePage, flows).map((node) => node.id)).toEqual(["local-const", "global-const"]);
    for (const consumer of [otherPage, project]) {
      expect(variableNodes(consumer, flows).map((node) => node.id)).toEqual(["global-var"]);
      expect(constantNodes(consumer, flows).map((node) => node.id)).toEqual(["global-const"]);
    }
    expect(variableNodes(owner, flows)).toHaveLength(2);
    expect(createFlowNode("new-var", "action.init-variable", 0, 0)).toMatchObject({ global: false });
    expect(createFlowNode("new-const", "action.init-constant", 0, 0)).toMatchObject({ global: false });

    const set = { id: "set", x: 0, y: 0, type: "action.set-variable" as const,
      target: { kind: "variable" as const, variableId: "global-var" }, value: { kind: "constant" as const, constantId: "global-const" } };
    expect(flowNodeErrors(otherPage, fixture(), set, flows)).toEqual([]);
    expect(flowWatchValues(otherPage, fixture(), {}, { "global-var": "updated" }, { "global-const": "project" }, flows)).toEqual([
      { key: "global-var", kind: "VAR", label: "shared", value: "updated", masked: false },
      { key: "global-const", kind: "CONST", label: "shared", value: "project", masked: false },
    ]);
    owner.nodes = owner.nodes.map((node) => ({ ...node, global: false }));
    expect(flowNodeErrors(otherPage, fixture(), set, flows)).toEqual(["更新するユーザー変数を設定してください", "定数がありません"]);
    expect(flowNodeErrors(samePage, fixture(), set, flows)).toEqual([]);
    owner.nodes = [];
    expect(flowNodeErrors(samePage, fixture(), set, flows)).toHaveLength(2);
  });

  it("rejects reading and writing fields outside the Flow Page", () => {
    const pages = fixture();
    const reference = { kind: "field" as const, pageId: "page-1", componentId: "text-1", fieldKey: "value" };
    const check = { id: "check", x: 0, y: 0, type: "logic.condition" as const,
      condition: { operator: "notEmpty" as const, value: reference } };
    const set = { id: "set", x: 0, y: 0, type: "action.set-variable" as const, target: reference, value: reference };
    const local = createFlow("local", "page-1");
    expect(flowNodeErrors(local, pages, check)).toEqual([]);
    expect(flowNodeErrors(local, pages, set)).toEqual([]);
    for (const flow of [createFlow("other", "page-2"), { ...local, scope: { kind: "project" as const } }]) {
      expect(flowNodeErrors(flow, pages, check)).toContain("フィールドはFlowの対象Page内で指定してください");
      expect(flowNodeErrors(flow, pages, set)).toContain("フィールドはFlowの対象Page内で指定してください");
      expect(readFlowValue(reference, flow, pages, { [flowFieldValueKey(reference)]: "hidden" }, {}, {})).toBeNull();
    }
  });

  it("reports setting errors on the Node that needs editing", () => {
    const pages = fixture();
    let flow = createFlow("flow-validation", pages[0].id);
    const start = createFlowNode("start", "trigger.load", 0, 0);
    const navigate = createFlowNode("navigate", "action.navigate", 260, 0);
    flow = addFlowNode(addFlowNode(flow, start), navigate);
    expect(flowNodeErrors(flow, pages, start)).toEqual([]);
    expect(flowNodeErrors(flow, pages, navigate)).toEqual(["遷移先Pageを設定してください"]);
    expect(flowErrors(flow, pages)).toContain("遷移先Pageを設定してください");
  });

  it("starts empty and connects a Click trigger on any Com to Navigate", () => {
    const pages = fixture();
    let flow = createFlow("flow-1", pages[0].id);
    expect(flow.nodes).toEqual([]);
    expect(pageComponents(pages, pages[0].id).map((item) => item.id)).toContain("text-1");
    flow = addFlowNode(flow, { ...createFlowNode("trigger", "trigger.event", 20, 30), type: "trigger.event", componentId: "text-1", event: "click" });
    flow = addFlowNode(flow, { ...createFlowNode("navigate", "action.navigate", 300, 30), type: "action.navigate", targetPageId: pages[1].id });
    expect(flow.edges).toEqual([]);
    flow = setFlowEdge(flow, "trigger", "next", "navigate");
    expect(flowErrors(flow, pages)).toEqual([]);
    expect(nextNode(flow, "trigger", "next")).toBe("navigate");
    expect(addFlowNode(flow, createFlowNode("other-trigger", "trigger.schedule", 0, 0))).toBe(flow);
  });

  it("reads a completed field key, mutable variable, and named constant", () => {
    const pages = fixture();
    const flow = createFlow("flow-2", pages[0].id);
    flow.nodes.push({ ...createFlowNode("var-1", "action.init-variable", 0, 0), type: "action.init-variable", name: "role", initialValue: "guest" });
    flow.nodes.push({ ...createFlowNode("const-1", "action.init-constant", 0, 0), type: "action.init-constant", name: "admin", initialValue: "admin" });
    const text = pageComponents(pages, pages[0].id).find((item) => item.id === "text-1")!;
    expect(scalarFields(text.node).map((field) => field.key)).toContain("value");
    const field = { kind: "field" as const, pageId: pages[0].id, componentId: "textbox-2:input", fieldKey: "value" };
    const textbox = pages[0].fields.context.value.find((item) => item.id === "textbox-2");
    if (textbox?.kind !== "textbox") throw new Error("Missing test Text Box");
    const input = textbox.fields.children.value.find((child) => child.kind === "textinput");
    if (input?.kind !== "textinput") throw new Error("Missing test Text Input");
    input.fields.value.value = "runtime-only-value";
    flow.nodes.push({ ...createFlowNode("check", "logic.condition", 0, 0), type: "logic.condition", condition: { operator: "notEmpty", value: field } });
    expect(JSON.stringify(flow)).not.toContain("runtime-only-value");
    expect(readFlowValue(field, flow, pages, { "textbox-2:input": "admin" }, {}, {})).toBe("admin");
    expect(readFlowValue(field, flow, pages, {}, {}, {})).toBe("runtime-only-value");
    const condition = { operator: "equals" as const, left: { kind: "variable" as const, variableId: "var-1" }, right: { kind: "constant" as const, constantId: "const-1" } };
    expect(conditionPort(condition, flow, pages, {}, {}, {})).toBe("false");
    expect(conditionPort(condition, flow, pages, {}, { "var-1": "admin" }, {})).toBe("false");
    expect(conditionPort(condition, flow, pages, {}, { "var-1": " admin " }, { "const-1": "ａｄｍｉｎ" })).toBe("true");
    expect(evaluateCondition(condition, flow, pages, {}, { "var-1": " admin " }, { "const-1": "admin" })).toEqual({ port: "true", left: " admin ", right: "admin" });
    expect(flowWatchValues(flow, pages, {}, { "var-1": "admin" }, {})).toEqual(expect.arrayContaining([
      { key: "var-1", kind: "VAR", label: "role", value: "admin", masked: false },
      { key: "const-1", kind: "CONST", label: "admin", value: null, masked: false },
    ]));
  });

  it("rejects cycles and removes a Node with its connections", () => {
    const pages = fixture();
    let flow = createFlow("flow-3", pages[0].id);
    flow = addFlowNode(flow, createFlowNode("trigger", "trigger.schedule", 0, 0));
    flow = addFlowNode(flow, createFlowNode("condition", "logic.condition", 250, 0));
    flow = addFlowNode(flow, createFlowNode("set", "action.set-variable", 500, 0));
    flow = setFlowEdge(flow, "trigger", "next", "condition");
    flow = setFlowEdge(flow, "condition", "true", "set");
    expect(setFlowEdge(flow, "set", "next", "condition")).toBe(flow);
    flow = removeFlowNode(flow, "condition");
    expect(flow.edges).toEqual([]);
    expect(flowErrors(flow, pages)).toContain("起点の接続を設定してください");
  });

  it("preserves free positions until explicitly organizing connected Nodes", () => {
    let flow = createFlow("flow-layout", "page-1");
    flow = addFlowNode(flow, createFlowNode("trigger", "trigger.event", 41, 53));
    flow = addFlowNode(flow, createFlowNode("first", "logic.condition", 473, 207));
    flow = addFlowNode(flow, createFlowNode("second", "action.navigate", 715, 88));
    const original = Object.fromEntries(flow.nodes.map((node) => [node.id, [node.x, node.y]]));
    flow = setFlowEdge(flow, "trigger", "next", "first");
    flow = setFlowEdge(flow, "first", "true", "second");
    expect(Object.fromEntries(flow.nodes.map((node) => [node.id, [node.x, node.y]]))).toEqual(original);
    flow = reorderFlowNode(flow, "second", "trigger", false);
    expect(flow.nodes[0].id).toBe("second");
    expect(Object.fromEntries(flow.nodes.map((node) => [node.id, [node.x, node.y]]))).toEqual(original);
    flow = layoutFlowNodes(flow);
    expect(Object.fromEntries(flow.nodes.map((node) => [node.id, [node.x, node.y]]))).toEqual({ trigger: [40, 48], first: [298, 48], second: [556, 48] });
  });

  it("allows Next after Page navigation", () => {
    let flow = createFlow("flow-navigate", "page-1");
    flow = addFlowNode(flow, createFlowNode("trigger", "trigger.schedule", 0, 0));
    flow = addFlowNode(flow, { ...createFlowNode("first", "action.navigate", 0, 0), type: "action.navigate", targetPageId: "page-2" });
    flow = addFlowNode(flow, { ...createFlowNode("second", "action.navigate", 0, 0), type: "action.navigate", targetPageId: "page-1" });
    flow = setFlowEdge(flow, "trigger", "next", "first");
    flow = setFlowEdge(flow, "first", "next", "second");
    expect(nextNode(flow, "first", "next")).toBe("second");
    expect(flowErrors(flow, fixture())).toEqual([]);
    expect(setFlowEdge(flow, "second", "next", "first")).toBe(flow);
  });

  it("sets a Com field only in Preview values and validates its type", () => {
    const pages = fixture();
    const target = { kind: "field" as const, pageId: "page-1", componentId: "text-1", fieldKey: "value" };
    let flow = createFlow("flow-set", "page-1");
    flow = addFlowNode(flow, createFlowNode("trigger", "trigger.schedule", 0, 0));
    flow = addFlowNode(flow, { ...createFlowNode("constant", "action.init-constant", 0, 0), type: "action.init-constant", name: "sample", initialValue: "Updated" });
    flow = addFlowNode(flow, { ...createFlowNode("set", "action.set-variable", 0, 0), type: "action.set-variable", target,
      value: { kind: "constant", constantId: "constant" } });
    flow = setFlowEdge(flow, "trigger", "next", "constant");
    flow = setFlowEdge(flow, "constant", "next", "set");
    expect(flowErrors(flow, pages)).toEqual([]);
    const values = setFlowFieldValue({}, target, "Updated", pages);
    expect(values[flowFieldValueKey(target)]).toBe("Updated");
    expect(readFlowValue(target, flow, pages, values, {}, { constant: "Updated" })).toBe("Updated");
    const preview = applyFlowFieldValues(pages[0], values);
    const previewText = pageComponents([preview], "page-1").find((item) => item.id === "text-1")?.node;
    const originalText = pageComponents(pages, "page-1").find((item) => item.id === "text-1")?.node;
    expect(previewText?.kind === "text" && previewText.fields.value.value).toBe("Updated");
    expect(originalText?.kind === "text" && originalText.fields.value.value).not.toBe("Updated");
    expect(setFlowFieldValue(values, { ...target, fieldKey: "fontSize" }, "invalid", pages)).toBe(values);
  });

  it("allows arbitrary placement and organizes overlapping Nodes on request", () => {
    let flow = createFlow("flow-free", "page-1");
    flow = addFlowNode(flow, createFlowNode("first", "logic.condition", 310, 60));
    flow = addFlowNode(flow, createFlowNode("second", "action.navigate", 298, 48));
    flow = addFlowNode(flow, createFlowNode("third", "action.navigate", 310, 60));
    expect(flow.nodes.map((node) => [node.x, node.y])).toEqual([[310, 60], [298, 48], [310, 60]]);
    flow = layoutFlowNodes(flow);
    expect(flow.nodes.map((node) => [node.x, node.y])).toEqual([[40, 48], [40, 198], [40, 348]]);
  });
});
