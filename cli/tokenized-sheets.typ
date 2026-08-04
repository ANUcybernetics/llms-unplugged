// Per-participant search sheets for the no-cutting variant of the cutouts
// lesson.
//
// Instead of cutting a corpus into pieces and spreading them on a table, the
// CLI shuffles the cutouts and deals them round-robin into one sheet per
// participant. Everyone keeps their own sheet, finds the entries matching the
// context that was just called out, and reads out the next word. The room as a
// whole holds the corpus statistics, so the number of hands that go up for a
// given word is that word's count in the text.
//
// The shuffle is what makes this work: in corpus order an uncut page is just
// the source text with boxes drawn around it.

#import "cutout-common.typ": (
  brand-gold, coloured-word, derive-n, previous-word-box, render-cutout,
)

// Get configuration from sys.inputs
#let paper_size = sys.inputs.at("paper_size", default: "a4")
#let json_path = sys.inputs.at("json_path", default: "sheets.json")
#let font_size = eval(sys.inputs.at("font_size", default: "13pt"))
#let columns_per_sheet = int(sys.inputs.at("columns", default: "4"))

#set text(font: ("Libertinus Serif", "Noto Serif CJK SC"), size: 11pt)
#set page(paper: paper_size, margin: (x: 12mm, y: 14mm))

#let json_data = json(json_path)
#let sheets = json_data.sheets
#let doc_metadata = json_data.metadata

#let all_tokens = sheets.flatten()
#let n = derive-n(all_tokens)
#let previous-words-count = n - 1
#let previous-words-noun = if previous-words-count == 1 { "word" } else {
  "words"
}
// Phrase like "word" / "2 words", so the prose reads correctly for any n.
#let prev-words-phrase = if previous-words-count > 1 [#str(
    previous-words-count,
  ) #previous-words-noun] else [#previous-words-noun]

#let muted = rgb("#666")

// ===== Instructions page (teacher-facing, printed once) =====

// Build a genuine three-step chain out of the dealt entries, recording which
// sheet each answer came from. Every context in the corpus is on somebody's
// sheet, so the walk always finds a continuation until it reaches the tail of
// the text. Returns an array of `(sheet: <1-based>, token: <token>)`.
#let chain-example(sheets, steps: 3) = {
  // context string -> the entries that can answer it, with their sheet number
  let index = (:)
  for (i, sheet) in sheets.enumerate() {
    for t in sheet {
      let key = t.previous_words.join(" ")
      index.insert(
        key,
        index.at(key, default: ()) + ((sheet: i + 1, token: t),),
      )
    }
  }

  // Prefer entries made only of alphabetic words: a chain that runs through a
  // free-standing "." reads strangely in the worked example.
  let clean = e => (
    e.token.text.find(regex("[A-Za-z]")) != none
      and e.token.previous_words.all(p => p.find(regex("[A-Za-z]")) != none)
  )
  // Prefer an answer from a sheet other than the one that just answered:
  // every sheet holds some continuation of a common context, so taking the
  // first match every time would walk the whole example through sheet 1 and
  // hide the point that the model is spread across the room.
  let pick = (candidates, avoid: none) => {
    let preferred = candidates.filter(clean)
    let pool = if preferred.len() > 0 { preferred } else { candidates }
    let elsewhere = pool.filter(e => e.sheet != avoid)
    if elsewhere.len() > 0 { elsewhere.first() } else { pool.first() }
  }

  let first_sheet = sheets.at(0, default: ())
  if first_sheet.len() == 0 { return () }

  let result = (pick(first_sheet.map(t => (sheet: 1, token: t))),)
  let seed = result.first()
  let written = seed.token.previous_words + (seed.token.text,)
  while result.len() < steps {
    let key = written.slice(written.len() - previous-words-count).join(" ")
    let candidates = index.at(key, default: ())
    if candidates.len() == 0 { break }
    let entry = pick(candidates, avoid: result.last().sheet)
    result.push(entry)
    written.push(entry.token.text)
  }
  result
}

// An entry as it appears in the instructions: unboxed, exactly as it appears on
// the sheets. `box` only to keep it from breaking across lines.
#let entry-chip(token) = box(render-cutout(token))

