// Tokenized cutouts for the cutouts lesson variant
// Generates rows of tokens with continuous horizontal lines for easy cutting

// Configuration
#let font_size = 36pt // Master size - change this to scale everything
#let cell_padding_x = 0.35em
#let inter_word_gap = 0.3em
#let border_color = luma(150)
#let cut_line_thickness = 1pt
#let cut_line_spacing = 10pt // Reserved vertical space for horizontal cut lines (preserves layout)
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
#let rows_per_page = 10
#let cutout_h_margin = 5mm
#let cutout_v_margin = (
  (
    210mm - rows_per_page * cell_height - (rows_per_page + 1) * cut_line_spacing
  )
    / 2
)

// Palette of dark, distinguishable hues. White text reads cleanly on each, and
// each colour is also readable as text on a white page. Words are
// hash-assigned to a palette index so that the same word always takes the same
// colour, whether it appears in a previous-word box or as a free-standing
// next word.
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

// Derive n from the first token that has previous words recorded
#let n = {
  let found = tokens.find(t => (
    "previous_words" in t and t.previous_words.len() > 0
  ))
  if found != none { found.previous_words.len() + 1 } else { 2 }
}

#let previous-words-count = n - 1
#let previous-words-noun = if previous-words-count == 1 { "word" } else {
  "words"
}

// A coloured box for a previous word: word's assigned colour as fill, white text.
// When `dimmed` is true (discarded source token) the box is rendered in grey.
// Uses `highlight` rather than `box` so the previous word's baseline aligns with
// the surrounding free-standing word.
#let previous-word-box(t, dimmed: false) = {
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

// A tool-trigger word: black highlight with bold uppercase gold text. Used
// for tokens flagged `is_tool: true` so a trigger like VOTE stays visually
// unambiguous even when the corpus contains the same string as a regular word.
// Uses `highlight` rather than `box` so the baseline aligns with surrounding
// inline text.
#let tool-trigger-word(name, dimmed: false) = {
  let bg = if dimmed { luma(220) } else { black }
  let fg = if dimmed { luma(140) } else { rgb("#d4a017") }
  highlight(
    fill: bg,
    stroke: (paint: fg, thickness: 1pt),
    extent: 0.1em,
    radius: 2pt,
    text(fill: fg, weight: "bold", upper(name)),
  )
}

// Pick the right renderer for a token's next-word slot.
#let next-word(token, dimmed: false) = if token.at("is_tool", default: false) {
  tool-trigger-word(token.text, dimmed: dimmed)
} else {
  coloured-word(token.text, dimmed: dimmed)
}

// Render a cutout's previous-word boxes followed by its next word, all inline.
#let render-cutout(token) = {
  let parts = token.previous_words.map(t => previous-word-box(t))
  parts.push(next-word(token))
  parts.join(h(inter_word_gap))
}

// Brand gold, matches the tool-trigger word foreground and the favicon dots.
#let brand-gold = rgb("#d4a017")

// Wraps a rendered cutout in a thin grey border so the example cutouts in
// the instructions visually read as discrete pieces of paper (one cutout =
// one piece of paper after cutting). Same `border_color` as the cut lines on
// the actual cutout pages for visual consistency.
#let cutout-box(content) = box(
  stroke: cut_line_thickness + border_color,
  radius: 2pt,
  inset: (x: 0.6em, y: 0.6em),
  content,
)

