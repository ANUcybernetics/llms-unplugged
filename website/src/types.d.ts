/**
 * Ambient type declarations for dependencies that don't ship their own.
 *
 * `smartypants` (used transitively via the `astromotion` integration) is a
 * pure-JS package with no `.d.ts` file. The Astro config never touches it
 * directly, but svelte-check follows the import graph into astromotion's
 * `.ts` source and needs a shape to check against.
 *
 * See https://github.com/othree/smartypants.js for the actual signatures.
 */
declare module "smartypants" {
  /** Attribute flags: numeric preset (0-3) or letter-coded string like "qBdew". */
  type Attr = string | number;

  export function smartypants(text?: string, attr?: Attr): string;
  export function smartypantsu(text?: string, attr?: Attr): string;
  export function smartquotes(text?: string, attr?: Attr): string;
  export function smartdashes(text?: string, attr?: Attr): string;
  export function smartellipses(text?: string, attr?: Attr): string;

  const SmartyPants: (text?: string, attr?: Attr) => string;
  export default SmartyPants;
}

/**
 * astromotion's video motion engine is plain JS with no `.d.ts`; this is the
 * part the BrandMark deck component uses. The contract is
 * `node_modules/astromotion/video/README.md`.
 */
declare module "astromotion/video/motion.js" {
  type Targets = Element | ArrayLike<Element> | null | undefined | Targets[];
  type Props = Record<string, string | number>;
  interface TweenOpts {
    dur?: number;
    ease?: string;
    stagger?: number;
  }
  export interface Controller {
    duration(): number;
    seek(t: number): Controller;
    pause(): Controller;
    play(): Controller;
  }
  export interface Timeline {
    to(targets: Targets, props: Props, at: number, opts?: TweenOpts): Timeline;
    fromTo(targets: Targets, from: Props, to: Props, at: number, opts?: TweenOpts): Timeline;
    set(targets: Targets, props: Props, at: number): Timeline;
    draw(fn: (t: number) => void): Timeline;
    finish(duration: number): Controller;
  }
  export function timeline(): Timeline;
  export function set(targets: Targets, props: Props): void;
  export function svg<K extends keyof SVGElementTagNameMap>(
    tag: K,
    attrs?: Record<string, string | number>,
    parent?: Element,
  ): SVGElementTagNameMap[K];
  export function ease(name: string): (t: number) => number;
}
