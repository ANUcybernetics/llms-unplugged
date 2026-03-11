---
title: LLMs Unplugged (ACE 2026)
description: Teaching Resources for a ChatGPT World
---

# LLMs Unplugged

Teaching Resources for a ChatGPT World

![bg right:40%](../assets/bg-title.avif)

---

## Acknowledgement of Country

![bg right:40%](../assets/bg-acknowledgement.avif)

---

<!-- _class: impact -->

a(nother) talk about AI\*/LLMs

they're _A Thing_ now

---

## Hi, I'm Ben

![bg right:40%](../assets/headshot-ben-anu.avif)

---

<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; position: absolute; inset: 0;">
  <img src="../assets/bg-3up-phd.avif" style="width: 100%; height: 100%; object-fit: cover;" alt="PhD">
  <img src="../assets/bg-3up-lecturer.avif" style="width: 100%; height: 100%; object-fit: cover;" alt="Lecturer">
  <img src="../assets/bg-3up-kids.avif" style="width: 100%; height: 100%; object-fit: cover;" alt="Kids">
</div>

---

## The problem

![bg right:40%](../assets/bg-problem.avif)

everyone uses ChatGPT (classrooms, office work, group chats)

most folks don't have a good mental model of how it works...

...and this is a problem

---

## The gap

![bg right:40%](../assets/bg-gap.avif)

some feel this "don't know how it works" anxiety more than others, e.g.
classroom teachers

CS Unplugged has been teaching computing concepts without computers for 20+
years

- algorithms & data structures
- traditional ML/AI
- LLMs?

---

## What would "LLMs Unplugged" look like?

![bg right:40%](../assets/bg-design-goals.avif)

- end-to-end generation (training → generation)
- modular and low-friction
- broad accessibility (no coding, minimal maths)

---

<!-- _class: impact -->

(spoiler) it's live at [llmsunplugged.org](https://www.llmsunplugged.org)

---

<!-- _class: banner -->

# Historical roots

![bg brightness:0.2](../assets/bg-div-historical.avif)

---

## Markov (1913) and Shannon (1948)

![bg right:60%](../assets/bg-markov.avif)

did this work **by hand**

counting letter sequences in Pushkin's _Eugene Onegin_ (Markov)

generating synthetic text through weighted sampling (Shannon)

---

## The core insight

![bg right:40%](../assets/bg-core-insight.avif)

language models work by

1. counting patterns in existing text
2. exploiting these patterns to generate **new text**

modern LLMs: same approach, vastly greater scale

---

<!-- _class: banner -->

# The core mechanic

![bg brightness:0.2](../assets/bg-div-mechanic.avif)

---

## Training: counting word pairs

**Text**: _"See Spot run. See Spot jump."_

**Preprocessed**: `see` `spot` `run` `.` `see` `spot` `jump` `.`

|        | `see` | `spot` | `run` | `.` | `jump` |
| ------ | ----- | ------ | ----- | --- | ------ |
| `see`  |       | II     |       |     |        |
| `spot` |       |        | I     |     | I      |
| `run`  |       |        |       | I   |        |
| `.`    | I     |        |       |     |        |
| `jump` |       |        |       | I   |        |

---

<!-- _class: impact -->

the grid **is** the model

---

<!-- _class: banner -->

# Demo time

![bg brightness:0.3](../assets/bg-div-demo.avif)

---

<!-- _class: centered -->

