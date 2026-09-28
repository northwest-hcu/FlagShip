<script lang="ts">
  import ToggleGroup from "./ToggleGroup.svelte";
  import IconPicker from "./IconPicker.svelte";
  import ColorPicker from "./ColorPicker.svelte";
  import { isColor } from "./colors";
  import type { ComponentBreadcrumb } from "./component-breadcrumbs";
  import { componentFields, displayName, resetColorField, typeName, withField, type ComponentNode, type EditableField } from "./component-model";
  let { node, breadcrumbs, onClose, onSelect, onChange }: {
    node: ComponentNode; breadcrumbs: ComponentBreadcrumb[]; onClose: () => void; onSelect: (id: string) => void; onChange: (node: ComponentNode) => void;
  } = $props();
  let collapsedFields = $state<Record<string, boolean>>({});
  function change(key: string, value: string): void { onChange(withField(node, key as EditableField, value)); }
  function toggleField(key: string): void {
    const fieldKey = node.id + ":" + key;
    collapsedFields[fieldKey] = !(collapsedFields[fieldKey] ?? true);
  }
</script>
<aside class="details-pane" aria-label="コンポーネントの詳細">
  <div class="details-heading"><h3>Details</h3><button type="button" class="details-close" aria-label="詳細paneを閉じる" onclick={onClose}>−</button></div>
  <nav class="details-breadcrumbs" aria-label="コンポーネントのパンくず">
    <ol>
      {#each breadcrumbs as crumb, index (crumb.key)}
        <li>
          {#if crumb.kind === "component"}
            {#if index < breadcrumbs.length - 1}
              <button type="button" aria-label={crumb.label + "の詳細へ戻る"} onclick={() => onSelect(crumb.id)}>{crumb.label}</button>
            {:else}<span aria-current="page">{crumb.label}</span>{/if}
          {:else}<span class="breadcrumb-slot">{crumb.label}</span>{/if}
        </li>
      {/each}
    </ol>
  </nav>
  <p class="details-name">{displayName(node)}</p>
  <div class="details-type"><span data-component-type={typeName(node)}>{typeName(node)}</span></div>
  {#each componentFields(node) as entry (entry.key)}
    {@const collapsed = collapsedFields[node.id + ":" + entry.key] ?? true}
    {@const bodyId = node.id + "-" + entry.key + "-body"}
    <section class="detail-field" data-field-key={entry.key}>
      <div class="field-heading">
        <button type="button" class="field-toggle" aria-label={entry.field.name + "フィールドを開閉"}
          aria-expanded={!collapsed} aria-controls={bodyId} onclick={() => toggleField(entry.key)}>
          <span aria-hidden="true">{collapsed ? "+" : "−"}</span>
        </button>
        <div class="field-type"><span>{entry.field.name}</span><span>{entry.type}</span></div>
      </div>
      <div class="field-body" id={bodyId} hidden={collapsed}>
        <p class="field-description" id={node.id + "-" + entry.key + "-description"}>{entry.field.description}</p>
        {#if entry.field.type === "Color" && isColor(entry.field.value)}
          {#key node.id}
            <ColorPicker label={entry.field.name} value={entry.field.value} active={!collapsed} id={bodyId + "-custom"}
              inherited={entry.key === "color" && node.fields.color.inherited}
              onChange={(value) => change(entry.key, JSON.stringify(value))} onReset={() => onChange(resetColorField(node, entry.key))} />
          {/key}
        {:else if entry.field.editor === "icon-picker" && node.kind === "icon"}
          {#key node.id}<IconPicker value={node.fields.symbol.value} font={node.fields.font.value} options={node.fields.symbol.options} onChange={(value) => change(entry.key, value)} />{/key}
        {:else if entry.field.type === "Boolean"}
          <ToggleGroup label={entry.field.name} value={String(entry.field.value)} options={[{ value: "false", label: "OFF" }, { value: "true", label: "ON" }]}
            onChange={(value) => change(entry.key, value)} />
        {:else if entry.field.type === "Enum"}
          <ToggleGroup label={entry.field.name} value={String(entry.field.value)} options={[...(entry.field.options ?? [])]}
            disabled={!!entry.field.enabledWhen && !String((node.fields as Record<string, { value: unknown }>)[entry.field.enabledWhen.field]?.value).startsWith(entry.field.enabledWhen.prefix)}
            onChange={(value) => change(entry.key, value)} />
        {:else if entry.field.type === "Number"}
          <label class="field-value numeric-field">
            <input aria-label={entry.field.name} aria-describedby={node.id + "-" + entry.key + "-description"}
              type="number" min={entry.field.min} step={entry.field.step ?? "any"} value={Number(entry.field.value)} oninput={(event) => change(entry.key, event.currentTarget.value)} />{#if entry.field.unit}<span>{entry.field.unit}</span>{/if}
          </label>
        {:else}
          <label class="field-value"><span class="visually-hidden">{entry.field.name}</span>
            {#if entry.field.editor === "multiline"}
              <textarea aria-label={entry.field.name} aria-describedby={node.id + "-" + entry.key + "-description"} rows="3" value={String(entry.field.value)} oninput={(event) => change(entry.key, event.currentTarget.value)}></textarea>
            {:else}
              <input aria-label={entry.field.name} aria-describedby={node.id + "-" + entry.key + "-description"} type={entry.field.editor ?? "text"}
                step="any" value={String(entry.field.value)} oninput={(event) => change(entry.key, event.currentTarget.value)} />
            {/if}
          </label>
        {/if}
      </div>
    </section>
  {/each}
</aside>
