import { defineSiteConfig } from "astro-theme-university/types";
import logo from "./assets/favicon.svg";
import ogImage from "./assets/og-image.jpg";

export const siteConfig = defineSiteConfig({
  name: "LLMs Unplugged",
  colorScheme: "dark",
  links: [
    { text: "Lessons", href: "/lessons/" },
    { text: "Modules", href: "/modules/" },
    // The route is still /tools/ (it's linked from everywhere); the label is
    // the word teachers search for.
    { text: "Materials", href: "/tools/" },
    { text: "News", href: "/news/" },
    { text: "About", href: "/about/" },
  ],
  licence: "CC-BY-NC-SA-4.0",

  // Site-wide link-preview card. Pages with artwork of their own override it
  // with a `socialImage` prop; the theme re-encodes both to JPEG, since the
  // major scrapers still don't decode the AVIF the site serves to browsers.
  socialImage: ogImage,
  socialImageAlt: "LLMs Unplugged",
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
    // Glossary and FAQ moved out of the main nav in the July 2026 restructure;
    // the Library followed in August (it's linked from Materials and About).
    '<a href="/glossary/">Glossary</a> &middot; <a href="/faq/">FAQ</a> &middot; <a href="/library/">Library</a>',
  ],
};
