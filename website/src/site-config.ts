import { defineSiteConfig } from "astro-theme-university/types";
import logo from "./assets/favicon.svg";

export const siteConfig = defineSiteConfig({
  name: "LLMs Unplugged",
  colorScheme: "dark",
  links: [
    { text: "Lessons", href: "/lessons/" },
    { text: "Modules", href: "/modules/" },
    { text: "Tools", href: "/tools/" },
    { text: "Library", href: "/library/" },
    { text: "News", href: "/news/" },
    { text: "About", href: "/about/" },
  ],
  licence: "CC-BY-NC-SA-4.0",
});

export const themeLogo = logo;

// Footer overrides — passed directly to BaseLayout (not part of SiteConfig).
// astro-theme-university ships no institutional footer defaults (this site
// never wanted the ANU footer — it used `institutional: false` under the old
// astro-theme-anu theme), so the footer is just the licence line plus the
// custom meta line below. Meta strings render as HTML, so inline anchors are
// allowed.
export const footerOverrides = {
  meta: [
    'LLMs Unplugged is a <a href="https://cybernetics.anu.edu.au/cybernetic-studio/">Cybernetic Studio</a> project at the ANU School of Cybernetics, made by <a href="https://benswift.me">Ben Swift</a>.',
    // Glossary and FAQ moved out of the main nav in the July 2026 restructure.
    '<a href="/glossary/">Glossary</a> &middot; <a href="/faq/">FAQ</a>',
  ],
};
