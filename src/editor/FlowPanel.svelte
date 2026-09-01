<script lang="ts">
  import type { ProjectDocument } from "../core/model/project";
  import FlowEditor from "./FlowEditor.svelte";
  import type { FlowInstanceTarget } from "../core/model/flow";
  import type { Value } from "../core/model/value";
  import { executeEditorFlow } from "./editor-flow-runtime";
  import {
    addFlowGraph,
    addFlowNode,
    addFlowVariable,
    removeFlowNode,
    updateFlowNodeConfig,
    type EditableFlowNodeType,
  } from "./flow-project";
  import { listFlowVariableCandidates } from "./flow-variables";

  interface Props {
    project: ProjectDocument;
    readonly pageId: string;
  }

  let { project = $bindable(), pageId }: Props = $props();
  let selectedGraphId = $state<string | null>(null);
  const variableCandidates = $derived(
    listFlowVariableCandidates(project, pageId),
  );

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

  function createVariable(
    flowGraphId: string,
    name: string,
    target: FlowInstanceTarget,
  ): void {
    project = addFlowVariable(project, flowGraphId, name, target);
  }

  function changeNodeConfig(
    flowGraphId: string,
    flowNodeId: string,
    config: Readonly<Record<string, Value>>,
  ): void {
    project = updateFlowNodeConfig(project, flowGraphId, flowNodeId, config);
  }
</script>

<section id="flow-panel" class="panel flow-panel" aria-labelledby="flow-heading">
  <h2 id="flow-heading">Flow</h2>
  <FlowEditor
    bind:selectedGraphId
    graphs={Object.values(project.flows.graphs)}
    {variableCandidates}
    onaddgraph={createFlow}
    onaddnode={createFlowNode}
    onremovenode={deleteFlowNode}
    onaddvariable={createVariable}
    onconfigchange={changeNodeConfig}
    onrun={(flowGraphId) => executeEditorFlow(project.flows.graphs[flowGraphId])}
  />
</section>
