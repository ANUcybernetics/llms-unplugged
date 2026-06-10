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
    minStepInterval?: number;
    maxStepInterval?: number;
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
    minStepInterval = PLAYBACK_CONFIG.GENERATION_MIN_STEP_INTERVAL_MS,
    maxStepInterval = PLAYBACK_CONFIG.GENERATION_MAX_STEP_INTERVAL_MS,
    sliderId = "speed-slider",
    loop = false,
    onplay,
    onpause,
    onstep,
    onreset,
    onstepintervalchange,
  }: Props = $props();
</script>

<div class="controls-strip">
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
    <span class="speed-label" aria-hidden="true">Slow</span>
    <input
      id={sliderId}
      value={stepInterval}
      type="range"
      min={minStepInterval}
      max={maxStepInterval}
      step="50"
      style="direction: rtl"
      aria-label="Playback speed"
      oninput={(e) => onstepintervalchange(Number((e.target as HTMLInputElement).value))}
    />
    <span class="speed-label" aria-hidden="true">Fast</span>
  </div>
</div>
