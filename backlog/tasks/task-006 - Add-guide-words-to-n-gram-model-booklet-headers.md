---
id: task-006
title: Add guide words to n-gram model booklet headers
status: To Do
assignee: []
created_date: "2025-09-22 11:36"
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Add dictionary-style guide words (first and last entry) to page headers in the
n-gram model output booklet, similar to the example implementation in
docs/dictionary-guide-words-json.typ

<!-- SECTION:DESCRIPTION:END -->

## Background

The n-gram model booklet (generated from `model.json` by `book.typ`) currently
lacks guide words in the page headers, making it difficult for readers to
quickly locate specific prefixes in the multi-column layout. Dictionary-style
guide words showing the first and last entries on each page would significantly
improve usability.

## Requirements

### Functional requirements

1. Add guide words to page headers showing the first and last prefix on each
   page
2. Guide words should appear centred in the header, formatted as: `FIRST — LAST`
   (using smallcaps)
3. Guide words should only appear after frontmatter (title page, instructions,
   etc.)
4. The rest of the document layout and content must remain unchanged

### Technical approach

The implementation should follow the pattern demonstrated in the example files:

#### Example implementation from `docs/dictionary-guide-words-json.typ`:

```typst
// Load dictionary entries from JSON file
#let dict-data = json("dictionary-entries.json")

// States to track first and last entries on each page
#let page-entries = state("page-entries", ())

#set page(
  paper: "a4",
  margin: 2cm,
  columns: 2,
  header: context {
    // Get the entries for this page
    let entries = page-entries.final()
    let current-page = here().page()

    // Find entries on this page
    let page-words = ()
    for entry in entries {
      if entry.page == current-page {
        page-words.push(entry.word)
      }
    }

    if page-words.len() > 0 {
      let first = page-words.first()
      let last = page-words.last()
      align(center)[
        #smallcaps(first) — #smallcaps(last)
      ]
    }
  },
  header-ascent: 30%,
)

#set text(size: 10pt)
#set par(justify: true)

// Dictionary entry function
#let entry(word, definition) = {
  // Record this entry's location
  context {
    let loc = here()
    page-entries.update(entries => {
      entries.push((word: word, page: loc.page()))
      entries
    })
  }

  // Display the entry
  block(below: 0.8em)[
    #strong(word) #h(0.5em) #definition
  ]
}

// Create dictionary entries from JSON data
#for item in dict-data.entries {
  entry(item.word, item.definition)
}
```

#### Example JSON structure from `dictionary-entries.json`:

```json
{
  "entries": [
    {
      "word": "aardvark",
      "definition": "A nocturnal burrowing mammal with long ears, a tubular snout, and a long extensible tongue, feeding on ants and termites. Native to Africa, these creatures can eat up to 50,000 insects in a single night."
    },
    {
      "word": "abandon",
      "definition": "To give up completely; to desert or leave permanently. The word derives from Old French 'abandoner', meaning to put under another's control. Can also refer to a complete lack of inhibition or restraint."
    }
    // ... more entries
  ]
}
```

### Implementation notes for `book.typ`

The current `book.typ` file:

- loads n-gram data from `model.json`
- has a state variable `current_prefix` that tracks prefixes
- uses a multi-column layout (configurable via `num_columns`)
- generates entries for each prefix and its suffixes

Key changes needed:

1. Add a state variable to track entries and their page locations (similar to
   `page-entries` in the example)
2. Modify the page header setup to display guide words
3. Update the entry generation code to record each prefix's location
4. Ensure guide words only appear after the frontmatter sections

### Testing

After implementation:

1. Generate a booklet using various n-gram models (unigram, bigram, trigram)
2. Verify guide words appear correctly on each page after frontmatter
3. Confirm guide words accurately reflect the first and last prefixes on each
   page
4. Check that multi-column layouts work correctly
5. Ensure the rest of the document formatting remains unchanged

## Success criteria

- [ ] Guide words appear in the header of each page (after frontmatter)
- [ ] Guide words correctly show the first and last prefix on each page
- [ ] Guide words are formatted as smallcaps with an em dash separator
- [ ] Implementation works for all n-gram model types
- [ ] No changes to the existing content or layout of entries
- [ ] The example files (`docs/dictionary-guide-words-json.typ` and
      `dictionary-entries.json`) can be deleted after successful implementation
