// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
//
// Training-data sheet for the sycophancy section of the grid workshop: pairs
// tally this flattery corpus into their existing grid, then regenerate. The
// corpus text is read at compile time from data/sycophancy.txt (the single
// source of truth, also consumed by the CLI), so there is nothing to keep in
// sync here. Requires the project root to be the repo root: the Makefile passes
// `--root ..`.
#import "@local/anu-typst-template:0.3.0": *

#show: anu.with(
  title: none,
  config: (
    theme: sys.inputs.at("anu_theme", default: "light"),
    logos: ("studio",),
    hide: ("anu-logo", "page-numbers"),
  ),
  page-settings: (
    flipped: true,
  ),
)

#v(-3.4em)

#set par(leading: 0.55em, spacing: 1em)
#set text(size: 16pt)

#text(size: 26pt, weight: "bold")[Sycophancy training text]

#v(0.3em)

Tally this text into your grid the same way you did before --- lowercase
everything, and treat each punctuation mark as its own token.

#v(0.5em)

#block(
  fill: luma(245),
  inset: 14pt,
  radius: 6pt,
  width: 100%,
)[
  #set text(size: 14pt)
  #set par(leading: 0.68em)
  // Read the corpus from the source of truth, strip the YAML frontmatter, and
  // flow the sentences into one paragraph.
  #(
    read("/data/sycophancy.txt")
      .replace(regex("(?s)^---.*?---\n"), "")
      .trim()
      .replace("\n", " ")
  )
]
