// reference内の階層を1段ずつ示す最小単位
// 例: ["users", 0, "email"] -> users[0].email
export type ReferencePathSegment = string | number;

// event: FlowのきっかけとなったEventの情報
// variables: 現在進行中のFlowが持つ一時変数
// env: ブラウザに公開してよい環境変数
export type ContextReferenceScope = "event" | "variables" | "env"; 

// ReferencePathSegment と ContextReferenceScope を合わせた値を対象
export interface ContextReference {
  readonly scope: ContextReferenceScope;
  readonly path: readonly ReferencePathSegment[];
}

// 固定IDで参照するProject Entityの種類のスコープ
// state: State定義
// outputs: Flow Node の出力
// uiNode: Canvas上のUI Node
// resource: APIなどの定義
// flow: Flow定義
// component: Cmponent定義
export type EntityReferenceScope =
  | "state"
  | "outputs"
  | "uiNode"
  | "resource"
  | "flow"
  | "component";

// 固定IDで参照するProject Entityの種類
export interface EntityReference {
  readonly scope: EntityReferenceScope;
  readonly id: string;
  readonly path?: readonly ReferencePathSegment[];
}

// FlagShip プロジェクト外の参照先パターン
// package：Package名
// url: URL
// registry: Componentなどを管理するRegistry Key
export type ExternalReferenceSource = "package" | "url" | "registry";

// scope="external": 外部参照の固定値
// source: プロジェクト外の参照先パターン
// key: Package名など
// path: 外部参照位置, 省略可
export interface ExternalReference {
  readonly scope: "external";
  readonly source: ExternalReferenceSource;
  readonly key: string;
  readonly path?: readonly ReferencePathSegment[];
}

export type Reference =
  | ContextReference
  | EntityReference
  | ExternalReference;

export interface ReferenceValue {
  readonly $ref: Reference;
}