import { defineSiteConfig } from "astro-theme-university/types";
import logo from "./assets/favicon.svg";
import ogImage from "./assets/og-image.jpg";
import { sourceLinkHtml } from "./lib/source-link";

export const siteConfig = defineSiteConfig({
  name: "LLMs Unplugged",
  colorScheme: "dark",
  links: [
    { text: "Lessons", href: "/lessons/" },
    { text: "Modules", href: "/modules/" },
    // The route is still /tools/ (it's linked from everywhere); the label is
    // the word teachers search for.
    { text: "Materials", href: "/tools/" },
    { text: "For educators", href: "/educators/" },
    { text: "News", href: "/news/" },
    { text: "About", href: "/about/" },
  ],
  licence: "CC-BY-SA-4.0",

  // Site-wide link-preview card. Pages with artwork of their own override it
  // with a `socialImage` prop; the theme re-encodes both to JPEG, since the
  // major scrapers still don't decode the AVIF the site serves to browsers.
  socialImage: ogImage,
  socialImageAlt: "LLMs Unplugged",
});

export const themeLogo = logo;

// Footer meta lines — passed directly to BaseLayout (not part of SiteConfig).
// astro-theme-university ships no institutional footer defaults, so the footer
// is just the licence line plus these. Meta strings render as HTML, so inline
// anchors are allowed. The last line ends with a link to the page's source.
export function footerMeta(pathname: string): string[] {
  return [
    'LLMs Unplugged is a <a href="https://cybernetics.anu.edu.au/cybernetic-studio/">Cybernetic Studio</a> project at the ANU School of Cybernetics, made by <a href="https://benswift.me">Ben Swift</a>.',
    [
      '<a href="/glossary/">Glossary</a>',
      '<a href="/faq/">FAQ</a>',
      '<a href="/library/">Library</a>',
      sourceLinkHtml(pathname),
    ]
      .filter(Boolean)
      .join(" &middot; "),
  ];
}
