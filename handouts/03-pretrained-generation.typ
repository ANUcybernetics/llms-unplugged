// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See teaching/LICENSE for details.
#import "utils.typ": *

// Apply base styling (colors, fonts, page setup)
#show: module-setup

#module-hero(
  "Pre-trained Model Generation",
  "images/CYBERNETICS_B_033.jpg",
  "03",
)[
  Use a (slightly larger) pre-trained model to generate new text through
  weighted random sampling.

  == You will need

  - a pre-trained model booklet
  - d10 (or similar) for weighted sampling
  - pen & paper for writing down the generated "output text"

  == Your goal

  To generate new text using a pre-trained language model without having to
  train it yourself. *Stretch goal*: without looking at the title, try and guess
  which text the booklet model was trained on.

  == Key idea

  You don't need to train your own model to use one. Pre-trained models capture
  patterns from large amounts of text and can be used to generate new text just
  like your "hand-trained" model from _Basic Training_.
]

// Second page content in two columns
#columns(2, gutter: 1em)[
  == Algorithm

  Full instructions are at the front of the booklet, but here's a quick summary:

  + *choose a starting word*---pick any bold word from the booklet and write it
    down
  + *look up the word's entry* (use the booklet like a dictionary) to find all
    possible next words
  + *roll your d10(s)*:
    - if the word has a #box(
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
      ) indicator then roll a d10 _n_ times, otherwise roll it once
    - interpret these dice rolls as digits from a single number (e.g. if you
      roll 4, then 7, then 2 then your number is 472)
  + *scan through the "next word" options* to find your next word: the first
    number which is greater than or equal to your roll indicates your next word
    (write it down)
  + *repeat* from step 2 using this new word, continuing until you reach a
    natural stopping point (like a period) or your desired length

  #colbreak()

  == Example 1: single d10

  Your current word is *"cat"* and its entry shows:

  *cat* → #text(weight: "semibold")[4]|sat #text(weight: "semibold")[7]|ran
  #text(
    weight: "semibold",
  )[10]|slept

  - no indicator means roll your (single) d10
  - you roll a 6
  - scan through options: #text(weight: "semibold")[7]|ran is the first number ≥
    6
  - your next word is "ran": write it down, look it up and continue

  == Example 2: multiple d10s

  Your current word is *"the"* and its entry shows:

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
  ) → #text(weight: "semibold")[33]|cat #text(weight: "semibold")[66]|dog #text(
    weight: "semibold",
  )[99]|end

  - the indicator with *2* inside means roll your d10 twice
  - you roll 5 and 8, giving you 58
  - scan through options: #text(weight: "semibold")[66]|dog is the first number
    ≥ 58
  - your next word is "dog": write it down, look it up and continue
]
