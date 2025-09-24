#import "utils.typ": *

#show: module-doc.with(title: [Sampling Strategies])

Even after your model is trained, you have creative control over how it
generates text.

== You will need

- a completed model from an earlier module

== Key idea

There are lots of different sampling strategies---ways to select the next word
during generation. Each strategy serves a different purpose, from maximising
accuracy to embracing chaos, from creating structured poetry to mimicking child
speech. Understanding these strategies reveals how modern LLMs control their
output style.

== Algorithm

The same trained model can produce scholarly essays or wild poetry just by
changing how you sample from it. This involves two key mechanisms:

- *temperature* controls the randomness by adjusting the relative likelihood of
  probable vs improbable tokens (flattening or sharpening the probability
  distribution)
- *truncation* techniques that narrow the viable token pool by setting some
  tokens' probabilities to zero (e.g., top-k, top-p, or constraint-based
  filtering)

=== Temperature Control

Take your tally counts and divide them by a temperature factor:

*Example*: if the counts in a given row are

- `spot` (4)
- `run` (2)
- `jump` (1)
- `.` (1)

+ *temperature = 1 (normal)*: use original tallies
  - use counts as-is: 4, 2, 1, 1
  - roll d8: 1-4→`spot`, 5-6→`run`, 7→`jump`, 8→`.`
  - strong preference for `spot`
  - most faithful to training data
+ *temperature = 2 (warmer)*: divide tallies by 2, round down (min 1)
  - divide by 2 (round down, min 1): 2, 1, 1, 1
  - roll d5: 1-2→`spot`, 3→`run`, 4→`jump`, 5→`.`
  - less bias toward `spot`
  - more balanced probabilities
+ *temperature = 3 (hot)*: divide tallies by 3, round down (min 1)
  - divide by 3 (round down, min 1): 1, 1, 1, 1
  - roll d4: 1→`spot`, 2→`run`, 3→`jump`, 4→`.`
  - completely uniform!
  - nearly uniform random selection

The division naturally flattens probability differences:

- common words (high tallies) become less dominant
- rare words (low tallies) get relatively more chance
- rounding creates the non-linearity that makes temperature effective
- at high temperatures, everything approaches equal probability

The larger the temperature value, the more random your selection becomes!

=== Truncation Strategies

==== 1. Weighted random sampling (standard)

This is what you learned in Basic Inference - the foundation all others build
upon. It's useful for general text generation that mirrors training data
patterns.

+ find current word's row in model
+ roll d20 proportional to tally marks
+ select next word based on roll
+ repeat with new word

==== 2. Greedy sampling (temperature → 0)

Always choose the most likely next word. No dice needed! This produces maximum
coherence and predictable output.

+ find current word's row
+ pick the word with most tally marks
+ if tie, pick first alphabetically
+ repeat deterministically

*In temperature terms*: This is like dividing by 0.001 - the highest tally
dominates completely

==== 3. Haiku sampling

Constrain generation to fit the 5-7-5 syllable pattern of haiku poetry. This
creates structured poetry with syllable constraints.

+ track syllables in current line (5-7-5 pattern)
+ roll d20 as normal
+ if selected word exceeds line's syllable limit, re-roll
+ start new line when syllable count reached

==== 4. No-repeat sampling

Never use the same word twice in a sentence. This forces vocabulary diversity
and avoids repetitive loops.

+ track all words used in current sentence
+ roll d20 as normal
+ if word already used, re-roll
+ if no valid options remain, start new sentence

==== 5. Non-sequitur sampling

Always choose the LEAST likely next word for maximum surprise. Perfect for
surrealist poetry, breaking expectations, and comedy.

+ find current word's row
+ pick word with FEWEST tally marks
+ if tie, roll d20 among least likely options
+ embrace the chaos!

==== 6. Two-year-old sampling

Prefer short, simple words to mimic child speech patterns. Useful for generating
simple text and educational materials.

+ from available next words, group by syllable count
+ always prefer one-syllable words if available
+ otherwise choose from shortest available
+ roll d20 within selected group

==== 7. Poetry slam sampling (rhyme-seeking)

Favour words that rhyme with recent words for musical effect. Great for beat
poetry, rap battles, and rhythmic text.

+ remember last 2-3 words generated
+ check if any next-word options rhyme with them
+ if rhymes exist, sample ONLY from rhyming words
+ otherwise use standard sampling

==== 8. Alliteration sampling

Prefer words starting with the same sound. Perfect for tongue twisters and
memorable phrases.

+ note first letter/sound of previous word
+ if any next-word options start with same letter
+ sample only from those alliterative options
+ otherwise use standard sampling

==== 9. Beam search (keeping multiple paths)

Instead of committing to one word at a time, maintain multiple possible
sequences and choose the best overall path. This finds the most likely complete
sentence and avoids dead ends.

+ start with your initial word
+ generate top 3 most likely next words (keep all 3 paths)
+ for each path, generate its top 3 continuations (now 9 paths)
+ keep only the 3 paths with highest total probability
+ repeat until reaching desired length
+ select the path with best overall score

This avoids getting stuck with a high-probability first word that leads nowhere
good!

=== Combining Strategies

Advanced technique: Blend multiple strategies!

- *haiku + temperature 3*: wild but structured poetry (using temperature control
  from above)
- *no-repeat + alliteration*: diverse but musical
- *two-year-old + temperature 1*: simple words, faithful to training data
  (normal temperature)

== Example

Generate the same prompt with different strategies:

*Prompt*: "run"

+ *standard*: "run spot run see spot"
+ *greedy*: "run run run run" (if it's most common)
+ *non-sequitur*: "run yesterday purple when"
+ *two-year-old*: "run fast go see"

Compare results - which strategy creates the most interesting text for different
purposes?
