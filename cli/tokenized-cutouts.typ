// Tokenized cutouts for bucket training
// Generates rows of tokens with continuous horizontal lines for easy cutting

// Configuration
#let font_size = 36pt // Master size - change this to scale everything
#let prefix_size = 0.4em
#let index_size = 0.2em
#let cell_padding_x = 0.3em
#let cell_padding_top = 0.3em
#let cell_padding_bottom = 0.5em // Extra space for descenders
#let border_width = 4pt // Keep absolute for crisp lines
#let border_color = luma(180)

// Get configuration from sys.inputs
#let paper_size = sys.inputs.at("paper_size", default: "a4")
#let json_path = sys.inputs.at("json_path", default: "cutouts.json")

#set text(font: "Libertinus Serif", size: font_size)

#set page(
  paper: paper_size,
  margin: 1cm,
)

// Load the JSON data
#let json_data = json(json_path)
#let tokens = json_data.tokens
#let doc_metadata = json_data.metadata

// Derive n from the first token that has a prefix
#let n = {
  let found = tokens.find(t => "prefix" in t and t.prefix.len() > 0)
  if found != none { found.prefix.len() + 1 } else { 2 }
}

#let prefix-word-count = n - 1
#let prefix-words = if prefix-word-count == 1 { "word" } else { "words" }

// Instructions page
#let instructions-page() = {
  set text(size: 14pt)

  [
    = How to use these token cutouts

    These pages contain the text #emph(doc_metadata.title) by
    #doc_metadata.author. The #text(fill: rgb(180, 0, 0), weight: "bold")[red
      text] above each token shows its prefix---the #str(prefix-word-count)
    #prefix-words before it in the original text.

    == Training: build a bucket model

    + *cut the sheets into individual tokens* along the grey lines (you don't
      have to keep them in order afterwards)

    + get rid of the first token (the greyed-out one), then starting from the
      second token *group the tokens* by the #text(
        fill: rgb(180, 0, 0),
        weight: "bold",
      )[red text] into buckets/containers (or just separate piles on the table)

    + *repeat from step 3* until all tokens are grouped together into buckets

    Your collection of buckets is now a language model.

    == Generation: create new text

    + *choose any piece of paper (from any bucket)* and write down its word (the
      black one, not the red one)---this is the first word of your generated
      text

    + *find the bucket* whose "grouping" red text matches that current word (the
      word you just wrote down)

    + *close your eyes and pick a random token* from inside that bucket

    + *write down* the word on the token, then *put it back* in the same bucket
      you took it from

    + *repeat from step 2* as many times as you want, writing down the words as
      you go

    #v(0.3cm)
    #text(style: "italic")[
      Tip: if a bucket has more copies of the same word, that word is more
      likely to be picked---this is how the model captures probabilities. The
      more text you train on, the richer the model becomes.
    ]

    #v(0.5cm)
    === Model statistics

    - *Total tokens:* #doc_metadata.total_tokens (#doc_metadata.kept_tokens kept)
    - *Entropy:* #calc.round(doc_metadata.entropy, digits: 2) bits/token --- how unpredictable each pick is
    - *Perplexity:* #calc.round(doc_metadata.perplexity, digits: 1) --- effective number of choices per pick
  ]

  pagebreak()
}

#instructions-page()

// Helper to style punctuation in a square rounded-rect box
// The glyph is oversized and raised so the character sits near the vertical centre
#let style-punct(t, fill_color: black, size: 1em) = {
  let is_punct = t == "." or t == ","
  if is_punct {
    let glyph = text(size: size * 2, weight: "bold", fill: white, t)
    let side = measure(text(size: size)[M]).height
    box(
      fill: fill_color,
      radius: side * 0.15,
      width: side,
      height: side,
      clip: true,
      baseline: side * 0.3,
      place(bottom + center, dy: -side * 0.35, glyph),
    )
  } else {
    text(fill: fill_color, t)
  }
}

// Helper to format prefix array as styled text
#let format-prefix(prefix_arr, fill_color: black) = {
  if prefix_arr == none or prefix_arr.len() == 0 {
    none
  } else {
    let styled_parts = prefix_arr.map(t => style-punct(
      t,
      fill_color: fill_color,
      size: prefix_size * 1.4,
    ))
    styled_parts.join([ ])
  }
}

// Function to render a single token cell (no horizontal borders)
// The cell width is the maximum of the main token width and the prefix width
#let token-cell(token, is_last: false, is_first: false, height: auto) = {
  let text_content = if is_first {
    style-punct(token.text, fill_color: luma(160), size: 0.85em)
  } else {
    style-punct(token.text, size: 0.85em)
  }

  // Right border unless last in row
  let right_stroke = if is_last { none } else { border_width + border_color }

  let index_fill = if token.keep { luma(160) } else { luma(200) }

  // Get prefix from token (will be empty array if not present or for first n-1 tokens)
  let prefix_arr = token.at("prefix", default: ())
  let prefix_content = format-prefix(
    prefix_arr,
    fill_color: if token.keep { rgb(180, 0, 0) } else { rgb(220, 140, 140) },
  )

  // Measure main content and prefix to determine cell width
  let main_measured = measure(text_content)
  let prefix_measured = if prefix_content != none {
    measure(text(size: prefix_size)[#prefix_content])
  } else {
    (width: 0pt)
  }

  // Cell width is the max of main content and prefix, plus padding
  let content_width = calc.max(main_measured.width, prefix_measured.width)

  let cell_content = if token.keep {
    // Kept token: black text
    box(
      width: content_width + 2 * cell_padding_x,
      height: height,
      stroke: (left: none, right: right_stroke, top: none, bottom: none),
      inset: (x: cell_padding_x),
      [
        #if prefix_content != none {
          place(top + left, dy: cell_padding_top * 0.3)[
            #text(size: prefix_size, fill: rgb(180, 0, 0))[#prefix_content]
          ]
        }
        #place(bottom + right, dy: -cell_padding_bottom * 0.15)[
          #text(size: index_size, fill: index_fill)[#token.index]
        ]
        #align(horizon)[#v(0.15em)#if is_first { text(fill: luma(160))[#text_content] } else { text_content }]
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
      width: content_width + 2 * cell_padding_x,
      height: height,
      stroke: (left: none, right: right_stroke_dashed, top: none, bottom: none),
      inset: (x: cell_padding_x),
      [
        #if prefix_content != none {
          place(top + left, dy: cell_padding_top * 0.3)[
            #text(size: prefix_size, fill: rgb(220, 140, 140))[#prefix_content]
          ]
        }
        #place(bottom + right, dy: -cell_padding_bottom * 0.15)[
          #text(size: index_size, fill: index_fill)[#token.index]
        ]
        #align(horizon)[#v(0.15em)#text(fill: luma(160))[#text_content]]
      ],
    )
  }

  cell_content
}

// We need to use a table-like approach with full-width rows
// Each row has a top border, and we add a bottom border after the last row

// Height for all cells - must fit tallest content (punctuation at 1.25em + box)
#let cell_height = 1.6em

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
    let cell = token-cell(token, is_first: token.index == 1, height: cell_height)
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
        token-cell(item.token, is_last: i == row.len() - 1, is_first: item.token.index == 1, height: cell_height)
      }
    ]
  }

  // Bottom border after last row
  line(length: 100%, stroke: border_width + border_color)
})
