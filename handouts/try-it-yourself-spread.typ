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
// The model is a bigram model of the first four stanzas (23 body lines,
// "The sun did not shine." through "Not one little bit.") of The Cat in the
// Hat --- Seuss's controlled vocabulary gives a small vocab with dense
// branching (22 of 46 entries offer a dice roll; no entry exceeds 6
// options), which real prose and even chorus-heavy ballads don't match at
// this scale. Counts come from `llms_unplugged tsv` over that excerpt, with
// cumulative thresholds rounded onto a single d6 (strictly increasing, last
// pinned to 6, so every option stays reachable; worst-case distortion is a
// 1-in-9 option widened to 1-in-6). The excerpt itself is deliberately NOT
// reproduced on the poster and its corpus file stays untracked (data/* is
// gitignored) --- the poster prints only derived statistics, consistent with
// the fair-use stance in cli/book.typ's copyright page.
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

#let is-punct(word) = word in (".", ",", "!")

#let headword(word, size: 1.4em) = {
  if is-punct(word) {
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
  let word-display = if is-punct(word) { punct-box(word) } else { text(word) }
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
// The complete bigram model of the training excerpt (see header comment).
// Thresholds are cumulative counts rounded onto 6 (options in the CLI's
// alphabetical order). Single-option entries carry no threshold: no roll
// needed. Regenerate with `llms_unplugged tsv` if the excerpt changes.

#let model = (
  ("!", ((1, "And"), (5, "Sit"), (6, "too"))),
  (",", ((2, "cold"), (3, "How"), (4, "we"), (6, "wet"))),
  (".", ((1, "And"), (2, "I"), (3, "it"), (4, "not"), (5, "So"), (6, "we"))),
  ("all", ((2, "."), (4, "that"), (6, "we"))),
  ("And", ((2, "I"), (4, "too"), (6, "we"))),
  ("at", ((none, "all"),)),
  ("ball", ((none, "."),)),
  ("bit", ((none, "."),)),
  ("cold", ((4, ","), (6, "to"))),
  ("could", ((none, "do"),)),
  ("day", ((none, "."),)),
  ("did", ((4, "not"), (6, "nothing"))),
  ("do", ((3, "!"), (6, "was"))),
  ("go", ((none, "out"),)),
  ("had", ((none, "something"),)),
  ("house", ((3, "."), (6, "all"))),
  ("How", ((none, "I"),)),
  ("I", ((2, "said"), (4, "sat"), (6, "wish"))),
  ("in", ((none, "the"),)),
  ("it", ((3, "."), (6, "was"))),
  ("like", ((none, "it"),)),
  ("little", ((none, "bit"),)),
  ("not", ((2, "like"), (4, "one"), (6, "shine"))),
  ("nothing", ((none, "at"),)),
  ("one", ((none, "little"),)),
  ("out", ((none, "And"),)),
  ("play", ((3, "."), (6, "ball"))),
  ("said", ((none, ","),)),
  ("Sally", ((none, "."),)),
  ("sat", ((3, "in"), (6, "there"))),
  ("shine", ((none, "."),)),
  ("Sit", ((none, "!"),)),
  ("So", ((2, "all"), (6, "we"))),
  ("something", ((none, "to"),)),
  ("sun", ((none, "did"),)),
  ("that", ((none, "cold"),)),
  ("the", ((4, "house"), (6, "sun"))),
  ("there", ((3, ","), (6, "with"))),
  ("to", ((1, "do"), (2, "go"), (5, "play"), (6, "Sit"))),
  ("too", ((2, "cold"), (6, "wet"))),
  ("two", ((none, "."),)),
  ("was", ((3, "to"), (6, "too"))),
  ("we", ((1, "could"), (2, "did"), (3, "had"), (5, "sat"), (6, "two"))),
  ("wet", ((2, "day"), (6, "to"))),
  ("wish", ((none, "we"),)),
  ("with", ((none, "Sally"),)),
)

