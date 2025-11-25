---
title: Pre-trained Model Generation
description:
  Use a provided pre-trained booklet to generate text without training your own
  model.
order: 3
topic: scaling-up
pdf: /assets/pdfs/03-pretrained-generation.pdf
keyIdea:
  You can generate from a model you didn’t train—just follow its lookup rules
  and sample next words.
dependsOn:
  - Basic Generation
hero: /assets/images/workshop-4.jpg
templateEngineOverride: njk,md
---

# Pre-trained Model Generation

> Prefer a printable copy? [Download the PDF handout]({{ pdf }}).

Use a (slightly larger) pre-trained model booklet to generate new text through
weighted random sampling.

{% if hero %} ![Participant flipping through a model booklet]({{ hero }})
{% endif %}

## You will need

- a pre-trained model booklet
- a d10 (or similar) for weighted sampling
- pen and paper for your generated text

## Your goal

Generate text from a pre-trained language model without training it yourself.
Stretch goal: try to guess the training text before checking the booklet title.

## Key idea

Pre-trained models capture patterns from larger datasets. You can use them just
like your hand-built bigram model: look up the current word, roll dice, choose
the next word, and repeat.

## Algorithm (quick recap)

1. Choose a starting word—any bold word in the booklet—and write it down.
2. Look up that word’s entry to see possible next words and their thresholds.
3. Roll your d10(s):
   - If there’s an indicator (e.g., a small box with `2`), roll that many d10s
     and treat the digits as one number.
   - Otherwise, roll one d10.
4. Scan down the options; the first threshold greater than or equal to your roll
   gives the next word. Write it down.
5. Repeat from step 2 using the new word until you reach a natural stopping
   point or your desired length.

## Examples

- **Single d10:** Current word `cat` with options `4|sat`, `7|ran`, `10|slept`.
  Roll once; a 6 lands you on `ran`.
- **Multiple d10s:** Current word `the` with a `2` indicator and options
  `33|cat`, `66|dog`, `99|end`. Roll twice; a 5 and 8 combine to 58, so you
  choose `dog`.
