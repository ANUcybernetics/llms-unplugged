// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
#import "/typst/utils.typ": *

// Apply base styling (colors, fonts, page setup)
#show: lesson-setup

#lesson-hero(
  "Pre-trained Model Generation",
  "/typst/images/CYBERNETICS_B_033.jpg",
  url: "https://www.llmsunplugged.org/lessons/pretrained-generation",
)[
  Use a (slightly larger) pre-trained model to generate new text through
  weighted random sampling.

  == You will need

  - a pre-trained model booklet
  - d10 for weighted sampling
  - pen & paper for writing down the generated "output text"

  == Your goal

  To generate new text using a pre-trained language model without having to
  train it yourself. *Stretch goal*: without looking at the title, try and guess
  which text the booklet model was trained on.

  == Key idea

  You don't need to train your own model to use one. Pre-trained models capture
  patterns from large amounts of text and can be used to generate new text just
  like your "hand-trained" model from _Grid Training_.
]

// Second page content in two columns
#columns(2, gutter: 1em)[
  == Algorithm

  Full instructions are at the front of the pre-trained model booklet, but
  here's a quick summary:

  + *choose a starting word*---pick any bold word from the booklet and write it
    down

  + *look up the word's entry* (i.e. use the booklet like a dictionary) to find
    all possible _next_ words according to the model

  + *roll your d10s* (if required): check for diamonds next to the word---this
    shows how many d10s to roll (e.g. ♦♦♦ means roll 3 d10s). If there are no
    diamonds, there's only one possible next word---skip to step 5. Read the
    dice from left to right as a single number (e.g. rolling 2, 1 and 7 means
    your roll is 217)

  + *find your next word*: scan through the followers until you find the first
    number ≥ your roll, or just use the single word if no dice were rolled
    (write it down)

  + repeat from step 2 using this word as your new word, continuing this loop
    until you reach a natural stopping point (like a period) or reach your
    desired text length

  #colbreak()

  == Example 1: single d10

  Your current word is *"cat"* and its entry shows:

  #text(font: "Libertinus Serif", size: 1.5em)[
    #text(weight: "bold")[cat] ♦#h(0.7em)#text(weight: "semibold")[4]|sat #text(
      weight: "semibold",
    )[7]|ran #text(weight: "semibold")[10]|slept
  ]

  - one diamond (♦) means roll 1 d10
  - roll your dice: roll a 6
  - find the next word: first number ≥ 6 is #text(
      font: "Libertinus Serif",
      weight: "semibold",
    )[7]|ran, so next word is "ran"
  - write it down, look it up and continue the process

  == Example 2: multiple d10s

  Your current word is *"the"* and its entry shows:

  #text(font: "Libertinus Serif", size: 1.5em)[
    #text(weight: "bold")[the] ♦♦#h(0.7em)#text(weight: "semibold")[33]|cat
    #text(
      weight: "semibold",
    )[66]|dog #text(weight: "semibold")[99]|end
  ]

  - two diamonds (♦♦) means roll 2 d10s
  - roll your dice: roll 5 and 8 → combine them to get 58
  - find the next word: first number ≥ 58 is #text(
      font: "Libertinus Serif",
      weight: "semibold",
    )[66]|dog, so next word is "dog"
  - write it down, look it up and continue the process
]
