---
id: TASK-142
title: Store corpora in a private repo with a reproducible cleaning recipe
status: To Do
assignee: []
created_date: '2026-09-01 23:36'
updated_date: '2026-09-02 00:01'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The input texts in data/ are gitignored and live only on daysy, so they are neither shared between machines nor reviewable. That cost us: collected-hemingway.txt had OCR damage (capital I read as l, J read as an opening bracket) that sat unnoticed for over a year and shipped in the published booklet as headwords like 'wiIl', 'oId' and 'oaquin'. The cleanup that fixed it is currently an undocumented one-off in a shell history, so nobody can reproduce or review it.

Store both the data and the recipe: a private GitHub repo (plain git, not an nb notebook) holding the corpora, alongside a manifest recording where each text came from and what was done to it, plus a script that can rebuild a cleaned corpus from its raw source. Corpora are in-copyright in several cases, which is why the repo is private and data/ stays gitignored here.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A private GitHub repo holds every corpus used to build a published artefact, in both its raw and cleaned form, and clones onto daysy and weddle
- [x] #2 Each corpus has a manifest entry recording its source URL, the sha256 of the raw file, and the cleaning steps applied to it
- [x] #3 A script regenerates each cleaned corpus from its raw source, and its output matches the stored cleaned file byte for byte
- [x] #4 Cleaning changes land as reviewable commits rather than in-place edits with no record
- [x] #5 The llms-unplugged repo documents how to obtain the corpora, with data/ still gitignored
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Repo created and pushed: github.com/benswift/llms-unplugged-corpora (private, 27 files). texts/ holds all 20 corpora, raw/ holds the as-fetched original for the four repaired today, manifest.toml records source URL, raw and clean sha256 and what was wrong with each, and clean.py --check verifies every corpus against the manifest and re-derives the four cleaned ones from raw byte for byte. AC1 outstanding only in that the daysy clone is unconfirmed --- the machine stopped responding mid-clone.
<!-- SECTION:NOTES:END -->
