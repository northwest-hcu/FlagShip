import { describe, expect, it, vi } from "vitest";
import type { FlowGraph } from "../../core/model/flow";
import { createEditorProject } from "../../editor/editor-project";
import {
  executePageLoadFlows,
  executeProjectFlow,
  executeUIEventFlows,
  listScheduleFlows,
} from "./project-flow-runtime";

function modalFlow(): FlowGraph {
  return {
    id: "flow-open-modal",
    name: "Open Modal",
    variables: {
      "flow-variable-button": {
        id: "flow-variable-button",
        name: "Open button",
        target: {
          kind: "component-instance",
          pageId: "ui-page-main",
          componentInstancePath: ["component-instance-button"],
        },
      },
      "flow-variable-modal": {
        id: "flow-variable-modal",
        name: "Modal",
        target: {
          kind: "component-instance",
          pageId: "ui-page-main",
          componentInstancePath: ["component-instance-modal"],
        },
      },
    },
    nodes: [
      {
        id: "flow-node-click",
        type: "trigger.ui-event",
        config: {
          variableId: "flow-variable-button",
          localId: "content-node-button",
          event: "click",
        },
        inputs: {},
        outputs: {},
      },
      {
        id: "flow-node-open",
        type: "state.set",
        config: {
          variableId: "flow-variable-modal",
          localId: "content-node-modal",
          key: "open",
          value: true,
        },
        inputs: {},
        outputs: {},
      },
    ],
    edges: [{
      id: "edge-open",
      fromNode: "flow-node-click",
      fromPort: "default",
      toNode: "flow-node-open",
      toPort: "in",
    }],
  };
}

describe("Project Flow Runtime", () => {
  // Modal固有Actionを使わず、通常のUI Node Stateとしてopenを更新する。
  it("sets Modal open through the Runtime State manager", async () => {
    const setState = vi.fn();
    const result = await executeProjectFlow(modalFlow(), { setState });

    expect(result.status).toBe("completed");
    expect(setState).toHaveBeenCalledWith({
      pageId: "ui-page-main",
      componentInstancePath: ["component-instance-modal"],
      localId: "content-node-modal",
      key: "open",
      value: true,
    });
  });

  it("executes only the Flow matching the Button click", async () => {
    const base = modalFlow();
    const graph: FlowGraph = {
      ...base,
      nodes: [
        ...base.nodes,
        {
          id: "flow-node-unrelated",
          type: "state.set",
          config: {
            variableId: "flow-variable-modal",
            localId: "content-node-modal",
            key: "open",
            value: false,
          },
          inputs: {},
          outputs: {},
        },
      ],
    };
    const project = {
      ...createEditorProject(),
      flows: { graphs: { [graph.id]: graph } },
    };
    const setState = vi.fn();

    const ignored = await executeUIEventFlows(project, {
      pageId: "ui-page-main",
      componentInstancePath: ["component-instance-other"],
      localId: "content-node-button",
      event: "click",
    }, { setState });
    const executed = await executeUIEventFlows(project, {
      pageId: "ui-page-main",
      componentInstancePath: ["component-instance-button"],
      localId: "content-node-button",
      event: "click",
    }, { setState });

    expect(ignored).toEqual([]);
    expect(executed).toHaveLength(1);
    expect(setState).toHaveBeenCalledTimes(1);
  });

  // Page Load Triggerに一致するPageだけが後続Nodeを実行することを確認する。
  it("executes a page load Flow once for its Page", async () => {
    const base = modalFlow();
    const graph: FlowGraph = {
      ...base,
      nodes: [
        {
          ...base.nodes[0],
          type: "trigger.page-load",
          config: { pageId: "ui-page-main" },
        },
        base.nodes[1],
      ],
    };
    const project = {
      ...createEditorProject(),
      flows: { graphs: { [graph.id]: graph } },
    };
    const setState = vi.fn();

    expect(await executePageLoadFlows(
      project,
      "ui-page-other",
      { setState },
    )).toEqual([]);
    expect(await executePageLoadFlows(
      project,
      "ui-page-main",
      { setState },
    )).toHaveLength(1);
    expect(setState).toHaveBeenCalledTimes(1);
  });

  // Foreground ScheduleがPageと実行間隔を保持し、Triggerより後ろの
  // Flowだけを繰り返し実行できることを確認する。
  it("lists executable foreground schedules for its Page", async () => {
    const base = modalFlow();
    const graph: FlowGraph = {
      ...base,
      nodes: [
        {
          ...base.nodes[0],
          type: "trigger.schedule",
          config: { pageId: "ui-page-main", intervalMs: 250 },
        },
        base.nodes[1],
      ],
    };
    const project = {
      ...createEditorProject(),
      flows: { graphs: { [graph.id]: graph } },
    };
    const schedules = listScheduleFlows(project, "ui-page-main");
    const setState = vi.fn();

    expect(listScheduleFlows(project, "ui-page-other")).toEqual([]);
    expect(schedules).toHaveLength(1);
    expect(schedules[0].intervalMs).toBe(250);
    await executeProjectFlow(schedules[0].graph, { setState });
    expect(setState).toHaveBeenCalledTimes(1);
  });

  it("ignores an invalid foreground schedule interval", () => {
    const base = modalFlow();
    const graph: FlowGraph = {
      ...base,
      nodes: [{
        ...base.nodes[0],
        type: "trigger.schedule",
        config: { pageId: "ui-page-main", intervalMs: 99 },
      }],
      edges: [],
    };
    const project = {
      ...createEditorProject(),
      flows: { graphs: { [graph.id]: graph } },
    };

    expect(listScheduleFlows(project, "ui-page-main")).toEqual([]);
  });
});
