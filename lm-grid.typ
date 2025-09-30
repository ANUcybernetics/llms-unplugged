#let lm_grid(size) = {
  set text(font: "Public Sans", size: 10pt)

  // A3
  set page(
    width: 420mm,
    height: 297mm,
    margin: 0pt,
  )

  let page_width = 420mm
  let page_height = 297mm
  let ratio = 4

  // Adjust remaining width/height after accounting for double-width first row/column
  let first_cell_width = page_width / ((size + 1) * (1 / ratio))
  let first_cell_height = page_height / ((size + 1) * (1 / ratio))
  let remaining_width = page_width - first_cell_width
  let remaining_height = page_height - first_cell_height
  let cell_width = remaining_width / size
  let cell_height = remaining_height / size

  block(
    width: page_width,
    height: page_height,
    {
      // Add logo and text to first cell
      place(
        dx: 0mm,
        dy: 0mm,
        box(
          width: first_cell_width,
          height: first_cell_height,
          pad(
            top: first_cell_height * 0.1,
            bottom: first_cell_height * 0.1,
            align(center + horizon)[
              #text(size: 1.55em)[My First LM]

              #text(font: "Neon Tubes 2")[Cybernetic Studio]
            ],
          ),
        ),
      )

      // Vertical lines
      for i in range(size + 2) {
        let x = if i == 0 { 0mm } else if i == 1 { first_cell_width } else {
          first_cell_width + cell_width * (i - 1)
        }
        let line_weight = if calc.rem(i - 1, 4) == 0 { 1.5pt } else { 0.5pt }
        let line_color = if calc.rem(i - 1, 4) == 0 { luma(50) } else {
          luma(100)
        }
        place(
          dx: x,
          line(
            length: page_height,
            angle: 90deg,
            stroke: line_weight + line_color,
          ),
        )
      }

      // Horizontal lines
      for i in range(size + 2) {
        let y = if i == 0 { 0mm } else if i == 1 { first_cell_height } else {
          first_cell_height + cell_height * (i - 1)
        }
        let line_weight = if calc.rem(i - 1, 4) == 0 { 1.5pt } else { 0.5pt }
        let line_color = if calc.rem(i - 1, 4) == 0 { luma(50) } else {
          luma(100)
        }
        place(
          dy: y,
          line(
            length: page_width,
            stroke: line_weight + line_color,
          ),
        )
      }
    },
  )
}

#lm_grid(32)

#lm_grid(48)
