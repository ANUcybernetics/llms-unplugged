---
title: LLMs Unplugged (Fundamentals)
description: A Cybernetic Studio workshop
---

<!-- _class: banner -->

# LLMs Unplugged

## Understand AI by building it yourself

![bg](./assets/bg-title.avif)

---

<!-- @include ./partials/ack-country.md -->

---

<!-- @include ./partials/presenters.md -->

---

<!-- @include ./partials/icebreaker.md -->

---

## What is this about?

![bg right:40%](./assets/bg-core-insight.avif)

you'll **build** your own language model---from scratch---with just a kids book,
pen & paper, and some dice rolling

you'll **learn** how language models work by exploiting patterns in text to
generate new text

---

<!-- _class: centered -->

![qr](https://www.llmsunplugged.org)

---

<!-- @include ./training.md -->

---

<!-- @include ./generation.md -->

---

<!-- @include ./pretrained-generation.md -->

---

<!-- TODO re-enable when sampling lesson is ready -->
<!-- @include ./sampling.md -->

<!-- --- -->

## Discussion

- how could you use this activity in your classroom?
- how might understanding how LLMs work change how your students engage with AI?
- what questions do you still have?

![bg left:40%](./assets/bg-participants.avif)

---

<!-- @include ./partials/qualtrics.md -->

---

<script lang="ts">
  import StaticGrid from "../components/StaticGrid.svelte";
  import StaticGeneration from "../components/StaticGeneration.svelte";
  import StaticPretrainedGeneration from "../components/StaticPretrainedGeneration.svelte";
  import TrainingWidget from "../components/widgets/TrainingWidget.svelte";
  import GenerationWidget from "../components/widgets/GenerationWidget.svelte";
  import "../styles/widgets.css";

  const EXAMPLE_TOKENS = "see spot run . run , spot , run .";
  const EXAMPLE_VOCAB = "see spot run . ,";
  const EXAMPLE_GENERATION = "see spot , run .";
  const EXAMPLE_TEXT = "See Spot run. Run, Spot, run.";
  const EXAMPLE_PRETRAINED_SEQ = "see spot , run . run";
  const EXAMPLE_PRETRAINED_ROLLS = "- 7 8 3 - -";
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
    font-size: 1.4em;
    width: auto;
    margin: 0;
  }

  :global(.reveal .slides section table.bigram-grid th),
  :global(.reveal .slides section table.bigram-grid td) {
    text-align: center;
    padding: 0.75rem 0.6rem;
  }

  :global(.reveal .slides section table.bigram-grid td.grid-cell) {
    font-size: 1.2em;
    font-weight: 700;
    min-width: 2.5em;
  }

  :global(.reveal .slides section .static-grid-tokens),
  :global(.reveal .slides section .generation-output) {
    margin-top: 1.5rem;
    font-size: 1.4em;
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

<!-- @include ./partials/socy-logo.md -->
