<script lang="ts">
  import type { ProjectDocument } from "../../core/model/project";
  import type { OverlayTree } from "../../core/model/component";
  import type {
    ComponentInstance,
    ContentNode,
    ContentTree,
    OverlayInstance,
    Spacing,
    UIPage,
  } from "../../core/model/ui";
  import type { LiteralValue } from "../../core/model/value";
  import { resolveProjectComponent } from "../components/component-resolver";
  import { executeUIEventFlows } from "../flow/project-flow-runtime";
  import {
    readRuntimeNodeState,
    writeRuntimeState,
    type RuntimeState,
    type RuntimeStateChange,
  } from "../state/runtime-state";

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
  let runtimeState = $state<RuntimeState>({});

  function setRuntimeState(change: RuntimeStateChange): void {
    if (change.pageId !== page.id) return;
    runtimeState = writeRuntimeState(runtimeState, change);
  }

  function emitClick(
    componentInstancePath: readonly string[],
    localId: string,
  ): void {
    if (mode !== "preview") return;
    void executeUIEventFlows(
      project,
      { pageId: page.id, componentInstancePath, localId, event: "click" },
      { setState: setRuntimeState },
    );
  }

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
    instancePath: readonly string[],
  ): Readonly<Record<string, LiteralValue>> {
    const value = stateValue(instance, node);
    const initial = typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ? value as Readonly<Record<string, LiteralValue>>
      : {};
    return {
      ...initial,
      ...readRuntimeNodeState(runtimeState, {
        pageId: page.id,
        componentInstancePath: instancePath,
        localId: node.id,
      }),
    };
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
    readonly path: readonly string[];
  }[] {
    return Object.values(currentPage.componentInstances).flatMap(
      (instance, pageIndex) => {
        const component = resolveProjectComponent(
          project,
          instance.componentId,
          instance.componentVersion,
        );
        return component?.contentTree
          ? [{ instance, pageIndex, path: [instance.id] }]
          : [];
      },
    );
  }

</script>

{#snippet renderTreeInstance(
  instance: ComponentInstance,
  componentName: string,
  tree: ContentTree,
  instancePath: readonly string[],
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
      {@render renderNode(tree, tree.rootNodeId, instance, instancePath)}
    </div>
  {:else}
    <article
      class:overlay-component={overlay}
      data-component-instance-id={instance.id}
      aria-label={componentName}
    >
      {@render renderNode(tree, tree.rootNodeId, instance, instancePath)}
    </article>
  {/if}
{/snippet}

{#snippet renderContentInstance(
  instance: ComponentInstance,
  instancePath: readonly string[],
  topLevel = false,
)}
  {@const component = resolveProjectComponent(
    project,
    instance.componentId,
    instance.componentVersion,
  )}
  {#if instance.visible !== false}
    {#if component?.contentTree}
      {@render renderTreeInstance(
        instance,
        component.name,
        component.contentTree,
        instancePath,
        topLevel,
        false,
      )}
    {:else if component === undefined}
      <p class="render-error" role="alert">
        Component {instance.componentId}@{instance.componentVersion} を表示できません。
      </p>
    {/if}
  {/if}
{/snippet}

{#snippet renderOverlayInstance(
  overlayInstance: OverlayInstance,
  componentName: string,
  overlay: OverlayTree,
)}
  {@const instance = overlayInstance.componentInstance}
  {@const rootNode = overlay.contentTree.nodes[overlay.contentTree.rootNodeId]}
  {@const overlayOpen = rootNode === undefined
    ? false
    : booleanProperty(stateRecord(instance, rootNode, [instance.id]), "open")}
  {#if overlayInstance.visible !== false &&
      instance.visible !== false &&
      (mode !== "preview" || overlayOpen)}
    <div
      class="overlay-instance"
      class:content-blocking={overlayInstance.contentBlock}
      data-overlay-alignment={overlayInstance.alignment}
      data-overlay-instance-id={overlayInstance.id}
    >
      {#if overlayInstance.contentBlock}
        <div class="overlay-backdrop" aria-hidden="true"></div>
      {/if}
      <div class="overlay-position">
        {@render renderTreeInstance(
          instance,
          componentName,
          overlay.contentTree,
          [instance.id],
          true,
          true,
        )}
      </div>
    </div>
  {/if}
{/snippet}

{#snippet renderSlot(
  tree: ContentTree,
  node: ContentNode,
  instance: ComponentInstance,
  instancePath: readonly string[],
  slotId: string,
)}
  {#each node.children.filter((child) => child.slotId === slotId) as placement}
    {#if placement.target.type === "content-node"}
      {@render renderNode(tree, placement.target.nodeId, instance, instancePath)}
    {:else}
      {@const child = tree.componentInstances[
        placement.target.componentInstanceId
      ]}
      {#if child}
        {@render renderContentInstance(child, [...instancePath, child.id])}
      {/if}
    {/if}
  {/each}
  {#each (instance.children ?? []).filter(
    (placement) => placement.parentContentNodeId === node.id &&
      placement.slotId === slotId
  ) as placement (placement.instance.id)}
    {@render renderContentInstance(
      placement.instance,
      [...instancePath, placement.instance.id],
    )}
  {/each}
{/snippet}

{#snippet renderNode(
  tree: ContentTree,
  nodeId: string,
  instance: ComponentInstance,
  instancePath: readonly string[],
)}
  {@const node = tree.nodes[nodeId]}
  {@const currentState = node === undefined
    ? {}
    : stateRecord(instance, node, instancePath)}
  {#if node?.visible !== false && node?.type === "text"}
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
      onclick={() => emitClick(instancePath, node.id)}
    >
      {#if (instance.children ?? []).some(
        (placement) => placement.parentContentNodeId === node.id &&
          placement.slotId === "content"
      ) || node.children.some((child) => child.slotId === "content")}
        {@render renderSlot(tree, node, instance, instancePath, "content")}
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
          {@render renderSlot(tree, node, instance, instancePath, slot.id)}
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
        {@render renderContentInstance(entry.instance, entry.path, true)}
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
    {#each Object.values(page.overlayInstances ?? {}) as overlayInstance (overlayInstance.id)}
      {@const instance = overlayInstance.componentInstance}
      {@const component = resolveProjectComponent(
        project,
        instance.componentId,
        instance.componentVersion,
      )}
      {#if component}
        {@const overlay = component.overlayTrees[overlayInstance.overlayTreeId]}
        {#if overlay}
          {@render renderOverlayInstance(
            overlayInstance,
            component.name,
            overlay,
          )}
        {/if}
      {/if}
    {/each}
  </div>
</div>
