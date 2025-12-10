---
id: task-081
title: add to cli tool the ability to print stuff for bucket training
status: To Do
assignee: []
created_date: "2025-12-09 22:27"
labels: []
dependencies: []
---

The instructions in @website/lessons/bucket-training.md require printing out the
text and cutting it (physically) up to be placed in the buckets. I want to add a
feature to the CLI tool to do that.

Here's how it could work:

- take input as a text file (same format as for other booklet-generation tasks)
- create a cli/tokenized-cutouts.typ file which just has the words, in large
  font (Libertinus as well, just like in book.typ) with no word-splitting and
  each word with a light "grid" around it (so that cutting along these grid
  lines leaves each word - i.e. token - on its own piece of paper)
- any things which are stripped by the tokenizer (e.g. punctuation outside of
  `.` and `,`) can still be printed, but should be greyed out or somehow
  visually indicated that those tokens are to be thrown away
- in case the cut-out tokens get jumbled up before they can be correctly put
  into buckets, include a subtle index number indicator on each token
