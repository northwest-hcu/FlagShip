<script lang="ts">
  import { TEXT_FONTS, type TextType } from "../component-model";
  import { colorCss } from "../colors";
  let { node }: { node: TextType } = $props();
</script>
<span class="component-text" style:color={colorCss(node.fields.color.value)} style:background={colorCss(node.fields.background.value)}
  style:font-family={TEXT_FONTS.find((font) => font.value === node.fields.font.value)!.family}
  style:font-size={node.fields.fontSize.value + "px"} style:font-weight={node.fields.fontWeight.value}
  style:line-height={node.fields.lineHeight.value} style:letter-spacing={node.fields.letterSpacing.value + "px"}>{node.fields.value.value}</span>
