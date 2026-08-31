<script lang="ts">
  import type { ProjectDocument } from "../core/model/project";
  import type { UIPage } from "../core/model/ui";
  import { componentLibraryCatalog } from "../library/component-catalog";
  import { resolveProjectComponent } from "../runtime/components/component-resolver";
  import PageRenderer from "../runtime/renderer/PageRenderer.svelte";
  import ComponentSampleModal from "./ComponentSampleModal.svelte";
  import FlowPanel from "./FlowPanel.svelte";
  import InspectorPanel from "./InspectorPanel.svelte";
  import {
    createContentSurfaceLayers,
    createOverlaySurfaceLayers,
    layerSlotKey,
  } from "./layer-tree-model";
  import LayersTree from "./LayersTree.svelte";
  import LibraryPanel from "./LibraryPanel.svelte";
  import type { SelectableComponent } from "./editor-project";
  import {
    addComponentToSlot,
    createEditorProject,
    findPageComponentInstance,
    listSelectableComponents,
    movePageComponent,
    placeComponentOnPage,
    removePageComponent,
    toggleComponentInstanceVisibility,
    updateComponentInstanceState,
  } from "./editor-project";
  import { replaceStateField } from "./inspector-model";
  import {
    findOverlayInstance,
    moveOverlayOnPage,
    placeOverlayOnPage,
    removeOverlayComponent,
    updateOverlaySettings,
  } from "./overlay-project";
  import {
    applyKeyboardResize,
    beginPointerResize,
    clamp,
  } from "./pointer-resize";
  interface ComponentSample {
    readonly componentName: string;
    readonly libraryName: string;
    readonly project: ProjectDocument;
    readonly page: UIPage;
  }
  type DragSource =
    | { readonly type: "library"; readonly selection: SelectableComponent }
    | { readonly type: "instance"; readonly componentInstanceId: string };

  type DropTarget =
    | {
        readonly type: "page";
        readonly surface: "content" | "overlay";
        readonly index: number;
      }
    | {
        readonly type: "slot";
        readonly parentInstanceId: string;
        readonly parentContentNodeId: string;
        readonly slotId: string;
      };
  const PAGE_ID = "ui-page-main";
  const HANDLE_SIZE = 6;
  const KEYBOARD_STEP = 16;
  const MIN_LAYERS_WIDTH = 220;
  const MIN_MAIN_WIDTH = 480;
  const MIN_CANVAS_WIDTH = 240;
  const MIN_FLOW_WIDTH = 192;
  const MIN_TOP_HEIGHT = 160;
  const MIN_INSPECTOR_HEIGHT = 128;
  let editorBody: HTMLDivElement;
  let mainArea: HTMLDivElement;
  let canvasFlow: HTMLDivElement;

  let layersWidth = $state(288);
  let flowWidth = $state(288);
  let inspectorHeight = $state(192);
  let project = $state(createEditorProject());
  let selectedInstanceId = $state<string | null>(null);
  let mode = $state<"canvas" | "preview">("canvas");
  let sample = $state<ComponentSample | null>(null);
  let dragSource = $state<DragSource | null>(null);
  let dragLabel = $state("");
  let dragPosition = $state({ x: 0, y: 0 });
  let dropTarget = $state<DropTarget | null>(null);
  const page = $derived(project.ui.pages[PAGE_ID]);
  const selectableComponents = $derived(
    listSelectableComponents(project, componentLibraryCatalog),
  );
  const pageDropIndex = $derived(
    dropTarget?.type === "page" ? dropTarget.index : null,
  );
  const pageDropSurface = $derived(
    dropTarget?.type === "page" ? dropTarget.surface : null,
  );
  const canvasDropIndex = $derived(
    pageDropSurface === "content" ? pageDropIndex : null,
  );
  const activeSlotKey = $derived(
    dropTarget?.type === "slot"
      ? layerSlotKey(
          dropTarget.parentInstanceId,
          dropTarget.parentContentNodeId,
          dropTarget.slotId,
        )
      : null,
  );
  const contentLayerItems = $derived(
    createContentSurfaceLayers(project, page),
  );
  const overlayLayerItems = $derived(
    createOverlaySurfaceLayers(project, page),
  );
  const layerItems = $derived([...contentLayerItems, ...overlayLayerItems]);
  const selectedInstance = $derived(
    selectedInstanceId === null
      ? undefined
      : findPageComponentInstance(project, PAGE_ID, selectedInstanceId),
  );
  const selectedComponent = $derived(
    selectedInstance === undefined
      ? undefined
      : resolveProjectComponent(
          project,
          selectedInstance.componentId,
          selectedInstance.componentVersion,
        ),
  );
  const selectedOverlay = $derived(
    selectedInstanceId === null
      ? undefined
      : findOverlayInstance(project, PAGE_ID, selectedInstanceId),
  );

  function openSample(selection: SelectableComponent): void {
    const emptyProject: ProjectDocument = {
      ...project,
      ui: {
        ...project.ui,
        pages: {
          ...project.ui.pages,
          [PAGE_ID]: {
            ...page,
            componentInstances: {},
            overlayInstances: {},
          },
        },
      },
    };
    const sampleProject = selection.component.contentTree
      ? placeComponentOnPage(emptyProject, PAGE_ID, selection).project
      : placeOverlayOnPage(emptyProject, PAGE_ID, selection).project;

    sample = {
      componentName: selection.component.name,
      libraryName: selection.libraryName,
      project: sampleProject,
      page: sampleProject.ui.pages[PAGE_ID],
    };
  }

  function beginPointerDrag(
    event: PointerEvent,
    source: DragSource,
    label: string,
  ): void {
    if (!event.isPrimary) return;
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    dragSource = source;
    dragLabel = label;
    dragPosition = { x: event.clientX, y: event.clientY };
    mode = "canvas";
    handle.setPointerCapture(event.pointerId);
    let finished = false;

    function update(moveEvent: MouseEvent): void {
      dragPosition = { x: moveEvent.clientX, y: moveEvent.clientY };
      const target = document.elementFromPoint(
        moveEvent.clientX,
        moveEvent.clientY,
      )?.closest<HTMLElement>("[data-drop-kind]");
      if (target?.dataset.dropKind === "page") {
        const index = target.dataset.dropIndex;
        const surface = target.dataset.dropSurface;
        dropTarget = index === undefined ||
            (surface !== "content" && surface !== "overlay") ||
            !supportsSurface(source, surface)
          ? null
          : { type: "page", surface, index: Number(index) };
      } else if (target?.dataset.dropKind === "slot" &&
          source.type === "library" &&
          source.selection.component.contentTree !== null) {
        const parentInstanceId = target.dataset.parentInstanceId;
        const parentContentNodeId = target.dataset.parentContentNodeId;
        const slotId = target.dataset.slotId;
        dropTarget = parentInstanceId && parentContentNodeId && slotId
          ? {
              type: "slot",
              parentInstanceId,
              parentContentNodeId,
              slotId,
            }
          : null;
      } else {
        dropTarget = null;
      }
    }

    function cleanup(): void {
      window.removeEventListener("pointermove", update);
      window.removeEventListener("mousemove", update);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("mouseup", finish);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
      if (handle.hasPointerCapture(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId);
      }
    }

    function finish(upEvent: MouseEvent): void {
      if (finished) return;
      finished = true;
      update(upEvent);
      const target = dropTarget;
      cleanup();
      dragSource = null;
      dropTarget = null;
      if (target !== null) applyDrop(source, target);
    }

    function cancel(): void {
      if (finished) return;
      finished = true;
      cleanup();
      dragSource = null;
      dropTarget = null;
    }

    window.addEventListener("pointermove", update);
    window.addEventListener("mousemove", update);
    window.addEventListener("pointerup", finish);
    window.addEventListener("mouseup", finish);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
  }

  function supportsSurface(
    source: DragSource,
    surface: "content" | "overlay",
  ): boolean {
    if (source.type === "instance") {
      const inOverlay = findOverlayInstance(
        project,
        PAGE_ID,
        source.componentInstanceId,
      ) !== undefined;
      return surface === (inOverlay ? "overlay" : "content");
    }
    const component = source.selection.component;
    return surface === "content"
      ? component?.contentTree !== null && component !== undefined
      : component !== undefined && Object.keys(component.overlayTrees).length > 0;
  }

  function applyDrop(source: DragSource, target: DropTarget): void {
    if (source.type === "library" && target.type === "slot") {
      const result = addComponentToSlot(
        project,
        PAGE_ID,
        target.parentInstanceId,
        target.parentContentNodeId,
        target.slotId,
        source.selection,
      );
      project = result.project;
      selectedInstanceId = result.componentInstanceId;
    } else if (source.type === "library" && target.type === "page") {
      const result = target.surface === "content"
        ? placeComponentOnPage(
            project,
            PAGE_ID,
            source.selection,
            target.index,
          )
        : placeOverlayOnPage(
            project,
            PAGE_ID,
            source.selection,
            target.index,
          );
      project = result.project;
      selectedInstanceId = result.componentInstanceId;
    } else if (source.type === "instance" && target.type === "page") {
      project = target.surface === "content"
        ? movePageComponent(
            project,
            PAGE_ID,
            source.componentInstanceId,
            target.index,
          )
        : moveOverlayOnPage(
            project,
            PAGE_ID,
            source.componentInstanceId,
            target.index,
          );
      selectedInstanceId = source.componentInstanceId;
    }
  }

  function editInstance(componentInstanceId: string): void {
    selectedInstanceId = componentInstanceId;
    mode = "canvas";
  }

  function removeInstance(componentInstanceId: string): void {
    const next = removePageComponent(project, PAGE_ID, componentInstanceId);
    project = next === project
      ? removeOverlayComponent(project, PAGE_ID, componentInstanceId)
      : next;
    if (selectedInstanceId === componentInstanceId) {
      selectedInstanceId = null;
    }
  }

  function changeInstanceState(
    contentNodeId: string,
    key: string,
    value: string | boolean,
  ): void {
    if (!selectedInstance || !selectedComponent) return;
    project = updateComponentInstanceState(
      project,
      PAGE_ID,
      selectedInstance.id,
      contentNodeId,
      replaceStateField(
        selectedComponent,
        selectedInstance,
        contentNodeId,
        key,
        value,
      ),
    );
  }

  function resizeLayers(event: PointerEvent): void {
    const bounds = editorBody.getBoundingClientRect();
    layersWidth = clamp(
      event.clientX - bounds.left,
      MIN_LAYERS_WIDTH,
      bounds.width - MIN_MAIN_WIDTH - HANDLE_SIZE,
    );
  }

  function resizeCanvasFlow(event: PointerEvent): void {
    const bounds = canvasFlow.getBoundingClientRect();
    flowWidth = clamp(
      bounds.right - event.clientX,
      MIN_FLOW_WIDTH,
      bounds.width - MIN_CANVAS_WIDTH - HANDLE_SIZE,
    );
  }

  function resizeInspector(event: PointerEvent): void {
    const bounds = mainArea.getBoundingClientRect();
    inspectorHeight = clamp(
      bounds.bottom - event.clientY,
      MIN_INSPECTOR_HEIGHT,
      bounds.height - MIN_TOP_HEIGHT - HANDLE_SIZE,
    );
  }

