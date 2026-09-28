<script lang="ts">
  let { source = "", poster = "", label = "動画", captions = "", background = "var(--frame-panel)" }: {
    source?: string; poster?: string; label?: string; captions?: string; background?: string;
  } = $props();
</script>

<video class="component-video" src={source || undefined} poster={poster || undefined} aria-label={label} controls playsinline preload="none" style:background>
  <track kind="captions" src={captions || undefined} srclang="ja" label="字幕" />
</video>
