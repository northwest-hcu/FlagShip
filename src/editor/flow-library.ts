import type { FlowNodeType } from "./flow-model";

export type FlowLibraryEntry = { type: FlowNodeType; name: string; category: "EVENT" | "LOGIC" | "ACTION"; libraryId: string };

export const FLOW_NODE_LIBRARY: readonly FlowLibraryEntry[] = [
  { type: "trigger.event", name: "Event Trigger", category: "EVENT", libraryId: "default" },
  { type: "trigger.schedule", name: "Schedule Trigger", category: "EVENT", libraryId: "default" },
  { type: "trigger.load", name: "Page Load Trigger", category: "EVENT", libraryId: "default" },
  { type: "logic.condition", name: "Condition", category: "LOGIC", libraryId: "default" },
  { type: "action.navigate", name: "Navigate Page", category: "ACTION", libraryId: "default" },
  { type: "action.set-variable", name: "Set", category: "ACTION", libraryId: "default" },
  { type: "action.init-variable", name: "Init Variable", category: "ACTION", libraryId: "default" },
  { type: "action.init-constant", name: "Init Constant", category: "ACTION", libraryId: "default" },
];

export function filterFlowLibrary(query: string, libraryId: string, entries: readonly FlowLibraryEntry[] = FLOW_NODE_LIBRARY): FlowLibraryEntry[] {
  const term = query.trim().normalize("NFKC").toLowerCase();
  return entries.filter((entry) => (!libraryId || entry.libraryId === libraryId)
    && (!term || `${entry.name} ${entry.type} ${entry.category}`.normalize("NFKC").toLowerCase().includes(term)));
}
