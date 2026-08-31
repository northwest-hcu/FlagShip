import type { Component } from "./model/component";
import type { FlowGraph, FlowNode } from "./model/flow";
import type { ProjectDocument } from "./model/project";
import type {
  ComponentInstancePath,
  ComponentLocalReference,
  ComponentReferenceScope,
  Reference,
  ReferencePathSegment,
} from "./model/reference";
import type { ResourceDefinition } from "./model/resource";
import type {
  ApplicationState,
} from "./model/state";
import type {
  ComponentInstance,
  ContentNode,
  ContentNodeState,
} from "./model/ui";

/** Project Document内でStructured Referenceから解決できるEntity。 */
export type ProjectReferenceTarget =
  | ApplicationState
  | Component
  | ComponentInstance
  | ContentNode
  | ContentNodeState
  | FlowGraph
  | FlowNode
  | ResourceDefinition;

/** Structured Referenceの解決時に必要な実行Context。 */
export interface ReferenceResolutionContext {
  /** Component Instance Pathを解決するUI Page ID。 */
  readonly pageId?: string;

  /** Component固有FlowのCurrent Component Instance Path。 */
  readonly currentComponentInstancePath?: ComponentInstancePath;

  /** Flow Node Outputを解決するCurrent Flow Graph。 */
  readonly currentFlowGraph?: FlowGraph;
}

/** 解決したComponent Instanceと参照先Component Asset。 */
export interface ResolvedComponentInstance {
  /** Component Instance Path末尾のInstance。 */
  readonly instance: ComponentInstance;

  /** Instanceが固定Versionで参照するComponent Asset。 */
  readonly component: Component;
}

/**
 * Projectへ取り込んだSnapshotまたはLocal LibraryからComponentを取得する。
 * 同じComponent IDが両方に存在する場合は曖昧なため解決しない。
 *
 * @param project - Componentを保持するProject Document。
 * @param componentId - 解決するComponentのStable ID。
 * @returns 一意に解決できたComponent。欠損または重複時は `undefined`。
 */
export function resolveProjectComponent(
  project: ProjectDocument,
  componentId: string,
): Component | undefined {
  const imported = project.components
    .importedAssets[componentId]?.component;
  const local = project.components
    .localLibrary.assets[componentId];

  if (imported !== undefined && local !== undefined) {
    return undefined;
  }

  return imported ?? local;
}

function resolveComponentAsset(
  project: ProjectDocument,
  instance: ComponentInstance,
): Component | undefined {
  const component = resolveProjectComponent(
    project,
    instance.componentId,
  );

  if (
    component === undefined ||
    component.version !== instance.componentVersion
  ) {
    return undefined;
  }

  return component;
}

function getChildInstanceMatches(
  component: Component,
  instanceId: string,
): readonly ComponentInstance[] {
  const instance = component.contentTree.componentInstances[instanceId];
  return instance === undefined ? [] : [instance];
}

function getContentNodeMatches(
  component: Component,
  localId: string,
): readonly ContentNode[] {
  const node = component.contentTree.nodes[localId];
  return node === undefined ? [] : [node];
}

function resolveReferenceComponentPath(
  reference: ComponentReferenceScope,
  context: ReferenceResolutionContext,
): ComponentInstancePath | undefined {
  if ("scope" in reference) {
    if (context.currentComponentInstancePath === undefined) {
      return undefined;
    }

    return [
      ...context.currentComponentInstancePath,
      ...(reference.componentInstancePath ?? []),
    ];
  }

  return reference.componentInstancePath;
}

function resolveLocalTarget(
  component: Component,
  reference: ComponentLocalReference,
): ProjectReferenceTarget | undefined {
  switch (reference.kind) {
    case "content-node": {
      const matches = getContentNodeMatches(
        component,
        reference.localId,
      );
      return matches.length === 1 ? matches[0] : undefined;
    }

    case "content-node-state": {
      const matches = getContentNodeMatches(
        component,
        reference.localId,
      );
      return matches.length === 1
        ? matches[0].state
        : undefined;
    }

    case "flow-graph":
      return component.flowGraphs[reference.localId];
  }
}

/**
 * Component Assetを基点にCurrent Component Instance Referenceを解決する。
 * 未配置のLibrary ComponentにあるReference Validationでも使用できる。
 *
 * @param project - 子Instanceが参照するComponent Assetを含むProject。
 * @param component - Current Component Instanceが利用するComponent Asset。
 * @param reference - Current Component Instance ScopeのLocal Reference。
 * @returns Local Entity。欠損または曖昧なら `undefined`。
 */
