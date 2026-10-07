import { childrenOf, componentFields, displayName, isLayout, withField, type ComponentNode, type PageComponent, type Pages, type WidgetNode } from "./component-model";
import { findComponent, replaceComponent } from "./scene";

export type FlowScope = { kind: "page"; pageId: string } | { kind: "project" };
export type FlowValue =
  | { kind: "field"; pageId: string; componentId: string; fieldKey: string }
  | { kind: "variable"; variableId: string }
  | { kind: "constant"; constantId: string };
export type FlowFieldReference = Extract<FlowValue, { kind: "field" }>;
export type FlowWriteTarget = Exclude<FlowValue, { kind: "constant" }>;
export type FlowCondition =
  | { operator: "equals"; left: FlowValue | null; right: FlowValue | null }
  | { operator: "notEmpty"; value: FlowValue | null };
export type FlowNodeType = "trigger.event" | "trigger.schedule" | "trigger.load" | "logic.condition" | "action.navigate" | "action.set-variable" | "action.init-variable" | "action.init-constant";
type NodeBase = { id: string; x: number; y: number };
export type FlowNode = NodeBase & (
  | { type: "trigger.event"; componentId: string | null; event: "click" }
  | { type: "trigger.schedule"; mode: "after" | "interval" | "at"; milliseconds: number; dateTime: string | null }
  | { type: "trigger.load" }
  | { type: "logic.condition"; condition: FlowCondition }
  | { type: "action.navigate"; targetPageId: string | null }
  | { type: "action.set-variable"; target: FlowWriteTarget | null; value: FlowValue | null }
  | { type: "action.init-variable"; name: string; initialValue: string; global?: boolean }
  | { type: "action.init-constant"; name: string; initialValue: string; global?: boolean }
);
export type FlowPort = "next" | "true" | "false";
export type FlowEdge = { id: string; from: string; port: FlowPort; to: string };
export type FlowGraph = { id: string; name: string; ownerPageId?: string; scope: FlowScope; nodes: FlowNode[]; edges: FlowEdge[]; breakpoints: string[] };
function visibleNodes(flow: FlowGraph, flows: FlowGraph[]): FlowNode[] {
  return [flow, ...flows.filter((owner) => owner.id !== flow.id)].flatMap((owner) => owner.nodes.filter((node) => {
    if (owner.id === flow.id) return true;
    if ((node.type === "action.init-variable" || node.type === "action.init-constant") && node.global) return true;
    return flow.scope.kind === "page" && owner.scope.kind === "page" && flow.scope.pageId === owner.scope.pageId;
  }));
}
export function variableNodes(flow: FlowGraph, flows: FlowGraph[] = [flow]): Extract<FlowNode, { type: "action.init-variable" }>[] {
  return visibleNodes(flow, flows).filter((node): node is Extract<FlowNode, { type: "action.init-variable" }> => node.type === "action.init-variable");
}
export function constantNodes(flow: FlowGraph, flows: FlowGraph[] = [flow]): Extract<FlowNode, { type: "action.init-constant" }>[] {
  return visibleNodes(flow, flows).filter((node): node is Extract<FlowNode, { type: "action.init-constant" }> => node.type === "action.init-constant");
}

export function createFlow(id: string, pageId: string): FlowGraph {
  return { id, name: "New Flow", ownerPageId: pageId, scope: { kind: "page", pageId }, nodes: [], edges: [], breakpoints: [] };
}

export function setScheduleGlobal(flow: FlowGraph, global: boolean): FlowGraph {
  const pageId = flow.scope.kind === "page" ? flow.scope.pageId : flow.ownerPageId;
  if (!pageId || !flow.nodes.some((node) => node.type === "trigger.schedule")) return flow;
  return { ...flow, ownerPageId: pageId, scope: global ? { kind: "project" } : { kind: "page", pageId } };
}

