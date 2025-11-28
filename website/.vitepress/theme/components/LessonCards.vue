<script setup lang="ts">
import { computed } from "vue";
import { data as allLessons } from "../../../lessons/lessons.data";
import {
  topicOrder,
  topicLabels,
  topicDescriptions,
} from "../../../lessons/topics";
import type { LessonData } from "../../../lessons/lessons.data";

interface Props {
  lessons?: string[];
}

const props = defineProps<Props>();

interface TopicGroup {
  id: string;
  label: string;
  description: string;
  lessons: LessonData[];
}

function getLessonSlug(lesson: LessonData): string {
  return lesson.url.replace(/^\/lessons\//, "").replace(/\/$/, "");
}

const isFiltered = computed(() => !!props.lessons);

const filteredLessons = computed<LessonData[]>(() => {
  if (!props.lessons) return allLessons;
  return allLessons.filter((lesson) =>
    props.lessons!.includes(getLessonSlug(lesson)),
  );
});

const groupedLessons = computed<TopicGroup[]>(() => {
  const groups: Record<string, LessonData[]> = {};

  for (const lesson of filteredLessons.value) {
    if (!groups[lesson.topic]) {
      groups[lesson.topic] = [];
    }
    groups[lesson.topic].push(lesson);
  }

  return topicOrder
    .filter((topic) => groups[topic])
    .map((topic) => ({
      id: topic,
      label: topicLabels[topic] || topic,
      description: topicDescriptions[topic] || "",
      lessons: groups[topic],
    }));
});
</script>

<template>
  <div class="lesson-cards">
    <div v-if="isFiltered" class="cards-grid">
      <a
        v-for="lesson in filteredLessons"
        :key="lesson.url"
        :href="lesson.url"
        class="lesson-card"
      >
        <img :src="lesson.hero" :alt="lesson.title" loading="lazy" />
        <div class="card-content">
          <h3>{{ lesson.title }}</h3>
          <p>{{ lesson.description }}</p>
        </div>
      </a>
    </div>
    <template v-else>
      <section
        v-for="group in groupedLessons"
        :key="group.id"
        class="topic-section"
      >
        <h2 :id="group.id">{{ group.label }}</h2>
        <p class="topic-description">{{ group.description }}</p>
        <div class="cards-grid">
          <a
            v-for="lesson in group.lessons"
            :key="lesson.url"
            :href="lesson.url"
            class="lesson-card"
          >
            <img :src="lesson.hero" :alt="lesson.title" loading="lazy" />
            <div class="card-content">
              <h3>{{ lesson.title }}</h3>
              <p>{{ lesson.description }}</p>
            </div>
          </a>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.lesson-cards {
  margin-top: 2rem;
}

.topic-section {
  margin-bottom: 3rem;
}

.topic-section h2 {
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
}

.topic-description {
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.lesson-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--vp-c-border);
  border-radius: 0.5rem;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.lesson-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.lesson-card img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.card-content {
  padding: 1rem;
}

.card-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: var(--vp-c-text-1);
}

.card-content p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}
</style>
