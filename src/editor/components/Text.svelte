<script lang="ts">
  import { TEXT_FONTS, type TextType } from "../component-model";
  import { colorCss } from "../colors";
  let { node, decorative = false }: { node: TextType; decorative?: boolean } = $props();
  const href = $derived(!decorative && /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(node.fields.link.value.trim()) ? node.fields.link.value.trim() : "");
</script>
<svelte:element this={href ? "a" : "span"} href={href || undefined} id={node.id + "-content"} class="component-text" style:color={colorCss(node.fields.color.value)} style:background={colorCss(node.fields.background.value)}
  style:font-family={TEXT_FONTS.find((font) => font.value === node.fields.font.value)!.family}
  style:font-size={node.fields.fontSize.value + "px"} style:font-weight={node.fields.fontWeight.value}
  style:line-height={node.fields.lineHeight.value} style:letter-spacing={node.fields.letterSpacing.value + "px"}>{node.fields.value.value}</svelte:element>