export function createFlowNode(id: string, type: FlowNodeType, x: number, y: number): FlowNode {
  const base = { id, x: Math.max(0, Math.round(x)), y: Math.max(0, Math.round(y)) };
  if (type === "trigger.event") return { ...base, type, event: "click", componentId: null };
  if (type === "trigger.schedule") return { ...base, type, mode: "after", milliseconds: 1000, dateTime: null };
  if (type === "trigger.load") return { ...base, type };
  if (type === "logic.condition") return { ...base, type, condition: { operator: "equals", left: null, right: null } };
  if (type === "action.set-variable") return { ...base, type, target: { kind: "variable", variableId: "" }, value: null };
  if (type === "action.init-variable" || type === "action.init-constant") return { ...base, type, name: type === "action.init-variable" ? "variable" : "constant", initialValue: "", global: false };
  return { ...base, type, targetPageId: null };
}

export function addFlowNode(flow: FlowGraph, node: FlowNode): FlowGraph {
  if (flow.nodes.some((item) => item.id === node.id)) return flow;
  if (node.type.startsWith("trigger.") && flow.nodes.some((item) => item.type.startsWith("trigger."))) return flow;
  const scope = (node.type === "trigger.event" || node.type === "trigger.load") && flow.scope.kind === "project" && flow.ownerPageId
    ? { kind: "page" as const, pageId: flow.ownerPageId } : flow.scope;
  return { ...flow, scope, nodes: [...flow.nodes, node] };
}

export function removeFlowNode(flow: FlowGraph, id: string): FlowGraph {
  return { ...flow, nodes: flow.nodes.filter((node) => node.id !== id), edges: flow.edges.filter((edge) => edge.from !== id && edge.to !== id), breakpoints: flow.breakpoints.filter((item) => item !== id) };
}

export function layoutFlowNodes(flow: FlowGraph): FlowGraph {
  const depths = new Map(flow.nodes.map((node) => [node.id, 0]));
  for (let pass = 0; pass < flow.nodes.length; pass++) {
    let changed = false;
    for (const edge of flow.edges) {
      const depth = Math.max(depths.get(edge.to) ?? 0, (depths.get(edge.from) ?? 0) + 1);
      if (depth > (depths.get(edge.to) ?? 0)) { depths.set(edge.to, depth); changed = true; }
    }
    if (!changed) break;
  }
  const rows = new Map<number, number>();
  return { ...flow, nodes: flow.nodes.map((node) => {
    const depth = depths.get(node.id) ?? 0;
    const row = rows.get(depth) ?? 0;
    rows.set(depth, row + 1);
    return { ...node, x: 40 + depth * 258, y: 48 + row * 150 };
  }) };
}

export function reorderFlowNode(flow: FlowGraph, draggedId: string, targetId: string, after: boolean): FlowGraph {
  if (draggedId === targetId || !flow.nodes.some((node) => node.id === draggedId) || !flow.nodes.some((node) => node.id === targetId)) return flow;
  const nodes = flow.nodes.filter((node) => node.id !== draggedId);
  const moved = flow.nodes.find((node) => node.id === draggedId)!;
  const index = nodes.findIndex((node) => node.id === targetId) + (after ? 1 : 0);
  nodes.splice(index, 0, moved);
  return { ...flow, nodes };
}

export function nextNode(flow: FlowGraph, from: string, port: FlowPort): string | null {
  return flow.edges.find((edge) => edge.from === from && edge.port === port)?.to ?? null;
}

export function setFlowEdge(flow: FlowGraph, from: string, port: FlowPort, to: string | null): FlowGraph {
  const source = flow.nodes.find((node) => node.id === from);
  const destination = flow.nodes.find((node) => node.id === to);
  if (!source || (source.type === "logic.condition" ? port === "next" : port !== "next")) return flow;
  if (to && (!destination || destination.type.startsWith("trigger.") || to === from)) return flow;
  const edges = flow.edges.filter((edge) => !(edge.from === from && edge.port === port));
  if (!to) return { ...flow, edges };
  const next = { ...flow, edges: [...edges, { id: `${from}-${port}`, from, port, to }] };
  return hasFlowCycle(next) ? flow : next;
}

