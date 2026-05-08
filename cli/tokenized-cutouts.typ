// Tokenized cutouts for the cutouts lesson variant
// Generates rows of tokens with continuous horizontal lines for easy cutting

// Configuration
#let font_size = 36pt // Master size - change this to scale everything
#let cell_padding_x = 0.35em
#let inter_word_gap = 0.3em
#let border_color = luma(150)
#let cut_line_thickness = 0.7pt
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

// Cutout page layout: hardcoded for A4 landscape. Cell height is sized in
// absolute units (so it can be used in compute contexts like the page-margin
// calculation below) and the vertical margin is derived so that exactly
// `rows_per_page` rows fill the page with equal top/bottom whitespace.
#let cell_height = 1.3 * font_size
#let rows_per_page = 11
#let cutout_h_margin = 5mm
#let cutout_v_margin = (
  210mm - rows_per_page * cell_height - (rows_per_page + 1) * cut_line_spacing
) / 2

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
// Duplex mode: pair every cutout page with a mirrored back page (cells reversed
// and right-aligned) so the same cutouts appear on both faces of each sheet.
// Requires "flip on short edge" binding when printed double-sided on a
// landscape page. An extra blank page is inserted after the instructions so
// the first cutout sheet is self-contained.
#let duplex = sys.inputs.at("duplex", default: "false") == "true"

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

  // Pull three consecutive cutouts to use as a worked example. Skip windows
  // that contain any pure-punctuation tokens, since "I am Sam ." reads
  // strangely when the period is shown as a free-standing token in the
  // running text.
  let example-tokens = {
    let is-clean = (t) => (
      "prefix" in t
        and t.prefix.len() > 0
        and t.keep
        and t.text.find(regex("[A-Za-z]")) != none
        and t.prefix.all(p => p.find(regex("[A-Za-z]")) != none)
    )
    let result = ()
    let i = 0
    while i + 2 < tokens.len() and result.len() == 0 {
      let a = tokens.at(i)
      let b = tokens.at(i + 1)
      let c = tokens.at(i + 2)
      if is-clean(a) and is-clean(b) and is-clean(c) {
        result = (a, b, c)
      }
      i += 1
    }
    if result.len() > 0 {
      result
    } else {
      let cands = tokens.filter(t => (
        "prefix" in t and t.prefix.len() > 0 and t.keep
      ))
      cands.slice(0, calc.min(3, cands.len()))
    }
  }

  // Phrase like "the last token" / "the last 2 tokens", with grammatical
  // number kept consistent throughout the worked example. Single-line content
  // blocks avoid stray whitespace when interpolated next to punctuation.
  let last-prefix = if prefix-length > 1 [#str(prefix-length) #prefix-noun] else [#prefix-noun]

  [
    = How to use these token cutouts

    These pages contain the text #emph(doc_metadata.title) by
    #doc_metadata.author (#doc_metadata.total_tokens tokens, entropy
    #calc.round(doc_metadata.entropy, digits: 2) bits/token, perplexity
    #calc.round(doc_metadata.perplexity, digits: 1)). Each *cutout* is a
    *token* preceded by its *prefix*---the #last-prefix that came
    immediately before it in the original text.

    == Anatomy of a cutout

    #if example-tokens.len() > 0 [
      #align(center)[
        #grid(
          columns: 2,
          column-gutter: 2.5em,
          row-gutter: 0.9em,
          align: (center, center),
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
          text(size: 10pt, fill: rgb("#666"), style: "italic")[
            prefix (#str(prefix-length) #prefix-noun)
          ],
          text(size: 10pt, fill: rgb("#666"), style: "italic")[
            token (the next word that followed)
          ],
        )
      ]
    ]

    Every distinct token has its own colour. *Prefix* words appear inside a
    coloured box (the prefix word's own colour as the background, with white
    text); the free-standing *token* appears in plain coloured text. The
    same word always wears the same colour, whether you see it inside a box
    or as a token. Two unrelated tokens can occasionally share a colour, so
    always verify the word itself matches---not just the colour.

    == Setup

    *Cut out the tokens* along the dotted lines and *spread them out* face-up
    on the table, with no overlap if possible. This is the "training" step:
    every prefix-token combination from the original text is now a physical
    cutout sitting on your table.

    == How to play: the matching game

    To generate text, repeatedly find a cutout whose *prefix* matches the
    last #last-prefix you've written, then *write its token* onto your page.
    The token you just wrote becomes part of the prefix you'll match against
    next---that's the chain.

    #pagebreak()

    == Worked example

    #if example-tokens.len() >= 3 {
      let t0 = example-tokens.at(0)
      let t1 = example-tokens.at(1)
      let t2 = example-tokens.at(2)

      let written-text(words, new-count: 0) = {
        let split = words.len() - new-count
        let body = if new-count == 0 {
          words.join(" ")
        } else if split == 0 {
          strong(words.join(" "))
        } else {
          [#words.slice(0, split).join(" ") #strong(words.slice(split).join(" "))]
        }
        align(
          center,
          block(
            fill: luma(245),
            inset: (x: 0.7em, y: 0.4em),
            radius: 3pt,
          )[#body],
        )
      }

      let big-cutout(t) = align(center, {
        set text(size: 18pt)
        render-cutout(t)
      })

      // Italicised, coloured rendering of the last `prefix-length` words of
      // `words`---used inline in the Step 2 and Step 3 prose to call out the
      // exact tokens the reader should be matching against.
      let tail-prose(words) = {
        let tail = words.slice(words.len() - prefix-length)
        emph(tail.map(t => coloured-word(t)).join(" "))
      }

      [*Step 1.* Pick any cutout to begin---say this one:]
      big-cutout(t0)
      [Copy its prefix #emph[and] its token onto your page. Your text so far:]
      written-text(t0.prefix + (t0.text,))

      [
        *Step 2.* Look at the last #last-prefix you've written (in this case
        #tail-prose(t0.prefix + (t0.text,))) and find a cutout whose prefix
        matches#if prefix-length > 1 [ them] else [ it], like this one:
      ]
      big-cutout(t1)
      [Write its token onto your page. Your text now reads:]
      written-text(t0.prefix + (t0.text, t1.text), new-count: 1)

      [
        *Step 3.* Repeat. The last #last-prefix you've now written
        #if prefix-length > 1 [are] else [is]
        #tail-prose(t0.prefix + (t0.text, t1.text))---find another matching
        cutout:
      ]
      big-cutout(t2)
      [Add its token. Your text now reads:]
      written-text(
        t0.prefix + (t0.text, t1.text, t2.text),
        new-count: 1,
      )

      [Keep going---write as much or as little as you like.]
    }

    == Tips

    #list(
      [
        *Use colour as a fast filter.* Scan by the rightmost prefix box's
        colour first, then verify the actual word matches.
      ],
      [
        *Pick from many candidates by eye.* The more cutouts share a given
        prefix, the more often your eye lands on one---that's *weighted
        sampling* for free, and it's why some words follow others more often
        in your text.
      ],
      ..if n > 2 {
        (
          [
            *Partial matches are OK.* If no cutout matches all your last
            #last-prefix, settle for one where just the rightmost prefix
            token matches.
          ],
        )
      } else { () },
      [
        *Put the cutout back* after using it---removing it would change the
        model's distribution next time round.
      ],
    )
  ]

  pagebreak()
}