// Instructions page
#let instructions-page() = {
  set text(size: 15pt)
  // Generous space below each heading so headings don't visually crowd the
  // paragraph that follows.
  show heading: set block(above: 1.6em, below: 1.0em)
  // Footer with the project URL in brand gold, on the instructions pages
  // only. The `set page` rule is scoped to this function so cutout pages
  // (rendered after this function returns) have no footer.
  set page(footer: align(
    center,
    text(fill: brand-gold, size: 11pt, "www.llmsunplugged.org"),
  ))

  // Pull three consecutive cutouts to use as a worked example. Skip windows
  // that contain any pure-punctuation tokens, since "I am Sam ." reads
  // strangely when the period is shown as a free-standing token in the
  // running text.
  let example-tokens = {
    let is-clean = t => (
      "previous_words" in t
        and t.previous_words.len() > 0
        and t.keep
        and not t.at("is_tool", default: false)
        and t.text.find(regex("[A-Za-z]")) != none
        and t.previous_words.all(p => p.find(regex("[A-Za-z]")) != none)
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
        "previous_words" in t
          and t.previous_words.len() > 0
          and t.keep
          and not t.at("is_tool", default: false)
      ))
      cands.slice(0, calc.min(3, cands.len()))
    }
  }

  // Phrase like "the last word" / "the last 2 words", with grammatical
  // number kept consistent throughout the worked example. Single-line content
  // blocks avoid stray whitespace when interpolated next to punctuation.
  let prev-words-phrase = if previous-words-count > 1 [#str(
      previous-words-count,
    ) #previous-words-noun] else [#previous-words-noun]

  [
    // Header: title on the left, project logo on the right. The logo only
    // appears on the first page---subsequent pages of the booklet are pure
    // content.
    #grid(
      columns: (1fr, auto),
      column-gutter: 1em,
      align: (left + horizon, right + horizon),
      [= How to use these token cutouts], image("favicon.svg", width: 1.8cm),
    )

    // 2-column flow for the body prose: at 13pt on a landscape A4 page, full
    // width gives ~110 chars per line, well beyond the comfortable 60--80.
    // The model vitals chip and anatomy mini-grid are sized to fit inside one
    // column.
    #columns(2, gutter: 2em)[
      These pages contain the text #emph(doc_metadata.title) by
      #doc_metadata.author. Each *cutout* shows a *next word* paired with the
      *previous #prev-words-phrase* that came immediately before it in the
      original text.

      #align(center)[
        #block(
          fill: luma(245),
          inset: (x: 1em, y: 0.55em),
          radius: 3pt,
        )[
          #stack(
            dir: ttb,
            spacing: 0.5em,
            align(center)[*Model vitals*],
            grid(
              columns: 2,
              column-gutter: 1.6em,
              row-gutter: (0.1em, 0.7em, 0.1em),
              align: center,
              [*#doc_metadata.total_tokens*],
              [*#calc.round(doc_metadata.entropy, digits: 2)*],

              text(size: 9pt, fill: luma(80))[tokens],
              text(size: 9pt, fill: luma(80))[bits/token entropy],

              [*#calc.round(doc_metadata.perplexity, digits: 1)*],
              [*#calc.round(doc_metadata.branching_factor, digits: 2)*],

              text(size: 9pt, fill: luma(80))[perplexity],
              text(size: 9pt, fill: luma(80))[branching factor],
            ),
          )
        ]
      ]

      == Anatomy of a cutout

      #if example-tokens.len() > 0 [
        #align(center)[
          #stack(
            dir: ttb,
            spacing: 0.6em,
            // The example cutout as one piece of paper: previous words and
            // next word together inside a grey border.
            cutout-box(text(
              size: 22pt,
              render-cutout(example-tokens.at(0)),
            )),
            // Labels below: a 2-column grid is centred under the cutout, so
            // the two labels sit roughly under the previous-words and
            // next-word parts of the cutout.
            grid(
              columns: 2,
              column-gutter: 2em,
              align: (center, center),
              text(size: 10pt, fill: rgb("#666"), style: "italic")[
                previous #prev-words-phrase
              ],
              text(size: 10pt, fill: rgb("#666"), style: "italic")[
                next word
              ],
            ),
          )
        ]
      ]

      Every distinct word has its own colour. *Previous* words appear inside a
      coloured box (the word's own colour as the background, with white text);
      the free-standing *next word* appears in plain coloured text. The same
      word always wears the same colour, whether you see it inside a box or
      free-standing. Two unrelated words can occasionally share a colour, so
      always verify the word itself matches---not just the colour.

      // Force a column break here so the entire Anatomy section (heading +
      // mini-grid + colour-rule explanation) stays together in col 1, with
      // Setup + How-to-play in col 2. Without this Typst's natural flow
      // splits the Anatomy section across the column boundary.
      #colbreak()

      == Setup

      *Cut out the tokens* along the dotted lines and *spread them out* face-up
      on the table, with no overlap if possible. This is the "training" step:
      every (previous, next) combination from the original text is now a
      physical cutout sitting on your table.

      == How to play: the matching game

      To generate text, repeatedly find a cutout whose *previous
      #prev-words-phrase* matches the last #prev-words-phrase you've written,
      then *write its next word* onto your page. The word you just wrote becomes
      part of what you'll match against next---that's the chain.
    ]

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
          [#words.slice(0, split).join(" ") #strong(
              words.slice(split).join(" "),
            )]
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

      let big-cutout(t) = cutout-box(text(size: 18pt, render-cutout(t)))

      // Italicised, coloured rendering of the last `previous-words-count`
      // words of `words`---used inline in the Step 2 prose to call out the
      // exact tokens the reader should be matching against.
      let tail-prose(words) = {
        let tail = words.slice(words.len() - previous-words-count)
        emph(tail.map(t => coloured-word(t)).join(" "))
      }

      // 3-column grid: row 0 is column headers (small italic grey labels,
      // matching the Anatomy section); each remaining row is one step. The
      // cutout (col 2) governs row height, so the prose (col 1) can wrap
      // freely without growing the row.
      let column-label = label => text(
        size: 10pt,
        fill: rgb("#666"),
        style: "italic",
        label,
      )
      grid(
        columns: (1.1fr, auto, 1fr),
        column-gutter: 1.5em,
        row-gutter: 1em,
        align: (col, row) => (
          (if col == 0 { left } else { center })
            + (
              if row == 0 { bottom } else { horizon }
            )
        ),

        [], column-label[the cutout], column-label[your page],

        [
          *Step 1.* Pick any cutout to begin---say this one---and copy its
          previous #prev-words-phrase #emph[and] its next word onto your page.
        ],
        big-cutout(t0),
        written-text(t0.previous_words + (t0.text,)),

        [
          *Step 2.* Look at the last #prev-words-phrase you've written
          (#tail-prose(t0.previous_words + (t0.text,))) and find a cutout whose
          previous #prev-words-phrase #if previous-words-count > 1 [match
            them] else [matches it]. Write its next word.
        ],
        big-cutout(t1),
        written-text(t0.previous_words + (t0.text, t1.text), new-count: 1),

        [
          *Step 3.* Repeat: find a cutout whose previous #prev-words-phrase
          #if previous-words-count > 1 [match] else [matches] the last
          #prev-words-phrase you've written, and add its next word.
        ],
        big-cutout(t2),
        written-text(
          t0.previous_words + (t0.text, t1.text, t2.text),
          new-count: 1,
        ),
      )

      [Keep going---write as much or as little as you like.]
    }

    == Tips

    // Three tips, one per column---short bullets in a `columns(2)` block
    // collapse to a single column because the content easily fits there.
    #grid(
      columns: (1fr, 1fr, 1fr),
      column-gutter: 2em,
      align: top + left,
      [
        *Use colour as a fast filter.* Scan by the rightmost previous-word box's
        colour first, then verify the actual word matches.
      ],
      [
        *Pick from many candidates by eye.* The more cutouts share the same
        previous #prev-words-phrase, the more often your eye lands on
        one---that's *weighted sampling* for free, and it's why some words
        follow others more often in your text.
      ],
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
#set page(margin: (
  top: cutout_v_margin,
  bottom: cutout_v_margin,
  x: cutout_h_margin,
))

