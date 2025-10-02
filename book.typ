// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See docs/LICENSE for details.

// Get configuration from sys.inputs
#let paper_size = sys.inputs.at("paper_size", default: "a4")
#let font_size = sys.inputs.at("font_size", default: "8pt")
#let num_columns = sys.inputs.at("columns", default: "4")
#let subtitle = sys.inputs.at("subtitle")
#let json_path = sys.inputs.at("json_path", default: "model.json")

#set text(font: "Libertinus Serif", size: eval(font_size))

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

// Get the dice size from metadata (defaults to 10 if not present)
#let dice_d = doc_metadata.at("scale_d", default: 10)

// Create a state variable to track the current prefix
#let current_prefix = state("current-prefix", "")

// We'll use doc_metadata to track entries instead of state
// since state.final() might not work properly in headers

// Function to create a punctuation box with consistent styling
#let punct-box(content, baseline: -0.2em) = box(
  rect(
    fill: none,
    stroke: 0.25pt + black,
    radius: 1pt,
    inset: (x: 0.1em, y: 0pt),
    outset: (y: 0pt),
    text(content, weight: "bold", baseline: baseline),
  ),
)

// Function to display text with punctuation in boxes
#let display-with-punctuation(text-content, size: 1.5em, weight: "bold") = {
  let parts = text-content.split(" ")
  for (i, part) in parts.enumerate() {
    if part == "." or part == "," {
      // Display punctuation in a rounded box
      let styled-punct = text(
        part,
        size: size,
        weight: weight,
        baseline: -0.2em,
      )
      box(
        rect(
          fill: none,
          stroke: 0.25pt + black,
          radius: 1pt,
          inset: (x: 0.1em, y: 0pt),
          outset: (y: 0pt),
          styled-punct,
        ),
      )
    } else if part == "—" {
      // Em dash separator
      text(" — ", size: size, weight: weight)
    } else {
      // Regular words
      text(part, size: size, weight: weight)
    }
    // Add space between parts
    if i < parts.len() - 1 and parts.at(i + 1) != "—" and part != "—" {
      h(0.3em)
    }
  }
}

// Title page function
#let title-page() = {
  // SOCY logo in top-left
  place(top + left)[
    #image("socy-logo-bw.svg", width: 1.8cm)
  ]

  align(center + horizon)[
    #v(2cm)
    #text(
      font: "Libertinus Sans",
      weight: "bold",
      size: 4em,
    )[#context doc_metadata.title]
    #v(1cm)
    #text(font: "Libertinus Sans", size: 2.5em)[#subtitle]
  ]

  // Cybernetic Studio wordmark
  place(bottom + right)[
    #text(font: "Neon Tubes 2", size: 18pt)[
      Cybernetic\
      Studio
    ]
  ]
  pagebreak()
}

// Copyright page
#let copyright-page() = {
  set text(size: 12pt)

  align(horizon)[
    #text(size: 1.2em)[#subtitle]
    #text(size: 1.2em, style: "italic")[#context doc_metadata.title by]
    #text(size: 1.2em)[#context doc_metadata.author]
    #v(0.5cm)

    #text(size: 1em)[© 2025 Ben Swift]
    #v(0.5cm)

    #text(size: 0.9em)[
      This work is licensed under a Creative Commons Attribution-NonCommercial
      4.0 International License (CC BY-NC 4.0).
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
      )[#context doc_metadata.title] by #text[#context doc_metadata.author],
      available from\ #link(doc_metadata.url)[#raw(doc_metadata.url)].
    ]
    #v(0.5cm)
    #text(size: 0.9em)[
      Credits: designed and built by Ben Swift for the Cybernetic Studio.
      Typeset in #link("https://github.com/alerque/libertinus")[Libertinus]
      using #link("https://typst.app")[Typst]. The source code for the tool used
      to create this model (rev #context raw(doc_metadata.git_revision)) is
      available under an MIT Licence from #link(
        "https://github.com/ANUcybernetics/my-first-lm",
      )[`https://github.com/ANUcybernetics/my-first-lm`].

    ]
    #v(0.5cm)
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

// Introduction page
#let introduction() = {
  align(left)[
    #heading(level: 1)[Introduction]
    #v(0.5cm)
    This reference contains a statistical #context model-type(doc_metadata.n)
    language model that shows the probabilistic relationships between word
    sequences. Each entry displays a prefix followed by possible continuations
    with their associated probabilities.

    The model can be used for text prediction, generation, and analysis of
    linguistic patterns.

    #v(0.5cm)
    #heading(level: 2)[How to Read This Reference]
    Each entry contains:
    - A bold prefix sequence
    - A diamond symbol (♢) followed by a number indicating the total occurrence
      count (only when not equal to 120)
    - Possible continuations with their occurrence counts
  ]
  pagebreak()
}

// Table of contents
#let table-of-contents() = {
  heading(level: 1)[Contents]
  v(1cm)
  // A simple table of contents would be difficult to generate for all prefixes
  // For a real book, you might want to generate sections based on first letters or similar
  [The following pages contain all #context model-type(doc_metadata.n) sequences
    organized alphabetically by prefix.]
  pagebreak()
}

// Function to format the dice indicator (diamond with number)
#let format-dice-indicator(total_count, dice_d) = {
  // Only show when using 10^k scaling (not the specified dice_d)
  // AND when more than 1 d10 is needed (total_count > 9)
  if total_count != dice_d and total_count > 9 {
    let num-str = str(str(total_count).len())
    // Create a diamond shape with the number inside
    box(
      baseline: -0.3em,
      height: 1em,
      rotate(
        45deg,
        origin: center,
        rect(
          fill: black,
          width: 0.7em,
          height: 0.7em,
          place(
            center + horizon,
            rotate(
              -45deg,
              origin: center,
              text(
                fill: white,
                weight: "bold",
                size: 0.65em,
                num-str,
              ),
            ),
          ),
        ),
      ),
    )
  }
}

