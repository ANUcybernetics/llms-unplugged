// Tokenized cutouts for the cutouts lesson variant
// Generates rows of tokens with continuous horizontal lines for easy cutting

// Configuration
#let font_size = 36pt // Master size - change this to scale everything
#let cell_padding_x = 0.35em
#let inter_word_gap = 0.3em
#let border_color = luma(180)
#let cut_line_thickness = 0.5pt
#let cut_line_spacing = 4pt // Reserved vertical space for horizontal cut lines (preserves layout)
#let cut_stroke = (
  paint: border_color,
  thickness: cut_line_thickness,
  dash: "dotted",
)
#let horizontal_cut_line = block(
  width: 100%,
  height: cut_line_spacing,
  inset: 0pt,
)[
  #place(left + horizon, line(length: 100%, stroke: cut_stroke))
]

// Palette of dark, distinguishable hues. White text reads cleanly on each, and
// each colour is also readable as text on a white page. Words are
// hash-assigned to a palette index so that the same word always takes the same
// colour, whether it appears in a prefix box or as a free-standing token.
#let palette = (
  rgb("#9c1f1f"), // crimson
  rgb("#2c5d8a"), // steel blue
  rgb("#1f6b3a"), // forest green
  rgb("#3f2a87"), // indigo
  rgb("#a85317"), // burnt orange
  rgb("#216e6e"), // teal
  rgb("#7a2456"), // maroon
  rgb("#6b6118"), // olive
)

#let colour-for(t) = {
  let h = 0
  for c in lower(t).codepoints() {
    h = calc.rem(h * 31 + str.to-unicode(c), 1000003)
  }
  palette.at(calc.rem(h, palette.len()))
}

// Get configuration from sys.inputs
#let paper_size = sys.inputs.at("paper_size", default: "a4")
#let json_path = sys.inputs.at("json_path", default: "cutouts.json")

#set text(font: "Libertinus Serif", size: font_size)

#set page(
  paper: paper_size,
  flipped: true,
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

#let prefix-length = n - 1
#let prefix-noun = if prefix-length == 1 { "token" } else { "tokens" }

// A coloured box for a prefix word: word's assigned colour as fill, white text.
// When `dimmed` is true (discarded source token) the box is rendered in grey.
// Uses `highlight` rather than `box` so the prefix word's baseline aligns with
// the surrounding free-standing word.
#let prefix-box(t, dimmed: false) = {
  let fill = if dimmed { luma(180) } else { colour-for(t) }
  highlight(
    fill: fill,
    extent: 0.1em,
    radius: 2pt,
    text(fill: white, weight: "bold", t),
  )
}

// A free-standing word in its assigned colour (or grey when dimmed).
#let coloured-word(t, dimmed: false) = {
  let fill = if dimmed { luma(160) } else { colour-for(t) }
  text(fill: fill, t)
}

// Render a cutout's prefix boxes followed by its token, all inline.
#let render-cutout(token) = {
  let parts = token.prefix.map(t => prefix-box(t))
  parts.push(coloured-word(token.text))
  parts.join(h(inter_word_gap))
}

