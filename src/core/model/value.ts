import type { ReferenceValue } from "./reference";

/** JSONへ直接保存できるScalar Value。 */
export type ScalarValue = string | number | boolean | null;

/** Structured Referenceを含まない、JSONへ保存可能な固定値。 */
export type LiteralValue =
  | ScalarValue
  | readonly LiteralValue[]
  | { readonly [key: string]: LiteralValue };

/** 固定値またはStructured Referenceを再帰的に保持できる値。 */
export type Value =
  | ScalarValue
  | ReferenceValue
  | readonly Value[]
  | { readonly [key: string]: Value };
