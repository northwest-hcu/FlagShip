import type { LiteralValue } from "./value";

/** Schemaで表現できるPrimitive Valueの種類。 */
export type PrimitiveDataType =
  | "string"
  | "number"
  | "boolean"
  | "null";

/** Primitive Valueを表すSchema。 */
export interface PrimitiveDataSchema {
  /** Primitive Valueの種類。 */
  readonly type: PrimitiveDataType;
}

/** 構造が確定していないDataを表すSchema。 */
export interface UnknownDataSchema {
  /** Unknown Schemaを識別する固定値。 */
  readonly type: "unknown";
}

/** Arrayを表すSchema。 */
export interface ArrayDataSchema {
  /** Array Schemaを識別する固定値。 */
  readonly type: "array";

  /** Array要素のSchema。 */
  readonly items: DataSchema;
}

/** Objectを表すSchema。 */
export interface ObjectDataSchema {
  /** Object Schemaを識別する固定値。 */
  readonly type: "object";

  /** Property名をKeyとするSchema。 */
  readonly properties: Readonly<
    Record<string, DataSchema>
  >;

  /** 必須Property名。 */
  readonly required: readonly string[];
}

/** State Valueの構造を表すSchema。 */
export type DataSchema =
  | PrimitiveDataSchema
  | UnknownDataSchema
  | ArrayDataSchema
  | ObjectDataSchema;

/** Projectへ保存するState SchemaとInitial Value。 */
export interface PersistentStateValue {
  /** State Valueの構造。 */
  readonly schema: DataSchema;

  /** Runtime開始時の初期値。 */
  readonly initialValue: LiteralValue;
}

/** Application全体で共有するState。 */
export interface ApplicationState
  extends PersistentStateValue {
  /** 固定Application State ID。 */
  readonly id: string;

  /** Editor上の表示名。 */
  readonly name: string;
}

/** Application共有Stateを保持するDocument。 */
export interface StateDocument {
  /** State IDをKeyとするApplication State Collection。 */
  readonly states: Readonly<
    Record<string, ApplicationState>
  >;
}
