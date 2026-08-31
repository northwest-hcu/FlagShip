<script lang="ts">
  import type { FlowGraph, FlowInstanceTarget } from "../core/model/flow";
  import type { FlowVariableCandidate } from "./flow-variables";

  interface Props {
    readonly graph: FlowGraph;
    readonly candidates: readonly FlowVariableCandidate[];
    readonly onadd: (name: string, target: FlowInstanceTarget) => void;
  }

  let { graph, candidates, onadd }: Props = $props();
  let candidateKey = $state("");

  function addVariable(): void {
    const candidate = candidates.find((item) => item.key === candidateKey);
    if (!candidate) return;
    onadd(candidate.name, candidate.target);
  }
</script>

<section class="flow-variables" aria-label="Flow変数">
  <strong>Variables</strong>
  <select aria-label="変数にするInstance" bind:value={candidateKey}>
    <option value="">Instanceを選択</option>
    {#each candidates as candidate (candidate.key)}
      <option value={candidate.key}>{candidate.name}</option>
    {/each}
  </select>
  <button type="button" disabled={!candidateKey} onclick={addVariable}>+ Variable</button>
  {#if Object.values(graph.variables ?? {}).length > 0}
    <ul>
      {#each Object.values(graph.variables ?? {}) as variable (variable.id)}
        <li><code>{variable.name}</code></li>
      {/each}
    </ul>
  {/if}
</section>