#instructions-page()

// Tighten margins for the cutout pages---5mm horizontal is the reliable floor
// for most laser printers; vertical margin is derived above so the rows fill
// the page evenly.
#set page(margin: (top: cutout_v_margin, bottom: cutout_v_margin, x: cutout_h_margin))

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

// Use block layout with manual line breaks to create rows
#set par(leading: 0pt, spacing: 0pt)
#set block(spacing: 0pt)

// Compute the row breakdown for a given max width: greedy left-to-right
// packing of tokens into rows, returning a list of rows where each row is a
// list of `(token: ..., width: ...)` records.
#let compute-rows(max_width) = {
  let rows = ()
  let current_row = ()
  let current_width = 0pt
  for token in tokens {
    let cell = token-cell(token, height: cell_height)
    let cell_size = measure(cell)
    if current_width + cell_size.width > max_width and current_row.len() > 0 {
      rows.push(current_row)
      current_row = ((token: token, width: cell_size.width),)
      current_width = cell_size.width
    } else {
      current_row.push((token: token, width: cell_size.width))
      current_width += cell_size.width
    }
  }
  if current_row.len() > 0 {
    rows.push(current_row)
  }
  rows
}

// Render a single row in front orientation (cells in order, left-aligned).
#let render-row-front(row) = {
  horizontal_cut_line
  box(width: 100%, {
    for (i, item) in row.enumerate() {
      token-cell(item.token, is_last: i == row.len() - 1, height: cell_height)
    }
  })
}

// Render a single row in back orientation (cells reversed, right-aligned).
// Right-aligning the reversed row puts the empty space on the left, so the
// vertical cuts on the back end up at W - x of the front cuts. The cells
// themselves are not mirrored---text reads normally on both sides.
#let render-row-back(row) = {
  let reversed = row.rev()
  horizontal_cut_line
  box(width: 100%, {
    h(1fr)
    for (i, item) in reversed.enumerate() {
      token-cell(
        item.token,
        is_last: i == reversed.len() - 1,
        height: cell_height,
      )
    }
  })
}

#if not duplex {
  // Single-sided: let `#layout` adapt to the actual page width and let Typst
  // flow the rows naturally across pages.
  layout(size => {
    let rows = compute-rows(size.width)
    for row in rows { render-row-front(row) }
    horizontal_cut_line
  })
} else {
  // Duplex: manually paginate so each front page is paired with its mirrored
  // back. Pagebreaks are not allowed inside `#layout`, so use `#context` and
  // rely on hard-coded a4-landscape inner dimensions (the only paper size
  // supported in duplex mode for now).
  context {
    let max_width = 297mm - 2 * cutout_h_margin
    let rows = compute-rows(max_width)

    let groups = ()
    let i = 0
    while i < rows.len() {
      let end = calc.min(i + rows_per_page, rows.len())
      groups.push(rows.slice(i, end))
      i = end
    }

    for (g_idx, group) in groups.enumerate() {
      if g_idx > 0 { pagebreak(weak: false) }
      for row in group { render-row-front(row) }
      horizontal_cut_line
      pagebreak(weak: false)
      for row in group { render-row-back(row) }
      horizontal_cut_line
    }
  }
}
