<script lang="ts">
  import { tick } from "svelte";
  import { displayName, type Pages } from "./component-model";
  import FlowValueEditor from "./FlowValueEditor.svelte";
  import { FLOW_NODE_LIBRARY } from "./flow-library";
  import { flowErrors, flowNodeErrors, layoutFlowNodes, setScheduleGlobal, nextNode, pageComponents, setFlowEdge, variableNodes, type FlowGraph, type FlowLogEntry, type FlowNode, type FlowNodeType, type FlowPort, type FlowWatchValue, type FlowWriteTarget } from "./flow-model";

  let { flow, flows, pages, selectedNodeId, copiedFlowNode, flowInspectToken, active, preview, execution, executionLog, debugValues, suggestedClickComName, draggedFlowNodeType, onDropLibraryNode, onAddSuggestedClickTrigger, onAddNode, onSelectNode, onChange, onDeleteNode, onCopyNode, onPasteNode, onContinue, onStep }: {
    flow: FlowGraph | undefined; flows: FlowGraph[]; pages: Pages; selectedNodeId: string | null; copiedFlowNode: FlowNode | null; flowInspectToken: number; active: boolean; preview: boolean;
    draggedFlowNodeType: FlowNodeType | null; onDropLibraryNode: () => void;
    execution: { flowId: string; nodeId: string | null; status: string; visited: string[] } | null;
    executionLog: FlowLogEntry[]; debugValues: FlowWatchValue[];
    suggestedClickComName: string | null; onAddSuggestedClickTrigger: () => void;
    onSelectNode: (id: string | null) => void;
    onAddNode: (type: FlowNodeType, x?: number, y?: number) => void;
    onChange: (flow: FlowGraph) => void;
    onDeleteNode: () => void; onCopyNode: () => void; onPasteNode: () => void;
    onContinue: () => void; onStep: () => void;
  } = $props();
  const selectedNode = $derived(flow?.nodes.find((node) => node.id === selectedNodeId));
  const selectedNodeErrors = $derived(flow && selectedNode ? flowNodeErrors(flow, pages, selectedNode, flows) : []);
  const errors = $derived(flow ? flowErrors(flow, pages, flows) : []);
  const components = $derived(flow?.scope.kind === "page" ? pageComponents(pages, flow.scope.pageId).filter((item) => item.node.kind !== "page") : []);
  let zoom = $state(1);
  let viewport = $state<HTMLDivElement | null>(null);
  let viewportWidth = $state(0);
  let viewportHeight = $state(0);
  const boardWidth = $derived(Math.max(850, viewportWidth / zoom, ...((flow?.nodes ?? []).map((node) => node.x + 250))));
  const boardHeight = $derived(Math.max(600, viewportHeight / zoom, ...((flow?.nodes ?? []).map((node) => node.y + 160))));
  let board = $state<HTMLDivElement | null>(null);
  let inspector = $state<HTMLElement | null>(null);
  let inspectorOpen = $state(false);
  let inspectorToggleButton: HTMLButtonElement;
  let edgePaths = $state<Record<string, string>>({});
  let dragging = $state<{ id: string; pointerId: number; clientX: number; clientY: number; x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  let panning = $state<{ pointerId: number; x: number; y: number; left: number; top: number } | null>(null);
  let wire = $state<{ from: string; port: FlowPort; pointerId: number; clientX: number; clientY: number; sx: number; sy: number; x: number; y: number; targetId: string | null } | null>(null);
  let clickConnection = $state<{ from: string; port: FlowPort } | null>(null);
  const showInspector = $derived(inspectorOpen && active && !wire && !clickConnection && !dragging);
  let connectionMessage = $state("");
  let lastFlowId: string | undefined;
  $effect(() => { const id = flow?.id; if (id !== lastFlowId) { clickConnection = null; connectionMessage = ""; lastFlowId = id; } });
  let lastSelectedNodeId: string | null = null;
  $effect(() => { if (selectedNodeId && selectedNodeId !== lastSelectedNodeId) inspectorOpen = true; lastSelectedNodeId = selectedNodeId; });

  $effect(() => { selectedNodeId; flowInspectToken; if (inspector) inspector.scrollTop = 0; });
  $effect(() => {
    zoom;
    const graph = flow;
    const currentBoard = board;
    if (!graph || !currentBoard) return;
    let disposed = false;
    let observer: ResizeObserver | undefined;
    void tick().then(() => {
      if (disposed) return;
      measureEdges(graph, currentBoard);
      observer = new ResizeObserver(() => measureEdges(graph, currentBoard));
      observer.observe(currentBoard);
      for (const node of currentBoard.querySelectorAll(".flow-node-block")) observer.observe(node);
    });
    return () => { disposed = true; observer?.disconnect(); };
  });

  function measureEdges(graph: FlowGraph, currentBoard: HTMLElement): void {
    const bounds = currentBoard.getBoundingClientRect();
    const paths: Record<string, string> = {};
    for (const edge of graph.edges) {
      const from = currentBoard.querySelector<HTMLElement>(`[data-flow-node-id="${edge.from}"]`);
      const to = currentBoard.querySelector<HTMLElement>(`[data-flow-node-id="${edge.to}"]`);
      const output = from?.querySelector<HTMLElement>(`[data-flow-output="${edge.from}|${edge.port}"]`);
      const input = to?.querySelector<HTMLElement>(`[data-flow-input="${edge.to}"]`);
      if (!from || !to || !output || !input) continue;
      const source = output.getBoundingClientRect();
      const destination = input.getBoundingClientRect();
      const sx = (source.right - bounds.left) / zoom;
      const sy = ((source.top + source.bottom) / 2 - bounds.top) / zoom;
      const tx = ((destination.left + destination.right) / 2 - bounds.left) / zoom;
      const ty = ((destination.top + destination.bottom) / 2 - bounds.top) / zoom;
      if (tx >= sx + 16) {
        const middle = sx + (tx - sx) / 2;
        paths[edge.id] = `M ${sx} ${sy} H ${middle} V ${ty} H ${tx}`;
      } else {
        const below = (Math.max(from.getBoundingClientRect().bottom, to.getBoundingClientRect().bottom) - bounds.top) / zoom + 24;
        paths[edge.id] = `M ${sx} ${sy} H ${sx + 20} V ${below} H ${tx - 20} V ${ty} H ${tx}`;
      }
    }
    edgePaths = paths;
  }

  async function setZoom(value: number, clientX?: number, clientY?: number): Promise<void> {
    const graph = viewport;
    if (!graph || dragging || wire) return;
    const bounds = graph.getBoundingClientRect();
    const x = clientX === undefined ? graph.clientWidth / 2 : clientX - bounds.left - graph.clientLeft;
    const y = clientY === undefined ? graph.clientHeight / 2 : clientY - bounds.top - graph.clientTop;
    const boardX = (graph.scrollLeft + x) / zoom, boardY = (graph.scrollTop + y) / zoom;
    zoom = Math.max(.25, Math.min(2, Math.round(value * 100) / 100));
    await tick();
    graph.scrollLeft = boardX * zoom - x;
    graph.scrollTop = boardY * zoom - y;
  }
  function graphWheel(event: WheelEvent): void {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      void setZoom(zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1), event.clientX, event.clientY);
    } else if (event.shiftKey && viewport && !event.deltaX) {
      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    }
  }
  function startPan(event: PointerEvent): void {
    if (!viewport || !(event.target instanceof Element) || ![0, 1].includes(event.button)) return;
    if (event.button === 0 && event.target.closest(".flow-node-block, button, input, select")) return;
    event.preventDefault();
    viewport.setPointerCapture(event.pointerId);
    viewport.focus({ preventScroll: true });
    panning = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
  }
  function pan(event: PointerEvent): void {
    if (!panning || panning.pointerId !== event.pointerId || !viewport) return;
    viewport.scrollLeft = panning.left + panning.x - event.clientX;
    viewport.scrollTop = panning.top + panning.y - event.clientY;
  }
  function endPan(event: PointerEvent): void { if (panning?.pointerId === event.pointerId) panning = null; }

  function nodeName(node: FlowNode): string { return FLOW_NODE_LIBRARY.find((item) => item.type === node.type)?.name ?? node.type; }
  function incomingLabel(graph: FlowGraph, node: FlowNode): string {
    if (node.type.startsWith("trigger.")) return "START / イベント・時刻から発火";
    return graph.edges.filter((edge) => edge.to === node.id).map((edge) => {
      const source = graph.nodes.find((item) => item.id === edge.from);
      return `${source ? nodeName(source) : edge.from} · ${edge.port.toUpperCase()}`;
    }).join(" / ") || "未接続";
  }
  function setTargetName(node: Extract<FlowNode, { type: "action.set-variable" }>): string {
    const target = node.target;
    if (target?.kind === "field") return `${target.componentId}.${target.fieldKey || "?"}`;
    if (target?.kind === "variable") return flow ? variableNodes(flow, flows).find((item) => item.id === target.variableId)?.name ?? "変数未設定" : "変数未設定";
    return "代入先未設定";
  }
  function scopeLabel(item: FlowGraph): string {
    if (item.scope.kind === "project") return "PROJECT";
    const pageId = item.scope.pageId;
    return pages.find((page) => page.id === pageId)?.fields.path.value ?? "PAGE MISSING";
  }
  function dragOver(event: DragEvent): void {
    if (preview || !event.dataTransfer) return;
    if (draggedFlowNodeType || event.dataTransfer.types.includes("application/x-flagship-flow-node")) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }
  }
  function dropNode(event: DragEvent): void {
    if (preview || !event.dataTransfer) return;
    const type = draggedFlowNodeType ?? event.dataTransfer.getData("application/x-flagship-flow-node") as FlowNodeType;
    if (!FLOW_NODE_LIBRARY.some((item) => item.type === type)) return;
    event.preventDefault();
    if (board) {
      const bounds = board.getBoundingClientRect();
      onAddNode(type, (event.clientX - bounds.left) / zoom - 109, (event.clientY - bounds.top) / zoom - 55);
    }
    onDropLibraryNode();
  }
  function wireTarget(clientX: number, clientY: number, from: string): FlowNode | null {
    const hit = document.elementFromPoint(clientX, clientY);
    const id = hit?.closest<HTMLElement>("[data-flow-input]")?.dataset.flowInput
      ?? hit?.closest<HTMLElement>(".flow-node-main")?.closest<HTMLElement>("[data-flow-node-id]")?.dataset.flowNodeId;
    const target = flow?.nodes.find((node) => node.id === id);
    return target && target.id !== from && !target.type.startsWith("trigger.") ? target : null;
  }
  function startWire(event: PointerEvent, id: string, port: FlowPort): void {
    if (preview || event.button !== 0 || !board) return;
    event.preventDefault();
    clickConnection = null; connectionMessage = "";
    const output = event.currentTarget as HTMLElement;
    const source = output.getBoundingClientRect();
    const bounds = board.getBoundingClientRect();
    output.setPointerCapture(event.pointerId);
    wire = { from: id, port, pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, sx: (source.right - bounds.left) / zoom, sy: ((source.top + source.bottom) / 2 - bounds.top) / zoom,
      x: (event.clientX - bounds.left) / zoom, y: (event.clientY - bounds.top) / zoom, targetId: null };
    selectNode(id);
  }
  function moveWire(event: PointerEvent): void {
    if (!wire || wire.pointerId !== event.pointerId || !board) return;
    const bounds = board.getBoundingClientRect();
    const target = wireTarget(event.clientX, event.clientY, wire.from);
    const input = target ? board.querySelector<HTMLElement>(`[data-flow-input="${target.id}"]`) : null;
    const destination = input?.getBoundingClientRect();
    wire = { ...wire, x: destination ? ((destination.left + destination.right) / 2 - bounds.left) / zoom : (event.clientX - bounds.left) / zoom,
      y: destination ? ((destination.top + destination.bottom) / 2 - bounds.top) / zoom : (event.clientY - bounds.top) / zoom,
      targetId: target?.id ?? null };
  }
  function endWire(event: PointerEvent): void {
    if (!wire || wire.pointerId !== event.pointerId) return;
    const source = flow?.nodes.find((node) => node.id === wire?.from);
    const target = wireTarget(event.clientX, event.clientY, wire.from);
    const port = wire.port;
    const clicked = Math.hypot(event.clientX - wire.clientX, event.clientY - wire.clientY) < 5;
    wire = null;
    if (source && target) { connect(source, port, target.id); clickConnection = null; connectionMessage = ""; }
    else if (source && clicked) { clickConnection = { from: source.id, port }; connectionMessage = "接続先Nodeをクリックしてください。"; }
  }
  function cancelWire(event: PointerEvent): void { if (wire?.pointerId === event.pointerId) wire = null; }
  function draftPath(): string {
    if (!wire) return "";
    const { sx, sy, x, y } = wire;
    if (x >= sx + 16) { const middle = sx + (x - sx) / 2; return `M ${sx} ${sy} H ${middle} V ${y} H ${x}`; }
    const below = Math.max(sy, y) + 32;
    return `M ${sx} ${sy} H ${sx + 20} V ${below} H ${x - 20} V ${y} H ${x}`;
  }
  function selectNode(id: string): void {
    if (clickConnection && flow && !preview && id !== clickConnection.from) {
      const next = setFlowEdge(flow, clickConnection.from, clickConnection.port, id);
      if (next !== flow) { onChange(next); clickConnection = null; connectionMessage = "接続しました。"; }
      else connectionMessage = "このNodeには接続できません。";
    }
    onSelectNode(id); inspectorOpen = true; if (inspector) inspector.scrollTop = 0;
  }
  function closeInspector(): void { inspectorOpen = false; inspectorToggleButton?.focus(); }
  function updateNode(node: FlowNode): void {
    if (flow) onChange({ ...flow, nodes: flow.nodes.map((item) => item.id === node.id ? node : item) });
  }
  function startMove(event: PointerEvent, node: FlowNode): void {
    if (preview || event.button !== 0) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragging = { id: node.id, pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: node.x, y: node.y, scrollLeft: viewport?.scrollLeft ?? 0, scrollTop: viewport?.scrollTop ?? 0 };
    selectNode(node.id);
  }
  function move(event: PointerEvent): void {
    if (!dragging || dragging.pointerId !== event.pointerId || !flow) return;
    const node = flow.nodes.find((item) => item.id === dragging?.id);
    if (node) updateNode({ ...node, x: Math.max(0, Math.round(dragging.x + (event.clientX - dragging.clientX + (viewport?.scrollLeft ?? 0) - dragging.scrollLeft) / zoom)), y: Math.max(0, Math.round(dragging.y + (event.clientY - dragging.clientY + (viewport?.scrollTop ?? 0) - dragging.scrollTop) / zoom)) });
  }
  function endMove(event: PointerEvent): void { if (dragging?.pointerId === event.pointerId) dragging = null; }
  function toggleBreakpoint(node: FlowNode): void {
    if (!flow || preview) return;
    onChange({ ...flow, breakpoints: flow.breakpoints.includes(node.id) ? flow.breakpoints.filter((id) => id !== node.id) : [...flow.breakpoints, node.id] });
  }
  function connect(node: FlowNode, port: FlowPort, value: string): void {
    if (flow) onChange(setFlowEdge(flow, node.id, port, value || null));
  }
  function ports(node: FlowNode): FlowPort[] { return node.type === "logic.condition" ? ["true", "false"] : ["next"]; }
  function localDateTime(iso: string | null): string {
    if (!iso) return "";
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
</script>
<svelte:window onkeydown={(event) => { if (event.key === "Escape") { clickConnection = null; connectionMessage = ""; if (inspectorOpen) closeInspector(); } }} />

<div class="flow-shell">
  <div class="flow-topbar">
    <span class="flow-topbar-title">FLOW GRAPH</span>
    <div class="flow-topbar-actions">
      <button type="button" class="toolbar-button" aria-label="Flow Graphを縮小" disabled={!flow || zoom <= .25} onclick={() => void setZoom(zoom - .1)}>−</button>
      <button type="button" class="toolbar-button flow-zoom-reset" aria-label="Flow Graphを100%に戻す" disabled={!flow} onclick={() => void setZoom(1)}>{Math.round(zoom * 100)}%</button>
      <button type="button" class="toolbar-button" aria-label="Flow Graphを拡大" disabled={!flow || zoom >= 2} onclick={() => void setZoom(zoom + .1)}>+</button>
      <button bind:this={inspectorToggleButton} type="button" class="toolbar-button" aria-controls="flow-node-inspector" aria-expanded={showInspector} onclick={() => inspectorOpen = !inspectorOpen}>設定</button>
      <button type="button" class="toolbar-button" disabled={preview || !selectedNode} onclick={onCopyNode}>Copy Node</button>
      <button type="button" class="toolbar-button" disabled={preview || !flow || !copiedFlowNode} onclick={onPasteNode}>Paste Node</button>
      <button type="button" class="toolbar-button" disabled={preview || !selectedNode} onclick={onDeleteNode}>Delete Node</button>
      <button type="button" class="toolbar-button" disabled={preview || !flow?.nodes.length} onclick={() => { if (flow) onChange(layoutFlowNodes(flow)); }}>整理</button>
    </div>
  </div>
  {#if flow}
    <div class="flow-meta"><label>名前<input aria-label="Flow名" value={flow.name} readonly={preview} oninput={(event) => onChange({ ...flow!, name: event.currentTarget.value })} /></label>
      <span class="flow-scope-chip">{scopeLabel(flow)}</span></div>
    {#if errors.length}<p class="flow-error" role="alert">{errors.join(" / ")}</p>{/if}
    <div class="flow-execution" aria-live="polite"><span class="flow-execution-indicator" class:paused={execution?.flowId === flow.id && execution.status === "paused"}></span>
      <span>{execution?.flowId === flow.id ? `${execution.status.toUpperCase()} / ${flow.nodes.find((node) => node.id === execution.nodeId)?.type ?? "END"}` : "READY / Previewで実行"}</span>
      {#if preview && execution?.flowId === flow.id && execution.status === "paused"}<button type="button" class="toolbar-button" onclick={onStep}>Step</button><button type="button" class="toolbar-button" onclick={onContinue}>Continue</button>{/if}
    </div>
    {#if clickConnection || connectionMessage}<div class="flow-connect-hint" role="status"><span>{clickConnection ? `${flow.nodes.find((node) => node.id === clickConnection?.from)?.type ?? "Node"} · ${clickConnection.port.toUpperCase()} → 接続先Nodeをクリック` : connectionMessage}</span>{#if clickConnection}<button type="button" class="toolbar-button" onclick={() => { clickConnection = null; connectionMessage = ""; }}>キャンセル</button>{/if}</div>{/if}
    <p class="flow-navigation-hint">ホイールでスクロール · Shift＋ホイールで横移動 · Ctrl＋ホイールで拡大縮小 · 背景ドラッグで移動</p>
    <div class="flow-workspace" class:inspector-closed={!showInspector}>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (スクロール領域をキーボードでも操作できるようにする) -->
      <div class="flow-graph" class:panning={!!panning} role="region" aria-label="Flow Graph" tabindex="0" bind:this={viewport} bind:clientWidth={viewportWidth} bind:clientHeight={viewportHeight}
        onwheel={graphWheel} onpointerdown={startPan} onpointermove={pan} onpointerup={endPan} onpointercancel={endPan} ondragover={dragOver} ondrop={dropNode}>
        <div class="flow-board-space" style:width={boardWidth * zoom + "px"} style:height={boardHeight * zoom + "px"}>
        <div class="flow-board" bind:this={board} data-flow-zoom={zoom} style:transform={"scale(" + zoom + ")"} style:width={boardWidth + "px"} style:height={boardHeight + "px"}>
          {#if flow.nodes.length === 0}<div class="flow-board-empty"><strong>開始イベントを選ぶ</strong><p>Node Libraryからドラッグするか、ここで明示的に追加します。</p><div>
            {#if suggestedClickComName}<button type="button" class="toolbar-button" disabled={preview} onclick={onAddSuggestedClickTrigger}>{suggestedClickComName} のClick</button>{/if}
            <button type="button" class="toolbar-button" disabled={preview} onclick={() => onAddNode("trigger.event")}>Event Trigger</button>
            <button type="button" class="toolbar-button" disabled={preview} onclick={() => onAddNode("trigger.load")}>Page Load</button>
            <button type="button" class="toolbar-button" disabled={preview} onclick={() => onAddNode("trigger.schedule")}>Schedule</button>
          </div></div>{/if}
          <svg class="flow-edges" width={boardWidth} height={boardHeight} aria-hidden="true">
            <defs><marker id="flow-drag-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0 L 8 4 L 0 8 Z" /></marker></defs>
            {#each flow.edges as edge (edge.id)}
              {@const from = flow.nodes.find((node) => node.id === edge.from)}
              {@const to = flow.nodes.find((node) => node.id === edge.to)}
              {#if from && to}<path d={edgePaths[edge.id] ?? ""} data-flow-edge-id={edge.id} class:active={execution?.flowId === flow.id && execution.visited.includes(from.id) && (execution.visited.includes(to.id) || execution.nodeId === to.id)} />{/if}
            {/each}
            {#if wire}<path d={draftPath()} class="flow-draft-edge" data-flow-draft-edge marker-end="url(#flow-drag-arrow)" />{/if}
          </svg>
          {#each flow.nodes as node (node.id)}
            <div class="flow-node-block" class:selected={selectedNodeId === node.id} class:invalid={flowNodeErrors(flow, pages, node, flows).length > 0} class:current={execution?.flowId === flow.id && execution.nodeId === node.id} class:visited={execution?.flowId === flow.id && execution.visited.includes(node.id)}
              style:left={node.x + "px"} style:top={node.y + "px"} data-flow-node-id={node.id}>
              <button type="button" class="flow-node-select-surface" aria-label={nodeName(node) + "を選択"} title="ドラッグして移動" onpointerdown={(event) => startMove(event,node)} onpointermove={move} onpointerup={endMove} onpointercancel={endMove} onclick={() => selectNode(node.id)}></button>
              {#if !node.type.startsWith("trigger.")}<button type="button" class="flow-node-input" class:link-target={wire?.targetId === node.id || !!clickConnection && setFlowEdge(flow, clickConnection.from, clickConnection.port, node.id) !== flow} data-flow-input={node.id} aria-label={nodeName(node) + "の入力端子。出力端子をここにドラッグして接続"} title="出力端子をドラッグして接続" onclick={() => selectNode(node.id)}></button>{/if}
              <div class="flow-node-title"><button type="button" class="flow-node-handle" aria-label={nodeName(node) + "を移動"} title="ドラッグして移動" disabled={preview} onpointerdown={(event) => startMove(event,node)} onpointermove={move} onpointerup={endMove} onpointercancel={endMove}>⋮⋮</button><span>{node.type}</span>{#if flowNodeErrors(flow, pages, node, flows).length}<span class="flow-node-error-mark" aria-label="設定が必要" title={flowNodeErrors(flow, pages, node, flows).join(" / ")}>!</span>{/if}
                <button type="button" class="flow-breakpoint" class:enabled={flow.breakpoints.includes(node.id)} aria-label={nodeName(node) + "のブレークポイント"} aria-pressed={flow.breakpoints.includes(node.id)} disabled={preview} onclick={() => toggleBreakpoint(node)}><span></span></button>
              </div>
              <button type="button" class="flow-node-main" aria-label={nodeName(node) + "の設定"} title="クリックで設定・ドラッグで移動" onpointerdown={(event) => startMove(event,node)} onpointermove={move} onpointerup={endMove} onpointercancel={endMove} onclick={() => selectNode(node.id)}><strong>{nodeName(node)}</strong>
                <small>{node.type === "trigger.event" ? components.find((item) => item.id === node.componentId)?.name ?? "Com未設定" : node.type === "trigger.schedule" ? node.mode === "at" ? localDateTime(node.dateTime) || "日時未設定" : `${node.mode} / ${node.milliseconds} ms` : node.type === "trigger.load" ? "Pageを表示したとき" : node.type === "action.navigate" ? pages.find((page) => page.id === node.targetPageId)?.fields.path.value ?? "遷移先未設定" : node.type === "action.set-variable" ? setTargetName(node) : node.type === "action.init-variable" || node.type === "action.init-constant" ? node.name : `分岐 / ${node.condition.operator}`}</small>
              </button>
              <div class="flow-node-outputs" class:branch={node.type === "logic.condition"}>{#each ports(node) as port (port)}<button type="button" class="flow-node-output" data-flow-output={node.id + "|" + port} aria-label={nodeName(node) + "の" + port.toUpperCase() + "出力をドラッグ"} title="ドラッグして接続" onpointerdown={(event) => startWire(event, node.id, port)} onpointermove={moveWire} onpointerup={endWire} onpointercancel={cancelWire} onclick={() => selectNode(node.id)}>{port === "next" ? "OUT" : port.toUpperCase()} →</button>{/each}</div>
            </div>
          {/each}
        </div>
        </div>
      </div>
      {#if showInspector}<button type="button" class="inspector-scrim" aria-label="設定を閉じる" onclick={closeInspector}></button>{/if}
      <aside id="flow-node-inspector" class="flow-inspector inspector-pane" aria-label="Flow Nodeの設定" bind:this={inspector} hidden={!showInspector}>
        {#if selectedNode}
          <div class="inspector-heading"><h3>Inspector</h3><button type="button" class="inspector-close" aria-label="Flowの設定を閉じる" onclick={closeInspector}>−</button></div><p class="flow-inspector-type">{nodeName(selectedNode)} / {selectedNode.type}</p>
          <fieldset class="flow-inspector-fields" disabled={preview}>
            {#if ports(selectedNode).length}
              <div class="flow-connection-fields"><h4>FLOW / 実行順の入出力</h4>
                <div class="flow-connection-input"><span>入力元</span><strong>{incomingLabel(flow, selectedNode)}</strong></div>
                {#each ports(selectedNode) as port (port)}<label>OUT · {port.toUpperCase()} / 出力先<select aria-label={port + "の接続先"} value={nextNode(flow, selectedNode.id, port) ?? ""} onchange={(event) => connect(selectedNode, port, event.currentTarget.value)}><option value="">END / 未接続</option>{#each flow.nodes.filter((item) => item.id !== selectedNode.id && !item.type.startsWith("trigger.")) as item (item.id)}<option value={item.id}>{nodeName(item)} / {item.id}</option>{/each}</select></label>{/each}
              </div>
            {/if}
            {#if selectedNode.type === "trigger.event"}
              <p class="flow-inspector-help">Click · このFlowが属するPageのComを対象にします。</p>
              <label>Com<select aria-label="Click対象Com" value={selectedNode.componentId ?? ""} onchange={(event) => updateNode({ ...selectedNode, componentId: event.currentTarget.value || null })}><option value="">選択してください</option>{#each components as component (component.id)}<option value={component.id}>{component.name} / {component.id}</option>{/each}</select></label>
            {:else if selectedNode.type === "trigger.schedule"}
              <label class="flow-global-toggle"><input type="checkbox" aria-label="スケジュールをグローバルにする" checked={flow.scope.kind === "project"} onchange={(event) => onChange(setScheduleGlobal(flow!, event.currentTarget.checked))} />グローバル</label>
              <p class="flow-inspector-help">{flow.scope.kind === "project" ? "Preview中はPageをまたいで実行します。" : "このFlowが属するPageの表示中に実行します。"}</p>
              <label>Mode<select aria-label="スケジュール種別" value={selectedNode.mode} onchange={(event) => updateNode({ ...selectedNode, mode: event.currentTarget.value as "after" | "interval" | "at" })}><option value="after">After</option><option value="interval">Interval</option><option value="at">At</option></select></label>
              {#if selectedNode.mode === "at"}<label>日時<input aria-label="発火日時" type="datetime-local" value={localDateTime(selectedNode.dateTime)} onchange={(event) => updateNode({ ...selectedNode, dateTime: event.currentTarget.value ? new Date(event.currentTarget.value).toISOString() : null })} /></label>
              {:else}<label>間隔 (ms)<input aria-label="発火までの時間" type="number" min={selectedNode.mode === "interval" ? 1000 : 0} step="100" value={selectedNode.milliseconds} oninput={(event) => updateNode({ ...selectedNode, milliseconds: Number(event.currentTarget.value) })} /></label>{/if}
            {:else if selectedNode.type === "trigger.load"}
              <p class="flow-inspector-help">Previewで対象Pageを表示したときに実行します。</p>
            {:else if selectedNode.type === "action.navigate"}
              <label>移動先Page<select aria-label="遷移先Page" value={selectedNode.targetPageId ?? ""} onchange={(event) => updateNode({ ...selectedNode, targetPageId: event.currentTarget.value || null })}><option value="">選択してください</option>{#each pages as page (page.id)}<option value={page.id}>{displayName(page)} / {page.fields.path.value}</option>{/each}</select></label>
            {:else if selectedNode.type === "action.set-variable"}
              <h4 class="flow-data-heading">DATA / 値の入出力</h4>
              <FlowValueEditor {flow} {flows} {pages} value={selectedNode.value} label="代入する値" id={selectedNode.id + "-value"} onChange={(value) => updateNode({ ...selectedNode, value })} />
              <div class="flow-data-arrow" aria-hidden="true">↓</div>
              <FlowValueEditor {flow} {flows} {pages} writable value={selectedNode.target} label="代入先" id={selectedNode.id + "-target"} onChange={(target) => updateNode({ ...selectedNode, target: target?.kind === "constant" ? null : target as FlowWriteTarget | null })} />
            {:else if selectedNode.type === "action.init-variable" || selectedNode.type === "action.init-constant"}
              <p class="flow-inspector-help">{selectedNode.type === "action.init-variable" ? "VARはこのNodeを通過したとき初期化され、Setで更新できます。" : "CONSTはこのNodeを通過したとき初期化され、以後は変更できません。"}</p>
              <label class="flow-global-toggle"><input type="checkbox" aria-label={selectedNode.type === "action.init-variable" ? "変数をグローバルにする" : "定数をグローバルにする"} checked={selectedNode.global ?? false} onchange={(event) => updateNode({ ...selectedNode, global: event.currentTarget.checked })} />グローバル</label>
              <p class="flow-inspector-help">{selectedNode.global ? "全ページのFlowから参照できます。" : flow.scope.kind === "page" ? "このPageのFlowから参照できます。" : "このFlow内で参照できます。"}</p>
              <label>名前<input aria-label={selectedNode.type === "action.init-variable" ? "変数名" : "定数名"} value={selectedNode.name} oninput={(event) => updateNode({ ...selectedNode, name: event.currentTarget.value })} /></label>
              <label>初期値<input aria-label={selectedNode.type === "action.init-variable" ? "変数の初期値" : "定数値"} value={selectedNode.initialValue} oninput={(event) => updateNode({ ...selectedNode, initialValue: event.currentTarget.value })} /></label>
            {:else if selectedNode.type === "logic.condition"}
              <label>判定<select aria-label="条件の種類" value={selectedNode.condition.operator} onchange={(event) => updateNode({ ...selectedNode, condition: event.currentTarget.value === "notEmpty" ? { operator: "notEmpty", value: null } : { operator: "equals", left: null, right: null } })}><option value="equals">Equals</option><option value="notEmpty">Not Empty</option></select></label>
              {#if selectedNode.condition.operator === "equals"}
                <FlowValueEditor {flow} {flows} {pages} value={selectedNode.condition.left} label="比較元" id={selectedNode.id + "-left"} onChange={(value) => { if (selectedNode.condition.operator === "equals") updateNode({ ...selectedNode, condition: { ...selectedNode.condition, left: value } }); }} />
                <FlowValueEditor {flow} {flows} {pages} value={selectedNode.condition.right} label="比較先" id={selectedNode.id + "-right"} onChange={(value) => { if (selectedNode.condition.operator === "equals") updateNode({ ...selectedNode, condition: { ...selectedNode.condition, right: value } }); }} />
              {:else}<FlowValueEditor {flow} {flows} {pages} value={selectedNode.condition.value} label="判定値" id={selectedNode.id + "-check"} onChange={(value) => { if (selectedNode.condition.operator === "notEmpty") updateNode({ ...selectedNode, condition: { ...selectedNode.condition, value } }); }} />{/if}
            {/if}
            <button type="button" class="toolbar-button flow-remove-node" onclick={onDeleteNode}>Nodeを削除</button>
          </fieldset>
          <section class="flow-node-validation" aria-label="検証結果"><h4>検証結果</h4>
            {#if selectedNodeErrors.length}<ul>{#each selectedNodeErrors as error (error)}<li>{error}</li>{/each}</ul>
            {:else}<p>このNodeの設定は完了しています。</p>{/if}
          </section>
        {:else}<div class="inspector-heading"><h3>Inspector</h3><button type="button" class="inspector-close" aria-label="Flowの設定を閉じる" onclick={closeInspector}>−</button></div><p class="flow-inspector-help">Nodeを選択してください。</p>{/if}
      </aside>
    </div>
    {#if preview}
      <section class="flow-debugger" aria-label="Preview Debugger">
        <div class="flow-watch"><h3>WATCH / 現在値</h3>
          <div class="flow-watch-list">
            {#each debugValues as item (item.kind + item.key)}
              <div class="flow-watch-row" data-flow-watch-kind={item.kind}>
                <span class:field={item.kind === "FIELD"} class:variable={item.kind === "VAR"} class:constant={item.kind === "CONST"} class="flow-value-badge">{item.kind}</span>
                <span class="flow-watch-name">{item.label}</span>
                <code>{item.value === null ? "未初期化" : item.masked ? "••••" : JSON.stringify(item.value)}</code>
              </div>
            {:else}<p class="flow-inspector-help">参照する値はありません。</p>{/each}
          </div>
        </div>
        <div class="flow-console"><h3>CONSOLE / 処理ログ</h3>
          <ol role="log" aria-label="Flowの処理ログ">
            {#each executionLog.filter((entry) => entry.flowId === flow.id) as entry (entry.id)}
              <li><span>{entry.nodeId ?? "FLOW"}</span><span>{entry.message}</span></li>
            {:else}<li>実行待ち</li>{/each}
          </ol>
        </div>
      </section>
    {/if}
  {:else}<div class="flow-empty"><strong>FLOW GRAPH</strong><p>+ Flowで空のFlowを作成してください。</p></div>{/if}
</div>
