// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
#import "@local/anu-typst-template:0.2.0": anu

#let blank-lines(n, spacing: 1.2em) = {
  for i in range(n) {
    line(length: 100%, stroke: (paint: gray.lighten(40%), thickness: 0.5pt))
    v(spacing)
  }
}

#show: anu.with(
  title: "",
  config: (
    theme: "light",
    logos: ("studio",),
    hide: ("page-numbers", "title-block"),
  ),
)

#v(3.2cm)

#blank-lines(24)
