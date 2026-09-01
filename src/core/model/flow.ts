import type { LiteralValue, Value } from "./value";

/** Flow Variableが参照するPage上のComponent Instance。 */
export interface FlowInstanceTarget {
  readonly kind: "component-instance";
  readonly pageId: string;
  readonly componentInstancePath: readonly string[];
}

/** Flow Graph内でNodeから参照するInstance Variable。 */
export interface FlowVariable {
  /** Graph内で一意なVariable ID。 */
  readonly id: string;

  /** Flow Editor上の表示名。 */
  readonly name: string;

  /** Variableが解決するComponent Instance。 */
  readonly target: FlowInstanceTarget;
}

/** Flow Node固有の設定。 */
export type FlowNodeConfig =
  Readonly<Record<string, Value>>;

/** Flow Nodeが受け取る入力値。 */
export type FlowNodeInputs =
  Readonly<Record<string, Value>>;

/** Flow Nodeが後続Nodeへ公開する出力定義。 */
export type FlowNodeOutputs =
  Readonly<Record<string, LiteralValue>>;

/** Flow Nodeの実行結果に影響しないEditor情報。 */
export interface FlowNodeMetadata {
  /** Flow Editor上の横位置。 */
  readonly x?: number;

  /** Flow Editor上の縦位置。 */
  readonly y?: number;

  /** Flow Editor上で折りたたまれているか。 */
  readonly collapsed?: boolean;

  /** Flow Editor上で所属する表示GroupのID。 */
  readonly group?: string;
}

/** Flow Graphを構成する実行単位。 */
export interface FlowNode {
  /** 固定Flow Node ID。 */
  readonly id: string;

  /** Node Contract ID。 */
  readonly type: string;

  /** Node固有の設定。 */
  readonly config: FlowNodeConfig;

  /** LiteralまたはStructured Referenceで表す入力値。 */
  readonly inputs: FlowNodeInputs;

  /** 後続Nodeへ公開する出力定義。 */
  readonly outputs: FlowNodeOutputs;

  /** 実行結果に影響しないEditor情報。 */
  readonly metadata?: FlowNodeMetadata;
}

/** Flow Node間のPort接続。 */
export interface FlowEdge {
  /** 固定Edge ID。 */
  readonly id: string;

  /** 開始Nodeの固定ID。 */
  readonly fromNode: string;

  /** 開始NodeのOutput Port。 */
  readonly fromPort: string;

  /** 接続先Nodeの固定ID。 */
  readonly toNode: string;

  /** 接続先NodeのInput Port。 */
  readonly toPort: string;
}

/** Flow NodeとEdgeからなる永続的なFlow Graph。 */
export interface FlowGraph {
  /** 固定Flow Graph ID。 */
  readonly id: string;

  /** Editor上の表示名。 */
  readonly name: string;

  /** Nodeが対象Instanceを参照するためのGraph Local Variable。 */
  readonly variables: Readonly<Record<string, FlowVariable>>;

  /** Flowを構成するNode。 */
  readonly nodes: readonly FlowNode[];

  /** Node間の実行経路。 */
  readonly edges: readonly FlowEdge[];
}

/** Application共通のFlow Graphを保持するDocument。 */
export interface FlowDocument {
  /** Flow Graph IDをKeyとするGraph Collection。 */
  readonly graphs: Readonly<
    Record<string, FlowGraph>
  >;
}
