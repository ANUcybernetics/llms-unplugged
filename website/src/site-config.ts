import { defineSiteConfig } from "astro-theme-anu/types";
import logo from "./assets/favicon.svg";

export const siteConfig = defineSiteConfig({
  name: "LLMs Unplugged",
  colorScheme: "dark",
  links: [
    { text: "Lessons", href: "/lessons/" },
    { text: "News", href: "/news/" },
    { text: "Glossary", href: "/glossary/" },
    { text: "FAQ", href: "/faq/" },
    { text: "About", href: "/about/" },
  ],
  licence: "CC-BY-NC-SA-4.0",
});

export const themeLogo = logo;

// Footer overrides — passed directly to BaseLayout (not part of SiteConfig).
// Suppress the ANU institutional defaults (Contact ANU, Privacy, TEQSA/CRICOS, etc.)
// in favour of a minimal attribution. Meta strings are rendered as HTML by the
// theme's Footer (set:html), so inline anchors are allowed.
export const footerOverrides = {
  legalLinks: [],
  partnerships: [],
  meta: [
    'LLMs Unplugged is a <a href="https://cybernetics.anu.edu.au/cybernetic-studio/">Cybernetic Studio</a> project at the ANU School of Cybernetics, made by <a href="https://benswift.me">Ben Swift</a>.',
  ],
};
