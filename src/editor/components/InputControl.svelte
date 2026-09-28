<script lang="ts">
  import { inputHtmlType, withField, type InputNode, type ComponentNode } from "../component-model";
  import { colorCss } from "../colors";
  let { node, editing = false, labelledBy, onChange = () => {} }: {
    node: InputNode; editing?: boolean; labelledBy?: string; onChange?: (node: ComponentNode) => void;
  } = $props();
  function change(value: string): void { onChange(withField(node, "value", value)); }
</script>
{#if node.kind === "textarea"}
  <textarea class="component-input component-textarea" id={node.id} aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : node.fields.alt.value}
    readonly={editing} rows={node.fields.rows.value} placeholder={node.fields.placeholder.value} value={node.fields.value.value}
    style:color={colorCss(node.fields.color.value)} style:background={colorCss(node.fields.background.value)} oninput={(event) => change(event.currentTarget.value)}></textarea>
{:else if node.kind === "select"}
  <select class="component-input component-select" id={node.id} aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : node.fields.alt.value}
    disabled={editing} value={node.fields.value.value} style:color={colorCss(node.fields.color.value)} style:background={colorCss(node.fields.background.value)}
    onchange={(event) => change(event.currentTarget.value)}>
    {#each node.fields.value.options ?? [] as option}<option value={option.value}>{option.label}</option>{/each}
  </select>
{:else}
  <input class="component-input" id={node.id} aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : node.fields.alt.value}
    type={inputHtmlType(node)} step="any" readonly={editing} placeholder={node.fields.placeholder.value} value={node.fields.value.value}
    style:color={colorCss(node.fields.color.value)} style:background={colorCss(node.fields.background.value)} oninput={(event) => change(event.currentTarget.value)} />
{/if}
