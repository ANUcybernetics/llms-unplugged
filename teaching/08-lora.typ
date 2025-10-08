// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See teaching/LICENSE for details.
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
  small adjustments rather than retraining everything. The LoRA layer is
  typically much smaller than the base model because you only track the
  _changes_ from the base model, not the full weights.
]

// Main content in two columns
#columns(2, gutter: 1em)[
  == Algorithm

  + *choose an existing bigram model as the "base model"*

  + *train a LoRA layer*:

    - start with a new grid (same columns as the base model)
    - process your new domain-specific text using the same algorithm as _Basic
        Training_, but only include rows for words that appear in your new text

  + *apply the adaptation*:

    - as per _Basic Inference_, but add the counts from both grids (if current
      word is in the LoRA grid)
    - optionally scale the LoRA values up or down to control adaptation strength

  == Example

  *Base model* trained on general text:

  #lm-grid(
    ([], `saw`, `they`, `we`, `the`, `a`, `red`),
    (
      (`saw`, "", "2", "", "4", "2", "1"),
      (`they`, "1", "", "", "2", "1", ""),
      (`we`, "", "", "", "3", "", ""),
      (`the`, "", "", "1", "", "", ""),
      (`a`, "", "", "", "", "", "2"),
      (`red`, "", "1", "", "", "", ""),
    ),
  )

  #colbreak(weak: true)

  *LoRA layer* trained on "I saw a red cat. I saw the red dog." (smaller---only
  1 row):

  #lm-grid(
    ([], `saw`, `they`, `we`, `the`, `a`, `red`),
    (
      (`saw`, "", "", "", "1", "1", "2"),
    ),
  )

  *Combined model* (add counts):

  #lm-grid(
    ([], `saw`, `they`, `we`, `the`, `a`, `red`),
    (
      (`saw`, "", "2", "", "5", "3", "3"),
      (`they`, "1", "", "", "2", "1", ""),
      (`we`, "", "", "", "3", "", ""),
      (`the`, "", "", "1", "", "", ""),
      (`a`, "", "", "", "", "", "2"),
      (`red`, "", "1", "", "", "", ""),
    ),
  )

  - `saw` row:
    - #text(font: "IBM Plex Mono")[[—,2,—,4,2,1]] (base)
    - #text(font: "IBM Plex Mono")[[—,—,—,1,1,2]] (LoRA)
    - #text(font: "IBM Plex Mono")[[—,2,—,5,3,3]] (base + LoRA)
  - `red` now equally likely as `the` after `saw`
  - other rows: base + zero = unchanged
  - LoRA is smaller: only 1 row vs 6 in base model
]
