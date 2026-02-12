<script setup lang="ts">
import { computed } from "vue";
import { data as allNews } from "../../../news/news.data";
import Card from "./Card.vue";

const props = withDefaults(
  defineProps<{
    limit?: number;
    groupByYear?: boolean;
  }>(),
  { limit: 0, groupByYear: true },
);

const sortedNews = computed(() =>
  [...allNews].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  ),
);

const limitedNews = computed(() =>
  props.limit > 0 ? sortedNews.value.slice(0, props.limit) : sortedNews.value,
);

const groupedNews = computed(() => {
  const groups: Record<number, typeof allNews> = {};
  for (const item of limitedNews.value) {
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
    <template v-if="groupByYear">
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
    </template>
    <div v-else class="cards-grid">
      <Card
        v-for="item in limitedNews"
        :key="item.url"
        :href="item.url"
        :title="item.title"
        :description="item.description"
        :image-src="item.hero"
        :image-alt="item.title"
        :meta="item.dateLabel"
      />
    </div>
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
