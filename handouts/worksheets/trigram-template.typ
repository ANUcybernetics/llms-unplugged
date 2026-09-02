// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
//
// Tally sheet for a trigram model: two words of context, the word that
// followed, and a count.
#import "../handout-common.typ": brand-gold, handout

#show: handout.with(title: [Trigram tally])

#set text(size: 10pt)

// Rules under the rows and nothing between the columns: the header band
// already says where a column starts, and a hand writing three words across
// needs a line to sit on more than it needs a box to sit in.
#let trigram-table(rows) = table(
  columns: (1.5fr, 1.5fr, 1.5fr, 1fr),
  rows: (auto, 3em),
  stroke: (x, y) => if y > 0 { (bottom: 0.4pt + luma(150)) },
  inset: (x: 0.5em, y: 0.4em),
  fill: (x, y) => if y == 0 { brand-gold },
  align: (col, row) => if row == 0 { center } else { left },
  table.header(
    ..([word 1], [word 2], [word 3], [count]).map(h => text(
      fill: white,
      weight: "bold",
      size: 9pt,
      h,
    )),
  ),
  ..range(rows).map(_ => ([], [], [], [])).flatten(),
)

#v(0.4cm)

#columns(2, gutter: 1.5em)[
  #trigram-table(22)
  #colbreak()
  #trigram-table(22)
]

#pagebreak()

#v(0.4cm)

#columns(2, gutter: 1.5em)[
  #trigram-table(22)
  #colbreak()
  #trigram-table(22)
]
