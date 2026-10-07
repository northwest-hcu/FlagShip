<script lang="ts">
  import { onMount, untrack } from "svelte";
  import CanvasNodes from "./CanvasNodes.svelte";
  import WidgetTree from "./WidgetTree.svelte";
  import DetailsPane from "./DetailsPane.svelte";
  import FlowEditor from "./FlowEditor.svelte";
  import FlowList from "./FlowList.svelte";
  import { colorCss } from "./colors";
  import ComponentView from "./components/ComponentView.svelte";
  import "./components/components.css";
  import "./editor-view.css";
  import "./flow-editor.css";
  import { acceptsKind, createComponent, createPage, displayName, duplicateWidget, slotNodes, slotsOf, slotTypeLabel, withField, type AnySlot, type ComponentKind, type ComponentNode, type PageComponent, type Pages, type PageSlot, type WidgetNode } from "./component-model";
  import { COMPONENT_LIBRARIES, filterRegistry, libraryName } from "./component-registry";
  import { FLOW_NODE_LIBRARY, filterFlowLibrary } from "./flow-library";
  import { canDropInPages, dropDirection, findComponent, placeInPages, removeComponent, replaceComponent, type DragSource, type DropTarget } from "./scene";
  import { applyKeyboardResize, beginPointerResize, clamp } from "./pointer-resize";
  import { addFlowNode, applyFlowFieldValues, createFlow, createFlowNode, evaluateCondition, flowFieldValueKey, flowErrors, flowWatchValues, nextNode, pageComponents, readFlowValue, removeFlowNode, setFlowEdge, setFlowFieldValue, type FlowGraph, type FlowLogEntry, type FlowNode, type FlowNodeType, type FlowPort } from "./flow-model";
  const HANDLE_SIZE = 6;
  const WORKSPACE_HANDLE_SIZE = 12;
  const MIN_SPLIT_PANE_WIDTH = 240;
  const MIN_SPLIT_PANE_HEIGHT = 170;
  const MIN_TREE_WIDTH = 240;
  const MIN_CANVAS_WIDTH = 480;
  let editorBody: HTMLDivElement;
  let treePanel: HTMLElement;
  let workspaceLayout: HTMLDivElement;
  let treeWidth = $state(304);
  let registryRatio = $state(0.45);
  let horizontalSplitRatio = $state(0.5);
  let verticalSplitRatio = $state(0.5);
  let registryQuery = $state("");
  let flowLibraryQuery = $state("");
  let selectedCanvasLibraryId = $state("");
  let selectedFlowLibraryId = $state("");
  let libraryOpen = $state(true);
  let treeOpen = $state(true);
  let pages = $state<Pages>([createPage(1)]);
  let activePageId = $state("page-1");
  let activeRoot = $state<PageSlot>("context");
  type InsertionTarget = { pageId: string; root: PageSlot; id: string | null; slotKey: string };
  let insertionTarget = $state<InsertionTarget>({ pageId: "page-1", root: "context", id: null, slotKey: "context" });
  let selectedId = $state<string | null>(null);
  let preview = $state(false);
  let view = $state<"canvas" | "flow">("canvas");
  let viewMode = $state<"canvas" | "flow" | "split-vertical" | "split-horizontal">("canvas");
  let previewPageId = $state("page-1");
  let previewValues = $state<Record<string, string>>({});
  let previewVariables = $state<Record<string, string>>({});
  let previewConstants = $state<Record<string, string>>({});
  let executionLog = $state<FlowLogEntry[]>([]);
  let pendingLoadFlows = $state<string[]>([]);
  let lastLoadedPageId = $state<string | null>(null);
  let flows = $state<FlowGraph[]>([]);
  let suggestedClickCom = $state<{ flowId: string; componentId: string } | null>(null);
  let selectedFlowId = $state<string | null>(null);
  let selectedFlowNodeId = $state<string | null>(null);
  let flowInspectToken = $state(0);
  let execution = $state<{ flowId: string; nodeId: string | null; status: "running" | "paused" | "done"; visited: string[] } | null>(null);
  let detailsOpen = $state(false);
  let collapsedPages = $state<Record<string, boolean>>({});
  let expandedRoots = $state<Record<string, boolean>>({ "page-1:context": true });
  let dragSource = $state<DragSource | null>(null);
  let dropTarget = $state<DropTarget | null>(null);
  let dragReject = $state("");
  let heldComponent = $state<DragSource | null>(null);
  let heldFlow = $state<{ flowId: string; nodeId: string | null; type: FlowNodeType; offsetX: number; offsetY: number } | null>(null);
  let virtualCursor = $state<{ x: number; y: number } | null>(null);
  let status = $state("");
  let hiddenInEditor = $state<Record<string, boolean>>({});
  let highlightLayoutId = $state<string | null>(null);
  let copied = $state<ComponentNode | null>(null);
  let copiedFlowNode = $state<FlowNode | null>(null);
  let draggedFlowNodeType = $state<FlowNodeType | null>(null);
  let sequence = 0;
  let pageSequence = 1;
  let flowSequence = 0;
  let flowPasteSequence = 0;
  let executionToken = 0;
  let logSequence = 0;
  const activePage = $derived(pages.find((page) => page.id === activePageId)!);
  const visiblePage = $derived.by(() => {
    const page = preview ? pages.find((item) => item.id === previewPageId) ?? activePage : activePage;
    return preview ? applyFlowFieldValues(page, previewValues) : page;
  });
  const selectedFlow = $derived(flows.find((flow) => flow.id === selectedFlowId));
  const debugValues = $derived(preview && selectedFlow ? flowWatchValues(selectedFlow, pages, previewValues, previewVariables, previewConstants, flows) : []);
  const selected = $derived(selectedId === activePage.id ? activePage : selectedId ? findComponent(activePage.fields[activeRoot].value, selectedId) : undefined);
  const detailsVisible = $derived(detailsOpen && !!selected && !preview && view === "canvas");
  const registryResults = $derived(filterRegistry({ query: registryQuery, libraryId: selectedCanvasLibraryId }));
  const flowLibraryResults = $derived(filterFlowLibrary(flowLibraryQuery, selectedFlowLibraryId));
  const insertionInfo = $derived.by((): { label: string; slot: AnySlot; drop: DropTarget } | null => {
    const target = insertionTarget;
    const page = pages.find((item) => item.id === target.pageId);
    if (!page) return null;
    if (target.id === null) {
      if (target.slotKey !== target.root) return null;
      return { label: `${displayName(page)} / ${page.fields[target.root].name}`, slot: page.fields[target.root], drop: { pageId: page.id, root: target.root, id: null, direction: "inside" } };
    }
    const owner = findComponent(page.fields[target.root].value, target.id);
    const slot = owner && slotsOf(owner).find(([key]) => key === target.slotKey)?.[1];
    return owner && slot ? { label: `${displayName(page)} / ${page.fields[target.root].name} / ${displayName(owner)} / ${slot.name}`, slot, drop: { pageId: page.id, root: target.root, id: owner.id, slotKey: target.slotKey, direction: "inside" } } : null;
  });
  function chooseInsertionTarget(pageId: string, root: PageSlot, id: string | null, slotKey: string): void {
    insertionTarget = { pageId, root, id, slotKey };
    status = "追加先を変更しました。";
  }
  function dropFeedback(): string {
    if (dragReject) return dragReject;
    const target = dropTarget;
    if (!target) return "";
    const page = pages.find((item) => item.id === target.pageId);
    const node = target.id && page ? findComponent(page.fields[target.root].value, target.id) : null;
    const operation = target.direction === "inside" ? "内側へ" : ({ above: "上へ", below: "下へ", left: "左へ", right: "右へ" } as const)[target.direction];
    return `配置先: ${page ? displayName(page) : "Page"} / ${target.root === "context" ? "Context" : "Overlay"}${node ? ` / ${displayName(node)}` : ""} · ${operation}`;
  }
  const clickTargets = $derived.by(() => Object.fromEntries(flows.flatMap((flow) => flow.nodes.flatMap((node) => node.type === "trigger.event" && node.componentId ? [[node.componentId, true] as const] : []))));

  function changeFlow(flow: FlowGraph): boolean {
    const trigger = flow.nodes.find((node) => node.type === "trigger.event");
    if (trigger?.type === "trigger.event" && trigger.componentId && flow.scope.kind === "page") {
      const pageId = flow.scope.pageId;
      if (flows.some((item) => item.id !== flow.id && item.scope.kind === "page" && item.scope.pageId === pageId &&
        item.nodes.some((node) => node.type === "trigger.event" && node.componentId === trigger.componentId))) {
        status = "このComには既にClick Flowがあります。"; return false;
      }
    }
    flows = flows.map((item) => item.id === flow.id ? flow : item);
    return true;
  }
  function addFlow(): void {
    const flow = createFlow("flow-" + ++flowSequence, activePageId);
    flows = [...flows, flow]; selectedFlowId = flow.id; selectedFlowNodeId = null; focusPane("flow");
    status = "空のFlowを追加しました。Node Libraryから起点を配置してください。";
  }
  function addFlowForSelectedCom(): void {
    if (preview || !selected || selected.kind === "page") return;
    const componentId = selected.id;
    const existing = flows.find((flow) => flow.scope.kind === "page" && flow.scope.pageId === activePageId &&
      flow.nodes.some((node) => node.type === "trigger.event" && node.componentId === componentId));
    if (existing) {
      selectedFlowId = existing.id; selectFlowNode(null); focusPane("flow");
      status = "既存のClick Flowを開きました。";
      return;
    }
    addFlow();
    suggestedClickCom = { flowId: selectedFlowId!, componentId };
    status = "開始イベントを選んでください。";
  }
  function addSuggestedClickTrigger(): void {
    if (!selectedFlow || !suggestedClickCom || suggestedClickCom.flowId !== selectedFlow.id || selectedFlow.nodes.length || preview) return;
    const node = { ...createFlowNode(`${selectedFlow.id}-trigger-event-1`, "trigger.event", 40, 48), componentId: suggestedClickCom.componentId } as Extract<FlowNode, { type: "trigger.event" }>;
    changeFlow(addFlowNode(selectedFlow, node)); selectFlowNode(node.id); suggestedClickCom = null;
  }
  function chooseViewMode(mode: typeof viewMode): void {
    viewMode = mode;
    if (mode === "canvas" || mode === "flow") view = mode;
  }
  function focusPane(pane: "canvas" | "flow"): void {
    view = pane;
    if (viewMode === "canvas" || viewMode === "flow") viewMode = pane;
  }
  function selectFlowNode(id: string | null): void { selectedFlowNodeId = id; flowInspectToken++; }
  function nextFlowNodePosition(nodes: FlowGraph["nodes"]): { x: number; y: number } {
    for (let index = nodes.length; ; index++) {
      const x = 40 + (index % 3) * 258;
      const y = 48 + Math.floor(index / 3) * 150;
      if (nodes.every((node) => x >= node.x + 230 || node.x >= x + 230 || y >= node.y + 122 || node.y >= y + 122)) return { x, y };
    }
  }
  function addNodeToFlow(type: FlowNodeType, x?: number, y?: number, fromId?: string, port?: FlowPort): void {
    if (!selectedFlow || preview) return;
    let index = 1;
    const kind = type.replaceAll(".", "-");
    while (selectedFlow.nodes.some((node) => node.id === `${selectedFlow.id}-${kind}-${index}`)) index++;
    const position = nextFlowNodePosition(selectedFlow.nodes);
    const node = createFlowNode(`${selectedFlow.id}-${kind}-${index}`, type, x ?? position.x, y ?? position.y);
    let next = addFlowNode(selectedFlow, node);
    if (next === selectedFlow) { status = "このFlowには既に起点Nodeがあります。"; return; }
    if (fromId && port) next = setFlowEdge(next, fromId, port, node.id);
    changeFlow(next);
    selectFlowNode(node.id);
  }
  function startNodeDrag(event: DragEvent, type: FlowNodeType): void {
    if (preview || !selectedFlow || !event.dataTransfer) { event.preventDefault(); return; }
    cancelGrab();
    draggedFlowNodeType = type;
    event.dataTransfer.setData("application/x-flagship-flow-node", type);
    event.dataTransfer.setData("text/plain", type);
    event.dataTransfer.effectAllowed = "copy";
  }
  function deleteFlow(): void {
    if (!selectedFlowId) return;
    flows = flows.filter((flow) => flow.id !== selectedFlowId);
    selectedFlowId = flows[0]?.id ?? null; selectedFlowNodeId = null;
    status = "Flowを削除しました。";
  }
  function deleteSelectedFlowNode(): void {
    if (!selectedFlow || !selectedFlowNodeId || preview) return;
    if (!selectedFlow.nodes.some((node) => node.id === selectedFlowNodeId)) return;
    changeFlow(removeFlowNode(selectedFlow, selectedFlowNodeId));
    selectedFlowNodeId = null;
    status = "選択したNodeを削除しました。";
  }
  function copySelectedFlowNode(): void {
    const node = selectedFlow?.nodes.find((item) => item.id === selectedFlowNodeId);
    if (!node || preview) return;
    copiedFlowNode = $state.snapshot(node);
    flowPasteSequence = 0;
    status = "Nodeをコピーしました。";
  }
  function pasteCopiedFlowNode(): void {
    if (!selectedFlow || !copiedFlowNode || preview) return;
    const kind = copiedFlowNode.type.replaceAll(".", "-");
    let index = 1;
    while (selectedFlow.nodes.some((node) => node.id === `${selectedFlow.id}-${kind}-${index}`)) index++;
    const offset = 40 * ++flowPasteSequence;
    const node: FlowNode = { ...copiedFlowNode, id: `${selectedFlow.id}-${kind}-${index}`, x: copiedFlowNode.x + offset, y: copiedFlowNode.y + offset };
    const next = addFlowNode(selectedFlow, node);
    if (next === selectedFlow) { status = "このFlowには既に起点Nodeがあります。"; return; }
    if (!changeFlow(next)) return;
    selectFlowNode(node.id);
    status = "Nodeを貼り付けました。";
  }
  function togglePreview(): void {
    preview = !preview; clearDrag(); executionToken++;
    cancelGrab(); virtualCursor = null;
    previewValues = {}; previewVariables = {}; previewConstants = {}; executionLog = []; execution = null;
    status = "";
    pendingLoadFlows = []; lastLoadedPageId = null;
    if (preview) previewPageId = activePageId;
  }
  function logFlow(flowId: string, nodeId: string | null, message: string): void {
    if (!preview) return;
    executionLog = [...executionLog.slice(-199), { id: ++logSequence, flowId, nodeId, message }];
    console.info("[Flow Preview]", flowId, nodeId ?? "", message);
  }
  function previewChange(node: ComponentNode): void {
    if ("coreType" in node && node.coreType === "input") {
      const value = node.fields.value.value;
      previewValues = { ...previewValues, [node.id]: value,
        [flowFieldValueKey({ kind: "field", pageId: previewPageId, componentId: node.id, fieldKey: "value" })]: value };
      const original = pageComponents(pages, previewPageId).find((item) => item.id === node.id)?.node;
      if (original && "coreType" in original && original.coreType === "input") {
        updateComponent(withField(original, "value", value));
      }
    }
  }
  function activateClick(componentId: string): void {
    if (!preview || execution?.status === "paused" || execution?.status === "running") return;
    const flow = flows.find((item) => item.scope.kind === "page" && item.scope.pageId === previewPageId &&
      item.nodes.some((node) => node.type === "trigger.event" && node.event === "click" && node.componentId === componentId));
    if (!flow) return;
    if (flowErrors(flow, pages, flows).length) { status = "Flowの設定を確認してください。"; return; }
    startFlow(flow);
  }
  function startFlow(flow: FlowGraph): void {
    if (!preview || execution?.status === "paused" || execution?.status === "running") return;
    const trigger = flow.nodes.find((node) => node.type.startsWith("trigger."));
    if (!trigger || flowErrors(flow, pages, flows).length) return;
    selectedFlowId = flow.id;
    execution = { flowId: flow.id, nodeId: trigger.id, status: "running", visited: [] };
    logFlow(flow.id, trigger.id, "START");
    void runFlow(flow, trigger.id, false, false, ++executionToken);
  }
  async function runFlow(flow: FlowGraph, firstNodeId: string, step: boolean, skipFirstBreakpoint: boolean, token: number): Promise<void> {
    let nodeId: string | null = firstNodeId;
    let first = true;
    const visited = execution?.flowId === flow.id ? [...execution.visited] : [];
    while (nodeId && preview && token === executionToken) {
      const node: FlowGraph["nodes"][number] | undefined = flow.nodes.find((item) => item.id === nodeId);
      if (!node) break;
      if (flow.breakpoints.includes(nodeId) && !(first && skipFirstBreakpoint)) {
        execution = { flowId: flow.id, nodeId, status: "paused", visited };
        logFlow(flow.id, nodeId, "BREAKPOINT / PAUSED"); return;
      }
      execution = { flowId: flow.id, nodeId, status: "running", visited: [...visited] };
      logFlow(flow.id, nodeId, `RUN ${node.type}`);
      await new Promise<void>((resolve) => setTimeout(resolve, 180));
      if (!preview || token !== executionToken) return;
      let port: "next" | "true" | "false" = "next";
      if (node.type === "logic.condition") {
        port = evaluateCondition(node.condition, flow, pages, previewValues, previewVariables, previewConstants).port;
        logFlow(flow.id, node.id, `${node.condition.operator.toUpperCase()} → ${port.toUpperCase()}`);
      }
      if (node.type === "action.set-variable" && node.target) {
        const value = readFlowValue(node.value, flow, pages, previewValues, previewVariables, previewConstants);
        if (node.target.kind === "variable") {
          if (node.target.variableId in previewVariables) {
            previewVariables = { ...previewVariables, [node.target.variableId]: value ?? "" };
            logFlow(flow.id, node.id, "SET VAR");
          } else logFlow(flow.id, node.id, "SET VAR / 未初期化のためスキップ");
        } else {
          previewValues = setFlowFieldValue(previewValues, node.target, value ?? "", pages);
          logFlow(flow.id, node.id, "SET FIELD");
        }
      }
      if (node.type === "action.init-variable") {
        previewVariables = { ...previewVariables, [node.id]: node.initialValue };
        logFlow(flow.id, node.id, "INIT VAR");
      }
      if (node.type === "action.init-constant") {
        previewConstants = { ...previewConstants, [node.id]: node.initialValue };
        logFlow(flow.id, node.id, "INIT CONST");
      }
      if (node.type === "action.navigate" && node.targetPageId) {
        previewPageId = node.targetPageId;
        logFlow(flow.id, node.id, "NAVIGATE");
      }
      visited.push(node.id);
      const next = nextNode(flow, node.id, port);
      if (!next) {
        execution = { flowId: flow.id, nodeId: node.id, status: "done", visited };
        logFlow(flow.id, node.id, "DONE");
        status = flow.name + "を実行しました。";
        return;
      }
      if (step) { execution = { flowId: flow.id, nodeId: next, status: "paused", visited }; logFlow(flow.id, next, "STEP / PAUSED"); return; }
      nodeId = next; first = false;
    }
    if (token === executionToken) { execution = { flowId: flow.id, nodeId: null, status: "done", visited }; logFlow(flow.id, null, "DONE"); }
  }
  function resumeFlow(step: boolean): void {
    if (!preview || !execution || execution.status !== "paused" || !execution.nodeId) return;
    const flow = flows.find((item) => item.id === execution?.flowId);
    if (flow) void runFlow(flow, execution.nodeId, step, true, ++executionToken);
  }
  function scheduleFlows(scope: "project" | "page", pageId: string): () => void {
    const handles: number[] = [];
    for (const flow of flows) {
      if (flow.scope.kind !== scope || (flow.scope.kind === "page" && flow.scope.pageId !== pageId)) continue;
      const trigger = flow.nodes.find((node) => node.type === "trigger.schedule");
      if (!trigger || trigger.type !== "trigger.schedule" || untrack(() => flowErrors(flow, pages, flows)).length) continue;
      const fire = () => { if (preview && (scope === "project" || previewPageId === pageId)) startFlow(flow); };
      if (trigger.mode === "interval") handles.push(window.setInterval(fire, trigger.milliseconds));
      else {
        const delay = trigger.mode === "after" ? trigger.milliseconds : Date.parse(trigger.dateTime ?? "") - Date.now();
        if (delay >= 0) handles.push(window.setTimeout(fire, delay));
      }
    }
    return () => handles.forEach((handle) => { clearTimeout(handle); clearInterval(handle); });
  }
  $effect(() => {
    if (!preview) return;
    return scheduleFlows("project", "");
  });
  $effect(() => {
    if (!preview) return;
    return scheduleFlows("page", previewPageId);
  });
  $effect(() => {
    if (!preview || lastLoadedPageId === previewPageId) return;
    const pageId = previewPageId;
    lastLoadedPageId = pageId;
    pendingLoadFlows = flows.filter((flow) => flow.scope.kind === "page" && flow.scope.pageId === pageId &&
      flow.nodes.some((node) => node.type === "trigger.load")).map((flow) => flow.id);
  });
  $effect(() => {
    if (!preview || !pendingLoadFlows.length || execution?.status === "running" || execution?.status === "paused") return;
    const [flowId, ...remaining] = pendingLoadFlows;
    pendingLoadFlows = remaining;
    const flow = flows.find((item) => item.id === flowId);
    if (flow) startFlow(flow);
  });

  function clearDrag(): void { dragSource = null; dropTarget = null; dragReject = ""; }
  function switchRoot(pageId: string, root: PageSlot): void {
    expandedRoots[pageId + ":" + root] = true;
    activePageId = pageId; activeRoot = root; selectedId = null; detailsOpen = false; clearDrag();
    chooseInsertionTarget(pageId, root, null, root);
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
    if (activePageId !== pageId) chooseInsertionTarget(pageId, "context", null, "context");
    activePageId = pageId; activeRoot = selectedRoot; selectedId = id; detailsOpen = true;
  }
  function closeDetails(): void {
    detailsOpen = false;
    const id = selectedId;
    if (id) queueMicrotask(() => {
      const treeNode = document.querySelector<HTMLElement>(`[data-tree-node="${id}"]`);
      if (treeNode?.getClientRects().length) treeNode.focus();
      else (document.querySelector<HTMLElement>(`[data-page-id="${id}"] .page-object`) ?? document.querySelector<HTMLElement>(`.canvas-stage [data-object-id="${id}"]`))?.focus();
    });
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
    cancelGrab();
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
      dropTarget = null; dragReject = "この位置には配置できません";
      if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
      return;
    }
    event.preventDefault(); dropTarget = target; dragReject = "";
    if (event.dataTransfer) event.dataTransfer.dropEffect = dragSource.type === "library" ? "copy" : "move";
  }
  function objectTarget(event: DragEvent, node: WidgetNode): DropTarget {
    return componentTarget(event.currentTarget as HTMLElement, node, event.clientX, event.clientY);
  }
  function componentTarget(element: HTMLElement, node: WidgetNode, x: number, y: number): DropTarget {
    const bounds = element.getBoundingClientRect();
    const slotKey = node.kind === "button" ? "contents" : node.kind === "paragraph" ? "text" : undefined;
    const direction = dropDirection(x, y, bounds, node.kind === "container" || node.kind === "textbox" || !!slotKey);
    const ownTarget: DropTarget = { pageId: activePageId, root: activeRoot, id: node.id,
      direction, slotKey: direction === "inside" ? slotKey : undefined };
    if (slotKey && direction === "inside" && (heldComponent ?? dragSource) && canDropInPages(pages, (heldComponent ?? dragSource)!, ownTarget)) return ownTarget;
    // 内容にフィットしたコンテナでは中央に子があるため、子の中央へのドロップも親の内側として扱う。
    if (node.kind !== "container" && node.kind !== "textbox" && dropDirection(x, y, bounds, true) === "inside") {
      const parent = element.parentElement?.closest<HTMLElement>('.scene-object[data-kind="container"], .scene-object[data-kind="textbox"]');
      if (parent && dropDirection(x, y, parent.getBoundingClientRect(), true) === "inside") {
        return { pageId: activePageId, root: activeRoot, id: parent.dataset.objectId!, direction: "inside" };
      }
    }
    return ownTarget;
  }
  function treeNodeTarget(event: DragEvent, node: WidgetNode, pageId: string, root: PageSlot): DropTarget {
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    return { pageId, root, id: node.id, orderOnly: true,
      direction: event.clientY < bounds.top + bounds.height / 2 ? "above" : "below" };
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
  function approveReplacement(source: DragSource, target: DropTarget): boolean {
    if (!target.id || !target.slotKey) return true;
    const page = pages.find((item) => item.id === target.pageId);
    const owner = page && findComponent(page.fields[target.root].value, target.id);
    const slot = owner && slotsOf(owner).find(([key]) => key === target.slotKey)?.[1];
    const replaced = slot && !slot.multiple ? slotNodes(slot).filter((child) => source.type !== "instance" || child.id !== source.id) : [];
    return !replaced?.length || window.confirm(`${displayName(owner!)} / ${slot!.name} の ${replaced.map(displayName).join("、")} を置き換えますか？`);
  }
  function drop(event: DragEvent, target: DropTarget): void {
    if (preview || !dragSource) return;
    event.preventDefault(); event.stopPropagation();
    if (canDropInPages(pages, dragSource, target) && approveReplacement(dragSource, target)) applyDrop(target);
    clearDrag();
  }
  function addComponent(kind: ComponentKind): void {
    if (preview || !insertionInfo || !acceptsKind(insertionInfo.slot, kind)) return;
    dragSource = { type: "library", kind };
    if (approveReplacement(dragSource, insertionInfo.drop)) applyDrop(insertionInfo.drop);
    clearDrag();
  }
  function deleteSelected(): void {
    if (preview || !selected) return;
    if (selected.kind === "page") {
      const index = pages.findIndex((page) => page.id === selected.id);
      const remaining = pages.filter((page) => page.id !== selected.id);
      pages = remaining.length ? remaining : [createPage(++pageSequence)];
      activePageId = pages[Math.min(index, pages.length - 1)].id;
      activeRoot = "context"; selectedId = null; detailsOpen = false;
      insertionTarget = { pageId: activePageId, root: "context", id: null, slotKey: "context" };
      expandedRoots[activePageId + ":context"] = true;
      collapsedPages[activePageId] = false;
      status = "ページを削除しました。";
      return;
    }
    const nodes = removeComponent(activePage.fields[activeRoot].value, selected.id);
    pages = pages.map((page) => page.id === activePageId ? { ...page, fields: { ...page.fields, [activeRoot]: { ...page.fields[activeRoot], value: nodes } } } : page);
    selectedId = null; detailsOpen = false; status = "選択したコンポーネントを削除しました。";
  }
  function resizeTree(event: PointerEvent): void {
    const bounds = editorBody.getBoundingClientRect();
    treeWidth = clamp(event.clientX - bounds.left - HANDLE_SIZE / 2, MIN_TREE_WIDTH, bounds.width - MIN_CANVAS_WIDTH - HANDLE_SIZE);
  }
  function resizeRegistry(event: PointerEvent): void {
    const bounds = treePanel.getBoundingClientRect();
    const padding = getComputedStyle(treePanel);
    const top = Number.parseFloat(padding.paddingTop);
    const bottom = Number.parseFloat(padding.paddingBottom);
    const available = bounds.height - top - bottom;
    registryRatio = clamp((event.clientY - bounds.top - top) / available, 0.2, 0.8);
  }
  function splitLimits(horizontal: boolean): { available: number; minimum: number; maximum: number } {
    const bounds = workspaceLayout.getBoundingClientRect();
    const available = Math.max(0, (horizontal ? bounds.width : bounds.height) - WORKSPACE_HANDLE_SIZE);
    const minimum = Math.min(horizontal ? MIN_SPLIT_PANE_WIDTH : MIN_SPLIT_PANE_HEIGHT, available / 2);
    return { available, minimum, maximum: available - minimum };
  }
  function resizeWorkspace(event: PointerEvent): void {
    const horizontal = viewMode === "split-horizontal";
    const bounds = workspaceLayout.getBoundingClientRect();
    const { available, minimum, maximum } = splitLimits(horizontal);
    if (!available) return;
    const coordinate = horizontal ? event.clientX - bounds.left : event.clientY - bounds.top;
    const ratio = clamp(coordinate - WORKSPACE_HANDLE_SIZE / 2, minimum, maximum) / available;
    if (horizontal) horizontalSplitRatio = ratio;
    else verticalSplitRatio = ratio;
  }
  function resizeWorkspaceWithKeyboard(event: KeyboardEvent): void {
    const horizontal = viewMode === "split-horizontal";
    const { available, minimum, maximum } = splitLimits(horizontal);
    if (!available) return;
    applyKeyboardResize(event, horizontal ? "ArrowLeft" : "ArrowUp", horizontal ? "ArrowRight" : "ArrowDown",
      horizontal ? horizontalSplitRatio : verticalSplitRatio, minimum / available, maximum / available,
      (ratio) => { if (horizontal) horizontalSplitRatio = ratio; else verticalSplitRatio = ratio; }, 16 / available);
  }
  onMount(() => {
    const observer = new ResizeObserver(() => {
      const horizontal = splitLimits(true);
      const vertical = splitLimits(false);
      if (horizontal.available) horizontalSplitRatio = clamp(horizontalSplitRatio, horizontal.minimum / horizontal.available, horizontal.maximum / horizontal.available);
      if (vertical.available) verticalSplitRatio = clamp(verticalSplitRatio, vertical.minimum / vertical.available, vertical.maximum / vertical.available);
    });
    observer.observe(workspaceLayout);
    window.addEventListener("keydown", keyboardAction, true);
    window.addEventListener("click", keyboardClick, true);
    window.addEventListener("pointerdown", keyboardPointer, true);
    window.addEventListener("focusin", keyboardFocus);
    window.addEventListener("resize", clampCursor);
    return () => {
      observer.disconnect();
      window.removeEventListener("keydown", keyboardAction, true);
      window.removeEventListener("click", keyboardClick, true);
      window.removeEventListener("pointerdown", keyboardPointer, true);
      window.removeEventListener("focusin", keyboardFocus);
      window.removeEventListener("resize", clampCursor);
    };
  });
  function isEditable(target: EventTarget | null): boolean {
    return target instanceof Element && !!target.closest('input, textarea, select, [contenteditable="true"]');
  }
  function copySelected(): void {
    if (!selected || preview) return;
    copied = selected;
    status = displayName(selected) + "をコピーしました。";
  }
  function copyPage(source: PageComponent): PageComponent {
    const fresh = createPage(++pageSequence);
    const allocateId = (kind: ComponentKind) => kind + "-" + ++sequence;
    return { ...source, id: fresh.id, fields: { ...source.fields,
      name: { ...source.fields.name, value: displayName(source) + " Copy" },
      path: fresh.fields.path,
      context: { ...source.fields.context, value: source.fields.context.value.map((node) => duplicateWidget(node, allocateId)) },
      overlay: { ...source.fields.overlay, value: source.fields.overlay.value.map((node) => duplicateWidget(node, allocateId)) },
    } };
  }
  function pasteCopied(): void {
    if (!copied || preview) return;
    if (copied.kind === "page") {
      const page = copyPage(copied);
      pages = [...pages, page];
      activePageId = page.id; activeRoot = "context"; selectedId = page.id; detailsOpen = true;
      expandedRoots[page.id + ":context"] = true;
      status = displayName(page) + "を貼り付けました。";
      return;
    }
    const node = duplicateWidget(copied, (kind) => kind + "-" + ++sequence);
    const source = { type: "library" as const, kind: node.kind };
    const adjacent: DropTarget = { pageId: activePageId, root: activeRoot, id: selected && selected.kind !== "page" ? selected.id : null, direction: "below", orderOnly: true };
    let next = adjacent.id ? placeInPages(pages, node, source, adjacent) : pages;
    if (next === pages) next = placeInPages(pages, node, source, { pageId: activePageId, root: activeRoot, id: null, direction: "inside" });
    if (next === pages) return;
    pages = next; selectedId = node.id; detailsOpen = true;
    status = displayName(node) + "を貼り付けました。";
  }
  function cancelGrab(): void {
    heldComponent = null; heldFlow = null; clearDrag();
  }
  function centerOf(element: Element): { x: number; y: number } {
    const bounds = element.getBoundingClientRect();
    return { x: clamp((Math.max(0, bounds.left) + Math.min(innerWidth, bounds.right)) / 2, 1, innerWidth - 1),
      y: clamp((Math.max(0, bounds.top) + Math.min(innerHeight, bounds.bottom)) / 2, 1, innerHeight - 1) };
  }
  function cursorOrigin(): Element {
    const focused = document.activeElement;
    return focused && focused !== document.body ? focused
      : document.querySelector(`[data-object-id="${selectedId}"], [data-flow-node-id="${selectedFlowNodeId}"] .flow-node-main`)
        ?? document.querySelector(".canvas-viewport, .flow-graph") ?? document.body;
  }
  function clampCursor(): void {
    if (virtualCursor) virtualCursor = { x: clamp(virtualCursor.x, 1, innerWidth - 1), y: clamp(virtualCursor.y, 1, innerHeight - 1) };
    refreshCursorTarget();
  }
  function moveCursor(dx: number, dy: number, scrollOnly = false): void {
    if (!virtualCursor) return;
    let point = { x: virtualCursor.x + (scrollOnly ? 0 : dx), y: virtualCursor.y + (scrollOnly ? 0 : dy) };
    let element = document.elementFromPoint(virtualCursor.x, virtualCursor.y);
    while (element instanceof HTMLElement) {
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      const left = Math.max(1, bounds.left + element.clientLeft), top = Math.max(1, bounds.top + element.clientTop);
      const right = Math.min(innerWidth - 1, bounds.left + element.clientLeft + element.clientWidth);
      const bottom = Math.min(innerHeight - 1, bounds.top + element.clientTop + element.clientHeight);
      const horizontal = dx && /auto|scroll/.test(style.overflowX) && (dx < 0 ? element.scrollLeft > 0 : element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
      const vertical = dy && /auto|scroll/.test(style.overflowY) && (dy < 0 ? element.scrollTop > 0 : element.scrollTop + element.clientHeight < element.scrollHeight - 1);
      if (horizontal && (scrollOnly || (dx < 0 ? point.x <= left + 16 : point.x >= right - 16))) {
        element.scrollLeft += dx;
        if (!scrollOnly) point.x = clamp(point.x, left + 16, right - 16);
        break;
      }
      if (vertical && (scrollOnly || (dy < 0 ? point.y <= top + 16 : point.y >= bottom - 16))) {
        element.scrollTop += dy;
        if (!scrollOnly) point.y = clamp(point.y, top + 16, bottom - 16);
        break;
      }
      element = element.parentElement;
    }
    virtualCursor = point;
    clampCursor();
  }
  function keyboardFocus(event: FocusEvent): void {
    if (!virtualCursor || !(event.target instanceof Element)) return;
    virtualCursor = centerOf(event.target);
    refreshCursorTarget();
  }
  function placementAt(element: Element, point: { x: number; y: number }): DropTarget | null {
    if (element.closest(".tree-toggle, .tree-visibility, .details-pane, .inspector-scrim")) return null;
    const object = element.closest<HTMLElement>(".scene-object[data-object-id]");
    if (object) {
      const node = findComponent(activePage.fields[activeRoot].value, object.dataset.objectId!);
      return node ? componentTarget(object, node, point.x, point.y) : null;
    }
    const row = element.closest<HTMLElement>("[data-tree-node]");
    const slot = element.closest<HTMLElement>(".tree-slot[data-slot-owner]");
    const page = element.closest<HTMLElement>("[data-page-id]");
    const rootSlot = element.closest<HTMLElement>(".root-slot[data-slot-key]");
    if (page && rootSlot && (row || slot)) {
      const root = rootSlot.dataset.slotKey as PageSlot;
      if (row) {
        const bounds = row.getBoundingClientRect();
        return { pageId: page.dataset.pageId, root, id: row.dataset.treeNode!, orderOnly: true,
          direction: point.y < bounds.top + bounds.height / 2 ? "above" : "below" };
      }
      return { pageId: page.dataset.pageId, root, id: slot!.dataset.slotOwner === page.dataset.pageId ? null : slot!.dataset.slotOwner!,
        slotKey: slot!.dataset.slotOwner === page.dataset.pageId ? undefined : slot!.dataset.slotKey, direction: "inside" };
    }
    const stage = element.closest(".canvas-stage[data-canvas-root]");
    return stage ? { pageId: activePageId, root: activeRoot, id: null, direction: "inside" } : null;
  }
  function refreshCursorTarget(): void {
    if (!virtualCursor || !heldComponent) return;
    const element = document.elementFromPoint(virtualCursor.x, virtualCursor.y);
    const target = element ? placementAt(element, virtualCursor) : null;
    dropTarget = target && canDropInPages(pages, heldComponent, target) ? target : null;
    dragReject = target && !dropTarget ? "この位置には配置できません。横並びはContainerのDirectionで指定してください。" : "";
  }
  function grabAt(element: Element, point: { x: number; y: number }): void {
    const flowLibrary = element.closest<HTMLElement>("[data-flow-node-kind]");
    const flowCard = element.closest<HTMLElement>("[data-flow-node-id]");
    if (flowLibrary || flowCard) {
      if (!selectedFlow) { status = "Flowを選択してください。"; return; }
      const node = flowCard ? selectedFlow.nodes.find((item) => item.id === flowCard.dataset.flowNodeId) : null;
      const type = node?.type ?? FLOW_NODE_LIBRARY.find((item) => item.type === flowLibrary?.dataset.flowNodeKind)?.type;
      if (!type) return;
      document.querySelector<HTMLButtonElement>('.flow-inspector:not([hidden]) .inspector-close')?.click();
      if (virtualCursor) virtualCursor = point;
      const boardElement = document.querySelector<HTMLElement>(".flow-board");
      const board = boardElement?.getBoundingClientRect();
      const zoom = Number(boardElement?.dataset.flowZoom ?? 1);
      heldFlow = { flowId: selectedFlow.id, nodeId: node?.id ?? null, type,
        offsetX: node && board ? (point.x - board.left) / zoom - node.x : 0,
        offsetY: node && board ? (point.y - board.top) / zoom - node.y : 0 };
      detailsOpen = false;
      status = "Flow Nodeを掴みました。Tabまたは仮想カーソルで移動し、Ctrl+Enterで離します。";
      return;
    }
    const library = element.closest<HTMLElement>("[data-library-kind]");
    if (library) heldComponent = { type: "library", kind: library.dataset.libraryKind as ComponentKind };
    else {
      const object = element.closest<HTMLElement>("[data-object-id], [data-tree-node]");
      const pageId = object?.closest<HTMLElement>("[data-page-id]")?.dataset.pageId ?? activePageId;
      const page = pages.find((item) => item.id === pageId);
      const id = object?.dataset.objectId ?? object?.dataset.treeNode;
      if (!page || !id) { status = "Libraryの見本または移動する部品にフォーカスしてください。"; return; }
      const root = findComponent(page.fields.context.value, id) ? "context" : "overlay";
      if (!findComponent(page.fields[root].value, id)) return;
      heldComponent = { type: "instance", pageId, root, id };
    }
    detailsOpen = false;
    status = "部品を掴みました。Tabまたは仮想カーソルで移動し、クリック・Enter・Ctrl+Enterで離します。";
    refreshCursorTarget();
  }
  function placeGrabAt(element: Element, point: { x: number; y: number }): boolean {
    if (heldFlow) {
      const board = element.closest<HTMLElement>(".flow-board");
      if (!board || selectedFlow?.id !== heldFlow.flowId) return false;
      const bounds = board.getBoundingClientRect();
      const zoom = Number(board.dataset.flowZoom ?? 1);
      const x = Math.max(0, Math.round((point.x - bounds.left) / zoom - heldFlow.offsetX));
      const y = Math.max(0, Math.round((point.y - bounds.top) / zoom - heldFlow.offsetY));
      if (heldFlow.nodeId) changeFlow({ ...selectedFlow, nodes: selectedFlow.nodes.map((node) => node.id === heldFlow!.nodeId ? { ...node, x, y } : node) });
      else {
        if (heldFlow.type.startsWith("trigger.") && selectedFlow.nodes.some((node) => node.type.startsWith("trigger."))) {
          status = "このFlowには既に起点Nodeがあります。"; return true;
        }
        addNodeToFlow(heldFlow.type, x, y);
      }
      cancelGrab(); status = "Flow Nodeを配置しました。"; return true;
    }
    if (!heldComponent) return false;
    const target = placementAt(element, point);
    if (!target) return false;
    if (!canDropInPages(pages, heldComponent, target)) { status = "この位置には配置できません。横並びはContainerのDirectionで指定してください。"; return true; }
    if (!approveReplacement(heldComponent, target)) return true;
    dragSource = heldComponent;
    applyDrop(target); cancelGrab(); return true;
  }
  function keyboardClick(event: MouseEvent): void {
    if (preview || !(event.target instanceof Element)) return;
    const point = event.clientX || event.clientY ? { x: event.clientX, y: event.clientY } : centerOf(event.target);
    if (virtualCursor && event.detail > 0) virtualCursor = point;
    if ((heldComponent || heldFlow) && event.target.closest(".library-item")) { event.preventDefault(); event.stopImmediatePropagation(); status = "配置できる対象へ移動してください。"; return; }
    if (placeGrabAt(event.target, point)) { event.preventDefault(); event.stopImmediatePropagation(); }
  }
  function keyboardPointer(event: PointerEvent): void {
    if (!preview && (heldComponent || heldFlow)) event.stopImmediatePropagation();
  }
  function activateCursor(): void {
    if (!virtualCursor) return;
    const point = virtualCursor;
    let element = document.elementFromPoint(point.x, point.y);
    if (!element) return;
    if ((heldComponent || heldFlow) && placeGrabAt(element, point)) return;
    const library = element.closest(".library-item");
    if (library && !element.closest("button")) element = library.querySelector(".library-add") ?? element;
    const control = element.closest<HTMLElement>('button, input, textarea, select, a, [role="button"], [tabindex]');
    control?.focus({ preventScroll: true });
    virtualCursor = point;
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: point.x, clientY: point.y }));
  }
  function keyboardAction(event: KeyboardEvent): void {
    const control = event.ctrlKey || event.metaKey;
    if (!preview && control && event.shiftKey && !event.altKey && event.key.toLowerCase() === "p") {
      event.preventDefault(); event.stopImmediatePropagation();
      if (event.repeat) return;
      if (virtualCursor) { virtualCursor = null; cancelGrab(); status = "仮想カーソル OFF"; }
      else { virtualCursor = centerOf(cursorOrigin()); status = "仮想カーソル ON · 矢印で移動 / Ctrl+Enterで掴む・離す"; }
      return;
    }
    if (!preview && virtualCursor && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) && !control) {
      event.preventDefault(); event.stopImmediatePropagation();
      const step = event.altKey ? 2 : event.shiftKey ? 48 : 12;
      moveCursor(event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0,
        event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0);
      return;
    }
    if (!preview && virtualCursor && !control && ["PageUp", "PageDown"].includes(event.key)) {
      event.preventDefault(); event.stopImmediatePropagation();
      const step = event.key === "PageUp" ? -240 : 240;
      moveCursor(event.shiftKey ? step : 0, event.shiftKey ? 0 : step, true);
      return;
    }
    if (!preview && control && !event.shiftKey && !event.altKey && event.key === "Enter") {
      event.preventDefault(); event.stopImmediatePropagation();
      if (event.repeat) return;
      const point = virtualCursor ?? centerOf(cursorOrigin());
      const element = virtualCursor ? document.elementFromPoint(point.x, point.y) : cursorOrigin();
      if (!element) return;
      if (heldComponent || heldFlow) {
        if (!placeGrabAt(element, point)) status = "配置できる対象へ移動してください。Escapeで取り消せます。";
      } else grabAt(element, point);
      return;
    }
    if (!preview && !control && !event.altKey && event.key === "Enter" && (virtualCursor || heldComponent || heldFlow)) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (event.repeat) return;
      if (virtualCursor) activateCursor();
      else if (event.target instanceof HTMLElement) event.target.click();
      return;
    }
    if (event.key === "Escape") { clearDrag(); cancelGrab(); if (detailsVisible) closeDetails(); status = "操作を取り消しました。"; return; }
    if (isEditable(event.target) || preview) return;
    if (view === "flow") {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "c" && selectedFlowNodeId) {
        event.preventDefault(); copySelectedFlowNode();
      } else if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "v" && copiedFlowNode) {
        event.preventDefault(); pasteCopiedFlowNode();
      } else if (event.key === "Delete" && selectedFlowNodeId) {
        event.preventDefault(); deleteSelectedFlowNode();
      }
      return;
    }
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "c" && selected) {
      event.preventDefault(); copySelected();
    } else if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "v" && copied) {
      event.preventDefault(); pasteCopied();
    } else if (event.key === "Delete" && selected) {
      event.preventDefault(); deleteSelected();
    }
  }
