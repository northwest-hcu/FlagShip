<script lang="ts">
  import ToggleGroup from "./ToggleGroup.svelte";
  import IconPicker from "./IconPicker.svelte";
  import ColorPicker from "./ColorPicker.svelte";
  import { isColor } from "./colors";
  import { componentFields, displayName, resetColorField, typeName, withField, type ComponentNode, type EditableField } from "./component-model";
  let { node, hasClickFlow, onClose, onChange, onCreateClickFlow }: {
    node: ComponentNode; hasClickFlow: boolean; onClose: () => void; onChange: (node: ComponentNode) => void; onCreateClickFlow: () => void;
  } = $props();
  let collapsedFields = $state<Record<string, boolean>>({});
  function sectionFor(key: string): string {
    if (["name", "value", "direction", "alt"].includes(key)) return "基本";
    if (["text", "link", "source", "poster", "captions", "placeholder", "label", "symbol"].includes(key)) return "内容";
    if (["width", "height", "margin", "padding", "paddingHorizontal", "paddingVertical", "rows", "widthMode", "gap", "horizontalAlign", "verticalAlign", "stretchChildren"].includes(key)) return "配置";
    if (["color", "background", "font", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "borderRadius", "fill", "shape", "strokeWidth"].includes(key)) return "見た目";
    return "詳細";
  }
  const fieldGroups = $derived.by(() => ["基本", "内容", "配置", "見た目", "詳細"].map((name) => ({ name,
    entries: componentFields(node).filter((entry) => sectionFor(entry.key) === name),
  })).filter((group) => group.entries.length));
  function change(key: string, value: string): void { onChange(withField(node, key as EditableField, value)); }
  function fieldDisabled(key: string, field: { enabledWhen?: { field: string; prefix: string } }): boolean {
    if (field.enabledWhen && !String((node.fields as Record<string, { value: unknown }>)[field.enabledWhen.field]?.value).startsWith(field.enabledWhen.prefix)) return true;
    if ((node.kind === "container" || node.kind === "textbox") && node.fields.stretchChildren.value) {
      return node.fields.direction.value === "vertical" ? key === "horizontalAlign" : key === "verticalAlign";
    }
    return false;
  }
  function toggleField(key: string): void {
    const fieldKey = node.id + ":" + key;
    collapsedFields[fieldKey] = !(collapsedFields[fieldKey] ?? !["name", "value", "direction"].includes(key));
  }
</script>
<aside class="details-pane" aria-label="Comの詳細">
  <div class="details-heading"><h3>Details</h3><button type="button" class="details-close" aria-label="詳細paneを閉じる" onclick={onClose}>−</button></div>
  <p class="details-name component-name-label" title={displayName(node)}>{displayName(node)}</p>
  <div class="details-type"><span data-component-type={typeName(node)}>{typeName(node)}</span></div>
  {#if node.kind !== "page"}
    <section class="details-events"><h4>Events</h4><button type="button" class="toolbar-button" onclick={onCreateClickFlow}>{hasClickFlow ? "Click Flowを開く" : "+ Click Flow"}</button></section>
  {/if}
  {#each fieldGroups as group (group.name)}
  <section class="details-field-group" aria-label={group.name}><h4>{group.name}</h4>
  {#each group.entries as entry (entry.key)}
    {@const collapsed = collapsedFields[node.id + ":" + entry.key] ?? !["name", "value", "direction"].includes(entry.key)}
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
            disabled={fieldDisabled(entry.key, entry.field)}
            onChange={(value) => change(entry.key, value)} />
        {:else if entry.field.type === "Number"}
          <label class="field-value numeric-field">
            <input aria-label={entry.field.name} aria-describedby={node.id + "-" + entry.key + "-description"}
              disabled={fieldDisabled(entry.key, entry.field)}
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
  </section>
  {/each}
</aside>
