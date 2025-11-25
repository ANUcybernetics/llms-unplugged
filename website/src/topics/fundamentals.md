---
title: Fundamentals
eleventyNavigation:
  key: Fundamentals
  parent: Topics
  order: 1
---

# Fundamentals

Core concepts for building and using language models. Start here to learn
weighted random selection, training a bigram model, and generating text.

{% set topicLessons = collections.lessons | filterByTopic("fundamentals") %}
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
