import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliDir = resolve(__dirname, "../../cli");
const destDir = resolve(__dirname, "../.vitepress/theme/templates");

const templates = ["book.typ", "tokenized-cutouts.typ"];

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
  console.log(`Copied ${file} → .vitepress/theme/templates/${file}`);
}
