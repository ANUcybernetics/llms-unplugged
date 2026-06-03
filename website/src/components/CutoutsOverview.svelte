<script lang="ts">
  import { tokenColorClass, tokenColorIndex } from "../lib/tokenColors";

  type Mode = "tokens" | "example" | "flow" | "scatter" | "hunt";
  type HuntStage = "start" | "all" | "colour" | "word" | "pick";

  interface Props {
    /** Space-separated, already-preprocessed token stream. */
    tokens: string;
    /**
     * What to render:
     *   tokens  — the running text as coloured tokens
     *   example — the text with one adjacent pair highlighted, shown above the
     *             single cutout that pair produces
     *   flow    — every adjacent pair as a cutout, in reading order
     *   scatter — every cutout shuffled, tilted and jittered, as if tipped out
     *             onto the table; deterministic per `seed`
     *   hunt    — one step of generation: the seeded scatter pile with a
     *             current cutout above it, narrowing per `stage` from the whole
     *             pile to a colour scan to the exact-word matches to one pick
     */
    mode?: Mode;
    /**
     * For mode="example", the pair to highlight written as the two words
     * "prev next" (e.g. "green eggs"). Defaults to the first pair if no match.
     */
    highlight?: string;
    /**
     * For mode="scatter" and "hunt", the shuffle seed. The same seed always
     * produces the same scatter (so rebuilds and the PDF match the screen);
     * change it between slides to make the cutouts look reshuffled.
     */
    seed?: number;
    /**
     * For mode="hunt", the current word we're matching --- the pile narrows to
     * cutouts whose previous-word box is this word.
     */
    target?: string;
    /**
     * For mode="hunt", the just-placed cutout shown above the pile, written as
     * "prev next" (e.g. "eggs and"). Its next word should equal `target`.
     * Superseded by `page` when that is set.
     */
    current?: string;
    /**
     * For mode="hunt", the running output so far ("your page"), space-separated.
     * When set it renders above the pile in place of the standalone current-
     * cutout widget: the last word is the one being matched (it should equal
     * `target`), and at stage="pick" the chosen `pick` word is appended in gold
     * --- so the page visibly grows by the word just found in the pile.
     */
    page?: string;
    /** For mode="hunt", which narrowing stage to show. */
    stage?: HuntStage;
    /**
     * For mode="hunt" stage="pick", the next word of the chosen cutout (e.g.
     * "ham" picks the and→ham cutout when target="and").
     */
    pick?: string;
  }

  let {
    tokens: tokenString,
    mode = "tokens",
    highlight,
    seed = 1,
    target,
    current,
    page,
    stage = "all",
    pick,
  }: Props = $props();

  const tokenList = $derived(tokenString.trim().split(/\s+/).filter(Boolean));
  // mode="hunt": the "your page" words, when threaded through the hunt.
  const pageTokens = $derived(
    page ? page.trim().split(/\s+/).filter(Boolean) : [],
  );
  const pairCount = $derived(Math.max(0, tokenList.length - 1));

  interface Bigram {
    prev: string;
    next: string;
    idx: number;
  }

  const bigrams = $derived.by<Bigram[]>(() => {
    const out: Bigram[] = [];
    for (let i = 0; i < pairCount; i++) {
      out.push({ prev: tokenList[i], next: tokenList[i + 1], idx: i });
    }
    return out;
  });

  // mode="example": index of the highlighted pair's first token.
  const pairStart = $derived.by<number>(() => {
    if (!highlight) return 0;
    const [a, b] = highlight.trim().split(/\s+/);
    const i = bigrams.findIndex((bg) => bg.prev === a && bg.next === b);
    return i >= 0 ? i : 0;
  });

  // mode="scatter": a tipped-out pile of the same cutouts. We keep a flex-wrap
  // layout (so boxes never overlap and stay readable) but sell the "shuffled"
  // look three ways, all driven by a seeded PRNG so the scatter is identical on
  // every rebuild and in the exported PDF: the reading order is shuffled, each
  // cutout is tilted a few degrees, and each gets a little positional jitter.
  interface Placed extends Bigram {
    rot: number;
    dx: number;
    dy: number;
  }

  // mulberry32 — tiny deterministic PRNG so `seed` fully fixes the layout.
  function makeRng(s: number): () => number {
    let a = s >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const scattered = $derived.by<Placed[]>(() => {
    const rng = makeRng(seed);
    // Fisher-Yates over a copy, so the displayed order is jumbled.
    const deck = bigrams.slice();
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const span = (range: number) => (rng() * 2 - 1) * range;
    return deck.map((bg) => ({
      ...bg,
      rot: span(7), // ±7deg tilt
      dx: span(0.5), // ±0.5em horizontal nudge
      dy: span(0.35), // ±0.35em vertical nudge (kept small so 25 cutouts fit)
    }));
  });

  // mode="hunt": one step of the generation process. Reuse the seeded
  // `scattered` order (rendered upright --- see the template) and, per `stage`,
  // mark each cutout live or dimmed:
  //   start  — only the chosen first cutout (page's first two words) stays lit;
  //            the rest of the pile dims, so the choice reads as "begin here"
  //   all    — nothing dimmed (the pile as it sits)
  //   colour — only cutouts whose prev-word shares `target`'s colour stay lit
  //            (a fast visual scan; palette collisions mean this can over-select)
  //   word   — only cutouts whose prev-word actually IS `target` stay lit
  //   pick   — only the chosen cutout (prev==target, next==pick) stays lit
  // data-id stays "cut-N" (as in scatter), so Reveal auto-animate glides the
  // dimming between adjacent hunt frames.
  interface Hunted extends Placed {
    live: boolean;
    picked: boolean;
  }

  const huntCurrent = $derived.by<{ prev: string; next: string } | null>(() => {
    if (!current) return null;
    const [prev, next] = current.trim().split(/\s+/);
    return { prev, next: next ?? "" };
  });

  const huntPile = $derived.by<Hunted[]>(() => {
    if (mode !== "hunt") return [];
    const targetColour = target != null ? tokenColorIndex(target) : -1;
    // stage="start": you grab a *single* cutout to begin, so highlight only the
    // first matching pair in the pile --- even when that pair (e.g. "will eat")
    // appears more than once. (Pick frames, by contrast, light every match,
    // since the choice is weighted across all of them.)
    const [startPrev, startNext] = pageTokens;
    const startIdx =
      stage === "start"
        ? scattered.findIndex(
            (bg) => bg.prev === startPrev && bg.next === startNext,
          )
        : -1;
    return scattered.map((bg, i) => {
      const wordMatch = bg.prev === target;
      const colourMatch = tokenColorIndex(bg.prev) === targetColour;
      const pickMatch = wordMatch && bg.next === pick;
      const startMatch = i === startIdx;
      const live =
        stage === "colour"
          ? colourMatch
          : stage === "word"
            ? wordMatch
            : stage === "pick"
              ? pickMatch
              : stage === "start"
                ? startMatch
                : true;
      return {
        ...bg,
        live,
        picked: (stage === "pick" && pickMatch) || startMatch,
      };
    });
  });

  function cutoutStyle(p: { rot: number; dx: number; dy: number }): string {
    return `--rot:${p.rot}deg; --dx:${p.dx}em; --dy:${p.dy}em;`;
  }
</script>

{#snippet cutout(c: {
  prev: string;
  next: string;
  id?: string;
  dimmed?: boolean;
  picked?: boolean;
  style?: string;
})}
  <span
    class="cutout-paper"
    class:is-dimmed={c.dimmed}
    class:is-picked={c.picked}
    data-id={c.id}
    style={c.style}
  >
    <span class="cutout-paper-prev">
      <span class="cutout-previous-word {tokenColorClass(c.prev)}"
        >{c.prev}</span
      >
    </span>
    <span class="cutout-paper-next">
      <span class="cutout-next-word {tokenColorClass(c.next)}">{c.next}</span>
    </span>
  </span>
{/snippet}

