// Plausible custom events from bundled code. The tracker (src/plausible.ts)
// defines window.plausible only on the live site and outside iframes, so a
// call anywhere else is a no-op.
type Plausible = (event: string, options?: { props?: Record<string, string> }) => void;

declare global {
  interface Window {
    plausible?: Plausible;
  }
}

export function trackEvent(event: string, props?: Record<string, string>): void {
  window.plausible?.(event, props && { props });
}
