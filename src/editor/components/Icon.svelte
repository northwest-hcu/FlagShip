<script lang="ts">
  import { iconCodepoint, type IconFontId } from "../icon-catalog";
  let { label = "情報", decorative = false, symbol = "info", font = "symbols-outlined", fill = "0", source = "", color = "var(--frame-text)", background = "transparent" }: {
    label?: string; decorative?: boolean; symbol?: string; font?: IconFontId; fill?: "0" | "1"; source?: string; color?: string; background?: string;
  } = $props();
  const glyph = $derived(String.fromCodePoint(iconCodepoint(font, symbol) ?? iconCodepoint(font, "info")!));
</script>
<span class="component-icon" role={decorative ? undefined : "img"} aria-label={decorative ? undefined : label} aria-hidden={decorative ? "true" : undefined}
  data-icon-symbol={symbol} data-icon-font={font} style:color style:background>
  {#if source}
    <img class="icon-image" src={source} alt="" aria-hidden="true" />
  {:else}
    <span class="icon-glyph" aria-hidden="true" style:font-family={"FlagShip " + font} style:--icon-fill={fill}>{glyph}</span>
  {/if}
</span>
