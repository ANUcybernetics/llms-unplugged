---
layout: base.njk
title: LLMs Unplugged
---

# LLMs Unplugged

Ready-to-use teaching resources for understanding how large language models
(LLMs) work through hands-on activities. No computers required.

If you're just here for the resources, here they are:

- **[Module cards]({{ links.modules }})**
- **[Instructor notes]({{ links.instructor_notes }})**

![LLMs Unplugged workshop](/assets/images/sxsw-2.jpg)

## What is this?

ChatGPT arrived in November 2022 and suddenly everyone's using LLMs. Yet most
people have no real mental model of what's actually happening under the hood.
They've heard the hand-wave-y (and/or mystical-sounding) explanations, maybe
picked up some vague notions about "neural networks" and "training data", but
the core mechanism remains opaque.

_LLMs Unplugged_ cuts through that opacity using the simplest possible approach:
you build your own language model from scratch with pen, paper, and dice.

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

## Who's this for?

These activities are suitable for audiences from high school age through to
adults. No programming background required. No mathematics beyond basic counting
and percentages.

We've run it for hundreds of participants---school students, undergraduate
students, senior executives in the Australian Public Service. The material
consistently helps people build new mental models of how LLMs work, demystifying
systems they may have previously thought of as almost magical.

## What's included?

![LLMs Unplugged workshop](/assets/images/sxsw-1.jpg)

The complete resource pack is available under a
[Creative Commons BY-NC-SA 4.0 license](https://creativecommons.org/licenses/by-nc-sa/4.0/)
at [github.com/ANUcybernetics/llms-unplugged]({{ links.github }}):

- **[Module cards]({{ links.modules }})**: ten double-sided printable handouts,
  each covering a self-contained activity from basic training and generation
  through to advanced concepts like embeddings, sampling strategies, and
  low-rank adaptation
- **[Instructor notes]({{ links.instructor_notes }})**: pedagogical scaffolding
  explaining connections to modern LLMs, discussion questions, and historical
  context---designed for educators without deep AI expertise
- **Software tools**: optional open-source tools to create custom n-gram
  booklets from any text corpus, so you can build domain-specific pre-trained
  models

A typical 90-minute workshop covers the core training-to-generation pipeline
(modules 1--3). Extension modules let you explore concepts like trigram models,
context columns, word embeddings, and synthetic data if you have more time or a
particularly engaged audience.

These _LLMs Unplugged_ resources will grow over time, including example lesson
plans, new modules and unplugged activities, and more. Bookmark us and stay
tuned. And if you'd like to get in touch, email
[ben.swift@anu.edu.au](mailto:ben.swift@anu.edu.au).

## Getting started

Follow the links above (or visit the [GitHub repository]({{ links.github }})) to
download the materials and start running your own workshops. The modular design
means you can scale content up or down based on available time and audience
sophistication.

As LLMs become increasingly central to how we work with text and interact with
digital systems, hands-on understanding becomes not just pedagogically valuable
but practically necessary. The good news? The core concepts are accessible to
anyone willing to spend an afternoon with pen, paper, and dice.
