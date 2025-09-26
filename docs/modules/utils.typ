// Import base template for colors and styling
#import "@local/anu-typst-template:0.1.0": *

// Base module setup (applies styling without image handling)
#let module-card-setup(body) = {
  // Use the ANU template with custom page settings for landscape
  show: doc => anu-template(
    title: "",
    dark: true,
    page_numbering: false,
    page-settings: (
      flipped: true,
      margin: (left: 2.5cm, right: 2.5cm, top: 2.5cm, bottom: 2.5cm),
    ),
    doc,
  )

  body
}

// Function to create title and subtitle
#let module-title(title, subtitle: none) = {
  text(font: "Public Sans", weight: "regular", size: 24pt)[#title]
  if subtitle != none [
    #v(0.5em)
    #text(
      font: "Public Sans",
      weight: "regular",
      size: 16pt,
      style: "italic",
      fill: anu-colors.gold,
    )[#subtitle]
  ]
  v(2em)
}

// Function to place image and constrain first page content
#let first-page-with-image(image-path, content) = {
  // Place the image
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

  // Constrain content width
  let content-width = 29.7cm - 11.9cm - 2.5cm - 1cm
  box(width: content-width)[#content]
}

// Helper function for creating two-column sections
// Usage: #column-section[Your content with #colbreak() calls]
#let column-section(body) = {
  columns(2, gutter: 1em, body)
}

// DEPRECATED: Old module-card function kept for backwards compatibility
// Use module-card-setup, module-title, and first-page-with-image instead
#let module-card(title: none, subtitle: none, image-path: none, body) = {
  import "@local/anu-typst-template:0.1.0": *

  set page(
    flipped: true,
    fill: anu-colors.black,
    margin: (left: 2.5cm, right: 2.5cm, top: 2.5cm, bottom: 2.5cm),
    background: place(
      left,
      dx: 1.9cm,
      rect(
        width: 0.75pt,
        height: 100%,
        fill: anu-colors.gold,
      ),
    ),
  )

  set text(
    font: "Public Sans",
    weight: "light",
    size: 11pt,
    fill: anu-colors.white,
  )

  show heading: it => {
    let weight = if it.level >= 2 { "bold" } else { "semibold" }
    set text(font: "Public Sans", weight: weight)
    let spacing = if it.level == 1 {
      (top: 1.2em, bottom: 0.6em)
    } else if it.level == 2 {
      (top: 1em, bottom: 0.4em)
    } else {
      (top: 0.8em, bottom: 0.3em)
    }
    pad(..spacing, it)
  }

  if image-path != none {
    place(
      top + right,
      dx: 0cm,
      dy: -2.5cm,
      box(
        width: 11.9cm,
        height: 26cm,
        clip: true,
        image(image-path, width: 100%, height: 100%, fit: "cover"),
      ),
    )
  }

  text(font: "Public Sans", weight: "regular", size: 24pt)[#title]
  if subtitle != none [
    #v(0.5em)
    #text(
      font: "Public Sans",
      weight: "regular",
      size: 16pt,
      style: "italic",
      fill: anu-colors.gold,
    )[#subtitle]
  ]

  v(2em)

  if image-path != none {
    let content-width = 29.7cm - 11.9cm - 2.5cm - 1cm
    box(width: content-width)[#body]
  } else {
    body
  }
}

// DEPRECATED: edge-image function kept for backwards compatibility
// Use first-page-with-image instead
#let edge-image(filename, width: 11.9cm, body) = {
  place(
    top + right,
    dx: 2.5cm,
    dy: -2.5cm,
    box(
      width: width,
      height: 26cm,
      clip: true,
      image(filename, width: 100%, height: 100%, fit: "cover"),
    ),
  )

  let content-width = 29.7cm - width - 2.5cm - 1cm
  box(width: content-width)[#body]
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
    rows: (auto, 2.4em),
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
