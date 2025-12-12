<script setup lang="ts">
import { computed } from "vue";
import { data as allLessons } from "../../../lessons/lessons.data";
import {
  topicOrder,
  topicLabels,
  topicDescriptions,
} from "../../../lessons/topics";
import type { LessonData } from "../../../lessons/lessons.data";
import Card from "./Card.vue";

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
  <div class="card-list">
    <div v-if="isFiltered" class="cards-grid">
      <Card
        v-for="lesson in filteredLessons"
        :key="lesson.url"
        :href="lesson.url"
        :title="lesson.title"
        :description="lesson.description"
        :image-src="lesson.hero"
        :image-alt="lesson.title"
      />
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
          <Card
            v-for="lesson in group.lessons"
            :key="lesson.url"
            :href="lesson.url"
            :title="lesson.title"
            :description="lesson.description"
            :image-src="lesson.hero"
            :image-alt="lesson.title"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.card-list {
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
</style>
