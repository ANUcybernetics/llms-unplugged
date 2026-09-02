// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
//
// Shared booklet typography: the punctuation "symbol tile" and the word/entry
// formatting used by the printed booklets (book.typ) and the try-it-yourself
// spread (handouts/try-it-yourself-spread.typ). One definition instead of two
// hand-synced forks; per-artefact differences come in as parameters
// (stroke-color for dark-theme artefacts, punct-chars where the model
// metadata supplies the set).
//
// Like cutout-common.typ, this file is deliberately free of package imports
// so scripts/copy-cli-templates.ts can copy it verbatim into the website's
// in-browser compiler.

// Punctuation marks kept as standalone tokens. Callers with model metadata
// (book.typ) pass the metadata's own set instead.
#let default-punct-chars = ".,!?;:".clusters()

// A rounded outline box around a punctuation mark. Every mark gets an
// identical fixed square box with the glyph centred, so ".", ",", "!", "?",
// ";" and ":" all read as the same-sized "symbol tile" regardless of the
// glyph's own width or height. The box scales with `size`, so heading marks
// (1.5em) and next-word marks (1em) stay proportional to their surrounding
// text. `top-edge`/`bottom-edge` of "bounds" tighten the glyph box to its
// actual ink so the mark is optically centred --- otherwise low marks like
// "." and "," sit at the bottom of the box with empty space above.
#let punct-box(content, size: 1em, weight: "bold", stroke-color: black) = {
  set text(
    size: size,
    weight: weight,
    top-edge: "bounds",
    bottom-edge: "bounds",
  )
  box(
    width: 1em,
    height: 1em,
    stroke: 0.5pt + stroke-color,
    radius: 0.12em,
    inset: 0pt,
    align(center + horizon, content),
  )
}

// Display space-separated text with punctuation marks in symbol tiles.
#let display-with-punctuation(
  text-content,
  size: 1.5em,
  weight: "bold",
  stroke-color: black,
  punct-chars: default-punct-chars,
) = {
  let parts = text-content.split(" ")
  for (i, part) in parts.enumerate() {
    if part in punct-chars {
      // Display punctuation in a rounded box
      punct-box(part, size: size, weight: weight, stroke-color: stroke-color)
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

// A run of n Unicode diamonds, the "roll n dice" indicator. Callers own the
// semantics of how many diamonds an entry gets (d10 digit-count in the
// booklets, a single d6 diamond in the spread).
#let dice-diamonds(n, fill: black) = text(
  baseline: -0.1em,
  size: 0.9em,
  fill: fill,
  "♦" * n,
)

// A single next-word option with its count: "3|word" (count semibold), or the
// bare word when no count is shown.
#let format-next-word(
  word,
  count,
  show-count: true,
  stroke-color: black,
  punct-chars: default-punct-chars,
) = {
  let word-display = if word in punct-chars {
    punct-box(word, stroke-color: stroke-color)
  } else {
    text(word)
  }
  if show-count {
    box([#text(weight: "semibold")[#count]|#word-display])
  } else {
    box(word-display)
  }
}

// All next-word options for a previous-words context. Counts are shown only
// when there is a choice.
#let format-next-words(
  next_words,
  stroke-color: black,
  punct-chars: default-punct-chars,
) = {
  for next_word in next_words {
    let word = next_word.at(0)
    let count = next_word.at(1)
    let show-count = next_words.len() > 1

    format-next-word(
      word,
      count,
      show-count: show-count,
      stroke-color: stroke-color,
      punct-chars: punct-chars,
    )
    h(0.5em)
  }
}
