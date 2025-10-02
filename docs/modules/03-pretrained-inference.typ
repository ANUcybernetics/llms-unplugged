#import "utils.typ": *

// Apply base styling (colors, fonts, page setup)
#show: module-setup

#module-hero(
  "Pre-trained Model Inference",
  "images/CYBERNETICS_B_053.jpg",
  "03",
)[
  Use a pre-trained bigram booklet to generate new text through weighted random
  sampling with dice.

  == You will need

  - a pre-trained bigram booklet (e.g. based on _Pride and Prejudice_ or _The
      Call of the Wild_)
  - d10 (ten-sided dice) for weighted sampling
  - paper for writing down the generated output text

  == Your goal

  To generate new text using a professionally-trained language model without
  having to train it yourself. *Stretch goal*: generate a full paragraph or page
  of text.

  == Key idea

  You don't need to train your own model to use one. Pre-trained models capture
  patterns from large amounts of text and can generate new text that mimics the
  style and vocabulary of the training data.
]

// Second page content in two columns
#columns(2, gutter: 1em)[
  == Algorithm

  + *choose a starting word*---pick any bold word from the booklet and write it
    down
  + *look up the word's entry* (use the booklet like a dictionary) to find all
    possible next words
  + *roll your d10(s)*:
    - if the word has a black diamond indicator (♢) then roll that many d10s
      (e.g. ♢2 means roll 2 d10s)
    - otherwise, roll a single d10
    - read the dice from left to right as a single number (e.g. rolling 4, 7 and
      2 on three dice gives 472)
  + *scan through the next word options* to find your next word: the first
    number which is greater than or equal to your roll indicates your next word
    (write it down)
  + *repeat* from step 2 using this new word, continuing until you reach a
    natural stopping point (like a period) or your desired length

  #colbreak()

  == Example 1: single d10

  Your current word is *"cat"* and its entry shows:

  *cat* → 4|sat 7|ran 10|slept

  - no black diamond means roll just 1 d10
  - you roll a 6
  - scan through options: 7|ran is the first number ≥ 6
  - your next word is "ran": write it down, look it up and continue

  == Example 2: multiple d10s

  Your current word is *"the"* and its entry shows:

  *the* ♢2 → 33|cat 66|dog 99|end

  - the black diamond with *2* inside means roll 2 d10s
  - you roll 5 and 8, giving you 58
  - scan through options: 66|dog is the first number ≥ 58
  - your next word is "dog": write it down, look it up and continue
]
