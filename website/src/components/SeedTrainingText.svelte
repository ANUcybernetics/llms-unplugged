<script lang="ts">
  // Seeds the shared training-text store (which the Training and Generation
  // widgets read) with a page-specific example. Renders nothing. Mount it
  // with client:load so it runs before the client:visible widgets hydrate.
  import { onMount } from "svelte";
  import { isDefaultTrainingText, setTrainingText } from "../lib/stores/trainingText.svelte";

  interface Props {
    text: string;
    /** Only seed when the store still holds the built-in default, so a
     *  visitor's own text from another page survives. */
    replaceDefaultOnly?: boolean;
  }

  let { text, replaceDefaultOnly = true }: Props = $props();

  onMount(() => {
    if (!replaceDefaultOnly || isDefaultTrainingText()) setTrainingText(text);
  });
</script>