// Function to format a single follower with its count
#let format-follower(word, count, show-count: true) = {
  if word == "." or word == "," {
    // Punctuation in a rounded box with optional count
    if show-count {
      box([#text(weight: "semibold")[#count]|#punct-box(word)])
    } else {
      punct-box(word)
    }
  } else {
    // Regular word with optional count
    if show-count {
      box([#text(weight: "semibold")[#count]|#text[#word]])
    } else {
      box([#word])
    }
  }
}

// Function to format all followers for a prefix
#let format-followers(followers) = {
  for follower in followers {
    let word = follower.at(0)
    let count = follower.at(1)
    let show-count = followers.len() > 1

    format-follower(word, count, show-count: show-count)
    h(0.5em)
  }
}

// Function to format a complete entry (prefix + dice indicator + followers)
#let format-entry(prefix, total_count, followers, dice_d: 10) = {
  // Format the prefix
  display-with-punctuation(prefix, size: 1.5em, weight: "bold")

  // Add dice indicator if needed
  let indicator = format-dice-indicator(total_count, dice_d)
  if indicator != none {
    h(0.2em)
    indicator
    h(0.6em)
  } else {
    h(0.6em)
  }

  // Format the followers
  format-followers(followers)
}

// Instructions page
#let instructions-page() = {
  set text(size: 12pt)

  [
    = How to use this book

    This book contains a #context model-type(doc_metadata.n) language model for
    generating text using only one or more d10 (ten-sided) dice and a pen and
    paper to write down the generated text, according to the following
    algorithm.

    == Algorithm

    To generate new text using the #context model-type(doc_metadata.n) model in
    this book:

    + *choose a starting word*---pick any bold word from the book (note that
      punctuation e.g. #punct-box(".") count as words in this model) and write
      it down

    + *look up the word's entry* (i.e. use this book like a dictionary) to find
      all possible _next_ words according to the model

    + *roll your d10(s)*:
      - if the word has a "black diamond" indicator then roll that many d10s
        e.g. for #display-with-punctuation("the")#h(
          0.2em,
        )#format-dice-indicator(
          1000,
          10,
        )#h(0.2em) then roll 4 d10s
      - otherwise, roll a single d10
      - read the dice from left to right as a single number (e.g., rolling 4, 7
        and 2 on three dice means your roll is 472)

    + *scan through the "next word" options* to find your next word the first
      number which is greater than or equal to your roll indicates your next
      word (write it down)

    + using this word as your new word repeat from step 2, continuing this loop
      until you reach a natural stopping point (like #punct-box(".")) or reach
      your desired text length

    === Example 1: single d10 (no dice indicator)

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
        dice_d: 10,
      )
    ]

    - no black diamond means roll just 1 d10
    - you roll a 6
    - scan through next word options: #format-follower("ran", 7) is the first
      one with a number that's greater than or equal to 6
    - your next word is "ran": write it down, look it up and continue the
      process

    === Example 2: multiple d10s (with dice indicator)

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
        dice_d: 10,
      )
    ]

    - the black diamond with *2* inside means roll 2 d10s (not just one)
    - you roll 5 and 8, giving you 58
    - scan through next word options: #format-follower("dog", 66) is the first
      one with a number that's greater than or equal to 58
    - your next word is "dog": write it down, look it up and continue the
      process
  ]

  pagebreak()
}

// Generate front matter
#title-page()
#copyright-page()
#instructions-page()
// Blank page after instructions
#pagebreak()
// #introduction()
// #table-of-contents()

// Main content with original layout
#set page(
  columns: int(num_columns),
  numbering: "1/1",
  header: context {
    let current-page = here().page()

    // Skip guide words on first few pages (frontmatter)
    if current-page <= 2 {
      return
    }

    // Get all entries to find what's on the current page and previous pages
    let all-entries = query(metadata)

    // Separate entries by page
    let entries-on-current-page = ()
    let last-prefix-before-page = none

    for entry in all-entries {
      let entry-page = entry.location().page()
      if entry-page == current-page {
        entries-on-current-page.push(entry.value)
      } else if entry-page < current-page {
        // Keep track of the last prefix before current page
        last-prefix-before-page = entry.value
      }
    }

    let guide-text = if entries-on-current-page.len() > 0 {
      // We have entries on this page
      let first = entries-on-current-page.first()
      let last = entries-on-current-page.last()
      if first == last {
        // Single prefix on page
        first
      } else {
        // Multiple prefixes on page - show range
        first + " — " + last
      }
    } else if last-prefix-before-page != none {
      // Continuation page (no new prefixes)
      last-prefix-before-page
    } else {
      ""
    }

    // Display guide words and horizontal rule
    if guide-text != "" {
      // Position based on odd/even page
      let is-odd = calc.odd(current-page)

      // Create the guide word display (styled like prefix text)
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

      // Add horizontal rule
      line(length: 100%, stroke: 0.5pt)
      // Add 1.5em space after the header to push main content down further
      v(1em)
    }
  },
  header-ascent: 10%, // Further reduced to bring header content down more
)

#for (i, item) in data.enumerate() {
  // The first element is the prefix
  let prefix = item.at(0)
  let total_count = item.at(1)
  let followers = item.slice(2)
  current_prefix.update(prefix)

  // Add metadata and label for the prefix
  [#metadata(prefix) <prefix-entry>#format-entry(
      prefix,
      total_count,
      followers,
      dice_d: dice_d,
    )#label("prefix-" + prefix)]

  v(0.1em)
}
