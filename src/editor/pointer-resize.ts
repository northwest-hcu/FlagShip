/** Pointer Capture中の移動をPanel Size更新Callbackへ渡す。 */
export function beginPointerResize(
  event: PointerEvent,
  resize: (moveEvent: PointerEvent) => void,
  cursor: "col-resize" | "row-resize",
): void {
  if (event.button !== 0) return;
  event.preventDefault();
  const handle = event.currentTarget as HTMLElement;
  const previousCursor = document.body.style.cursor;
  const previousUserSelect = document.body.style.userSelect;

  function finish(): void {
    handle.removeEventListener("pointermove", resize);
    handle.removeEventListener("pointerup", finish);
    handle.removeEventListener("pointercancel", finish);
    if (handle.hasPointerCapture(event.pointerId)) {
      handle.releasePointerCapture(event.pointerId);
    }
    document.body.style.cursor = previousCursor;
    document.body.style.userSelect = previousUserSelect;
  }

  handle.setPointerCapture(event.pointerId);
  handle.addEventListener("pointermove", resize);
  handle.addEventListener("pointerup", finish);
  handle.addEventListener("pointercancel", finish);
  document.body.style.cursor = cursor;
  document.body.style.userSelect = "none";
}

/** Arrow KeyによるPanel Size変更を適用する。 */
export function applyKeyboardResize(
  event: KeyboardEvent,
  decreaseKey: string,
  increaseKey: string,
  current: number,
  minimum: number,
  maximum: number,
  apply: (value: number) => void,
  step = 16,
): void {
  if (event.key !== decreaseKey && event.key !== increaseKey) return;
  event.preventDefault();
  const difference = event.key === increaseKey ? step : -step;
  apply(clamp(current + difference, minimum, maximum));
}

/** SizeをPanelの許容範囲へ収める。 */
export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}
