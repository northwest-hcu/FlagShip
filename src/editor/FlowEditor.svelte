<script lang="ts">
  import type { FlowGraph } from "../core/model/flow";
  import type { FlowExecutionResult } from "../runtime/flow/flow-engine";
  import {
    EDITABLE_FLOW_NODE_TYPES,
    type EditableFlowNodeType,
  } from "./flow-project";
  import FlowChart from "./FlowChart.svelte";

  interface Props {
    readonly graphs: readonly FlowGraph[];
    readonly onaddgraph: () => string;
    readonly onaddnode: (
      flowGraphId: string,
      type: EditableFlowNodeType,
    ) => void;
    readonly onremovenode: (
      flowGraphId: string,
      flowNodeId: string,
    ) => void;
    readonly onrun: (flowGraphId: string) => Promise<FlowExecutionResult>;
  }

  let { graphs, onaddgraph, onaddnode, onremovenode, onrun }: Props = $props();
  let selectedGraphId = $state<string | null>(null);
  let nodeType = $state<EditableFlowNodeType>("data.constant");
  let execution = $state<FlowExecutionResult | null>(null);
  let running = $state(false);

  const selectedGraph = $derived(
    graphs.find((graph) => graph.id === selectedGraphId) ?? graphs[0],
  );

  function addGraph(): void {
    selectedGraphId = onaddgraph();
    execution = null;
  }

  function selectGraph(flowGraphId: string): void {
    selectedGraphId = flowGraphId;
    execution = null;
  }

  function addNode(): void {
    if (!selectedGraph) return;
    onaddnode(selectedGraph.id, nodeType);
    execution = null;
  }

  function removeNode(flowGraphId: string, flowNodeId: string): void {
    onremovenode(flowGraphId, flowNodeId);
    execution = null;
  }

  async function runGraph(): Promise<void> {
    if (!selectedGraph || running) return;
    running = true;
    try {
      execution = await onrun(selectedGraph.id);
    } finally {
      running = false;
    }
  }
</script>

<div class="flow-toolbar">
  {#if graphs.length > 0}
    <select
      aria-label="表示するFlow"
      value={selectedGraph?.id}
      onchange={(event) =>
        selectGraph(event.currentTarget.value)}
    >
      {#each graphs as graph (graph.id)}
        <option value={graph.id}>{graph.name}</option>
      {/each}
    </select>
  {/if}
  <button type="button" onclick={addGraph}>+ Flow</button>
</div>

{#if selectedGraph}
  <div class="flow-node-toolbar">
    <select aria-label="追加するNode種別" bind:value={nodeType}>
      {#each EDITABLE_FLOW_NODE_TYPES as type}
        <option value={type}>{type}</option>
      {/each}
    </select>
    <button
      type="button"
      onclick={addNode}
    >+ Node</button>
    <button type="button" disabled={running} onclick={runGraph}>
      {running ? "実行中" : "実行"}
    </button>
  </div>
  {#if selectedGraph.nodes.length > 0}
    <FlowChart
      graph={selectedGraph}
      onremovenode={(flowNodeId) =>
        removeNode(selectedGraph.id, flowNodeId)}
    />
  {:else}
    <p class="empty-panel">Nodeはまだありません。</p>
  {/if}
  {#if execution}
    <section
      class:execution-failed={execution.status === "failed"}
      class="flow-execution-result"
      aria-label="Flow実行結果"
    >
      <strong>{execution.status === "completed" ? "実行完了" : "実行失敗"}</strong>
      <span>{execution.nodes.length} Node実行</span>
      {#if execution.status === "failed"}
        <code>{execution.diagnostic.code}: {execution.diagnostic.message}</code>
      {:else if execution.nodes.length > 0}
        <code>{JSON.stringify(execution.nodes.at(-1)?.outputs)}</code>
      {/if}
    </section>
  {/if}
{:else}
  <p class="empty-panel">Flowはまだありません。</p>
{/if}
