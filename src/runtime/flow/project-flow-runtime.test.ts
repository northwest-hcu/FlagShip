import { describe, expect, it, vi } from "vitest";
import type { FlowGraph } from "../../core/model/flow";
import { createEditorProject } from "../../editor/editor-project";
import {
  executeProjectFlow,
  executeUIEventFlows,
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
          kind: "overlay-instance",
          pageId: "ui-page-main",
          overlayInstanceId: "overlay-instance-modal",
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
        type: "overlay.action",
        config: {
          variableId: "flow-variable-modal",
          action: "activate",
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
  it("executes an Overlay Action through the Page Overlay Manager", async () => {
    const changeOverlay = vi.fn();
    const result = await executeProjectFlow(modalFlow(), { changeOverlay });

    expect(result.status).toBe("completed");
    expect(changeOverlay).toHaveBeenCalledWith({
      overlayInstanceId: "overlay-instance-modal",
      action: "activate",
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
          type: "overlay.action",
          config: {
            variableId: "flow-variable-modal",
            action: "deactivate",
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
    const changeOverlay = vi.fn();

    const ignored = await executeUIEventFlows(project, {
      pageId: "ui-page-main",
      componentInstancePath: ["component-instance-other"],
      localId: "content-node-button",
      event: "click",
    }, { changeOverlay });
    const executed = await executeUIEventFlows(project, {
      pageId: "ui-page-main",
      componentInstancePath: ["component-instance-button"],
      localId: "content-node-button",
      event: "click",
    }, { changeOverlay });

    expect(ignored).toEqual([]);
    expect(executed).toHaveLength(1);
    expect(changeOverlay).toHaveBeenCalledTimes(1);
  });
});
