// Plausible custom events from bundled code. The stub in
// components/Analytics.astro defines window.plausible on every page, but guard
// anyway so a missing stub never breaks the feature being tracked.
type Plausible = (event: string, options?: { props?: Record<string, string> }) => void;

declare global {
  interface Window {
    plausible?: Plausible;
  }
}

export function trackEvent(event: string, props?: Record<string, string>): void {
  window.plausible?.(event, props && { props });
}
