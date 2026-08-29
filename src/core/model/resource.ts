import type { ContextReference } from "./reference";

/** Public Environment Valueを参照する値。 */
export interface EnvironmentReferenceValue {
  /** `env` Scopeに限定したContext Reference。 */
  readonly $ref: ContextReference & {
    readonly kind: "env";
  };
}

/** 固定文字列またはPublic Environment ValueへのReference。 */
export type ResourceText =
  | string
  | EnvironmentReferenceValue;

/** Resource Requestへ共通して付与するHTTP Header。 */
export type ResourceHeaders = Readonly<
  Record<string, ResourceText>
>;

/** REST APIへの接続設定。 */
export interface RestResourceDefinition {
  /** 固定Resource ID。 */
  readonly id: string;

  /** Editor上の表示名。 */
  readonly name: string;

  /** REST Resourceを識別する固定値。 */
  readonly type: "rest";

  /** Request共通のBase URL。 */
  readonly baseUrl: ResourceText;

  /** Request共通のHTTP Header。 */
  readonly commonHeaders: ResourceHeaders;
}

/** Projectへ保存可能なResource Definition。 */
export type ResourceDefinition =
  RestResourceDefinition;

/** Projectが保持するResource Definition Collection。 */
export interface ResourceDocument {
  /** Resource IDをKeyとするDefinition。 */
  readonly resources: Readonly<
    Record<string, ResourceDefinition>
  >;
}
