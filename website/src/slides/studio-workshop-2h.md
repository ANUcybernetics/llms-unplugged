---
title: LLMs Unplugged
description: A Cybernetic Studio workshop
layout: slides
templateEngineOverride: njk
---

## Icebreaker

<div class="grid-2">
<div class="left">

introduce yourself to your neighbor(s) and ask them:

- why is a language model called a "language model"?
- what does it mean to "model language"?

</div>
<div>

![ice](/images/slides/ice.jpeg)

</div>
</div>

---

# My First Language Model

Build Your Own Language Model with Dick and Jane

---

<!-- .slide: class="center" -->

## Acknowledgement of Country

---

<div class="grid-3">

![ben](/images/slides/ben.jpg)

![eddie](/images/slides/eddie.jpg)

![cole](/images/slides/cole.jpg)

</div>

---

<!-- .slide: class="center" -->

**activity**

everyone stand up

---

<!-- .slide: class="center" -->

sit down if you

have **never** used ChatGPT

---

<!-- .slide: class="center" -->

sit down if you

haven't used it in the last **month**

---

<!-- .slide: class="center" -->

sit down if you

haven't used it in the last **week**

---

<!-- .slide: class="center" -->

sit down if you

haven't used it in the last **day**

---

<!-- .slide: class="center" -->

sit down if you

haven't used it in the last **hour**

---

<!-- .slide: class="center" -->

sit down if you

haven't used it in the last **5 minutes**

---

## What is this about?

<div class="grid-2">
<div class="left">

how **language models** work

by exploiting patterns in text to generate new text

</div>
<div>

![](/images/slides/socy-glider/CYBERNETICS_A_013.jpg)

</div>
</div>

---

<!-- data-background-color="#1a1a1a" -->

# Basic training

**20 mins**

---

## Training example

**Original text**: *"See Spot run. See Spot jump. Run, Spot, run. Jump, Spot, jump."*

**Preprocessed text**: `see` `spot` `run` `.` `see` `spot` `jump` `.` `run` `,` `spot` `,` `run` `.` `jump` `,` `spot` `,` `jump` `.`

**After training** the model should look like:

|        | `see` | `spot` | `run` | `.` | `jump` | `,` |
| ------ | ----- | ------ | ----- | --- | ------ | --- |
| `see`  |       | II     |       |     |        |     |
| `spot` |       |        | I     |     | I      | II  |
| `run`  |       |        |       | II  |        | I   |
| `.`    | I     |        | I     |     | I      |     |
| `jump` |       |        |       | II  |        | I   |
| `,`    |       | II     | I     |     | I      |     |

---

## The *language* of language models

<div class="grid-2">
<div class="left">

- model
- token
- vocabulary
- training

</div>
<div>

![](/images/slides/socy-glider/CYBERNETICS_A_052.jpg)

</div>
</div>

---

<!-- data-background-color="#1a1a1a" -->

# Basic inference

**20 mins**

---

## Our trained model

Our trained model grid from earlier:

|        | `see` | `spot` | `run` | `.` | `jump` | `,` |
| ------ | ----- | ------ | ----- | --- | ------ | --- |
| `see`  |       | II     |       |     |        |     |
| `spot` |       |        | I     |     | I      | II  |
| `run`  |       |        |       | II  |        | I   |
| `.`    | I     |        | I     |     | I      |     |
| `jump` |       |        |       | II  |        | I   |
| `,`    |       | II     | I     |     | I      |     |

---

<!-- data-background-color="#1a1a1a" -->

# Shareback

---

## The *language* of language models

<div class="grid-2">
<div class="left">

- prompt
- completion/response/prediction
- context window

</div>
<div>

![](/images/slides/socy-glider/CYBERNETICS_B_019.jpg)

</div>
</div>

---

<!-- data-background-color="#1a1a1a" -->

# Pre-trained bigram model

**20 mins**

---

<!-- .slide: class="center" -->

![bigram booklet](/images/slides/bigram-booklet-excerpt.png)

---

<!-- data-background-color="#1a1a1a" -->

# Shareback

---

## The *language* of language models

<div class="grid-2">
<div class="left">

- pre-training
- foundation model

</div>
<div>

![](/images/slides/socy-glider/CYBERNETICS_A_125.jpg)

</div>
</div>

---

<!-- data-background-color="#1a1a1a" -->

# Sampling strategies

**10 mins**

---

## Example: Haiku sampling

Generate text using your model, but

1. track syllables in current line (5-7-5 pattern)
2. roll dice to select next word as normal
3. if selected word exceeds line's syllable limit, re-roll
4. start new line when syllable count reached

(you can either use *your* new language model or the "booklet" one we gave you)

---

## The *language* of language models

<div class="grid-2">
<div class="left">

- sampling
- truncation (top-k)
- temperature

</div>
<div>

![](/images/slides/socy-glider/CYBERNETICS_A_039.jpg)

</div>
</div>

---

## Reflection

<div class="grid-2">
<div class="left">

- how has this workshop changed how you **think** about language models?
- how has this workshop changed how you will **use** language models?

</div>
<div>

![](/images/slides/socy-glider/CYBERNETICS_B_013.jpg)

</div>
</div>

---

<!-- .slide: class="center" -->

[www.llmsunplugged.org](https://www.llmsunplugged.org)

---

## Q&A

<div class="grid-2">
<div class="left">

Questions?

</div>
<div>

![](/images/slides/socy-glider/CYBERNETICS_A_049.jpg)

</div>
</div>

---

<!-- .slide: class="center" -->

![ANU logo](/images/slides/ANU_Primary_Horizontal_GoldWhite.svg)
