<script setup lang="ts">
import { computed } from "vue";
import { useVariant } from "../composables/useVariant";

const { variant } = useVariant();
const show = computed(() => variant.value === "grid");
</script>

<template>
  <div v-if="show" class="variant-content grid-only">
    <slot />
  </div>
</template>

<style scoped>
.variant-content {
  display: contents;
}
</style>
