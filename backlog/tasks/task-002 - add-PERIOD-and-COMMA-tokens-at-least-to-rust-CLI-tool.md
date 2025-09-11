---
id: task-002
title: add PERIOD and COMMA tokens at least to rust CLI tool
status: Done
assignee: []
created_date: '2025-09-02 06:22'
updated_date: '2025-09-11 05:36'
labels: []
dependencies: []
---

## Description

Currently the tokenizer strips all commas, periods and other punctuation. I'd
like to preserve the `,` (comma) and `.` (period) tokens only, so that they show
up in both prefix and follower lists in the typeset books.

In terms of the intermediate json file (produced by the rust CLI tool and
consumed by typst to create the booklet pdf) these can probably just be
represented by the strings `"."` and `","`. However, in the visual output I'd
like to put a "box" rounded rect around them (and elevate them from the baseline
to the centre of the box) to indicate visually that these are punctuation
tokens.

Update the rust code, the typst template and any tests.
