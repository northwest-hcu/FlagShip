<script lang="ts">
  import type { Snippet } from "svelte";
  let { label = "ボタン", children, color = "var(--frame-background)", background = "var(--frame-accent)", width = 0, height = 0, paddingHorizontal = 24, paddingVertical = 12, borderRadius = 8 }: {
    label?: string; children?: Snippet; color?: string; background?: string;
    width?: number; height?: number; paddingHorizontal?: number; paddingVertical?: number; borderRadius?: number;
  } = $props();
</script>
<button type="button" class="component-button" aria-label={label} style:color style:background style:border-color={background}
  style:width={width > 0 ? width + "px" : "auto"} style:height={height > 0 ? height + "px" : "auto"}
  style:min-width={width > 0 ? "0" : "3rem"} style:min-height={height > 0 ? "0" : "3rem"}
  style:padding={paddingVertical + "px " + paddingHorizontal + "px"} style:border-radius={borderRadius + "px"}>
  {@render children?.()}
</button>
