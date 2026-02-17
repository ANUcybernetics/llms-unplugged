<script setup lang="ts">
import { computed } from "vue";
import { useData, withBase } from "vitepress";
import DefaultTheme from "vitepress/theme";

const { Layout } = DefaultTheme;
const { frontmatter, page } = useData();

const isNewsPage = computed(
  () => page.value.relativePath.startsWith("news/") && frontmatter.value.date,
);

const newsSlug = computed(() => {
  if (!isNewsPage.value) return "";
  return page.value.relativePath.replace(/^news\//, "").replace(/\.md$/, "");
});

const newsHeroSrc = computed(() =>
  newsSlug.value ? withBase(`/assets/images/hero-news-${newsSlug.value}.avif`) : "",
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
    <template #layout-top>
      <div class="print-wordmark">
        LLMs Unplugged (c) Ben Swift, Cybernetic Studio - CC BY-NC-SA 4.0
      </div>
    </template>
    <template #doc-before>
      <header v-if="isNewsPage" class="news-header">
        <h1 v-if="frontmatter.title" class="news-title">
          {{ frontmatter.title }}
        </h1>
        <div class="news-meta">
          <span v-if="frontmatter.author" class="author">
            {{ frontmatter.author }}
          </span>
          <span v-if="frontmatter.author && frontmatter.date" class="separator">·</span>
          <time v-if="frontmatter.date" class="date">{{ formattedDate }}</time>
        </div>
        <img
          v-if="newsHeroSrc"
          class="news-hero"
          :src="newsHeroSrc"
          :alt="`Hero image: ${frontmatter.title ?? newsSlug}`"
          loading="lazy"
        />
      </header>
    </template>
  </Layout>
</template>

<style scoped>
.news-header {
  margin-bottom: 2rem;
}

.news-title {
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 700;
  margin: 0 0 0.75rem;
  letter-spacing: -0.02em;
}

.news-meta {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.news-hero {
  width: 100%;
  border-radius: 0.5rem;
}

.separator {
  margin: 0 0.5rem;
}
</style>
