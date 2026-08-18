// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
//
// Shared token rendering for the cutout-family templates.
//
// Imported by tokenized-cutouts.typ (cut-up tokens spread on a table) and
// tokenized-sheets.typ (pre-shuffled per-participant search sheets). Both show
// the same thing --- a next word paired with the previous words that preceded
// it --- so the palette, the hash that assigns colours, and the box/word
// renderers live here rather than being duplicated and left to drift.
//
// The website compiles these templates in the browser too, so this file is
// copied into website/src/templates/ and mapped into the typst.ts virtual
// filesystem alongside them (scripts/copy-cli-templates.ts).

// Gap between a cutout's previous-word boxes and its next word. In em so it
// tracks whatever text size the importing template sets.
#let inter_word_gap = 0.3em

// The token palette: eight colours, each pinned to an English colour word.
//
// Both templates use it. The word is the point --- "who has _cat_? it's a
// green one" only works if the room agrees on which swatch "green" means ---
// so every entry sits at (or as near as printing allows to) that word's
// centroid in the xkcd colour survey, which is the best evidence there is for
// what a colour word means to English speakers. Six of the eight are the
// centroid exactly; grey and green move ΔE 0.037 and 0.050 to stay printable.
//
// Eight, not more. Colour is a coarse filter that narrows a scan before
// someone reads the token, not an index --- so the useful ceiling is the
// number of words a room can call out without hesitating, and past that
// extra swatches only make two of them look alike. Nine is unavailable
// anyway: the obvious ninth word is orange, and a printable orange lands ΔE
// 0.074--0.102 from red across the profiles below, i.e. you can have orange
// or red but not both. Green/turquoise and magenta/pink block the same way.
//
// Every entry clears 3.5:1 WCAG contrast against white, which (contrast being
// symmetric) is the one number governing both directions the swatches are
// used: a token set as plain coloured text on white paper, and white text on
// a colour-filled box. That in turn is why there is no light/dark adaptation
// here --- every colour is dark, so boxes always carry white text and a
// free-standing word never needs a stroke to prop it up.
//
// Min pairwise OKLab ΔE is 0.151 on screen and 0.102 printed (the worst of
// FOGRA47L uncoated, FOGRA39L coated and SNAP newsprint), against the 0.10
// this file treats as clearly distinct. The printed figure is the one that
// matters and it cannot be computed from the screen one: sRGB's vivid blues,
// greens and purples fall outside CMYK, so the press compresses them toward
// the gamut boundary and the gaps shrink. Regenerate both steps together ---
// the second is not optional, because the first cannot see the press:
//   node cli/scripts/generate_palette.ts --nameable --n 8 \
//     --min-white-contrast 3.5 --dump-candidates > /tmp/candidates.csv
//   cli/scripts/check_palette_print.py /tmp/candidates.csv --n 8
//
// `mult`/`salt` are the hash that assigns words to colours, brute-forced over
// (prime <= 1000, salt < 1000003) to spread the top-30 English tokens across
// the eight buckets, tie-broken on keeping ".", ",", "?" and "!" apart. They
// travel with the palette because the colour count is the modulus. The naïve
// multiplier 31 (Java's String.hashCode constant) is a trap at some counts:
// 31 mod 30 = 1 collapses a mod-30 hash into a near-sum of codepoints.
// Regenerate with: node cli/scripts/find_palette_salt.ts --palette-len 8
#let palette = (
  mult: 7,
  salt: 14564,
  // All 8 buckets filled by the 8 most frequent tokens, all four punctuation
  // marks distinct, first collision only at the 9th --- the best an 8-bucket
  // hash can do.
  colors: (
    // Neutrals
    (color: luma(0), name: "black"),
    (color: oklch(62.9%, 0.008, 145deg), name: "grey"),

    // Chromatic (sorted by hue)
    (color: oklch(57.9%, 0.238, 29deg), name: "red"),
    (color: oklch(38.6%, 0.089, 62deg), name: "brown"),
    (color: oklch(61.0%, 0.205, 142deg), name: "green"),
    (color: oklch(47.2%, 0.241, 263deg), name: "blue"),
    (color: oklch(45.2%, 0.195, 316deg), name: "purple"),
    (color: oklch(53.4%, 0.221, 353deg), name: "magenta"),
  ),
)

// Brand gold, matches the tool-trigger word foreground and the favicon dots.
#let brand-gold = rgb("#d4a017")

// The project typeface, as used on the website. Everything that is the
// project talking --- instructions, footers, the word mark --- is set in it.
// The tokens themselves stay Libertinus Serif: they are the thing being read
// closely, at a glance, in colour, and a serif at 19pt does that better than
// any UI sans. So the two faces divide by role, not by page.
#let brand-font = "Public Sans"

// The token typeface, pinned by the renderers below rather than inherited
// from the surrounding page. Both templates set it as the document font and
// then switch to `brand-font` for their instructions page, which used to take
// the worked example and the inline pair chips with it: the tokens quoted in
// the brief were set in a face nothing else in the deal uses, so they did not
// look like the pairs they were explaining. Pinning it here is what makes the
// comments in both templates true --- a token renders the same wherever it is
// placed, and the two faces divide by role rather than by page.
#let token-font = ("Libertinus Serif", "Noto Serif CJK SC")

