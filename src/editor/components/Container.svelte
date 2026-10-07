<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Axis, ContainerWidthMode, HorizontalAlign, VerticalAlign } from "../component-model";
  let { children, direction = "horizontal", padding = 10, margin = 10, gap = 16, widthMode = "fill", width = 320, height = 0,
    horizontalAlign = "left", verticalAlign = "top", stretchChildren = false, color = "var(--frame-text)", background = "transparent" }: {
    children?: Snippet; direction?: Axis; padding?: number; margin?: number; gap?: number; widthMode?: ContainerWidthMode; width?: number; height?: number;
    horizontalAlign?: HorizontalAlign; verticalAlign?: VerticalAlign; stretchChildren?: boolean; color?: string; background?: string;
  } = $props();
  const horizontal = $derived(({ left: "flex-start", center: "center", right: "flex-end" })[horizontalAlign]);
  const vertical = $derived(({ top: "flex-start", center: "center", bottom: "flex-end" })[verticalAlign]);
</script>

<div class="component-container" data-direction={direction} data-width-mode={widthMode} data-stretch-children={stretchChildren}
  style:width={widthMode === "fill" ? `calc(100% - ${2 * margin}px)` : widthMode === "fixed" ? width + "px" : "max-content"}
  style:height={height > 0 ? height + "px" : "auto"}
  style:align-items={stretchChildren ? "stretch" : direction === "vertical" ? horizontal : vertical}
  style:justify-content={direction === "vertical" ? vertical : horizontal}
  style:gap={gap + "px"} style:padding={padding + "px"} style:margin={margin + "px"} style:color style:background>
  {@render children?.()}
</div>
