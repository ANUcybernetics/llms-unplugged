---
title: LoRA
description:
  Add a lightweight adaptation layer to retarget a trained model without
  retraining everything.
order: 8
topic: adaptation-and-data
pdf: /assets/pdfs/08-lora.pdf
keyIdea:
  LoRA tweaks a base model with small, add-on counts that capture
  domain-specific shifts.
dependsOn:
  - Basic Training
  - Basic Generation
hero: /assets/images/hero-lora.jpg
templateEngineOverride: njk,md
---

# LoRA

> Prefer a printable copy? [Download the PDF handout]({{ pdf }}).

Efficiently adapt a trained language model to a new domain or style without
retraining the whole thing.

{% if hero %} ![Hero image: {{ description }}]({{ hero }}) {% endif %}

## You will need

- a completed bigram model from an earlier lesson (your base model)
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

## Instructor notes

### Discussion questions

- how much training data do you need for the LoRA layer compared to training
  from scratch?
- what happens if you scale the LoRA values by 2 or 0.5 before adding them?
- can you create multiple LoRA layers for different domains?
- which words change most between base and adapted models?
- when would you want a separate LoRA layer vs retraining the whole model?

### Connection to current LLMs

Low-Rank Adaptation revolutionised how modern LLMs are customised:

- **efficiency**: training a LoRA layer requires 100-1000x less computation than
  full fine-tuning
- **modularity**: you can have one base model plus many LoRA layers for
  different tasks (medical, legal, creative writing)
- **preservation**: the base model stays unchanged, so it retains its general
  capabilities
- **combination**: multiple LoRA layers can be combined or switched on-the-fly
- **distribution**: LoRA layers are small (megabytes vs gigabytes), making them
  easy to share

The key insight: most model adaptation happens in a small subspace of all
possible changes. Instead of adjusting billions of parameters, LoRA identifies
and modifies only the dimensions that matter for the new domain. Your paper
implementation makes this concrete: rather than recreating the entire grid, you
only track the changes needed for the new text style. When you add the base and
LoRA counts together, you're doing exactly what neural networks do when they
apply LoRA layers during inference. This is why organisations can maintain one
large foundation model and create thousands of specialised versions through
lightweight LoRA layers.
