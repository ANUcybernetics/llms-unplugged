// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See docs/LICENSE for details.
#import "utils.typ": *

// Apply base styling
#show: module-setup

#module-hero(
  "LoRA",
  "images/CYBERNETICS_B_032.jpg",
  "08",
)[
  Efficiently adapt a trained language model to a new domain or style without
  retraining the entire model from scratch.

  == You will need

  - a completed bigram model from an earlier module
  - pen, pencil and grid paper
  - some new text in a different style or domain

  == Your goal

  To create a lightweight "adaptation layer" that modifies your existing model's
  behaviour for a new domain. *Stretch goal*: combine the base model and LoRA
  layer with different mixing ratios.

  == Key idea

  Low-Rank Adaptation (LoRA) allows you to specialise a language model by adding
  small adjustments rather than retraining everything. This is efficient because
  you only track the _changes_ from the base model.
]

// Main content in two columns
#columns(2, gutter: 1em)[
  == Algorithm

  + *choose your base model*:

    - use a bigram model you've already trained on some text

  + *train a LoRA layer*:

    - create a new grid with the same structure as your base model
    - process your new domain-specific text using the same algorithm as Basic
      Training
    - this grid captures only the new patterns

  + *apply the adaptation*:

    - when generating text, add the counts from both grids (base + LoRA) for
      each cell
    - optionally scale the LoRA values up or down to control adaptation strength

  #colbreak()

  == Example

  Base model trained on general text:

  #lm-grid(
    ([], `the`, `a`, `spotted`),
    (
      (`saw`, "4", "2", "1"),
    ),
  )

  LoRA layer trained on nature documentary text:

  #lm-grid(
    ([], `the`, `a`, `spotted`),
    (
      (`saw`, "1", "0", "3"),
    ),
  )

  Combined model (base + LoRA):

  #lm-grid(
    ([], `the`, `a`, `spotted`),
    (
      (`saw`, "5", "2", "4"),
    ),
  )

  The word `spotted` is now much more likely after `saw`, reflecting the nature
  documentary style, while preserving the base patterns.
]
