const STORAGE_KEY = "llms-unplugged-training-text";
const DEFAULT_TEXT = "The cat sat on the mat.";

function loadFromStorage(): string {
  if (typeof window === "undefined") return DEFAULT_TEXT;
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_TEXT;
  } catch {
    return DEFAULT_TEXT;
  }
}

function saveToStorage(text: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, text);
  } catch {}
}

let trainingText = $state(loadFromStorage());

export function getTrainingText(): string {
  return trainingText;
}

export function setTrainingText(text: string) {
  trainingText = text;
  saveToStorage(text);
}

export function resetTrainingText() {
  setTrainingText(DEFAULT_TEXT);
}
