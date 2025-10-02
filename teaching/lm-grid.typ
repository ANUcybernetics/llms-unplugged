// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See docs/LICENSE for details.

#let lm_grid(size) = {
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

  let line_style(i) = {
    let weight = if calc.rem(i - 1, 4) == 0 { 1.5pt } else { 0.5pt }
    let color = if calc.rem(i - 1, 4) == 0 { luma(50) } else { luma(100) }
    weight + color
  }

  block(
    width: 420mm,
    height: 297mm,
    {
      // Add logo and text to first cell
      place(
        dx: 0mm,
        dy: 0mm,
        box(
          width: first_cell_width,
          height: first_cell_height,
          fill: black,
          align(center + horizon)[
            #block(
              width: auto,
              align(right)[
                #text(
                  font: "Neon Tubes 2",
                  size: 1.8em,
                  fill: rgb("#e6ff44"),
                )[Cybernetic\ Studio]
              ],
            )
          ],
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

#lm_grid(32)
#lm_grid(32)

// #lm_grid(48)