</script>

<main class="editor-shell" style={`--layers-width: ${layersWidth}px; --flow-width: ${flowWidth}px; --inspector-height: ${inspectorHeight}px;`}>
  <header class="editor-header">
    <div class="project-title"><h1>FlagShip</h1><span>{project.meta.name}</span></div>
    <nav class="mode-switcher" aria-label="表示モード">
      <button type="button" class:active={mode === "canvas"} aria-pressed={mode === "canvas"} onclick={() => mode = "canvas"}>編集</button>
      <button type="button" class:active={mode === "preview"} aria-pressed={mode === "preview"} onclick={() => mode = "preview"}>プレビュー</button>
    </nav>
  </header>

  <div class="editor-body" bind:this={editorBody}>
    <aside id="layers-panel" class="panel layers-panel" aria-label="Library and Layers">
      <LibraryPanel
        components={selectableComponents}
        onpreview={openSample}
        onbegindrag={(event, selection) => beginPointerDrag(
          event,
          { type: "library", selection },
          selection.component.name,
        )}
      />
      <LayersTree
        pageName={page.name}
        contentItems={contentLayerItems}
        overlayItems={overlayLayerItems}
        selectedId={selectedInstanceId}
        {pageDropIndex}
        {pageDropSurface}
        {activeSlotKey}
        onbegindrag={(event, componentInstanceId) => beginPointerDrag(
          event,
          { type: "instance", componentInstanceId },
          layerItems.find((item) => item.id === componentInstanceId)?.name ?? "Component",
        )}
        onedit={editInstance}
        ontogglevisibility={(componentInstanceId) => project = toggleComponentInstanceVisibility(project, PAGE_ID, componentInstanceId)}
        onremove={removeInstance}
      />
    </aside>
    <button type="button" class="resize-handle vertical-resize-handle" aria-label="LibraryとLayersの横幅を変更" aria-controls="layers-panel" onpointerdown={(event) => beginPointerResize(event, resizeLayers, "col-resize")} onkeydown={(event) => applyKeyboardResize(event, "ArrowLeft", "ArrowRight", layersWidth, MIN_LAYERS_WIDTH, editorBody.clientWidth - MIN_MAIN_WIDTH - HANDLE_SIZE, (value) => layersWidth = value, KEYBOARD_STEP)}></button>
    <div class="main-area" bind:this={mainArea}>
      <div class="canvas-flow" bind:this={canvasFlow}>
        <section id="canvas-panel" class:preview-panel={mode === "preview"} class="panel canvas-panel" aria-labelledby="canvas-heading">
          <h2 id="canvas-heading">{mode === "canvas" ? "Canvas" : "Preview"}</h2>
          <div class="canvas-viewport">
            <PageRenderer
              {project}
              {page}
              {mode}
              {selectedInstanceId}
              dropIndex={canvasDropIndex}
              onselect={editInstance}
              onbegindraginstance={(event, componentInstanceId) => beginPointerDrag(
                event,
                { type: "instance", componentInstanceId },
                layerItems.find((item) => item.id === componentInstanceId)?.name ?? "Component",
              )}
            />
          </div>
        </section>

        <button type="button" class="resize-handle vertical-resize-handle" aria-label="CanvasとFlowの横幅を変更" aria-controls="canvas-panel flow-panel" onpointerdown={(event) => beginPointerResize(event, resizeCanvasFlow, "col-resize")} onkeydown={(event) => applyKeyboardResize(event, "ArrowRight", "ArrowLeft", flowWidth, MIN_FLOW_WIDTH, canvasFlow.clientWidth - MIN_CANVAS_WIDTH - HANDLE_SIZE, (value) => flowWidth = value, KEYBOARD_STEP)}></button>
        <FlowPanel bind:project pageId={PAGE_ID} />
      </div>

      <button type="button" class="resize-handle horizontal-resize-handle" aria-label="Inspectorの高さを変更" aria-controls="inspector-panel" onpointerdown={(event) => beginPointerResize(event, resizeInspector, "row-resize")} onkeydown={(event) => applyKeyboardResize(event, "ArrowDown", "ArrowUp", inspectorHeight, MIN_INSPECTOR_HEIGHT, mainArea.clientHeight - MIN_TOP_HEIGHT - HANDLE_SIZE, (value) => inspectorHeight = value, KEYBOARD_STEP)}></button>
      <InspectorPanel
        component={selectedComponent}
        instance={selectedInstance}
        overlay={selectedOverlay}
        onstatechange={changeInstanceState}
        onoverlaychange={(settings) => {
          if (selectedOverlay) {
            project = updateOverlaySettings(
              project,
              PAGE_ID,
              selectedOverlay.id,
              settings,
            );
          }
        }}
      />
    </div>
  </div>
</main>

{#if sample}
  <ComponentSampleModal {...sample} onclose={() => sample = null} />
{/if}

{#if dragSource}
  <div
    class="drag-preview"
    style={`left: ${dragPosition.x + 12}px; top: ${dragPosition.y + 12}px;`}
  >⠿ {dragLabel}</div>
{/if}