#let instructions-page() = {
  set page(footer: align(
    center,
    text(fill: brand-gold, size: 9pt, "www.llmsunplugged.org"),
  ))
  show heading: set block(above: 1.5em, below: 0.9em)
  set par(justify: false)

  let sheet_sizes = sheets.map(s => s.len())
  let smallest = calc.min(..sheet_sizes)
  let largest = calc.max(..sheet_sizes)
  let per_sheet = if smallest == largest [#smallest] else [
    #smallest#sym.dash.en#largest
  ]

  grid(
    columns: (1fr, auto),
    column-gutter: 1em,
    align: (left + horizon, right + horizon),
    [= Search sheets: how to run the activity],
    image("favicon.svg", width: 1.6cm),
  )

  columns(2, gutter: 1.6em)[
    The pages after this one are #sheets.len() *search sheets*, built from
    #emph(doc_metadata.title) by #doc_metadata.author. Print them one-sided and
    hand out *one sheet per person* --- every sheet is different, and nothing
    needs cutting out.

    Each sheet holds #per_sheet *entries*. An entry is a *next word* paired with
    the *previous #prev-words-phrase* that came immediately before it somewhere
    in the original text.

    #align(center)[
      #block(fill: luma(245), inset: (x: 1em, y: 0.55em), radius: 3pt)[
        #stack(
          dir: ttb,
          spacing: 0.5em,
          align(center)[*Model vitals*],
          grid(
            columns: 3,
            column-gutter: 1.2em,
            row-gutter: (0.1em, 0.7em, 0.1em),
            align: center,
            [*#doc_metadata.total_tokens*],
            [*#doc_metadata.unique_tokens*],
            [*#calc.round(doc_metadata.entropy, digits: 2)*],

            text(size: 8pt, fill: luma(80))[tokens],
            text(size: 8pt, fill: luma(80))[unique tokens],
            text(size: 8pt, fill: luma(80))[bits/token entropy],

            [*#calc.round(doc_metadata.perplexity, digits: 1)*],
            [*#calc.round(doc_metadata.branching_factor, digits: 2)*],
            [],

            text(size: 8pt, fill: luma(80))[perplexity],
            text(size: 8pt, fill: luma(80))[branching factor],
            [],
          ),
        )
      ]
    ]

    == Anatomy of an entry

    // An all-alphabetic entry reads best as the labelled example; a corpus
    // with no such entry (e.g. Chinese) falls back to whatever is first.
    #let alphabetic = all_tokens.find(t => (
      t.text.find(regex("[A-Za-z]")) != none
        and t.previous_words.all(p => p.find(regex("[A-Za-z]")) != none)
    ))
    #let sample = if alphabetic != none { alphabetic } else {
      all_tokens.first()
    }

    #align(center)[
      #stack(
        dir: ttb,
        spacing: 0.5em,
        entry-chip(sample),
        grid(
          columns: 2,
          column-gutter: 1.5em,
          align: (center, center),
          text(size: 9pt, fill: muted, style: "italic")[
            previous #prev-words-phrase
          ],
          text(size: 9pt, fill: muted, style: "italic")[next word],
        ),
      )
    ]

    Every distinct word has its own colour. *Previous* words sit inside a
    coloured box; the free-standing *next word* is plain coloured text. A word
    keeps its colour wherever it appears, so you can scan by colour first and
    check the word second. Two unrelated words occasionally share a colour ---
    always verify the word itself.

    #colbreak()

    == Running a round

    + *Call out the last #prev-words-phrase* of the text so far.
    + Everyone scans their own sheet for entries whose previous
      #prev-words-phrase #if previous-words-count > 1 [match] else [matches].
      *Hands up* --- one hand per matching entry, so somebody holding two copies
      raises two.
    + *Pick a raised hand at random* and ask for that entry's next word.
    + A scribe writes the word on the board. That word becomes part of the
      context for the next round. Repeat.

    Picking at random matters. If you take whoever shouts first you are sampling
    the fastest reader, not the text --- and the whole point is that the room
    samples the way the model does.

    == What to watch for

    *The hands are the probability distribution.* Every entry in the text was
    dealt to exactly one person, so if seven hands go up and five of them hold
    the same next word, that word really does follow this context five times in
    seven. Nobody has to explain weighted sampling; the room performs it.

    *Nobody holds the model.* No single sheet can continue the text on its own.
    The model only exists across the whole room --- and if somebody is away,
    their share of it is missing, and some contexts will draw no hands at all.

    *Running dry.* If no hands go up, you have reached a context that only ever
    occurred at the very end of the text. Start again from any entry.
  ]

  // No pagebreak: the two-column briefing rarely fills a page, so the worked
  // example follows it and the whole teacher-facing brief stays on one sheet
  // of paper. It spills to a second page only for a wordier corpus.
  let chain = chain-example(sheets)
  if chain.len() >= 2 {
    // The running text the board accumulates: the seed entry's context,
    // followed by the next word each entry in the chain contributes.
    let written = (
      chain.first().token.previous_words + chain.map(e => e.token.text)
    )
    let written-so-far(count) = {
      let words = written.slice(0, count)
      align(center, block(
        fill: luma(245),
        inset: (x: 0.7em, y: 0.4em),
        radius: 3pt,
      )[#words.join(" ")])
    }

    let column-label = label => text(
      size: 9pt,
      fill: muted,
      style: "italic",
      label,
    )

    // Unbreakable: the example is only legible read as a whole, so it moves to
    // the next page intact rather than leaving an orphaned row or closing
    // sentence behind.
    block(breakable: false)[
      == Worked example

      #grid(
        columns: (1.1fr, auto, 1fr),
        column-gutter: 1.4em,
        row-gutter: 0.9em,
        align: (col, row) => (
          (if col == 0 { left } else { center })
            + (if row == 0 { bottom } else { horizon })
        ),

        [], column-label[the entry that answers], column-label[on the board],

        ..chain
          .enumerate()
          .map(((i, entry)) => {
            // Before round i the board holds `previous-words-count + i` words;
            // the context called out is the last `previous-words-count` of them,
            // rendered in the same colours the sheets use.
            let called = written
              .slice(i, previous-words-count + i)
              .map(w => coloured-word(w))
              .join(" ")
            let prose = if i == 0 [
              *Start anywhere.* Pick any entry from any sheet --- say this one,
              from sheet #entry.sheet --- and write its previous
              #prev-words-phrase #emph[and] its next word on the board.
            ] else [
              *Round #str(i).* Call out the last #prev-words-phrase on the board
              (#emph(called)). Sheet #entry.sheet holds a matching entry, so
              that person raises a hand and reads out #emph(entry.token.text).
            ]
            (
              prose,
              entry-chip(entry.token),
              written-so-far(previous-words-count + 1 + i),
            )
          })
          .flatten(),
      )

      Keep going for as long as you like. The text the room writes will sound
      like #emph(doc_metadata.title) without ever repeating it --- that is the
      model generating, not the corpus being read out.
    ]
  }

  pagebreak()
}

#instructions-page()

// ===== The participant sheets, one page each =====

#set page(
  header: none,
  footer: align(
    center,
    text(fill: luma(150), size: 8pt, "www.llmsunplugged.org"),
  ),
)
#set text(size: font_size)

