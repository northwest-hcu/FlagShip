<script lang="ts">
  const HANDLE_SIZE = 6;
  const KEYBOARD_STEP = 16;
  const MIN_LAYERS_WIDTH = 160;
  const MIN_MAIN_WIDTH = 480;
  const MIN_CANVAS_WIDTH = 240;
  const MIN_FLOW_WIDTH = 192;
  const MIN_TOP_HEIGHT = 160;
  const MIN_INSPECTOR_HEIGHT = 128;

  let editorBody: HTMLDivElement;
  let mainArea: HTMLDivElement;
  let canvasFlow: HTMLDivElement;

  let layersWidth = 256;
  let flowWidth = 288;
  let inspectorHeight = 192;

  function clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
  }

  function resizeLayers(event: PointerEvent): void {
    const bounds = editorBody.getBoundingClientRect();
    const maximum = bounds.width - MIN_MAIN_WIDTH - HANDLE_SIZE;
    layersWidth = clamp(
      event.clientX - bounds.left,
      MIN_LAYERS_WIDTH,
      maximum
    );
  }

  function resizeCanvasFlow(event: PointerEvent): void {
    const bounds = canvasFlow.getBoundingClientRect();
    const maximum = bounds.width - MIN_CANVAS_WIDTH - HANDLE_SIZE;
    flowWidth = clamp(
      bounds.right - event.clientX,
      MIN_FLOW_WIDTH,
      maximum
    );
  }

  function resizeInspector(event: PointerEvent): void {
    const bounds = mainArea.getBoundingClientRect();
    const maximum = bounds.height - MIN_TOP_HEIGHT - HANDLE_SIZE;
    inspectorHeight = clamp(
      bounds.bottom - event.clientY,
      MIN_INSPECTOR_HEIGHT,
      maximum
    );
  }

  function beginResize(
    event: PointerEvent,
    resize: (moveEvent: PointerEvent) => void,
    cursor: "col-resize" | "row-resize"
  ): void {
    if (event.button !== 0) return;

    event.preventDefault();

    const handle = event.currentTarget as HTMLElement;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    let finished = false;

    function finish(): void {
      if (finished) return;
      finished = true;

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

  function resizeLayersWithKeyboard(event: KeyboardEvent): void {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();

    const maximum = editorBody.clientWidth - MIN_MAIN_WIDTH - HANDLE_SIZE;
    const difference =
      event.key === "ArrowRight" ? KEYBOARD_STEP : -KEYBOARD_STEP;

    layersWidth = clamp(
      layersWidth + difference,
      MIN_LAYERS_WIDTH,
      maximum
    );
  }

  function resizeCanvasFlowWithKeyboard(event: KeyboardEvent): void {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();

    const maximum =
      canvasFlow.clientWidth - MIN_CANVAS_WIDTH - HANDLE_SIZE;
    const difference =
      event.key === "ArrowLeft" ? KEYBOARD_STEP : -KEYBOARD_STEP;

    flowWidth = clamp(
      flowWidth + difference,
      MIN_FLOW_WIDTH,
      maximum
    );
  }

  function resizeInspectorWithKeyboard(event: KeyboardEvent): void {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();

    const maximum =
      mainArea.clientHeight - MIN_TOP_HEIGHT - HANDLE_SIZE;
    const difference =
      event.key === "ArrowUp" ? KEYBOARD_STEP : -KEYBOARD_STEP;

    inspectorHeight = clamp(
      inspectorHeight + difference,
      MIN_INSPECTOR_HEIGHT,
      maximum
    );
  }
</script>

<main
  class="editor-shell"
  style={`--layers-width: ${layersWidth}px; --flow-width: ${flowWidth}px; --inspector-height: ${inspectorHeight}px;`}
>
  <header class="editor-header">
    <h1>FlagShip</h1>
  </header>

  <div class="editor-body" bind:this={editorBody}>
    <aside
      id="layers-panel"
      class="panel layers-panel"
      aria-labelledby="layers-heading"
    >
      <h2 id="layers-heading">Layers</h2>
    </aside>

    <button
      type="button"
      class="resize-handle vertical-resize-handle"
      aria-label="Layersの横幅を変更"
      aria-controls="layers-panel"
      onpointerdown={(event) =>
        beginResize(event, resizeLayers, "col-resize")}
      onkeydown={resizeLayersWithKeyboard}
    ></button>

    <div class="main-area" bind:this={mainArea}>
      <div class="canvas-flow" bind:this={canvasFlow}>
        <section
          id="canvas-panel"
          class="panel canvas-panel"
          aria-labelledby="canvas-heading"
        >
          <h2 id="canvas-heading">Canvas</h2>
        </section>

        <button
          type="button"
          class="resize-handle vertical-resize-handle"
          aria-label="CanvasとFlowの横幅を変更"
          aria-controls="canvas-panel flow-panel"
          onpointerdown={(event) =>
            beginResize(event, resizeCanvasFlow, "col-resize")}
          onkeydown={resizeCanvasFlowWithKeyboard}
        ></button>

        <section
          id="flow-panel"
          class="panel flow-panel"
          aria-labelledby="flow-heading"
        >
          <h2 id="flow-heading">Flow</h2>
        </section>
      </div>

      <button
        type="button"
        class="resize-handle horizontal-resize-handle"
        aria-label="Inspectorの高さを変更"
        aria-controls="inspector-panel"
        onpointerdown={(event) =>
          beginResize(event, resizeInspector, "row-resize")}
        onkeydown={resizeInspectorWithKeyboard}
      ></button>

      <aside
        id="inspector-panel"
        class="panel inspector-panel"
        aria-labelledby="inspector-heading"
      >
        <h2 id="inspector-heading">Inspector</h2>
      </aside>
    </div>
  </div>
</main>