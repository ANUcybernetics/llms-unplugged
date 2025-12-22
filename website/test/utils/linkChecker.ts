import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function extractPdfLinks(html: string): string[] {
  const pdfLinkRegex = /href="([^"]*\.pdf)"/g;
  const links: string[] = [];
  let match;
  while ((match = pdfLinkRegex.exec(html)) !== null) {
    links.push(match[1]);
  }
  return links;
}

export function resolveLinkPath(
  link: string,
  htmlFilePath: string,
  distDir: string,
): string {
  return link.startsWith("/")
    ? join(distDir, link)
    : join(htmlFilePath, "..", link);
}

export function findBrokenPdfLinks(
  htmlFiles: string[],
  distDir: string,
): string[] {
  const brokenLinks: string[] = [];

  for (const htmlFile of htmlFiles) {
    const content = readFileSync(htmlFile, "utf-8");
    const pdfLinks = extractPdfLinks(content);

    for (const pdfPath of pdfLinks) {
      const resolvedPath = resolveLinkPath(pdfPath, htmlFile, distDir);
      if (!existsSync(resolvedPath)) {
        brokenLinks.push(`${htmlFile}: ${pdfPath}`);
      }
    }
  }

  return brokenLinks;
}
