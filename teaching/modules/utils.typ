// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See teaching/LICENSE for details.

// Import base template for colors and styling
#import "@local/anu-typst-template:0.2.0": *
#import "@local/anu-typst-template:0.2.0": anu-colors

// Base module setup - applies ANU template with landscape settings
#let module-setup(body) = {
  show: doc => anu(
    title: "",
    config: (
      theme: "dark",
      logos: ("studio",),
      hide: ("page-numbers", "title-block"),
    ),
    page-settings: (
      flipped: true,
      margin: (left: 3.2cm, right: 1.5cm, top: 1.5cm, bottom: 1.5cm),
    ),
    doc,
  )

  // Add CC BY-NC 4.0 watermark to every page
  set page(footer: place(
    bottom + left,
    dy: -0.5cm,
    text(
      font: "Neon Tubes 2",
      size: 9pt,
      fill: anu-colors.socy-yellow,
    )[CC BY-NC 4.0],
  ))

  body
}

// Hero image and title layout for module first pages
#let module-hero(title, image-path, module-number, content) = {
  // Place image on right side of first page
  place(
    top + right,
    dx: 2.5cm,
    dy: -2.5cm,
    box(
      width: 11.9cm,
      height: 26cm,
      clip: true,
      image(image-path, width: 100%, height: 100%, fit: "cover"),
    ),
  )

  // Place module number on top of image
  place(
    bottom + right,
    dx: 2cm,
    dy: 2cm,
    text(
      size: 6cm,
      fill: white.transparentize(70%),
      module-number,
    ),
  )

  // Create two-column layout with title and content on left, image on right
  grid(
    columns: (auto, 11.9cm - 2.5cm),
    column-gutter: 1cm,
    [
      #v(4.5cm) // Add vertical space to push title down
      #text(size: 2em, fill: anu-colors.gold)[*#title*]

      #content
    ],
    [],
    // Empty right column where the image is
  )

  pagebreak(weak: true)
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
