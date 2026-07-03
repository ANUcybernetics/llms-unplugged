// How Chinese text is segmented in the widgets: "word" (jieba word
// segmentation, the default) or "char" (one token per character). Shared so the
// Training and Generation widgets on a page stay in step. Only surfaced in the
// UI when the training text actually contains Chinese.

export type CjkMode = "word" | "char";

const STORAGE_KEY = "llms-unplugged-cjk-mode";
const DEFAULT_MODE: CjkMode = "word";

function loadFromStorage(): CjkMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    return localStorage.getItem(STORAGE_KEY) === "char" ? "char" : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

let cjkMode = $state<CjkMode>(loadFromStorage());

export function getCjkMode(): CjkMode {
  return cjkMode;
}

export function setCjkMode(mode: CjkMode) {
  cjkMode = mode;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {}
}
