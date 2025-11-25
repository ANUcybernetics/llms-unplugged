---
layout: base.njk
title: Topics
templateEngineOverride: njk,md
permalink: /topics/
eleventyNavigation:
  key: Topics
  order: 1
---

# Topics

The _LLMs Unplugged_ lessons are organised into five topics. Each topic contains
lessons that build related concepts, though lessons within a topic can often be
done in any order after completing the fundamentals.

[Download the full PDF bundle]({{ links.lessons_pdf }})

{% for topic in topics %}

<article class="border border-anu-gold/40 rounded-lg p-4 bg-anu-black/40 my-6 not-prose">
  <h2 class="text-xl font-semibold mb-2">
    <a href="/topics/{{ topic.id }}/" class="text-anu-gold-2 hover:text-anu-gold transition-colors">{{ topic.title }}</a>
  </h2>
  <p class="text-anu-white/90 mb-3">{{ topic.description }}</p>
  <p class="text-sm text-anu-white/70">
    {{ topic.lessons.length }} lesson{% if topic.lessons.length != 1 %}s{% endif %}
  </p>
</article>
{% endfor %}