export function resolveCurrentComponentReferenceTarget(
  project: ProjectDocument,
  component: Component,
  reference: ComponentLocalReference & {
    readonly scope: "current-component-instance";
  },
): ProjectReferenceTarget | undefined {
  let targetComponent = component;

  for (const instanceId of reference.componentInstancePath ?? []) {
    const matches = getChildInstanceMatches(
      targetComponent,
      instanceId,
    );

    if (matches.length !== 1) {
      return undefined;
    }

    const childComponent = resolveComponentAsset(
      project,
      matches[0],
    );

    if (childComponent === undefined) {
      return undefined;
    }

    targetComponent = childComponent;
  }

  return resolveLocalTarget(targetComponent, reference);
}

/**
 * UI Page直下からComponent Instance Pathを順に解決する。
 *
 * @param project - Component Assetを含むProject Document。
 * @param pageId - Pathの起点となるUI Page ID。
 * @param path - RootからNested InstanceまでのPath。
 * @returns 末尾のInstanceとComponent。欠損または曖昧なら `undefined`。
 */
export function resolveComponentInstancePath(
  project: ProjectDocument,
  pageId: string,
  path: ComponentInstancePath,
): ResolvedComponentInstance | undefined {
  if (path.length === 0) {
    return undefined;
  }

  const page = project.ui.pages[pageId];
  const rootMatches = [
    page?.componentInstances[path[0]],
    page?.overlayInstances[path[0]],
  ].filter((candidate): candidate is ComponentInstance => candidate !== undefined);
  if (rootMatches.length !== 1) {
    return undefined;
  }
  let instance = rootMatches[0];

  let component = resolveComponentAsset(project, instance);

  if (component === undefined) {
    return undefined;
  }

  for (const instanceId of path.slice(1)) {
    const instanceChildren = (instance.children ?? [])
      .map((placement) => placement.instance)
      .filter((child) => child.id === instanceId);
    const matches = [
      ...instanceChildren,
      ...getChildInstanceMatches(component, instanceId),
    ];

    if (matches.length !== 1) {
      return undefined;
    }

    instance = matches[0];
    component = resolveComponentAsset(project, instance);

    if (component === undefined) {
      return undefined;
    }
  }

  return { instance, component };
}

/**
 * Structured ReferenceからProject Document内の参照先を解決する。
 *
 * @param project - 参照先を含むProject Document。
 * @param reference - 解決するStructured Reference。
 * @param context - Page、Current Instance、Current FlowのContext。
 * @returns 解決したEntity。対象外、欠損、曖昧な場合は `undefined`。
 */
export function resolveProjectReferenceTarget(
  project: ProjectDocument,
  reference: Reference,
  context: ReferenceResolutionContext = {},
): ProjectReferenceTarget | undefined {
  switch (reference.kind) {
    case "application-state":
      return project.state.states[reference.id];

    case "resource":
      return project.resources.resources[reference.id];

    case "flow-node-output":
      return context.currentFlowGraph?.nodes.find(
        (node) => node.id === reference.id,
      );

    case "flow-graph":
      if ("id" in reference) {
        return project.flows.graphs[reference.id];
      }
      break;

    case "content-node":
    case "content-node-state":
      break;

    case "event":
    case "variables":
    case "env":
    case "external":
      return undefined;
  }

  if (context.pageId === undefined) {
    return undefined;
  }

  const path = resolveReferenceComponentPath(reference, context);

  if (path === undefined) {
    return undefined;
  }

  const resolved = resolveComponentInstancePath(
    project,
    context.pageId,
    path,
  );

  if (resolved === undefined) {
    return undefined;
  }

  switch (reference.kind) {
    case "content-node":
    case "content-node-state":
    case "flow-graph":
      return resolveLocalTarget(resolved.component, reference);

    default:
      return undefined;
  }
}

/**
 * 解決済みの値からStructured ReferenceのPathを順番にたどる。
 *
 * @param value - Path探索を開始する値。
 * @param path - Property名またはArray IndexからなるPath。
 * @returns Pathの参照先。Pathが不正または存在しない場合は `undefined`。
 */
export function resolveReferencePath(
  value: unknown,
  path: readonly ReferencePathSegment[],
): unknown {
  let current: unknown = value;

  for (const segment of path) {
    if (typeof segment === "number") {
      if (
        !Array.isArray(current) ||
        !Number.isInteger(segment) ||
        segment < 0 ||
        segment >= current.length
      ) {
        return undefined;
      }

      current = current[segment];
      continue;
    }

    if (
      typeof current !== "object" ||
      current === null ||
      Array.isArray(current) ||
      !Object.hasOwn(current, segment)
    ) {
      return undefined;
    }

    current = (
      current as Readonly<Record<string, unknown>>
    )[segment];
  }

  return current;
}