{#if mode === "hunt"}
  {#if page !== undefined}
    <!-- The running output. Its tail is the cutout we just placed, so the
         last word (== target) is what we now match; on the pick frame the
         chosen word is appended, growing the page by the word found below.
         Every part carries a stable data-id (the label, each word, and the
         picked word at its *eventual* index) so Reveal auto-animate matches
         them frame to frame and the line sits still --- the only motion is the
         freshly-picked word's brief size pulse. The first "choose" frame passes
         an empty page (""), so the label and a full-height line are still
         reserved and the pile below doesn't jump when the first words land. -->
    <div class="hunt-page">
      <span class="hunt-page-label" data-id="hunt-page-label">your page</span>
      <span class="hunt-page-text">
        {#each pageTokens as word, i (i)}
          <span
            class="cutout-next-word {tokenColorClass(word)}"
            class:hunt-page-match={stage !== "start" &&
              stage !== "pick" &&
              i === pageTokens.length - 1}
            data-id={`page-${i}`}>{word}</span
          >
        {/each}
        {#if stage === "pick" && pick}
          <span
            class="cutout-next-word {tokenColorClass(pick)} hunt-page-fresh"
            data-id={`page-${pageTokens.length}`}>{pick}</span
          >
        {/if}
        {#if pageTokens.length === 0}
          <!-- empty "choose" frame: a zero-width word holds the line's height
               and baseline identical to a populated page, so the pile below
               doesn't move when the first words land. -->
          <span class="cutout-next-word" aria-hidden="true">&#8203;</span>
        {/if}
      </span>
    </div>
  {:else if huntCurrent}
    <div class="hunt-current">
      <span class="hunt-current-label">last cutout</span>
      {@render cutout({
        prev: huntCurrent.prev,
        next: huntCurrent.next,
        id: "hunt-current",
      })}
    </div>
  {/if}
  <!-- The hunt pile keeps the seeded shuffle (for the "rummage" feel) but is
       rendered upright --- no scatter tilt/jitter --- so the worked example
       stays readable. On stage="start" every cutout but the chosen first one
       dims (so the pick reads as "begin here"); the same dimming machinery then
       drives the colour/word/pick narrowing, all glided by auto-animate. -->
  <div class="cutout-scatter cutout-hunt">
    {#each huntPile as bg (bg.idx)}
      {@render cutout({
        prev: bg.prev,
        next: bg.next,
        id: `cut-${bg.idx}`,
        dimmed: !bg.live,
        picked: bg.picked,
      })}
    {/each}
  </div>
{:else if mode === "scatter"}
  <div class="cutout-scatter">
    {#each scattered as bg (bg.idx)}
      {@render cutout({
        prev: bg.prev,
        next: bg.next,
        id: `cut-${bg.idx}`,
        style: cutoutStyle(bg),
      })}
    {/each}
  </div>
{:else if mode === "flow"}
  <div class="cutout-flow">
    {#each bigrams as bg (bg.idx)}
      {@render cutout({ prev: bg.prev, next: bg.next })}
    {/each}
  </div>
{:else if mode === "example"}
  <div class="overview-tokens">
    {#each tokenList as token, i (i)}
      {#if i === pairStart}
        <span class="pair-highlight">
          <span class="cutout-next-word {tokenColorClass(token)}">{token}</span>
          <span class="cutout-next-word {tokenColorClass(tokenList[i + 1])}"
            >{tokenList[i + 1]}</span
          >
        </span>
      {:else if i === pairStart + 1}
        {""}
      {:else}
        <span class="cutout-next-word {tokenColorClass(token)}">{token}</span>
      {/if}
    {/each}
  </div>

  <div class="overview-cutout">
    {@render cutout({
      prev: tokenList[pairStart],
      next: tokenList[pairStart + 1],
    })}
  </div>
{:else}
  <div class="overview-tokens">
    {#each tokenList as token, i (i)}
      <span class="cutout-next-word {tokenColorClass(token)}">{token}</span>
    {/each}
  </div>
{/if}

<style>
  .overview-tokens {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em 0.45em;
    align-items: center;
    justify-content: center;
    margin: 1.5rem 0;
    font-size: 1.15em;
  }

  /* mode="example": a soft gold frame around the highlighted pair. outline
     (not border) so the highlight doesn't perturb the surrounding flex
     layout. */
  .pair-highlight {
    display: inline-flex;
    align-items: center;
    gap: 0.4em 0.45em;
    outline: 2px solid var(--anu-gold);
    outline-offset: 4px;
    border-radius: 5px;
    background: color-mix(in srgb, var(--anu-gold) 15%, transparent);
  }

  .overview-cutout {
    display: flex;
    justify-content: center;
    margin-top: 2.5rem;
    font-size: 1.35em;
  }

  .cutout-flow {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4em 0.55em;
    align-items: center;
    justify-content: center;
    margin: 1rem 0;
    font-size: 0.9em;
  }

  /* mode="scatter": same flex-wrap pile as flow (no overlaps), but each cutout
     is tilted and nudged via per-item CSS vars set in the markup. The looser
     gap plus the tilt reads as "tipped out on the table". */
  .cutout-scatter {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em 1em;
    align-items: center;
    justify-content: center;
    margin: 0.5rem 0;
    font-size: 0.85em;
  }

  .cutout-scatter .cutout-paper {
    transform: translate(var(--dx, 0), var(--dy, 0)) rotate(var(--rot, 0deg));
  }

  @media (prefers-reduced-motion: reduce) {
    /* The scatter is static, but honour the preference by dropping the tilt
       for anyone who finds rotated text uncomfortable. */
    .cutout-scatter .cutout-paper {
      transform: none;
    }
  }

  /* mode="hunt": the same scatter pile, but cutouts dim in and out as the hunt
     narrows (colour scan -> exact word -> pick). The current cutout sits above
     the pile with its next-word box ringed --- that's the word we're matching.
     Reveal auto-animate glides the opacity between adjacent frames. */
  .hunt-current {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.7em;
    margin: 0 0 0.5rem;
  }

  .hunt-current-label {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.55em;
    opacity: 0.65;
  }

  .hunt-current .cutout-paper {
    font-size: 1em;
  }

  /* mode="hunt" with `page`: the running output sits where the current cutout
     would, since the page's tail IS that cutout. The last word gets a caret
     beneath it (the word we're matching); the freshly-picked word gives a brief
     size pulse as it lands --- no recolouring, since colour already encodes the
     token. */
  .hunt-page {
    display: flex;
    align-items: baseline;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 0.5em 0.7em;
    margin: 0 0 1.5rem;
  }

  .hunt-page-label {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.55em;
    opacity: 0.65;
    white-space: nowrap;
  }

  .hunt-page-text {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: flex-start;
    gap: 0.25em 0.4em;
    font-size: 1.05em;
  }

  /* the current word --- the one we're now hunting for in the pile. A small
     caret sits beneath it, pointing up at the word it marks ("this word").
     Drawn with borders (crisp, font-independent) in the neutral chrome colour,
     not a token colour, so it reads as a marker rather than another token.
     Hidden on the pick frame (see the markup): once the match is found the
     hunt is over, and the freshly-picked word is appended to the right --- so
     leaving the caret up would strand it under the previous word. */
  .hunt-page-match {
    position: relative;
  }

  .hunt-page-match::after {
    content: "";
    position: absolute;
    left: 50%;
    top: calc(100% + 0.25em);
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 0.3em solid transparent;
    border-right: 0.3em solid transparent;
    border-bottom: 0.36em solid var(--anu-white);
    opacity: 0.55;
    pointer-events: none;
    animation: hunt-caret-bob 1.5s ease-in-out infinite;
  }

  /* the caret gently bobs up toward the word --- a soft "look here" nudge.
     Drop this animation line to go back to a static caret. */
  @keyframes hunt-caret-bob {
    0%,
    100% {
      transform: translateX(-50%) translateY(0);
    }
    50% {
      transform: translateX(-50%) translateY(-0.15em);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hunt-page-match::after {
      animation: none;
    }
  }

  /* the word just found in the pile and written onto the page: a brief size
     pulse marks it as freshly written. The pulse plays whenever this frame
     becomes present (section.present is set by Reveal, outside this component's
     scope, hence :global). The keyframes are declared -global- because Svelte
     won't rewrite a scoped keyframe name referenced from inside a :global
     rule, so a scoped @keyframes would silently never match. */
  @keyframes -global-hunt-page-pulse {
    0% {
      transform: scale(1);
    }
    35% {
      transform: scale(1.4);
    }
    100% {
      transform: scale(1);
    }
  }

  :global(section.present) .hunt-page-fresh {
    transform-origin: center bottom;
    animation: hunt-page-pulse 0.5s ease-out both;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(section.present) .hunt-page-fresh {
      animation: none;
    }
  }

  /* The page line above the pile eats vertical room, so the hunt pile runs a
     little smaller and tighter than the overview scatter to stay inside the
     720px canvas. */
  .cutout-hunt {
    gap: 0.4em 0.8em;
    margin: 0.25rem 0;
    font-size: 0.72em;
  }

  .cutout-hunt .cutout-paper.is-dimmed {
    opacity: 0.16;
    filter: grayscale(0.7);
  }

  .cutout-hunt .cutout-paper.is-picked {
    transform: translate(var(--dx, 0), var(--dy, 0)) scale(1.18);
    outline: 3px solid var(--anu-gold);
    outline-offset: 4px;
    border-radius: 6px;
  }
</style>
