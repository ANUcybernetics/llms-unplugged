// Tally mark function for numeric values
#let tally(n) = {
  if n == 0 { return [] }
  let groups = int(n / 5)
  let remainder = calc.rem(n, 5)
  let marks = ""
  for i in range(groups) {
    marks += "卌 "
  }
  if remainder > 0 {
    for i in range(remainder) {
      marks += "|"
    }
  }
  marks
}

// Custom table function with consistent formatting
// Full-width with equal columns, consistent row height
// Automatically applies tally marks to numeric cells
#let lm-table(headers, data, caption: none, align: auto) = {
  let processed-data = data.map(row => row.map(cell => {
    if type(cell) == int {
      tally(cell)
    } else {
      cell
    }
  }))

  let alignment = if align == auto {
    (col, row) => if row == 0 { center } else { left }
  } else {
    align
  }

  table(
    columns: (1fr,) * headers.len(),
    rows: (auto, 2.5em),
    align: alignment,
    table.header(..headers.map(h => [*#h*])),
    ..processed-data.flatten()
  )
}

// Grid table function for word co-occurrence matrices
// First element of each row is the row header
#let lm-grid(headers, rows) = {
  let processed-rows = rows.map(row => row.map(cell => {
    if type(cell) == int {
      tally(cell)
    } else {
      cell
    }
  }))

  table(
    columns: (1fr,) * headers.len(),
    rows: (auto, 2.5em),
    align: (col, row) => if row == 0 { center } else { left },
    table.header(..headers),
    ..processed-rows.flatten()
  )
}
