<script lang="ts">
  import type {
    FlowGraph,
    FlowNode as FlowNodeModel,
  } from "../core/model/flow";
  import type { Value } from "../core/model/value";
  import {
    nodesForFlowVariable,
    stateFieldsForFlowVariable,
    type FlowVariableCandidate,
  } from "./flow-variables";

  interface Props {
    readonly node: FlowNodeModel;
    readonly variables: FlowGraph["variables"];
    readonly candidates: readonly FlowVariableCandidate[];
    readonly onconfigchange: (config: Readonly<Record<string, Value>>) => void;
    readonly onremove: () => void;
  }

  let { node, variables, candidates, onconfigchange, onremove }: Props = $props();
  const componentVariables = $derived(
    Object.values(variables ?? {}).filter(
      (variable) => variable.target.kind === "component-instance",
    ),
  );
  const selectedVariable = $derived(
    typeof node.config.variableId === "string"
      ? variables?.[node.config.variableId]
      : undefined,
  );
  const nodeOptions = $derived(
    selectedVariable ? nodesForFlowVariable(selectedVariable, candidates) : [],
  );
  const stateFields = $derived(
    selectedVariable && typeof node.config.localId === "string"
      ? stateFieldsForFlowVariable(
          selectedVariable,
          candidates,
          node.config.localId,
        )
      : [],
  );
  const selectedStateField = $derived(
    stateFields.find((field) => field.key === node.config.key),
  );

  function setConfig(key: string, value: Value): void {
    onconfigchange({ ...node.config, [key]: value });
  }

  function selectStateNode(localId: string): void {
    onconfigchange({ ...node.config, localId, key: "", value: "" });
  }

  function selectStateVariable(variableId: string): void {
    onconfigchange({ variableId, localId: "", key: "", value: "" });
  }

  function selectStateField(key: string): void {
    const field = stateFields.find((candidate) => candidate.key === key);
    onconfigchange({
      ...node.config,
      key,
      value: field?.type === "boolean" ? false : "",
    });
  }
</script>

<article class="flow-node-card">
  <div>
    <strong>{node.type}</strong>
    <code>{node.id}</code>
  </div>
  <button
    type="button"
    aria-label={`${node.type}を削除`}
    title="削除"
    onclick={onremove}
  >×</button>
  {#if node.type === "trigger.ui-event"}
    <label>
      Component variable
      <select
        value={typeof node.config.variableId === "string" ? node.config.variableId : ""}
        onchange={(event) => setConfig("variableId", event.currentTarget.value)}
      >
        <option value="">未設定</option>
        {#each componentVariables as variable (variable.id)}
          <option value={variable.id}>{variable.name}</option>
        {/each}
      </select>
    </label>
    <label>
      UI node
      <select
        value={typeof node.config.localId === "string" ? node.config.localId : ""}
        onchange={(event) => setConfig("localId", event.currentTarget.value)}
      >
        <option value="">未設定</option>
        {#each nodeOptions as option (option.id)}
          <option value={option.id}>{option.name}</option>
        {/each}
      </select>
    </label>
    <label>
      Event
      <select value="click" disabled><option value="click">click</option></select>
    </label>
  {:else if node.type === "state.set"}
    <label>
      Component variable
      <select
        value={typeof node.config.variableId === "string" ? node.config.variableId : ""}
        onchange={(event) => selectStateVariable(event.currentTarget.value)}
      >
        <option value="">未設定</option>
        {#each componentVariables as variable (variable.id)}
          <option value={variable.id}>{variable.name}</option>
        {/each}
      </select>
    </label>
    <label>
      UI node
      <select
        value={typeof node.config.localId === "string" ? node.config.localId : ""}
        onchange={(event) => selectStateNode(event.currentTarget.value)}
      >
        <option value="">未設定</option>
        {#each nodeOptions as option (option.id)}
          <option value={option.id}>{option.name}</option>
        {/each}
      </select>
    </label>
    <label>
      State field
      <select
        value={typeof node.config.key === "string" ? node.config.key : ""}
        onchange={(event) => selectStateField(event.currentTarget.value)}
      >
        <option value="">未設定</option>
        {#each stateFields as field (field.key)}
          <option value={field.key}>{field.key}</option>
        {/each}
      </select>
    </label>
    <label>
      Value
      {#if selectedStateField?.type === "boolean"}
        <input
          type="checkbox"
          checked={node.config.value === true}
          onchange={(event) => setConfig("value", event.currentTarget.checked)}
        />
      {:else}
        <input
          type="text"
          value={typeof node.config.value === "string" ? node.config.value : ""}
          disabled={!selectedStateField}
          oninput={(event) => setConfig("value", event.currentTarget.value)}
        />
      {/if}
    </label>
  {:else if node.type === "data.constant"}
    <label>
      Value
      <input
        type="text"
        value={typeof node.config.value === "string" ? node.config.value : ""}
        oninput={(event) => setConfig("value", event.currentTarget.value)}
      />
    </label>
  {/if}
</article>
