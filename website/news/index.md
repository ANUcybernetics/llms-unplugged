---
title: News
description:
  Updates, announcements, and stories from the LLMs Unplugged project.
---

# News

![Hero image: News and updates from LLMs Unplugged](/assets/images/hero-news.avif)

Updates, announcements, and stories from the LLMs Unplugged project. Subscribe
to the [RSS feed](/feed.rss) to stay up to date.

<script setup lang="ts">
import { computed } from "vue";
import { data as allNews } from "./news.data";

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

<div class="news-groups">
  <section v-for="group in groupedNews" :key="group.year" class="news-year">
    <h2>{{ group.year }}</h2>
    <ul>
      <li v-for="item in group.items" :key="item.url">
        <a :href="item.url">{{ item.title }}</a> --- {{ item.dateLabel }}
        <span v-if="item.description">: {{ item.description }}</span>
      </li>
    </ul>
  </section>
</div>
