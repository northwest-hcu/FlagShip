<script lang="ts">
  import type { LayerItem } from "./layer-tree-model";

  interface Props {
    readonly pageName: string;
    readonly contentItems: readonly LayerItem[];
    readonly overlayItems: readonly LayerItem[];
    readonly selectedId: string | null;
    readonly pageDropIndex: number | null;
    readonly pageDropSurface: "content" | "overlay" | null;
    readonly activeSlotKey: string | null;
    readonly onbegindrag: (
      event: PointerEvent,
      componentInstanceId: string,
    ) => void;
    readonly onedit: (componentInstanceId: string) => void;
    readonly onremove: (componentInstanceId: string) => void;
  }

  let {
    pageName,
    contentItems,
    overlayItems,
    selectedId,
    pageDropIndex,
    pageDropSurface,
    activeSlotKey,
    onbegindrag,
    onedit,
    onremove,
  }: Props = $props();

  let collapsedKeys = $state<ReadonlySet<string>>(new Set());

  function isExpanded(key: string): boolean {
    return !collapsedKeys.has(key);
  }

  function toggleExpanded(key: string): void {
    const nextKeys = new Set(collapsedKeys);
    if (nextKeys.has(key)) {
      nextKeys.delete(key);
    } else {
      nextKeys.add(key);
    }
    collapsedKeys = nextKeys;
  }
</script>

{#snippet layerRows(
  rows: readonly LayerItem[],
  dropSurface: "content" | "overlay" | null,
)}
  {#each rows as item, index (item.key)}
    {#if dropSurface !== null}
      {@const targetIndex = item.pageIndex ?? index}
      <li
        class="layer-drop-zone"
        class:active-drop={pageDropIndex === targetIndex && pageDropSurface === dropSurface}
        aria-hidden="true"
        data-drop-kind="page"
        data-drop-index={targetIndex}
        data-drop-surface={dropSurface}
      ></li>
    {/if}
    <li
      role="treeitem"
      aria-selected={selectedId === item.id}
      aria-expanded={item.slots.length > 0 ? isExpanded(`component:${item.id}`) : undefined}
    >
      <div class:selected-layer={selectedId === item.id} class="layer-row">
        {#if item.slots.length > 0}
          <button
            type="button"
            class="tree-toggle"
            aria-label={`${item.name}の子要素を${isExpanded(`component:${item.id}`) ? "非表示" : "表示"}`}
            aria-expanded={isExpanded(`component:${item.id}`)}
            onclick={() => toggleExpanded(`component:${item.id}`)}
          >{isExpanded(`component:${item.id}`) ? "−" : "+"}</button>
        {:else}
          <span class="tree-toggle-spacer" aria-hidden="true"></span>
        {/if}
        {#if item.draggable}
          <button
            type="button"
            class="drag-grip"
            title="ドラッグして並べ替え"
            aria-label={`${item.name}を並べ替え`}
            onpointerdown={(event) => onbegindrag(event, item.id)}
          >⠿</button>
        {:else}
          <span class="drag-grip nested-grip" aria-hidden="true">⠿</span>
        {/if}
        <span class="layer-name">{item.name}</span>
        <button type="button" class="icon-button" aria-label={`${item.name}を編集`} title="編集" onclick={() => onedit(item.id)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Zm12-13 1-1 2 2-1 1-2-2Z" /></svg>
        </button>
        <button type="button" class="icon-button danger" aria-label={`${item.name}を削除`} title="削除" onclick={() => onremove(item.id)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21h10l1-14H6l1 14ZM9 3h6l1 2h4v2H4V5h4l1-2Z" /></svg>
        </button>
      </div>
      {#if item.slots.length > 0 && isExpanded(`component:${item.id}`)}
        <ul role="group" class="nested-layers">
          {#each item.slots as slot (slot.key)}
            <li
              role="treeitem"
              aria-expanded={slot.children.length > 0 ? isExpanded(`slot:${slot.key}`) : undefined}
              aria-selected="false"
            >
              <div
                class="slot-tree-row"
                class:active-drop={activeSlotKey === slot.key}
                data-drop-kind="slot"
                data-parent-instance-id={slot.parentInstanceId}
                data-parent-content-node-id={slot.parentContentNodeId}
                data-slot-id={slot.id}
              >
                {#if slot.children.length > 0}
                  <button
                    type="button"
                    class="tree-toggle"
                    aria-label={`${slot.name}の子要素を${isExpanded(`slot:${slot.key}`) ? "非表示" : "表示"}`}
                    aria-expanded={isExpanded(`slot:${slot.key}`)}
                    onclick={() => toggleExpanded(`slot:${slot.key}`)}
                  >{isExpanded(`slot:${slot.key}`) ? "−" : "+"}</button>
                {:else}
                  <span aria-hidden="true">◇</span>
                {/if}
                <span>{slot.name}</span>
                {#if slot.children.length === 0}
                  <small>ここにドロップ</small>
                {/if}
              </div>
              {#if slot.children.length > 0 && isExpanded(`slot:${slot.key}`)}
                <ul role="group">
                  {@render layerRows(slot.children, null)}
                </ul>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </li>
  {/each}
{/snippet}

{#snippet surfaceRows(
  surfaceKey: "content-surface" | "overlay-surface",
  surfaceName: string,
  rows: readonly LayerItem[],
)}
  {@const surface = surfaceKey === "content-surface" ? "content" : "overlay"}
  {@const endIndex = (rows.at(-1)?.pageIndex ?? -1) + 1}
  <li role="treeitem" aria-expanded={isExpanded(surfaceKey)} aria-selected="false">
    <div
      class="surface-tree-row"
      class:active-drop={pageDropIndex === endIndex && pageDropSurface === surface}
      data-drop-kind="page"
      data-drop-index={endIndex}
      data-drop-surface={surface}
    >
      <button
        type="button"
        class="tree-toggle"
        aria-label={`${surfaceName}の子要素を${isExpanded(surfaceKey) ? "非表示" : "表示"}`}
        aria-expanded={isExpanded(surfaceKey)}
        onclick={() => toggleExpanded(surfaceKey)}
      >{isExpanded(surfaceKey) ? "−" : "+"}</button>
      <span>{surfaceName}</span>
    </div>
    {#if isExpanded(surfaceKey)}
      <ul role="group">
        {@render layerRows(
          rows,
          surface,
        )}
        <li
          class="layer-drop-zone"
          class:active-drop={pageDropIndex === endIndex && pageDropSurface === surface}
          aria-hidden="true"
          data-drop-kind="page"
          data-drop-index={endIndex}
          data-drop-surface={surface}
        ></li>
      </ul>
    {/if}
  </li>
{/snippet}

<section class="layers-section" aria-labelledby="layers-heading">
  <h2 id="layers-heading">Layers</h2>
  <ul class="layer-tree" role="tree" aria-label="Page layers">
    <li role="treeitem" aria-expanded={isExpanded("page")} aria-selected="false">
      <div class="page-tree-row">
        <button
          type="button"
          class="tree-toggle"
          aria-label={`${pageName}の子要素を${isExpanded("page") ? "非表示" : "表示"}`}
          aria-expanded={isExpanded("page")}
          onclick={() => toggleExpanded("page")}
        >{isExpanded("page") ? "−" : "+"}</button>
        <span>{pageName}</span>
      </div>
      {#if isExpanded("page")}
        <ul role="group">
          {@render surfaceRows("content-surface", "Content Surface", contentItems)}
          {@render surfaceRows("overlay-surface", "Overlay Surface", overlayItems)}
        </ul>
      {/if}
    </li>
  </ul>
</section>
