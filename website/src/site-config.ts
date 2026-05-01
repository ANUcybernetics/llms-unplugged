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
// `institutional: false` strips the ANU defaults (Acknowledgement, partnership
// band, default legal links, default meta) in one go; the custom meta line
// below provides our attribution. Meta strings render as HTML, so inline
// anchors are allowed.
export const footerOverrides = {
  institutional: false,
  meta: [
    'LLMs Unplugged is a <a href="https://cybernetics.anu.edu.au/cybernetic-studio/">Cybernetic Studio</a> project at the ANU School of Cybernetics, made by <a href="https://benswift.me">Ben Swift</a>.',
  ],
};
