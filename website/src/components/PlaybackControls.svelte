<script lang="ts">
  interface Props {
    isPlaying: boolean;
    isComplete: boolean;
    currentStep: number;
    totalSteps: number;
    showStepCounter?: boolean;
    loop?: boolean;
    onplay: () => void;
    onpause: () => void;
    onstep: () => void;
    onreset: () => void;
  }

  let {
    isPlaying,
    isComplete,
    currentStep,
    totalSteps,
    showStepCounter = true,
    loop = false,
    onplay,
    onpause,
    onstep,
    onreset,
  }: Props = $props();

  function handlePlayPause() {
    if (isPlaying) {
      onpause();
    } else {
      onplay();
    }
  }
</script>

<div class="playback-controls">
  <button
    type="button"
    aria-label={isPlaying ? "Pause" : "Play"}
    disabled={isComplete && !isPlaying && !loop}
    onclick={handlePlayPause}
  >
    {#if isPlaying}
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <rect x="5" y="3" width="5" height="18" rx="1" />
        <rect x="14" y="3" width="5" height="18" rx="1" />
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <polygon points="5,3 21,12 5,21" />
      </svg>
    {/if}
  </button>
  <button
    type="button"
    aria-label="Step forward"
    disabled={isComplete}
    onclick={onstep}
  >
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <polygon points="3,3 15,12 3,21" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  </button>
  <button type="button" aria-label="Reset" onclick={onreset}>
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 1 3 6.7" />
      <polyline points="3 7 3 13 9 13" />
    </svg>
  </button>
  {#if showStepCounter && totalSteps > 0}
    <span class="step-counter">{currentStep} / {totalSteps}</span>
  {/if}
</div>

<style>
  .playback-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    align-items: center;
  }

  .playback-controls button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .playback-controls button:hover:not(:disabled) {
    background: var(--color-brand-soft);
  }

  .playback-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .step-counter {
    margin-left: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    font-family: var(--font-mono);
  }

  @media (prefers-reduced-motion: reduce) {
    .playback-controls button {
      transition: none;
    }
  }
</style>
