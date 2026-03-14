---
title: LLMs Unplugged (Fundamentals)
description: A Cybernetic Studio workshop
---

<TokenLogo />

---

## Icebreaker

![bg left:40%](../assets/hero-news-2026-02-13-brimbank-tech-school-workshop.avif)

introduce yourself to your neighbor(s) and ask them:

- why is a language model called a "language model"?
- what does it mean to "model language"?

---

<!-- _class: banner -->

# LLMs Unplugged

## Understand AI by building it yourself

![bg](../assets/bg-title.avif)

---

## Acknowledgement of Country

![bg right:40%](../assets/bg-acknowledgement.avif)

---

<div style="display: grid; grid-template-columns: 1fr 1fr; position: absolute; inset: 0;">
  <img src="../assets/headshot-ben-anu.avif" style="width: 100%; height: 100%; object-fit: cover;" alt="Ben">
  <img src="../assets/headshot-cole-anu.avif" style="width: 100%; height: 100%; object-fit: cover;" alt="Cole">
</div>

<!-- <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; position: absolute; inset: 0;"> -->
  <!-- <img src="../assets/headshot-eddie-anu.avif" style="width: 100%; height: 100%; object-fit: cover;" alt="Eddie"> -->
  <!-- <img src="../assets/headshot-ben-anu.avif" style="width: 100%; height: 100%; object-fit: cover;" alt="Ben"> -->
  <!-- <img src="../assets/headshot-cole-anu.avif" style="width: 100%; height: 100%; object-fit: cover;" alt="Cole"> -->
<!-- </div> -->

---

<!-- _class: impact -->

**activity**

everyone stand up

---

<!-- _class: impact -->

sit down if you

have **never** used ChatGPT

---

<!-- _class: impact -->

sit down if you

haven't used it in the last **month**

---

<!-- _class: impact -->

sit down if you

haven't used it in the last **week**

---

<!-- _class: impact -->

sit down if you

haven't used it in the last **day**

---

<!-- _class: impact -->

sit down if you

haven't used it in the last **hour**

---

<!-- _class: impact -->

sit down if you

haven't used it in the last **5 minutes**

---

## What is this about?

![bg right:40%](../assets/bg-core-insight.avif)

how **language models** work

by exploiting patterns in text to generate new text

---

<!-- _class: centered -->

![qr](https://www.llmsunplugged.org)

---

<!-- _class: banner -->

# Training

![bg brightness:0.5](../assets/bg-div-mechanic.avif)

---

<!-- _class: centered -->

![qr](https://www.llmsunplugged.org/lessons/training)

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

<!-- _class: centered -->

![qr](https://www.llmsunplugged.org/lessons/generation)

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

## Reflection

![bg right:60%](../assets/bg-randomness.avif)

- how has this workshop changed how you **think** about language models?
- how has this workshop changed how you will **use** language models?

---

<!-- _class: impact -->

[www.llmsunplugged.org](https://www.llmsunplugged.org)

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
  :global(.reveal .slides section:has(.token-logo)) {
    padding: 0;
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
