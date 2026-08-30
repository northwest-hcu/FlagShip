import type { LiteralValue } from "../core/model/value";
import {
  executeFlowGraph,
  type FlowExecutionResult,
} from "../runtime/flow/flow-engine";
import type { FlowGraph } from "../core/model/flow";

/** Editorで安全に実行できるNode Handlerを使ってFlowを実行する。 */
export function executeEditorFlow(
  graph: FlowGraph,
): Promise<FlowExecutionResult> {
  return executeFlowGraph(graph, {
    "data.constant": (node) => {
      const value = node.config.value;
      if (!isLiteralValue(value)) {
        throw new Error("data.constant requires a literal config.value.");
      }
      return { value };
    },
  });
}

function isLiteralValue(value: unknown): value is LiteralValue {
  if (value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean") {
    return true;
  }
  if (Array.isArray(value)) return value.every(isLiteralValue);
  if (typeof value !== "object") return false;
  if ("$ref" in value) return false;
  return Object.values(value).every(isLiteralValue);
}
