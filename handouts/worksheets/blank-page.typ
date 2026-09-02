// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
//
// Ruled paper for writing generated text on, in the project's own furniture
// so it matches the sheets it is handed out beside.
#import "../handout-common.typ": handout

#let blank-lines(n, spacing: 1.35em) = {
  for i in range(n) {
    line(length: 100%, stroke: 0.4pt + luma(190))
    v(spacing)
  }
}

#show: handout.with(title: [Generated text])

#v(0.5cm)

#blank-lines(26)