![qr](https://www.llmsunplugged.org/lessons/training)

---

<!-- _class: centered -->

![qr](https://www.llmsunplugged.org/lessons/generation)

---

## Why this works

![bg right:40%](../assets/bg-randomness.avif)

- the randomness explains why LLMs give different responses to the same prompt
- the weighting explains why output is usually coherent
- this **is** how LLMs work, just smaller

---

<!-- _class: banner -->

# Lesson structure

![bg brightness:0.2](../assets/bg-div-lessons.avif)

---

## Fundamentals

![bg right:40%](../assets/bg-fundamentals.avif)

two core lessons (do in order):

1. **Training**---counting patterns into a grid
2. **Generation**---weighted sampling with dice

available in _grid_ and _bucket_ variants

about 30mins each (but flexible)

---

## Extensions

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.7em;">
  <div style="display: flex; align-items: center; gap: 0.6em;">
    <img src="../assets/cards/hero-pretrained-generation.avif" style="height: 5.5em; border-radius: 6px;" alt="Pre-trained Generation">
    <p>Pre-trained Generation</p>
  </div>
  <div style="display: flex; align-items: center; gap: 0.6em;">
    <img src="../assets/cards/hero-grid-trigram.avif" style="height: 5.5em; border-radius: 6px;" alt="Trigram">
    <p>Trigram</p>
  </div>
  <div style="display: flex; align-items: center; gap: 0.6em;">
    <img src="../assets/cards/hero-sampling.avif" style="height: 5.5em; border-radius: 6px;" alt="Sampling">
    <p>Sampling</p>
  </div>
  <div style="display: flex; align-items: center; gap: 0.6em;">
    <img src="../assets/cards/hero-beam-search.avif" style="height: 5.5em; border-radius: 6px;" alt="Beam Search">
    <p>Beam Search</p>
  </div>
  <div style="display: flex; align-items: center; gap: 0.6em;">
    <img src="../assets/cards/hero-tool-use.avif" style="height: 5.5em; border-radius: 6px;" alt="Tool Use">
    <p>Tool Use</p>
  </div>
  <div style="display: flex; align-items: center; gap: 0.6em;">
    <img src="../assets/cards/hero-context-columns.avif" style="height: 5.5em; border-radius: 6px;" alt="Context Columns">
    <p>Context Columns</p>
  </div>
  <div style="display: flex; align-items: center; gap: 0.6em;">
    <img src="../assets/cards/hero-word-embeddings.avif" style="height: 5.5em; border-radius: 6px;" alt="Word Embeddings">
    <p>Word Embeddings</p>
  </div>
  <div style="display: flex; align-items: center; gap: 0.6em;">
    <img src="../assets/cards/hero-lora.avif" style="height: 5.5em; border-radius: 6px;" alt="LoRA">
    <p>LoRA</p>
  </div>
  <div style="display: flex; align-items: center; gap: 0.6em;">
    <img src="../assets/cards/hero-rlhf.avif" style="height: 5.5em; border-radius: 6px;" alt="RLHF">
    <p>RLHF</p>
  </div>
  <div style="display: flex; align-items: center; gap: 0.6em;">
    <img src="../assets/cards/hero-synthetic-data.avif" style="height: 5.5em; border-radius: 6px;" alt="Synthetic Data">
    <p>Synthetic Data</p>
  </div>
</div>

---

<!-- _class: centered -->

![qr](https://www.llmsunplugged.org/lessons/pretrained-generation)

---

<!-- _class: banner -->

# Reception

![bg brightness:0.2](../assets/bg-div-reception.avif)

---

## Notes from the field

![bg right:40%](../assets/bg-participants.avif)

over 500 participants over the past year

- senior executives and public servants
- undergraduates (all disciplines)
- high school teachers
- school-age students

---

<!-- _class: quote -->

![bg brightness:0.2](../assets/bg-div-quote.avif)

> LLMs are "just" probability and randomness at scale---not reasoning, not
> understanding, but sophisticated pattern matching

---

## The shareback moment

![bg right:40%](../assets/bg-title.avif)

the room comes alive during the generation lesson when groups share the output
from _their_ model

"fish fish fish red one fish two fish"

"I do not like green eggs and you may see me be I do not..."

---

<!-- _class: banner -->

# Resources

![bg brightness:0.2](../assets/bg-div-resources.avif)

---

## What's available

![bg right:40%](../assets/bg-resources.avif)

- lessons with instructor notes
- interactive widgets
- videos (coming soon)
- software tools for custom n-gram booklets

all **CC BY-NC-SA** licensed

---

<!-- _class: centered -->

![qr](https://www.llmsunplugged.org)

---

## Next steps

![bg right:40%](../assets/bg-randomness.avif)

- continued development (esp. extensions)
- teacher training
- evaluation (inc. via partnerships)
- strengthen curriculum links (e.g. ACARA)
- translations
- keen to hear your experiences

---

## This Friday

![bg right:40%](../assets/bg-brimbank.avif)

_Lifting the Veil_---a hands-on AI workshop for educators with Brimbank Tech
School at VU Sunshine Campus

Friday 13 February, 10am--3pm

---

## Thanks

[llmsunplugged.org](https://www.llmsunplugged.org)

[ben.swift@anu.edu.au](mailto:ben.swift@anu.edu.au)

[benswift.me](https://benswift.me)

![bg right:60%](../assets/bg-div-quote.avif)

---

<!-- _class: socy-logo -->

---

# Q&A

![bg right:60%](../assets/bg-participants.avif)
