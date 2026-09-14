# LLMs Unplugged videos

Working notes for the explainer video series: series plan, production phases,
tone, and what each video is built from. The per-video beat sheets and scripts
are in `scripts/`; the HyperFrames compositions go in `<slug>/` next to them
(see the `llms-unplugged-video` skill for the engine and file layout). These
notes are for whoever is making the videos, not for the website.

## Series

Eight short explainer videos (1--2 minutes each): one overview, and one video
for each section of the two flagship lessons.

| Slug                     | Lesson / section                                    | Key idea                                                                                                |
| ------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `overview`               | scene-setter                                        | you can run the same next-word loop Claude or ChatGPT runs, by hand; the site has the lessons and tools |
| `training-grid`          | My First Language Model, Training                   | language models learn by counting which words follow which                                              |
| `generation-grid`        | My First Language Model, Generation                 | text is generated one word at a time by sampling from learned counts                                    |
| `pretrained-generation`  | My First Language Model, Pre-trained generation     | you can generate from a model you didn't train; follow its lookup rules                                 |
| `agentic-ai`             | My First Language Model, Agentic AI                 | an agent pauses generation, hands off to a tool, and continues with the result spliced in               |
| `generation-ledger`      | How AI writes stories (ledger), Generation          | a cup of counters does the maths: more marks, more counters, more likely                                |
| `training-ledger`        | How AI writes stories (ledger), Training            | every mark on the sheet came from somebody reading the text two words at a time                         |
| `one-story-all-together` | How AI writes stories (ledger), One story, together | pool everyone's models and the class can say things no single group's model could                       |

Each section video is played at the start of its section: it sets up the
mechanics, makes the section's key idea land, and hands off to the hands-on
activity. The Overview is the scene-setter for the website and for a teacher
deciding which lesson to run. It is evergreen: it names no lesson, age band or
running time, and its concrete examples are the materials, so it survives the
lessons changing. Its licence line says "a Creative Commons licence" and names
no clause, since whether the NC-SA terms stay is an open question. Nothing else on the site (the follow-on lessons,
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
deck backgrounds, the site's palette and fonts). Ben and Ushini record the
voice-over. No camera.

**Phase 2 (later): re-cut with footage.** When a shoot happens, Ben and Ushini
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
- each _Visual:_ direction names the real artefact the participant will hold
  (the grid, a booklet page, a ledger sheet, the cup) and describes what the
  viewer sees happen to it. It does not name a deck widget: the deck's
  components are not the video's building blocks (see "Visuals").

Re-cutting: a script, its composition and its VO takes are versioned together.
The script and composition live here; VO takes, footage and renders are binaries
and live in the bucket under `video/<slug>/`, never in git. A tweak to a line is
a commit here, a re-record of that line, and a re-render.

## Tone and narrative

**Warm authority.** Think Masterclass, not lecture theatre. Ben and Ushini are
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

**Naming models.** Where a real product is named, name both: "Claude or
ChatGPT" (or "Claude, ChatGPT"), never ChatGPT alone. Everywhere else say "AI
language models" or "large language models".

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

## Format

Masters are 4K at 50 fps (`--resolution landscape-4k --fps 50`; the
composition stays 1920x1080 and Chrome renders at double DPR). 4K because the
content is vector and YouTube gives 4K uploads a better codec and bitrate even
for 1080p viewers; 50 fps because it smooths the camera moves and matches the
50p the phase-2 footage is shot at, so animation and footage share one frame
grid. Iterate at 1080p25 with `--quality draft`; render 4K50 only for a cut
that will be kept.

All eight masters are 16:9: the section videos play on a classroom TV or
projector and as YouTube embeds, and the deck widgets and sheets they are built
from are laid out for that canvas. Square would be pillarboxed on the TV and
still not native in a phone feed, so it is not made.

The Overview is the one video that is short-form content people will meet on a
phone, so it gets a portrait (9:16) variant as well (`--resolution portrait-4k`). That variant is the same
composition with an aspect parameter and restacked layout, not a crop of the
landscape render, so the Overview's beats must not depend on side-by-side
placement. The phase-2 footage is shot so the to-camera lines survive a centre
crop; the shoot brief is in Ben's notes.

## Visuals

The videos are not the slide decks with a voice-over. In the room the decks
work because a presenter points, traces a row with a finger, holds up the
sheet, waves at the cup. None of that is available here, so the composition
has to do the pointing itself, and the visual language is free to be
reimagined for that. The deck components are a source of truth for _what_ is
shown, not _how_:

- **same example, same objects.** The video shows the see spot run grid, the
  Dick and Jane rows, the real booklet page, so the thing on screen is the
  thing in the participant's hands. Take the data from the decks
  (`website/src/decks/examples.ts`, the `ROW_*` constants, which must match the
  real sheets) and the site's palette and fonts, and build the visuals fresh.
- **motion replaces gesture.** Where the presenter would point, the frame
  moves: the camera pushes in on the cell, the rest of the grid dims, the pair
  of words lifts out of the sentence and drops into the cell as a tally. Say
  what the viewer is looking at and make the frame agree.
- **the participant's view.** Prefer the seat at the table (sheet, pencil, cup,
  booklet, flat and top-down) over the presenter's view of a slide. The section
  videos hand off to a physical activity; previewing the physical action is
  the hand-off.
- **one example followed all the way through**, as the decks already do.
- **built to the engine's strengths.** Flat vector, transforms and opacity,
  stroke draw-on, cuts; no physics, blur, slow creeps or photographic texture.
  The skill's "What this pipeline renders well" is the list; a beat that needs
  something off it gets a different beat.

Renderable material that does exist in the repo and is worth reusing as
texture rather than layout: the CLI-rendered booklet pages and ledger sheets,
the deck backgrounds, the fonts and palette.

## Captions

Every video has open captions baked into the composition, for accessibility
(a classroom TV has no caption toggle) and because the tone rules already make
each script line a caption: one thing on screen per line. The caption is the
script line, shown whole for the duration of that line, in the site's type and
palette, in a caption region the layout reserves so it never covers the grid
or sheet. No speaker marking, no colour by voice, no word-by-word highlighting.

Timing comes from the VO takes by forced alignment against the script text, so
re-recording a line re-times its caption with no hand work. The same timing
data writes a WebVTT sidecar for YouTube and the site's embeds, so closed
captions exist alongside the open ones.

## Phase-2 shoot questions

- one home framing for the to-camera lines, and whether Ben and Ushini share a
  shot or cut between two setups
- whether the materials (grid, booklet, ledger sheets, cup) are in shot for the
  opening and closing lines
- whether the closing "your turn" beat gets a different energy or framing
  (wider, holding up the materials)
