import {
  executeProjectFlow,
} from "../runtime/flow/project-flow-runtime";
import type { FlowExecutionResult } from "../runtime/flow/flow-engine";
import type { FlowGraph } from "../core/model/flow";

/** Editorで安全に実行できるNode Handlerを使ってFlowを実行する。 */
export function executeEditorFlow(
  graph: FlowGraph,
): Promise<FlowExecutionResult> {
  return executeProjectFlow(graph);
}
