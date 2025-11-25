---
id: task-047
title: change nomenclature around the resources
status: To Do
assignee: []
created_date: "2025-11-25 02:08"
labels: []
dependencies: []
---

I want to change the nomenclature throughout this whole project:

- "modules" should be "lessons"

- "lessons" are grouped into "topics" (note: this higher-level grouping of the
  lessons/modules doesn't currently exist on the website, but we need to add it)

- "topics" are:

  1. **Fundamentals**

     - 00 - Weighted Randomness _(optional—can be skipped if students are
       comfortable with weighted random selection)_
     - 01 - Basic Training
     - 02 - Basic Generation

  2. **Scaling up**

     - 03 - Pre-trained Model Generation
     - 05 - Trigram Model

  3. **Controlling output**

     - 04 - Sampling Strategies

  4. **How models "understand"**

     - 06 - Context Columns
     - 07 - Word Embeddings

  5. **Adaptation and data**
     - 08 - LoRA
     - 09 - Synthetic Data

This will require lots of changes to the codebase. I want to be consistent...
don't keep any of the old nomenclature for "backwards compat"; no-one is using
this yet so we can make the changes now and keep it simple.

In terms of the website layout, I'd like to have the main topics/ page have a
list of the topics (with a description of each), and then topics/TOPIC_NAME/
pages which have a list of the actual lessons. So the main modules/ pages (which
lists all the modules) won't exist anymore.
