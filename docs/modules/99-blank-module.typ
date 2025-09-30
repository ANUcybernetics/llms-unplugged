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

#let module-hero-light(title, image-path, module-number, content) = {
  place(
    top + right,
    dx: 2.5cm,
    dy: -2.5cm,
    box(
      width: 11.9cm,
      height: 26cm,
      clip: true,
      image(image-path, width: 100%, height: 100%, fit: "cover"),
    ),
  )

  place(
    bottom + right,
    dx: 2cm,
    dy: 2cm,
    text(
      size: 6cm,
      fill: black.transparentize(90%),
      module-number,
    ),
  )

  grid(
    columns: (auto, 11.9cm - 2.5cm),
    column-gutter: 1cm,
    [
      #v(4.5cm)
      #text(size: 2em, fill: anu-colors.gold)[*#title*]

      #content
    ],
    [],
  )

  pagebreak(weak: true)
}

#let blank-lines(n, spacing: 1.2em) = {
  for i in range(n) {
    line(length: 100%, stroke: (paint: gray.lighten(40%), thickness: 0.5pt))
    v(spacing)
  }
}

#module-hero-light(
  "Model name:",
  "images/CYBERNETICS_A_042.jpg",
  "",
)[
  == Purpose
  #blank-lines(5)
  == You will need
  #blank-lines(5)
]

#columns(2, gutter: 1em)[
  == Algorithm
  _(attach extra pages if necesasry)_

  #blank-lines(18)

  #colbreak()

  == Example
  _(attach extra pages if necesasry)_

  #blank-lines(18)
]
