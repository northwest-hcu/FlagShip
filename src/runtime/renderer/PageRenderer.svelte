<script lang="ts">
  import type { ProjectDocument } from "../../core/model/project";
  import type { OverlayTree } from "../../core/model/component";
  import type {
    ComponentInstance,
    ContentNode,
    ContentTree,
    Spacing,
    UIPage,
  } from "../../core/model/ui";
  import type { LiteralValue } from "../../core/model/value";
  import { resolveProjectComponent } from "../components/component-resolver";

  interface Props {
    readonly project: ProjectDocument;
    readonly page: UIPage;
    readonly mode: "canvas" | "preview" | "sample";
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
    if ((node.type !== "container" && node.type !== "button") ||
        node.layout?.type !== "stack") {
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

  function stateValue(
    instance: ComponentInstance,
    node: ContentNode,
  ): LiteralValue | undefined {
    const override = instance.state?.[node.id];
    if (override !== undefined) return override;
    return "initialValue" in node.state
      ? node.state.initialValue
      : undefined;
  }

  function stateRecord(
    instance: ComponentInstance,
    node: ContentNode,
  ): Readonly<Record<string, LiteralValue>> {
    const value = stateValue(instance, node);
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? value as Readonly<Record<string, LiteralValue>>
      : {};
  }

  function stringProperty(
    state: Readonly<Record<string, LiteralValue>>,
    key: string,
    fallback = "",
  ): string {
    return typeof state[key] === "string" ? state[key] : fallback;
  }

  function booleanProperty(
    state: Readonly<Record<string, LiteralValue>>,
    key: string,
  ): boolean {
    return state[key] === true;
  }

  function iconGlyph(name: string): string {
    return { star: "★", close: "×", menu: "☰", check: "✓" }[name] ?? "◆";
  }

  function selectInstance(event: Event, componentInstanceId: string): void {
    event.stopPropagation();
    onselect(componentInstanceId);
  }

  function selectInstanceWithKeyboard(
    event: KeyboardEvent,
    componentInstanceId: string,
  ): void {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    selectInstance(event, componentInstanceId);
  }

  function contentInstances(currentPage: UIPage): readonly {
    readonly instance: ComponentInstance;
    readonly pageIndex: number;
  }[] {
    return Object.values(currentPage.componentInstances).flatMap(
      (instance, pageIndex) => {
        const component = resolveProjectComponent(
          project,
          instance.componentId,
          instance.componentVersion,
        );
        return component?.contentTree ? [{ instance, pageIndex }] : [];
      },
    );
  }

  function allInstances(currentPage: UIPage): readonly {
    readonly instance: ComponentInstance;
    readonly topLevel: boolean;
  }[] {
    return Object.values(currentPage.componentInstances).flatMap((instance) => [
      { instance, topLevel: true },
      ...nestedInstances(instance),
    ]);
  }

  function nestedInstances(parent: ComponentInstance): readonly {
    readonly instance: ComponentInstance;
    readonly topLevel: false;
  }[] {
    return (parent.children ?? []).flatMap(({ instance }) => [
      { instance, topLevel: false as const },
      ...nestedInstances(instance),
    ]);
  }

</script>

{#snippet renderTreeInstance(
  instance: ComponentInstance,
  componentName: string,
  tree: ContentTree,
  topLevel: boolean,
  overlay: boolean,
)}
  {#if mode === "canvas"}
    <div
      class="canvas-component"
      class:overlay-component={overlay}
      class:selected-component={selectedInstanceId === instance.id}
      data-component-instance-id={instance.id}
      aria-label={componentName}
      role="button"
      tabindex="0"
      onclick={(event) => selectInstance(event, instance.id)}
      onkeydown={(event) => selectInstanceWithKeyboard(event, instance.id)}
    >
      {#if topLevel}
        <button
          type="button"
          class="canvas-drag-grip"
          title="ドラッグして並べ替え"
          aria-label={`${componentName}を並べ替え`}
          onpointerdown={(event) => onbegindraginstance(event, instance.id)}
        >⠿</button>
      {/if}
      <button
        type="button"
        class="component-label"
        onclick={() => onselect(instance.id)}
      >{componentName}</button>
      {@render renderNode(tree, tree.rootNodeId, instance)}
    </div>
  {:else}
    <article
      class:overlay-component={overlay}
      data-component-instance-id={instance.id}
      aria-label={componentName}
    >
      {@render renderNode(tree, tree.rootNodeId, instance)}
    </article>
  {/if}
{/snippet}

{#snippet renderContentInstance(instance: ComponentInstance, topLevel = false)}
  {@const component = resolveProjectComponent(
    project,
    instance.componentId,
    instance.componentVersion,
  )}
  {#if component?.contentTree}
    {@render renderTreeInstance(
      instance,
      component.name,
      component.contentTree,
      topLevel,
      false,
    )}
  {:else if component === undefined}
    <p class="render-error" role="alert">
      Component {instance.componentId}@{instance.componentVersion} を表示できません。
    </p>
  {/if}
{/snippet}

{#snippet renderOverlayInstance(
  instance: ComponentInstance,
  componentName: string,
  overlay: OverlayTree,
  topLevel: boolean,
)}
  {@const rootNode = overlay.contentTree.nodes[overlay.contentTree.rootNodeId]}
  {@const overlayOpen = rootNode === undefined
    ? false
    : booleanProperty(stateRecord(instance, rootNode), "open")}
  {#if mode !== "preview" || overlayOpen}
    {@render renderTreeInstance(
      instance,
      componentName === overlay.name
        ? componentName
        : `${componentName} / ${overlay.name}`,
      overlay.contentTree,
      topLevel,
      true,
    )}
  {/if}
{/snippet}

{#snippet renderSlot(
  tree: ContentTree,
  node: ContentNode,
  instance: ComponentInstance,
  slotId: string,
)}
  {#each node.children.filter((child) => child.slotId === slotId) as placement}
    {#if placement.target.type === "content-node"}
      {@render renderNode(tree, placement.target.nodeId, instance)}
    {:else}
      {@const child = tree.componentInstances[
        placement.target.componentInstanceId
      ]}
      {#if child}{@render renderContentInstance(child)}{/if}
    {/if}
  {/each}
  {#each (instance.children ?? []).filter(
    (placement) => placement.parentContentNodeId === node.id &&
      placement.slotId === slotId
  ) as placement (placement.instance.id)}
    {@render renderContentInstance(placement.instance)}
  {/each}
{/snippet}

{#snippet renderNode(
  tree: ContentTree,
  nodeId: string,
  instance: ComponentInstance,
)}
  {@const node = tree.nodes[nodeId]}
  {@const currentState = node === undefined ? {} : stateRecord(instance, node)}
  {#if node?.type === "text"}
    <span class="rendered-text">
      {stringProperty(
        currentState,
        "text",
        typeof node.value === "string" ? node.value : "[Reference]",
      )}
    </span>
  {:else if node?.type === "input"}
    <input
      class="rendered-input"
      value={stringProperty(currentState, "value")}
      placeholder={stringProperty(currentState, "placeholder")}
      disabled={booleanProperty(currentState, "disabled")}
    />
  {:else if node?.type === "image"}
    <img
      class="rendered-image"
      src={stringProperty(currentState, "src")}
      alt={stringProperty(currentState, "alt")}
    />
  {:else if node?.type === "icon"}
    <span
      class="rendered-icon"
      role="img"
      aria-label={stringProperty(currentState, "label", "Icon")}
    >{iconGlyph(stringProperty(currentState, "name"))}</span>
  {:else if node?.type === "button"}
    <button
      type="button"
      class="rendered-button"
      disabled={booleanProperty(currentState, "disabled")}
    >
      {#if (instance.children ?? []).some(
        (placement) => placement.parentContentNodeId === node.id &&
          placement.slotId === "content"
      ) || node.children.some((child) => child.slotId === "content")}
        {@render renderSlot(tree, node, instance, "content")}
      {:else}
        {stringProperty(currentState, "label", "Button")}
      {/if}
    </button>
  {:else if node?.type === "container"}
    <div
      class="rendered-container"
      class:stack-layout={node.layout?.type === "stack"}
      class:grid-layout={node.layout?.type === "grid"}
      style={nodeStyle(node)}
    >
      {#each node.slots as slot (slot.id)}
        <div class="rendered-slot" data-slot-id={slot.id}>
          {@render renderSlot(tree, node, instance, slot.id)}
        </div>
      {/each}
    </div>
  {/if}
{/snippet}

<div class:preview-surface={mode === "preview"} class="page-surface">
  <div class="content-surface" data-ui-surface="content">
    {#if mode === "canvas" && contentInstances(page).length === 0}
      <div
        class="empty-page-drop"
        class:active-drop={dropIndex === 0}
        role="group"
        aria-label="Content Surfaceの配置先"
        data-drop-kind="page"
        data-drop-surface="content"
        data-drop-index="0"
      >LibraryからContent Componentをドラッグしてください。</div>
    {:else}
      {#each contentInstances(page) as entry (entry.instance.id)}
        {#if mode === "canvas"}
          <div
            class="canvas-drop-zone"
            class:active-drop={dropIndex === entry.pageIndex}
            aria-hidden="true"
            data-drop-kind="page"
            data-drop-surface="content"
            data-drop-index={entry.pageIndex}
          ></div>
        {/if}
        {@render renderContentInstance(entry.instance, true)}
      {/each}
      {#if mode === "canvas"}
        {@const lastIndex = contentInstances(page).at(-1)?.pageIndex ?? -1}
        <div
          class="canvas-drop-zone"
          class:active-drop={dropIndex === lastIndex + 1}
          aria-hidden="true"
          data-drop-kind="page"
          data-drop-surface="content"
          data-drop-index={lastIndex + 1}
        ></div>
      {/if}
    {/if}
  </div>
  <div class="overlay-surface" data-ui-surface="overlay">
    {#each allInstances(page) as entry (`${entry.instance.id}:overlays`)}
      {@const component = resolveProjectComponent(
        project,
        entry.instance.componentId,
        entry.instance.componentVersion,
      )}
      {#if component}
        {#each Object.values(component.overlayTrees) as overlay (overlay.id)}
          {@render renderOverlayInstance(
            entry.instance,
            component.name,
            overlay,
            entry.topLevel,
          )}
        {/each}
      {/if}
    {/each}
  </div>
</div>
