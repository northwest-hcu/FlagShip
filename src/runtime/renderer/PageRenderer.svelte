<script lang="ts">
  import type { ProjectDocument } from "../../core/model/project";
  import type {
    ComponentInstance,
    ContentNode,
    ContentTree,
    Spacing,
    UIPage,
  } from "../../core/model/ui";
  import { resolveProjectComponent } from "../components/component-resolver";

  interface Props {
    readonly project: ProjectDocument;
    readonly page: UIPage;
    readonly mode: "canvas" | "preview";
    readonly selectedInstanceId?: string | null;
    readonly dropIndex?: number | null;
    readonly onselect?: (componentInstanceId: string) => void;
    readonly onbegindraginstance?: (
      event: PointerEvent,
      componentInstanceId: string,
    ) => void;
  }

  let {
    project,
    page,
    mode,
    selectedInstanceId = null,
    dropIndex = null,
    onselect = () => undefined,
    onbegindraginstance = () => undefined,
  }: Props = $props();

  function spacingValue(spacing: Spacing | undefined): string | undefined {
    if (spacing === undefined) return undefined;
    if (typeof spacing === "object") return `${spacing.value}${spacing.unit}`;

    return {
      none: "0",
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
    }[spacing];
  }

  function nodeStyle(node: ContentNode): string {
    if (node.type !== "container" || node.layout?.type !== "stack") {
      return "";
    }

    const gap = spacingValue(node.layout.gap);
    const padding = spacingValue(node.layout.padding);

    return [
      `flex-direction: ${node.layout.direction === "vertical" ? "column" : "row"}`,
      gap ? `gap: ${gap}` : "",
      padding ? `padding: ${padding}` : "",
    ].filter(Boolean).join("; ");
  }

</script>

{#snippet renderInstance(instance: ComponentInstance, topLevel = false)}
  {@const component = resolveProjectComponent(
    project,
    instance.componentId,
    instance.componentVersion,
  )}
  {#if component?.contentTree}
    {#if mode === "canvas"}
      <article
        class="canvas-component"
        class:selected-component={selectedInstanceId === instance.id}
        data-component-instance-id={instance.id}
        aria-label={component.name}
      >
        {#if topLevel}
          <button
            type="button"
            class="canvas-drag-grip"
            title="ドラッグして並べ替え"
            aria-label={`${component.name}を並べ替え`}
            onpointerdown={(event) => onbegindraginstance(event, instance.id)}
          >⠿</button>
        {/if}
        <button
          type="button"
          class="component-label"
          onclick={() => onselect(instance.id)}
        >{component.name}</button>
        {@render renderNode(component.contentTree, component.contentTree.rootNodeId)}
      </article>
    {:else}
      <article
        data-component-instance-id={instance.id}
        aria-label={component.name}
      >
        {@render renderNode(component.contentTree, component.contentTree.rootNodeId)}
      </article>
    {/if}
  {:else}
    <p class="render-error" role="alert">
      Component {instance.componentId}@{instance.componentVersion} を表示できません。
    </p>
  {/if}
{/snippet}

{#snippet renderNode(tree: ContentTree, nodeId: string)}
  {@const node = tree.nodes[nodeId]}
  {#if node?.type === "text"}
    <span class="rendered-text">
      {typeof node.value === "string" ? node.value : "[Reference]"}
    </span>
  {:else if node?.type === "container"}
    <div
      class="rendered-container"
      class:stack-layout={node.layout?.type === "stack"}
      class:grid-layout={node.layout?.type === "grid"}
      style={nodeStyle(node)}
    >
      {#each node.children as placement}
        {#if placement.target.type === "content-node"}
          <div data-slot-id={placement.slotId}>
            {@render renderNode(tree, placement.target.nodeId)}
          </div>
        {:else}
          {@const child = tree.componentInstances[
            placement.target.componentInstanceId
          ]}
          {#if child}
            <div data-slot-id={placement.slotId}>
              {@render renderInstance(child)}
            </div>
          {/if}
        {/if}
      {/each}
    </div>
  {/if}
{/snippet}

<div class:preview-surface={mode === "preview"} class="page-surface">
  {#if mode === "canvas" && Object.keys(page.componentInstances).length === 0}
    <div
      class="empty-page-drop"
      class:active-drop={dropIndex === 0}
      role="group"
      aria-label="Componentの配置先"
      data-drop-index="0"
    >Libraryからここへドラッグしてください。</div>
  {:else}
    {#each Object.values(page.componentInstances) as instance, index (instance.id)}
      {#if mode === "canvas"}
        <div
          class="canvas-drop-zone"
          class:active-drop={dropIndex === index}
          aria-hidden="true"
          data-drop-index={index}
        ></div>
      {/if}
      {@render renderInstance(instance, true)}
    {/each}
    {#if mode === "canvas"}
      <div
        class="canvas-drop-zone"
        class:active-drop={
          dropIndex === Object.keys(page.componentInstances).length
        }
        aria-hidden="true"
        data-drop-index={Object.keys(page.componentInstances).length}
      ></div>
    {/if}
  {/if}
</div>
