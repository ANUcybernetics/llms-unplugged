// Copyright (c) 2026 Ben Swift
// Licensed under CC BY-SA 4.0. See handouts/LICENSE for details.
//
// Training text for the grid workshop (My first language model): the opening
// of Green Eggs and Ham, read at compile time from data/green-eggs-and-ham.txt.
// That corpus is untracked (it lives in llms-unplugged-corpora), so this sheet
// builds only in a checkout with the corpora copied in. Requires the project
// root to be the repo root: the Makefile passes `--root ..`.
//
// The first 18 lines run to 28 distinct tokens with punctuation split off and
// "sam-i-am" kept whole, which leaves the 32-word grid a few spare rows.
#import "../handout-common.typ": handout

#let line-count = 18

#show: handout.with(title: [Training text])

#set par(leading: 0.55em, spacing: 1em)
#set text(size: 14pt)

Tally this text into your grid: lowercase everything, and treat each punctuation
mark as its own token. Go as far as you get in the time.

#v(0.4em)

#block(
  fill: luma(245),
  inset: 14pt,
  radius: 6pt,
  width: 100%,
)[
  // The corpus in the token face, as it is set everywhere else the project
  // prints words to be read as data rather than as instructions.
  #set text(font: "Libertinus Serif", size: 19pt)
  #set par(leading: 0.5em, spacing: 0.5em)
  #for line in (
    read("/data/green-eggs-and-ham.txt")
      .replace(regex("(?s)^---.*?---\n"), "")
      .trim()
      .split("\n")
      .slice(0, line-count)
  ) [#line \ ]
]

#align(right, text(size: 11pt)[--- Dr Seuss, _Green Eggs and Ham_ (opening)])
