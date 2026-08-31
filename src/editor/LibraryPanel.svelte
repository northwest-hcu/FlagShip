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
      {@const overlayOnly = selection.component.allowedSurface === "overlay"}
      {@const surfaceName = overlayOnly ? "Overlay Surface" : "Content Surface"}
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
          aria-label={`${selection.component.name}（${surfaceName}用）`}
          title={`${surfaceName}用Component`}
          onclick={() => onpreview(selection)}
        >
          <span
            class="surface-icon"
            class:overlay-surface-icon={overlayOnly}
            aria-hidden="true"
          >{overlayOnly ? "◆" : "■"}</span>
          <span>{selection.component.name}</span>
        </button>
        <span class="library-chip">{selection.libraryName}</span>
      </article>
    {/each}
  </div>
</section>
