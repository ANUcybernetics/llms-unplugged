---
title: LLMs Unplugged (Fundamentals)
description: A Cybernetic Studio workshop
---

<TokenLogo mode="full" />

---

## What is this about?

![bg right:40%](../assets/bg-core-insight.avif)

you'll **build** your own language model---from scratch---with just a kids book,
pen & paper, and some dice rolling

you'll **learn** how language models work by exploiting patterns in text to
generate new text

---

<!-- _class: centered -->

![qr](https://www.llmsunplugged.org)

---

<!-- _class: banner -->

# Training

![bg brightness:0.5](../assets/bg-div-mechanic.avif)

<!-- --- -->

<!-- _class: centered -->

<!-- ![qr](https://www.llmsunplugged.org/lessons/training) -->

---

## the algorithm:

1. TODO

---

<!-- _class: banner -->

# Training

![bg brightness:0.5](../assets/bg-div-mechanic.avif)

---

## The _language_ of language models

![bg right:60%](../assets/bg-markov.avif)

- model
- token
- vocabulary
- training

---

<!-- _class: banner -->

# Generation

![bg brightness:0.5](../assets/bg-div-lessons.avif)

---

<!-- _class: banner -->

# Shareback

![bg brightness:0.5](../assets/bg-div-reception.avif)

---

## The _language_ of language models

![bg cover left:60%](../assets/bg-shannon.avif)

- prompt
- completion/response/prediction
- context window

---

<!-- _class: banner -->

# Q&A

![bg brightness:0.3](../assets/bg-participants.avif)

---

<script lang="ts">
  import TokenLogo from "../../components/TokenLogo.svelte";
  import TrainingWidget from "../../components/widgets/TrainingWidget.svelte";
  import GenerationWidget from "../../components/widgets/GenerationWidget.svelte";
  import "../../styles/widgets.css";
</script>

<style>
  :global(.reveal .slides .extensions-grid) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5em;
  }

  :global(.reveal .slides .extensions-grid img) {
    height: 4.5em;
    border-radius: 6px;
    object-fit: cover;
  }

  :global(.reveal .slides .fullscreen-button) {
    display: none;
  }

  :global(.reveal .slides section:has(.lm-widget)) {
    padding: 1.5rem 2.5rem;
    font-size: 14px;
  }

  :global(.reveal .slides section .lm-widget) {
    margin: 0;
    padding: 0.75rem;
    font-size: 14px;
  }

  :global(.reveal .slides section .lm-widget .widget-view) {
    gap: 0.5rem;
  }

  :global(.reveal .slides section .lm-widget .input-row),
  :global(.reveal .slides section .lm-widget .output-row) {
    gap: 0.5rem;
  }

  :global(.reveal .slides .controls-strip) {
    display: none;
  }

  :global(.reveal .slides section .lm-widget .section-header) {
    font-size: 0.65em;
  }

  :global(.reveal .slides section .lm-widget .text-input) {
    font-size: 1em;
    padding: 0.25rem 0.4rem;
  }

  :global(.reveal .slides section .lm-widget .token) {
    font-size: 1em;
  }

  :global(.reveal .slides section table.bigram-grid) {
    font-size: 1em;
  }

  :global(.reveal .slides section table.bigram-grid td.grid-cell) {
    font-size: 1.4em;
    font-weight: 700;
  }

  :global(.reveal .slides section .lm-widget button) {
    font-size: 1em;
  }

  :global(.reveal .slides section .lm-widget .speed-control) {
    font-size: 1em;
  }

  :global(.reveal .slides section .lm-widget .mapping-item) {
    font-size: 1em;
  }

  :global(.reveal .slides section .lm-widget .dice-value) {
    font-size: 1em;
  }
</style>

<!-- _class: socy-logo -->
