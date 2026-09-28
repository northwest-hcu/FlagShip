<script lang="ts">
  let { label, value, options, onChange, disabled = false }: {
    label: string; value: string; options: { value: string; label: string }[];
    onChange: (value: string) => void; disabled?: boolean;
  } = $props();
</script>
<div class="toggle-group" class:wrapped={options.length > 3} role="group" aria-label={label}>
  {#each options as option}
    <button type="button" aria-pressed={value === option.value} {disabled} onclick={() => onChange(option.value)}>{option.label}</button>
  {/each}
</div>
