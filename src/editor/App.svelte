<script lang="ts">
  import CanvasNodes from "./CanvasNodes.svelte";
  import WidgetTree from "./WidgetTree.svelte";
  import DetailsPane from "./DetailsPane.svelte";
  import { componentBreadcrumbs } from "./component-breadcrumbs";
  import { colorCss } from "./colors";
  import ComponentView from "./components/ComponentView.svelte";
  import "./components/components.css";
  import "./editor-view.css";
  import { COMPONENT_CATALOG, createComponent, createPage, displayName, slotTypeLabel, type ComponentKind, type ComponentNode, type Pages, type PageSlot, type WidgetNode } from "./component-model";
  import { canDropInPages, dropDirection, findComponent, placeInPages, removeComponent, replaceComponent, type DragSource, type DropTarget } from "./scene";
  import { applyKeyboardResize, beginPointerResize, clamp } from "./pointer-resize";
  const HANDLE_SIZE = 6;
  const MIN_TREE_WIDTH = 240;
  const MIN_CANVAS_WIDTH = 480;
  let editorBody: HTMLDivElement;
  let treeWidth = $state(304);
  let pages = $state<Pages>([createPage(1)]);
  let activePageId = $state("page-1");
  let activeRoot = $state<PageSlot>("context");
  let selectedId = $state<string | null>(null);
  let preview = $state(false);
  let detailsOpen = $state(false);
  let collapsedPages = $state<Record<string, boolean>>({});
  let expandedRoots = $state<Record<string, boolean>>({ "page-1:context": true });
  let dragSource = $state<DragSource | null>(null);
  let dropTarget = $state<DropTarget | null>(null);
  let status = $state("");
  let sequence = 0;
  let pageSequence = 1;
  const activePage = $derived(pages.find((page) => page.id === activePageId)!);
  const selected = $derived(selectedId === activePage.id ? activePage : selectedId ? findComponent(activePage.fields[activeRoot].value, selectedId) : undefined);
  const detailsVisible = $derived(detailsOpen && !!selected && !preview);
  const breadcrumbs = $derived(selectedId ? componentBreadcrumbs(activePage, selectedId) : []);

  function clearDrag(): void { dragSource = null; dropTarget = null; }
  function switchRoot(pageId: string, root: PageSlot): void {
    expandedRoots[pageId + ":" + root] = true;
    activePageId = pageId; activeRoot = root; selectedId = null; detailsOpen = false; clearDrag();
  }
  function selectComponent(id: string, pageId = activePageId, root = activeRoot): void {
    if (preview) return;
    const page = pages.find((item) => item.id === pageId);
    if (!page) return;
    let selectedRoot = root;
    if (id !== page.id && !findComponent(page.fields[root].value, id)) {
      selectedRoot = root === "context" ? "overlay" : "context";
      if (!findComponent(page.fields[selectedRoot].value, id)) return;
    }
    activePageId = pageId; activeRoot = selectedRoot; selectedId = id; detailsOpen = true;
  }
  function updateComponent(node: ComponentNode): void {
    pages = pages.map((page) => {
      if (page.id === node.id && node.kind === "page") return node;
      if (node.kind === "page") return page;
      const root = findComponent(page.fields.context.value, node.id) ? "context" : findComponent(page.fields.overlay.value, node.id) ? "overlay" : undefined;
      return root ? { ...page, fields: { ...page.fields, [root]: { ...page.fields[root], value: replaceComponent(page.fields[root].value, node) } } } : page;
    });
  }
  function addPage(): void {
    const page = createPage(++pageSequence);
    pages = [...pages, page]; switchRoot(page.id, "context");
    status = displayName(page) + "を追加しました。";
  }
  function startDrag(event: DragEvent, source: DragSource): void {
    if (preview || !event.dataTransfer) return;
    event.stopPropagation(); dragSource = source;
    event.dataTransfer.setData("application/x-flagship-component", JSON.stringify(source));
    event.dataTransfer.effectAllowed = source.type === "library" ? "copy" : "move";
  }
  function startInstanceDrag(event: DragEvent, node: WidgetNode, pageId = activePageId, root = activeRoot): void {
    startDrag(event, { type: "instance", pageId, root, id: node.id });
  }
  function hover(event: DragEvent, target: DropTarget): void {
    if (preview || !dragSource) return;
    event.stopPropagation();
    if (!canDropInPages(pages, dragSource, target)) {
      dropTarget = null;
      if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
      return;
    }
    event.preventDefault(); dropTarget = target;
    if (event.dataTransfer) event.dataTransfer.dropEffect = dragSource.type === "library" ? "copy" : "move";
  }
  function hoverObject(event: DragEvent, node: WidgetNode): void {
    const element = event.currentTarget as HTMLElement;
    const bounds = element.getBoundingClientRect();
    // 内容にフィットしたコンテナでは中央に子があるため、子の中央へのドロップも親の内側として扱う。
    if (node.kind !== "container" && dropDirection(event.clientX, event.clientY, bounds, true) === "inside") {
      const parent = element.parentElement?.closest<HTMLElement>('.scene-object[data-kind="container"]');
      if (parent && dropDirection(event.clientX, event.clientY, parent.getBoundingClientRect(), true) === "inside") {
        hover(event, { pageId: activePageId, root: activeRoot, id: parent.dataset.objectId!, direction: "inside" });
        return;
      }
    }
    hover(event, { pageId: activePageId, root: activeRoot, id: node.id,
      direction: dropDirection(event.clientX, event.clientY, bounds, node.kind === "container") });
  }
  function hoverTreeNode(event: DragEvent, node: WidgetNode, pageId: string, root: PageSlot): void {
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    hover(event, { pageId, root, id: node.id, orderOnly: true,
      direction: event.clientY < bounds.top + bounds.height / 2 ? "above" : "below" });
  }
  function applyDrop(target: DropTarget): void {
    if (!dragSource || !canDropInPages(pages, dragSource, target)) return;
    const source = dragSource;
    const origin = source.type === "instance" ? pages.find((page) => page.id === source.pageId) : undefined;
    const node = source.type === "library" ? createComponent(source.kind, ++sequence)
      : findComponent(origin!.fields[source.root].value, source.id)!;
    const next = placeInPages(pages, node, source, target);
    if (next === pages) return;
    pages = next; activePageId = target.pageId!; activeRoot = target.root; selectedId = node.id; detailsOpen = false;
    expandedRoots[activePageId + ":" + activeRoot] = true;
    collapsedPages[activePageId] = false;
    status = displayName(node) + "を" + (target.slotKey ?? activeRoot) + "に配置しました。";
  }
  function drop(event: DragEvent): void {
    if (preview || !dragSource) return;
    event.preventDefault(); event.stopPropagation();
    if (dropTarget) applyDrop(dropTarget);
    clearDrag();
  }
  function addComponent(kind: ComponentKind): void {
    if (preview) return;
    dragSource = { type: "library", kind };
    applyDrop({ pageId: activePageId, root: activeRoot, id: null, direction: "inside" }); clearDrag();
  }
  function deleteSelected(): void {
    if (preview || !selected || selected.kind === "page") return;
    const nodes = removeComponent(activePage.fields[activeRoot].value, selected.id);
    pages = pages.map((page) => page.id === activePageId ? { ...page, fields: { ...page.fields, [activeRoot]: { ...page.fields[activeRoot], value: nodes } } } : page);
    selectedId = null; detailsOpen = false; status = "選択したコンポーネントを削除しました。";
  }
  function resizeTree(event: PointerEvent): void {
    const bounds = editorBody.getBoundingClientRect();
    treeWidth = clamp(event.clientX - bounds.left - HANDLE_SIZE / 2, MIN_TREE_WIDTH, bounds.width - MIN_CANVAS_WIDTH - HANDLE_SIZE);
  }
