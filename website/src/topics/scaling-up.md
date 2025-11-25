---
title: Scaling up
eleventyNavigation:
  key: Scaling up
  parent: Topics
  order: 2
---

# Scaling up

Move beyond hand-built models to explore pre-trained models and longer context
windows with trigrams.

{% set topicLessons = collections.lessons | filterByTopic("scaling-up") %}
{% if topicLessons.length %}

<div class="not-prose grid gap-6 my-8">
  {% for lesson in topicLessons %}
  <article class="border border-anu-gold/40 rounded-lg p-4 bg-anu-black/40">
    <h2 class="text-xl font-semibold mb-2">
      <a href="{{ lesson.url }}" class="text-anu-gold-2 hover:text-anu-gold transition-colors">{{ lesson.data.title }}</a>
    </h2>
    <p class="text-anu-white/90 mb-3">{{ lesson.data.description }}</p>
    {% if lesson.data.keyIdea %}
    <p class="text-sm text-anu-white mb-2"><strong>Key idea:</strong> {{ lesson.data.keyIdea }}</p>
    {% endif %}
    {% if lesson.data.dependsOn and lesson.data.dependsOn.length %}
    <div class="text-sm text-anu-white/70 mt-2">Depends on: {{ lesson.data.dependsOn | join(", ") }}</div>
    {% endif %}
  </article>
  {% endfor %}
</div>
{% endif %}
