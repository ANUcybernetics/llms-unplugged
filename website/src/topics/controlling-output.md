---
title: Controlling output
eleventyNavigation:
  key: Controlling output
  parent: Topics
  order: 3
---

# Controlling output

Learn how sampling strategies like temperature and truncation shape generated
text without changing the underlying model.

{% set topicLessons = collections.lessons | filterByTopic("controlling-output") %}
{% if topicLessons.length %}

<div class="not-prose grid gap-6 my-8">
  {% for lesson in topicLessons %}
  <article class="border border-anu-gold/40 rounded-lg p-4 bg-anu-black/40">
    <h2 class="text-xl font-semibold mb-2">
      <a href="{{ lesson.url }}" class="text-anu-gold-2 hover:text-anu-gold transition-colors">{{ lesson.data.title }}</a>
    </h2>
    <p class="text-anu-white/90 mb-3">{{ lesson.data.description }}</p>
    {% if lesson.data.keyIdea %}
    <p class="text-sm text-anu-white/70 mb-2"><strong>Key idea:</strong> {{ lesson.data.keyIdea }}</p>
    {% endif %}
    <div class="flex flex-wrap gap-3 text-sm">
      {% if lesson.data.pdf %}
      <a href="{{ lesson.data.pdf }}" class="text-anu-gold-2 hover:text-anu-gold transition-colors">Download PDF</a>
      {% endif %}
      {% if lesson.data.dependsOn and lesson.data.dependsOn.length %}
      <span class="text-anu-white/70">Depends on: {{ lesson.data.dependsOn | join(", ") }}</span>
      {% endif %}
    </div>
  </article>
  {% endfor %}
</div>
{% endif %}
