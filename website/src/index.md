---
layout: base.njk
title: LLMs Unplugged
description:
  Teaching resources for understanding how large language models work through
  hands-on activities with pen, paper, and dice.
hero: /assets/images/hero-index.jpg
templateEngineOverride: njk,md
---

# LLMs Unplugged

Ready-to-use teaching resources for understanding how large language models
(LLMs) work through hands-on activities. No computers required.

{% if hero %} ![Hero image: {{ description }}]({{ hero }}) {% endif %}

As LLMs become increasingly central to how we work with text and interact with
digital systems, hands-on understanding becomes not just pedagogically valuable
but practically necessary. The good news? The core concepts are accessible to
anyone willing to spend an afternoon with pen, paper, and dice.

## Why are these resources necessary?

[ChatGPT](https://chatgpt.com/) arrived in November 2022 and suddenly everyone's
using LLMs. Yet most people have no real mental model of what's actually
happening under the hood. They've heard the hand-wave-y and/or mystical-sounding
explanations, maybe picked up some vague notions about "neural networks" and
"training data", but the core mechanism remains opaque.

_LLMs Unplugged_ cuts through the mystery using the simplest possible approach:
you---and your students---build your own language model from scratch with pen,
paper, and dice.

The process is straightforward. You manually count word patterns in some
training text (say, a children's book). You record these patterns in a table.
Then you use dice rolls to generate new sentences, making random choices
weighted by what you've seen before. After an hour or so of doing this by hand,
something clicks: you realise that ChatGPT works exactly the same way. It's the
same fundamental process, just at a (vastly) different scale.

Your hand-rolled language model might produce surprisingly coherent sentences,
or delightfully nonsensical ones---either way, you've understood generation in a
way no abstract explanation can provide. The approach strips away the
distractions of code and infrastructure, letting you focus on the underlying
principles. When you've spent an afternoon rolling dice and watching patterns
emerge, you have a better sense of how language models work.

![Three people laughing while doing an LLMs Unplugged activity](/assets/images/sxsw-2.jpg)

## Who's this for?

These activities are suitable for audiences from high school age (with a primary
version coming soon!) through to adults. No programming background required, and
no mathematics beyond basic counting and percentages.

We've run it for hundreds of participants---school students, undergraduate
students, senior executives in the Australian Public Service. The material
consistently helps people build new mental models of how LLMs work, demystifying
systems they may have previously thought of as almost magical.

A typical 90-minute workshop covers the core training-to-generation pipeline
(lessons 1--3). Extension lessons let you explore concepts like trigram models,
context columns, word embeddings, and synthetic data if you have more time or a
particularly engaged audience.

## What's in the box?

These resources are available under a
[CC BY-NC-SA license](https://creativecommons.org/licenses/by-nc-sa/4.0/).
They're organised into [lessons]({{ links.topics }}) (grouped into topics), with
each covering a self-contained activity from basic training and generation
through to advanced concepts like embeddings, sampling strategies, and model
fine-tuning. Each lesson also includes instructor notes: pedagogical scaffolding
explaining connections to modern LLMs, discussion questions, and historical
context---all designed for educators without deep AI expertise

Finally (and optionally!) there are [software tools]({{ links.github }}):
open-source tools to create custom n-gram booklets from any text corpus. This
allows educators who want to go deeper to personalise even more of the unplugged
activities to their own classroom context.

These _LLMs Unplugged_ resources will grow over time, with example lesson plans,
new lessons and unplugged activities, and more. Bookmark us and stay tuned. And
if you'd like to get in touch, email
[ben.swift@anu.edu.au](mailto:ben.swift@anu.edu.au).

![Three people laughing while doing an LLMs Unplugged activity](/assets/images/sxsw-1.jpg)

{% set events = collections.news | filterByTag("events") | head(3) %}
{% if events.length %}

<section class="my-12 p-6 border border-anu-gold/30 rounded-lg not-prose">
  <h2 class="text-xl font-semibold mb-4 text-anu-gold">Upcoming events</h2>
  <ul class="space-y-4">
    {% for event in events %}
    <li>
      <a href="{{ event.url }}" class="text-anu-gold-2 hover:text-anu-gold transition-colors font-medium">{{ event.data.title }}</a>
      <span class="text-sm text-anu-white/70 block">{{ event.date | readableDate }}</span>
    </li>
    {% endfor %}
  </ul>
  <a href="/news/" class="mt-4 inline-block text-sm text-anu-gold-2 hover:text-anu-gold transition-colors">View all news →</a>
</section>
{% endif %}
