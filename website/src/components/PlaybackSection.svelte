<script lang="ts">
  import PlaybackControls from "./PlaybackControls.svelte";
  import { PLAYBACK_CONFIG } from "../lib/config/playback";

  interface Props {
    isPlaying: boolean;
    isComplete: boolean;
    currentStep?: number;
    totalSteps?: number;
    showStepCounter?: boolean;
    stepInterval: number;
    sliderId?: string;
    loop?: boolean;
    onplay: () => void;
    onpause: () => void;
    onstep: () => void;
    onreset: () => void;
    onstepintervalchange: (value: number) => void;
  }

  let {
    isPlaying,
    isComplete,
    currentStep = 0,
    totalSteps = 0,
    showStepCounter = false,
    stepInterval,
    sliderId = "speed-slider",
    loop = false,
    onplay,
    onpause,
    onstep,
    onreset,
    onstepintervalchange,
  }: Props = $props();
</script>

<div class="widget-section">
  <div class="section-header">Controls</div>
  <div class="section-content controls-content">
    <PlaybackControls
      {isPlaying}
      {isComplete}
      {currentStep}
      {totalSteps}
      {showStepCounter}
      {loop}
      {onplay}
      {onpause}
      {onstep}
      {onreset}
    />
    <div class="speed-control">
      <span class="speed-label">Slow</span>
      <input
        id={sliderId}
        value={stepInterval}
        type="range"
        min={PLAYBACK_CONFIG.MIN_STEP_INTERVAL_MS}
        max={PLAYBACK_CONFIG.MAX_STEP_INTERVAL_MS}
        step="50"
        oninput={(e) =>
          onstepintervalchange(Number((e.target as HTMLInputElement).value))}
      />
      <span class="speed-label">Fast</span>
    </div>
  </div>
</div>
