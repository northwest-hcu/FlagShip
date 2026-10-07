<script lang="ts">
  import { displayName, isLayout, slotsOf, slotNodes, slotTypeLabel, type WidgetNode } from "./component-model";
  import type { DropTarget } from "./scene";
  let { nodes, selectedId, hiddenInEditor, insertionTarget, onSelect, onChooseSlot, onHighlightLayout, onToggleVisibility, onDrag, onHoverNode, onHoverSlot, onDropNode, onDropSlot, dropTarget }: {
    nodes: WidgetNode[]; selectedId: string | null; onSelect: (id: string) => void;
    insertionTarget: { id: string | null; slotKey: string }; onChooseSlot: (id: string, slotKey: string) => void;
    onHighlightLayout: (id: string | null) => void;
    hiddenInEditor: Record<string, boolean>; onToggleVisibility: (id: string) => void;
    onDrag: (event: DragEvent, node: WidgetNode) => void;
    onHoverNode: (event: DragEvent, node: WidgetNode) => void;
    onHoverSlot: (event: DragEvent, id: string, slotKey: string) => void;
    onDropNode: (event: DragEvent, node: WidgetNode) => void;
    onDropSlot: (event: DragEvent, id: string, slotKey: string) => void; dropTarget: DropTarget | null;
  } = $props();
  let collapsed = $state<Record<string, boolean>>({});
</script>
{#snippet branches(items: WidgetNode[], depth: number)}
  {#each items as node (node.id)}
    {#if isLayout(node)}
      <li class="layout-tree-group" data-layout-group-id={node.id}>
        <div class="tree-row"><button type="button" class="tree-toggle" aria-label="配置グループの枝を開閉" aria-expanded={!collapsed["layout:" + node.id]} onclick={() => collapsed["layout:" + node.id] = !collapsed["layout:" + node.id]}>{collapsed["layout:" + node.id] ? "+" : "−"}</button>
          <button type="button" class="layout-group-label" onpointerenter={() => onHighlightLayout(node.id)} onpointerleave={() => onHighlightLayout(null)} onfocus={() => onHighlightLayout(node.id)} onblur={() => onHighlightLayout(null)}>{node.fields.direction.value === "horizontal" ? "配置グループ · 横" : "配置グループ · 縦"} <span>{node.fields.children.value.length}</span></button>
        </div>
        <ul hidden={!!collapsed["layout:" + node.id]}>{@render branches(node.fields.children.value, depth + 1)}</ul>
      </li>
    {:else}
      <li>
        <div class="tree-row">
          {#if slotsOf(node).length > 0}
          <button type="button" class="tree-toggle" aria-label={displayName(node) + "の枝を開閉"}
            aria-expanded={!collapsed["widget:" + node.id]}
            aria-controls={node.id + "-slots"}
            onclick={() => collapsed["widget:" + node.id] = !collapsed["widget:" + node.id]}>
            <span aria-hidden="true">{collapsed["widget:" + node.id] ? "+" : "−"}</span>
          </button>
          {:else}<span class="tree-toggle-space" aria-hidden="true"></span>{/if}
        <button type="button" class="tree-object" class:active={selectedId === node.id}
          data-tree-node={node.id} data-tree-depth={depth} aria-pressed={selectedId === node.id}
          data-drop-order={dropTarget?.orderOnly && dropTarget.id === node.id ? dropTarget.direction : undefined}
          draggable="true" title={displayName(node)} onclick={() => onSelect(node.id)} ondragstart={(event) => onDrag(event, node)}
          ondragover={(event) => onHoverNode(event, node)} ondrop={(event) => onDropNode(event, node)}>
          <span class="component-name-label">{displayName(node)}</span>
        </button>
        <button type="button" class="tree-visibility" aria-label={displayName(node) + (hiddenInEditor[node.id] ? "を表示" : "を非表示")}
          aria-pressed={!!hiddenInEditor[node.id]} title={hiddenInEditor[node.id] ? "エディタに表示" : "エディタで非表示"}
          onclick={() => onToggleVisibility(node.id)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/>
            {#if hiddenInEditor[node.id]}<path d="M3 3 21 21"/>{/if}</svg>
        </button>
        </div>
        <div id={node.id + "-slots"} hidden={collapsed["widget:" + node.id]}>
        {#each slotsOf(node) as [key, slot]}
          <div class="tree-slot" class:drop-active={dropTarget?.id === node.id && dropTarget?.slotKey === key} data-slot-owner={node.id} data-slot-key={key}
            role="group" aria-label={displayName(node) + " " + slot.name + " slotの配置先"}
            ondragover={(event) => onHoverSlot(event, node.id, key)} ondrop={(event) => onDropSlot(event, node.id, key)}>
            <button type="button" class="slot-heading nested-slot-heading" class:insertion-target={insertionTarget.id === node.id && insertionTarget.slotKey === key} aria-label={displayName(node) + " " + slot.name + " slot"}
              aria-expanded={!collapsed[node.id + ":" + key]} onclick={() => { onChooseSlot(node.id, key); collapsed[node.id + ":" + key] = !collapsed[node.id + ":" + key]; }}
              aria-controls={node.id + "-" + key + "-contents"}
              title={slot.description}>
              <span class="slot-toggle" aria-hidden="true">{collapsed[node.id + ":" + key] ? "+" : "−"}</span><span class="slot-label">{slot.name}</span><span class="slot-type">{slotTypeLabel(slot)}</span>
            </button>
            <div id={node.id + "-" + key + "-contents"} hidden={collapsed[node.id + ":" + key]}>
              <ul>{@render branches(slotNodes(slot), depth + 1)}</ul>
              {#if slotNodes(slot).length === 0}<p class="slot-empty">Empty slot</p>{/if}
            </div>
          </div>
        {/each}
        </div>
      </li>
    {/if}
  {/each}
{/snippet}
<ul class="widget-tree">{@render branches(nodes, 0)}</ul>
