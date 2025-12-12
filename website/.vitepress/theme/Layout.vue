<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";
import DefaultTheme from "vitepress/theme";

const { Layout } = DefaultTheme;
const { frontmatter, page } = useData();

const isNewsPage = computed(
  () => page.value.relativePath.startsWith("news/") && frontmatter.value.date
);

const formattedDate = computed(() => {
  if (!frontmatter.value.date) return "";
  return new Date(frontmatter.value.date).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});
</script>

<template>
  <Layout>
    <template #doc-before>
      <div v-if="isNewsPage" class="news-meta">
        <span v-if="frontmatter.author" class="author">
          {{ frontmatter.author }}
        </span>
        <span
          v-if="frontmatter.author && frontmatter.date"
          class="separator"
        >·</span>
        <time v-if="frontmatter.date" class="date">{{ formattedDate }}</time>
      </div>
    </template>
  </Layout>
</template>

<style scoped>
.news-meta {
  margin-bottom: 1.5rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.separator {
  margin: 0 0.5rem;
}
</style>
