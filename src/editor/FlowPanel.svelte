<script lang="ts">
  import type { ProjectDocument } from "../core/model/project";
  import FlowEditor from "./FlowEditor.svelte";
  import { executeEditorFlow } from "./editor-flow-runtime";
  import {
    addFlowGraph,
    addFlowNode,
    removeFlowNode,
    type EditableFlowNodeType,
  } from "./flow-project";

  interface Props {
    project: ProjectDocument;
  }

  let { project = $bindable() }: Props = $props();

  function createFlow(): string {
    const result = addFlowGraph(project);
    project = result.project;
    return result.flowGraphId;
  }

  function createFlowNode(
    flowGraphId: string,
    type: EditableFlowNodeType,
  ): void {
    project = addFlowNode(project, flowGraphId, type);
  }

  function deleteFlowNode(flowGraphId: string, flowNodeId: string): void {
    project = removeFlowNode(project, flowGraphId, flowNodeId);
  }
</script>

<section id="flow-panel" class="panel flow-panel" aria-labelledby="flow-heading">
  <h2 id="flow-heading">Flow</h2>
  <FlowEditor
    graphs={Object.values(project.flows.graphs)}
    onaddgraph={createFlow}
    onaddnode={createFlowNode}
    onremovenode={deleteFlowNode}
    onrun={(flowGraphId) => executeEditorFlow(project.flows.graphs[flowGraphId])}
  />
</section>