// Sheet header: who this belongs to, and the one-line rule, so a participant
// who missed the briefing can still play from the sheet alone.
#let sheet-header(index, sheet) = {
  block(width: 100%, below: 1em)[
    #grid(
      columns: (1fr, auto),
      align: (left + bottom, right + bottom),
      text(size: 15pt, weight: "bold")[
        Sheet #str(index + 1) of #str(sheets.len())
      ],
      text(size: 10pt, fill: muted)[
        #doc_metadata.title --- #sheet.len() entries
      ],
    )
    #v(0.35em)
    #line(length: 100%, stroke: 0.8pt + luma(120))
    #v(0.5em)
    #text(size: 10pt, fill: muted)[
      When the #prev-words-phrase called out #if (
        previous-words-count > 1
      ) [match] else [matches] the boxed #prev-words-phrase of an entry below,
      raise your hand --- one hand per matching entry --- and read out that
      entry's *next word*.
    ]
  ]
}

#for (i, sheet) in sheets.enumerate() {
  if i > 0 { pagebreak(weak: false) }

  // Each sheet is exactly one page tall, split into an auto-height header and
  // a `1fr` body that absorbs whatever height the header leaves. That definite
  // body height is what lets the entry grid's own `1fr` rows stretch, so the
  // rows always reach the bottom margin instead of trailing off partway down a
  // short sheet.
  block(
    width: 100%,
    height: 100%,
    grid(
      rows: (auto, 1fr),
      sheet-header(i, sheet),

      // A regular grid rather than a ragged flow: scanning aligned columns for
      // a colour is much faster than scanning wrapped text, and it makes the
      // sorted variant read as the lookup table it is. Entries sit on the page
      // unboxed --- the colour already delineates them, and a border per entry
      // adds 160-odd rectangles of visual noise to a page meant to be scanned.
      grid(
        columns: (1fr,) * columns_per_sheet,
        rows: (1fr,) * calc.ceil(sheet.len() / columns_per_sheet),
        column-gutter: 1.2em,
        align: left + horizon,
        ..sheet.map(t => render-cutout(t))
      ),
    ),
  )
}
