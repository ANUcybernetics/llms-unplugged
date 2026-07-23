// Copyright (c) 2026 Ben Swift
// Licensed under CC BY-NC-SA 4.0
//
// "Try it yourself" spread: a worked example of the generation module
// (pre-trained booklet variant), normalised to a single six-sided dice so
// readers can play along at home.
//
// This A3 landscape page is a DESIGNER REFERENCE for a 2-page spread in a
// large glossy booklet: the left half is the verso page (instructions +
// worked example), the right half is the recto page (the complete model,
// typeset like a page from one of the pre-trained booklets). The centre
// gutter is the spine. No artwork here by design---the designer will re-set
// it in their own workflow; this file fixes the content, the model data and
// the interaction logic.
//
// The model is a bigram model derived from data/cat-and-moon.txt. That
// corpus is constructed so that every entry's next-word counts scale
// *exactly* onto a single d6 (context totals of 1, 2, 3, 6 or 12-with-even-
// counts), so the printed thresholds involve no rounding. Verify with:
//
//   ./cli/target/release/llms_unplugged tsv -i data/cat-and-moon.txt
//
// Unlike the full-size booklets (d10, multi-dice ♦♦ entries), every entry
// here needs at most one roll of one d6, which keeps the instructions to a
// single rule.

#import "@local/anu-typst-template:0.3.0": anu, anu-colors

// ---------------------------------------------------------------------------
// Booklet typography helpers, adapted from cli/book.typ (white stroke for the
// dark theme; d6 semantics: a single diamond whenever there is a choice).

// Fixed-square outline box around a punctuation mark, so "." reads as a
// same-sized "symbol tile" at any text size.
#let punct-box(content, size: 1em, weight: "bold") = {
  set text(
    size: size,
    weight: weight,
    top-edge: "bounds",
    bottom-edge: "bounds",
  )
  box(
    width: 1em,
    height: 1em,
    stroke: 0.5pt + white,
    radius: 0.12em,
    inset: 0pt,
    align(center + horizon, content),
  )
}

#let headword(word, size: 1.4em) = {
  if word == "." {
    punct-box(word, size: size)
  } else {
    text(word, size: size, weight: "bold")
  }
}

// Single diamond: "roll your dice". Only shown when the entry has a choice.
#let dice-indicator = text(
  baseline: -0.1em,
  size: 0.9em,
  fill: anu-colors.gold,
  "♦",
)

// A next-word option: "3|dreams" (threshold semibold), or the bare word when
// it is the only option (no threshold, no roll).
#let format-option(threshold, word) = {
  let word-display = if word == "." { punct-box(word) } else { text(word) }
  if threshold == none {
    box(word-display)
  } else {
    box([#text(weight: "semibold")[#threshold]|#word-display])
  }
}

// A complete model entry: headword, diamond if there is a choice, options.
#let format-entry(word, options) = {
  headword(word)
  if options.len() > 1 {
    h(0.25em)
    dice-indicator
  }
  h(0.6em)
  for (threshold, next) in options {
    format-option(if options.len() > 1 { threshold } else { none }, next)
    h(0.55em)
  }
}

// ---------------------------------------------------------------------------
// The complete bigram model for data/cat-and-moon.txt. Thresholds are
// cumulative counts scaled exactly to 6 (options in alphabetical order).
// Single-option entries carry no threshold: no roll needed.

#let model = (
  (".", ((none, "the"),)),
  ("a", ((none, "song"),)),
  ("and", ((none, "the"),)),
  ("cat", ((3, "dreams"), (6, "sings"))),
  ("dog", ((3, "dreams"), (6, "sleeps"))),
  ("dreams", ((none, "of"),)),
  ("moon", ((3, "."), (5, "sings"), (6, "sleeps"))),
  ("night", ((3, "."), (6, "dreams"))),
  ("of", ((2, "a"), (6, "the"))),
  ("sings", ((4, "a"), (6, "to"))),
  ("sleeps", ((3, "."), (6, "and"))),
  ("song", ((4, "."), (6, "to"))),
  ("the", ((1, "cat"), (2, "dog"), (5, "moon"), (6, "night"))),
  ("to", ((none, "the"),)),
)

// ---------------------------------------------------------------------------

#show: doc => anu(
  title: "LLMs Unplugged",
  paper: "a3",
  footer_text: text(
    font: "Monaspace Argon",
    weight: "bold",
    fill: anu-colors.socy-yellow,
    "www.llmsunplugged.org | © 2026 Ben Swift | CC BY-NC-SA 4.0",
  ),
  config: (
    theme: "dark",
    ornaments: ("studio",),
    hide: ("page-numbers", "title-block"),
  ),
  page-settings: (
    flipped: true,
  ),
  doc,
)

#set text(size: 10.5pt)
#show heading: set block(above: 1.2em, below: 0.7em)

