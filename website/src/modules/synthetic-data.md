---
title: Synthetic Data
description:
  Generate synthetic text with your model, retrain on it, and see how patterns
  drift or collapse.
order: 9
pdf: /assets/pdfs/09-synthetic-data.pdf
keyIdea:
  Training on model-generated data shows how patterns degrade and why fresh
  human data matters.
dependsOn:
  - Basic Generation
hero: /assets/images/workshop-2.jpg
templateEngineOverride: njk,md
---

# Synthetic Data

> Prefer a printable copy? [Download the PDF handout]({{ pdf }}).

Use your language model to generate new training data, then train a new model on
that synthetic data to watch patterns change.

{% if hero %} ![Participant comparing two sets of generated text]({{ hero }})
{% endif %}

## You will need

- a completed model from an earlier module
- pen, paper, and dice for generation
- grid paper for a new model

## Your goal

Generate synthetic text with your model, train a “generation 2” model on it, and
compare both models. Stretch goal: try a generation 3 model—or go full “Joker
mode.”

## Key idea

Models trained on synthetic data can drift or collapse, losing variety from the
original corpus. Watching this happen illustrates why real data matters.

## Algorithm

1. **Generate synthetic text:** use your existing model to create 50–100+ words
   (as in _Basic Generation_). This is your synthetic corpus.
2. **Train generation 2:** build a new grid with the Basic Training algorithm
   using the synthetic corpus.
3. **Compare models:**
   - note words that disappear or appear
   - compare shared cell counts
   - generate from both models and contrast the outputs

## Example

- Original text: “See Spot run. See Spot jump.”
- Synthetic output: “See run. Run spot. Spot run run.”
  - same vocabulary but different patterns (more `run run`, no `spot jump`)
- Generation 2 trained on the synthetic text amplifies those changes: `run run`
  becomes common, `spot jump` vanishes, and odd new patterns can appear.

## Joker mode

Skip generating text and instead create a completely random grid:

- invent any words you like for rows and columns
- add tally marks anywhere, in any amounts
- generate text from this random grid
- train a generation 2 model on that output

Compare to the original to see how quickly randomness compounds.
