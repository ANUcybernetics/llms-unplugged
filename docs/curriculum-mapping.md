---
title: LLMs Unplugged
subtitle: Curriculum mapping (draft)
author: Ben Swift
---

This document maps the LLMs Unplugged modules to the
[Australian Curriculum v9.0](https://www.australiancurriculum.edu.au/) so that
teachers can drop them into existing programs and administrators can see what
coverage a unit of LLMs Unplugged modules delivers. It also notes where the same
content sits in New Zealand's proposed Technology curriculum.

Status: **draft**, updated November 2026. Every code and its wording was checked
against ACARA's published v9.0 curriculum in November 2026. The alignments
themselves have not yet been reviewed by an external curriculum expert.

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

- **classroom teachers**, who need to know which module aligns with a specific
  content description they are already required to teach
- **curriculum coordinators and administrators**, who need to see the cumulative
  coverage a sequence of LLMs Unplugged modules gives them across learning areas

The codes are the national curriculum's. Queensland, Tasmania, the ACT and the
Northern Territory teach v9.0 directly, and South Australia is phasing it in
ahead of full adoption in 2027. Western Australia has adapted v9.0 with its own
codes, and Victoria and New South Wales publish separate curricula with their
own codes, so a teacher in those three states will need to find the matching
local code. Senior secondary (Years 11--12) is out of scope.

## Mapping principles

1. **Anchor to content description codes**, not topic labels. The codes (such as
   `AC9TDI8P02`) are stable and auditable; topic labels are not. The exception
   is artificial intelligence, which v9.0 names only in elaborations, so the AI
   section below cites elaboration codes (such as `AC9TDI8P11_E5`).
2. **Distinguish primary from secondary alignment.** A _primary_ mapping means
   the module directly addresses the content description and could be used as a
   teaching/assessment vehicle for it. A _secondary_ mapping means the module
   touches on the content but should not be relied on as the main learning
   experience.
3. **Year band, not exact year.** The materials work best in 5--6, 7--8, and
   9--10 bands; we recommend bands rather than single years.
4. **Cross-curricular by design.** Almost every module maps to more than one
   learning area. We list each alignment under its strongest learning area
   first.
5. **Be honest about what's out of scope.** LLMs Unplugged does not teach
   programming syntax, formal computational complexity, or the full mathematical
   apparatus of probability theory. Where a module stops short of a content
   description, we say so.

## At-a-glance

| Module                       | Topic               | Best fit    | Strongest learning areas                           |
| ---------------------------- | ------------------- | ----------- | -------------------------------------------------- |
| Weighted Randomness          | fundamentals        | 5--6, 7--8  | Mathematics                                        |
| Training                     | fundamentals        | 5--6, 7--8  | Digital Technologies, Mathematics                  |
| Generation                   | fundamentals        | 5--6, 7--8  | Mathematics, Digital Technologies                  |
| Pre-trained Model Generation | scaling up          | 5--6, 7--8  | Digital Technologies                               |
| Sampling                     | shaping behaviour   | 7--8, 9--10 | Mathematics, Digital Technologies                  |
| Beam Search                  | shaping behaviour   | 9--10       | Mathematics, Digital Technologies                  |
| More Context                 | scaling up          | 7--8, 9--10 | Digital Technologies, Mathematics                  |
| In-context Learning          | looking inside      | 7--8, 9--10 | Digital Technologies                               |
| Word Embeddings              | looking inside      | 9--10       | Mathematics, Digital Technologies                  |
| Fine-tuning and LoRA         | shaping behaviour   | 9--10       | Digital Technologies, Ethical Understanding        |
| Synthetic Data               | shaping behaviour   | 9--10       | Digital Technologies, Critical & Creative Thinking |
| Agentic AI                   | extending the model | 9--10       | Digital Technologies                               |
| Rewards                      | shaping behaviour   | 9--10       | Digital Technologies, Ethical Understanding        |

## Artificial intelligence in the curriculum

No Digital Technologies content description or achievement standard in v9.0
mentions artificial intelligence. It appears in the subject's elaborations, from
Years 5--6 onwards: 21 elaborations name AI, and two more are about training
predictive models. (We have not searched the other learning areas.) Elaborations
are optional illustrations of a content description, so a school can meet the
curriculum without them. They are still the clearest statement of what ACARA
expects students to understand about AI.

Seven of the 23 are about AI tools in use (generating a database query,
summarising a meeting, moderating a site), and the modules don't address them.
The other sixteen ask students to understand how AI systems are trained, how
they produce output, how they fail and how they can be misused. They fall into
six themes. Codes in the table omit the `AC9TDI` prefix, and the full text of
each is in the [competency reference](#ai-elaborations).

| Theme                                  | Australian Curriculum: first band, and elaborations | New Zealand: first year | Modules                                                                                |
| -------------------------------------- | --------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------- |
| How models learn from data             | 5--6: `6P10_E3`, `8K01_E4`, `8P01_E5`, `10P02_E4`   | Year 8 (near match)     | Training, Fine-tuning and LoRA, Synthetic Data                                         |
| Generating output and prompting        | 7--8: `8P11_E5`, `8P11_E6`                          | Year 8 (near match)     | Generation, Search Sheets, Pre-trained Model Generation, Sampling, In-context Learning |
| Checking AI output                     | 5--6: `6P06_E4`, `8P08_E3`                          | Year 9                  | in part: Generation, Beam Search, Rewards                                              |
| Bias and limitations                   | 7--8: `8P01_E5`, `10P01_E6`, `10P10_E4`, `10P10_E5` | Year 10                 | Training, Fine-tuning and LoRA, Rewards, Synthetic Data                                |
| Predictive models and machine learning | 7--8: `8P02_E4`, `10P02_E4`, `10P02_E5`             | not named               | in part: Training, Fine-tuning and LoRA                                                |
| Misuse, privacy and security           | 5--6: `6P10_E3`, `8P10_E4`, `8P14_E5`, `10P13_E3`   | Year 10                 | none yet                                                                               |

The first, second and fourth themes are what the modules are for. Students train
a model from data by hand, generate from it one word at a time, and watch it
fail in ways they can trace back to the tallies. Two themes are covered in part.
The modules have students rank a model's outputs and check them against a rule,
but never against an authoritative source. And the model students build generates
text, where the curriculum's examples of machine learning are classifiers.
Nothing in the modules yet addresses misuse, privacy and security.

On prompting, the modules explain why the text already on the page steers what a
model writes next. They don't practise writing prompts for a commercial tool.

Two earlier elaborations describe predictive text without calling it AI: using
autocomplete features such as predictive text in messaging apps
(`AC9TDI4P06_E4`, Years 3--4), and judging the tone of text generated using
autocomplete (`AC9TDI6P07_E5`, Years 5--6). Predicting the next word from the
words before it is what the model in Training and Generation does, so these are
the earliest curriculum hooks for those two modules. Both sit under content
descriptions about using digital tools, not about how the tools work.

### New Zealand

New Zealand's proposed Technology curriculum for Years 0--10 (the National
Curriculum Statement dated September 2026) puts AI in its required teaching
statements from Year 7. By Year 8 students learn that "AI technologies can
produce different outputs depending on the data and instructions they are
given". The table's New Zealand column gives the first year each theme appears;
"near match" means the statement covers the theme without naming training or
prompts. The curriculum does not name large language models or generative
models, and does not treat predictive models as a topic of their own.

Digital devices are not required in Years 0--5, and the computational thinking
content is written to be taught with or without them. The curriculum is required
from January 2027 for Years 9--10 and from January 2029 for Years 0--8. The
September 2026 text will be replaced by the gazetted version, so check year
levels against the final document.

Year numbers differ between the two countries. Australia's Foundation year lines
up with New Zealand's Year 1, so an Australian Year 7 is roughly a New Zealand
Year 8, and the two columns of the table can't be compared at face value. We
have not mapped the modules to New Zealand's statements one by one.

## Per-module mappings

Each module gets a card with: year band, primary codes, secondary codes, general
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
  - `AC9M5ST01` / `AC9M6ST01` (statistics strand) --- acquire and represent
    categorical data, and describe its distribution.
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

### [Beam Search](https://www.llmsunplugged.org/modules/beam-search/)

Keep several candidate sentences alive, score each by its probability, and
compare the most likely sentence with greedy generation.

- **Best fit:** Years 9--10
- **Primary**
  - `AC9M9P01` --- list all outcomes for compound events using lists, tree
    diagrams and tables (each beam is a branch, its score a compound
    probability).
  - `AC9TDI8P06` --- trace algorithms to predict output for a given input.
- **Secondary**
  - `AC9TDI10P05` --- design algorithms involving logical operators and
    represent them as flowcharts and pseudocode.
- **General capabilities:** Critical and Creative Thinking (Inquiring,
  Analysing); Numeracy.

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

### [In-context Learning](https://www.llmsunplugged.org/modules/in-context-learning/)

Two rules that read the page already written. Induction finds the last time the
current word appeared and copies what followed, which completes a pattern the
model never trained on. Memory leans toward recently used words, which keeps the
text on topic.

- **Best fit:** Years 7--10 (the induction rule suits 9--10)
- **Primary**
  - `AC9TDI8P03` --- model and query the attributes of objects and events using
    structured data (the running memory list).
  - `AC9TDI8P09` --- implement, modify and debug programs involving control
    structures and functions (the two rules, laid over generation).
  - `AC9TDI8P06` / `AC9TDI10P06` --- trace algorithms to predict output, and
    validate by comparing output against test cases (the pattern-completion
    check).
- **Secondary**
  - `AC9M9P02` --- calculate relative frequencies from collected data to
    estimate probabilities (the memory boost changes the frequencies the roll is
    made on).
  - `AC9TDI10P03` --- model and query entities and their relationships using
    structured data.
- **General capabilities:** Critical and Creative Thinking (Inquiring,
  Analysing); Digital Literacy.

### [Word Embeddings](https://www.llmsunplugged.org/modules/word-embeddings/)

Treat each word's row in the bigram grid as a vector; measure similarity.

- **Best fit:** Years 9--10
- **Primary**
  - `AC9M10SP02` --- interpret networks and network diagrams used to represent
    relationships in practical situations. An embedding space _is_ a
    relationship diagram.
  - `AC9TDI10K02` --- represent documents online as content (text), structure
    (markup) and presentation (styling), and explain why such representations
    are important.
  - `AC9TDI10P03` --- model and query entities and their relationships using
    structured data.
- **Secondary**
  - `AC9E9LA08` --- vocabulary choices and meaning.
- **General capabilities:** Numeracy; Critical and Creative Thinking
  (Generating > Considering alternatives).

### [Fine-tuning and LoRA](https://www.llmsunplugged.org/modules/fine-tuning/)

Shift a trained base model toward a new text three ways: tally it in, keep it on
an adapter sheet, and squeeze the adapter into low-rank strips. Then turn up a
flattering adapter and measure how much flattery each strength produces.

- **Best fit:** Years 9--10
- **Primary**
  - `AC9TDI10P08` --- generate, modify, communicate and critically evaluate
    alternative designs (fine-tune in place, adapter sheet or strips).
  - `AC9TDI10P06` --- validate algorithms and programs by comparing output
    against a range of test cases.
  - `AC9TDI8P02` / `AC9TDI10P02` --- analyse and visualise data to draw
    conclusions and make predictions (the flattering adapter's dose-response,
    plotted on the board).
- **Secondary**
  - `AC9TDI10P09` --- implement, modify and debug modular programs.
  - `AC9E10LY03` --- analyse and evaluate how language features are used to
    implicitly or explicitly represent values, beliefs and attitudes.
- **General capabilities:** Critical and Creative Thinking; Ethical
  Understanding (Understanding ethical concepts > Examining values).

### [Synthetic Data](https://www.llmsunplugged.org/modules/synthetic-data/)

Run two relays side by side: one where each link trains a fresh model on the
last link's output, and one where every link adds its output to the same sheet,
on top of the real text. Compare what each model can still say.

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

### [Rewards](https://www.llmsunplugged.org/modules/rewards/)

Tune the same model toward the same goal with a human panel at one table and a
rule card at the other, watch the rule get gamed, then let the room's thumbs-up
votes teach a model to flatter.

- **Best fit:** Years 9--10
- **Primary**
  - `AC9TDI10P10` --- evaluate solutions against design criteria, possible
    future impact and opportunities for enterprise.
  - `AC9TDI8P10` --- evaluate existing and student solutions against the design
    criteria and possible future impact.
  - `AC9TDI10P06` --- validate algorithms and programs by comparing their output
    against a range of test cases (the rule card is an automatic test, and the
    rule table shows what it misses).
- **Secondary**
  - `AC9M9P02` --- calculate relative frequencies from collected data to
    estimate probabilities (pass rates before and after the rounds).
- **General capabilities:** Ethical Understanding (Decision-making and actions);
  Critical and Creative Thinking (Reflecting > Thinking about thinking).

## Coverage summary by strand

### Digital Technologies

Most concentrated coverage. Across the module set, students engage substantively
with these strands:

- **Knowledge and understanding > Representation of data**: covered by Training,
  More Context, In-context Learning, Word Embeddings.
- **Processes and production skills > Acquiring, storing and validating data**:
  Training, Synthetic Data.
- **Processes and production skills > Analysing and visualising data**:
  Training, Fine-tuning and LoRA.
- **Processes and production skills > Defining problems**: Pre-trained
  Generation, Sampling.
- **Processes and production skills > Designing and tracing algorithms**:
  Generation, Sampling, Beam Search.
- **Processes and production skills > Implementing programs**: Generation, More
  Context, In-context Learning, Agentic AI, Fine-tuning and LoRA.
- **Processes and production skills > Evaluating solutions**: Rewards,
  Synthetic Data, Fine-tuning and LoRA.

The set does **not** substantively cover: networks and protocols, cyber security
threat models (including the misuse of AI systems), user-interface design, or
project management. Those content descriptions still need a separate teaching
vehicle.

### Mathematics

- **Probability (Years 5--10)**: Weighted Randomness, Generation, Sampling, Beam
  Search, More Context, In-context Learning, Rewards.
- **Statistics (Years 5--8)**: Training (categorising and describing data).
- **Number / Algebra**: light touch only.
- **Space**: only via Word Embeddings (vectors and distance).

### English

- **Language strand** (vocabulary): a light touch only --- the materials no
  longer include a dedicated sentence-structure vehicle; Training (specialist
  vocabulary) and Word Embeddings (vocabulary and meaning) contribute.
- **Literature / Literacy strands**: light touch, mostly through critical
  analysis of generated vs. source text in Generation, Fine-tuning and LoRA
  (the flattering adapter) and Synthetic Data.

## General capabilities

LLMs Unplugged is unusually rich in GC coverage because the activities require
students to _do_ the thinking, not just learn about it.

- **Digital Literacy** --- the entire course is an extended worked example of
  "managing and operating" digital systems concepts without screens, with
  particular strength in _Investigating > Locate, generate and access data_ and
  _Managing and operating > Manage content, data and information_.
- **Critical and Creative Thinking** --- _Inquiring_, _Generating ideas,
  possibilities and actions_, _Analysing, synthesising and evaluating reasoning
  and procedures_, and _Reflecting_ are all exercised across the module
  sequence.
- **Numeracy** --- _Recognising and using patterns and relationships_,
  _Interpreting and representing data_, and _Using probabilistic thinking_
  underpin the fundamentals modules.
- **Literacy** --- _Composing texts_ (generated output) and _Comprehending
  texts_ (source corpus selection and analysis) are present throughout.
- **Ethical Understanding** --- Rewards, Fine-tuning and LoRA's flattering
  adapter, and Synthetic Data are designed to surface ethical issues around
  training data, rewards and feedback, and where data comes from.

## Suggested programs

Three concrete sequences that an administrator could slot into a year-long
program.

### Year 5--6: "How computers make text" (4 modules, ~5 hours)

1. Weighted Randomness --- `AC9M6P02`
2. Training --- `AC9TDI6P05`
3. Generation --- `AC9M6P02`, `AC9TDI6P05`
4. Pre-trained Model Generation --- `AC9TDI6P05`

Sits cleanly in a Digital Technologies unit on data representation and
algorithms; Mathematics teacher can co-teach the probability components.

### Year 7--8 Digital Technologies: "Data and AI" (6 modules, ~8 hours)

1. Weighted Randomness
2. Training --- `AC9TDI8P01`, `AC9TDI8P02`
3. Generation --- `AC9TDI8P06`
4. Sampling --- `AC9TDI8P05`
5. More Context --- `AC9TDI8P03`, `AC9TDI8P09`
6. In-context Learning --- `AC9TDI8P03`, `AC9TDI8P09`

Delivers most of the "Data and information" knowledge band plus the
algorithm-design content descriptions for Years 7--8.

### Year 9--10 cross-curricular: "Understanding AI" (5 modules, ~7 hours)

1. More Context (recap, if not previously seen)
2. Word Embeddings --- `AC9TDI10K02`, `AC9TDI10P03`
3. Synthetic Data --- `AC9TDI10P10`, `AC9TDI10P01`
4. Fine-tuning and LoRA, with the flattering adapter --- `AC9TDI10P08`,
   `AC9TDI10P02` + Ethical Understanding
5. Rewards --- `AC9TDI10P10`, `AC9TDI10P06` + Ethical Understanding

Co-teach with English (analysing language and values) and HASS / Civics (data
ethics and decision-making).

## Competency reference

Every code cited above, grouped by learning area and strand, in ACARA's wording.
Codes follow the ACARA v9 pattern: `AC9` + learning area (`M` Mathematics, `TDI`
Digital Technologies, `E` English) + year level + strand (`P` probability, `ST`
statistics, `SP` space, `K` knowledge, `LA` language, `LY` literacy) + sequence
number. An elaboration adds `_E` and its position under the content description.

### Mathematics

Probability:

- `AC9M5P02` (Year 5) --- conduct repeated chance experiments including those
  with and without equally likely outcomes, observe and record the results; use
  frequency to compare outcomes and estimate their likelihoods.
- `AC9M6P01` (Year 6) --- recognise that probabilities lie on numerical scales
  of 0--1 or 0%--100% and use estimation to assign probabilities that events
  occur in a given context, using common fractions, percentages and decimals.
- `AC9M6P02` (Year 6) --- conduct repeated chance experiments and run
  simulations with an increasing number of trials using digital tools; compare
  observations with expected results and discuss the effect on variation of
  increasing the number of trials.
- `AC9M7P01` (Year 7) --- identify the sample space for single-stage events;
  assign probabilities to the outcomes of these events and predict relative
  frequencies for related events.
- `AC9M7P02` (Year 7) --- conduct repeated chance experiments and run
  simulations with a large number of trials using digital tools; compare
  predictions about outcomes with observed results, explaining the differences.
- `AC9M8P02` (Year 8) --- determine all possible combinations for 2 events,
  using two-way tables, tree diagrams and Venn diagrams, and use these to
  determine probabilities of specific outcomes in practical situations.
- `AC9M9P01` (Year 9) --- list all outcomes for compound events both with and
  without replacement, using lists, tree diagrams, tables or arrays; assign
  probabilities to outcomes.
- `AC9M9P02` (Year 9) --- calculate relative frequencies from given or collected
  data to estimate probabilities of events involving "and", inclusive "or" and
  exclusive "or".

Statistics:

- `AC9M5ST01` (Year 5) --- acquire, validate and represent data for nominal and
  ordinal categorical and discrete numerical variables, to address a question of
  interest or purpose using software including spreadsheets; discuss and report
  on data distributions in terms of highest frequency (mode) and shape, in the
  context of the data.
- `AC9M6ST01` (Year 6) --- interpret and compare data sets for ordinal and
  nominal categorical, discrete and continuous numerical variables using
  comparative displays or visualisations and digital tools; compare
  distributions in terms of mode, range and shape.

Space:

- `AC9M10SP02` (Year 10) --- interpret networks and network diagrams used to
  represent relationships in practical situations and describe connectedness.

### Digital Technologies

Knowledge and understanding:

- `AC9TDI6K03` (Years 5--6) --- explain how digital systems represent all data
  using numbers.
- `AC9TDI8K01` (Years 7--8) --- explain how hardware specifications affect
  performance and select appropriate hardware for particular tasks and
  workloads.
- `AC9TDI10K02` (Years 9--10) --- represent documents online as content (text),
  structure (markup) and presentation (styling) and explain why such
  representations are important.

Processes and production skills:

- `AC9TDI6P05` (Years 5--6) --- implement algorithms as visual programs
  involving control structures, variables and input.
- `AC9TDI8P01` (Years 7--8) --- acquire, store and validate data from a range of
  sources using software, including spreadsheets and databases.
- `AC9TDI8P02` (Years 7--8) --- analyse and visualise data using a range of
  software, including spreadsheets and databases, to draw conclusions and make
  predictions by identifying trends.
- `AC9TDI8P03` (Years 7--8) --- model and query the attributes of objects and
  events using structured data.
- `AC9TDI8P05` (Years 7--8) --- design algorithms involving nested control
  structures and represent them using flowcharts and pseudocode.
- `AC9TDI8P06` (Years 7--8) --- trace algorithms to predict output for a given
  input and to identify errors.
- `AC9TDI8P09` (Years 7--8) --- implement, modify and debug programs involving
  control structures and functions in a general-purpose programming language.
- `AC9TDI8P10` (Years 7--8) --- evaluate existing and student solutions against
  the design criteria, user stories and possible future impact.
- `AC9TDI8P14` (Years 7--8) --- investigate and manage the digital footprint
  existing systems and student solutions collect and assess if the data is
  essential to their purpose.
- `AC9TDI10P01` (Years 9--10) --- develop techniques to acquire, store and
  validate data from a range of sources using software, including spreadsheets
  and databases.
- `AC9TDI10P02` (Years 9--10) --- analyse and visualise data interactively using
  a range of software, including spreadsheets and databases, to draw conclusions
  and make predictions by identifying trends and outliers.
- `AC9TDI10P03` (Years 9--10) --- model and query entities and their
  relationships using structured data.
- `AC9TDI10P05` (Years 9--10) --- design algorithms involving logical operators
  and represent them as flowcharts and pseudocode.
- `AC9TDI10P06` (Years 9--10) --- validate algorithms and programs by comparing
  their output against a range of test cases.
- `AC9TDI10P08` (Years 9--10) --- generate, modify, communicate and critically
  evaluate alternative designs.
- `AC9TDI10P09` (Years 9--10) --- implement, modify and debug modular programs,
  applying selected algorithms and data structures, including in an
  object-oriented programming language.
- `AC9TDI10P10` (Years 9--10) --- evaluate existing and student solutions
  against the design criteria, user stories, possible future impact and
  opportunities for enterprise.

#### AI elaborations

The sixteen elaborations in the
[AI themes table](#artificial-intelligence-in-the-curriculum), each given up to
its "for example".

- `AC9TDI6P06_E4` (Years 5--6) --- verifying the correctness of AI-generated
  content against information known to be factually accurate.
- `AC9TDI6P10_E3` (Years 5--6) --- understanding the implications of how
  personal data can be used to train generative AI models.
- `AC9TDI8K01_E4` (Years 7--8) --- explaining how the specifications of
  components in a system impact the speed with which AI models can be trained.
- `AC9TDI8P01_E5` (Years 7--8) --- ensuring that the data used to train an AI
  model minimises any potential biases in its output and is representative of
  the target audience.
- `AC9TDI8P02_E4` (Years 7--8) --- comparing the analysis performed by a trained
  predictive AI model with other analysis techniques.
- `AC9TDI8P08_E3` (Years 7--8) --- comparing multiple outputs from a generative
  model to determine the most suitable.
- `AC9TDI8P10_E4` (Years 7--8) --- discussing the risks and consequences of
  AI-generated content on social media platforms.
- `AC9TDI8P11_E5` (Years 7--8) --- using effective prompts with generative AI
  models to create output that is better suited to the problem being solved.
- `AC9TDI8P11_E6` (Years 7--8) --- using a progressive series of prompts with
  generative models to refine output to improve its correctness.
- `AC9TDI8P14_E5` (Years 7--8) --- explaining the risks associated with sharing
  personal data due to the ease with which generative AI models can create new
  content.
- `AC9TDI10P01_E6` (Years 9--10) --- considering how training data issues such
  as the zero problem dictate the output from predictive models.
- `AC9TDI10P02_E4` (Years 9--10) --- exploring machine learning, a form of
  artificial intelligence where an algorithm is trained using a data set.
- `AC9TDI10P02_E5` (Years 9--10) --- adjusting parameters of an AI model to
  observe the impact of different factors on predicted outcomes.
- `AC9TDI10P10_E4` (Years 9--10) --- examining the unintended consequences of an
  image generation solution implemented using AI.
- `AC9TDI10P10_E5` (Years 9--10) --- considering the complexities associated
  with training predictive models to capture events that occur with low
  probability.
- `AC9TDI10P13_E3` (Years 9--10) --- explaining how techniques like prompt
  injection can change the intended behaviour of generative AI models.

The seven about AI tools in use, which the modules don't address, are
`AC9TDI8P02_E3`, `AC9TDI8P12_E5`, `AC9TDI10P08_E3`, `AC9TDI10P10_E1`,
`AC9TDI10P11_E1`, `AC9TDI10P11_E5` and `AC9TDI10P12_E6`.

The two about predictive text, which don't name AI:

- `AC9TDI4P06_E4` (Years 3--4) --- using autocomplete features in text authoring
  tools.
- `AC9TDI6P07_E5` (Years 5--6) --- judging the tone and appropriateness for the
  intended audience of text generated using autocomplete.

### English

Language:

- `AC9E5LA03` (Year 5) --- describe how spoken, written and multimodal texts use
  language features and are typically organised into characteristic stages and
  phases, depending on purposes in texts.
- `AC9E7LA08` (Year 7) --- investigate the role of vocabulary in building
  specialist and technical knowledge, including terms that have both everyday
  and technical meanings.
- `AC9E9LA08` (Year 9) --- analyse how vocabulary choices contribute to style,
  mood and tone.

Literacy:

- `AC9E10LY03` (Year 10) --- analyse and evaluate how language features are used
  to implicitly or explicitly represent values, beliefs and attitudes.

## Caveats and out of scope

- **Foundation to Year 4**: not currently mapped. The dice-and-grid mechanics
  are accessible to upper primary, but the content descriptions at F--4
  emphasise concrete materials, not symbolic systems; we recommend treating any
  F--4 use as enrichment rather than as primary curriculum coverage. The one
  direct hook is the Years 3--4 elaboration on predictive text
  (`AC9TDI4P06_E4`).
- **Senior secondary (11--12)**: out of scope. Some modules (especially
  Synthetic Data, Rewards, Word Embeddings) would extend naturally into the Digital
  Solutions / Software Engineering / Specialist Mathematics syllabi, but those
  syllabi are state-specific and not mapped here.
- **Assessment**: this document maps _teaching_ coverage, not assessment
  evidence. Each primary mapping above could plausibly serve as evidence, but
  the assessment task design (rubrics, work samples, moderation) is a separate
  exercise.
- **Codes checked against ACARA's published v9.0 curriculum in November 2026.**
  ACARA has added AI elaborations since v9.0 first appeared, and its
  downloadable documents (last revised in October 2024) are missing two of the
  sixteen listed here, so check the elaboration codes against the curriculum
  website, and re-check them if ACARA revises the elaborations again.

## Next steps

1. **External review** by a practising secondary DT teacher and a Mathematics
   teacher.
2. **Sample lesson plans** for each of the three suggested programs above,
   including assessment artefacts.
3. **State-level cross-references** (NESA Stage 4/5, VCAA Levels 7--10) once the
   F--10 mapping is settled.
