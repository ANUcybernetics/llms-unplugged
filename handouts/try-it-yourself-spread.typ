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
// The model is a bigram model of the opening of The Cat in the Hat ("The
// sun did not shine." through "Your mother will not mind at all if I do.",
// i.e. the first 44 body lines) --- Seuss's controlled vocabulary gives a
// small vocab with dense branching (43 of 84 entries offer a dice roll),
// which real prose and even chorus-heavy ballads don't match at this scale.
// Counts come from `llms_unplugged tsv` over that excerpt. Entries with more
// than six next words keep only their six most common (top-k with k = 6,
// the same move real chatbot samplers make --- here that touches only "!",
// "." and "we", dropping six count-1 edges). Cumulative thresholds are then
// rounded onto a single d6 (strictly increasing, last pinned to 6, so every
// kept option stays reachable). The excerpt itself is deliberately NOT
// reproduced on the poster and its corpus file stays untracked (data/* is
// gitignored) --- the poster prints only derived statistics, consistent with
// the fair-use stance in cli/book.typ's copyright page.
//
// Unlike the full-size booklets (d10, multi-dice ♦♦ entries), every entry
// here needs at most one roll of one d6, which keeps the instructions to a
// single rule.

#import "@local/anu-typst-template:0.3.0": anu, anu-colors

// ---------------------------------------------------------------------------
// Booklet typography helpers from cli/booklet-common.typ (compiled with
// --root .. so the cross-directory import resolves). White stroke for the
// dark theme; d6 semantics stay local: a single diamond whenever there is a
// choice.
#import "../cli/booklet-common.typ" as bc

#let punct-box(content, size: 1em) = bc.punct-box(
  content,
  size: size,
  stroke-color: white,
)

#let is-punct(word) = word in (".", ",", "!", "?")

#let headword(word, size: 1.4em) = {
  if is-punct(word) {
    punct-box(word, size: size)
  } else {
    text(word, size: size, weight: "bold")
  }
}

