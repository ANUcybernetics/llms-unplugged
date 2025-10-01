#import "utils.typ": *
#import "@local/anu-typst-template:0.2.0": anu-colors

// Apply base styling with light theme override
#show: doc => anu(
  title: "",
  config: (
    theme: "light",
    logos: ("studio",),
    hide: ("page-numbers", "title-block"),
  ),
  page-settings: (
    flipped: true,
    margin: (left: 3.2cm, right: 1.5cm, top: 1.5cm, bottom: 1.5cm),
  ),
  doc,
)

#let blank-lines(n, spacing: 1.2em) = {
  for i in range(n) {
    line(length: 100%, stroke: (paint: gray.lighten(40%), thickness: 0.5pt))
    v(spacing)
  }
}

#module-hero(
  "Model name",
  "images/CYBERNETICS_A_042.jpg",
  "",
)[
  #v(2em)
  #blank-lines(1)
  == Purpose
  #blank-lines(4)
  == You will need
  #blank-lines(5)
]

#columns(2, gutter: 1em)[
  == Algorithm
  _(attach extra pages if necessary)_

  #blank-lines(18)

  #colbreak()

  == Example
  _(attach extra pages if necessary)_

  #blank-lines(18)
]
