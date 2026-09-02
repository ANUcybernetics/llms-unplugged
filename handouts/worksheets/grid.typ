// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.

#let lm-grid(size) = {
  set text(font: "Public Sans", size: 10pt)

  set page(
    "a3",
    flipped: true,
    margin: 0pt,
  )

  let ratio = 4
  let first_cell_width = 420mm / ((size + 1) * (1 / ratio))
  let first_cell_height = 297mm / ((size + 1) * (1 / ratio))
  let cell_width = (420mm - first_cell_width) / size
  let cell_height = (297mm - first_cell_height) / size

  // The grid is filled in by hand, so every line stays --- but only the
  // block rules are meant to be seen from across the room. The minor rules
  // are guides for a pen: enough to keep a mark in its cell, faint enough
  // that the writing on top is what the eye lands on.
  let line_style(i) = {
    if calc.rem(i - 1, 4) == 0 { 0.8pt + luma(60) } else { 0.3pt + luma(175) }
  }

  block(
    width: 420mm,
    height: 297mm,
    {
      // Banding, to keep an eye on the right row across 420mm of grid. It
      // bands every four rows rather than every second, so it lands on the
      // same beat as the block rules instead of setting up a second rhythm
      // against them, and it is a tint rather than a grey: the marks written
      // in the cells are the ink that matters, and the band only has to be
      // just visible.
      for i in range(size) {
        if calc.rem(calc.quo(i, 4), 2) == 1 {
          let y = first_cell_height + cell_height * i
          place(
            dx: 0mm,
            dy: y,
            rect(
              width: 420mm,
              height: cell_height,
              fill: luma(246),
              stroke: none,
            ),
          )
        }
      }

      // Add the LLMs Unplugged word mark to the first cell, and under it the
      // URL: a filled-in grid leaves the room, and this is the only thing on
      // it that says where it came from.
      place(
        dx: 0mm,
        dy: 0mm,
        box(
          width: first_cell_width,
          height: first_cell_height,
          fill: black,
          inset: 4mm,
          align(center + horizon, stack(
            spacing: 2mm,
            image("title-logo.svg", fit: "contain"),
            text(size: 7pt, fill: rgb("#d4a017"), "www.llmsunplugged.org"),
          )),
        ),
      )

      // Vertical lines
      for i in range(size + 2) {
        let x = if i == 0 { 0mm } else if i == 1 { first_cell_width } else {
          first_cell_width + cell_width * (i - 1)
        }
        place(
          dx: x,
          line(
            length: 297mm,
            angle: 90deg,
            stroke: line_style(i),
          ),
        )
      }

      // Horizontal lines
      for i in range(size + 2) {
        let y = if i == 0 { 0mm } else if i == 1 { first_cell_height } else {
          first_cell_height + cell_height * (i - 1)
        }
        place(
          dy: y,
          line(
            length: 420mm,
            stroke: line_style(i),
          ),
        )
      }
    },
  )
}

#lm-grid(32)
#lm-grid(32)

// #lm-grid(48)
