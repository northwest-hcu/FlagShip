import type { LiteralValue, Value } from "./value";

export type FlowNodeConfig =
  Readonly<Record<string, Value>>; // Node固有の設定

export type FlowNodeInputs =
  Readonly<Record<string, Value>>; // Nodeが受け取る入力値

export type FlowNodeOutputs =
  Readonly<Record<string, LiteralValue>>; // Nodeが公開する出力定義

export interface FlowNodePosition {
  readonly x: number; // Flow Editor上の横位置
  readonly y: number; // Flow Editor上の縦位置
}

export interface FlowNodeMetadata {
  readonly position?: FlowNodePosition; // Flow Editor上の表示位置
  readonly collapsed?: boolean; // Flow Editor上の折りたたみ状態
}

export interface FlowNode {
  readonly id: string; // 固定Flow Node ID
  readonly type: string; // Node Contract ID
  readonly config: FlowNodeConfig; // Node固有の設定
  readonly inputs: FlowNodeInputs; // LiteralまたはStructured Reference
  readonly outputs: FlowNodeOutputs; // 後続Nodeへ公開する出力定義
  readonly metadata?: FlowNodeMetadata; // 実行結果に影響しないEditor情報
}

export interface FlowEdge {
  readonly id: string; // 固定Edge ID
  readonly fromNode: string; // 開始Nodeの固定ID
  readonly fromPort: string; // 開始NodeのOutput Port
  readonly toNode: string; // 接続先Nodeの固定ID
  readonly toPort: string; // 接続先NodeのInput Port
}

export interface FlowDefinition {
  readonly id: string; // 固定Flow ID
  readonly name: string; // Editor上の表示名
  readonly nodes: readonly FlowNode[]; // Flowを構成するNode
  readonly edges: readonly FlowEdge[]; // Node間の実行経路
}

export interface FlowDocument {
  readonly flows: Readonly<
    Record<string, FlowDefinition>
  >; // Flow IDをKeyとするFlow Definition
}