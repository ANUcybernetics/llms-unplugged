#import "grid.typ": lm_grid

#let bigram_grid(csv_path) = {
  // Parse the CSV file
  let csv_content = read(csv_path)
  let lines = csv_content.split("\n").filter(line => line.trim() != "")
  let headers = lines.at(0).split(",")
  let data = lines.slice(1).map(line => {
    let values = line.split(",")
    let row = (:)
    for (i, header) in headers.enumerate() {
      row.insert(header.trim(), values.at(i).trim())
    }
    return row
  })

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

  // Draw the base grid
  let size = max_index + 1 // +1 because indices are 0-based
  lm_grid(size)

  // Calculate grid dimensions (same calculations as in grid.typ)
  let page_width = 420mm
  let page_height = 297mm
  let ratio = 4

  let first_cell_width = page_width / ((size + 1) * (1/ratio))
  let first_cell_height = page_height / ((size + 1) * (1/ratio))
  let remaining_width = page_width - first_cell_width
  let remaining_height = page_height - first_cell_height
  let cell_width = remaining_width / size
  let cell_height = remaining_height / size

  // Draw row and column headers (words)
  for i in range(size) {
    // Check if the key exists in vocabulary before trying to access it
    if str(i) in vocabulary {
      let word = vocabulary.at(str(i))

      // Draw horizontal word labels (row headers)
      place(
        dx: 5mm,
        dy: first_cell_height + cell_height * i + cell_height/2,
        box(
          width: first_cell_width - 10mm,
          height: cell_height,
          align(center + horizon)[#text(size: 8pt)[#word]]
        )
      )

      // Draw vertical word labels (column headers) - rotated 90 degrees
      place(
        dx: first_cell_width + cell_width * i + cell_width/2,
        dy: 5mm,
        box(
          width: cell_width,
          height: first_cell_height - 10mm,
          align(center + horizon)[
            #rotate(90deg)[#text(size: 8pt)[#word]]
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
      place(
        dx: first_cell_width + cell_width * next_index + cell_width/2,
        dy: first_cell_height + cell_height * current_index + cell_height/2,
        box(
          align(center + horizon)[
            #text(size: 8pt, weight: if count > 5 { "bold" } else { "regular" })[#count]
          ]
        )
      )
    }
  }
}

#bigram_grid("data/onegin.csv")
