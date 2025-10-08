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
    #v(3cm) // Add vertical space to push title down
    #text(size: 3em, fill: anu-colors.gold)[*My First Language Model*]

    #text(size: 1.2em)[
      A collection of pre-trained language models in booklet form. Each page
      contains statistical patterns learned from text "training data"---just
      like ChatGPT, but human-scale enough to hold in your hands and generate
      new text with dice, pen and paper.
    ]

    == How it works

    Each booklet is organised like a dictionary. Each word shows which words can
    follow it, with probabilities mapped to d10 dice rolls. Roll the dice, look
    up the result, write down the next word, and repeat. Some of the larger
    language models are split across multiple booklets (e.g. A--K, L--Z just
    like the phone books of old).

    == How to generate text

    + *choose a starting word*: pick any bold word from the booklet
    + *look up the word's entry*: use it like a dictionary
    + *roll your d10(s)*: the #instruction-dice-indicator([_n_]) indicator tells you how many times
    + *find your next word*: scan until you find the first number ≥ your roll
    + *repeat*: write it down, look it up, and continue
  ],
  [
    #v(3cm)

    == Inference example: generating _new_ text from the model

    Choose *cat* as your starting word. Look it up in the booklet to find
    something like this:

    #block(
      inset: (x: 0pt, top: 0.5em, bottom: 1em),
      stroke: (top: 0.5pt + anu-colors.gold, bottom: 0.5pt + anu-colors.gold),
    )[
      #set text(size: 10pt, font: "Libertinus Serif")

      // Load example data from JSON
      #let cat_data = json(sys.inputs.at(
        "poster_example",
        default: "cat-in-hat.json",
      ))
      #let selected_entries = (
        cat_data.data.at(37), // "cat"
        cat_data.data.at(46), // "do"
        cat_data.data.at(78), // "have"
        cat_data.data.at(97), // "in"
        cat_data.data.at(111), // "like"
        cat_data.data.at(141), // "not"
        cat_data.data.at(191), // "the"
      ).sorted(key: item => item.at(0))

      #let mid = calc.ceil(selected_entries.len() / 2)
      #grid(
        columns: (1fr, 1fr),
        gutter: 1em,
        // Left column
        box[
          #for item in selected_entries.slice(0, mid) {
            let prefix = item.at(0)
            let total_count = item.at(1)
            let followers = item.slice(2)
            format-entry(prefix, total_count, followers)
            v(0.2em)
          }
        ],
        // Right column
        box[
          #for item in selected_entries.slice(mid) {
            let prefix = item.at(0)
            let total_count = item.at(1)
            let followers = item.slice(2)
            format-entry(prefix, total_count, followers)
            v(0.2em)
          }
        ],
      )
    ]

    #v(1cm)

    === Step-by-step walkthrough

    #grid(
      columns: (1.2fr, 1fr),
      gutter: 1.5em,
      [
        + *"cat"* has a #instruction-dice-indicator("2") indicator, so roll your d10 twice → you roll 3 and 8 = 38
        + scan through the followers: first number ≥ 38 is 76, so next word is
          *in*
        + *"in"* also needs 2 dice → you roll 7 and 4 = 74
        + first number ≥ 74 is 74, so next word is *the*
        + *"the"* needs 2 dice → you roll 2 and 4 = 24
        + first number ≥ 24 is 24, so next word is *cat*
        + continue this process...
      ],
      [
        #v(0.5em)
        #text(style: "italic")[cat]

        #v(0.5em)
        #text(style: "italic")[cat in]

        #v(0.5em)
        #text(style: "italic")[cat in the]

        #v(0.5em)
        #text(style: "italic")[cat in the cat]

        #v(0.5em)
        #text(style: "italic")[cat in the cat in]

        #v(0.5em)
        #text(style: "italic")[cat in the cat in the hat]
      ],
    )

    #v(1cm)

    == Discussion questions

    - can you guess what text the model was trained on?
    - how does using a pre-trained model differ from training your own?
    - why might some word combinations feel more natural than others?

    #v(1cm)
  ],
)
