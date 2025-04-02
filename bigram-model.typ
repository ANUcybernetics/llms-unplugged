#let bigram_grid(csv_path, title: "My First LM") = {
  // Parse the CSV file
  let data = csv(csv_path, row-type: dictionary)

  // Get the vocabulary (unique words)
  let vocabulary = (:)
  let max_index = 0

  for row in data {
    let current_word = row.at("current_word")
    let current_word_index = int(row.at("current_word_index"))

    if current_word_index > max_index {
      max_index = current_word_index
    }

    // Add word to vocabulary if not already there
    vocabulary.insert(str(current_word_index), current_word)

    // Track max index for next words too
    let next_word_index = int(row.at("next_word_index"))
    if next_word_index > max_index {
      max_index = next_word_index
    }
  }

  // Size is max index plus 1 (0-based indices)
  let size = max_index + 1

  // Set fixed cell dimensions
  let cell_width = 10mm
  let cell_height = 10mm
  let first_cell_width = 50mm  // Wider first column for word display
  let first_cell_height = 50mm // Taller first row for rotated words

  // Calculate page dimensions based on fixed cell sizes
  let page_width = first_cell_width + (cell_width * size)
  let page_height = first_cell_height + (cell_height * size)

  // Set the page dimensions
  set page(
    width: page_width,
    height: page_height,
    margin: 0pt
  )

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
            align(center + horizon)[#text(size: 1.55em)[#title]]
          )
        )
      )

      // Draw vertical lines
      for i in range(size + 2) {
        let x = if i == 0 { 0mm }
                else if i == 1 { first_cell_width }
                else { first_cell_width + cell_width * (i - 1) }
                let line_weight = if calc.rem(i - 1, 16) == 0 { 2.5pt }
                                   else if calc.rem(i - 1, 4) == 0 { 1.5pt }
                                   else { 0.5pt }
        let line_color = if calc.rem(i - 1, 4) == 0 { luma(50) } else { luma(100) }
        place(
          dx: x,
          line(
            length: page_height,
            angle: 90deg,
            stroke: line_weight + line_color
          )
        )
      }

      // Draw horizontal lines
      for i in range(size + 2) {
        let y = if i == 0 { 0mm }
                else if i == 1 { first_cell_height }
                else { first_cell_height + cell_height * (i - 1) }
        let line_weight = if calc.rem(i - 1, 4) == 0 { 1.5pt } else { 0.5pt }
        let line_color = if calc.rem(i - 1, 4) == 0 { luma(50) } else { luma(100) }
        place(
          dy: y,
          line(
            length: page_width,
            stroke: line_weight + line_color
          )
        )
      }

      // Draw row and column headers (words)
      for i in range(size) {
        // Check if the key exists in vocabulary before trying to access it
        if str(i) in vocabulary {
          let word = vocabulary.at(str(i))

          // Draw horizontal word labels (row headers)
          place(
            dx: 0mm,
            dy: first_cell_height + cell_height * i,
            box(
              width: first_cell_width,
              height: cell_height,
              align(center + horizon)[#text(size: 20pt)[#word]]
            )
          )

          // Draw vertical word labels (column headers) - rotated 90 degrees
          place(
            dx: first_cell_width + cell_width * i,
            dy: 0mm,
            box(
              width: cell_width,
              height: first_cell_height,
              align(center + horizon)[
                #rotate(90deg)[#text(size: 20pt)[#word]]
              ]
            )
          )
        }
      }

      // Draw counts in cells
      for row in data {
        let current_index = int(row.at("current_word_index"))
        let next_index = int(row.at("next_word_index"))
        let count = int(row.at("count"))

        // Skip zero counts
        if count > 0 {
          // For count = 1, fill is 50% gray (luma 128)
          // For count = 10 and above, fill is black (luma 0)
          // Scale linearly between these values
          let fill_value = int(calc.max(0, 128 - (calc.min(count, 10) - 1) * (128 / 9)))
          let fill_color = luma(fill_value)
          place(
            dx: first_cell_width + cell_width * next_index,
            dy: first_cell_height + cell_height * current_index,
            box(
              width: cell_width,
              height: cell_height,
              fill: fill_color,
              align(center + horizon)[
                #text(
                  fill: white,
                  size: 30pt,
                  weight: "black"
                )[#count]
              ]
            )
          )
        }
      }
    }
  )
}

#let csv_file = sys.inputs.at("data")
#let title = sys.inputs.at("title")
#bigram_grid(csv_file, title: title)
