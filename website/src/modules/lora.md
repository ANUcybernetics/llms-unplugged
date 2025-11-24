---
title: LoRA
description:
  Add a lightweight adaptation layer to retarget a trained model without
  retraining everything.
order: 8
pdf: /assets/pdfs/08-lora.pdf
keyIdea:
  LoRA tweaks a base model with small, add-on counts that capture
  domain-specific shifts.
dependsOn:
  - Basic Training
  - Basic Generation
hero: /assets/images/workshop-4.jpg
templateEngineOverride: njk,md
---

# LoRA

> Prefer a printable copy? [Download the PDF handout]({{ pdf }}).

Efficiently adapt a trained language model to a new domain or style without
retraining the whole thing.

{% if hero %} ![Facilitator explaining model adaptations]({{ hero }})
{% endif %}

## You will need

- a completed bigram model from an earlier module (your base model)
- pen, pencil, and grid paper
- new domain- or style-specific text

## Your goal

Create a lightweight adaptation layer that shifts your base model toward a new
domain. Stretch goal: experiment with mixing ratios between base and LoRA
layers.

## Key idea

Low-Rank Adaptation (LoRA) stores only the _changes_ from the base model, so it
can be much smaller. During generation you add LoRA counts to the base counts
(optionally scaled) and sample as normal.

## Algorithm

1. Choose an existing bigram grid as your base model.
2. Train a LoRA grid:
   - Start with a new grid using the same columns as the base.
   - Run _Basic Training_ on your new domain text, but only keep rows for words
     that appear in that text.
3. Apply the adaptation:
   - When sampling, add the LoRA counts to the base counts for the current word
     (if that row exists).
   - Optionally scale the LoRA counts up or down to control how strongly the
     adaptation influences the output.

## Example

- Base model (general text) has a `saw` row with counts toward `they`, `the`,
  `a`, `red`.
- LoRA trained on “I saw a red cat. I saw the red dog.” adds only a `saw` row
  with extra counts toward `the`, `a`, `red`.
- Combined sampling uses base + LoRA counts, making `red` more likely after
  `saw` while leaving other rows unchanged.
