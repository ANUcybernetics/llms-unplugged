import fs from "node:fs";
import path from "node:path";

export default function (eleventyConfig, options = {}) {
  const inputRoot = path.resolve(options.inputDir || "src");

  eleventyConfig.addCollection("llmsDocs", (collectionApi) => {
    return collectionApi
      .getAll()
      .filter((item) => item.inputPath?.endsWith(".md"))
      .map((item) => {
        const inputPath = path.resolve(item.inputPath);
        const relativePath = path
          .relative(inputRoot, inputPath)
          .split(path.sep)
          .join("/");

        if (relativePath.startsWith("..")) {
          return null;
        }

        const segments = relativePath.split("/");
        if (segments.some((segment) => segment.startsWith("_"))) {
          return null;
        }

        const content = fs.readFileSync(inputPath, "utf8");

        return {
          title: item.data.title || relativePath,
          relativePath,
          inputPath,
          content,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  });
}
