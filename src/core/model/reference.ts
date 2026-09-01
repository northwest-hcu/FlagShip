/**
 * Structured Reference内の階層を1段ずつ示す単位。
 *
 * @example `["users", 0, "email"]` は `users[0].email` を表す。
 */
export type ReferencePathSegment = string | number;

/** UI Page直下のRootからNested Component InstanceまでのPath。 */
export type ComponentInstancePath = readonly string[];

/** Current Component Instanceを基準にLocal Entityを参照するScope。 */
export interface CurrentComponentInstanceScope {
  /** Current Instanceを基準にする固定Scope。 */
  readonly scope: "current-component-instance";

  /** Current Instanceから子Instanceまでの相対Path。 */
  readonly componentInstancePath?: ComponentInstancePath;
}

/** UI Page直下からのPathでComponent Instanceを明示するScope。 */
export interface ExplicitComponentInstanceScope {
  /** UI Page直下から対象Instanceまでの絶対Path。 */
  readonly componentInstancePath: ComponentInstancePath;
}

/** Component-local Referenceが使用できるScope。 */
export type ComponentReferenceScope =
  | CurrentComponentInstanceScope
  | ExplicitComponentInstanceScope;

/** Component内のContent Nodeを参照するReference。 */
export type ContentNodeReference = ComponentReferenceScope & {
  /** Content Node Referenceを識別する固定値。 */
  readonly kind: "content-node";

  /** Component内のLocal Content Node ID。 */
  readonly localId: string;
};

/** Component InstanceごとのContent Node Stateを参照するReference。 */
export type ContentNodeStateReference = ComponentReferenceScope & {
  /** Content Node State Referenceを識別する固定値。 */
  readonly kind: "content-node-state";

  /** Stateを所有するLocal Content Node ID。 */
  readonly localId: string;

  /** State内部の参照位置。 */
  readonly path?: readonly ReferencePathSegment[];
};

/** Component固有Flow Graphを参照するReference。 */
export type ComponentFlowGraphReference = ComponentReferenceScope & {
  /** Flow Graph Referenceを識別する固定値。 */
  readonly kind: "flow-graph";

  /** Component内のLocal Flow Graph ID。 */
  readonly localId: string;
};

/** Component内のLocal Entityを参照するReference。 */
export type ComponentLocalReference =
  | ContentNodeReference
  | ContentNodeStateReference
  | ComponentFlowGraphReference;

/** Application共有Stateを参照するReference。 */
export interface ApplicationStateReference {
  /** Application State Referenceを識別する固定値。 */
  readonly kind: "application-state";

  /** Application State ID。 */
  readonly id: string;

  /** State内部の参照位置。 */
  readonly path?: readonly ReferencePathSegment[];
}

/** Resourceを参照するReference。 */
export interface ResourceReference {
  /** Resource Referenceを識別する固定値。 */
  readonly kind: "resource";

  /** Resource ID。 */
  readonly id: string;
}

/** Project共通Flow Graphを参照するReference。 */
export interface ProjectFlowGraphReference {
  /** Flow Graph Referenceを識別する固定値。 */
  readonly kind: "flow-graph";

  /** Project共通Flow Graph ID。 */
  readonly id: string;
}

/** Flow NodeのOutputを参照するReference。 */
export interface FlowNodeOutputReference {
  /** Flow Node Output Referenceを識別する固定値。 */
  readonly kind: "flow-node-output";

  /** Output元のFlow Node ID。 */
  readonly id: string;

  /** Output内部の参照位置。 */
  readonly path?: readonly ReferencePathSegment[];
}

/** Flow Execution Contextを参照するReference。 */
export interface ContextReference {
  /** Event、Variable、Environmentのいずれを参照するか。 */
  readonly kind: "event" | "variables" | "env";

  /** Context内の参照位置。 */
  readonly path: readonly ReferencePathSegment[];
}

/** FlagShip Project外にある参照先の種類。 */
export type ExternalReferenceSource = "package" | "url" | "registry";

/** FlagShip Project外の対象を参照するReference。 */
export interface ExternalReference {
  /** External Referenceを識別する固定値。 */
  readonly kind: "external";

  /** Package、URL、Registryのいずれを参照するか。 */
  readonly source: ExternalReferenceSource;

  /** Package名、URL、Registry Key等の参照識別子。 */
  readonly key: string;

  /** 外部対象内の参照位置。 */
  readonly path?: readonly ReferencePathSegment[];
}

/** FlagShipで扱うStructured Reference。 */
export type Reference =
  | ContentNodeReference
  | ContentNodeStateReference
  | ComponentFlowGraphReference
  | ApplicationStateReference
  | ResourceReference
  | ProjectFlowGraphReference
  | FlowNodeOutputReference
  | ContextReference
  | ExternalReference;

/** Value内へStructured Referenceを埋め込むためのWrapper。 */
export interface ReferenceValue {
  /** 解決対象のStructured Reference。 */
  readonly $ref: Reference;
}
