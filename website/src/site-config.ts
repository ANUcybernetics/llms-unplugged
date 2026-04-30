import { defineSiteConfig } from "astro-theme-anu/types";
import logo from "./assets/title-logo.svg";

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
// in favour of a minimal attribution.
export const footerOverrides = {
  legalLinks: [],
  partnerships: [],
  meta: ["LLMs Unplugged is a Cybernetic Studio project at the ANU School of Cybernetics."],
};
