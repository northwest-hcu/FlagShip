<script lang="ts">
  import { displayName, isLayout, slotsOf, slotNodes, slotTypeLabel, type WidgetNode } from "./component-model";
  import type { DropTarget } from "./scene";
  let { nodes, selectedId, onSelect, onDrag, onHoverNode, onHoverSlot, onDrop, dropTarget }: {
    nodes: WidgetNode[]; selectedId: string | null; onSelect: (id: string) => void;
    onDrag: (event: DragEvent, node: WidgetNode) => void;
    onHoverNode: (event: DragEvent, node: WidgetNode) => void;
    onHoverSlot: (event: DragEvent, id: string, slotKey: string) => void;
    onDrop: (event: DragEvent) => void; dropTarget: DropTarget | null;
  } = $props();
  let collapsed = $state<Record<string, boolean>>({});
</script>
{#snippet branches(items: WidgetNode[], depth: number)}
  {#each items as node (node.id)}
    {#if isLayout(node)}
      {@render branches(node.fields.children.value, depth)}
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
          draggable="true" onclick={() => onSelect(node.id)} ondragstart={(event) => onDrag(event, node)}
          ondragover={(event) => onHoverNode(event, node)} ondrop={onDrop}>
          <span>{displayName(node)}</span>
        </button>
        </div>
        <div id={node.id + "-slots"} hidden={collapsed["widget:" + node.id]}>
        {#each slotsOf(node) as [key, slot]}
          <div class="tree-slot" class:drop-active={dropTarget?.id === node.id && dropTarget?.slotKey === key} data-slot-owner={node.id} data-slot-key={key}
            role="group" aria-label={displayName(node) + " " + slot.name + " slotの配置先"}
            ondragover={(event) => onHoverSlot(event, node.id, key)} ondrop={onDrop}>
            <button type="button" class="slot-heading nested-slot-heading" aria-label={displayName(node) + " " + slot.name + " slot"}
              aria-expanded={!collapsed[node.id + ":" + key]} onclick={() => collapsed[node.id + ":" + key] = !collapsed[node.id + ":" + key]}
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
