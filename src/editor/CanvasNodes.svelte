<script lang="ts">
  import CanvasNodes from "./CanvasNodes.svelte";
  import ComponentView from "./components/ComponentView.svelte";
  import { componentOuterWidth, containerInputLabel, displayName, isLayout, type ComponentNode, type WidgetNode } from "./component-model";
  import type { DropTarget } from "./scene";
  let { nodes, editing, selectedId, dropTarget, hiddenInEditor, clickTargets, highlightLayoutId = null, labelledBy, onDrag, onHover, onDrop, onSelect, onChange, onActivate }: {
    nodes: WidgetNode[]; editing: boolean; selectedId: string | null; dropTarget: DropTarget | null; hiddenInEditor: Record<string, boolean>; clickTargets: Record<string, boolean>; highlightLayoutId?: string | null; labelledBy?: string;
    onDrag: (event: DragEvent, node: WidgetNode) => void;
    onHover: (event: DragEvent, node: WidgetNode) => void;
    onDrop: (event: DragEvent, node: WidgetNode) => void; onSelect: (id: string) => void; onChange: (node: ComponentNode) => void; onActivate: (id: string) => void;
  } = $props();

</script>
{#each nodes as node (node.id)}
  {#if !editing || !hiddenInEditor[node.id]}
  {#if isLayout(node)}
    <div class="scene-layout" class:layout-highlighted={editing && highlightLayoutId === node.id} data-axis={node.fields.direction.value} data-layout-id={node.id}>
      <CanvasNodes nodes={node.fields.children.value} {editing} {selectedId} {dropTarget} {hiddenInEditor} {clickTargets} {highlightLayoutId} {onDrag} {onHover} {onDrop} {onSelect} {onChange} {onActivate} />
    </div>
  {:else}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (編集時はbuttonとしてキーボード選択できる) -->
    <div id={node.kind === "text" ? node.id : undefined} class="scene-object" style:width={componentOuterWidth(node)} class:editing class:selected={editing && selectedId === node.id}
      class:empty={node.kind === "container" && node.fields.children.value.length === 0}
      data-object-id={node.id} data-kind={node.kind}
      data-drop-direction={editing && dropTarget?.id === node.id ? dropTarget.direction : undefined}
      role={editing || (!editing && clickTargets[node.id] && node.kind !== "button") ? "button" : "group"} aria-label={displayName(node)} tabindex={editing || (!editing && clickTargets[node.id] && node.kind !== "button") ? 0 : undefined} draggable={editing}
      onclick={(event) => {
        if (editing) { event.stopPropagation(); onSelect(node.id); return; }
        const child = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-flow-child-id]") : null;
        if (child && child.closest(".scene-object") === event.currentTarget) onActivate(child.dataset.flowChildId!);
        onActivate(node.id);
      }}
      onkeydown={(event) => { if (event.target === event.currentTarget && ["Enter", " "].includes(event.key)) { if (editing) { event.preventDefault(); event.stopPropagation(); onSelect(node.id); } else if (clickTargets[node.id] && node.kind !== "button") { event.preventDefault(); event.stopPropagation(); onActivate(node.id); } } }}
      ondragstart={(event) => onDrag(event, node)} ondragover={(event) => onHover(event, node)} ondrop={(event) => onDrop(event, node)}>
      <ComponentView {node} {editing} labelledBy={"coreType" in node && node.coreType === "input" ? labelledBy : undefined} {onChange}>
        {#if node.kind === "container" || node.kind === "textbox"}
          <CanvasNodes nodes={node.fields.children.value} {editing} {selectedId} {dropTarget} {hiddenInEditor} {clickTargets} {highlightLayoutId}
            labelledBy={containerInputLabel(node)}
            {onDrag} {onHover} {onDrop} {onSelect} {onChange} {onActivate} />
        {/if}
      </ComponentView>
    </div>
  {/if}
  {/if}
{/each}
