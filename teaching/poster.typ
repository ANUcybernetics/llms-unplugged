// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0

// Import base template for colours and styling
#import "@local/anu-typst-template:0.2.0": *

#show: doc => anu(
  title: "My First Language Model",
  paper: "a3",
  footer_text: text(
    font: "Neon Tubes 2",
    fill: anu-colors.socy-yellow,
    "CC BY-NC-SA 4.0",
  ),
  config: (
    theme: "dark",
    logos: ("studio",),
    hide: ("page-numbers", "title-block"),
  ),
  page-settings: (
    flipped: true,
  ),
  doc,
)

// Content: 2-column layout
#grid(
  columns: (1fr, 1fr),
  gutter: 2cm,
  [
    #v(3cm) // Add vertical space to push title down
    #text(size: 3em, fill: anu-colors.gold)[*My First Language Model*]

    #text(size: 1.2em)[
      Generate text using nothing but dice and a pre-trained model booklet. No
      computer required.
    ]

    #v(1cm)

    == What is this?

    A pre-trained language model in booklet form. Each page contains statistical
    patterns learned from a text corpus---just like ChatGPT, but small enough to
    hold in your hands and use with dice.

    #v(0.5cm)

    == How it works

    The booklet is organised like a dictionary. Each word shows which words can
    follow it, with probabilities mapped to dice rolls. Roll the dice, look up
    the result, write down the next word, and repeat.

    #v(0.5cm)

    == What's inside

    - thousands of word entries (alphabetically sorted)
    - probability distributions for next-word prediction
    - guide words on each page for easy lookup
    - instructions for weighted random sampling

    #v(0.5cm)

    == How to generate text

    + *choose a starting word*: pick any bold word from the booklet
    + *look up the word's entry*: use it like a dictionary
    + *roll your d10(s)*: the #box(
        baseline: -0.3em,
        height: 1em,
        rotate(
          45deg,
          origin: center,
          rect(
            fill: white,
            stroke: 0.5pt + black,
            width: 0.7em,
            height: 0.7em,
            place(
              center + horizon,
              rotate(
                -45deg,
                origin: center,
                text(
                  fill: black,
                  weight: "bold",
                  size: 0.65em,
                  [_n_],
                ),
              ),
            ),
          ),
        ),
      ) indicator tells you how many times
    + *find your next word*: scan until you find the first number ≥ your roll
    + *repeat*: write it down, look it up, and continue
  ],
  [
    #v(3cm)

    == Example

    Your current word is *the* and its entry shows:

    #text(size: 12pt)[
      *the* #box(
        baseline: -0.3em,
        height: 1em,
        rotate(
          45deg,
          origin: center,
          rect(
            fill: white,
            stroke: 0.5pt + black,
            width: 0.7em,
            height: 0.7em,
            place(
              center + horizon,
              rotate(
                -45deg,
                origin: center,
                text(
                  fill: black,
                  weight: "bold",
                  size: 0.65em,
                  "2",
                ),
              ),
            ),
          ),
        ),
      ) → #text(weight: "semibold")[33]|cat #text(weight: "semibold")[66]|dog
      #text(
        weight: "semibold",
      )[99]|mouse
    ]

    #v(0.5cm)

    + the indicator with *2* inside means roll your d10 twice
    + you roll 5 and 8, giving you 58
    + scan through: #text(weight: "semibold")[66]|dog is the first number ≥ 58
    + your next word is *dog*
    + repeat: look up *dog* and continue

    #v(1cm)

    == What you learn

    - how language models work by experiencing one directly
    - the relationship between training data and generated output
    - why probability matters in natural language
    - the computational patterns behind modern AI

    #v(1cm)
  ],
)
