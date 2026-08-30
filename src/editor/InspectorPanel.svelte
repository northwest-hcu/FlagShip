<script lang="ts">
  import type { Component } from "../core/model/component";
  import type { ComponentInstance } from "../core/model/ui";
  import { listEditableStateFields } from "./inspector-model";

  interface Props {
    readonly component: Component | undefined;
    readonly instance: ComponentInstance | undefined;
    readonly onstatechange: (
      contentNodeId: string,
      key: string,
      value: string | boolean,
    ) => void;
  }

  let {
    component,
    instance,
    onstatechange,
  }: Props = $props();

  const stateFields = $derived(
    component && instance ? listEditableStateFields(component, instance) : [],
  );
</script>

<aside id="inspector-panel" class="panel inspector-panel" aria-labelledby="inspector-heading">
  <h2 id="inspector-heading">Inspector</h2>
  {#if component && instance}
    <div class="inspector-editor">
      <dl class="inspector-details">
        <div><dt>Name</dt><dd>{component.name}</dd></div>
        <div><dt>Instance</dt><dd>{instance.id}</dd></div>
        <div><dt>Version</dt><dd>{component.version}</dd></div>
      </dl>

      {#if stateFields.length > 0}
        <section class="inspector-group" aria-labelledby="state-heading">
          <h3 id="state-heading">State</h3>
          {#each stateFields as field (`${field.contentNodeId}:${field.key}`)}
            <label class="state-field">
              <span>{field.key}</span>
              {#if field.type === "boolean"}
                <input
                  type="checkbox"
                  checked={field.value === true}
                  onchange={(event) => onstatechange(
                    field.contentNodeId,
                    field.key,
                    event.currentTarget.checked,
                  )}
                />
              {:else}
                <input
                  type="text"
                  value={String(field.value)}
                  oninput={(event) => onstatechange(
                    field.contentNodeId,
                    field.key,
                    event.currentTarget.value,
                  )}
                />
              {/if}
            </label>
          {/each}
        </section>
      {/if}

    </div>
  {:else}
    <p class="empty-panel">Layersの編集アイコンから選択してください。</p>
  {/if}
</aside>
