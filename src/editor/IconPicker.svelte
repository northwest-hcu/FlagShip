<script lang="ts">
  import Icon from "./components/Icon.svelte";
  import { searchIcons, type IconFontId } from "./icon-catalog";
  import type { EnumOption } from "./component-model";
  let { value, font, options, onChange }: { value: string; font: IconFontId; options?: readonly EnumOption[]; onChange: (value: string) => void } = $props();
  let query = $state("");
  let page = $state(0);
  let previousFont: IconFontId | undefined;
  const PAGE_SIZE = 36;
  const choices = $derived(options ?? searchIcons(font).map((icon) => ({ value: icon.name, label: icon.name })));
  const matches = $derived(choices.filter((option) => query.toLowerCase().trim().replaceAll("-", "_").split(/\s+/).filter(Boolean).every((term) => option.value.includes(term))));
  const visible = $derived(matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE));
  $effect(() => {
    if (font !== previousFont) { previousFont = font; query = ""; page = 0; }
  });
</script>
<div class="icon-picker">
  <div class="icon-current"><Icon symbol={value} {font} decorative /><span>{value}</span></div>
  <label class="field-value"><span class="visually-hidden">アイコンを検索</span>
    <input type="search" aria-label="アイコンを検索" placeholder="名前で検索 — home, search, …" value={query}
      oninput={(event) => { query = event.currentTarget.value; page = 0; }} />
  </label>
  <p class="icon-result-count">{matches.length} / {choices.length}</p>
  <div class="icon-options" role="group" aria-label="Symbol">
    {#each visible as icon (icon.value)}
      <button type="button" title={icon.label} aria-label={icon.label} aria-pressed={value === icon.value} onclick={() => onChange(icon.value)}>
        <Icon symbol={icon.value} {font} decorative /><span>{icon.label}</span>
      </button>
    {:else}<p class="details-empty">一致するアイコンがありません</p>{/each}
  </div>
  <div class="icon-pagination">
    <button type="button" class="toolbar-button" disabled={page === 0} onclick={() => page--}>前の一覧</button>
    <span>{page + 1} / {Math.max(1, Math.ceil(matches.length / PAGE_SIZE))}</span>
    <button type="button" class="toolbar-button" disabled={(page + 1) * PAGE_SIZE >= matches.length} onclick={() => page++}>次の一覧</button>
  </div>
</div>
