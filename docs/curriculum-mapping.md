---
title: LLMs Unplugged
subtitle: Curriculum mapping (draft)
author: Ben Swift
---

This document maps the LLMs Unplugged lessons to the
[Australian Curriculum v9.0](https://www.australiancurriculum.edu.au/) so that
teachers can drop them into existing programs and administrators can see what
coverage a unit of LLMs Unplugged lessons delivers.

Status: **draft**, May 2026. Codes are taken from the official ACARA
machine-readable workbook (curriculum-workbook.xlsx, downloads page) and have
not yet been reviewed by an external curriculum expert.

## Purpose and scope

LLMs Unplugged teaches the core mechanics of large language models (LLMs)
through hands-on, pen-and-paper-and-dice activities. The pedagogy is unplugged
(no computers required) but the concepts are the same ones used in production AI
systems. This puts the resource in a curriculum sweet spot: it is rigorous
enough to count as Digital Technologies content, but its activities are also
legible to Mathematics (probability, statistics), English (language and text
structure), and the general capabilities (Critical and Creative Thinking,
Digital Literacy, Ethical Understanding).

The mapping below is meant to help two audiences:

- **classroom teachers**, who need to know which lesson aligns with a specific
  content description they are already required to teach
- **curriculum coordinators and administrators**, who need to see the cumulative
  coverage a sequence of LLMs Unplugged lessons gives them across learning areas

State-level syllabi (NSW NESA, Victorian VCAA, QCAA, SCSA, etc.) inherit from
the ACARA F--10 v9 codes used here, so this mapping is portable. Senior
secondary (Years 11--12) is out of scope.

## Mapping principles

1. **Anchor to content description codes**, not topic labels. The codes (e.g.\
   `AC9TDI8P02`) are stable and auditable; topic labels are not.
2. **Distinguish primary from secondary alignment.** A _primary_ mapping means
   the lesson directly addresses the content description and could be used as a
   teaching/assessment vehicle for it. A _secondary_ mapping means the lesson
   touches on the content but should not be relied on as the main learning
   experience.
3. **Year band, not exact year.** The materials work best in 5--6, 7--8, and
   9--10 bands; we recommend bands rather than single years.
4. **Cross-curricular by design.** Almost every lesson maps to more than one
   learning area. We list each alignment under its strongest learning area
   first.
5. **Be honest about what's out of scope.** LLMs Unplugged does not teach
   programming syntax, formal computational complexity, or the full mathematical
   apparatus of probability theory. Where a lesson stops short of a content
   description, we say so.

## At-a-glance

| Lesson                       | Topic                 | Best fit    | Strongest learning areas                           |
| ---------------------------- | --------------------- | ----------- | -------------------------------------------------- |
| Weighted Randomness          | fundamentals          | 5--6, 7--8  | Mathematics                                        |
| Training                     | fundamentals          | 5--6, 7--8  | Digital Technologies, Mathematics                  |
| Generation                   | fundamentals          | 5--6, 7--8  | Mathematics, Digital Technologies                  |
| Pre-trained Model Generation | scaling up            | 5--6, 7--8  | Digital Technologies                               |
| Sampling                     | controlling output    | 7--8, 9--10 | Mathematics, Digital Technologies                  |
| More Context                 | scaling up            | 7--8, 9--10 | Digital Technologies, Mathematics                  |
| In-context Memory            | how models understand | 7--8, 9--10 | Digital Technologies                               |
| Induction Heads              | how models understand | 9--10       | Digital Technologies                               |
| Word Embeddings              | how models understand | 9--10       | Mathematics, Digital Technologies                  |
| LoRA                         | model tuning          | 9--10       | Digital Technologies                               |
| Synthetic Data               | model tuning          | 9--10       | Digital Technologies, Critical & Creative Thinking |
| Agentic AI                   | controlling output    | 9--10       | Digital Technologies                               |
| RLHF                         | model tuning          | 9--10       | Digital Technologies, Ethical Understanding        |
| Sycophancy                   | controlling output    | 9--10       | Digital Technologies, Ethical Understanding        |

## Per-lesson mappings

Each lesson gets a card with: year band, primary codes, secondary codes, general
capabilities, and a one-line justification per code.

### [Weighted Randomness](https://www.llmsunplugged.org/modules/weighted-randomness/)

Probability sampling from a target distribution using dice and beads. The
mathematical bedrock for everything that follows.

- **Best fit:** Years 5--8
- **Primary**
  - `AC9M5P02` --- conduct repeated chance experiments with equally and not
    equally likely outcomes; use frequency to compare and estimate likelihood.
  - `AC9M6P02` --- run simulations with increasing trials; compare observed with
    expected results.
  - `AC9M7P02` --- conduct repeated chance experiments and run simulations;
    compare predictions with observed results.
- **Secondary**
  - `AC9M6P01` --- probabilities lie on numerical scales; use fractions,
    decimals and percentages.
  - `AC9TDI6K03` --- digital systems represent data using numbers (because dice
    rolls _are_ the number representation here).
- **General capabilities:** Numeracy (recognising and using patterns and
  relationships); Critical and Creative Thinking (Inquiring).

### [Training](https://www.llmsunplugged.org/modules/training/)

Build a bigram model by counting which words follow which in a corpus.

- **Best fit:** Years 5--8
- **Primary**
  - `AC9TDI8P01` --- acquire, store and validate data from a range of sources.
    The corpus is the source; the grid is the store.
  - `AC9TDI8P02` --- analyse and visualise data to identify patterns. Token
    co-occurrence is the pattern.
  - `AC9TDI6P05` --- implement algorithms involving control structures,
    variables and input (the counting algorithm).
- **Secondary**
  - `AC9M5ST01` / `AC9M6ST01` (statistics strand) --- categorise and describe
    data and frequencies.
  - `AC9E7LA08` --- vocabulary in building specialist knowledge.
- **General capabilities:** Digital Literacy (Investigating > Locate, generate
  and access data); Numeracy.

### [Generation](https://www.llmsunplugged.org/modules/generation/)

Use the trained bigram model to generate new text via weighted sampling.

- **Best fit:** Years 5--8
- **Primary**
  - `AC9M5P02`, `AC9M7P01` --- sample space and assigning probabilities to
    outcomes.
  - `AC9TDI6P05` --- implement algorithms with control structures and input (the
    generation loop).
- **Secondary**
  - `AC9TDI8P06` --- trace algorithms to predict output for a given input.
  - `AC9E5LA03` --- describe how texts use language features and are organised
    into stages and phases (when comparing generated and source text).
- **General capabilities:** Numeracy; Critical and Creative Thinking
  (Generating).

### [Pre-trained Model Generation](https://www.llmsunplugged.org/modules/pretrained-generation/)

Use a pre-built booklet to generate text without training your own model.
Introduces the consume-vs-build distinction that underpins most real-world AI
usage.

- **Best fit:** Years 5--8
- **Primary**
  - `AC9TDI6P05` / `AC9TDI8P06` --- trace and run an algorithm someone else
    designed.
  - `AC9M6P02` --- use a system (the booklet) to run a simulation.
- **Secondary**
  - `AC9TDI8K01` --- explain how hardware specifications affect performance
    (here, the booklet's "specifications" are corpus size and N value).
- **General capabilities:** Digital Literacy (Managing and operating).

### [Sampling](https://www.llmsunplugged.org/modules/sampling/)

Temperature and truncation strategies for controlling text output.

- **Best fit:** Years 7--10
- **Primary**
  - `AC9M7P01` / `AC9M8P02` --- assigning probabilities to outcomes;
    combinations of events.
  - `AC9TDI8P05` --- design algorithms involving nested control structures (the
    truncation rules).
- **Secondary**
  - `AC9M9P02` --- relative frequencies from data to estimate probabilities.
- **General capabilities:** Critical and Creative Thinking (Analysing >
  Evaluating reasoning); Numeracy.

### [More Context](https://www.llmsunplugged.org/modules/more-context/)

Extend the bigram to two words of context (a trigram), see why that gets
expensive, then add cheaper context with a skip grid.

- **Best fit:** Years 7--10
- **Primary**
  - `AC9TDI8P03` --- model and query the attributes of objects and events using
    structured data.
  - `AC9TDI8P09` --- implement, modify and debug programs involving control
    structures and functions.
- **Secondary**
  - `AC9M8P02` --- determine all possible combinations and use these to
    determine probabilities.
- **General capabilities:** Numeracy; Critical and Creative Thinking.

### [In-context Memory](https://www.llmsunplugged.org/modules/in-context-learning/)

Add a short-term memory that biases generation toward recently-used words,
keeping text on topic --- a hands-on model of attention.

- **Best fit:** Years 7--10
- **Primary**
  - `AC9TDI8P03` --- model and query the attributes of objects and events using
    structured data (the running memory list).
  - `AC9TDI8P09` --- implement, modify and debug programs involving control
    structures and functions (the reweighting procedure over generation).
- **Secondary**
  - `AC9M9P02` --- use relative frequencies and adjust probabilities based on
    collected data (boosting recently-seen words).
- **General capabilities:** Critical and Creative Thinking (Analysing); Digital
  Literacy.

### [Induction Heads](https://www.llmsunplugged.org/modules/in-context-learning/)

Complete a pattern from the text itself: find the last time the current word
appeared and copy what followed --- the circuit behind in-context learning.

- **Best fit:** Years 9--10
- **Primary**
  - `AC9TDI8P06` / `AC9TDI10P06` --- trace algorithms to predict output, and
    validate by comparing output against test cases (the pattern-completion
    check).
  - `AC9TDI8P09` --- implement, modify and debug programs involving control
    structures and functions.
- **Secondary**
  - `AC9TDI10P03` --- model and query entities and their relationships using
    structured data.
- **General capabilities:** Critical and Creative Thinking (Inquiring,
  Analysing).

### [Word Embeddings](https://www.llmsunplugged.org/modules/word-embeddings/)

Treat each word's row in the bigram grid as a vector; measure similarity.

- **Best fit:** Years 9--10
- **Primary**
  - `AC9M10SP02` --- interpret networks and network diagrams used to represent
    relationships in practical situations. An embedding space _is_ a
    relationship diagram.
  - `AC9TDI10K02` --- represent documents as content, structure and
    presentation; explain why such representations matter.
  - `AC9TDI10P03` --- model and query entities and their relationships using
    structured data.
- **Secondary**
  - `AC9E9LA08` --- vocabulary choices and meaning.
- **General capabilities:** Numeracy; Critical and Creative Thinking
  (Generating > Considering alternatives).

### [LoRA](https://www.llmsunplugged.org/modules/sycophancy/#adapters-this-trick-has-a-name)

Add a lightweight adaptation layer to retarget a trained base model.

- **Best fit:** Years 9--10
- **Primary**
  - `AC9TDI10P08` --- generate, modify, communicate and critically evaluate
    alternative designs (the LoRA design choice itself).
  - `AC9TDI10P06` --- validate algorithms and programs by comparing output
    against a range of test cases.
- **Secondary**
  - `AC9TDI10P09` --- implement, modify and debug modular programs.
- **General capabilities:** Critical and Creative Thinking.

### [Synthetic Data](https://www.llmsunplugged.org/modules/synthetic-data/)

Generate synthetic text, retrain on it, observe drift and collapse.

- **Best fit:** Years 9--10
- **Primary**
  - `AC9TDI10P10` --- evaluate solutions against design criteria, future impact,
    opportunities for enterprise. Model collapse is the case study.
  - `AC9TDI10P01` --- develop techniques to acquire, store and validate data
    (validation by retraining).
- **Secondary**
  - `AC9TDI8P14` --- assess whether collected data is essential to purpose.
- **General capabilities:** Critical and Creative Thinking (Reflecting); Ethical
  Understanding (Responsibility and accountability for action).

### [Agentic AI](https://www.llmsunplugged.org/modules/agentic-ai/)

Turn the model into an agent by giving it access to external tools.

- **Best fit:** Years 9--10
- **Primary**
  - `AC9TDI10P09` --- implement modular programs applying algorithms and data
    structures (the tool-dispatch loop).
  - `AC9TDI10P03` --- model entities and their relationships (the model + tool +
    environment graph).
- **Secondary**
  - `AC9TDI8P09` --- programs involving control structures and functions.
- **General capabilities:** Digital Literacy (Investigating > Locate, generate
  and access data); Critical and Creative Thinking.

### [RLHF](https://www.llmsunplugged.org/modules/rlhf/)

Use human preferences to adjust the model's weights.

- **Best fit:** Years 9--10
- **Primary**
  - `AC9TDI10P10` --- evaluate solutions against design criteria, possible
    future impact and opportunities for enterprise.
  - `AC9TDI8P10` --- evaluate existing and student solutions against the design
    criteria and possible future impact.
- **Secondary**
  - `AC9M9P02` --- adjust probabilities based on collected data.
- **General capabilities:** Ethical Understanding (Decision-making and actions);
  Critical and Creative Thinking (Reflecting > Thinking about thinking).

### [Sycophancy](https://www.llmsunplugged.org/modules/sycophancy/)

Skew the model toward over-agreeable output by piling in flattering training
data.

- **Best fit:** Years 9--10
- **Primary**
  - `AC9TDI8P02` / `AC9TDI10P02` --- analyse and visualise data to draw
    conclusions and make predictions (here, predicting how a model will behave
    from its training set).
  - `AC9TDI10P14` --- apply the Australian Privacy Principles to critique
    digital systems (the lesson extends naturally into data-source critique).
- **Secondary**
  - `AC9E10LY03` --- analyse and evaluate how language features are used to
    implicitly or explicitly represent values, beliefs and attitudes.
- **General capabilities:** Ethical Understanding (Understanding ethical
  concepts > Examining values); Critical and Creative Thinking.

## Coverage summary by strand

### Digital Technologies

Most concentrated coverage. Across the lesson set, students engage substantively
with these strands:

- **Knowledge and understanding > Representation of data**: covered by Training,
  More Context, In-context Memory, Word Embeddings.
- **Processes and production skills > Acquiring, storing and validating data**:
  Training, Synthetic Data, Sycophancy.
- **Processes and production skills > Analysing and visualising data**:
  Training, Sycophancy.
- **Processes and production skills > Defining problems**: Pre-trained
  Generation, Sampling.
- **Processes and production skills > Designing and tracing algorithms**:
  Generation, Sampling.
- **Processes and production skills > Implementing programs**: Generation, More
  Context, In-context Memory, Induction Heads, Agentic AI, LoRA.
- **Processes and production skills > Evaluating solutions**: RLHF, Synthetic
  Data, Sycophancy, LoRA.

The set does **not** substantively cover: networks and protocols, cyber security
threat models, user-interface design, or project management. Those content
descriptions still need a separate teaching vehicle.

### Mathematics

- **Probability (Years 5--10)**: Weighted Randomness, Generation, Sampling, More
  Context, In-context Memory, RLHF.
- **Statistics (Years 5--8)**: Training (categorising and describing data).
- **Number / Algebra**: light touch only.
- **Space**: only via Word Embeddings (vectors and distance).

### English

- **Language strand** (vocabulary): a light touch only --- the materials no
  longer include a dedicated sentence-structure vehicle; Training (specialist
  vocabulary) and Word Embeddings (vocabulary and meaning) contribute.
- **Literature / Literacy strands**: light touch, mostly through critical
  analysis of generated vs. source text in Generation, Sycophancy, Synthetic
  Data.

## General capabilities

LLMs Unplugged is unusually rich in GC coverage because the activities require
students to _do_ the thinking, not just learn about it.

- **Digital Literacy** --- the entire course is an extended worked example of
  "managing and operating" digital systems concepts without screens, with
  particular strength in _Investigating > Locate, generate and access data_ and
  _Managing and operating > Manage content, data and information_.
- **Critical and Creative Thinking** --- _Inquiring_, _Generating ideas,
  possibilities and actions_, _Analysing, synthesising and evaluating reasoning
  and procedures_, and _Reflecting_ are all exercised across the lesson
  sequence.
- **Numeracy** --- _Recognising and using patterns and relationships_,
  _Interpreting and representing data_, and _Using probabilistic thinking_
  underpin the fundamentals lessons.
- **Literacy** --- _Composing texts_ (generated output) and _Comprehending
  texts_ (source corpus selection and analysis) are present throughout.
- **Ethical Understanding** --- RLHF, Sycophancy, and Synthetic Data are
  designed to surface ethical issues around training data, feedback, and data
  quality.

## Suggested programs

Three concrete sequences that an administrator could slot into a year-long
program.

### Year 5--6: "How computers make text" (4 lessons, ~5 hours)

1. Weighted Randomness --- `AC9M6P02`
2. Training --- `AC9TDI6P05`
3. Generation --- `AC9M6P02`, `AC9TDI6P05`
4. Pre-trained Model Generation --- `AC9TDI6P05`

Sits cleanly in a Digital Technologies unit on data representation and
algorithms; Mathematics teacher can co-teach the probability components.

### Year 7--8 Digital Technologies: "Data and AI" (6 lessons, ~8 hours)

1. Weighted Randomness
2. Training --- `AC9TDI8P01`, `AC9TDI8P02`
3. Generation --- `AC9TDI8P06`
4. Sampling --- `AC9TDI8P05`
5. More Context --- `AC9TDI8P03`, `AC9TDI8P09`
6. In-context Memory --- `AC9TDI8P03`, `AC9TDI8P09`

Delivers most of the "Data and information" knowledge band plus the
algorithm-design content descriptions for Years 7--8.

### Year 9--10 cross-curricular: "Understanding AI" (5 lessons, ~7 hours)

1. More Context (recap, if not previously seen)
2. Word Embeddings --- `AC9TDI10K02`, `AC9TDI10P03`
3. Synthetic Data --- `AC9TDI10P10`, `AC9TDI10P01`
4. RLHF --- `AC9TDI10P10` + Ethical Understanding
5. Sycophancy --- `AC9TDI10P14` + Ethical Understanding

Co-teach with English (analysing language and values) and HASS / Civics (data
ethics and decision-making).

## Competency reference

Every code cited above, grouped by learning area and strand. Codes follow the
ACARA v9 pattern: `AC9` + learning area (`M` Mathematics, `TDI` Digital
Technologies, `E` English) + year level + strand (`P` probability, `ST`
statistics, `SP` space, `K` knowledge, `LA` language, `LY` literacy) + sequence
number.

### Mathematics

Probability:

- `AC9M5P02` (Year 5) --- conduct repeated chance experiments with equally and
  not equally likely outcomes; use frequency to compare and estimate likelihood.
- `AC9M6P01` (Year 6) --- probabilities lie on numerical scales; use fractions,
  decimals and percentages.
- `AC9M6P02` (Year 6) --- run simulations with increasing trials; compare
  observed with expected results.
- `AC9M7P01` (Year 7) --- identify sample spaces and assign probabilities to
  outcomes.
- `AC9M7P02` (Year 7) --- conduct repeated chance experiments and run
  simulations; compare predictions with observed results.
- `AC9M8P02` (Year 8) --- determine all possible combinations and use these to
  determine probabilities.
- `AC9M9P02` (Year 9) --- use relative frequencies from data to estimate
  probabilities; adjust probabilities based on collected data.

Statistics:

- `AC9M5ST01` (Year 5) --- categorise and describe data and frequencies.
- `AC9M6ST01` (Year 6) --- categorise and describe data and frequencies.

Space:

- `AC9M10SP02` (Year 10) --- interpret networks and network diagrams used to
  represent relationships in practical situations.

### Digital Technologies

Knowledge and understanding:

- `AC9TDI6K03` (Year 6) --- digital systems represent data using numbers.
- `AC9TDI8K01` (Year 8) --- explain how hardware specifications affect
  performance.
- `AC9TDI10K02` (Year 10) --- represent documents as content, structure and
  presentation; explain why such representations matter.

Processes and production skills:

- `AC9TDI6P05` (Year 6) --- implement algorithms involving control structures,
  variables and input.
- `AC9TDI8P01` (Year 8) --- acquire, store and validate data from a range of
  sources.
- `AC9TDI8P02` (Year 8) --- analyse and visualise data to identify patterns.
- `AC9TDI8P03` (Year 8) --- model and query the attributes of objects and events
  using structured data.
- `AC9TDI8P05` (Year 8) --- design algorithms involving nested control
  structures.
- `AC9TDI8P06` (Year 8) --- trace algorithms to predict output for a given
  input.
- `AC9TDI8P09` (Year 8) --- implement, modify and debug programs involving
  control structures and functions.
- `AC9TDI8P10` (Year 8) --- evaluate existing and student solutions against the
  design criteria and possible future impact.
- `AC9TDI8P14` (Year 8) --- assess whether collected data is essential to
  purpose.
- `AC9TDI10P01` (Year 10) --- develop techniques to acquire, store and validate
  data.
- `AC9TDI10P02` (Year 10) --- analyse and visualise data to draw conclusions and
  make predictions.
- `AC9TDI10P03` (Year 10) --- model and query entities and their relationships
  using structured data.
- `AC9TDI10P06` (Year 10) --- validate algorithms and programs by comparing
  output against a range of test cases.
- `AC9TDI10P08` (Year 10) --- generate, modify, communicate and critically
  evaluate alternative designs.
- `AC9TDI10P09` (Year 10) --- implement, modify and debug modular programs
  applying algorithms and data structures.
- `AC9TDI10P10` (Year 10) --- evaluate solutions against design criteria,
  possible future impact and opportunities for enterprise.
- `AC9TDI10P14` (Year 10) --- apply the Australian Privacy Principles to
  critique digital systems.

### English

Language:

- `AC9E5LA03` (Year 5) --- describe how texts use language features and are
  organised into stages and phases.
- `AC9E7LA08` (Year 7) --- vocabulary in building specialist knowledge.
- `AC9E9LA08` (Year 9) --- analyse how vocabulary choices contribute to style,
  mood and tone.

Literacy:

- `AC9E10LY03` (Year 10) --- analyse and evaluate how language features are used
  to implicitly or explicitly represent values, beliefs and attitudes.

## Caveats and out of scope

- **Foundation to Year 4**: not currently mapped. The dice-and-grid mechanics
  are accessible to upper primary, but the content descriptions at F--4
  emphasise concrete materials, not symbolic systems; we recommend treating any
  F--4 use as enrichment rather than as primary curriculum coverage.
- **Senior secondary (11--12)**: out of scope. Some lessons (especially
  Synthetic Data, RLHF, Word Embeddings) would extend naturally into the Digital
  Solutions / Software Engineering / Specialist Mathematics syllabi, but those
  syllabi are state-specific and not mapped here.
- **Assessment**: this document maps _teaching_ coverage, not assessment
  evidence. Each primary mapping above could plausibly serve as evidence, but
  the assessment task design (rubrics, work samples, moderation) is a separate
  exercise.
- **Codes verified against ACARA workbook of 2026**. If ACARA publishes a v9.x
  update, codes should be re-checked; the structural mapping (which lesson
  aligns with which strand) is unlikely to change.

## Next steps

1. **External review** by a practising secondary DT teacher and a Mathematics
   teacher.
2. **Sample lesson plans** for each of the three suggested programs above,
   including assessment artefacts.
3. **State-level cross-references** (NESA Stage 4/5, VCAA Levels 7--10) once the
   F--10 mapping is settled.