function hasFlowCycle(flow: FlowGraph): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string): boolean {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const edge of flow.edges.filter((item) => item.from === id)) if (visit(edge.to)) return true;
    visiting.delete(id); visited.add(id);
    return false;
  }
  return flow.nodes.some((node) => visit(node.id));
}

export function findWidget(nodes: WidgetNode[], id: string): WidgetNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findWidget(childrenOf(node), id);
    if (child) return child;
  }
}

export function pageComponents(pages: Pages, pageId: string): { id: string; name: string; node: ComponentNode }[] {
  const page = pages.find((item) => item.id === pageId);
  if (!page) return [];
  const result: { id: string; name: string; node: ComponentNode }[] = [{ id: page.id, name: displayName(page), node: page }];
  function visit(nodes: WidgetNode[]): void {
    for (const node of nodes) { if (!isLayout(node)) result.push({ id: node.id, name: displayName(node), node }); visit(childrenOf(node)); }
  }
  visit(page.fields.context.value); visit(page.fields.overlay.value);
  return result;
}

export function scalarFields(node: ComponentNode): { key: string; name: string; type: string }[] {
  return componentFields(node).filter(({ field }) => ["String", "Number", "Boolean", "Enum"].includes(field.type))
    .map(({ key, field }) => ({ key, name: field.name, type: field.type }));
}

export function flowNodeErrors(flow: FlowGraph, pages: Pages, node: FlowNode, flows: FlowGraph[] = [flow]): string[] {
  const errors: string[] = [];
  function checkValue(value: FlowValue | null): void {
    if (!value) { errors.push("値の参照を設定してください"); return; }
    if (value.kind === "variable") {
      if (!variableNodes(flow, flows).some((item) => item.id === value.variableId)) errors.push("ユーザー変数がありません");
    } else if (value.kind === "constant") {
      if (!constantNodes(flow, flows).some((item) => item.id === value.constantId)) errors.push("定数がありません");
    } else {
      if (flow.scope.kind !== "page" || value.pageId !== flow.scope.pageId) { errors.push("フィールドはFlowの対象Page内で指定してください"); return; }
      const target = pageComponents(pages, value.pageId).find((item) => item.id === value.componentId);
      if (!target || !scalarFields(target.node).some((field) => field.key === value.fieldKey)) errors.push("フィールド参照がありません");
    }
  }
    if (node.type === "trigger.event") {
      if (flow.scope.kind !== "page" || !node.componentId || !pageComponents(pages, flow.scope.pageId).some((item) => item.id === node.componentId && item.node.kind !== "page")) errors.push("Click対象のComを設定してください");
    } else if (node.type === "trigger.schedule") {
      if (node.mode === "at" ? !node.dateTime || !Number.isFinite(Date.parse(node.dateTime)) : !Number.isFinite(node.milliseconds) || node.milliseconds < (node.mode === "interval" ? 1000 : 0)) errors.push("スケジュールの時刻を設定してください");
    } else if (node.type === "trigger.load") {
      if (flow.scope.kind !== "page") errors.push("Page LoadはPageに属するFlowで使用できます");
    } else if (node.type === "action.navigate") {
      if (!node.targetPageId || !pages.some((page) => page.id === node.targetPageId)) errors.push("遷移先Pageを設定してください");
    } else if (node.type === "action.set-variable") {
      if (!node.target) errors.push("Setの代入先を設定してください");
      else if (node.target.kind === "variable") {
        const variableId = node.target.variableId;
        if (!variableNodes(flow, flows).some((item) => item.id === variableId)) errors.push("更新するユーザー変数を設定してください");
      } else {
        const reference = node.target;
        if (flow.scope.kind !== "page" || reference.pageId !== flow.scope.pageId) errors.push("フィールドはFlowの対象Page内で指定してください");
        const target = pageComponents(pages, reference.pageId).find((item) => item.id === reference.componentId && item.node.kind !== "page");
        if (!target || !scalarFields(target.node).some((field) => field.key === reference.fieldKey)) errors.push("更新するフィールドを設定してください");
      }
      checkValue(node.value);
    } else if (node.type === "action.init-variable" || node.type === "action.init-constant") {
      if (!node.name.trim()) errors.push("初期化Nodeの名前を設定してください");
    } else if (node.type === "logic.condition") {
      const condition = node.condition;
      (condition.operator === "equals" ? [condition.left, condition.right] : [condition.value]).forEach(checkValue);
    }
  return [...new Set(errors)];
}

