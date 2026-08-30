<script lang="ts">
  export interface LayerItem {
    readonly id: string;
    readonly name: string;
  }

  interface Props {
    readonly pageName: string;
    readonly items: readonly LayerItem[];
    readonly selectedId: string | null;
    readonly dropIndex: number | null;
    readonly onbegindrag: (
      event: PointerEvent,
      componentInstanceId: string,
    ) => void;
    readonly onedit: (componentInstanceId: string) => void;
    readonly onremove: (componentInstanceId: string) => void;
  }

  let {
    pageName,
    items,
    selectedId,
    dropIndex,
    onbegindrag,
    onedit,
    onremove,
  }: Props = $props();

</script>

<section class="layers-section" aria-labelledby="layers-heading">
  <h2 id="layers-heading">Layers</h2>
  <ul class="layer-tree" role="tree" aria-label="Page layers">
    <li role="treeitem" aria-expanded="true" aria-selected="false">
      <div class="page-tree-row">
        <span aria-hidden="true">⌄</span>
        <span>{pageName}</span>
      </div>
      <ul role="group">
        {#each items as item, index (item.id)}
          <li
            class="layer-drop-zone"
            class:active-drop={dropIndex === index}
            aria-hidden="true"
            data-drop-index={index}
          ></li>
          <li role="treeitem" aria-selected={selectedId === item.id}>
            <div
              class:selected-layer={selectedId === item.id}
              class="layer-row"
            >
              <button
                type="button"
                class="drag-grip"
                title="ドラッグして並べ替え"
                aria-label={`${item.name}を並べ替え`}
                onpointerdown={(event) => onbegindrag(event, item.id)}
              >⠿</button>
              <span class="layer-name">{item.name}</span>
              <button
                type="button"
                class="icon-button"
                aria-label={`${item.name}を編集`}
                title="編集"
                onclick={() => onedit(item.id)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 20h4L19 9l-4-4L4 16v4Zm12-13 1-1 2 2-1 1-2-2Z" />
                </svg>
              </button>
              <button
                type="button"
                class="icon-button danger"
                aria-label={`${item.name}を削除`}
                title="削除"
                onclick={() => onremove(item.id)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 21h10l1-14H6l1 14ZM9 3h6l1 2h4v2H4V5h4l1-2Z" />
                </svg>
              </button>
            </div>
          </li>
        {/each}
        <li
          class="layer-drop-zone"
          class:active-drop={dropIndex === items.length}
          aria-hidden="true"
          data-drop-index={items.length}
        ></li>
      </ul>
    </li>
  </ul>
</section>
