export type Variant = "grid" | "ledger" | "cutouts";

export const VARIANTS: readonly Variant[] = ["grid", "ledger", "cutouts"];

function isVariant(v: unknown): v is Variant {
  return VARIANTS.includes(v as Variant);
}

const STORAGE_KEY = "llms-unplugged-variant";
const DEFAULT_VARIANT: Variant = "grid";

function loadVariant(): Variant {
  if (typeof window === "undefined") return DEFAULT_VARIANT;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isVariant(stored)) return stored;
    if (stored === "bucket") {
      localStorage.setItem(STORAGE_KEY, "cutouts");
      return "cutouts";
    }
  } catch {}
  return DEFAULT_VARIANT;
}

let variant = $state<Variant>(loadVariant());

// The CSS-only .grid-only/.ledger-only/.cutouts-only gating keys off this attribute, so it
// must track the store everywhere the store changes (including cross-tab
// storage events) or the toggle buttons and the visible content drift apart.
export function applyVariantToDocument(v: Variant) {
  document.documentElement.setAttribute("data-variant", v);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && isVariant(e.newValue)) {
      variant = e.newValue;
      applyVariantToDocument(e.newValue);
    }
  });
}

export function getVariant(): Variant {
  return variant;
}

export function setVariant(v: Variant) {
  variant = v;
  if (typeof window !== "undefined") {
    applyVariantToDocument(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {}
  }
}
