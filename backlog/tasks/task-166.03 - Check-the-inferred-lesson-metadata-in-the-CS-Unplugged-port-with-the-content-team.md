---
id: TASK-166.03
title: >-
  Check the inferred lesson metadata in the CS Unplugged port with the content
  team
status: To Do
assignee: []
created_date: '2026-10-11 02:32'
labels:
  - cs-unplugged
dependencies: []
parent_task_id: TASK-166
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The static port (TASK-166.01) describes every lesson with the same compulsory fields, including a duration and an age group. The Django site recorded neither for the 8 at-home activities or the 9 at-a-distance lessons, so those values were filled in as best guesses, along with a few topic links. They appear on the lesson pages and drive the search filters, so they need checking by people who know the lessons (Tim Bell and the CS Unplugged content team) before the site goes live.

Everything to check is in one file in the cs-unplugged repo, `src/content/structure/lesson-metadata.yaml`. Each entry lists the fields that are guesses under `inferred`, and the file's header states the rule used:

- duration: the duration of the classroom lesson on the same activity where there is one; otherwise 30 minutes, or 45 for an at-a-distance deck of 16 slides or more
- ages, at home: from the activity's 'Skills needed' list and the age groups of its classroom counterpart
- ages, at a distance: the older age group of the classroom counterpart and up; 11 to 14 only where there is no counterpart
- topics: four at-home links that no text in the activity backs (mind-reading-magic, guess-my-number, find-my-card, squeezing-pictures)

Four lessons have no topic because their subject has none on the site: stroop-effect, information-theory, finite-state-automata and guess-the-sentence. Whether they should get one, or a topic should be added, is a question for the same review.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The content team has confirmed or corrected the duration of all 17 at-home and at-a-distance lessons
- [ ] #2 The content team has confirmed or corrected the age groups of all 17
- [ ] #3 The four inferred at-home topic links are confirmed or corrected
- [ ] #4 A decision is recorded for the four lessons with no topic
- [ ] #5 No entry in lesson-metadata.yaml still lists a field under inferred
<!-- AC:END -->
