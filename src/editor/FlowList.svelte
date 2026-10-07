<script lang="ts">
  import { flowErrors, type FlowGraph } from "./flow-model";
  import type { Pages } from "./component-model";

  let { flows, pages, selectedFlowId, onSelect }: {
    flows: FlowGraph[];
    pages: Pages;
    selectedFlowId: string | null;
    onSelect: (id: string) => void;
  } = $props();

  function triggerLabel(flow: FlowGraph): string {
    const trigger = flow.nodes.find((node) => node.type.startsWith("trigger."));
    if (trigger?.type === "trigger.event") return "CLICK";
    if (trigger?.type === "trigger.schedule") return `SCHEDULE · ${trigger.mode.toUpperCase()}`;
    if (trigger?.type === "trigger.load") return "PAGE LOAD";
    return "NO TRIGGER";
  }
</script>

<div class="flow-list" role="list" aria-label="Flows">
  {#each flows as flow (flow.id)}
    <div role="listitem" data-flow-list-id={flow.id}>
      <button type="button" class="flow-list-item" class:active={selectedFlowId === flow.id}
        aria-label={triggerLabel(flow) + " / " + flow.name} aria-current={selectedFlowId === flow.id ? "true" : undefined}
        onclick={() => onSelect(flow.id)}>
        <span class="flow-list-trigger">{triggerLabel(flow)}</span>
        <span class="flow-list-name" title={flow.name}>{flow.name}</span>
        <span class="flow-list-status" class:invalid={flowErrors(flow, pages, flows).length > 0}>{flowErrors(flow, pages, flows).length ? "要設定" : "設定済"}</span>
      </button>
    </div>
  {:else}
    <p class="slot-empty">+ FlowでFlowを作成</p>
  {/each}
</div>