// Generated-text styling: italic serif, standing in for the reader's
// handwriting (the theme's raw/code styling is too heavy here).
#let gen(t) = text(font: "Libertinus Serif", style: "italic")[#t]

// Two-column spread: left = verso (instructions), right = recto (the model).
// The gutter between the columns is the booklet spine.
#grid(
  columns: (1fr, 1fr),
  gutter: 2.5cm,
  [
    // ------------------------------------------------------------ verso
    #v(2.2cm)
    #text(size: 2.6em, fill: anu-colors.gold)[*Try it yourself*]

    #v(0.5em)
    #text(size: 1.05em)[
      The page opposite is a complete language model---a pocket-sized cousin of
      ChatGPT. It was trained on a (very) small text, and it generates brand-new
      sentences the same way the big models do: one word at a time, with a dash
      of randomness. The randomness comes from an ordinary six-sided dice, so
      grab one (plus a pen and somewhere to write) and play along.
    ]

    == How to generate text

    + *choose a starting word*: any bold word on the model page (the boxed
      #punct-box(".") counts as a word too) and write it down
    + *look up its entry*: the model page works like a dictionary
    + *roll if you see a #dice-indicator*: a diamond means the model offers a
      choice of next words, so roll your dice once. No diamond means there's
      only one option---no roll needed
    + *find your next word*: scan along the options and take the first one whose
      number is _greater than or equal to_ your roll
    + *write it down and repeat* from step 2, using the word you just wrote.
      When you reach a #punct-box(".") you've generated a sentence---stop there,
      or keep going

    == Worked example

    Start by picking #headword("the", size: 1.2em) and writing it down. Then:

    #[
      #set text(size: 0.92em)
      #table(
        columns: (auto, 1.5fr, 1fr),
        align: (left + horizon, left + horizon, left + horizon),
        stroke: none,
        inset: (x: 0.4em, y: 0.4em),
        table.header([_look up_], [_roll the dice_], [_your text so far_]),
        table.hline(stroke: 0.5pt + anu-colors.gold),
        [#headword("the", size: 1.2em)],
        [roll a 1 → first number ≥ 1 is *1*|cat],
        [#gen[the cat]],

        [#headword("cat", size: 1.2em)],
        [roll a 2 → first number ≥ 2 is *3*|dreams],
        [#gen[the cat dreams]],

        [#headword("dreams", size: 1.2em)],
        [no #dice-indicator, so no roll: the only option is "of"],
        [#gen[the cat dreams of]],

        [#headword("of", size: 1.2em)],
        [roll a 5 → first number ≥ 5 is *6*|the],
        [#gen[the cat dreams of the]],

        [#headword("the", size: 1.2em)],
        [roll a 3 → first number ≥ 3 is *5*|moon],
        [#gen[the cat dreams of the moon]],

        [#headword("moon", size: 1.2em)],
        [roll a 1 → first number ≥ 1 is *3*|#punct-box(".")],
        [#gen[the cat dreams of the moon.]],
      )
    ]

    == What just happened?

    "The cat dreams of the moon" appears nowhere in the model's training
    text---the model composed it, by chaining together word-pairs it learned
    during training. This model knows 14 words and was trained on 51 words of
    text; the models behind modern chatbots know hundreds of thousands of
    word-pieces and are trained on trillions of words. But the
    generate-one-word-and-repeat trick is exactly the same.

  ],
  [
    // ------------------------------------------------------------ recto
    #v(1.2cm)

    // The model, typeset like a page from a pre-trained booklet: dictionary
    // guide words up top, one entry per line.
    #block(
      width: 100%,
      stroke: 0.5pt + anu-colors.gold-2,
      inset: (x: 1.4cm, y: 1cm),
    )[
      #set text(font: "Libertinus Serif", size: 13pt)

      // Guide words (first and last entry on the page), as in the full-size
      // booklets.
      #grid(
        columns: (1fr, 1fr),
        align(left, headword(model.first().at(0))),
        align(right, headword(model.last().at(0))),
      )
      #v(-0.4em)
      #line(length: 100%, stroke: 0.5pt + white)
      #v(0.8em)

      #for (word, options) in model {
        format-entry(word, options)
        v(0.35em)
      }
    ]

    #v(0.8em)
    #text(size: 0.95em, fill: anu-colors.grey-2)[
      This is the whole model: every word it knows, and every word the model
      says can follow it. Full-size pre-trained models---whole novels in booklet
      form---are at #text(fill: anu-colors.gold)[www.llmsunplugged.org].
    ]

    #v(0.4em)
    #block[
      #set text(size: 8pt, fill: anu-colors.grey-2)
      The training text (no peeking until you've generated a few sentences of
      your own):
      #rotate(180deg, reflow: true)[
        #set text(style: "italic")
        the cat sings to the moon. the cat dreams of a song. the dog dreams of
        the moon. the dog sleeps and the moon sleeps. the night dreams of the
        moon. the moon sings a song. the moon sings a song to the night.
      ]
    ]
  ],
)
