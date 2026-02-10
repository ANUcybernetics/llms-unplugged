<script setup lang="ts">
/* eslint-disable no-undef -- browser globals used in client-side component */
import { ref, onMounted, onUnmounted } from "vue";

const containerRef = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);

function updateFullscreenState() {
  if (typeof window === 'undefined') return;
  isFullscreen.value = document.fullscreenElement === containerRef.value;
}

async function toggleFullscreen() {
  if (typeof window === 'undefined' || !containerRef.value) return;
  if (!document.fullscreenEnabled) return;

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
  if (typeof window !== 'undefined') {
    document.addEventListener("fullscreenchange", updateFullscreenState);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener("fullscreenchange", updateFullscreenState);
  }
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
  padding: 2rem;
  overflow-y: auto;
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
}

.fullscreen-content.scaled {
  font-size: 1.1em;
  max-width: 90vw;
  margin: auto;
}

@media (min-width: 1200px) {
  .fullscreen-wrapper.fullscreen {
    padding: 1rem 2rem;
  }

  .fullscreen-content.scaled :deep(.lm-widget) {
    padding: 0.5rem;
  }

  .fullscreen-content.scaled :deep(.training-view),
  .fullscreen-content.scaled :deep(.generation-view) {
    gap: 0.5rem;
  }

  .fullscreen-content.scaled :deep(.section-header) {
    padding: 0.25rem 0.5rem;
  }

  .fullscreen-content.scaled :deep(.section-content) {
    padding: 0.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fullscreen-button,
  .fullscreen-content {
    transition: none;
  }
}
</style>
