<script lang="ts">
  import { COLOR_PRESETS, colorCss, colorHex, colorFromHex, type ColorValue } from "./colors";
  let { label, value, id, active = true, inherited = false, onChange, onReset }: {
    label: string; value: ColorValue; id: string; active?: boolean; inherited?: boolean;
    onChange: (value: ColorValue) => void; onReset: () => void;
  } = $props();
  const channels = ["r", "g", "b", "a"] as const;
  let customOpen = $state(false);
  let draft = $state<ColorValue>({ r: 0, g: 0, b: 0, a: 1 });
  const displayColor = $derived(customOpen ? draft : value);
  $effect(() => { if (!active) customOpen = false; });
  function begin(): void { draft = { ...value }; customOpen = true; }
  function apply(): void { onChange({ ...draft }); customOpen = false; }
  function reset(): void { customOpen = false; onReset(); }
  function change(channel: typeof channels[number], raw: string): void {
    if (!raw.trim() || !Number.isFinite(Number(raw))) return;
    const number = Math.max(0, Math.min(channel === "a" ? 1 : 255, Number(raw)));
    draft = { ...draft, [channel]: channel === "a" ? number : Math.round(number) };
  }
</script>
<div class="color-picker">
  <div class="color-current">
    {#if customOpen}
      <input type="color" aria-label={label + " RGBピッカー"} value={colorHex(draft)}
        oninput={(event) => draft = colorFromHex(event.currentTarget.value, draft.a)} />
    {:else}<span class="color-swatch" style:background={colorCss(value)} aria-hidden="true"></span>{/if}
    <output aria-label={label + " 現在色"}>{colorHex(displayColor)} / A {displayColor.a}</output>
  </div>
  {#if inherited}<p class="color-origin">親の色を適用中</p>{/if}
  <div class="color-presets" role="group" aria-label={label + " 15色パレット"} hidden={customOpen}>
    {#each COLOR_PRESETS as preset}
      <button type="button" aria-label={preset.label} title={preset.label} aria-pressed={colorHex(value) === preset.hex}
        style:background={preset.hex} onclick={() => onChange(colorFromHex(preset.hex, value.a))}></button>
    {/each}
  </div>
  <div class="color-actions">
    <button type="button" aria-label={label + "をカスタム"} aria-expanded={customOpen} aria-controls={id} hidden={customOpen} onclick={begin}>カスタム…</button>
    <button type="button" aria-label={label + "をリセット"} title={inherited ? "このコンポーネントで最後に選んだ色に戻す" : "テーマの初期色に戻す"} onclick={reset}>リセット</button>
  </div>
  <div class="color-custom" id={id} role="group" aria-label={label + " カスタム編集"} hidden={!customOpen}>
    {#each channels as channel}
      <div class="color-channel"><span>{channel.toUpperCase()}</span>
        <input type="range" aria-label={label + " " + channel.toUpperCase() + "スライダー"} min="0" max={channel === "a" ? 1 : 255} step={channel === "a" ? .01 : 1}
          value={draft[channel]} oninput={(event) => change(channel, event.currentTarget.value)} />
        <input type="number" aria-label={label + " " + channel.toUpperCase()} min="0" max={channel === "a" ? 1 : 255} step={channel === "a" ? .01 : 1}
          value={draft[channel]} oninput={(event) => change(channel, event.currentTarget.value)} />
      </div>
    {/each}
    <div class="color-actions color-confirm">
      <button type="button" aria-label={label + "のカスタム色を適用"} onclick={apply}>適用</button>
      <button type="button" aria-label={label + "のカスタム編集をキャンセル"} onclick={() => customOpen = false}>キャンセル</button>
    </div>
  </div>
</div>
