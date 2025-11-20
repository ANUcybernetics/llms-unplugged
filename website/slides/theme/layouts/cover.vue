<template>
  <div class="slidev-layout cover">
    <slot />
  </div>
</template>

<style scoped>
.cover {
  padding: 2.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.cover :deep(h1) {
  font-size: 3.5em;
  line-height: 1.2;
  margin-bottom: 0.5em;
}

.cover :deep(p) {
  font-size: 1.25em;
  color: rgba(255, 255, 255, 0.8);
}
</style>
