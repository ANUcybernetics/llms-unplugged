<script lang="ts">
  import { onMount } from "svelte";
  import {
    generateBricks,
    tokenBits,
    assembledLayout,
    shuffledGridLayout,
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
  let phase: Phase = $state("assembled");

  const bricks: Brick[] = generateBricks(count, Date.now());
  const assPos: Map<number, Pos> = assembledLayout(bricks, REF_W, REF_H);
  let gridPos: Pos[] = $state(
    shuffledGridLayout(bricks, REF_W, REF_H, Date.now()),
  );

  onMount(() => {
    function cycle() {
      if (mode === "full") {
        phase = "assembled";
        setTimeout(() => (phase = "highlighted"), 4000);
        setTimeout(() => (phase = "grid"), 5500);
        setTimeout(() => {
          gridPos = shuffledGridLayout(bricks, REF_W, REF_H, Date.now());
        }, 7000);
        setTimeout(() => (phase = "highlighted"), 8000);
        setTimeout(() => (phase = "assembled"), 9500);
      } else {
        gridPos = shuffledGridLayout(bricks, REF_W, REF_H, Date.now());
        phase = "grid";
      }
    }
    cycle();
    const intervalId = setInterval(cycle, mode === "full" ? 12000 : 10000);
    return () => clearInterval(intervalId);
  });

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
    style:transform="translate({pos.x}px, {pos.y}px) scale({sx}, {sy})"
    style:transition-delay="{isTitle && phase !== 'grid' ? b.titleIndex * 0.08 : 0}s"
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
      {@const ap = assPos.get(i)!}
      <g transform="translate({gp.w / 2} {gp.h / 2}) scale({gp.w / ap.w} {gp.h / ap.h}) translate({-gp.w / 2} {-gp.h / 2})">
        <text
          class="token-text"
          x={gp.w / 2}
          y={gp.h / 2}
          text-anchor="middle"
          dominant-baseline="central"
        >{b.titleToken!.displayText}</text>
      </g>
    {/if}
  </g>
{/snippet}

<div class="token-logo">
  <svg viewBox="0 0 {REF_W} {REF_H}">
    {#each bricks as b, i}
      {#if !(mode === "full" && b.titleToken !== null)}
        {@render renderBrick(b, i)}
      {/if}
    {/each}
    {#if mode === "full"}
      {#each bricks as b, i}
        {#if b.titleToken !== null}
          {@render renderBrick(b, i)}
        {/if}
      {/each}
    {/if}
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
    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
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
    transition: opacity 0.4s ease 0.3s;
    white-space: pre;
    pointer-events: none;
  }

  .brick.assembled .token-text {
    opacity: 1;
  }
</style>