</script>
<svelte:window ondragend={clearDrag} />
<main class="editor-shell" style:--tree-width={(libraryOpen || treeOpen ? treeWidth : 48) + "px"} style:--registry-share={registryRatio * 100 + "%"}>
  <header class="editor-header"><h1>FlagShip</h1>
    <nav class="view-switch" aria-label="編集画面"><button type="button" class:active={viewMode === "canvas"} aria-current={viewMode === "canvas" ? "page" : undefined} onclick={() => chooseViewMode("canvas")}>Canvas</button><button type="button" class:active={viewMode === "flow"} aria-current={viewMode === "flow" ? "page" : undefined} onclick={() => chooseViewMode("flow")}>Flow</button><button type="button" class:active={viewMode === "split-vertical"} aria-current={viewMode === "split-vertical" ? "page" : undefined} onclick={() => chooseViewMode("split-vertical")}>上下分割</button><button type="button" class:active={viewMode === "split-horizontal"} aria-current={viewMode === "split-horizontal" ? "page" : undefined} onclick={() => chooseViewMode("split-horizontal")}>左右分割</button></nav>
    <span class="header-context" aria-live="polite">編集中: {view === "canvas" ? `Canvas · ${activePage.fields.path.value} / ${activePage.fields[activeRoot].name}` : `Flow · ${selectedFlow?.name ?? "未選択"}`}{preview ? " · Preview" : ""}</span></header>
  <div class="editor-body" bind:this={editorBody}>
    <aside id="tree-panel" class="panel tree-panel" class:library-collapsed={!libraryOpen} class:tree-collapsed={!treeOpen} class:all-collapsed={!libraryOpen && !treeOpen} aria-label="Registry and Tree" bind:this={treePanel}>
      <section class="registry-section" class:collapsed={!libraryOpen} aria-labelledby="registry-heading">
        <div class="section-heading"><h2 id="registry-heading">Registry</h2><span class="pane-context-label">{view === "canvas" ? "Canvas" : "Flow"}</span><span class="count">{String(COMPONENT_LIBRARIES.length).padStart(2, "0")}</span><button type="button" class="panel-collapse" aria-label={libraryOpen ? "Libraryを縮小" : "Libraryを展開"} aria-expanded={libraryOpen} aria-controls="registry-content" onclick={() => libraryOpen=!libraryOpen}>{libraryOpen ? "−" : "+"}</button></div>
        <div id="registry-content" class="registry-scroll" hidden={!libraryOpen}>
          {#if view === "canvas"}
          <div class="registry-controls">
            <div class="library-context">Canvas Library</div>
            <label class="registry-search"><span class="visually-hidden">コンポーネント名で検索</span>
              <input type="search" placeholder="コンポーネント名で検索" bind:value={registryQuery} />
            </label>
            <label class="registry-library-filter"><span>Library</span>
              <select bind:value={selectedCanvasLibraryId} aria-label="ライブラリで絞り込む">
                <option value="">すべて</option>
                {#each COMPONENT_LIBRARIES as library (library.id)}<option value={library.id}>{library.name}</option>{/each}
              </select>
            </label>
          </div>
          <div class="insertion-target-banner" aria-live="polite"><span>追加先: {insertionInfo?.label ?? "無効です。Treeで選び直してください"}</span><button type="button" onclick={() => chooseInsertionTarget(activePageId, activeRoot, null, activeRoot)}>Page slot</button></div>
          <div class="registry-results">
            {#each registryResults as item, index (item.libraryId + ":" + item.kind)}
              {#if index === 0 || registryResults[index - 1].libraryId !== item.libraryId}
                <div class="registry-library-divider" data-library-id={item.libraryId} role="separator" aria-label={libraryName(item.libraryId)}>
                  <svg class="registry-folder-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 5.5h7l2 2h10v11h-19z"/></svg>
                  <span class="registry-library-name">{libraryName(item.libraryId)}</span>
                </div>
              {/if}
              {@const sample = createComponent(item.kind, 0)}
              <div class="library-item" role="group" aria-label={item.label + "のプレビュー"} data-library-kind={item.kind} data-library-id={item.libraryId}
                draggable={!preview} ondragstart={(event) => startDrag(event, { type: "library", kind: item.kind })}>
                <div class="library-thumbnail library-source" role="button" tabindex={preview ? -1 : 0} aria-label={item.label + "の見本"} aria-disabled={preview}
                  onclick={() => addComponent(item.kind)} onkeydown={(event) => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); event.currentTarget.click(); } }}>
                  <div class="thumbnail-content" aria-hidden="true" inert><ComponentView node={sample} editing /></div></div>
                <button type="button" class="library-add" aria-label={item.label + "を追加"} title={insertionInfo ? acceptsKind(insertionInfo.slot, item.kind) ? `${insertionInfo.label} に追加` : "この追加先には配置できません" : "追加先を選び直してください"} disabled={preview || !insertionInfo || !acceptsKind(insertionInfo.slot, item.kind)} onclick={() => addComponent(item.kind)}><span class="component-name-label">{item.title}</span><span aria-hidden="true">+</span></button>
              </div>
            {:else}
              <p class="registry-empty">一致するコンポーネントはありません</p>
            {/each}
          </div>
          {:else}
          <div class="registry-controls"><div class="library-context">Flow Library</div>
            <label class="registry-search"><span class="visually-hidden">Flow Node名で検索</span><input type="search" placeholder="Flow Node名で検索" bind:value={flowLibraryQuery} /></label>
            <label class="registry-library-filter"><span>Library</span>
              <select bind:value={selectedFlowLibraryId} aria-label="ライブラリで絞り込む">
                <option value="">すべて</option>
                {#each COMPONENT_LIBRARIES as library (library.id)}<option value={library.id}>{library.name}</option>{/each}
              </select>
            </label>
          </div>
          <div class="insertion-target-banner" aria-live="polite"><span>編集先: {selectedFlow?.name ?? "Flowを選択してください"}</span><button type="button" disabled={preview} onclick={addFlow}>新規作成</button></div>
          <div class="registry-results flow-library-results">
            {#each flowLibraryResults as item, index (item.type)}
              {#if index === 0 || flowLibraryResults[index - 1].libraryId !== item.libraryId}
                <div class="registry-library-divider" data-library-id={item.libraryId} role="separator" aria-label={libraryName(item.libraryId)}>
                  <svg class="registry-folder-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 5.5h7l2 2h10v11h-19z"/></svg>
                  <span class="registry-library-name">{libraryName(item.libraryId)}</span>
                </div>
              {/if}
              <div class="library-item flow-library-item" role="group" aria-label={item.name} data-flow-node-kind={item.type}
                draggable={!preview && !!selectedFlow} ondragstart={(event) => startNodeDrag(event, item.type)} ondragend={() => draggedFlowNodeType = null}>
                <div class="library-thumbnail flow-library-thumbnail library-source" role="button" tabindex={preview || !selectedFlow ? -1 : 0} aria-label={item.name + "の見本"} aria-disabled={preview || !selectedFlow}
                  onclick={() => addNodeToFlow(item.type)} onkeydown={(event) => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); event.currentTarget.click(); } }}>
                  <div class="flow-library-preview" aria-hidden="true" inert><span>{item.category}</span><strong>{item.name}</strong><span class="flow-library-preview-port"></span></div></div>
                <button type="button" class="library-add" aria-label={item.name + "を追加"} title="ドラッグして配置、またはクリックで追加" disabled={preview || !selectedFlow} onclick={() => addNodeToFlow(item.type)}><span class="component-name-label">{item.name}</span><span aria-hidden="true">+</span></button>
              </div>
            {:else}
              <p class="registry-empty">一致するNodeはありません</p>
            {/each}
          </div>
          {/if}
        </div>
      </section>
      <button type="button" class="resize-handle horizontal-resize-handle" hidden={!libraryOpen || !treeOpen} aria-label="RegistryとTreeの高さの割合を変更" aria-controls="registry-heading tree-heading"
        onpointerdown={(event) => beginPointerResize(event, resizeRegistry, "row-resize")}
        onkeydown={(event) => applyKeyboardResize(event,"ArrowUp","ArrowDown",registryRatio,0.2,0.8,(value) => registryRatio=value,0.025)}></button>
      <section class="tree-section" class:collapsed={!treeOpen} aria-labelledby="tree-heading">
        <div class="section-heading"><h2 id="tree-heading">{view === "flow" ? "Flows" : "Tree"}</h2><span class="pane-context-label">{view === "canvas" ? "Canvas" : "Flow"}</span><button type="button" class="panel-collapse" aria-label={treeOpen ? "Treeを縮小" : "Treeを展開"} aria-expanded={treeOpen} aria-controls="tree-content" onclick={() => treeOpen=!treeOpen}>{treeOpen ? "−" : "+"}</button></div>
        <div id="tree-content" hidden={!treeOpen}>
        <div class="tree-add-row" class:flow-add-row={view === "flow"}>{#if view === "canvas"}<span aria-hidden="true"></span>{/if}<button class="toolbar-button" type="button" disabled={preview} aria-label={view === "flow" ? "+ Flow" : "ページを追加"} onclick={view === "flow" ? addFlow : addPage}>{view === "flow" ? "+ Flow" : "+ Page"}</button></div>
        {#if view === "flow"}
          <div class="pages-heading">Trigger / Flow <span class="count">{flows.length}</span></div>
          <FlowList {flows} {pages} {selectedFlowId} onSelect={(id) => { selectedFlowId = id; selectFlowNode(null); }} />
        {:else}
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
              aria-pressed={selectedId === page.id} aria-label={displayName(page)} title={displayName(page)} onclick={() => selectComponent(page.id, page.id, "context")}>
              <span class="component-name-label">{displayName(page)}</span><span class="page-path">{page.fields.path.value}</span>
            </button>
            </div>
            <div id={page.id + "-slots"} hidden={collapsedPages[page.id]}>
            {#each ["context", "overlay"] as rootName}
              {@const root = rootName as PageSlot}
              {@const isActive = activePageId === page.id && activeRoot === root}
              {@const expanded = !!expandedRoots[page.id + ":" + root]}
              <div class="tree-slot root-slot" class:active={isActive} class:drop-active={dropTarget?.pageId === page.id && dropTarget.id === null && dropTarget.root === root}
                data-slot-owner={page.id} data-slot-key={root} role="group" aria-label={displayName(page) + " " + page.fields[root].name + " slotの配置先"}
                ondragover={(event) => hover(event, {pageId:page.id,root,id:null,direction:"inside"})}
                ondrop={(event) => drop(event, {pageId:page.id,root,id:null,direction:"inside"})}>
                <div class="tree-row">
                  <button type="button" class="tree-toggle" aria-label={displayName(page) + " " + page.fields[root].name + " slotの枝を開閉"}
                    aria-expanded={expanded} aria-controls={page.id + "-" + root + "-tree"}
                    onclick={() => expandedRoots[page.id + ":" + root] = !expanded}>
                    <span aria-hidden="true">{expanded ? "−" : "+"}</span>
                  </button>
                <button type="button" class="slot-heading root-heading" class:insertion-target={insertionTarget.pageId === page.id && insertionTarget.id === null && insertionTarget.root === root} aria-label={page.fields[root].name + " slot"}
                  aria-expanded={expanded} aria-controls={page.id + "-" + root + "-tree"} disabled={preview}
                  onclick={() => switchRoot(page.id, root)}>
                  <span>{page.fields[root].name}</span><span class="slot-type">{slotTypeLabel(page.fields[root])}</span><span class="count">{page.fields[root].value.length}</span>
                </button>
                </div>
                <div id={page.id + "-" + root + "-tree"} hidden={!expanded}>
                  <WidgetTree nodes={page.fields[root].value} {selectedId} {dropTarget} {hiddenInEditor} {insertionTarget} onHighlightLayout={(id) => highlightLayoutId = id}
                    onSelect={(id) => selectComponent(id, page.id, root)} onDrag={(event,node) => startInstanceDrag(event,node,page.id,root)}
                    onChooseSlot={(id,slotKey) => chooseInsertionTarget(page.id,root,id,slotKey)}
                    onToggleVisibility={(id) => hiddenInEditor[id] = !hiddenInEditor[id]}
                    onHoverNode={(event,node) => hover(event, treeNodeTarget(event,node,page.id,root))}
                    onHoverSlot={(event,id,slotKey) => hover(event,{pageId:page.id,root,id,slotKey,direction:"inside"})}
                    onDropNode={(event,node) => drop(event, treeNodeTarget(event,node,page.id,root))}
                    onDropSlot={(event,id,slotKey) => drop(event,{pageId:page.id,root,id,slotKey,direction:"inside"})} />
                  {#if page.fields[root].value.length === 0}<p class="slot-empty">Empty slot</p>{/if}
                </div>
              </div>
            {/each}
            </div>
          </div>
        {/each}
        {/if}
        </div>
      </section>
    </aside>
    <button type="button" class="resize-handle vertical-resize-handle" hidden={!libraryOpen && !treeOpen} aria-label="RegistryとTreeの横幅を変更" aria-controls="tree-panel"
      onpointerdown={(event) => beginPointerResize(event, resizeTree, "col-resize")}
      onkeydown={(event) => applyKeyboardResize(event,"ArrowLeft","ArrowRight",treeWidth,MIN_TREE_WIDTH,editorBody.clientWidth-MIN_CANVAS_WIDTH-HANDLE_SIZE,(value) => treeWidth=value)}></button>
    <section id="workspace-panel" class="panel canvas-panel" aria-label={viewMode === "canvas" ? "Canvas" : viewMode === "flow" ? "Flow" : "Workspace"}>
      <div bind:this={workspaceLayout} class="workspace-layout" class:split-vertical={viewMode === "split-vertical"} class:split-horizontal={viewMode === "split-horizontal"}
        style:--split-first={`${viewMode === "split-horizontal" ? horizontalSplitRatio : verticalSplitRatio}fr`}
        style:--split-second={`${1 - (viewMode === "split-horizontal" ? horizontalSplitRatio : verticalSplitRatio)}fr`}>
      {#if viewMode !== "flow"}
      <section id="canvas-pane" class="workspace-pane canvas-pane" class:active-pane={view === "canvas"} aria-label="Canvas編集領域" onpointerdown={() => view = "canvas"} onfocusin={() => view = "canvas"}>
      <div class="canvas-toolbar"><h2>Canvas</h2>
        <span class="canvas-root">{visiblePage.fields.path.value + " / " + (preview ? "Preview" : activePage.fields[activeRoot].name)}</span>
        <div class="canvas-actions">
          {#if preview && execution}<button type="button" class="canvas-run-status" onclick={() => focusPane("flow")} aria-label="実行中のFlowを表示">{execution.status.toUpperCase()} / {flows.find((flow) => flow.id === execution?.flowId)?.nodes.find((node) => node.id === execution?.nodeId)?.type ?? "END"}</button>{/if}
          <button type="button" class="toolbar-button" disabled={preview || !selected} onclick={deleteSelected} aria-label="選択したオブジェクトを削除">Delete</button>
          <button type="button" class="toolbar-button" class:active={preview} aria-pressed={preview} onclick={togglePreview}>Preview</button>
        </div>
      </div>
      <p class="canvas-hint" aria-live="polite">{preview ? "編集用の境界線を除いた表示" : dropFeedback() || `追加先: ${insertionInfo?.label ?? "無効です。Treeで選び直してください"} · 前後へ配置 / 横並びはContainerのDirectionで指定`}</p>
      <div class="canvas-workspace" class:details-open={detailsVisible}>
        {#if detailsVisible}<button type="button" class="inspector-scrim" aria-label="詳細を閉じる" onclick={closeDetails}></button>{/if}
        <div class="canvas-viewport" class:preview>
          <div class="canvas-stage" class:root-drop={dropTarget?.id === null && !preview} role="group"
            style:background={colorCss(visiblePage.fields.background.value)}
            aria-label={preview ? "Preview" : activePage.fields[activeRoot].name + "の配置領域"} data-canvas-root={preview ? "preview" : activeRoot}
            ondragover={(event) => hover(event,{pageId:activePageId,root:activeRoot,id:null,direction:"inside"})}
            ondragleave={(event) => { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) dropTarget=null; }}
            ondrop={(event) => drop(event,{pageId:activePageId,root:activeRoot,id:null,direction:"inside"})}>
            {#if !preview && activePage.fields[activeRoot].value.length === 0}<div class="canvas-empty"><span>DROP COM HERE</span><p>RegistryからComをドラッグ</p></div>{/if}
            <div class="scene-layout" data-axis="vertical">
              <CanvasNodes nodes={visiblePage.fields[preview ? "context" : activeRoot].value} editing={!preview} {selectedId} {dropTarget} {hiddenInEditor} {clickTargets} {highlightLayoutId} onActivate={activateClick}
                onDrag={startInstanceDrag} onHover={(event,node) => hover(event, objectTarget(event,node))}
                onDrop={(event,node) => drop(event, objectTarget(event,node))} onSelect={selectComponent} onChange={preview ? previewChange : updateComponent} />
            </div>
            {#if preview}<div class="overlay-surface"><div class="scene-layout" data-axis="vertical">
              <CanvasNodes nodes={visiblePage.fields.overlay.value} editing={false} selectedId={null} dropTarget={null} {hiddenInEditor} {clickTargets} {highlightLayoutId} onActivate={activateClick}
                onDrag={startInstanceDrag} onHover={(event,node) => hover(event, objectTarget(event,node))}
                onDrop={(event,node) => drop(event, objectTarget(event,node))} onSelect={selectComponent} onChange={previewChange} />
            </div></div>{/if}
          </div>
        </div>
        <div id="component-details" hidden={!detailsVisible}>
          {#if selected && detailsVisible}<DetailsPane node={selected} hasClickFlow={!!flows.find((flow) => flow.scope.kind === "page" && flow.scope.pageId === activePageId && flow.nodes.some((node) => node.type === "trigger.event" && node.componentId === selected.id))} onClose={closeDetails} onChange={updateComponent} onCreateClickFlow={addFlowForSelectedCom} />{/if}
        </div>
        <div class="details-rail" hidden={detailsVisible}>
          <button type="button" aria-label="詳細paneを開く" aria-controls="component-details" aria-expanded="false" hidden={preview} disabled={!selected || preview} onclick={() => detailsOpen=true}>+</button>
        </div>
      </div>
      </section>
      {/if}
      {#if viewMode === "split-vertical" || viewMode === "split-horizontal"}
      <button type="button" class="resize-handle workspace-resize-handle"
        class:horizontal-resize-handle={viewMode === "split-vertical"} class:vertical-resize-handle={viewMode === "split-horizontal"}
        aria-label={viewMode === "split-horizontal" ? "CanvasとFlowの幅を変更" : "CanvasとFlowの高さを変更"}
        aria-controls="canvas-pane flow-pane"
        onpointerdown={(event) => beginPointerResize(event, resizeWorkspace, viewMode === "split-horizontal" ? "col-resize" : "row-resize")}
        onkeydown={resizeWorkspaceWithKeyboard}></button>
      {/if}
      {#if viewMode !== "canvas"}
      <section id="flow-pane" class="workspace-pane flow-pane" class:active-pane={view === "flow"} aria-label="Flow編集領域" onpointerdown={() => view = "flow"} onfocusin={() => view = "flow"}>
        <div class="canvas-toolbar"><h2>Flow</h2><span class="canvas-root">{(selectedFlow?.name ?? "Flowなし") + (preview ? " / Preview" : "")}</span>
          <div class="canvas-actions"><button type="button" class="toolbar-button" disabled={preview || !selectedFlow} onclick={deleteFlow} aria-label="選択中のFlowを削除">Delete Flow</button><button type="button" class="toolbar-button" class:active={preview} aria-pressed={preview} onclick={togglePreview}>Preview</button></div>
        </div>
        <p class="canvas-hint">Nodeを自由にドラッグ配置 / 右の出力端子から左の入力端子へ接続 / 整理で一括整列</p>
        <FlowEditor flow={selectedFlow} {flows} {pages} {preview} {execution} {executionLog} {debugValues} {flowInspectToken} active={view === "flow"} {draggedFlowNodeType} onDropLibraryNode={() => draggedFlowNodeType = null}
          suggestedClickComName={suggestedClickCom?.flowId === selectedFlowId ? pageComponents(pages, activePageId).find((item) => item.id === suggestedClickCom?.componentId)?.name ?? null : null} onAddSuggestedClickTrigger={addSuggestedClickTrigger}
          selectedNodeId={selectedFlowNodeId} {copiedFlowNode}
          onAddNode={addNodeToFlow} onSelectNode={selectFlowNode} onChange={changeFlow}
          onDeleteNode={deleteSelectedFlowNode} onCopyNode={copySelectedFlowNode} onPasteNode={pasteCopiedFlowNode}
          onContinue={() => resumeFlow(false)} onStep={() => resumeFlow(true)} />
      </section>
      {/if}
      </div>
      <p class="keyboard-hint">Tabで対象を移動 · Enter＝クリック · Ctrl+Enterで掴む／離す · Ctrl+Shift+Pで仮想カーソル · ON中は矢印で移動・端でスクロール / PageUp・Downで縦、Shift併用で横スクロール</p>
      <p class="workspace-status" role="status">{status || (selected ? displayName(selected) : "Pages / Context / Overlay")}</p>
    </section>
  </div>
</main>

{#if virtualCursor && !preview}
  <div class="virtual-cursor" class:holding={!!heldComponent || !!heldFlow} style:left={virtualCursor.x + "px"} style:top={virtualCursor.y + "px"} aria-hidden="true" data-grabbed={!!heldComponent || !!heldFlow}>
    <span>{heldComponent || heldFlow ? "掴み中" : "仮想カーソル"}</span>
  </div>
{/if}
