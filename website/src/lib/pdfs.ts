// PDFs (booklets, cutouts, sheets, worksheets, presenter guides) and lesson
// pack zips are served from a Tigris bucket at pdf.llmsunplugged.org.
// ops/bucket-sync.py documents the bucket and handles uploads.
//
// pdf-manifest.json is the committed list of keys in the bucket, regenerated
// by `ops/bucket-sync.py manifest` after each upload. UsingTheSlides gates its
// presenter-guide links on this manifest, and the build's PDF link check
// verifies every pdf.llmsunplugged.org href against it.
import manifest from "../data/pdf-manifest.json";

export const PDF_BASE = "https://pdf.llmsunplugged.org";

const keys = new Set<string>(manifest);

export const pdfUrl = (key: string): string => `${PDF_BASE}/${key}`;

export const hasPdf = (key: string): boolean => keys.has(key);

// A lesson's delivery pack (`make pack-<slug>` in the repo root), or null until
// the manifest lists it.
export const packUrl = (lessonSlug: string): string | null => {
  const key = `packs/${lessonSlug}.zip`;
  return keys.has(key) ? pdfUrl(key) : null;
};
