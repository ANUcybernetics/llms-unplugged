<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    generateBricks,
    tokenBits,
    gridLayout,
    fillLastRow,
    assembledLayout,
    BRICK_COUNT,
    TITLE_TINTS,
    type Brick,
    type Pos,
  } from "../lib/token-logo";

  let {
    count = BRICK_COUNT,
    mode = "full",
  }: { count?: number; mode?: "full" | "background" } = $props();

  const REF_W = 960;
  const REF_H = 540;

  type Phase = "grid" | "highlighted" | "assembled";
  let phase: Phase = $state("grid");

  function computeLayout(n: number, seed: number) {
    const b = generateBricks(n, seed);
    const gp = gridLayout(b, REF_W, REF_H);
    fillLastRow(b, gp, REF_W);
    const ap = assembledLayout(b, REF_W, REF_H);
    return { bricks: b, gridPos: gp, assPos: ap };
  }

  const init = computeLayout(untrack(() => count), Date.now());
  let bricks: Brick[] = $state(init.bricks);
  let gridPos: Pos[] = $state(init.gridPos);
  let assPos: Map<number, Pos> = $state(init.assPos);

  onMount(() => {
    function cycle() {
      const result = computeLayout(count, Date.now());
      bricks = result.bricks;
      gridPos = result.gridPos;
      assPos = result.assPos;
      phase = "grid";
      if (mode === "full") {
        setTimeout(() => (phase = "highlighted"), 2000);
        setTimeout(() => (phase = "assembled"), 3500);
        setTimeout(() => (phase = "highlighted"), 8000);
        setTimeout(() => (phase = "grid"), 9500);
      }
    }
    cycle();
    const intervalId = setInterval(cycle, mode === "full" ? 12000 : 10000);
    return () => clearInterval(intervalId);
  });

  const renderOrder: number[] = $derived(
    bricks
      .map((_, i) => i)
      .sort((a, b) => {
        const at = mode === "full" && bricks[a].titleToken !== null ? 1 : 0;
        const bt = mode === "full" && bricks[b].titleToken !== null ? 1 : 0;
        return at - bt;
      }),
  );

  export function highlight() {
    phase = "highlighted";
  }
  export function assemble() {
    phase = "assembled";
  }
  export function reset() {
    phase = "grid";
  }
</script>

{#snippet renderBrick(b: Brick, i: number)}
  {@const isTitle = mode === "full" && b.titleToken !== null}
  {@const isAssembled = phase === "assembled" && isTitle}
  {@const gp = gridPos[i]}
  {@const pos = isAssembled ? assPos.get(i)! : gp}
  {@const sx = pos.w / gp.w}
  {@const sy = pos.h / gp.h}
  {@const bits = tokenBits(b.id)}
  <g
    class="brick"
    class:highlighted={phase !== "grid" && isTitle}
    class:assembled={isAssembled}
    style:translate="{pos.x}px {pos.y}px"
    style:scale="{sx} {sy}"
    style:transition-delay="{isTitle ? b.titleIndex * 0.08 : 0}s"
    style:--tint={isTitle ? TITLE_TINTS[b.titleIndex] : null}
  >
    <rect
      width={gp.w}
      height={gp.h}
      rx="3"
      class="brick-bg"
    />
    <svg
      class="dots"
      x={(gp.w - 18) / 2}
      y={(gp.h - 18) / 2}
      width="18"
      height="18"
      viewBox="0 0 18 18"
    >
      {#each bits as bit, j}
        <circle
          cx={(j % 4) * 4.5 + 2.25}
          cy={Math.floor(j / 4) * 4.5 + 2.25}
          r="1.5"
          fill={bit ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.1)"}
        />
      {/each}
    </svg>
    {#if isTitle}
      <text
        class="token-text"
        x={gp.w / 2}
        y={gp.h / 2}
        text-anchor="middle"
        dominant-baseline="central"
        style:scale="{1 / sx} {1 / sy}"
      >{b.titleToken!.displayText}</text>
    {/if}
  </g>
{/snippet}

<div class="token-logo">
  <svg viewBox="0 0 {REF_W} {REF_H}">
    {#each renderOrder as i (i)}
      {@render renderBrick(bricks[i], i)}
    {/each}
  </svg>
</div>

<style>
  .token-logo {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--color-bg);
  }

  .token-logo > svg {
    width: 100%;
    height: 100%;
  }

  .brick {
    transform-box: fill-box;
    transform-origin: 0 0;
    transition:
      translate 0.8s cubic-bezier(0.4, 0, 0.2, 1),
      scale 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .brick-bg {
    fill: var(--color-bg-soft);
    stroke: var(--color-brand-soft);
    stroke-width: 1;
    transition:
      fill 0.4s ease,
      stroke 0.4s ease;
  }

  .brick.highlighted .brick-bg {
    fill: var(--tint, #be830e);
    stroke: var(--tint, #d4940f);
  }

  .dots {
    transition: opacity 0.3s ease;
  }

  .brick.assembled .dots {
    opacity: 0;
  }

  .token-text {
    opacity: 0;
    fill: white;
    font-family: var(--font-roboto-mono, "Roboto Mono", monospace);
    font-weight: 700;
    font-size: 120px;
    transform-box: fill-box;
    transform-origin: center;
    transition:
      opacity 0.4s ease 0.3s,
      scale 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: pre;
    pointer-events: none;
  }

  .brick.assembled .token-text {
    opacity: 1;
  }
</style>
