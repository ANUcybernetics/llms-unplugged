<script lang="ts">
  import { onMount, type Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  let containerEl: HTMLElement | undefined = $state();
  let isFullscreen = $state(false);

  function updateFullscreenState() {
    isFullscreen = document.fullscreenElement === containerEl;
  }

  async function toggleFullscreen() {
    if (!containerEl || !document.fullscreenEnabled) return;
    try {
      if (!document.fullscreenElement) {
        await containerEl.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }

  onMount(() => {
    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreenState);
    };
  });
</script>

<div
  bind:this={containerEl}
  class="fullscreen-wrapper"
  class:fullscreen={isFullscreen}
>
  <button
    type="button"
    class="fullscreen-button"
    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    onclick={toggleFullscreen}
  >
    ⛶
  </button>
  <div class="fullscreen-content" class:scaled={isFullscreen}>
    {@render children()}
  </div>
</div>

<style>
  .fullscreen-wrapper {
    position: relative;
  }

  .fullscreen-wrapper.fullscreen {
    background: var(--color-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    overflow-y: auto;
  }

  .fullscreen-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 10;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    font-size: 1rem;
    font-family: inherit;
    line-height: 1;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .fullscreen-button:hover {
    opacity: 1;
  }

  .fullscreen-content {
    width: 100%;
  }

  .fullscreen-content.scaled {
    font-size: 1.1em;
    max-width: 90vw;
    margin: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    .fullscreen-button {
      transition: none;
    }
  }
</style>
