<template>
  <div class="slidev-layout center">
    <slot />
  </div>
</template>

<style scoped>
.center {
  padding: 2.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}
</style>
