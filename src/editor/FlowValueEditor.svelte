<script lang="ts">
  import type { Pages } from "./component-model";
  import { constantNodes, pageComponents, scalarFields, variableNodes, type FlowGraph, type FlowValue } from "./flow-model";

  let { flow, flows, pages, value, label, id, writable = false, onChange }: {
    flow: FlowGraph; flows: FlowGraph[]; pages: Pages; value: FlowValue | null; label: string; id: string; writable?: boolean; onChange: (value: FlowValue | null) => void;
  } = $props();
  const pageId = $derived(flow.scope.kind === "page" ? flow.scope.pageId : "");
  const components = $derived(value?.kind === "field" ? pageComponents(pages, pageId).filter((item) => !writable || item.node.kind !== "page") : []);
  const variables = $derived(variableNodes(flow, flows));
  const constants = $derived(constantNodes(flow, flows));
  const fields = $derived.by(() => {
    if (value?.kind !== "field") return [];
    const target = components.find((item) => item.id === value.componentId);
    return target ? scalarFields(target.node) : [];
  });
  function chooseKind(kind: string): void {
    if (kind === "field" && pageId) onChange({ kind: "field", pageId, componentId: "", fieldKey: "" });
    else if (kind === "variable") onChange({ kind: "variable", variableId: "" });
    else if (kind === "constant" && !writable) onChange({ kind: "constant", constantId: "" });
    else onChange(null);
  }
</script>

<div class="flow-value-editor" class:kind-field={value?.kind === "field"} class:kind-variable={value?.kind === "variable"} class:kind-constant={value?.kind === "constant"}>
  <span class="flow-value-direction" class:writable>{writable ? "DATA OUT / 書き込み先" : "DATA IN / 読み取り元"}</span>
  <label>{label}<select aria-label={label + "の種類"} value={value?.kind ?? ""} onchange={(event) => chooseKind(event.currentTarget.value)}>
    <option value="">{writable ? "代入先を選択" : "値の種類を選択"}</option><option value="field" disabled={!pageId}>FIELD / フィールド</option><option value="variable">VAR / ユーザー変数</option>{#if !writable}<option value="constant">CONST / 定数</option>{/if}
  </select></label>
  {#if !pageId}<p class="flow-inspector-help">FIELDはPage範囲のFlowで参照できます。</p>{/if}
  {#if value?.kind === "field"}
    <span class="flow-value-badge field">FIELD</span>
    <label>Com<select aria-label={label + "のCom"} value={value.componentId} onchange={(event) => onChange({ ...value, pageId, componentId: event.currentTarget.value, fieldKey: "" })}>
      <option value="">選択してください</option>{#each components as component (component.id)}<option value={component.id}>{component.name} / {component.id}</option>{/each}
    </select></label>
    <label>Field key<input aria-label={label + "のフィールドキー"} list={id + "-field-keys"} autocomplete="off" placeholder="入力して候補から選択" value={value.fieldKey} oninput={(event) => onChange({ ...value, pageId, fieldKey: event.currentTarget.value })} /></label>
    <datalist id={id + "-field-keys"}>{#each fields as field (field.key)}<option value={field.key}>{field.name} / {field.type}</option>{/each}</datalist>
    {#if value.fieldKey}<span class="flow-value-reference">{value.componentId}.{value.fieldKey}</span>{/if}
  {:else if value?.kind === "variable"}
    <span class="flow-value-badge variable">VAR</span>
    <label>ユーザー変数<select aria-label={writable ? "更新するユーザー変数" : label + "のユーザー変数"} value={value.variableId} onchange={(event) => onChange({ kind: "variable", variableId: event.currentTarget.value })}>
      <option value="">選択してください</option>{#each variables as variable (variable.id)}<option value={variable.id}>{variable.name}{variable.global ? " / GLOBAL" : ""}</option>{/each}
    </select></label>
  {:else if value?.kind === "constant"}
    <span class="flow-value-badge constant">CONST</span>
    <label>定数<select aria-label={label + "の定数"} value={value.constantId} onchange={(event) => onChange({ kind: "constant", constantId: event.currentTarget.value })}>
      <option value="">選択してください</option>{#each constants as constant (constant.id)}<option value={constant.id}>{constant.name}{constant.global ? " / GLOBAL" : ""}</option>{/each}
    </select></label>
  {/if}
</div>
