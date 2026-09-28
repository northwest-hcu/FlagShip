<script lang="ts">
  import type { Snippet } from "svelte";
  let { id, label = "テキストボックス", labelContent, children, color = "var(--frame-text)", background = "transparent", labelColor = "inherit", labelBackground = "transparent" }: {
    id: string; label?: string; labelContent?: Snippet; children?: Snippet; color?: string; background?: string; labelColor?: string; labelBackground?: string;
  } = $props();
</script>
<div class="component-textbox" style:color style:background>
  {#if label.trim()}<label id={id + "-label"} for={id} style:color={labelColor} style:background={labelBackground}>
    {#if labelContent}{@render labelContent()}{:else}{label}{/if}
  </label>{/if}
  {@render children?.()}
</div>
