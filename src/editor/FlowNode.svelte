<script lang="ts">
  import type {
    FlowGraph,
    FlowNode as FlowNodeModel,
  } from "../core/model/flow";
  import type { Value } from "../core/model/value";
  import {
    nodesForFlowVariable,
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
  const overlayVariables = $derived(
    Object.values(variables ?? {}).filter(
      (variable) => variable.target.kind === "overlay-instance",
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

  function setConfig(key: string, value: Value): void {
    onconfigchange({ ...node.config, [key]: value });
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
  {:else if node.type === "overlay.action"}
    <label>
      Overlay variable
      <select
        value={typeof node.config.variableId === "string" ? node.config.variableId : ""}
        onchange={(event) => setConfig("variableId", event.currentTarget.value)}
      >
        <option value="">未設定</option>
        {#each overlayVariables as variable (variable.id)}
          <option value={variable.id}>{variable.name}</option>
        {/each}
      </select>
    </label>
    <label>
      Action
      <select
        value={typeof node.config.action === "string" ? node.config.action : "activate"}
        onchange={(event) => setConfig("action", event.currentTarget.value)}
      >
        <option value="activate">activate</option>
        <option value="deactivate">deactivate</option>
        <option value="toggle">toggle</option>
      </select>
    </label>
  {/if}
</article>
