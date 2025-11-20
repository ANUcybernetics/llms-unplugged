<template>
  <div class="slidev-layout two-cols">
    <div class="col-left">
      <slot name="default" />
    </div>
    <div class="col-right">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
.two-cols {
  padding: 2.5rem;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.col-left, .col-right {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
</style>
