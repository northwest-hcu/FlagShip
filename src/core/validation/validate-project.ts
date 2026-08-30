import {
  isStableId,
  type StableIdPrefix,
} from "../id";
import type {
  Component,
} from "../model/component";
import type {
  FlowGraph,
} from "../model/flow";
import type { ProjectDocument } from "../model/project";
import type { Reference } from "../model/reference";
import type {
  DataSchema,
  PersistentStateValue,
} from "../model/state";
import type {
  ComponentInstance,
  ContentNodeState,
  ContentTree,
} from "../model/ui";
import type { LiteralValue } from "../model/value";
import { CURRENT_SCHEMA_VERSION } from "../model/schema-version";
import {
  resolveCurrentComponentReferenceTarget,
  resolveProjectReferenceTarget,
  resolveReferencePath,
  resolveProjectComponent,
} from "../references";

/** Project Validationで返す安定したDiagnostic Code。 */
export type ProjectDiagnosticCode =
  | "UNSUPPORTED_SCHEMA_VERSION"
  | "INVALID_STABLE_ID"
  | "DUPLICATE_STABLE_ID"
  | "INVALID_LIBRARY_SOURCE"
  | "COLLECTION_KEY_MISMATCH"
  | "MISSING_COMPONENT"
  | "AMBIGUOUS_COMPONENT"
  | "COMPONENT_VERSION_MISMATCH"
  | "MISSING_CONTENT_ROOT"
  | "DUPLICATE_LOCAL_ID"
  | "MISSING_CHILD_TARGET"
  | "MISSING_SLOT"
  | "RESERVED_DEFAULT_SLOT"
  | "TEXT_NODE_HAS_CHILDREN"
  | "INVALID_PARENT_REFERENCE"
  | "CIRCULAR_CONTENT_TREE"
  | "CIRCULAR_COMPONENT_COMPOSITION"
  | "DUPLICATE_FLOW_NODE_ID"
  | "DUPLICATE_FLOW_EDGE_ID"
  | "MISSING_FLOW_NODE"
  | "INVALID_FLOW_PORT"
  | "MISSING_REFERENCE_TARGET"
  | "AMBIGUOUS_REFERENCE_TARGET"
  | "INVALID_STATE_SCHEMA"
  | "INVALID_STATE_INITIAL_VALUE";

/** Diagnosticが指すProject Entity。 */
export interface DiagnosticEntity {
  /** Entityの種類。 */
  readonly kind: string;

  /** EntityのStable IDまたはLocal ID。 */
  readonly id: string;
}

/** Editor、Preview、Exportで共有するProject Diagnostic。 */
export interface ProjectDiagnostic {
  /** 表示文言から独立した安定Diagnostic Code。 */
  readonly code: ProjectDiagnosticCode;

  /** Diagnosticの重大度。 */
  readonly severity: "error" | "warning";

  /** 問題のOwner Entity。 */
  readonly entity?: DiagnosticEntity;

  /** 解決できなかったStructured Reference。 */
  readonly reference?: Reference;

  /** 初見User向けの説明。 */
  readonly message: string;

  /** Project Document内の該当位置。 */
  readonly path: readonly (string | number)[];
}

const REFERENCE_KINDS = new Set([
  "content-node",
  "content-node-state",
  "overlay-tree",
  "application-state",
  "resource",
  "flow-graph",
  "flow-node-output",
  "event",
  "variables",
  "env",
  "external",
]);

function isRecord(
  value: unknown,
): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
}

function isReference(value: unknown): value is Reference {
  return isRecord(value) &&
    typeof value.kind === "string" &&
    REFERENCE_KINDS.has(value.kind);
}

function collectReferences(
  value: unknown,
  path: readonly (string | number)[],
  found: Array<{
    readonly reference: Reference;
    readonly path: readonly (string | number)[];
  }>,
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      collectReferences(entry, [...path, index], found);
    });
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  if (isReference(value)) {
    found.push({ reference: value, path });
    return;
  }

  if (isReference(value.$ref)) {
    found.push({ reference: value.$ref, path: [...path, "$ref"] });
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    collectReferences(entry, [...path, key], found);
  }
}

