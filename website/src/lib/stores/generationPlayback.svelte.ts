import { PLAYBACK_CONFIG } from "../config/playback";

export interface GenerationPlaybackOptions {
  doStep: (stepInterval: number) => Promise<void>;
  resetState: () => void;
  preparePlay: () => void;
  loop: boolean;
}

export function createGenerationPlayback(opts: GenerationPlaybackOptions) {
  let isPlaying = $state(false);
  let _isComplete = $state(false);
  let stepInterval: number = $state(PLAYBACK_CONFIG.DEFAULT_STEP_INTERVAL_MS);
  let abortController: AbortController | null = null;

  function abortableSleep(ms: number, signal: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timeout);
          reject(new DOMException("Aborted", "AbortError"));
        },
        { once: true },
      );
    });
  }

  function startLoop() {
    abortController?.abort();
    abortController = new AbortController();
    const signal = abortController.signal;

    (async () => {
      try {
        while (isPlaying && !signal.aborted) {
          await opts.doStep(stepInterval);
          if (_isComplete) {
            if (opts.loop) {
              await abortableSleep(
                stepInterval * PLAYBACK_CONFIG.LOOP_PAUSE_MULTIPLIER,
                signal,
              );
              _isComplete = false;
              opts.resetState();
              opts.preparePlay();
              continue;
            }
            break;
          }
          await abortableSleep(stepInterval, signal);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        throw error;
      }
    })();
  }

  $effect(() => {
    if (isPlaying) {
      startLoop();
      return () => {
        abortController?.abort();
        abortController = null;
      };
    }
  });

  return {
    get isPlaying() {
      return isPlaying;
    },
    get isComplete() {
      return _isComplete;
    },
    get stepInterval() {
      return stepInterval;
    },
    set stepInterval(value: number) {
      stepInterval = value;
    },
    markComplete() {
      _isComplete = true;
      if (!opts.loop) {
        isPlaying = false;
      }
    },
    play() {
      if (_isComplete) {
        _isComplete = false;
        opts.resetState();
      }
      opts.preparePlay();
      isPlaying = true;
    },
    pause() {
      isPlaying = false;
    },
    step() {
      return opts.doStep(stepInterval);
    },
    reset() {
      isPlaying = false;
      _isComplete = false;
      opts.resetState();
    },
    cleanup() {
      abortController?.abort();
      abortController = null;
    },
  };
}
