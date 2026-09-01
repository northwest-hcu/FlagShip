<script lang="ts">
  import type { FlowGraph } from "../core/model/flow";
  import {
    createFlowChartLayout,
    FLOW_NODE_HEIGHT,
    FLOW_NODE_WIDTH,
  } from "./flow-chart-layout";
  import FlowNode from "./FlowNode.svelte";
  import type { Value } from "../core/model/value";
  import type { FlowVariableCandidate } from "./flow-variables";

  interface Props {
    readonly graph: FlowGraph;
    readonly candidates: readonly FlowVariableCandidate[];
    readonly onconfigchange: (
      flowNodeId: string,
      config: Readonly<Record<string, Value>>,
    ) => void;
    readonly onremovenode: (flowNodeId: string) => void;
  }

  let { graph, candidates, onconfigchange, onremovenode }: Props = $props();
  const layout = $derived(createFlowChartLayout(graph));
</script>

<div class="flow-chart-viewport" aria-label={`${graph.name}のフローチャート`}>
  <div
    class="flow-chart"
    style={`width: ${layout.width}px; height: ${layout.height}px;`}
  >
    <svg
      class="flow-chart-edges"
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      aria-hidden="true"
    >
      <defs>
        <marker
          id={`flow-arrow-${graph.id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z"></path>
        </marker>
      </defs>
      {#each layout.edges as edge (edge.id)}
        <path
          class="flow-chart-edge"
          d={edge.path}
          marker-end={`url(#flow-arrow-${graph.id})`}
        ></path>
      {/each}
    </svg>
    {#each layout.nodes as placement (placement.id)}
      {@const node = graph.nodes.find((candidate) => candidate.id === placement.id)!}
      <div
        class="flow-chart-node"
        style={`left: ${placement.x}px; top: ${placement.y}px; width: ${FLOW_NODE_WIDTH}px; height: ${FLOW_NODE_HEIGHT}px;`}
      >
        <FlowNode
          {node}
          variables={graph.variables}
          {candidates}
          onconfigchange={(config) => onconfigchange(node.id, config)}
          onremove={() => onremovenode(node.id)}
        />
      </div>
    {/each}
  </div>
</div>