function matchesSchema(
  schema: DataSchema,
  value: LiteralValue,
): boolean {
  switch (schema.type) {
    case "unknown":
      return true;

    case "null":
      return value === null;

    case "string":
    case "number":
    case "boolean":
      return typeof value === schema.type;

    case "array":
      return Array.isArray(value) &&
        value.every((entry) => matchesSchema(schema.items, entry));

    case "object":
      if (!isRecord(value)) {
        return false;
      }

      if (schema.required.some((key) => !Object.hasOwn(value, key))) {
        return false;
      }

      return Object.entries(schema.properties).every(
        ([key, propertySchema]) =>
          !Object.hasOwn(value, key) ||
          matchesSchema(
            propertySchema,
            value[key] as LiteralValue,
          ),
      );
  }
}

function isValidSchema(schema: DataSchema): boolean {
  switch (schema.type) {
    case "unknown":
    case "null":
    case "string":
    case "number":
    case "boolean":
      return true;

    case "array":
      return isValidSchema(schema.items);

    case "object": {
      const required = new Set(schema.required);

      return required.size === schema.required.length &&
        schema.required.every((key) =>
          Object.hasOwn(schema.properties, key)) &&
        Object.values(schema.properties).every(isValidSchema);
    }
  }
}

function hasPersistentState(
  state: ContentNodeState,
): state is PersistentStateValue {
  return "schema" in state && "initialValue" in state;
}

function getComponentTrees(component: Component): readonly ContentTree[] {
  const trees: ContentTree[] = [];

  if (component.contentTree !== null) {
    trees.push(component.contentTree);
  }

  for (const overlay of Object.values(component.overlayTrees)) {
    trees.push(overlay.contentTree);
  }

  return trees;
}

function getComponentInstances(
  component: Component,
): readonly ComponentInstance[] {
  return getComponentTrees(component).flatMap(
    (tree) => Object.values(tree.componentInstances),
  );
}

/**
 * Project Document全体のSchema、ID、Reference、Semantic整合性を検証する。
 *
 * @param project - 検証するProject Document。
 * @returns Editor、Preview、Exportで共有できるDiagnostic Collection。
 */
