// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.

// Get configuration from sys.inputs
#let paper_size = sys.inputs.at("paper_size", default: "a4")
#let font_size = sys.inputs.at("font_size", default: "8pt")
#let num_columns = sys.inputs.at("columns", default: "4")
#let subtitle = sys.inputs.at("subtitle", default: none)
#let json_path = sys.inputs.at("json_path", default: "model.json")
#let book_binding = sys.inputs.at("book_binding", default: "false") == "true"

// CJK corpora fall back to Noto Serif CJK SC per-glyph; Libertinus has no Han
// glyphs, so without this a Chinese booklet renders as tofu boxes.
#set text(
  font: ("Libertinus Serif", "Noto Serif CJK SC"),
  size: eval(font_size),
)

// Set page margins once for the entire document
#set page(
  paper: paper_size,
  margin: (
    inside: 2.4cm, // Inner margin (towards binding) - 24mm max as requested
    outside: 1.5cm, // Outer margin (away from binding) - keeps content 10-15mm from edge
    top: 3cm,
    bottom: 2cm,
  ),
)

// Load the JSON data
#let json_data = json(json_path)
#let data = json_data.data
#let doc_metadata = json_data.metadata

// Function to get model type string from n value
#let model-type(n) = {
  if n == 1 {
    "unigram"
  } else if n == 2 {
    "bigram"
  } else if n == 3 {
    "trigram"
  } else {
    str(n) + "-gram"
  }
}

// Set PDF metadata
#set document(
  title: doc_metadata.title,
  author: (doc_metadata.author, "Ben Swift"),
  description: subtitle,
)



// Shared booklet typography (punct tiles, entry formatting). Copied into the
// website's in-browser compiler alongside this file --- see
// scripts/copy-cli-templates.ts.
#import "booklet-common.typ" as bc

// The brand: the gold rule, the project face and the word mark, shared with
// the cutout-family templates so a booklet is recognisably the same project
// as a set of sheets. Copied into the website's compiler alongside this file
// for the same reason booklet-common.typ is.
#import "cutout-common.typ": brand-font, brand-gold, brand-lockup

// Punctuation marks kept as standalone tokens, sourced from the model metadata
// so the boxed marks always match what the CLI treated as punctuation. Falls
// back to the default set for models generated before the field existed.
#let punct-chars = doc_metadata.at("punctuation", default: ".,!?;:").clusters()
#let is-punct(token) = token in punct-chars

// The shared helpers, bound to this model's punctuation set.
#let punct-box(content, size: 1em, weight: "bold") = bc.punct-box(
  content,
  size: size,
  weight: weight,
)

#let display-with-punctuation(
  text-content,
  size: 1.5em,
  weight: "bold",
) = bc.display-with-punctuation(
  text-content,
  size: size,
  weight: weight,
  punct-chars: punct-chars,
)

// Title page function
#let title-page() = {
  // SOCY logo in top-left
  // (this file is a symlink to ../socy-logo-bw.svg so Typst can access it)
  place(top + left)[
    #image("socy-logo-bw.svg", width: 1.8cm)
  ]

  align(center + horizon)[
    #v(2cm)
    #text(
      font: (brand-font, "Noto Sans CJK SC"),
      weight: "bold",
      size: 4em,
    )[#doc_metadata.title]
    #if subtitle != none [
      #v(1cm)
      #text(font: (brand-font, "Noto Sans CJK SC"), size: 2.5em)[#subtitle]
    ]
  ]

  // The word mark, as the mark rather than as its name set in whatever face
  // was to hand.
  place(bottom + right, brand-lockup(width: 42mm))
  pagebreak()
}

