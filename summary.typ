// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See teaching/LICENSE for details.

#import "@local/anu-typst-template:0.2.0": *

#show: anu.with(
  title: "My First LM: Generated Booklets Summary",
  subtitle: "Summary of all generated language model booklets",
  author: "Ben Swift",
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

#let format-ngram(ngram_data) = {
  if ngram_data == none {
    "N/A"
  } else {
    let prefix = ngram_data.at(0).join(" ")
    let follower = ngram_data.at(1)
    let count = ngram_data.at(2)
    [#prefix → #follower (#count)]
  }
}

#let format-prefix(prefix_data) = {
  if prefix_data == none {
    "N/A"
  } else {
    let prefix = prefix_data.at(0).join(" ")
    let count = prefix_data.at(1)
    [#prefix (#count)]
  }
}

#table(
  columns: 7,
  table.header(
    [*Title*],
    [*Type*],
    [*Total Tokens*],
    [*Unique Prefixes*],
    [*Most Common N-gram*],
    [*Prefix with Most Followers*],
    [*Pages*],
  ),
  ..summary_data.map(entry => (
    entry.title,
    model-type(entry.n),
    if entry.total_tokens == none { "N/A" } else { str(entry.total_tokens) },
    if entry.unique_prefixes == none { "N/A" } else { str(entry.unique_prefixes) },
    format-ngram(entry.most_common_ngram),
    format-prefix(entry.most_popular_prefix),
    str(entry.pages),
  )).flatten()
)
