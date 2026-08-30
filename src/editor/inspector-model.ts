import type { Component } from "../core/model/component";
import type {
  ComponentInstance,
  ContentNode,
} from "../core/model/ui";
import type { LiteralValue } from "../core/model/value";

export interface EditableStateField {
  readonly contentNodeId: string;
  readonly contentNodeName: string;
  readonly key: string;
  readonly type: "string" | "boolean";
  readonly value: string | boolean;
}

export interface EditableNamedSlot {
  readonly contentNodeId: string;
  readonly contentNodeName: string;
  readonly id: string;
  readonly name: string;
  readonly children: readonly ComponentInstance[];
}

/** Content TreeとOverlay Treeに含まれるContent Nodeを返す。 */
export function listComponentNodes(
  component: Component,
): readonly ContentNode[] {
  return [
    ...Object.values(component.contentTree?.nodes ?? {}),
    ...Object.values(component.overlayTrees).flatMap(
      (overlay) => Object.values(overlay.contentTree.nodes),
    ),
  ];
}

/** Inspectorで編集できるScalar State Fieldを列挙する。 */
export function listEditableStateFields(
  component: Component,
  instance: ComponentInstance,
): readonly EditableStateField[] {
  return listComponentNodes(component).flatMap((node) => {
    if (!("schema" in node.state) || node.state.schema.type !== "object") {
      return [];
    }
    const initial = asRecord(node.state.initialValue);
    const current = asRecord(instance.state?.[node.id]) ?? initial;

    return Object.entries(node.state.schema.properties).flatMap(
      ([key, schema]) => {
        if (schema.type !== "string" && schema.type !== "boolean") return [];
        const value = current?.[key];
        const fieldValue: string | boolean = schema.type === "boolean"
          ? typeof value === "boolean" ? value : false
          : typeof value === "string" ? value : "";
        return [{
          contentNodeId: node.id,
          contentNodeName: node.name,
          key,
          type: schema.type,
          value: fieldValue,
        }];
      },
    );
  });
}

/** Inspectorで編集できるNamed Slotと現在の子Instanceを列挙する。 */
export function listEditableNamedSlots(
  component: Component,
  instance: ComponentInstance,
): readonly EditableNamedSlot[] {
  return listComponentNodes(component).flatMap((node) =>
    node.slots.map((slot) => ({
      contentNodeId: node.id,
      contentNodeName: node.name,
      id: slot.id,
      name: slot.name,
      children: (instance.children ?? [])
        .filter((placement) =>
          placement.parentContentNodeId === node.id &&
          placement.slotId === slot.id)
        .map((placement) => placement.instance),
    })),
  );
}

/** 1 Fieldの変更をContent Node State Objectへ反映する。 */
export function replaceStateField(
  component: Component,
  instance: ComponentInstance,
  contentNodeId: string,
  key: string,
  value: string | boolean,
): LiteralValue {
  const node = listComponentNodes(component).find(
    (candidate) => candidate.id === contentNodeId,
  );
  const initial = node && "initialValue" in node.state
    ? asRecord(node.state.initialValue)
    : undefined;
  const current = asRecord(instance.state?.[contentNodeId]) ?? initial ?? {};
  return { ...current, [key]: value };
}

function asRecord(
  value: LiteralValue | undefined,
): Readonly<Record<string, LiteralValue>> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Readonly<Record<string, LiteralValue>>
    : undefined;
}