// Single diamond: "roll your dice". Only shown when the entry has a choice.
#let dice-indicator = bc.dice-diamonds(1, fill: anu-colors.gold)

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
  ("!", ((1, "And"), (2, "How"), (3, "I"), (4, "sit"), (5, "the"), (6, "we"))),
  (
    ",",
    ((1, "cold"), (2, "How"), (3, "said"), (4, "we"), (5, "wet"), (6, "Why")),
  ),
  (".", ((1, "A"), (2, "And"), (3, "But"), (4, "I"), (5, "So"), (6, "we"))),
  ("?", ((none, "I"),)),
  ("A", ((none, "lot"),)),
  ("all", ((2, "."), (4, "that"), (6, "we"))),
  (
    "And",
    ((1, "he"), (2, "I"), (3, "the"), (4, "then"), (5, "too"), (6, "we")),
  ),
  ("at", ((none, "all"),)),
  ("ball", ((none, "."),)),
  ("bit", ((none, "."),)),
  ("bump", ((3, "!"), (6, "made"))),
  ("But", ((none, "we"),)),
  ("can", ((none, "have"),)),
  ("cat", ((2, "."), (6, "in"))),
  ("cold", ((4, ","), (6, "to"))),
  ("could", ((3, "do"), (6, "play"))),
  ("day", ((none, "."),)),
  ("did", ((4, "not"), (6, "nothing"))),
  ("do", ((2, "!"), (4, "was"), (6, "you"))),
  ("fun", ((none, "that"),)),
  ("funny", ((none, "!"),)),
  ("games", ((none, "we"),)),
  ("go", ((none, "out"),)),
  ("good", ((2, "fun"), (4, "games"), (6, "tricks"))),
  ("had", ((none, "something"),)),
  ("Hat", ((3, "!"), (6, "."))),
  ("have", ((none, "Lots"),)),
  ("he", ((none, "said"),)),
  ("him", ((3, "!"), (6, "step"))),
  ("house", ((3, "."), (6, "all"))),
  ("How", ((3, "I"), (6, "that"))),
  ("I", ((2, "know"), (3, "said"), (4, "sat"), (5, "will"), (6, "wish"))),
  ("in", ((1, "on"), (6, "the"))),
  ("is", ((2, "funny"), (4, "not"), (6, "wet"))),
  ("it", ((2, "."), (4, "is"), (6, "was"))),
  ("jump", ((none, "!"),)),
  ("know", ((2, "it"), (6, "some"))),
  ("like", ((3, "it"), (6, "that"))),
  ("little", ((none, "bit"),)),
  ("looked", ((none, "!"),)),
  ("lot", ((none, "of"),)),
  ("Lots", ((none, "of"),)),
  ("made", ((none, "us"),)),
  ("mat", ((none, "!"),)),
  ("new", ((none, "tricks"),)),
  ("not", ((2, "like"), (3, "one"), (4, "shine"), (6, "sunny"))),
  ("nothing", ((none, "at"),)),
  ("of", ((none, "good"),)),
  ("on", ((none, "the"),)),
  ("one", ((none, "little"),)),
  ("out", ((none, "And"),)),
  ("play", ((2, ","), (4, "."), (6, "ball"))),
  ("said", ((2, ","), (4, "the"), (6, "to"))),
  ("Sally", ((none, "."),)),
  ("sat", ((3, "in"), (6, "there"))),
  ("saw", ((none, "him"),)),
  ("shine", ((none, "."),)),
  ("show", ((none, "them"),)),
  ("sit", ((5, "!"), (6, "there"))),
  ("So", ((2, "all"), (6, "we"))),
  ("some", ((3, "good"), (6, "new"))),
  ("something", ((3, "to"), (6, "went"))),
  ("step", ((none, "in"),)),
  ("sun", ((3, "did"), (6, "is"))),
  ("sunny", ((none, "."),)),
  ("that", ((2, "?"), (3, "bump"), (4, "cold"), (6, "is"))),
  ("the", ((2, "cat"), (3, "Hat"), (4, "house"), (5, "mat"), (6, "sun"))),
  ("them", ((none, "to"),)),
  ("then", ((3, "something"), (6, "we"))),
  ("there", ((2, ","), (4, "like"), (6, "with"))),
  (
    "to",
    ((1, "do"), (2, "go"), (3, "play"), (4, "sit"), (5, "us"), (6, "you")),
  ),
  ("too", ((2, "cold"), (6, "wet"))),
  ("tricks", ((3, ","), (6, "."))),
  ("two", ((none, "."),)),
  ("us", ((3, ","), (6, "jump"))),
  ("was", ((3, "to"), (6, "too"))),
  (
    "we",
    (
      (1, "can"),
      (2, "could"),
      (3, "did"),
      (4, "looked"),
      (5, "sat"),
      (6, "saw"),
    ),
  ),
  ("went", ((none, "bump"),)),
  ("wet", ((2, "And"), (3, "day"), (6, "to"))),
  ("Why", ((none, "do"),)),
  ("will", ((none, "show"),)),
  ("wish", ((none, "we"),)),
  ("with", ((none, "Sally"),)),
  ("you", ((3, "."), (6, "sit"))),
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
        [roll a 5 → first number ≥ 5 is *5*|sat],
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
    during training. This model knows 84 words and was trained on 223 words of
    text; the models behind modern chatbots know hundreds of thousands of
    word-pieces and are trained on trillions of words. But the
    generate-one-word-and-repeat trick is exactly the same.

  ],
  [
    // ------------------------------------------------------------ recto
    #v(0.2cm)

    // The model, typeset like a page from a pre-trained booklet: three
    // dictionary-style columns, one entry per line (long entries wrap with a
    // hanging indent, as in the full-size booklets).
    #block(
      width: 100%,
      stroke: 0.5pt + anu-colors.gold-2,
      inset: (x: 0.7cm, y: 0.5cm),
    )[
      #set text(font: "Libertinus Serif", size: 8pt)
      #set par(hanging-indent: 1.4em)

      #let third = calc.ceil(model.len() / 3)
      #let column(entries) = for (word, options) in entries {
        format-entry(word, options)
        v(0.15em)
      }
      #grid(
        columns: (1fr, 1fr, 1fr),
        column-gutter: 0.7cm,
        column(model.slice(0, third)),
        column(model.slice(third, 2 * third)),
        column(model.slice(2 * third)),
      )
    ]

    #v(0.4em)
    #text(size: 0.85em, fill: anu-colors.grey-2)[
      This is (almost) the whole model: the three busiest words offer more than
      six next words, so they keep only their six most common---the "top-k"
      trick chatbot samplers use. Full-size models---whole novels in booklet
      form---are at #text(fill: anu-colors.gold)[www.llmsunplugged.org].
    ]

    #v(0.1em)
    #block[
      #set text(size: 7pt, fill: anu-colors.grey-2)
      The training text? The opening lines of a very famous children's book.
      Generate a few sentences, have a guess, then check below.
      #rotate(180deg, reflow: true)[
        #set text(style: "italic")
        It's the opening pages of The Cat in the Hat by Dr. Seuss---the model
        stops right after the Cat promises your mother will not mind.
      ]
    ]
  ],
)
