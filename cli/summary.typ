// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.

#import "@local/anu-typst-template:0.3.0": *

#show: anu.with(
  title: "LLMs Unplugged Summary",
  subtitle: "Summary of all generated language model books",
)

#let summary_data = json("out/summary.json")

#let model-type(n) = {
  if n == 2 {
    "bigram"
  } else if n == 3 {
    "trigram"
  } else {
    str(n) + "-gram"
  }
}

#let format-number(num) = {
  if num == none {
    return "N/A"
  }
  let s = str(num)
  let chars = s.codepoints()
  let len = chars.len()
  let result = ""
  for i in range(len) {
    if i > 0 and calc.rem(len - i, 3) == 0 {
      result += ","
    }
    result += chars.at(i)
  }
  result
}

#let format-ngram(ngram_data) = {
  if ngram_data == none {
    "N/A"
  } else {
    let context = ngram_data.context.map(p => raw(p)).join(" ")
    [#context → #raw(ngram_data.next_word) (#ngram_data.count)]
  }
}

#let format-previous-words(context_data) = {
  if context_data == none {
    "N/A"
  } else {
    let context = context_data.context.map(p => raw(p)).join(" ")
    [#context (#context_data.count)]
  }
}

#table(
  columns: (2fr, 1fr, 1fr, 1fr, 1fr, 1fr),
  table.header(
    [*Title*],
    [*Type*],
    align(right, [*Total Tokens*]),
    align(right, [*Unique Previous-Words*]),
    [*Most Common N-gram*],
    [*Previous-Words with Most Next-Words*],
  ),
  ..summary_data
    .map(entry => (
      entry.title,
      model-type(entry.n),
      align(right, format-number(entry.total_tokens)),
      align(right, format-number(entry.unique_previous_words)),
      format-ngram(entry.most_common_ngram),
      format-previous-words(entry.most_popular_previous_words),
    ))
    .flatten(),
)
