#import "@local/anu-typst-template:0.2.0": *

#show: doc => anu(
  title: "",
  config: (
    theme: "light",
    logos: ("socy", "studio"),
    hide: ("page-numbers", "title-block"),
  ),
  page-settings: (
    paper: "a4",
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

#v(2.5cm)

#columns(2, gutter: 1.5em)[
  #trigram-table(20)
  #colbreak()
  #trigram-table(20)
]

#columns(2, gutter: 1.5em)[
  #trigram-table(22)
  #colbreak()
  #trigram-table(22)
]