export function flowErrors(flow: FlowGraph, pages: Pages, flows: FlowGraph[] = [flow]): string[] {
  const errors: string[] = [];
  const ids = flow.nodes.map((node) => node.id);
  if (new Set(ids).size !== ids.length) errors.push("Node IDが重複しています");
  const triggers = flow.nodes.filter((node) => node.type.startsWith("trigger."));
  if (triggers.length !== 1) errors.push("起点Nodeを1つ配置してください");
  if (flow.scope.kind === "page") {
    const pageId = flow.scope.pageId;
    if (!pages.some((page) => page.id === pageId)) errors.push("対象Pageがありません");
  }
  for (const node of flow.nodes) errors.push(...flowNodeErrors(flow, pages, node, flows));
  const edgeIds = flow.edges.map((edge) => edge.id);
  if (new Set(edgeIds).size !== edgeIds.length) errors.push("Edge IDが重複しています");
  for (const edge of flow.edges) {
    const from = flow.nodes.find((node) => node.id === edge.from);
    const to = flow.nodes.find((node) => node.id === edge.to);
    if (!from || !to || to.type.startsWith("trigger.") || (from.type === "logic.condition" ? edge.port === "next" : edge.port !== "next")) errors.push("Edgeの接続が無効です");
  }
  if (hasFlowCycle(flow)) errors.push("循環する接続があります");
  if (flow.edges.some((edge, index) => flow.edges.findIndex((item) => item.from === edge.from && item.port === edge.port) !== index)) errors.push("同じPortから複数接続されています");
  if (triggers.length === 1 && flow.nodes.length > 1 && !flow.edges.some((edge) => edge.from === triggers[0].id)) errors.push("起点の接続を設定してください");
  if (triggers.length === 1) {
    const reached = new Set<string>();
    const pending = [triggers[0].id];
    while (pending.length) {
      const id = pending.pop()!;
      if (reached.has(id)) continue;
      reached.add(id);
      for (const edge of flow.edges) if (edge.from === id) pending.push(edge.to);
    }
    if (flow.nodes.some((node) => !reached.has(node.id))) errors.push("接続されていないNodeがあります");
  }
  return [...new Set(errors)];
}

export function readFlowValue(value: FlowValue | null, flow: FlowGraph, pages: Pages, fields: Record<string, string>, variables: Record<string, string>, constants: Record<string, string>): string | null {
  if (!value) return null;
  if (value.kind === "variable") return variables[value.variableId] ?? null;
  if (value.kind === "constant") return constants[value.constantId] ?? null;
  if (flow.scope.kind !== "page" || value.pageId !== flow.scope.pageId) return null;
  const target = pageComponents(pages, value.pageId).find((item) => item.id === value.componentId)?.node;
  if (!target) return null;
  if (flowFieldValueKey(value) in fields) return fields[flowFieldValueKey(value)];
  if (value.fieldKey === "value" && value.componentId in fields) return fields[value.componentId];
  const field = (target.fields as Record<string, { value: unknown }>)[value.fieldKey];
  return field && (typeof field.value === "string" || typeof field.value === "number" || typeof field.value === "boolean") ? String(field.value) : null;
}

export function flowFieldValueKey(reference: FlowFieldReference): string {
  return JSON.stringify([reference.pageId, reference.componentId, reference.fieldKey]);
}

export function setFlowFieldValue(fields: Record<string, string>, reference: FlowFieldReference, value: string, pages: Pages): Record<string, string> {
  const target = pageComponents(pages, reference.pageId).find((item) => item.id === reference.componentId && item.node.kind !== "page");
  if (!target || !scalarFields(target.node).some((field) => field.key === reference.fieldKey) || withField(target.node, reference.fieldKey, value) === target.node) return fields;
  return { ...fields, [flowFieldValueKey(reference)]: value };
}