// The brand mark, as a horizontal lockup of the 4x4 bit grid and the title
// (see the "Designing the LLMs Unplugged brand mark" news post). Generated by
// website/scripts/generate-logo-svgs.ts into website/public/; the
// lockup-light*.svg files here are symlinks to those (like socy-logo-bw.svg),
// so regenerating updates the templates automatically.
//
// The "light" variant is the one for paper: its title paths are dark
// (#1a1a1a) for light surfaces, where the default variant's are not. The
// wordmark is baked to outlines, so this renders identically whether or not
// Public Sans is installed --- which matters for the in-browser compiler,
// where a missing face fails silently.
#let brand-lockup(width: 32mm) = image("lockup-light.svg", width: width)

// A tool-trigger word: black highlight with bold uppercase gold text. Used
// for tokens flagged `is_tool: true` so a trigger like VOTE stays visually
// unambiguous even when the corpus contains the same string as a regular word.
// Uses `highlight` rather than `box` so the baseline aligns with surrounding
// inline text.
#let tool-trigger-word(name, dimmed: false) = {
  let bg = if dimmed { luma(220) } else { black }
  let fg = if dimmed { luma(140) } else { brand-gold }
  highlight(
    fill: bg,
    stroke: (paint: fg, thickness: 1pt),
    extent: 0.1em,
    radius: 2pt,
    text(font: token-font, fill: fg, weight: "bold", upper(name)),
  )
}

// Build the token renderers against a palette. Returns a dictionary the
// importing template destructures, e.g.
//   #let (render-cutout, coloured-word, ..) = renderers()
// A factory rather than plain top-level functions because the palette has to
// reach `entry-for` at the bottom of the call chain, and threading a `palette:`
// argument through every renderer and every call site would put it in the way
// of the thing each call is actually saying.
#let renderers(palette: palette) = {
  // Hash a word to a palette entry: callers unpack `.color` for the swatch and
  // `.name` for the word that calls it out. Hashing (rather than assigning in
  // order) is what
  // makes the same word take the same colour wherever it appears, in a
  // previous-word box or as a free-standing next word. The CLI canonicalises
  // casing per corpus before emitting the JSON, so the same word always
  // arrives here as the same string — no need to case-fold again.
  let entry-for(t) = {
    let h = palette.salt
    for c in t.codepoints() {
      h = calc.rem(h * palette.mult + str.to-unicode(c), 1000003)
    }
    palette.colors.at(calc.rem(h, palette.colors.len()))
  }

  // The box treatment itself, given a palette entry and the content to set in
  // it: the entry's colour as fill with white text, which every palette entry
  // is dark enough to carry. When `dimmed` is true (discarded source token)
  // the box is grey with white text — the poor contrast is intentional
  // fade-out. Uses `highlight` rather than `box` so the box's baseline aligns
  // with the surrounding free-standing word.
  //
  // Split out from `previous-word-box` because the sheets' colour key boxes a
  // colour's *name* in that colour, which is the same swatch with the hash
  // step skipped — a name has no reason to hash to the colour it names.
  let word-box(entry, body, dimmed: false) = {
    let fill = if dimmed { luma(180) } else { entry.color }
    highlight(
      fill: fill,
      extent: 0.1em,
      radius: 2pt,
      text(font: token-font, fill: white, weight: "bold", body),
    )
  }

  // A coloured box for a previous word, in the colour that word hashes to.
  let previous-word-box(t, dimmed: false) = word-box(
    entry-for(t),
    t,
    dimmed: dimmed,
  )

  // A free-standing word in its assigned colour. Bold, matching the weight of
  // the previous-word boxes it sits beside: as plain text it is the only mark
  // on the page carrying no fill behind it, and at regular weight it reads as
  // an afterthought rather than as the answer. The deck theme's
  // `.cutout-next-word` does the same for the same reason. Every palette
  // entry clears 3.5:1 against white, so the colour is set flat — nothing
  // needs an outline to hold it up. Dimmed words are mid-grey.
  let coloured-word(t, dimmed: false) = {
    let entry = entry-for(t)
    let fill = if dimmed { luma(160) } else { entry.color }
    text(font: token-font, fill: fill, weight: "bold", t)
  }

  // Pick the right renderer for a token's next-word slot. Tool-trigger tokens
  // get a trailing period (in normal next-token styling) on the same cutout,
  // so the agentic loop "call tool, write its response, close with a period"
  // reads as one physical piece of paper rather than two coordinated cutouts.
  let next-word(token, dimmed: false) = if token.at(
    "is_tool",
    default: false,
  ) {
    (
      tool-trigger-word(token.text, dimmed: dimmed)
        + h(inter_word_gap)
        + coloured-word(".", dimmed: dimmed)
    )
  } else {
    coloured-word(token.text, dimmed: dimmed)
  }

  // Render a cutout's previous-word boxes followed by its next word, inline.
  let render-cutout(token, dimmed: false) = {
    // `previous_words` is omitted from the JSON when empty (the leading tokens
    // of a text have no context), so read it defensively --- such a token
    // renders as its next word alone.
    let prev_words = token.at("previous_words", default: ())
    let parts = prev_words.map(t => previous-word-box(
      t,
      dimmed: dimmed,
    ))
    parts.push(next-word(token, dimmed: dimmed))
    parts.join(h(inter_word_gap))
  }

  (
    entry-for: entry-for,
    word-box: word-box,
    previous-word-box: previous-word-box,
    coloured-word: coloured-word,
    next-word: next-word,
    render-cutout: render-cutout,
  )
}

// Derive n from the first token that has previous words recorded. Both
// templates need it to phrase their instructions ("the last word" vs "the
// last 2 words"), and neither is told n directly.
#let derive-n(tokens) = {
  let found = tokens.find(t => (
    "previous_words" in t and t.previous_words.len() > 0
  ))
  if found != none { found.previous_words.len() + 1 } else { 2 }
}