export function validateProject(
  project: ProjectDocument,
): readonly ProjectDiagnostic[] {
  const diagnostics: ProjectDiagnostic[] = [];
  const globalIds = new Set<string>();

  const add = (diagnostic: Omit<ProjectDiagnostic, "severity">): void => {
    diagnostics.push({ severity: "error", ...diagnostic });
  };

  const validateId = (
    id: string,
    prefix: StableIdPrefix,
    path: readonly (string | number)[],
    entity?: DiagnosticEntity,
  ): void => {
    if (!isStableId(id, prefix)) {
      add({
        code: "INVALID_STABLE_ID",
        entity,
        message: `Expected a ${prefix} Stable ID.`,
        path,
      });
    }
  };

  const validateKey = (
    key: string,
    id: string,
    path: readonly (string | number)[],
    entity?: DiagnosticEntity,
  ): void => {
    if (key !== id) {
      add({
        code: "COLLECTION_KEY_MISMATCH",
        entity,
        message: "Collection key must match the entity ID.",
        path,
      });
    }
  };

  const validateGlobalId = (
    id: string,
    prefix: StableIdPrefix,
    path: readonly (string | number)[],
    entity?: DiagnosticEntity,
  ): void => {
    validateId(id, prefix, path, entity);

    if (globalIds.has(id)) {
      add({
        code: "DUPLICATE_STABLE_ID",
        entity,
        message: "Stable ID must be unique within the Project scope.",
        path,
      });
    }

    globalIds.add(id);
  };

  const validatePersistentState = (
    state: PersistentStateValue,
    path: readonly (string | number)[],
    entity: DiagnosticEntity,
  ): void => {
    if (!isValidSchema(state.schema)) {
      add({
        code: "INVALID_STATE_SCHEMA",
        entity,
        message: "State schema contains an invalid required property or nested schema.",
        path: [...path, "schema"],
      });
      return;
    }

    if (!matchesSchema(state.schema, state.initialValue)) {
      add({
        code: "INVALID_STATE_INITIAL_VALUE",
        entity,
        message: "State initialValue does not match its schema.",
        path: [...path, "initialValue"],
      });
    }
  };

  const validateInstance = (
    instance: ComponentInstance,
    path: readonly (string | number)[],
  ): void => {
    const entity = { kind: "component-instance", id: instance.id };
    validateId(instance.id, "component-instance", [...path, "id"], entity);

    const importedComponent = project.components
      .importedAssets[instance.componentId]?.component;
    const localComponent = project.components
      .localLibrary.assets[instance.componentId];

    if (
      importedComponent !== undefined &&
      localComponent !== undefined
    ) {
      add({
        code: "AMBIGUOUS_COMPONENT",
        entity,
        message: "Component ID exists in both Imported Assets and Local Library.",
        path: [...path, "componentId"],
      });
      return;
    }

    const component = resolveProjectComponent(
      project,
      instance.componentId,
    );

    if (component === undefined) {
      add({
        code: "MISSING_COMPONENT",
        entity,
        message: "Component Instance target does not exist.",
        path: [...path, "componentId"],
      });
      return;
    }

    if (component.version !== instance.componentVersion) {
      add({
        code: "COMPONENT_VERSION_MISMATCH",
        entity,
        message: "Component Instance version does not match the imported asset.",
        path: [...path, "componentVersion"],
      });
    }

    const componentNodes = {
      ...(component.contentTree?.nodes ?? {}),
      ...Object.fromEntries(
        Object.values(component.overlayTrees).flatMap((overlay) =>
          Object.entries(overlay.contentTree.nodes)),
      ),
    };

    for (const [contentNodeId, value] of Object.entries(instance.state ?? {})) {
      const node = componentNodes[contentNodeId];
      const statePath = [...path, "state", contentNodeId];
      if (!node) {
        add({
          code: "MISSING_REFERENCE_TARGET",
          entity,
          message: "Component Instance State target Content Node does not exist.",
          path: statePath,
        });
      } else if (!hasPersistentState(node.state) ||
          !matchesSchema(node.state.schema, value)) {
        add({
          code: "INVALID_STATE_INITIAL_VALUE",
          entity,
          message: "Component Instance State does not match the Content Node schema.",
          path: statePath,
        });
      }
    }

    for (const [index, placement] of (instance.children ?? []).entries()) {
      const placementPath = [...path, "children", index];
      const parentNode = componentNodes[placement.parentContentNodeId];
      const hasSlot = parentNode?.slots.some(
        (slot) => slot.id === placement.slotId,
      ) ?? false;
      if (placement.slotId === "default") {
        add({
          code: "RESERVED_DEFAULT_SLOT",
          entity,
          message: "Component Instance child cannot use the default Slot.",
          path: [...placementPath, "slotId"],
        });
      } else if (!parentNode || !hasSlot) {
        add({
          code: "MISSING_SLOT",
          entity,
          message: "Component Instance child target Named Slot does not exist.",
          path: [...placementPath, "slotId"],
        });
      }
      validateInstance(placement.instance, [...placementPath, "instance"]);
    }
  };

  const validateContentTree = (
    tree: ContentTree,
    path: readonly (string | number)[],
    owner: DiagnosticEntity,
  ): void => {
    const nodeParentCounts = new Map(
      Object.keys(tree.nodes).map((id) => [id, 0]),
    );
    const instanceParentCounts = new Map(
      Object.keys(tree.componentInstances).map((id) => [id, 0]),
    );

    if (tree.nodes[tree.rootNodeId] === undefined) {
      add({
        code: "MISSING_CONTENT_ROOT",
        entity: owner,
        message: "Content Tree rootNodeId does not resolve to a node.",
        path: [...path, "rootNodeId"],
      });
    }

    for (const [key, instance] of Object.entries(
      tree.componentInstances,
    )) {
      const instancePath = [...path, "componentInstances", key];
      validateKey(key, instance.id, [...instancePath, "id"], {
        kind: "component-instance",
        id: instance.id,
      });
      validateInstance(instance, instancePath);
    }

    for (const [key, node] of Object.entries(tree.nodes)) {
      const nodePath = [...path, "nodes", key];
      const entity = { kind: "content-node", id: node.id };
      validateKey(key, node.id, [...nodePath, "id"], entity);
      validateId(node.id, "content-node", [...nodePath, "id"], entity);

      if (hasPersistentState(node.state)) {
        validatePersistentState(node.state, [...nodePath, "state"], entity);
      }

      if (node.type === "text") {
        if (node.children.length > 0 || node.slots.length > 0) {
          add({
            code: "TEXT_NODE_HAS_CHILDREN",
            entity,
            message: "Text Content Node must remain a leaf.",
            path: nodePath,
          });
        }
      } else {
        const slotIds = new Set<string>();

        for (const [slotIndex, slot] of node.slots.entries()) {
          if (typeof slot.id !== "string" || slot.id.length === 0) {
            add({
              code: "MISSING_SLOT",
              entity,
              message: "Named Slot ID must not be empty.",
              path: [...nodePath, "slots", slotIndex, "id"],
            });
          } else if (slot.id === "default") {
            add({
              code: "RESERVED_DEFAULT_SLOT",
              entity,
              message: "The default Slot is reserved and cannot be used.",
              path: [...nodePath, "slots", slotIndex, "id"],
            });
          }

          if (slotIds.has(slot.id)) {
            add({
              code: "DUPLICATE_LOCAL_ID",
              entity,
              message: "Named Slot ID must be unique within its Content Node.",
              path: [...nodePath, "slots", slotIndex, "id"],
            });
          }

          slotIds.add(slot.id);
        }

        for (const [childIndex, child] of node.children.entries()) {
          const childPath = [...nodePath, "children", childIndex];

          if (
            typeof child.slotId !== "string" ||
            child.slotId.length === 0
          ) {
            add({
              code: "MISSING_SLOT",
              entity,
              message: "Child Placement must specify a Named Slot ID.",
              path: [...childPath, "slotId"],
            });
          } else if (child.slotId === "default") {
            add({
              code: "RESERVED_DEFAULT_SLOT",
              entity,
              message: "Child Placement cannot use the default Slot.",
              path: [...childPath, "slotId"],
            });
          } else if (!slotIds.has(child.slotId)) {
            add({
              code: "MISSING_SLOT",
              entity,
              message: "Child Placement target Slot does not exist.",
              path: [...childPath, "slotId"],
            });
          }

          const targetExists = child.target.type === "content-node"
            ? tree.nodes[child.target.nodeId] !== undefined
            : tree.componentInstances[
              child.target.componentInstanceId
            ] !== undefined;

          if (!targetExists) {
            add({
              code: "MISSING_CHILD_TARGET",
              entity,
              message: "Child Placement target does not exist in this Content Tree.",
              path: [...childPath, "target"],
            });
          } else if (child.target.type === "content-node") {
            nodeParentCounts.set(
              child.target.nodeId,
              (nodeParentCounts.get(child.target.nodeId) ?? 0) + 1,
            );
          } else {
            instanceParentCounts.set(
              child.target.componentInstanceId,
              (instanceParentCounts.get(
                child.target.componentInstanceId,
              ) ?? 0) + 1,
            );
          }
        }
      }
    }

    for (const [nodeId, parentCount] of nodeParentCounts) {
      const expectedCount = nodeId === tree.rootNodeId ? 0 : 1;

      if (parentCount !== expectedCount) {
        add({
          code: "INVALID_PARENT_REFERENCE",
          entity: { kind: "content-node", id: nodeId },
          message: nodeId === tree.rootNodeId
            ? "Root Content Node must not have a parent."
            : "Non-root Content Node must have exactly one parent.",
          path: [...path, "nodes", nodeId],
        });
      }
    }

    for (const [instanceId, parentCount] of instanceParentCounts) {
      if (parentCount !== 1) {
        add({
          code: "INVALID_PARENT_REFERENCE",
          entity: { kind: "component-instance", id: instanceId },
          message: "Nested Component Instance must have exactly one Child Placement.",
          path: [...path, "componentInstances", instanceId],
        });
      }
    }

    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (nodeId: string): boolean => {
      if (visiting.has(nodeId)) {
        return true;
      }
      if (visited.has(nodeId)) {
        return false;
      }

      visiting.add(nodeId);
      const node = tree.nodes[nodeId];

      if (node?.type === "container" || node?.type === "button") {
        for (const child of node.children) {
          if (
            child.target.type === "content-node" &&
            visit(child.target.nodeId)
          ) {
            return true;
          }
        }
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      return false;
    };

    for (const nodeId of Object.keys(tree.nodes)) {
      if (visit(nodeId)) {
        add({
          code: "CIRCULAR_CONTENT_TREE",
          entity: owner,
          message: "Content Tree contains a circular child relationship.",
          path,
        });
        break;
      }
    }
  };

  const validateReference = (
    reference: Reference,
    path: readonly (string | number)[],
    graph?: FlowGraph,
    component?: Component,
  ): void => {
    let target: unknown;
    let matches = 0;

    if (reference.kind === "event" || reference.kind === "variables") {
      return;
    }

    if (reference.kind === "external") {
      return;
    }

    if (reference.kind === "env") {
      target = resolveReferencePath(
        project.settings.environment,
        reference.path,
      );
    } else if (
      "scope" in reference &&
      reference.scope === "current-component-instance" &&
      component !== undefined
    ) {
      target = resolveCurrentComponentReferenceTarget(
        project,
        component,
        reference,
      );
    } else if (
      reference.kind === "content-node" ||
      reference.kind === "content-node-state" ||
      reference.kind === "overlay-tree" ||
      (reference.kind === "flow-graph" && "localId" in reference)
    ) {
      for (const pageId of Object.keys(project.ui.pages)) {
        const resolved = resolveProjectReferenceTarget(
          project,
          reference,
          { pageId, currentFlowGraph: graph },
        );

        if (resolved !== undefined) {
          target = resolved;
          matches += 1;
        }
      }
    } else {
      target = resolveProjectReferenceTarget(
        project,
        reference,
        { currentFlowGraph: graph },
      );
    }

    if (matches > 1) {
      add({
        code: "AMBIGUOUS_REFERENCE_TARGET",
        reference,
        message: "Structured Reference resolves on more than one UI Page.",
        path,
      });
      return;
    }

    if (target === undefined) {
      add({
        code: "MISSING_REFERENCE_TARGET",
        reference,
        message: "Structured Reference target does not exist.",
        path,
      });
      return;
    }

    const referencePath = "path" in reference
      ? reference.path
      : undefined;
    let pathRoot: unknown;
    let shouldValidatePath = false;

    if (
      "path" in reference &&
      referencePath !== undefined &&
      reference.kind === "application-state"
    ) {
      shouldValidatePath = true;
      pathRoot = isRecord(target) ? target.initialValue : undefined;
    } else if (
      "path" in reference &&
      referencePath !== undefined &&
      reference.kind === "content-node-state"
    ) {
      shouldValidatePath = true;
      pathRoot = isRecord(target) ? target.initialValue : undefined;
    } else if (
      "path" in reference &&
      referencePath !== undefined &&
      reference.kind === "flow-node-output"
    ) {
      shouldValidatePath = true;
      pathRoot = isRecord(target) ? target.outputs : undefined;
    }

    if (
      shouldValidatePath &&
      (pathRoot === undefined ||
        resolveReferencePath(pathRoot, referencePath ?? []) === undefined)
    ) {
      add({
        code: "MISSING_REFERENCE_TARGET",
        reference,
        message: "Structured Reference path does not exist on its target.",
        path,
      });
    }
  };

  const validateContentTreeReferences = (
    tree: ContentTree,
    path: readonly (string | number)[],
    component: Component,
  ): void => {
    for (const [nodeKey, node] of Object.entries(tree.nodes)) {
      if (node.type !== "text") {
        continue;
      }

      const references: Array<{
        readonly reference: Reference;
        readonly path: readonly (string | number)[];
      }> = [];
      collectReferences(
        node.value,
        [...path, "nodes", nodeKey, "value"],
        references,
      );

      for (const found of references) {
        validateReference(
          found.reference,
          found.path,
          undefined,
          component,
        );
      }
    }
  };

  const validateFlowGraph = (
    graph: FlowGraph,
    path: readonly (string | number)[],
    component?: Component,
  ): void => {
    const entity = { kind: "flow-graph", id: graph.id };
    validateId(graph.id, "flow", [...path, "id"], entity);

    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();

    for (const [nodeIndex, node] of graph.nodes.entries()) {
      const nodePath = [...path, "nodes", nodeIndex];
      validateId(node.id, "flow-node", [...nodePath, "id"], {
        kind: "flow-node",
        id: node.id,
      });

      if (nodeIds.has(node.id)) {
        add({
          code: "DUPLICATE_FLOW_NODE_ID",
          entity,
          message: "Flow Node ID must be unique within its Flow Graph.",
          path: [...nodePath, "id"],
        });
      }
      nodeIds.add(node.id);

      const references: Array<{
        readonly reference: Reference;
        readonly path: readonly (string | number)[];
      }> = [];
      collectReferences(node.config, [...nodePath, "config"], references);
      collectReferences(node.inputs, [...nodePath, "inputs"], references);

      for (const found of references) {
        validateReference(
          found.reference,
          found.path,
          graph,
          component,
        );
      }
    }

    for (const [edgeIndex, edge] of graph.edges.entries()) {
      const edgePath = [...path, "edges", edgeIndex];
      validateId(edge.id, "edge", [...edgePath, "id"], {
        kind: "flow-edge",
        id: edge.id,
      });

      if (edgeIds.has(edge.id)) {
        add({
          code: "DUPLICATE_FLOW_EDGE_ID",
          entity,
          message: "Flow Edge ID must be unique within its Flow Graph.",
          path: [...edgePath, "id"],
        });
      }
      edgeIds.add(edge.id);

      if (!nodeIds.has(edge.fromNode) || !nodeIds.has(edge.toNode)) {
        add({
          code: "MISSING_FLOW_NODE",
          entity,
          message: "Flow Edge target Node does not exist.",
          path: edgePath,
        });
      }

      if (edge.fromPort.length === 0 || edge.toPort.length === 0) {
        add({
          code: "INVALID_FLOW_PORT",
          entity,
          message: "Flow Edge ports must not be empty.",
          path: edgePath,
        });
      }
    }
  };

  validateGlobalId(project.meta.id, "project", ["meta", "id"], {
    kind: "project",
    id: project.meta.id,
  });

  if (project.meta.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    add({
      code: "UNSUPPORTED_SCHEMA_VERSION",
      entity: { kind: "project", id: project.meta.id },
      message: "Project schemaVersion is not supported by this build.",
      path: ["meta", "schemaVersion"],
    });
  }

  for (const [pageKey, page] of Object.entries(project.ui.pages)) {
    const pagePath = ["ui", "pages", pageKey] as const;
    const entity = { kind: "ui-page", id: page.id };
    validateKey(pageKey, page.id, [...pagePath, "id"], entity);
    validateGlobalId(page.id, "ui-page", [...pagePath, "id"], entity);
    const pageInstanceIds = new Set<string>();

    for (const [key, instance] of Object.entries(page.componentInstances)) {
      validateKey(key, instance.id, [
        ...pagePath,
        "componentInstances",
        key,
        "id",
      ], { kind: "component-instance", id: instance.id });
      validateInstance(instance, [
        ...pagePath,
        "componentInstances",
        key,
      ]);

      if (pageInstanceIds.has(instance.id)) {
        add({
          code: "DUPLICATE_LOCAL_ID",
          entity: { kind: "component-instance", id: instance.id },
          message: "Component Instance ID must be unique within a UI Page.",
          path: [...pagePath, "componentInstances", key, "id"],
        });
      }
      pageInstanceIds.add(instance.id);
    }
  }

  const componentIds = new Set<string>();
  const componentPaths = new Map<
    string,
    readonly (string | number)[]
  >();
  const componentEntries: Array<{
    readonly componentKey: string;
    readonly component: Component;
    readonly componentPath: readonly (string | number)[];
  }> = [];

  for (const [assetKey, importedAsset] of Object.entries(
    project.components.importedAssets,
  )) {
    const assetPath = [
      "components",
      "importedAssets",
      assetKey,
    ] as const;
    const sourceEntity = {
      kind: "component-library",
      id: importedAsset.source.libraryId,
    };
    validateId(
      importedAsset.source.libraryId,
      "library",
      [...assetPath, "source", "libraryId"],
      sourceEntity,
    );

    if (
      importedAsset.source.kind !== "base" &&
      importedAsset.source.kind !== "public"
    ) {
      add({
        code: "INVALID_LIBRARY_SOURCE",
        entity: sourceEntity,
        message: "Imported Component source kind must be base or public.",
        path: [...assetPath, "source", "kind"],
      });
    }

    if (importedAsset.source.libraryVersion.trim().length === 0) {
      add({
        code: "INVALID_LIBRARY_SOURCE",
        entity: sourceEntity,
        message: "Imported Component source must specify a Library Version.",
        path: [...assetPath, "source", "libraryVersion"],
      });
    }

    componentEntries.push({
      componentKey: assetKey,
      component: importedAsset.component,
      componentPath: [...assetPath, "component"],
    });
  }

  const localLibraryPath = ["components", "localLibrary"] as const;
  validateGlobalId(
    project.components.localLibrary.id,
    "library",
    [...localLibraryPath, "id"],
    {
      kind: "component-library",
      id: project.components.localLibrary.id,
    },
  );

  for (const [assetKey, component] of Object.entries(
    project.components.localLibrary.assets,
  )) {
    componentEntries.push({
      componentKey: assetKey,
      component,
      componentPath: [...localLibraryPath, "assets", assetKey],
    });
  }

  for (const {
    componentKey,
    component,
    componentPath,
  } of componentEntries) {
    componentIds.add(component.id);
    componentPaths.set(component.id, componentPath);
    const entity = { kind: "component", id: component.id };
    validateKey(componentKey, component.id, [...componentPath, "id"], entity);
    validateGlobalId(
      component.id,
      "component",
      [...componentPath, "id"],
      entity,
    );

    const localNodeIds = new Set<string>();
    const localInstanceIds = new Set<string>();
    const overlayIds = new Set<string>();
    const flowGraphIds = new Set<string>();
    const triggerIds = new Set<string>();

    const validateTreeLocalIds = (
      tree: ContentTree,
      treePath: readonly (string | number)[],
    ): void => {
      for (const node of Object.values(tree.nodes)) {
        if (localNodeIds.has(node.id)) {
          add({
            code: "DUPLICATE_LOCAL_ID",
            entity,
            message: "Content Node Local ID must be unique within a Component.",
            path: treePath,
          });
        }
        localNodeIds.add(node.id);
      }

      for (const instance of Object.values(tree.componentInstances)) {
        if (localInstanceIds.has(instance.id)) {
          add({
            code: "DUPLICATE_LOCAL_ID",
            entity,
            message: "Component Instance Local ID must be unique within a Component.",
            path: treePath,
          });
        }
        localInstanceIds.add(instance.id);
      }
    };

    if (component.contentTree !== null) {
      const treePath = [...componentPath, "contentTree"];
      validateTreeLocalIds(component.contentTree, treePath);
      validateContentTree(component.contentTree, treePath, entity);
      validateContentTreeReferences(
        component.contentTree,
        treePath,
        component,
      );
    }

    for (const [overlayKey, overlay] of Object.entries(
      component.overlayTrees,
    )) {
      const overlayPath = [
        ...componentPath,
        "overlayTrees",
        overlayKey,
      ];
      const overlayEntity = { kind: "overlay-tree", id: overlay.id };
      validateKey(overlayKey, overlay.id, [...overlayPath, "id"], overlayEntity);
      validateId(overlay.id, "overlay", [...overlayPath, "id"], overlayEntity);

      if (overlayIds.has(overlay.id)) {
        add({
          code: "DUPLICATE_LOCAL_ID",
          entity,
          message: "Overlay Tree ID must be unique within a Component.",
          path: [...overlayPath, "id"],
        });
      }
      overlayIds.add(overlay.id);

      validateTreeLocalIds(overlay.contentTree, [
        ...overlayPath,
        "contentTree",
      ]);
      validateContentTree(
        overlay.contentTree,
        [...overlayPath, "contentTree"],
        overlayEntity,
      );
      validateContentTreeReferences(
        overlay.contentTree,
        [...overlayPath, "contentTree"],
        component,
      );

      if (overlay.openTrigger !== null) {
        const trigger = overlay.openTrigger;
        validateId(trigger.id, "trigger", [
          ...overlayPath,
          "openTrigger",
          "id",
        ], { kind: "trigger-instance", id: trigger.id });

        if (triggerIds.has(trigger.id)) {
          add({
            code: "DUPLICATE_LOCAL_ID",
            entity,
            message: "Trigger Instance ID must be unique within a Component.",
            path: [...overlayPath, "openTrigger", "id"],
          });
        }
        triggerIds.add(trigger.id);

        const references: Array<{
          readonly reference: Reference;
          readonly path: readonly (string | number)[];
        }> = [];
        collectReferences(
          trigger.config,
          [...overlayPath, "openTrigger", "config"],
          references,
        );
        for (const found of references) {
          validateReference(
            found.reference,
            found.path,
            undefined,
            component,
          );
        }
      }

      if (overlay.positioning.type === "anchor") {
        validateReference(
          overlay.positioning.anchor,
          [...overlayPath, "positioning", "anchor"],
          undefined,
          component,
        );
      }
    }

    for (const [graphKey, graph] of Object.entries(component.flowGraphs)) {
      const graphPath = [
        ...componentPath,
        "flowGraphs",
        graphKey,
      ];
      validateKey(graphKey, graph.id, [...graphPath, "id"], {
        kind: "flow-graph",
        id: graph.id,
      });

      if (flowGraphIds.has(graph.id)) {
        add({
          code: "DUPLICATE_LOCAL_ID",
          entity,
          message: "Flow Graph ID must be unique within a Component.",
          path: [...graphPath, "id"],
        });
      }
      flowGraphIds.add(graph.id);

      validateFlowGraph(graph, graphPath, component);
    }
  }

  const visitingComponents = new Set<string>();
  const visitedComponents = new Set<string>();

  const visitComponent = (componentId: string): boolean => {
    if (visitingComponents.has(componentId)) {
      return true;
    }
    if (visitedComponents.has(componentId)) {
      return false;
    }

    visitingComponents.add(componentId);
    const component = resolveProjectComponent(project, componentId);

    if (component !== undefined) {
      for (const instance of getComponentInstances(component)) {
        if (
          resolveProjectComponent(project, instance.componentId) !==
            undefined &&
          visitComponent(instance.componentId)
        ) {
          return true;
        }
      }
    }

    visitingComponents.delete(componentId);
    visitedComponents.add(componentId);
    return false;
  };

  for (const componentId of componentIds) {
    if (visitComponent(componentId)) {
      add({
        code: "CIRCULAR_COMPONENT_COMPOSITION",
        entity: { kind: "component", id: componentId },
        message: "Component composition contains a circular dependency.",
        path: componentPaths.get(componentId) ?? ["components"],
      });
      break;
    }
  }

  for (const [graphKey, graph] of Object.entries(project.flows.graphs)) {
    const graphPath = ["flows", "graphs", graphKey] as const;
    validateKey(graphKey, graph.id, [...graphPath, "id"], {
      kind: "flow-graph",
      id: graph.id,
    });
    validateGlobalId(graph.id, "flow", [...graphPath, "id"], {
      kind: "flow-graph",
      id: graph.id,
    });
    validateFlowGraph(graph, graphPath);
  }

  for (const [stateKey, state] of Object.entries(project.state.states)) {
    const statePath = ["state", "states", stateKey] as const;
    const entity = { kind: "application-state", id: state.id };
    validateKey(stateKey, state.id, [...statePath, "id"], entity);
    validateGlobalId(state.id, "state", [...statePath, "id"], entity);
    validatePersistentState(state, statePath, entity);
  }

  for (const [resourceKey, resource] of Object.entries(
    project.resources.resources,
  )) {
    const resourcePath = ["resources", "resources", resourceKey] as const;
    const entity = { kind: "resource", id: resource.id };
    validateKey(resourceKey, resource.id, [...resourcePath, "id"], entity);
    validateGlobalId(
      resource.id,
      "resource",
      [...resourcePath, "id"],
      entity,
    );

    const references: Array<{
      readonly reference: Reference;
      readonly path: readonly (string | number)[];
    }> = [];
    collectReferences(resource, resourcePath, references);
    for (const found of references) {
      validateReference(found.reference, found.path);
    }
  }

  return diagnostics;
}
