# First series (v1)

The first eight explainer videos (TASK-154), bound to the slides' own
walkthroughs. `../README.md` is the current series; everything there on tone,
production, captions, format and visuals applies here too, and `../STYLE.md` and
`../_kit/` are shared. The tools take `v1/<slug>`
(`video.py render v1/training-grid`, scripts in `v1/scripts/`), and renders go
under `out/video/v1/<slug>/` and the bucket's `video/v1/<slug>/`.

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
no clause, so a licence change doesn't date it. Nothing else on the site (the
follow-on lessons, the standalone modules) gets a video.

The series is deliberately small: one video per section of the two lessons that
are actually run, so every video has a slide deck, a printed pack and a room
trial behind it. Key ideas are the module `keyIdea` frontmatter in
`website/src/content/modules/`; the walkthroughs follow the deck partials in
`website/src/decks/partials/` (the _hop joey hop_ grid, the magpie ledger
chain), so a video shows the same example the slides show.
