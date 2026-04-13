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
