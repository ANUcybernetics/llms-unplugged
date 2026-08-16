// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0

// Import base template for colours and styling
#import "@local/anu-typst-template:0.3.0": *

// Shared booklet typography from cli/booklet-common.typ (compiled with
// --root .. so the cross-directory import resolves). White stroke for the
// poster's dark theme; format-dice-indicator keeps poster-specific semantics
// for the static example.
#import "../cli/booklet-common.typ" as bc

#let display-with-punctuation(
  text-content,
  size: 1.5em,
  weight: "bold",
) = bc.display-with-punctuation(
  text-content,
  size: size,
  weight: weight,
  stroke-color: white,
)

// Function to format the dice indicator (n diamonds)
#let format-dice-indicator(total_count) = {
  // Always show diamonds indicating number of dice needed
  // For 0-99 normalization, we need to look at (total_count - 1)
  bc.dice-diamonds(str(total_count - 1).len(), fill: white)
}

// Function to format all next-word options for a previous-words context
#let format-next-words(next_words) = bc.format-next-words(
  next_words,
  stroke-color: white,
)

// Function to create dice indicators for instructions/examples
#let instruction-dice-indicator(num-dice) = {
  text(
    baseline: -0.1em,
    size: 0.9em,
    fill: white,
    stroke: 0.5pt + black,
    "♦" * num-dice,
  )
}

// Function to format a complete entry (previous words + dice indicator + next words)
#let format-entry(previous_words, total_count, next_words) = {
  // Format the previous-words context (larger, like in book.typ)
  display-with-punctuation(previous_words, size: 1.5em, weight: "bold")

  // Add dice indicator
  h(0.2em)
  format-dice-indicator(total_count)
  h(0.6em)

  // Format the next-word options (smaller, default size)
  format-next-words(next_words)
}

#show: doc => anu(
  title: "LLMs Unplugged",
  paper: "a3",
  footer_text: text(
    font: "Monaspace Argon",
    weight: "bold",
    fill: anu-colors.socy-yellow,
    "© 2025 Ben Swift | CC BY-NC-SA 4.0",
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
  columns: (5fr, 6fr),
  gutter: 2cm,
  [
    #v(3cm) // Add vertical space to push title down
    #text(size: 3em, fill: anu-colors.gold)[*Language Model Books*]

    #text(size: 1.2em)[
      A collection of pre-trained language models in printed book form. Each
      page contains statistical patterns learned from text "training
      data"---just like ChatGPT, but human-scale. You can hold it in your hands,
      and you can use it to generate new text with just dice, pen and paper.
    ]

    == How it works

    Each volume is organised like a dictionary. Each word shows which words can
    follow it, with probabilities mapped to dice rolls. To generate _new_ text
    from this model all you need to do is roll the dice, look up the result,
    write down the next word, and repeat (see worked example, right).

    To give you an idea, here's an excerpt:

    #block(
      inset: (x: 0pt, top: 0.5em, bottom: 1em),
      stroke: (top: 0.5pt + anu-colors.gold, bottom: 0.5pt + anu-colors.gold),
    )[
      #set text(size: 10pt, font: "Libertinus Serif")

      // Pedagogical example with clear patterns
      #let example_entries = (
        ("cat", 10, ("sat", 5), (".", 9)),
        ("hat", 100, ("on", 24), ("was", 59), (".", 99)),
        ("in", 10, ("a", 3), ("the", 9)),
        ("mat", 10, (".", 9)),
        ("my", 10, ("cat", 9)),
        ("on", 10, ("a", 2), ("the", 6), ("my", 9)),
        ("sat", 10, ("on", 9)),
        ("sitting", 10, ("on", 5), ("in", 9)),
        (
          "the",
          1000,
          ("cat", 117),
          ("hat", 234),
          ("mat", 566),
          ("sun", 784),
          ("tree", 999),
        ),
        ("was", 100, ("red", 32), ("sitting", 66), (".", 99)),
      )

      #let mid = calc.ceil(example_entries.len() / 2)
      #grid(
        columns: (1fr, 1fr),
        gutter: 1em,
        // Left column
        box[
          #for item in example_entries.slice(0, mid) {
            let previous_words = item.at(0)
            let total_count = item.at(1)
            let next_words = item.slice(2)
            format-entry(previous_words, total_count, next_words)
            v(0.2em)
          }
        ],
        // Right column
        box[
          #for item in example_entries.slice(mid) {
            let previous_words = item.at(0)
            let total_count = item.at(1)
            let next_words = item.slice(2)
            format-entry(previous_words, total_count, next_words)
            v(0.2em)
          }
        ],
      )
    ]

    Some of the larger language models are split across multiple volumes (e.g.
    A--K, L--Z just like the phone books of old).

    == Discussion questions

    - what can (and can't) you tell about the model's training data from leafing
      through the pages of a language model book?
    - how many volumes/pages do you think it would take to print out the latest
      version of ChatGPT?
    - can you think of ways to combine/modify multiple language models to change
      the character of the generated text?
    - could you make use of/lose your job to/fall in love with this type of
      language model? if not, how many volumes would you need before the answer
      is "yes"?
  ],
  [
    #v(3cm)

    == Worked example

    #table(
      columns: (5fr, 3fr),
      align: (left + horizon, left + horizon),
      inset: (x: 0em, y: 0.5em),
      [Instruction], [Generated text],
      [
        - choose a starting word: pick any bold word from the booklet
        - write it down as your first word
      ],
      [#h(0.5em)`the`],

      [
        - look up `the` in the booklet (like using a dictionary)
        - the dice indicators #display-with-punctuation(
            "the",
            size: 1em,
            weight: "bold",
          )#instruction-dice-indicator(3) show you'll need to roll three d10s
        - roll your dice: roll 2, 1 and 7 → combine them to get 217
        - find your next word: scan through the next-word options until you find
          the first number ≥ 217, which is 234, so the next word is `hat`
        - write it down
      ],
      [#h(0.5em)`the` `hat`],

      [
        - look up `hat` in the booklet
        - roll your dice: roll 5 and 4 → get 54
        - find the next word: first number ≥ 54 is 59, so next word is `was`
        - write it down
      ],
      [#h(0.5em)`the` `hat` `was`],

      [
        - look up `was` in the booklet
        - roll your dice: roll 4 and 6 → get 46
        - find the next word: first number ≥ 46 is 66, so next word is `sitting`
        - write it down
      ],
      [#h(0.5em)`the` `hat` `was` `sitting`],

      [
        - look up `sitting` in the booklet
        - roll a 3 and find the next word: first number ≥ 3 is 5, so next word
          is
          `on`
        - write it down
      ],
      [#h(0.5em)`the` `hat` `was` `sitting` `on`],

      [
        - look up `on` in the booklet
        - roll an 8 and find the next word: first number ≥ 8 is 9, so next word
          is
          `my`
        - write it down
      ],
      [#h(0.5em)`the` `hat` `was` `sitting` `on` `my`],

      [
        - look up `my` in the booklet
        - there's only one next-word option, so no need to roll dice
        - the next word is `cat`
        - write it down
      ],
      [#h(0.5em)`the` `hat` `was` `sitting` `on` `my` `cat`],

      [
        - look up `cat` in the booklet
        - roll a 7 and find the next word: first number ≥ 7 is 9, so next word
          is
          `.`
        - write it down
      ],
      [#h(0.5em)`the` `hat` `was` `sitting` `on` `my` `cat` `.`],
    )
  ],
)
