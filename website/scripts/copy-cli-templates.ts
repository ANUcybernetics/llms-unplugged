import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliDir = resolve(__dirname, "../../cli");
const destDir = resolve(__dirname, "../src/templates");

// The .typ templates plus every file they reference by relative path, so the
// browser compiler resolves the same files the CLI does. tokenized-cutouts.typ
// does image("favicon.svg") and imports cutout-common.typ (the shared palette
// and token renderers); without either, the cutouts workflow fails to compile.
const templates = [
  "book.typ",
  "tokenized-cutouts.typ",
  "cutout-common.typ",
  "favicon.svg",
];

mkdirSync(destDir, { recursive: true });

for (const file of templates) {
  const src = resolve(cliDir, file);
  const dest = resolve(destDir, file);

  if (!existsSync(src)) {
    console.error(
      `ERROR: Template file not found: ${src}\n` +
        `The website build requires Typst templates from the cli/ directory.\n` +
        `Make sure you're building from the repository root (not a standalone copy of website/).`,
    );
    process.exit(1);
  }

  copyFileSync(src, dest);
  console.log(`Copied ${file} → src/templates/${file}`);
}
