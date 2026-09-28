<script lang="ts">
  let { alt = "山と太陽を描いたサンプル画像", source = "/images/sample-landscape.svg", decorative = false, background = "transparent" }: { alt?: string; source?: string; decorative?: boolean; background?: string } = $props();
</script>

<img class="component-image" src={source} alt={decorative ? "" : alt} aria-hidden={decorative ? "true" : undefined} width="320" height="180" draggable="false" style:background />
