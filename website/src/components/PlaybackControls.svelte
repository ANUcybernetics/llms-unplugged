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
    {isPlaying ? "⏸ Pause" : "▶ Play"}
  </button>
  <button
    type="button"
    aria-label="Step forward"
    disabled={isComplete}
    onclick={onstep}
  >
    ⏭ Step
  </button>
  <button type="button" aria-label="Reset" onclick={onreset}>↺ Reset</button>
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
    padding: 0.375rem 0.625rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    font-size: 0.875rem;
    font-family: inherit;
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
