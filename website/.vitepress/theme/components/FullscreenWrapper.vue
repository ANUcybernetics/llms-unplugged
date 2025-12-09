<script setup lang="ts">
/* eslint-disable no-undef -- browser globals used in client-side component */
import { ref, onMounted, onUnmounted } from "vue";

const containerRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);

function updateFullscreenState() {
  isFullscreen.value = document.fullscreenElement === containerRef.value;
}

async function toggleFullscreen() {
  if (!containerRef.value) return;

  try {
    if (!document.fullscreenElement) {
      await containerRef.value.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (err) {
    console.error("Fullscreen error:", err);
  }
}

onMounted(() => {
  document.addEventListener("fullscreenchange", updateFullscreenState);
});

onUnmounted(() => {
  document.removeEventListener("fullscreenchange", updateFullscreenState);
});
/* eslint-enable no-undef */
</script>

<template>
  <div
    ref="containerRef"
    class="fullscreen-wrapper"
    :class="{ fullscreen: isFullscreen }"
  >
    <button
      type="button"
      class="fullscreen-button"
      :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
      @click="toggleFullscreen"
    >
      {{ isFullscreen ? "⛶" : "⛶" }}
    </button>
    <div class="fullscreen-content" :class="{ scaled: isFullscreen }">
      <slot
        :is-fullscreen="isFullscreen"
        :toggle-fullscreen="toggleFullscreen"
      />
    </div>
  </div>
</template>

<style scoped>
.fullscreen-wrapper {
  position: relative;
}

.fullscreen-wrapper.fullscreen {
  background: var(--vp-c-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.fullscreen-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 0.25rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.fullscreen-button:hover {
  opacity: 1;
}

.fullscreen-content {
  width: 100%;
  transform-origin: center center;
  transition: transform 0.3s;
}

.fullscreen-content.scaled {
  transform: scale(1.3);
}

@media (prefers-reduced-motion: reduce) {
  .fullscreen-button,
  .fullscreen-content {
    transition: none;
  }
}
</style>
