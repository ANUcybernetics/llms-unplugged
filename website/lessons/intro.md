---
title: Introduction
description:
  What is a language model, and why learn about them with pen, paper, and dice?
order: -1
topic: fundamentals
keyIdea:
  Language models predict the next word based on patterns learned from text.
dependsOn: []
---

# Introduction

::: info Lesson Info

This is a short intro which sets up all the other LLMs Unplugged activities.
It's a great place to start, but feel free to adapt these initial discussion
questions based on your audience.

:::

## Icebreaker discussion questions

::: tip

Depending on your learning context, these can work well as either "call out your
answer" or "discuss with your neighbour and share-back at the end" questions.

:::

- Why is a language model called a "language model"? What does it mean to "model
  language"?
- In as much detail as you can, explain what happens after typing something into
  the ChatGPT "prompt box" to produce the answer you get back
- What's the best/clearest explanation you've ever heard about how Large
  Language Models (e.g. ChatGPT) actually work? What's the _weirdest_
  explanation you've ever heard?
- When was the first language model ever created created? How similar/different
  was it to LLMs like ChatGPT?

- _activity_ Get everyone to stand up, then have them sit down if they've never
  used ChatGPT (or a similar Large Language Model). Then, ask if they've used it
  in the last month/week/day/hour/5mins? At the end, everyone should be sitting
  down.

## Instructor notes

Don't spend too long on the pre-discussion questions---the fun really starts
when you get into actual activities (e.g.
[Grid Training](/lessons/grid-training)).

The core message of _LLMs Unplugged_ is that a language model is a system that
predicts what word comes next. Given some text, it answers the question: "What's
a likely next word?"

Modern LLMs like ChatGPT or Claude contain billions of parameters and run on
specialised hardware. But the core mechanism is surprisingly simple. By building
a tiny language model by hand---with pen, paper, and dice---you'll understand
the same fundamental process that powers these systems.

The difference is scale, not kind. Your hand-built model might learn from a few
pages of text and have a vocabulary of dozens of words. ChatGPT learned from
trillions of words and has a vocabulary of tens of thousands. But both work the
same way: count patterns during training, then use weighted random selection
during generation.

That's it. Every time you see ChatGPT, Claude, or similar tools generate a
response, they're doing this one thing over and over: predicting the next word,
adding it to the text, then predicting again.

<!--@include: ../partials/historical-foundations.md-->
