# LLMs Unplugged videos

Working notes for the explainer video series: series plan, production phases,
tone, and what each video is built from. The per-video beat sheets and scripts
are in `scripts/`; the HyperFrames compositions go in `<slug>/` next to them
(see the `llms-unplugged-video` skill for the engine and file layout). These
notes are for whoever is making the videos, not for the website.

## Series

Eight short explainer videos (1--2 minutes each): one overview, and one video
for each section of the two flagship lessons.

| Slug                     | Lesson / section                                    | Key idea                                                                                  |
| ------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `overview`               | scene-setter                                        | you can run the same next-word loop ChatGPT runs, by hand; two lessons do it              |
| `training-grid`          | My First Language Model, Training                   | language models learn by counting which words follow which                                |
| `generation-grid`        | My First Language Model, Generation                 | text is generated one word at a time by sampling from learned counts                      |
| `pretrained-generation`  | My First Language Model, Pre-trained generation     | you can generate from a model you didn't train; follow its lookup rules                   |
| `agentic-ai`             | My First Language Model, Agentic AI                 | an agent pauses generation, hands off to a tool, and continues with the result spliced in |
| `generation-ledger`      | How AI writes stories (ledger), Generation          | a cup of counters does the maths: more marks, more counters, more likely                  |
| `training-ledger`        | How AI writes stories (ledger), Training            | every mark on the sheet came from somebody reading the text two words at a time           |
| `one-story-all-together` | How AI writes stories (ledger), One story, together | pool everyone's models and the class can say things no single group's model could         |

Each section video is played at the start of its section: it sets up the
mechanics, makes the section's key idea land, and hands off to the hands-on
activity. The Overview is the scene-setter for the website and for a teacher
deciding which lesson to run. Nothing else on the site (the follow-on lessons,
the standalone modules) gets a video.

The series is deliberately small: one video per section of the two lessons that
are actually run, so every video has a slide deck, a printed pack and a room
trial behind it. Key ideas are the module `keyIdea` frontmatter in
`website/src/content/modules/`; the walkthroughs follow the deck partials in
`website/src/decks/partials/` (the _see spot run_ grid, the Dick and Jane ledger
chain), so a video shows the same example the slides show.

## Production

Two phases, one set of scripts.

**Phase 1 (now): animation plus voice-over.** Each video is a HyperFrames
composition in `ops/video/<slug>/`, assembled from the project's own material
(the deck widgets, the printed sheets and booklets rendered from the CLI, the
deck backgrounds, the site's palette and fonts). Ben and Eddie record the
voice-over. No camera.

**Phase 2 (later): re-cut with footage.** When a shoot happens, Ben and Eddie
deliver the to-camera lines and the phase-1 cut is re-edited with that footage;
the animation beats stay as they are. Production context and status for the
shoot live in Ben's notes, not here.

What this means for the scripts:

- every line must work as pure voice-over. Nothing can depend on a presenter
  being visible, holding something up, or pointing.
- lines that would carry better on camera are tagged **(TC)** after the speaker.
  Phase 1 renders them as voice-over anyway; phase 2 is where they get a face.
  Roughly the opening hook and the closing hand-off of each video, and little
  else.
- each _Visual:_ direction names a real artefact (a deck widget, a sheet, a
  booklet page) so the composition can be built from it rather than invented.

Re-cutting: a script, its composition and its VO takes are versioned together.
The script and composition live here; VO takes, footage and renders are binaries
and live in the bucket under `video/<slug>/`, never in git. A tweak to a line is
a commit here, a re-record of that line, and a re-render.

## Tone and narrative

**Warm authority.** Think Masterclass, not lecture theatre. Ben and Eddie are
sharing something they genuinely find fascinating, not teaching down. The vibe
is "let me show you something cool" rather than "today we will learn about..."
Conversational, direct, occasionally self-aware ("you might be thinking this
sounds too simple---stick with me").

**Two voices, one thread.** Handoffs are rhythmic, not topical. One opens a
beat, the other lands it; one makes the claim, the other grounds it; one sets
up, the other pays off. Both are equally knowledgeable---the split is about
where in the beat each voice sits, not who knows what. Avoid making one the
"expert" and the other the "student asking questions."

**Written for the ear.** Short sentences. One thing on screen per line. Say what
the viewer is looking at ("the row for _see_") rather than gesturing at it. If a
sentence needs a hand wave to make sense, rewrite it.

**Demystify, don't simplify.** The whole project premise is that LLMs aren't
magic. The scripts should make viewers feel smarter, not patronised. Use precise
language (say "bigram model" not "simple AI") but always anchor it in the
physical activity ("the grid you just filled in _is_ the model").

**Show, don't tell (literally).** Every concept claim should map to an
animation. "LLMs exploit patterns in text" is an assertion; showing the grid
filling up as you count word pairs is a demonstration. The to-camera lines set
up _why_ something matters; the animated segments show _how_ it works.

**Stakes before mechanics.** Each video opens with why this matters---a
question, a surprising claim, a connection to real-world AI---before getting
into the setup.

**Land one key idea per video.** The video should make its key idea land
viscerally, not just state it. Everything else is setup or reinforcement.

## Distribution

The videos serve two purposes. First, they're punchy YouTube videos embedded on
the module and lesson pages of the website. Second, they're classroom intro
videos: a teacher who isn't confident delivering the explanation themselves can
play the video to set up the section, then facilitate the hands-on work. The
Overview is a scene-setter (not played in class); the section videos need to
work as standalone explainers _and_ as warm-ups that hand off to the physical
activity.

## Composition sources

What each phase-1 video is built from. All of it exists in the repo already.

- **Overview**: the grid and ledger walkthrough widgets (below), the two decks'
  hero backgrounds, the train → generate loop, the scaling-up section's
  `GridZoom` and `ModelScaleBars`.
- **Training and Generation (grid)**: `StaticGrid` and `StaticGeneration` with
  the deck's `EXAMPLE_*` data (`website/src/decks/examples.ts`), so the video's
  grid is the slides' grid.
- **Pre-trained generation**: `StaticPretrainedGeneration` and a rendered
  booklet page (diamonds, thresholds) from the CLI.
- **Agentic AI**: `StaticPretrainedGeneration` for the roll, a phone-message
  overlay for the tool call, the deck's tool-use backgrounds.
- **Ledger videos**: `LedgerSheet`, `LedgerRow`, `LedgerCup`, `LedgerPage`,
  `LedgerTraining`, `LedgerSheets` with the Dick and Jane rows the deck uses
  (`ROW_SEE`, `ROW_IT`, `ROW_GO`, `ROW_UP`, `ROW_COMMA`, `ROW_DOWN`,
  `ROW_COMES`) and the five `ROW_THE_*` rows for the finale. Deck rows must be
  the real sheets' rows; regenerate the set and re-read the constants.

## Phase-2 shoot questions

- one home framing for the to-camera lines, and whether Ben and Eddie share a
  shot or cut between two setups
- whether the materials (grid, booklet, ledger sheets, cup) are in shot for the
  opening and closing lines
- whether the closing "your turn" beat gets a different energy or framing
  (wider, holding up the materials)
