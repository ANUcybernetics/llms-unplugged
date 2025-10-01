#import "utils.typ": *

// Apply base styling (colors, fonts, page setup)
#show: module-setup

#module-hero(
  "Sampling",
  "images/CYBERNETICS_A_098.jpg",
  "06",
)[
  When generating text the language model gives several different options for
  which word could come next in the generated text---which one to choose?

  == You will need

  - a completed model from an earlier module
  - pen, paper & dice as per _Basic Inference_

  == Your goal

  To generate text (with the same model) using at least two different
  temperature values and at least two different truncation strategies. *Stretch
    goal*: design and evaluate your own truncation strategy.

  == Key idea

  There are lots of different sampling algorithms---ways to select the next word
  during inference (text generation). Each strategy has different strengths and
  weaknesses, and can significantly influence the generated text even if the
  rest of the model is identical.
]

// Temperature section in two columns
#columns(2, gutter: 1em)[
  == Temperature control

  The temperature parameter (a number) controls the randomness by adjusting the
  relative likelihood of probable vs improbable words. The higher the
  temperature, the more uniform the distribution becomes, increasing randomness
  and allowing more sampling from unlikely words.

  === Algorithm

  + when sampling the next word, divide all counts by temperature value (round
    down, min 1)

  #colbreak()

  === Example

  If the counts in a given row are:

  #lm-grid(
    ([], `spot`, `run`, `jump`, `.`),
    (
      (`see`, "4", "2", "1", "1"),
    ),
  )

  + if *temperature = 1*: use counts as-is (4, 2, 1, 1)
    - `spot` is 2x as likely as `run`, 4x as likely as `jump` or `.`
  + if *temperature = 2*: divide counts by 2 → (2, 1, 1, 1)
    - `spot` still most likely, but only 2x as likely as others
  + if *temperature = 4*: divide counts by 4 → (1, 1, 1, 1)
    - all words equally likely
]

// Gold horizontal rule
#line(length: 100%, stroke: (paint: anu-colors.gold, thickness: 1pt))

// Truncation section in two columns
#columns(2, gutter: 1em)[
  == Truncation strategies

  Truncation narrows the viable "next word options" by ruling out some options.
  Any truncation strategy can be combined with temperature control.

  === Greedy sampling

  + find current word's row
  + select the word with the highest count
  + if there's a tie, roll dice to choose equally among the most likely options

  === Haiku sampling

  + track syllables in current line (5-7-5 pattern)
  + roll dice to select next word as normal
  + if selected word exceeds line's syllable limit, re-roll
  + start new line when syllable count reached

  === Non-sequitur sampling

  + find current word's row
  + pick the column with the lowest (non-zero) count
  + if there's a tie, roll dice to choose equally among the least likely options

  === No-repeat sampling

  + track all words used in current sentence
  + roll dice to select next word as normal
  + if word already used, re-roll
  + if no valid options remain, insert `.` and continue

  === Alliteration sampling

  + note first letter/sound of previous word
  + if any next-word options start with same letter/sound, sample only from
    those alliterative options
  + otherwise use standard sampling
]