</script>
<svelte:window ondragend={clearDrag} onkeydown={(event) => { if (event.key === "Escape") clearDrag(); }} />
<main class="editor-shell" style:--tree-width={treeWidth + "px"}>
  <header class="editor-header"><h1>FlagShip</h1><span class="header-context">COMPONENT WORKSPACE</span></header>
  <div class="editor-body" bind:this={editorBody}>
    <aside id="tree-panel" class="panel tree-panel" aria-label="Library and Tree">
      <section class="library-section" aria-labelledby="library-heading">
        <div class="section-heading"><h2 id="library-heading">Library</h2><span class="count">{String(COMPONENT_CATALOG.length).padStart(2, "0")}</span></div>
        <p class="panel-hint">ドラッグして配置</p>
        <div class="library-grid">
          {#each COMPONENT_CATALOG as item}
            {@const sample = createComponent(item.kind, 0)}
            <div class="library-item" role="group" aria-label={item.label + "のプレビュー"} data-library-kind={item.kind}
              draggable={!preview} ondragstart={(event) => startDrag(event, { type: "library", kind: item.kind })}>
              <div class="library-thumbnail" aria-hidden="true" inert><div class="thumbnail-content"><ComponentView node={sample} editing /></div></div>
              <button type="button" class="library-add" aria-label={item.label + "を追加"} title="ドラッグして配置、またはクリックで末尾に追加" disabled={preview} onclick={() => addComponent(item.kind)}>{item.title}<span aria-hidden="true">+</span></button>
            </div>
          {/each}
        </div>
      </section>
      <section class="tree-section" aria-labelledby="tree-heading">
        <div class="section-heading"><h2 id="tree-heading">Tree</h2><button class="toolbar-button" type="button" disabled={preview} aria-label="ページを追加" onclick={addPage}>+ Page</button></div>
        <div class="pages-heading">Pages <span class="count">{pages.length}</span></div>
        {#each pages as page (page.id)}
          <div class="page-tree" data-page-id={page.id}>
            <div class="tree-row">
              <button type="button" class="tree-toggle" aria-label={displayName(page) + "の枝を開閉"}
                aria-expanded={!collapsedPages[page.id]} aria-controls={page.id + "-slots"}
                onclick={() => collapsedPages[page.id] = !collapsedPages[page.id]}>
                <span aria-hidden="true">{collapsedPages[page.id] ? "+" : "−"}</span>
              </button>
            <button type="button" class="tree-object page-object" class:active={selectedId === page.id} disabled={preview}
              aria-pressed={selectedId === page.id} aria-label={displayName(page)} onclick={() => selectComponent(page.id, page.id, "context")}>
              <span>{displayName(page)}</span><span class="page-path">{page.fields.path.value}</span>
            </button>
            </div>
            <div id={page.id + "-slots"} hidden={collapsedPages[page.id]}>
            {#each ["context", "overlay"] as rootName}
              {@const root = rootName as PageSlot}
              {@const isActive = activePageId === page.id && activeRoot === root}
              {@const expanded = !!expandedRoots[page.id + ":" + root]}
              <div class="tree-slot root-slot" class:active={isActive} class:drop-active={dropTarget?.pageId === page.id && dropTarget.id === null && dropTarget.root === root}
                data-slot-owner={page.id} data-slot-key={root} role="group" aria-label={displayName(page) + " " + page.fields[root].name + " slotの配置先"}
                ondragover={(event) => hover(event, {pageId:page.id,root,id:null,direction:"inside"})} ondrop={drop}>
                <div class="tree-row">
                  <button type="button" class="tree-toggle" aria-label={displayName(page) + " " + page.fields[root].name + " slotの枝を開閉"}
                    aria-expanded={expanded} aria-controls={page.id + "-" + root + "-tree"}
                    onclick={() => expandedRoots[page.id + ":" + root] = !expanded}>
                    <span aria-hidden="true">{expanded ? "−" : "+"}</span>
                  </button>
                <button type="button" class="slot-heading root-heading" aria-label={page.fields[root].name + " slot"}
                  aria-expanded={expanded} aria-controls={page.id + "-" + root + "-tree"} disabled={preview}
                  onclick={() => switchRoot(page.id, root)}>
                  <span>{page.fields[root].name}</span><span class="slot-type">{slotTypeLabel(page.fields[root])}</span><span class="count">{page.fields[root].value.length}</span>
                </button>
                </div>
                <div id={page.id + "-" + root + "-tree"} hidden={!expanded}>
                  <WidgetTree nodes={page.fields[root].value} {selectedId} {dropTarget}
                    onSelect={(id) => selectComponent(id, page.id, root)} onDrag={(event,node) => startInstanceDrag(event,node,page.id,root)}
                    onHoverNode={(event,node) => hoverTreeNode(event,node,page.id,root)}
                    onHoverSlot={(event,id,slotKey) => hover(event,{pageId:page.id,root,id,slotKey,direction:"inside"})} onDrop={drop} />
                  {#if page.fields[root].value.length === 0}<p class="slot-empty">Empty slot</p>{/if}
                </div>
              </div>
            {/each}
            </div>
          </div>
        {/each}
      </section>
    </aside>
    <button type="button" class="resize-handle vertical-resize-handle" aria-label="LibraryとTreeの横幅を変更" aria-controls="tree-panel"
      onpointerdown={(event) => beginPointerResize(event, resizeTree, "col-resize")}
      onkeydown={(event) => applyKeyboardResize(event,"ArrowLeft","ArrowRight",treeWidth,MIN_TREE_WIDTH,editorBody.clientWidth-MIN_CANVAS_WIDTH-HANDLE_SIZE,(value) => treeWidth=value)}></button>
    <section id="canvas-panel" class="panel canvas-panel" aria-labelledby="canvas-heading">
      <div class="canvas-toolbar"><h2 id="canvas-heading">Canvas</h2><span class="canvas-root">{activePage.fields.path.value} / {preview ? "Preview" : activePage.fields[activeRoot].name}</span>
        <div class="canvas-actions"><button type="button" class="toolbar-button" disabled={preview || !selected || selected.kind === "page"} onclick={deleteSelected} aria-label="選択したオブジェクトを削除">Delete</button>
          <button type="button" class="toolbar-button" class:active={preview} aria-pressed={preview} onclick={() => { preview = !preview; clearDrag(); }}>Preview</button></div>
      </div>
      <p class="canvas-hint">{preview ? "編集用の境界線を除いた表示" : "上下左右で隣に配置 / 中央でコンテナ内に配置 / Treeのslotにも配置"}</p>
      <div class="canvas-workspace" class:details-open={detailsVisible}>
        <div class="canvas-viewport" class:preview>
          <div class="canvas-stage" class:root-drop={dropTarget?.id === null && !preview} role="group"
            style:background={colorCss(activePage.fields.background.value)}
            aria-label={preview ? "Preview" : activePage.fields[activeRoot].name + "の配置領域"} data-canvas-root={preview ? "preview" : activeRoot}
            ondragover={(event) => hover(event,{pageId:activePageId,root:activeRoot,id:null,direction:"inside"})}
            ondragleave={(event) => { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) dropTarget=null; }} ondrop={drop}>
            {#if !preview && activePage.fields[activeRoot].value.length === 0}<div class="canvas-empty"><span>DROP COMPONENT HERE</span><p>Libraryからコンポーネントをドラッグ</p></div>{/if}
            <div class="scene-layout" data-axis="vertical">
              <CanvasNodes nodes={activePage.fields[preview ? "context" : activeRoot].value} editing={!preview} {selectedId} {dropTarget}
                onDrag={startInstanceDrag} onHover={hoverObject} onDrop={drop} onSelect={selectComponent} onChange={updateComponent} />
            </div>
            {#if preview}<div class="overlay-surface"><div class="scene-layout" data-axis="vertical">
              <CanvasNodes nodes={activePage.fields.overlay.value} editing={false} selectedId={null} dropTarget={null}
                onDrag={startInstanceDrag} onHover={hoverObject} onDrop={drop} onSelect={selectComponent} onChange={updateComponent} />
            </div></div>{/if}
          </div>
        </div>
        <div id="component-details" hidden={!detailsVisible}>
          {#if selected && detailsVisible}<DetailsPane node={selected} {breadcrumbs} onClose={() => detailsOpen=false} onSelect={selectComponent} onChange={updateComponent} />{/if}
        </div>
        <div class="details-rail" hidden={detailsVisible}>
          <button type="button" aria-label="詳細paneを開く" aria-controls="component-details" aria-expanded="false" hidden={preview} disabled={!selected || preview} onclick={() => detailsOpen=true}>+</button>
        </div>
      </div>
      <p class="workspace-status" role="status">{status || (selected ? displayName(selected) : "Pages / Context / Overlay")}</p>
    </section>
  </div>
</main>
