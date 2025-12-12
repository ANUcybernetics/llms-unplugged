<script setup lang="ts">
import { computed } from "vue";
import { data as allNews } from "../../../news/news.data";
import Card from "./Card.vue";

const groupedNews = computed(() => {
  const groups: Record<number, typeof allNews> = {};
  for (const item of allNews) {
    if (!groups[item.year]) groups[item.year] = [];
    groups[item.year].push(item);
  }
  return Object.entries(groups)
    .map(([year, items]) => ({ year: Number(year), items }))
    .sort((a, b) => b.year - a.year);
});
</script>

<template>
  <div class="news-cards">
    <section v-for="group in groupedNews" :key="group.year" class="news-year">
      <h2>{{ group.year }}</h2>
      <div class="cards-grid">
        <Card
          v-for="item in group.items"
          :key="item.url"
          :href="item.url"
          :title="item.title"
          :description="item.description"
          :image-src="item.hero"
          :image-alt="item.title"
          :meta="item.dateLabel"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.news-cards {
  margin-top: 2rem;
}

.news-year {
  margin-bottom: 3rem;
}

.news-year h2 {
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
}
</style>
