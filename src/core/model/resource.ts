import type { ContextReference } from "./reference";

export interface EnvironmentReferenceValue {
  readonly $ref: ContextReference & {
    readonly scope: "env";
  }; // Public Environment ValueへのReference
}

export type ResourceText =
  | string
  | EnvironmentReferenceValue;
// 固定文字列またはPublic Environment Value

export type ResourceHeaders = Readonly<
  Record<string, ResourceText>
>; // Resource共通のHTTP Header

export interface RestResourceDefinition {
  readonly id: string; // 固定Resource ID
  readonly name: string; // Editor上の表示名
  readonly type: "rest"; // REST Resourceの識別子

  readonly baseUrl: ResourceText;
  // Request共通のBase URL

  readonly commonHeaders: ResourceHeaders;
  // Request共通のHTTP Header
}

export type ResourceDefinition =
  RestResourceDefinition;
// Projectへ保存可能なResource Definition

export interface ResourceDocument {
  readonly resources: Readonly<
    Record<string, ResourceDefinition>
  >; // Resource IDをKeyとするDefinition
}