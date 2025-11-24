---
layout: base.njk
title: Modules
templateEngineOverride: njk,md
permalink: /modules/
---

# Modules

Here are the main _LLMs Unplugged_ teaching modules. Each module has a short
overview, dependency hints, and a link to its printable PDF card.

[Download the full PDF bundle]({{ links.modules_pdf }})

{% set modulesList = collections.modules %} {% if modulesList.length %}

<div class="not-prose grid gap-6 my-8">
  {% for module in modulesList %}
  <article class="border border-anu-gold/40 rounded-lg p-4 bg-anu-black/40">
    <h2 class="text-xl font-semibold mb-2">
      <a href="{{ module.url }}" class="text-anu-gold-2 hover:text-anu-gold transition-colors">{{ module.data.title }}</a>
    </h2>
    <p class="text-anu-white/90 mb-3">{{ module.data.description }}</p>
    {% if module.data.keyIdea %}
    <p class="text-sm text-anu-white/70 mb-2"><strong>Key idea:</strong> {{ module.data.keyIdea }}</p>
    {% endif %}
    <div class="flex flex-wrap gap-3 text-sm">
      {% if module.data.pdf %}
      <a href="{{ module.data.pdf }}" class="text-anu-gold-2 hover:text-anu-gold transition-colors">Download PDF</a>
      {% endif %}
      {% if module.data.dependsOn and module.data.dependsOn.length %}
      <span class="text-anu-white/70">Depends on: {{ module.data.dependsOn | join(", ") }}</span>
      {% endif %}
    </div>
  </article>
  {% endfor %}
</div>
{% else %}

_Modules coming soon._ {% endif %}
