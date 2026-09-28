<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Axis } from "../component-model";
  let { children, direction = "vertical", padding = 10, margin = 10, color = "var(--frame-text)", background = "transparent" }: {
    children?: Snippet; direction?: Axis; padding?: number; margin?: number; color?: string; background?: string;
  } = $props();
</script>

<div class="component-container" data-direction={direction} style:padding={padding + "px"} style:margin={margin + "px"} style:color style:background>
  {@render children?.()}
</div>