// Function to render a single token cell (no horizontal borders)
#let token-cell(token, is_last: false, height: auto) = {
  let prev_words = token.at("previous_words", default: ())
  // Dim discarded tokens, and also any token with no previous-words context
  // (i.e. the very first token of the text)---it can't be reached by the
  // matching game, so greying it out signals "not for use".
  let dimmed = not token.keep or prev_words.len() == 0

  let main_word = next-word(token, dimmed: dimmed)

  let content = if prev_words.len() > 0 {
    let parts = prev_words.map(t => previous-word-box(t, dimmed: dimmed))
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

// Split tokens so that tool-trigger cutouts get their own page(s) at the end
// of the booklet. The teacher hands out the normal cutouts during the n-gram
// lesson, and only distributes the tool triggers once the class moves on to
// the agentic tool-use lesson.
#let normal_tokens = tokens.filter(t => not t.at("is_tool", default: false))
#let tool_tokens = tokens.filter(t => t.at("is_tool", default: false))

// Compute the row breakdown for a given max width: greedy left-to-right
// packing of tokens into rows, returning a list of rows where each row is a
// list of `(token: ..., width: ...)` records.
#let compute-rows(token_list, max_width) = {
  let rows = ()
  let current_row = ()
  let current_width = 0pt
  for token in token_list {
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
  // flow the rows naturally across pages. Pagebreaks are not allowed inside
  // `#layout`, so render normal cutouts and tool-trigger cutouts as two
  // separate `#layout` blocks separated by a pagebreak.
  layout(size => {
    let rows = compute-rows(normal_tokens, size.width)
    for row in rows { render-row-front(row) }
    horizontal_cut_line
  })
  if tool_tokens.len() > 0 {
    pagebreak(weak: false)
    layout(size => {
      let rows = compute-rows(tool_tokens, size.width)
      for row in rows { render-row-front(row) }
      horizontal_cut_line
    })
  }
} else {
  // Duplex: manually paginate so each front page is paired with its mirrored
  // back. Pagebreaks are not allowed inside `#layout`, so use `#context` and
  // rely on hard-coded a4-landscape inner dimensions (the only paper size
  // supported in duplex mode for now).
  context {
    let max_width = 297mm - 2 * cutout_h_margin

    // Paginate a row list into front/back page pairs. Each `rows_per_page`
    // chunk produces one front page followed by its mirrored back page, so
    // every group occupies an even number of sheets — meaning tool-trigger
    // cutouts always land on a fresh sheet after the normal cutouts.
    let render-rows-duplex(rows) = {
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

    render-rows-duplex(compute-rows(normal_tokens, max_width))

    if tool_tokens.len() > 0 {
      pagebreak(weak: false)
      render-rows-duplex(compute-rows(tool_tokens, max_width))
    }
  }
}
