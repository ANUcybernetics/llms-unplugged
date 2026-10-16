import { existsSync } from "node:fs";
import iconoir from "@iconify-json/iconoir/icons.json";

const REPO_BLOB = "https://github.com/ANUcybernetics/llms-unplugged/blob/main/website";

// Collections rendered one entry per page at /<collection>/<id>/.
const COLLECTIONS = new Set(["lessons", "talks", "modules", "news"]);

/** The website-relative source file that renders `pathname`, if one exists.
 *  Resolved at build time against the working tree (cwd is website/). */
export function sourceFileFor(pathname: string): string | undefined {
  const segs = pathname.split("/").filter(Boolean);
  const stem = segs.join("/");
  const candidates =
    segs.length === 2 && COLLECTIONS.has(segs[0])
      ? ["mdx", "md"].map((ext) => `src/content/${stem}.${ext}`)
      : ["astro", "mdx", "md"].flatMap((ext) => [
          ...(stem ? [`src/pages/${stem}.${ext}`] : []),
          `src/pages/${stem ? `${stem}/` : ""}index.${ext}`,
        ]);
  return candidates.find((path) => existsSync(path));
}

const githubIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">${iconoir.icons.github.body}</svg>`;

/** Footer link to this page's source on GitHub, as an HTML string for the
 *  theme's `meta` footer lines (or "" when the page has no source file). */
export function sourceLinkHtml(pathname: string): string {
  const file = sourceFileFor(pathname);
  if (!file) return "";
  return `<a class="source-link" href="${REPO_BLOB}/${file}" aria-label="View this page's source on GitHub" title="View this page's source on GitHub">${githubIcon}</a>`;
}
