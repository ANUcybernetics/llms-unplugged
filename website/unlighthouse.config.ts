import { defineConfig } from 'unlighthouse'

export default defineConfig({
  site: 'http://localhost:8080',
  debug: false,
  scanner: {
    // Scan all pages starting from root
    samples: 1,
    throttle: false,
  },
  lighthouse: {
    // Use desktop preset for consistency with your previous LHCI config
    formFactor: 'desktop',
    screenEmulation: {
      disabled: true,
    },
  },
  ci: {
    budget: {
      performance: 90,
      accessibility: 95,
      'best-practices': 90,
      seo: 90,
    },
  },
})