// Copyright page
#let copyright-page() = {
  set text(size: 12pt)

  align(horizon)[
    #if subtitle != none [
      #text(size: 1.2em)[#subtitle derived from]
    ]
    #text(size: 1.2em, style: "italic")[#doc_metadata.title]
    by
    #text(size: 1.2em)[#doc_metadata.author]
    #v(0.5cm)

    // datetime.today() honours SOURCE_DATE_EPOCH, so a booklet built under
    // the Makefile's reproducibility pin would read 1970: it builds these
    // with BOOK_DATE_EPOCH instead.
    #text(size: 1em)[© #datetime.today().display("[year]") Ben Swift]
    #v(0.5cm)

    #text(size: 0.9em, style: "italic")[
      This booklet contains statistical word frequencies derived from the source
      text for educational purposes. Where the source text is under copyright,
      the transformation into probability tables for teaching language model
      concepts constitutes fair use. No substantial portion of the original text
      is reproduced.
    ]
    #v(0.5cm)

    #text(size: 0.9em)[
      This work is licensed under a Creative Commons
      Attribution-NonCommercial-ShareAlike 4.0 International License (CC
      BY-NC-SA 4.0).
    ]
    #v(0.5cm)

    // #text(size: 0.9em)[ISBN: 978-0-00000-000-0]
    // #v(0.5cm)
    #text(size: 0.9em)[Published by Cybernetic Studio Press]
    #v(0.5cm)
    #text(size: 0.9em)[First Edition]
    #v(0.5cm)
    #text(size: 0.9em)[
      Text frequency counts from the text #text(
        style: "italic",
      )[#doc_metadata.title] by #text[#doc_metadata.author]#if (
        doc_metadata.url != ""
      ) [, available from\ #link(doc_metadata.url)[#raw(doc_metadata.url)]].
    ]
    #v(0.5cm)
    #text(size: 0.9em)[
      Credits: designed and built by Ben Swift for the Cybernetic Studio.
      Typeset in #link("https://github.com/alerque/libertinus")[Libertinus]
      using #link("https://typst.app")[Typst]. Create your own n-gram model
      booklet using the online tools at #link(
        "https://www.llmsunplugged.org/tools",
      )[`https://www.llmsunplugged.org/tools`]. The source code #if (
        "version" in doc_metadata
      ) [
        (v#raw(doc_metadata.version)) for the tool used to create this model
      ] is available under an MIT Licence from #link(
        "https://github.com/ANUcybernetics/llms-unplugged",
      )[`https://github.com/ANUcybernetics/llms-unplugged`].

    ]
    #v(0.5cm)
    #if "stats" in doc_metadata and doc_metadata.stats != none {
      let stats = doc_metadata.stats
      text(size: 0.9em)[
        #heading(level: 3)[Model statistics]
        - *Total tokens:* #stats.total_tokens
        - *Unique tokens (vocabulary):* #stats.unique_tokens
        - *Unique previous-words contexts:* #stats.unique_contexts
        - *Entropy:* #calc.round(stats.entropy, digits: 2) bits/token --- how
          unpredictable each dice roll is
        - *Perplexity:* #calc.round(stats.perplexity, digits: 1) --- effective
          number of choices per dice roll
      ]
      v(0.5cm)
    }

    #text(size: 0.9em, style: "italic")[
      Disclaimer: this reference contains a statistical language model derived
      from text corpus analysis. The patterns within represent probabilistic
      relationships between words in that text. Any new texts generated by
      sampling from this language model are statistical in nature and may not
      always reflect proper grammar, factual accuracy, or appropriate content.
    ]
  ]
  pagebreak()
}

// Function to format the dice indicator (n diamonds)
// Returns nothing if there's only one next-word option (no dice rolling needed)
#let format-dice-indicator(total_count, num_next_words) = {
  // Only show dice indicator if there are multiple next-word options to choose from
  if num_next_words > 1 and total_count != 10 {
    bc.dice-diamonds(str(total_count).len())
  }
}

// A single next-word option with its count, bound to this model's punctuation
// (used in the running text of the instructions page too).
#let format-next-word(word, count, show-count: true) = bc.format-next-word(
  word,
  count,
  show-count: show-count,
  punct-chars: punct-chars,
)

// Function to format all next-word options for a previous-words context
#let format-next-words(next_words) = bc.format-next-words(
  next_words,
  punct-chars: punct-chars,
)

// Function to format a complete entry (previous words + dice indicator + next words)
#let format-entry(previous_words, total_count, next_words) = {
  // Format the previous-words context
  display-with-punctuation(previous_words, size: 1.5em, weight: "bold")

  // Add dice indicator (only if multiple next-word options)
  h(0.2em)
  format-dice-indicator(total_count, next_words.len())
  h(0.6em)

  // Format the next-word options
  format-next-words(next_words)
}

