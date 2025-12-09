import { ref, watch } from "vue";

const STORAGE_KEY = "llms-unplugged-training-text";
const DEFAULT_TEXT = "The cat sat on the mat.";

let initialized = false;
const sharedText = ref(DEFAULT_TEXT);

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
  if (!initialized) {
    sharedText.value = loadFromStorage();
    initialized = true;
  }

  watch(
    sharedText,
    (newValue) => {
      saveToStorage(newValue);
    },
    { flush: "sync" },
  );

  return sharedText;
}

export function resetTrainingText() {
  sharedText.value = DEFAULT_TEXT;
  initialized = false;
}
