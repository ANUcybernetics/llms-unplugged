<script lang="ts">
  import { onMount } from "svelte";
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

  let { count = BRICK_COUNT } = $props();

  type Phase = "grid" | "highlighted" | "assembled";
  let phase: Phase = $state("grid");
  let bricks: Brick[] = $state(generateBricks(count, Date.now()));

  let el: HTMLDivElement;
  let gridPos: Pos[] = $state([]);
  let assPos: Map<number, Pos> = $state(new Map());

  onMount(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w === 0 || h === 0) return;
      const pos = gridLayout(bricks, w, h);
      fillLastRow(bricks, pos, w);
      gridPos = pos;
      assPos = assembledLayout(bricks, w, h);
      if (!intervalId) {
        function cycle() {
          phase = "grid";
          setTimeout(() => (phase = "highlighted"), 2000);
          setTimeout(() => (phase = "assembled"), 3500);
          setTimeout(() => (phase = "highlighted"), 8000);
          setTimeout(() => (phase = "grid"), 9500);
        }
        cycle();
        intervalId = setInterval(cycle, 12000);
      }
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      clearInterval(intervalId);
    };
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

<div class="token-logo" bind:this={el}>
  {#if gridPos.length > 0}
    {#each bricks as brick, i}
      {@const isTitle = brick.titleToken !== null}
      {@const isAssembled = phase === "assembled" && isTitle}
      {@const gp = gridPos[i]}
      {@const pos = isAssembled ? assPos.get(i)! : gp}
      {@const sx = pos.w / gp.w}
      {@const sy = pos.h / gp.h}
      {@const bits = tokenBits(brick.id)}
      <div
        class="brick"
        class:highlighted={phase !== "grid" && isTitle}
        class:assembled={isAssembled}
        class:dimmed={phase === "assembled" && !isTitle}
        style:transform="translate({pos.x}px, {pos.y}px) scale({sx}, {sy})"
        style:width="{gp.w}px"
        style:height="{gp.h}px"
        style:transition-delay="{isTitle ? brick.titleIndex * 0.08 : 0}s"
        style:--tint={isTitle ? TITLE_TINTS[brick.titleIndex] : null}
      >
        <svg class="dots" viewBox="0 0 18 18">
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
          <span
            class="token-text"
            style:transform="scale({1 / sx}, {1 / sy})"
          >{brick.titleToken!.displayText}</span>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style>
  .token-logo {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #0a0a0a;
  }

  .brick {
    position: absolute;
    left: 0;
    top: 0;
    transform-origin: 0 0;
    background: #1a1a1a;
    border: 1px solid rgba(190, 131, 14, 0.15);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      transform 0.8s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.6s ease,
      background-color 0.4s ease,
      border-color 0.4s ease;
  }

  .brick.dimmed {
    opacity: 0.4;
  }

  .brick.highlighted {
    z-index: 10;
    background: var(--tint, #be830e);
    border-color: var(--tint, #d4940f);
  }

  .dots {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    transition: opacity 0.3s ease;
  }

  .brick.assembled .dots {
    opacity: 0;
  }

  .token-text {
    position: absolute;
    opacity: 0;
    color: white;
    font-family: var(--font-roboto-mono, "Roboto Mono", monospace);
    font-weight: 700;
    font-size: 120px;
    transition:
      opacity 0.4s ease 0.3s,
      transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: pre;
    pointer-events: none;
  }

  .brick.assembled .token-text {
    opacity: 1;
  }
</style>