// Instructions page
#let instructions-page() = {
  set text(size: 13pt)
  show heading: set block(above: 1.4em, below: 0.7em)

  // Pull the first few tokens with a non-empty prefix as worked examples.
  let example-tokens = {
    let candidates = tokens.filter(t => (
      "prefix" in t and t.prefix.len() > 0 and t.keep
    ))
    candidates.slice(0, calc.min(3, candidates.len()))
  }

  [
    = How to use these token cutouts

    #grid(
      columns: (2fr, 1fr),
      column-gutter: 1.5em,
      align: (left + horizon, center + horizon),
      [
        These pages contain the text #emph(doc_metadata.title) by
        #doc_metadata.author (#doc_metadata.total_tokens tokens, entropy
        #calc.round(doc_metadata.entropy, digits: 2) bits/token, perplexity
        #calc.round(doc_metadata.perplexity, digits: 1)). Each *cutout* shows a
        *token* preceded by its *prefix*---the #str(prefix-length) #prefix-noun
        that came before it in the original text. Every token has its own
        colour: prefix tokens appear inside a #strong[matching coloured box],
        and the free-standing token is rendered in that same colour.
      ],
      if example-tokens.len() > 0 {
        grid(
          columns: 2,
          rows: 2,
          column-gutter: 0.7em,
          row-gutter: 0.8em,
          align: center,
          [
            #set text(size: 26pt)
            #(
              example-tokens
                .at(0)
                .prefix
                .map(t => prefix-box(t))
                .join(h(inter_word_gap))
            )
          ],
          [
            #set text(size: 26pt)
            #coloured-word(example-tokens.at(0).text)
          ],

          text(size: 10pt, fill: rgb("#666"), style: "italic")[prefix],
          text(size: 10pt, fill: rgb("#666"), style: "italic")[token],
        )
      },
    )

    == Setup

    *Cut out the tokens* along the dotted lines and *spread them out* face-up on
    the table, with no overlap if possible. (This is the "training" step---every
    prefix-token combination from your training text is now a physical cutout on
    the table.)

    == Generation: a matching game

    Find a cutout whose prefix matches the token you just wrote, write its
    token, and repeat---like a chain of dominoes:

    #let arrow-sep = box[#h(0.4em)#text(fill: rgb("#999"))[→]#h(0.4em)]
    #if example-tokens.len() >= 2 [
      #align(center)[
        #set text(size: 18pt)
        #example-tokens.map(t => render-cutout(t)).join(arrow-sep)
        #v(0.4em)
        #text(size: 11pt, fill: rgb("#666"), style: "italic")[
          each cutout's token reappears as the next cutout's rightmost prefix
          box---that's the chain
        ]
      ]
    ]

    Each token has its own colour, so a quick colour-scan points you at
    candidates fast---but always verify the actual token matches, because
    colours sometimes repeat across different tokens.

    + *start your text* by copying any cutout's prefix onto your page

    + *find candidates*---scan the spread for cutouts whose prefix matches the
      last #str(prefix-length) #prefix-noun you wrote
      #if n > 2 [
        #v(0.1em)
        #text(style: "italic", size: 0.85em)[
          (scan by the rightmost colour first, then verify the tokens match. If
          no cutouts match all #str(prefix-length) tokens, settle for ones where
          just the rightmost prefix token matches your last token---partial
          matches are fine.)
        ]
      ]

    + *pick one* visually---the more cutouts there are with that prefix, the
      more often your eye will land on them (that's weighted sampling for free)

    + *write down the cutout's token*, then *put the cutout back* in the spread
      (removing it would change the model's distribution next time)

    + *repeat from step 2*

    + *stop* whenever you've written enough text---write as much or as little as
      you like
  ]

  pagebreak()
}

#instructions-page()

// Tighten margins for the cutout pages---5mm is the reliable floor for most
// laser printers and squeezes more cutouts per sheet.
#set page(margin: 5mm)

// Function to render a single token cell (no horizontal borders)
#let token-cell(token, is_last: false, height: auto) = {
  let prefix_arr = token.at("prefix", default: ())
  let dimmed = not token.keep

  let main_word = coloured-word(token.text, dimmed: dimmed)

  let content = if prefix_arr.len() > 0 {
    let parts = prefix_arr.map(t => prefix-box(t, dimmed: dimmed))
    parts.push(main_word)
    parts.join(h(inter_word_gap))
  } else {
    main_word
  }

  let measured = measure(content)
  let right_stroke = if is_last { none } else { cut_stroke }

  box(
    width: measured.width + 2 * cell_padding_x,
    height: height,
    stroke: (left: none, right: right_stroke, top: none, bottom: none),
    inset: (x: cell_padding_x),
    align(horizon + left, content),
  )
}

// We need to use a table-like approach with full-width rows
// Each row has a top border, and we add a bottom border after the last row

// Cell height accommodates a single line of text plus the box outset and the
// bottom-right index. Reduced from the previous 1.6em (which had to fit the
// prefix vertically above the token) since prefix and word are now inline.
#let cell_height = 1.25em

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
    let cell = token-cell(token, height: cell_height)
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
    horizontal_cut_line

    // Render tokens in this row
    box(width: 100%)[
      #for (i, item) in row.enumerate() {
        token-cell(item.token, is_last: i == row.len() - 1, height: cell_height)
      }
    ]
  }

  // Bottom border after last row
  horizontal_cut_line
})
