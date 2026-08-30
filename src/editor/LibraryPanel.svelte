<script lang="ts">
  import type { SelectableComponent } from "./editor-project";

  interface Props {
    readonly components: readonly SelectableComponent[];
    readonly onpreview: (selection: SelectableComponent) => void;
    readonly onbegindrag: (
      event: PointerEvent,
      selection: SelectableComponent,
    ) => void;
  }

  let { components, onpreview, onbegindrag }: Props = $props();
</script>

<section aria-labelledby="library-heading">
  <h2 id="library-heading">Library</h2>
  <div class="component-list">
    {#each components as selection (`${selection.libraryId}:${selection.component.id}`)}
      <article class="component-option">
        <button
          type="button"
          class="drag-grip"
          title="Canvasへドラッグ"
          aria-label={`${selection.component.name}をドラッグ`}
          onpointerdown={(event) => onbegindrag(event, selection)}
        >⠿</button>
        <button
          type="button"
          class="component-name"
          onclick={() => onpreview(selection)}
        >{selection.component.name}</button>
        <span class="library-chip">{selection.libraryName}</span>
      </article>
    {/each}
  </div>
</section>
