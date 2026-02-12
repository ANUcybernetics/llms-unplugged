<script setup lang="ts">
import { computed } from "vue";
import { data as allNews } from "../../../news/news.data";
import Card from "./Card.vue";

const props = withDefaults(
  defineProps<{
    limit?: number;
  }>(),
  { limit: 0 },
);

const news = computed(() => {
  const sorted = [...allNews].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return props.limit > 0 ? sorted.slice(0, props.limit) : sorted;
});
</script>

<template>
  <div class="cards-grid">
    <Card
      v-for="item in news"
      :key="item.url"
      :href="item.url"
      :title="item.title"
      :description="item.description"
      :image-src="item.hero"
      :image-alt="item.title"
      :meta="item.dateLabel"
    />
  </div>
</template>
