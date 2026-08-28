import type { LiteralValue } from "./value";

export type StateScope =
  | "application"
  | "page"
  | "component"; // Stateが有効な範囲

export type StatePersistencePolicy =
  "memory"; // MVPで使用するRuntime Stateの保存方法

export type PrimitiveDataType =
  | "string"
  | "number"
  | "boolean"
  | "null";

export interface PrimitiveDataSchema {
  readonly type: PrimitiveDataType; // Primitive Valueの種類
}

export interface UnknownDataSchema {
  readonly type: "unknown"; // 構造が確定していないData
}

export interface ArrayDataSchema {
  readonly type: "array"; // Array Schemaの識別子
  readonly items: DataSchema; // Array要素のSchema
}

export interface ObjectDataSchema {
  readonly type: "object"; // Object Schemaの識別子

  readonly properties: Readonly<
    Record<string, DataSchema>
  >; // PropertyごとのSchema

  readonly required: readonly string[]; // 必須Property名
}

export type DataSchema =
  | PrimitiveDataSchema
  | UnknownDataSchema
  | ArrayDataSchema
  | ObjectDataSchema; // State Valueの構造定義

export interface StateDefinition {
  readonly id: string; // 固定State Definition ID
  readonly name: string; // Editor上の表示名
  readonly scope: StateScope; // Stateが有効な範囲

  readonly ownerId: string | null;
  // PageまたはComponentの固定ID

  readonly schema: DataSchema; // State Valueの構造
  readonly initialValue: LiteralValue; // Runtime開始時の初期値

  readonly persistencePolicy: StatePersistencePolicy;
  // Runtime Stateの保存方法
}

export interface StateDocument {
  readonly states: Readonly<
    Record<string, StateDefinition>
  >; // State IDをKeyとするDefinition
}