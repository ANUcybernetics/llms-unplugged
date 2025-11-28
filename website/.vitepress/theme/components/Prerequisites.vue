<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";
import { data as allLessons } from "../../../lessons/lessons.data";

const { frontmatter } = useData();

const lessonsByTitle = computed(() => {
  const map: Record<string, string> = {};
  for (const lesson of allLessons) {
    map[lesson.title] = lesson.url;
  }
  return map;
});

const prerequisites = computed(() => {
  const deps = frontmatter.value.dependsOn ?? [];
  return deps
    .map((title: string) => ({
      title,
      url: lessonsByTitle.value[title],
    }))
    .filter((p: { title: string; url?: string }) => p.url);
});
</script>

<template>
  <div v-if="prerequisites.length > 0" class="prerequisites">
    <h2>Prerequisites</h2>
    <ul>
      <li v-for="prereq in prerequisites" :key="prereq.url">
        <a :href="prereq.url">{{ prereq.title }}</a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.prerequisites {
  margin: 1.5rem 0;
}

.prerequisites h2 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.prerequisites ul {
  margin: 0;
  padding-left: 1.25rem;
}

.prerequisites li {
  margin: 0.25rem 0;
}
</style>
