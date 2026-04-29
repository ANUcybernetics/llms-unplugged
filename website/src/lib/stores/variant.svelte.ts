export type Variant = "grid" | "cutouts";

const STORAGE_KEY = "llms-unplugged-variant";
const DEFAULT_VARIANT: Variant = "grid";

function loadVariant(): Variant {
  if (typeof window === "undefined") return DEFAULT_VARIANT;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "grid" || stored === "cutouts") return stored;
    if (stored === "bucket") {
      localStorage.setItem(STORAGE_KEY, "cutouts");
      return "cutouts";
    }
  } catch {}
  return DEFAULT_VARIANT;
}

let variant = $state<Variant>(loadVariant());

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && (e.newValue === "grid" || e.newValue === "cutouts")) {
      variant = e.newValue;
    }
  });
}

export function getVariant(): Variant {
  return variant;
}

export function setVariant(v: Variant) {
  variant = v;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {}
  }
}

export function toggleVariant() {
  setVariant(variant === "grid" ? "cutouts" : "grid");
}

export function isGrid(): boolean {
  return variant === "grid";
}

export function isCutouts(): boolean {
  return variant === "cutouts";
}
