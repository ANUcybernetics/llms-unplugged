import { ref, watch } from "vue";

export type Variant = "grid" | "bucket";

const STORAGE_KEY = "llms-unplugged-variant";
const DEFAULT_VARIANT: Variant = "grid";

function getStoredVariant(): Variant {
  if (typeof window === "undefined") return DEFAULT_VARIANT;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "grid" || stored === "bucket") return stored;
  return DEFAULT_VARIANT;
}

const variant = ref<Variant>(DEFAULT_VARIANT);
let initialized = false;

export function useVariant() {
  if (typeof window !== "undefined" && !initialized) {
    variant.value = getStoredVariant();
    initialized = true;

    watch(variant, (newVal) => {
      localStorage.setItem(STORAGE_KEY, newVal);
    });

    window.addEventListener("storage", (e) => {
      if (
        e.key === STORAGE_KEY &&
        (e.newValue === "grid" || e.newValue === "bucket")
      ) {
        variant.value = e.newValue;
      }
    });
  }

  function setVariant(v: Variant) {
    variant.value = v;
  }

  function toggleVariant() {
    variant.value = variant.value === "grid" ? "bucket" : "grid";
  }

  return {
    variant,
    setVariant,
    toggleVariant,
    isGrid: () => variant.value === "grid",
    isBucket: () => variant.value === "bucket",
  };
}
