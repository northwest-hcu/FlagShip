<script lang="ts">
  import type { ShapeType } from "../component-model";
  import { colorCss } from "../colors";
  let { node }: { node: ShapeType } = $props();
</script>
<svg class="component-shape" role="img" aria-label={node.fields.label.value} width={node.fields.width.value} height={node.fields.height.value}
  style:background={colorCss(node.fields.background.value)} viewBox={"0 0 " + Math.max(1, node.fields.width.value) + " " + Math.max(1, node.fields.height.value)}>
  {#if node.fields.shape.value === "line"}
    <line x1={node.fields.direction.value === "vertical" ? node.fields.width.value / 2 : 0} y1={node.fields.direction.value === "vertical" ? 0 : node.fields.height.value / 2}
      x2={node.fields.direction.value === "vertical" ? node.fields.width.value / 2 : node.fields.width.value} y2={node.fields.direction.value === "vertical" ? node.fields.height.value : node.fields.height.value / 2}
      stroke={colorCss(node.fields.color.value)} stroke-width={node.fields.strokeWidth.value} />
  {:else if node.fields.shape.value === "rectangle"}<rect width={node.fields.width.value} height={node.fields.height.value} fill={colorCss(node.fields.color.value)} />
  {:else}<ellipse cx={node.fields.width.value / 2} cy={node.fields.height.value / 2} rx={node.fields.width.value / 2} ry={node.fields.height.value / 2} fill={colorCss(node.fields.color.value)} />{/if}
</svg>