// Instructions page
#let instructions-page() = {
  set text(size: 12pt)

  [
    = How to use this book

    This book contains a #model-type(doc_metadata.n) language model for
    generating text using only one or more d10 (ten-sided) dice and a pen and
    paper to write down the generated text, according to the following
    algorithm.

    == Algorithm

    To generate new text using the #model-type(doc_metadata.n) model in this
    book:

    + *choose a starting word*---pick any bold word from the book (note that
      punctuation e.g. #punct-box(".") count as words in this model) and write
      it down

    + *look up the word's entry* (i.e. use this book like a dictionary) to find
      all possible _next_ words according to the model

    + *roll your d10s* (if required): check for diamonds next to the word---this
      shows how many d10s to roll (e.g., #display-with-punctuation(
        "the",
      )#h(
        0.2em,
      )#format-dice-indicator(100, 3)#h(0.2em) means roll 3 d10s). If there are
      no diamonds, there's only one possible next word---skip to step 5. Read
      the dice from left to right as a single number (e.g., rolling 2, 1 and 7
      means your roll is 217)

    + *find your next word*: scan through the next-word options until you find
      the first number ≥ your roll, or just use the single word if no dice were
      rolled (write it down)

    + repeat from step 2 using this word as your new word, continuing this loop
      until you reach a natural stopping point (like #punct-box(".")) or reach
      your desired text length

    === Example 1: single d10

    Your current word is *"cat"* and its entry shows:

    #box(inset: (x: 1em))[
      #format-entry(
        "cat",
        10,
        (
          ("sat", 4),
          ("ran", 7),
          ("slept", 10),
        ),
      )
    ]

    - one diamond (♦) means roll 1 d10
    - roll your dice: roll a 6
    - find the next word: first number ≥ 6 is #format-next-word("ran", 7), so
      next word is "ran"
    - write it down, look it up and continue the process

    === Example 2: multiple d10s

    Your current word is *"the"* and its entry shows:

    #box(inset: (x: 1em))[
      #format-entry(
        "the",
        50,
        (
          ("cat", 33),
          ("dog", 66),
          ("end", 99),
        ),
      )
    ]

    - two diamonds (♦♦) means roll 2 d10s
    - roll your dice: roll 5 and 8 → combine them to get 58
    - find the next word: first number ≥ 58 is #format-next-word("dog", 66), so
      next word is "dog"
    - write it down, look it up and continue the process
  ]

  pagebreak()
}

// Generate front matter
#title-page()
#copyright-page()
#instructions-page()
#if book_binding {
  pagebreak()
}

// Main content with original layout
#set page(
  columns: int(num_columns),
  numbering: "1",
  header: context {
    let current-page = here().page()

    // Skip guide words on first few pages (frontmatter)
    if current-page <= 2 {
      return
    }

    // Get all entries to find what's on the current page and previous pages
    let all-entries = query(<previous-words-entry>)

    // Separate entries by page
    let entries-on-current-page = ()
    let last-previous-words-before-page = none

    for entry in all-entries {
      let entry-page = entry.location().page()
      if entry-page == current-page {
        entries-on-current-page.push(entry.value)
      } else if entry-page < current-page {
        // Keep track of the last previous-words context before current page
        last-previous-words-before-page = entry.value
      }
    }

    let guide-text = if entries-on-current-page.len() > 0 {
      // We have entries on this page
      let first = entries-on-current-page.first()
      let last = entries-on-current-page.last()
      if first == last {
        // Single previous-words context on page
        first
      } else {
        // Multiple previous-words contexts on page - show range
        first + " — " + last
      }
    } else if last-previous-words-before-page != none {
      // Continuation page (no new previous-words contexts)
      last-previous-words-before-page
    } else {
      ""
    }

    // Display guide words and horizontal rule
    if guide-text != "" {
      // Position based on odd/even page
      let is-odd = calc.odd(current-page)

      // Create the guide word display (styled like previous-words text)
      let guide-display = display-with-punctuation(
        guide-text,
        size: 1.5em,
        weight: "bold",
      )

      // Position guide words on outer edge
      if is-odd {
        align(right)[#guide-display]
      } else {
        align(left)[#guide-display]
      }

      // The rule under the guide words, in the brand gold that tops every
      // sheet in the ledger and cutout families.
      line(length: 100%, stroke: 0.8pt + brand-gold)
      // Add 1.5em space after the header to push main content down further
      v(1em)
    }
  },
  header-ascent: 10%, // Further reduced to bring header content down more
)

#for (i, item) in data.enumerate() {
  // The first element is the previous-words context
  let previous_words = item.at(0)
  let total_count = item.at(1)
  let next_words = item.slice(2)

  // Labelled metadata lets the page header query the entries for guide words
  [#metadata(previous_words) <previous-words-entry>#format-entry(
      previous_words,
      total_count,
      next_words,
    )]

  v(0.1em)
}
