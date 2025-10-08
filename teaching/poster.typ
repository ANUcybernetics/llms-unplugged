// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0

// Import base template for colours and styling
#import "@local/anu-typst-template:0.2.0": *

// Utility functions from book.typ for consistent typography

// Function to create a punctuation box with consistent styling
#let punct-box(content, baseline: -0.2em) = box(
  rect(
    fill: none,
    stroke: 0.25pt + black,
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
          stroke: 0.25pt + black,
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
#let format-dice-indicator(num-dice) = {
  if num-dice > 1 {
    let num-str = str(num-dice)
    // Create a diamond shape with the number inside
    box(
      baseline: -0.3em,
      height: 1em,
      rotate(
        45deg,
        origin: center,
        rect(
          fill: black,
          width: 0.7em,
          height: 0.7em,
          place(
            center + horizon,
            rotate(
              -45deg,
              origin: center,
              text(
                fill: white,
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

// Function to format a complete entry (prefix + dice indicator + followers)
#let format-entry(prefix, num-dice, followers) = {
  // Format the prefix
  display-with-punctuation(prefix, size: 1em, weight: "bold")

  // Add dice indicator if needed
  let indicator = format-dice-indicator(num-dice)
  if indicator != none {
    h(0.2em)
    indicator
    h(0.6em)
  } else {
    h(0.6em)
  }

  // Format the followers
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

    == Booklet excerpt

    Here's what the actual booklet pages look like:

    #block(
      inset: (x: 1em, y: 0.5em),
      stroke: 0.5pt + gray,
      radius: 3pt,
    )[
      #set text(size: 10pt, font: "Libertinus Serif")

      // Load example data from JSON if it exists, otherwise use hardcoded example
      #let example_data = if sys.inputs.at(
        "poster_example",
        default: none,
      ) != none {
        json(sys.inputs.poster_example).data
      } else {
        (
          ("cat", 2, ("sat", 4), ("ran", 7), ("slept", 10)),
          ("dog", 2, ("barked", 3), ("ran", 6), ("slept", 10)),
          ("the", 2, ("cat", 33), ("dog", 66), ("mouse", 99)),
        )
      }

      #for item in example_data {
        let prefix = item.at(0)
        let num-dice = item.at(1)
        let followers = item.slice(2)
        format-entry(prefix, num-dice, followers)
        v(0.2em)
      }
    ]

    #v(0.5cm)

    == Discussion questions

    - can you guess what text the model was trained on from the generated
      output?
    - how does using a pre-trained model differ from training your own?
    - what vocabulary size does the booklet model have compared to a hand-built
      model?
    - why might some word combinations feel more natural than others?
    - without looking at the title: can you identify the training text's genre
      or style?

    #v(1cm)
  ],
)
