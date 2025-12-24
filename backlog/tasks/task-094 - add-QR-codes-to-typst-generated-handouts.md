---
id: task-094
title: add QR codes to typst-generated handouts
status: To Do
assignee: []
created_date: "2025-12-18 23:54"
labels: []
dependencies: []
---

Here's how it should work:

- the main utils function in @utils.typ takes an optional string arg
- if present, use a typst QR generator to create a QR code for that string (gold
  on black, using the ANU colours) and place it on top of the hero image in the
  bottom RH corner of the first page of the card
- each \*.typ file in website/lessons/ should be updated to point to full URL to
  the online version of the lesson (in most cases this is easy, but in some
  cases a bit trickier e.g. the grid and bucket versions should both point to
  the same URL, because the website has them both consolidated onto one page)
