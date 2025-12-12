<script setup lang="ts">
interface Props {
  href: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  meta?: string;
}

defineProps<Props>();
</script>

<template>
  <a :href="href" class="base-card">
    <img :src="imageSrc" :alt="imageAlt" loading="lazy" />
    <div class="card-content">
      <h3>{{ title }}</h3>
      <p v-if="meta" class="card-meta">{{ meta }}</p>
      <p class="card-description">{{ description }}</p>
    </div>
  </a>
</template>

<style scoped>
.base-card {
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

.base-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.base-card img {
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

.card-meta {
  margin: 0 0 0.5rem 0;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.card-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}
</style>
