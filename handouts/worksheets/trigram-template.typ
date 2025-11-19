// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.

#import "@local/anu-typst-template:0.2.0": *

#show: doc => anu(
  title: "",
  config: (
    theme: "light",
    logos: ("socy", "studio"),
    hide: ("page-numbers", "title-block"),
  ),
  doc,
)

#set text(size: 10pt)

#let trigram-table(rows) = {
  table(
    columns: (1.5fr, 1.5fr, 1.5fr, 1fr),
    rows: (auto, 3em),
    align: (col, row) => if row == 0 { center } else { left },
    table.header([*word 1*], [*word 2*], [*word 3*], [*count*]),
    ..range(rows).map(_ => ([], [], [], [])).flatten(),
  )
}

#v(3cm)

#columns(2, gutter: 1.5em)[
  #trigram-table(19)
  #colbreak()
  #trigram-table(19)
]

#columns(2, gutter: 1.5em)[
  #trigram-table(22)
  #colbreak()
  #trigram-table(22)
]