export function applyFlowFieldValues(page: PageComponent, fields: Record<string, string>): PageComponent {
  let result = page;
  for (const component of pageComponents([page], page.id)) {
    if (component.node.kind === "page") continue;
    for (const field of scalarFields(component.node)) {
      const key = flowFieldValueKey({ kind: "field", pageId: page.id, componentId: component.id, fieldKey: field.key });
      if (!(key in fields)) continue;
      const root = findComponent(result.fields.context.value, component.id) ? "context" : "overlay";
      const current = findComponent(result.fields[root].value, component.id);
      if (!current) continue;
      const updated = withField(current, field.key, fields[key]) as WidgetNode;
      if (updated === current) continue;
      result = { ...result, fields: { ...result.fields, [root]: { ...result.fields[root], value: replaceComponent(result.fields[root].value, updated) } } };
    }
  }
  return result;
}

export function evaluateCondition(condition: FlowCondition, flow: FlowGraph, pages: Pages, fields: Record<string, string>, variables: Record<string, string>, constants: Record<string, string>): { port: "true" | "false"; left: string | null; right: string | null } {
  const left = readFlowValue(condition.operator === "equals" ? condition.left : condition.value, flow, pages, fields, variables, constants);
  const right = condition.operator === "equals" ? readFlowValue(condition.right, flow, pages, fields, variables, constants) : null;
  const passes = condition.operator === "equals"
    ? left !== null && right !== null && left.trim().normalize("NFKC") === right.trim().normalize("NFKC")
    : !!left?.trim();
  return { port: passes ? "true" : "false", left, right };
}

export function conditionPort(condition: FlowCondition, flow: FlowGraph, pages: Pages, fields: Record<string, string>, variables: Record<string, string>, constants: Record<string, string>): "true" | "false" {
  return evaluateCondition(condition, flow, pages, fields, variables, constants).port;
}

export type FlowWatchValue = { key: string; kind: "FIELD" | "VAR" | "CONST"; label: string; value: string | null; masked: boolean };
export type FlowLogEntry = { id: number; flowId: string; nodeId: string | null; message: string };

/** Previewの現在値だけを組み立てる。定義や実行ログへ値を保存しない。 */
export function flowWatchValues(flow: FlowGraph, pages: Pages, fields: Record<string, string>, variables: Record<string, string>, constants: Record<string, string>, flows: FlowGraph[] = [flow]): FlowWatchValue[] {
  const result: FlowWatchValue[] = [];
  for (const node of [...variableNodes(flow, flows), ...constantNodes(flow, flows)]) {
    if (node.type === "action.init-variable") result.push({ key: node.id, kind: "VAR", label: node.name, value: variables[node.id] ?? null, masked: false });
    if (node.type === "action.init-constant") result.push({ key: node.id, kind: "CONST", label: node.name, value: constants[node.id] ?? null, masked: false });
  }
  const references = new Map<string, FlowFieldReference>();
  function add(value: FlowValue | null): void {
    if (value?.kind === "field") references.set(flowFieldValueKey(value), value);
  }
  for (const node of flow.nodes) {
    if (node.type === "logic.condition") {
      if (node.condition.operator === "equals") { add(node.condition.left); add(node.condition.right); }
      else add(node.condition.value);
    } else if (node.type === "action.set-variable") { add(node.target); add(node.value); }
  }
  for (const [key, reference] of references) {
    const component = pageComponents(pages, reference.pageId).find((item) => item.id === reference.componentId);
    const masked = component?.node.kind === "textinput" && reference.fieldKey === "value" && component.node.fields.passwordMask.value;
    result.push({ key, kind: "FIELD", label: `${component?.name ?? reference.componentId}.${reference.fieldKey}`,
      value: readFlowValue(reference, flow, pages, fields, variables, constants), masked: !!masked });
  }
  return result;
}
