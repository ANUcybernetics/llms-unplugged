// Tokenized cutouts for bucket training
// Generates rows of tokens with continuous horizontal lines for easy cutting

// Configuration
#let font_size = 36pt
#let index_size = 8pt
#let cell_padding_x = 6pt
#let cell_padding_top = 6pt
#let cell_padding_bottom = 12pt // Extra space for descenders
#let border_width = 0.5pt
#let border_color = luma(180)

// Get configuration from sys.inputs
#let paper_size = sys.inputs.at("paper_size", default: "a4")
#let json_path = sys.inputs.at("json_path", default: "cutouts.json")

#set text(font: "Libertinus Serif", size: font_size)

#set page(
  paper: paper_size,
  margin: 1.5cm,
)

// Load the JSON data
#let json_data = json(json_path)
#let tokens = json_data.tokens
#let doc_metadata = json_data.metadata

// Function to render a single token cell (no horizontal borders)
#let token-cell(token, is_last: false) = {
  let is_punct = token.text == "." or token.text == ","
  let text_content = if is_punct {
    // Punctuation in a small box to make it more visible
    box(
      rect(
        fill: none,
        stroke: 0.5pt + black,
        radius: 2pt,
        inset: (x: 0.15em, y: 0.05em),
        text(token.text, weight: "bold", baseline: -0.15em),
      ),
    )
  } else {
    text(token.text)
  }

  // Right border unless last in row
  let right_stroke = if is_last { none } else { border_width + border_color }

  let cell_content = if token.keep {
    // Kept token: black text
    box(
      stroke: (left: none, right: right_stroke, top: none, bottom: none),
      inset: (
        x: cell_padding_x,
        top: cell_padding_top,
        bottom: cell_padding_bottom,
      ),
      baseline: 0pt,
      [
        #place(top + right, dx: -2pt, dy: 2pt)[
          #text(size: index_size, fill: luma(160))[#token.index]
        ]
        #text_content
      ],
    )
  } else {
    // Discarded token: greyed out, dashed right border
    let right_stroke_dashed = if is_last {
      none
    } else {
      (paint: border_color, thickness: border_width, dash: "dashed")
    }
    box(
      stroke: (left: none, right: right_stroke_dashed, top: none, bottom: none),
      inset: (
        x: cell_padding_x,
        top: cell_padding_top,
        bottom: cell_padding_bottom,
      ),
      baseline: 0pt,
      [
        #place(top + right, dx: -2pt, dy: 2pt)[
          #text(size: index_size, fill: luma(200))[#token.index]
        ]
        #text(fill: luma(160))[#text_content]
      ],
    )
  }

  cell_content
}

// We need to use a table-like approach with full-width rows
// Each row has a top border, and we add a bottom border after the last row

#let row_height = font_size + cell_padding_top + cell_padding_bottom + 8pt

// Use block layout with manual line breaks to create rows
#set par(leading: 0pt, spacing: 0pt)
#set block(spacing: 0pt)

// Create a layout that flows tokens and adds horizontal rules between lines
#layout(size => {
  let max_width = size.width
  let rows = ()
  let current_row = ()
  let current_width = 0pt

  // Measure and distribute tokens into rows
  for token in tokens {
    let cell = token-cell(token)
    let cell_size = measure(cell)

    if current_width + cell_size.width > max_width and current_row.len() > 0 {
      // Start new row
      rows.push(current_row)
      current_row = ((token: token, width: cell_size.width),)
      current_width = cell_size.width
    } else {
      current_row.push((token: token, width: cell_size.width))
      current_width += cell_size.width
    }
  }

  // Don't forget the last row
  if current_row.len() > 0 {
    rows.push(current_row)
  }

  // Render rows with horizontal lines
  for (row_idx, row) in rows.enumerate() {
    // Top border for this row
    line(length: 100%, stroke: border_width + border_color)

    // Render tokens in this row
    box(width: 100%)[
      #for (i, item) in row.enumerate() {
        token-cell(item.token, is_last: i == row.len() - 1)
      }
    ]
  }

  // Bottom border after last row
  line(length: 100%, stroke: border_width + border_color)
})
