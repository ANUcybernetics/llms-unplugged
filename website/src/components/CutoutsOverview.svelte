<script lang="ts">
  import { tokenColorClass, tokenColorIndex } from "../lib/tokenColors";

  type Mode = "tokens" | "example" | "flow" | "scatter" | "hunt";
  type HuntStage = "all" | "colour" | "word" | "pick";

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
     */
    current?: string;
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
    stage = "all",
    pick,
  }: Props = $props();

  const tokenList = $derived(tokenString.trim().split(/\s+/).filter(Boolean));
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
  // `scattered` pile and, per `stage`, mark each cutout live or dimmed:
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
    return scattered.map((bg) => {
      const wordMatch = bg.prev === target;
      const colourMatch = tokenColorIndex(bg.prev) === targetColour;
      const picked = wordMatch && bg.next === pick;
      const live =
        stage === "colour"
          ? colourMatch
          : stage === "word"
            ? wordMatch
            : stage === "pick"
              ? picked
              : true;
      return { ...bg, live, picked: picked && stage === "pick" };
    });
  });
</script>

{#if mode === "hunt"}
  {#if huntCurrent}
    <div class="hunt-current">
      <span class="hunt-current-label">last cutout</span>
      <span class="cutout-paper" data-id="hunt-current">
        <span class="cutout-paper-prev">
          <span class="cutout-previous-word {tokenColorClass(huntCurrent.prev)}"
            >{huntCurrent.prev}</span
          >
        </span>
        <span class="cutout-paper-next hunt-target-box">
          <span class="cutout-next-word {tokenColorClass(huntCurrent.next)}"
            >{huntCurrent.next}</span
          >
        </span>
      </span>
    </div>
  {/if}
  <div class="cutout-scatter cutout-hunt">
    {#each huntPile as bg (bg.idx)}
      <span
        class="cutout-paper"
        class:is-dimmed={!bg.live}
        class:is-picked={bg.picked}
        data-id="cut-{bg.idx}"
        style="--rot:{bg.rot}deg; --dx:{bg.dx}em; --dy:{bg.dy}em;"
      >
        <span class="cutout-paper-prev">
          <span class="cutout-previous-word {tokenColorClass(bg.prev)}"
            >{bg.prev}</span
          >
        </span>
        <span class="cutout-paper-next">
          <span class="cutout-next-word {tokenColorClass(bg.next)}"
            >{bg.next}</span
          >
        </span>
      </span>
    {/each}
  </div>
{:else if mode === "scatter"}
  <div class="cutout-scatter">
    {#each scattered as bg (bg.idx)}
      <span
        class="cutout-paper"
        data-id="cut-{bg.idx}"
        style="--rot:{bg.rot}deg; --dx:{bg.dx}em; --dy:{bg.dy}em;"
      >
        <span class="cutout-paper-prev">
          <span class="cutout-previous-word {tokenColorClass(bg.prev)}"
            >{bg.prev}</span
          >
        </span>
        <span class="cutout-paper-next">
          <span class="cutout-next-word {tokenColorClass(bg.next)}"
            >{bg.next}</span
          >
        </span>
      </span>
    {/each}
  </div>
{:else if mode === "flow"}
  <div class="cutout-flow">
    {#each bigrams as bg (bg.idx)}
      <span class="cutout-paper">
        <span class="cutout-paper-prev">
          <span class="cutout-previous-word {tokenColorClass(bg.prev)}"
            >{bg.prev}</span
          >
        </span>
        <span class="cutout-paper-next">
          <span class="cutout-next-word {tokenColorClass(bg.next)}"
            >{bg.next}</span
          >
        </span>
      </span>
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
    <span class="cutout-paper">
      <span class="cutout-paper-prev">
        <span
          class="cutout-previous-word {tokenColorClass(tokenList[pairStart])}"
          >{tokenList[pairStart]}</span
        >
      </span>
      <span class="cutout-paper-next">
        <span
          class="cutout-next-word {tokenColorClass(tokenList[pairStart + 1])}"
          >{tokenList[pairStart + 1]}</span
        >
      </span>
    </span>
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

  .hunt-current .hunt-target-box {
    outline: 2px solid var(--anu-gold);
    outline-offset: 3px;
    border-radius: 5px;
  }

  /* The current cutout above the pile eats vertical room, so the hunt pile runs
     a little smaller and tighter than the overview scatter to stay inside the
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
