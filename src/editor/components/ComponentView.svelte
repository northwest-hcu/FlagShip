<script lang="ts">
  import type { Snippet } from "svelte";
  import ComponentView from "./ComponentView.svelte";
  import { componentOuterWidth, containerInputLabel, displayName, type ComponentNode } from "../component-model";
  import { colorCss } from "../colors";
  import Button from "./Button.svelte";
  import Container from "./Container.svelte";
  import InputControl from "./InputControl.svelte";
  import Shape from "./Shape.svelte";
  import Image from "./Image.svelte";
  import Icon from "./Icon.svelte";
  import Text from "./Text.svelte";
  import Video from "./Video.svelte";
  let { node, editing = false, decorative = false, children, labelledBy, onChange = () => {} }: {
    node: ComponentNode; editing?: boolean; decorative?: boolean; children?: Snippet; labelledBy?: string; onChange?: (node: ComponentNode) => void;
  } = $props();
  const color = $derived(colorCss(node.fields.color.value));
  const background = $derived(colorCss(node.fields.background.value));
  const buttonLabel = $derived(node.kind === "button" ? node.fields.contents.value.filter((part) => part.kind === "text").map((part) => part.fields.value.value).join(" ")
    || node.fields.contents.value.filter((part) => part.kind === "image" || part.kind === "icon").map((part) => part.fields.alt.value).join(" ") || displayName(node) : "");
</script>
{#if node.kind === "button"}
  <Button label={buttonLabel} {color} {background} width={node.fields.width.value} height={node.fields.height.value}
    paddingHorizontal={node.fields.paddingHorizontal.value} paddingVertical={node.fields.paddingVertical.value} borderRadius={node.fields.borderRadius.value}>
    {#each node.fields.contents.value as child (child.id)}
      <span class="component-button-content" data-button-content={child.id} data-flow-child-id={child.id}><ComponentView node={child} {editing} decorative /></span>
    {/each}
  </Button>
{:else if node.kind === "container" || node.kind === "textbox"}
  <Container direction={node.fields.direction.value} padding={node.fields.padding.value} margin={node.fields.margin.value}
    gap={node.fields.gap.value} widthMode={node.fields.widthMode.value} width={node.fields.width.value} height={node.fields.height.value}
    horizontalAlign={node.fields.horizontalAlign.value} verticalAlign={node.fields.verticalAlign.value} stretchChildren={node.fields.stretchChildren.value} {color} {background}>
    {#if children}{@render children()}
    {:else}{#each node.fields.children.value as child (child.id)}
      <div class="component-child" style:width={componentOuterWidth(child)}>
        <ComponentView node={child} {editing} labelledBy={"coreType" in child && child.coreType === "input" ? containerInputLabel(node) : undefined} {onChange} />
      </div>
    {/each}{/if}
  </Container>
{:else if "coreType" in node && node.coreType === "input"}<InputControl {node} {editing} {labelledBy} {onChange} />
{:else if node.kind === "image"}<Image source={node.fields.source.value} alt={node.fields.alt.value} {decorative} {background} />
{:else if node.kind === "icon"}
  <Icon symbol={node.fields.symbol.value} label={node.fields.alt.value} font={node.fields.font.value} fill={node.fields.fill.value} source={node.fields.source.value} {decorative} {color} {background} />
{:else if node.kind === "text"}<Text {node} {decorative} />
{:else if node.kind === "paragraph"}
  <p class="component-paragraph" style:color style:background
    style:width={node.fields.width.value > 0 ? node.fields.width.value + "px" : "auto"}
    style:height={node.fields.height.value > 0 ? node.fields.height.value + "px" : "auto"}
    style:max-width={node.fields.width.value > 0 ? "none" : "30rem"}
    style:margin={node.fields.margin.value + "px"} style:padding={node.fields.padding.value + "px"}>
    {#each node.fields.text.value as child (child.id)}<span data-flow-child-id={child.id}><Text node={child} /></span>{/each}
  </p>
{:else if node.kind === "shape"}<Shape {node} />
{:else if node.kind === "video"}<Video source={node.fields.source.value} poster={node.fields.poster.value} label={node.fields.label.value} captions={node.fields.captions.value} {background} />
{/if}
