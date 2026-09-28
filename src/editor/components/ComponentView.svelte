<script lang="ts">
  import type { Snippet } from "svelte";
  import ComponentView from "./ComponentView.svelte";
  import { displayName, type ComponentNode } from "../component-model";
  import { colorCss } from "../colors";
  import Button from "./Button.svelte";
  import Container from "./Container.svelte";
  import TextBox from "./TextBox.svelte";
  import InputControl from "./InputControl.svelte";
  import Shape from "./Shape.svelte";
  import Image from "./Image.svelte";
  import Icon from "./Icon.svelte";
  import Text from "./Text.svelte";
  import Video from "./Video.svelte";
  let { node, editing = false, decorative = false, children, onChange = () => {} }: {
    node: ComponentNode; editing?: boolean; decorative?: boolean; children?: Snippet; onChange?: (node: ComponentNode) => void;
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
      <span class="component-button-content" data-button-content={child.id}><ComponentView node={child} {editing} decorative /></span>
    {/each}
  </Button>
{:else if node.kind === "container"}
  <Container direction={node.fields.direction.value} padding={node.fields.padding.value} margin={node.fields.margin.value} {color} {background}>
    {#if children}{@render children()}
    {:else}{#each node.fields.children.value as child (child.id)}<ComponentView node={child} {editing} {onChange} />{/each}{/if}
  </Container>
{:else if node.kind === "textbox"}
  {@const labelNode = node.fields.label.value}
  <TextBox id={node.id} label={labelNode?.fields.value.value ?? ""} {color}
    labelColor={labelNode ? colorCss(labelNode.fields.color.value) : color}>
    {#snippet labelContent()}{#if labelNode}<Text node={labelNode} />{/if}{/snippet}
    <InputControl {node} {editing} labelledBy={node.fields.label.value?.fields.value.value.trim() ? node.id + "-label" : undefined} {onChange} />
  </TextBox>
{:else if "coreType" in node && node.coreType === "input"}<InputControl {node} {editing} {onChange} />
{:else if node.kind === "image"}<Image source={node.fields.source.value} alt={node.fields.alt.value} {decorative} {background} />
{:else if node.kind === "icon"}
  <Icon symbol={node.fields.symbol.value} label={node.fields.alt.value} font={node.fields.font.value} fill={node.fields.fill.value} source={node.fields.source.value} {decorative} {color} {background} />
{:else if node.kind === "text"}<Text {node} />
{:else if node.kind === "paragraph"}
  <p class="component-paragraph" style:color style:background>{#if node.fields.text.value}<Text node={node.fields.text.value} />{/if}</p>
{:else if node.kind === "span"}
  <span class="component-span" style:color style:background>{#if node.fields.text.value}<Text node={node.fields.text.value} />{/if}</span>
{:else if node.kind === "shape"}<Shape {node} />
{:else if node.kind === "video"}<Video source={node.fields.source.value} poster={node.fields.poster.value} label={node.fields.label.value} captions={node.fields.captions.value} {background} />
{/if}