// ---------------------------------------------------------------------------

#show: doc => anu(
  title: "LLMs Unplugged",
  paper: "a3",
  footer_text: text(
    font: "Monaspace Argon",
    weight: "bold",
    fill: anu-colors.socy-yellow,
    "www.llmsunplugged.org | © 2026 Ben Swift",
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
#show heading: set block(above: 1em, below: 0.6em)

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

    + *choose a starting word*: any bold word on the model page (boxed
      punctuation marks like #punct-box(".") count as words too) and write it
      down
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

    Start by picking #headword("So", size: 1.2em) and writing it down. Then:

    #[
      #set text(size: 0.88em)
      #table(
        columns: (auto, 1.5fr, 1fr),
        align: (left + horizon, left + horizon, left + horizon),
        stroke: none,
        inset: (x: 0.4em, y: 0.32em),
        table.header([_look up_], [_roll the dice_], [_your text so far_]),
        table.hline(stroke: 0.5pt + anu-colors.gold),
        [#headword("So", size: 1.2em)],
        [roll a 4 → first number ≥ 4 is *6*|we],
        [#gen[So we]],

        [#headword("we", size: 1.2em)],
        [roll a 4 → first number ≥ 4 is *5*|sat],
        [#gen[So we sat]],

        [#headword("sat", size: 1.2em)],
        [roll a 5 → first number ≥ 5 is *6*|there],
        [#gen[So we sat there]],

        [#headword("there", size: 1.2em)],
        [roll a 6 → first number ≥ 6 is *6*|with],
        [#gen[So we sat there with]],

        [#headword("with", size: 1.2em)],
        [no #dice-indicator, so no roll: the only option is "Sally"],
        [#gen[So we sat there with Sally]],

        [#headword("Sally", size: 1.2em)],
        [no #dice-indicator, so no roll: the only option is #punct-box(".")],
        [#gen[So we sat there with Sally.]],
      )
    ]

    == What just happened?

    "So we sat there with Sally" appears nowhere in the model's training
    text---the model composed it, by chaining together word-pairs it learned
    during training. This model knows 46 words and was trained on 106 words of
    text; the models behind modern chatbots know hundreds of thousands of
    word-pieces and are trained on trillions of words. But the
    generate-one-word-and-repeat trick is exactly the same.

  ],
  [
    // ------------------------------------------------------------ recto
    #v(0.4cm)

    // The model, typeset like a page from a pre-trained booklet: two
    // dictionary-style columns, one entry per line (long entries wrap with a
    // hanging indent, as in the full-size booklets).
    #block(
      width: 100%,
      stroke: 0.5pt + anu-colors.gold-2,
      inset: (x: 1cm, y: 0.6cm),
    )[
      #set text(font: "Libertinus Serif", size: 9.5pt)
      #set par(hanging-indent: 1.4em)

      #let mid = calc.ceil(model.len() / 2)
      #let column(entries) = for (word, options) in entries {
        format-entry(word, options)
        v(0.25em)
      }
      #grid(
        columns: (1fr, 1fr),
        column-gutter: 1cm,
        column(model.slice(0, mid)), column(model.slice(mid)),
      )
    ]

    #v(0.5em)
    #text(size: 0.9em, fill: anu-colors.grey-2)[
      This is the whole model: every word it knows, and every word the model
      says can follow it. Full-size pre-trained models---whole novels in booklet
      form---are at #text(fill: anu-colors.gold)[www.llmsunplugged.org].
    ]

    #v(0.2em)
    #block[
      #set text(size: 7.5pt, fill: anu-colors.grey-2)
      The training text? The opening lines of a very famous children's book.
      Generate a few sentences, have a guess, then check below.
      #rotate(180deg, reflow: true)[
        #set text(style: "italic")
        It's the first four stanzas of The Cat in the Hat by Dr. Seuss---which
        is why your generated text sounds the way it does.
      ]
    ]
  ],
)
