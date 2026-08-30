<script lang="ts">
  import type { ProjectDocument } from "../core/model/project";
  import type { UIPage } from "../core/model/ui";
  import PageRenderer from "../runtime/renderer/PageRenderer.svelte";

  interface Props {
    readonly componentName: string;
    readonly libraryName: string;
    readonly project: ProjectDocument;
    readonly page: UIPage;
    readonly onclose: () => void;
  }

  let {
    componentName,
    libraryName,
    project,
    page,
    onclose,
  }: Props = $props();
  let dialog: HTMLDialogElement;

  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
</script>

<dialog
  class="sample-dialog"
  bind:this={dialog}
  aria-labelledby="sample-dialog-title"
  onclose={onclose}
  onclick={(event) => {
    if (event.target === dialog) dialog.close();
  }}
>
  <header>
    <div>
      <span class="library-chip">{libraryName}</span>
      <h2 id="sample-dialog-title">{componentName}</h2>
    </div>
    <button type="button" class="modal-close" aria-label="サンプルを閉じる" onclick={() => dialog.close()}>×</button>
  </header>
  <div class="sample-preview">
    <PageRenderer {project} {page} mode="sample" />
  </div>
</dialog>
