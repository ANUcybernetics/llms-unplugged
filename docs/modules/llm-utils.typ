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
// Automatically applies tally marks to numeric cells
#let lm-table(headers, data, caption: none) = {
  let processed-data = data.map(row =>
    row.map(cell => {
      if type(cell) == int {
        tally(cell)
      } else {
        cell
      }
    })
  )

  figure(
    table(
      columns: headers.len(),
      stroke: 1pt,
      align: (col, row) => if row == 0 { center } else { left },
      table.header(..headers.map(h => [*#h*])),
      ..processed-data.flatten()
    ),
    caption: caption,
    kind: table,
    supplement: none
  )
}