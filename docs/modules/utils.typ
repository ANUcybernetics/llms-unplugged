// Import base template for colors and styling
#import "@local/anu-typst-template:0.1.0": *

// Base module setup - applies ANU template with landscape settings
#let module-setup(body) = {
  show: doc => anu-template(
    title: "",
    dark: true,
    studio_logo: true,
    page_numbering: false,
    page-settings: (
      flipped: true,
      margin: (left: 2.5cm, right: 2.5cm, top: 2.5cm, bottom: 2.5cm),
    ),
    doc,
  )

  body
}

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
    rows: (auto, 2.4em),
    align: alignment,
    table.header(..headers.map(h => [*#h*])),
    ..processed-data.flatten()
  )
}

// Grid table function for word co-occurrence matrices
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
    rows: (auto, 2.4em),
    align: (col, row) => if row == 0 { center } else { left },
    table.header(..headers),
    ..processed-rows.flatten()
  )
}

// Automatically calculate bigram grid from token sequence
#let lm-grid-auto(tokens, nrows: none, ncols: none) = {
  // Get unique tokens for headers and row labels
  let unique = tokens.dedup()

  // Count bigram occurrences
  let counts = (:)
  for i in range(tokens.len() - 1) {
    let key = tokens.at(i) + "->" + tokens.at(i + 1)
    counts.insert(key, counts.at(key, default: 0) + 1)
  }

  // Determine actual dimensions
  let actual-ncols = if ncols != none { ncols } else { unique.len() + 1 }
  let actual-nrows = if nrows != none { nrows } else { unique.len() }

  // Build headers (first empty, then tokens up to ncols limit)
  let headers = ([],)
  for i in range(actual-ncols - 1) {
    if i < unique.len() {
      let token = unique.at(i)
      headers.push(eval("[`" + token + "`]"))
    } else {
      headers.push([])
    }
  }

  // Build rows with counts (truncate or pad as needed)
  let rows = ()
  for row-idx in range(actual-nrows) {
    let row = ()
    if row-idx < unique.len() {
      let from = unique.at(row-idx)
      row.push(eval("[`" + from + "`]")) // row header
      for col-idx in range(actual-ncols - 1) {
        if col-idx < unique.len() {
          let to = unique.at(col-idx)
          let key = from + "->" + to
          let count = counts.at(key, default: 0)
          row.push(if count > 0 { count } else { [] })
        } else {
          row.push([]) // padding
        }
      }
    } else {
      // padding row
      for _ in range(actual-ncols) {
        row.push([])
      }
    }
    rows.push(row)
  }

  // Use existing lm-grid function for display
  lm-grid(headers, rows)
}
