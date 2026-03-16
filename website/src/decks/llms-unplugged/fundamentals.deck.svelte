---
title: LLMs Unplugged (Fundamentals)
description: A Cybernetic Studio workshop
---

<!-- _class: banner -->

# LLMs Unplugged

## Understand AI by building it yourself

![bg](../assets/bg-title.avif)

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

## The algorithm

![bg right:40%](../assets/bg-algorithm-training.avif)

1. **preprocess** your text: lowercase everything, treat words, commas and full
   stops as separate tokens
2. **set up** your grid: first token goes in both the row & column headers
3. **fill in** the grid: for each consecutive pair of tokens, add a tally mark
   in that cell (add new rows/columns as needed)

---

## Example

![bg right:40%](../assets/bg-example.avif)

_"See Spot run. Run, Spot, run."_

after preprocessing:

`see` `spot` `run` `.` `run` `,` `spot` `,` `run` `.`

---

## Training: `see` &rarr; `spot`

<StaticGrid tokens={EXAMPLE_TOKENS} vocabulary={EXAMPLE_VOCAB} step={1} />

---

## Training: `spot` &rarr; `run`

<StaticGrid tokens={EXAMPLE_TOKENS} vocabulary={EXAMPLE_VOCAB} step={2} />

---

## Training: `run` &rarr; `.`

<StaticGrid tokens={EXAMPLE_TOKENS} vocabulary={EXAMPLE_VOCAB} step={3} />

---

## Complete model

<StaticGrid tokens={EXAMPLE_TOKENS} vocabulary={EXAMPLE_VOCAB} step={9} />

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

## The algorithm

![bg right:40%](../assets/bg-algorithm-generation.avif)

1. **choose** a starting word from your grid
2. **look** at that word's row to find all possible next words and their counts
3. **roll dice** weighted by the counts to pick the next word
4. **write down** the chosen word and make it your new starting word
5. **repeat** from step 2 until you reach a `.` or your desired length

---

## Generation: start with `see`

&nbsp;

<StaticGeneration tokens={EXAMPLE_TOKENS} vocabulary={EXAMPLE_VOCAB} sequence={EXAMPLE_GENERATION} step={0} />

---

## Generation: `see` &rarr; `spot`

only one option --- no dice roll needed

<StaticGeneration tokens={EXAMPLE_TOKENS} vocabulary={EXAMPLE_VOCAB} sequence={EXAMPLE_GENERATION} step={1} />

---

## Generation: `spot` &rarr; `,`

two options (`run` and `,`) --- roll dice!

<StaticGeneration tokens={EXAMPLE_TOKENS} vocabulary={EXAMPLE_VOCAB} sequence={EXAMPLE_GENERATION} step={2} />

---

## Generation: `,` &rarr; `run`

two options (`spot` and `run`) --- roll dice!

<StaticGeneration tokens={EXAMPLE_TOKENS} vocabulary={EXAMPLE_VOCAB} sequence={EXAMPLE_GENERATION} step={3} />

---

## Generation: `run` &rarr; `.`

two options (`.` and `,`) --- roll dice!

<StaticGeneration tokens={EXAMPLE_TOKENS} vocabulary={EXAMPLE_VOCAB} sequence={EXAMPLE_GENERATION} step={4} />

---

## Generated text

![bg right:40%](../assets/bg-generated-text.avif)

_"see spot, run."_

a new sentence --- not in the training data!

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

## Discussion

- how much does this change the interpretation of AI outputs?
- how might understanding how LLMs work help you and your teams to use them more effectively?
- what questions do you still have?

![bg left:40%](../assets/bg-participants.avif)

---

<script lang="ts">
  import StaticGrid from "../../components/StaticGrid.svelte";
  import StaticGeneration from "../../components/StaticGeneration.svelte";
  import TrainingWidget from "../../components/widgets/TrainingWidget.svelte";
  import GenerationWidget from "../../components/widgets/GenerationWidget.svelte";
  import "../../styles/widgets.css";

  const EXAMPLE_TOKENS = "see spot run . run , spot , run .";
  const EXAMPLE_VOCAB = "see spot run . ,";
  const EXAMPLE_GENERATION = "see spot , run .";
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

<!-- _class: socy-logo -->
