<script lang="ts">
  import CanvasNodes from "./CanvasNodes.svelte";
  import ComponentView from "./components/ComponentView.svelte";
  import { displayName, isLayout, type ComponentNode, type WidgetNode } from "./component-model";
  import type { DropTarget } from "./scene";
  let { nodes, editing, selectedId, dropTarget, onDrag, onHover, onDrop, onSelect, onChange }: {
    nodes: WidgetNode[]; editing: boolean; selectedId: string | null; dropTarget: DropTarget | null;
    onDrag: (event: DragEvent, node: WidgetNode) => void;
    onHover: (event: DragEvent, node: WidgetNode) => void;
    onDrop: (event: DragEvent) => void; onSelect: (id: string) => void; onChange: (node: ComponentNode) => void;
  } = $props();
</script>
{#each nodes as node (node.id)}
  {#if isLayout(node)}
    <div class="scene-layout" data-axis={node.fields.direction.value}>
      <CanvasNodes nodes={node.fields.children.value} {editing} {selectedId} {dropTarget} {onDrag} {onHover} {onDrop} {onSelect} {onChange} />
    </div>
  {:else}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (編集時はbuttonとしてキーボード選択できる) -->
    <div class="scene-object" class:editing class:selected={editing && selectedId === node.id}
      class:empty={node.kind === "container" && node.fields.children.value.length === 0}
      data-object-id={node.id} data-kind={node.kind}
      data-drop-direction={editing && dropTarget?.id === node.id && !dropTarget.slotKey ? dropTarget.direction : undefined}
      role={editing ? "button" : "group"} aria-label={displayName(node)} tabindex={editing ? 0 : undefined} draggable={editing}
      onclick={(event) => { if (editing) { event.stopPropagation(); onSelect(node.id); } }}
      onkeydown={(event) => { if (editing && event.target === event.currentTarget && ["Enter", " "].includes(event.key)) { event.preventDefault(); event.stopPropagation(); onSelect(node.id); } }}
      ondragstart={(event) => onDrag(event, node)} ondragover={(event) => onHover(event, node)} ondrop={onDrop}>
      <ComponentView {node} {editing} {onChange}>
        {#if node.kind === "container"}
          <CanvasNodes nodes={node.fields.children.value} {editing} {selectedId} {dropTarget} {onDrag} {onHover} {onDrop} {onSelect} {onChange} />
        {/if}
      </ComponentView>
    </div>
  {/if}
{/each}
