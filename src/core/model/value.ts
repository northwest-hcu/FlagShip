import type { ReferenceValue } from "./reference";

// 基本となる値
export type ScalarValue = string | number | boolean | null;

// 固定値
export type LiteralValue =
  | ScalarValue
  | readonly LiteralValue[]
  | { readonly [key: string]: LiteralValue };

// 値全体
export type Value =
  | ScalarValue
  | ReferenceValue
  | readonly Value[]
  | { readonly [key: string]: Value };