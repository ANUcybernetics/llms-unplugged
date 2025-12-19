---
id: task-096
title: bring back the glossary
status: Done
assignee: []
created_date: '2025-12-19 00:01'
updated_date: '2025-12-19 10:37'
labels: []
dependencies: []
---

It'd be good to add a glossary page to the website (and add it to the nav, too).
We had a glossary in an earlier version of the typst instructor notes, but it
got "assimilated" into the rest of the website content at some stage.

Each entry in the glossary should:

- provide a clear, plain language explanation of what it is
- mention any synonyms
- provide a link to the relevant section of the website

There's even a chance for this glossary to act as something of a "style guide"
for the lessons in general, e.g. we can make it clear in the "tokens" entry that
in the lesson content we use "words" in the intro/algo/example sections
initially, but move to calling them "tokens" as soon as can possibly be done in
a clear way.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed 2025-12-19:
- Created `/website/glossary.md` with comprehensive glossary covering:
  - Core concepts (token, vocabulary, language model, training, generation, probability distribution)
  - Model types (bigram, trigram, n-gram, context window)
  - Training variants (grid, bucket, matrix)
  - Sampling and generation (weighted random sampling, temperature, greedy, beam search, truncation)
  - Understanding and meaning (embedding, similarity matrix, attention)
  - Advanced concepts (fine-tuning, LoRA, RLHF, tool use, synthetic data, hallucination, parameters, transformer)
- Each entry includes plain-language explanation, synonyms where applicable, and links to relevant lessons
- Added style note about "word" vs "token" terminology usage
- Included "Connections to your activities" table mapping hands-on activities to LLM equivalents
- Added "Key insights" section summarising the main takeaways
- Added Glossary link to top navigation bar in `.vitepress/config.mts`
- All tests pass (92/92)
<!-- SECTION:NOTES:END -->
