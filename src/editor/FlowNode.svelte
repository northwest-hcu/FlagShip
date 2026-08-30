<script lang="ts">
  import type { FlowNode as FlowNodeModel } from "../core/model/flow";

  interface Props {
    readonly node: FlowNodeModel;
    readonly onremove: () => void;
  }

  let { node, onremove }: Props = $props();
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
</article>
