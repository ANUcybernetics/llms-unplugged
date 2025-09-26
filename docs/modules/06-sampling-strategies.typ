#import "utils.typ": *

// Apply base styling (colors, fonts, page setup)
#show: module-setup

#module-hero(
  "Sampling Strategies",
  "images/CYBERNETICS_A_098.jpg",
)[
  Even after your model is trained, you have creative control over how it
  generates text.

  == You will need

  - a completed model from an earlier module

  == Your goal

  To generate text using the same model, but using at least two different
  temperature values and at least two different truncation strategies.

  == Key idea

  There are lots of different sampling strategies---ways to select the next word
  during generation. Each strategy serves a different purpose, from maximising
  accuracy to embracing chaos, from creating structured poetry to mimicking
  child speech. Understanding these strategies reveals how modern LLMs control
  their output style.
]

// Temperature section in two columns
#columns(2, gutter: 1em)[
  == Temperature control

  Temperature controls the randomness by adjusting the relative likelihood of
  probable vs improbable words (making things more predictable or more
  "chaotic").

  === Algorithm

  + *temperature = 1 (normal)*: use counts as-is
  + *temperature > 1 (warmer)*: divide all counts by temperature value (round
    down, min 1)
  + *temperature < 1 (cooler)*: multiply all counts by 1/temperature (round up)

  The higher the temperature, the more uniform the distribution becomes.

  #colbreak()

  === Example

  If the counts in a given row are:

  #lm-grid(
    ([], `spot`, `run`, `jump`, `.`),
    (
      (`see`, "4", "2", "1", "1"),
    ),
  )

  + *temperature = 1*: use counts as-is (4, 2, 1, 1)
    - `spot` is 2x as likely as `run`, 4x as likely as `jump` or `.`
  + *temperature = 2*: divide counts by 2 → (2, 1, 1, 1)
    - `spot` still most likely, but only 2x as likely as others
  + *temperature = 3*: divide counts by 3 → (1, 1, 1, 1)
    - all words equally likely
]

// Gold horizontal rule
#line(length: 100%, stroke: (paint: rgb("#D4AF37"), thickness: 1pt))

// Truncation section in two columns
#columns(2, gutter: 1em)[
  == Truncation strategies

  Truncation narrows the viable "next word options" by setting some option
  counts to zero (e.g., top-k, top-p, or constraint-based filtering). Any
  truncation strategy can be combined with temperature control.

  === Haiku sampling

  + track syllables in current line (5-7-5 pattern)
  + roll dice to select next word as normal
  + if selected word exceeds line's syllable limit, re-roll
  + start new line when syllable count reached

  === No-repeat sampling

  + track all words used in current sentence
  + roll dice to select next word as normal
  + if word already used, re-roll
  + if no valid options remain, insert `.` and continue

  #colbreak()

  === Non-sequitur sampling

  + find current word's row
  + pick the column with the lowest (non-zero) count
  + if there's a tie, roll dice to choose equally among the least likely options

  === Alliteration sampling

  + note first letter/sound of previous word
  + if any next-word options start with same letter/sound, sample only from
    those alliterative options
  + otherwise use standard sampling
]
