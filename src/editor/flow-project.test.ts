import { describe, expect, it } from "vitest";
import { createEditorProject } from "./editor-project";
import {
  addFlowGraph,
  addFlowNode,
  addFlowVariable,
  EDITABLE_FLOW_NODE_TYPES,
  removeFlowNode,
} from "./flow-project";

describe("Flow Editor project operations", () => {
  it("adds a Flow Graph to the Project Document", () => {
    const result = addFlowGraph(createEditorProject());

    expect(result.project.flows.graphs[result.flowGraphId]).toMatchObject({
      id: result.flowGraphId,
      name: "Flow 1",
      nodes: [],
      edges: [],
    });
  });

  it("adds and removes a Flow Node", () => {
    const flow = addFlowGraph(createEditorProject());
    const withNode = addFlowNode(
      flow.project,
      flow.flowGraphId,
      "state.set",
    );
    const node = withNode.flows.graphs[flow.flowGraphId].nodes[0];

    expect(node.type).toBe("state.set");
    expect(node.config).toEqual({ value: false });
    expect(EDITABLE_FLOW_NODE_TYPES).not.toContain("overlay.action");
    expect(removeFlowNode(
      withNode,
      flow.flowGraphId,
      node.id,
    ).flows.graphs[flow.flowGraphId].nodes).toEqual([]);
  });

  it("connects a new Flow Node after the previous Node", () => {
    const flow = addFlowGraph(createEditorProject());
    const withFirst = addFlowNode(
      flow.project,
      flow.flowGraphId,
      "data.constant",
    );
    const withSecond = addFlowNode(
      withFirst,
      flow.flowGraphId,
      "data.constant",
    );
    const graph = withSecond.flows.graphs[flow.flowGraphId];

    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toMatchObject({
      fromNode: graph.nodes[0].id,
      fromPort: "next",
      toNode: graph.nodes[1].id,
      toPort: "in",
    });
  });

  // Flow NodeがPage上の実体を直接埋め込まず、Graph Local Variableを
  // 介してComponent Instanceを参照できることを確認する。
  it("adds an instance variable to a Flow Graph", () => {
    const flow = addFlowGraph(createEditorProject());
    const project = addFlowVariable(
      flow.project,
      flow.flowGraphId,
      "Save button",
      {
        kind: "component-instance",
        pageId: "ui-page-main",
        componentInstancePath: ["component-instance-save"],
      },
    );
    const variable = Object.values(
      project.flows.graphs[flow.flowGraphId].variables ?? {},
    )[0];

    expect(variable.name).toBe("Save button");
    expect(variable.target.kind).toBe("component-instance");
  });
});
