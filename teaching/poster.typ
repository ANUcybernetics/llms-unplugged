// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0

// Import base template for colours and styling
#import "@local/anu-typst-template:0.2.0": *

// Utility functions from book.typ for consistent typography

// Function to create a punctuation box with consistent styling
#let punct-box(content, baseline: -0.2em) = box(
  rect(
    fill: none,
    stroke: 0.25pt + white,
    radius: 1pt,
    inset: (x: 0.1em, y: 0pt),
    outset: (y: 0pt),
    text(content, weight: "bold", baseline: baseline),
  ),
)

// Function to display text with punctuation in boxes
#let display-with-punctuation(text-content, size: 1.5em, weight: "bold") = {
  let parts = text-content.split(" ")
  for (i, part) in parts.enumerate() {
    if part == "." or part == "," {
      // Display punctuation in a rounded box
      let styled-punct = text(
        part,
        size: size,
        weight: weight,
        baseline: -0.2em,
      )
      box(
        rect(
          fill: none,
          stroke: 0.25pt + white,
          radius: 1pt,
          inset: (x: 0.1em, y: 0pt),
          outset: (y: 0pt),
          styled-punct,
        ),
      )
    } else if part == "—" {
      // Em dash separator
      text(" — ", size: size, weight: weight)
    } else {
      // Regular words
      text(part, size: size, weight: weight)
    }
    // Add space between parts
    if i < parts.len() - 1 and parts.at(i + 1) != "—" and part != "—" {
      h(0.3em)
    }
  }
}

// Function to format the dice indicator (diamond with number)
#let format-dice-indicator(total_count) = {
  // Only show when more than 1 d10 is needed (total_count > 9)
  if total_count > 9 {
    let num-str = str(str(total_count).len())
    // Create a diamond shape with the number inside
    box(
      baseline: -0.3em,
      height: 1em,
      rotate(
        45deg,
        origin: center,
        rect(
          fill: white,
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
                num-str,
              ),
            ),
          ),
        ),
      ),
    )
  }
}

// Function to format a single follower with its count
#let format-follower(word, count, show-count: true) = {
  if word == "." or word == "," {
    // Punctuation in a rounded box with optional count
    if show-count {
      box([#text(weight: "semibold")[#count]|#punct-box(word)])
    } else {
      punct-box(word)
    }
  } else {
    // Regular word with optional count
    if show-count {
      box([#text(weight: "semibold")[#count]|#text[#word]])
    } else {
      box([#word])
    }
  }
}

// Function to format all followers for a prefix
#let format-followers(followers) = {
  for follower in followers {
    let word = follower.at(0)
    let count = follower.at(1)
    let show-count = followers.len() > 1

    format-follower(word, count, show-count: show-count)
    h(0.5em)
  }
}

// Function to create a dice indicator for instructions/examples
#let instruction-dice-indicator(content) = box(
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
            content,
          ),
        ),
      ),
    ),
  ),
)

// Function to format a complete entry (prefix + dice indicator + followers)
#let format-entry(prefix, total_count, followers) = {
  // Format the prefix (larger, like in book.typ)
  display-with-punctuation(prefix, size: 1.5em, weight: "bold")

  // Add dice indicator if needed
  let indicator = format-dice-indicator(total_count)
  if indicator != none {
    h(0.2em)
    indicator
    h(0.6em)
  } else {
    h(0.6em)
  }

  // Format the followers (smaller, default size)
  format-followers(followers)
}

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
    #v(4cm) // Add vertical space to push title down
    #text(size: 3em, fill: anu-colors.gold)[*Language Model Books*]

    #text(size: 1.2em)[
      A collection of pre-trained language models in printed book form. Each
      page contains statistical patterns learned from text "training
      data"---just like ChatGPT, but human-scale enough to hold in your hands
      and generate new text with dice, pen and paper.
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
        ("cat", 100, ("in", 15), ("sat", 42), ("was", 68), (".", 100)),
        ("hat", 100, ("on", 25), ("was", 60), (".", 100)),
        ("in", 100, ("a", 33), ("the", 78), ("my", 100)),
        ("on", 100, ("a", 25), ("the", 63), ("my", 100)),
        ("sat", 100, ("down", 40), ("on", 75), (".", 100)),
        (
          "the",
          100,
          ("cat", 18),
          ("hat", 35),
          ("mat", 67),
          ("sun", 85),
          ("tree", 100),
        ),
        ("was", 100, ("red", 33), ("sitting", 67), (".", 100)),
      )

      #let mid = calc.ceil(example_entries.len() / 2)
      #grid(
        columns: (1fr, 1fr),
        gutter: 1em,
        // Left column
        box[
          #for item in example_entries.slice(0, mid) {
            let prefix = item.at(0)
            let total_count = item.at(1)
            let followers = item.slice(2)
            format-entry(prefix, total_count, followers)
            v(0.2em)
          }
        ],
        // Right column
        box[
          #for item in example_entries.slice(mid) {
            let prefix = item.at(0)
            let total_count = item.at(1)
            let followers = item.slice(2)
            format-entry(prefix, total_count, followers)
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
      version of ChatGPT in a similar fashion?
    - can you think of any ways to combine/modify multiple language models to
      change the character of the generated text?
    - could you make use of/lose your job to/fall in love with this type of
      language model? if not, how many volumes would you need?
  ],
  [
    #v(5.75cm)

    == Worked example

    #table(
      columns: (1.4fr, 1fr),
      align: (left + horizon, left + horizon),
      inset: (x: 0em, y: 0.5em),
      [Instruction], [Current output text],
      [
        - choose a starting word: pick any bold word from the booklet
        - write it down as your first word
      ],
      [`the`],

      [
        - look up `the` in the booklet (like using a dictionary)
        - the diamond "dice indicator" #display-with-punctuation(
            "the",
            size: 1em,
            weight: "bold",
          )#instruction-dice-indicator("2") means you'll need to roll two d10s
          (or the same one twice)
        - roll your dice: roll 2 and 7 → combine them to get 27
        - find your next word: scan through the followers until you find the
          first number ≥ 27, which is 35, so the next word is `hat`
        - write it down
      ],
      [`the` `hat`],

      [
        - look up `hat` in the booklet
        - roll your dice: roll 5 and 4 → get 54
        - find the next word: first number ≥ 54 is 60, so next word is `was`
        - write it down
      ],
      [`the` `hat` `was`],

      [
        - look up `was` in the booklet
        - roll and find the next word: `sitting`
        - write it down
      ],
      [`the` `hat` `was` `sitting`],

      [
        - look up `sitting` in the booklet
        - roll and find the next word: `on`
        - write it down
      ],
      [`the` `hat` `was` `sitting` `on`],

      [
        - look up `on` in the booklet
        - roll and find the next word: `the`
        - write it down
      ],
      [`the` `hat` `was` `sitting` `on` `the`],

      [
        - look up `the` in the booklet
        - roll and find the next word: `cat`
        - write it down
        - continue this process to generate more text
      ],
      [`the` `hat` `was` `sitting` `on` `the` `cat`],
    )

    #v(1cm)
  ],
)
