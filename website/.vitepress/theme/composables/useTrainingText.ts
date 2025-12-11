import { ref, watch, effectScope } from "vue";

const STORAGE_KEY = "llms-unplugged-training-text";
const DEFAULT_TEXT = "The cat sat on the mat.";

const sharedText = ref(DEFAULT_TEXT);
let watcherScope: ReturnType<typeof effectScope> | null = null;

function loadFromStorage(): string {
  if (typeof window === "undefined") return DEFAULT_TEXT;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ?? DEFAULT_TEXT;
  } catch {
    return DEFAULT_TEXT;
  }
}

function saveToStorage(text: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, text);
  } catch {
    // ignore storage errors
  }
}

export function useTrainingText() {
  if (!watcherScope) {
    watcherScope = effectScope();
    watcherScope.run(() => {
      sharedText.value = loadFromStorage();

      watch(
        sharedText,
        (newValue) => {
          saveToStorage(newValue);
        },
        { flush: "sync" },
      );
    });
  }

  return sharedText;
}

export function resetTrainingText() {
  sharedText.value = DEFAULT_TEXT;
}
