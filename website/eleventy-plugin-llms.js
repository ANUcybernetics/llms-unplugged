import fs from "fs/promises";
import path from "path";
import grayMatter from "gray-matter";

export default function (eleventyConfig, options = {}) {
  const {
    siteUrl = "",
    siteName = "LLMs Unplugged",
    siteDescription = "Ready-to-use teaching resources for understanding how large language models work through hands-on activities.",
  } = options;

  // Copy markdown files and generate llms.txt before Eleventy build
  // so Vite can include them via passthrough
  eleventyConfig.on("eleventy.before", async ({ dir, inputDir }) => {
    const srcDir = inputDir || dir.input;
    const generatedDir = ".llms-generated";

    // Clean generated directory to remove stale files
    await fs.rm(generatedDir, { recursive: true, force: true });
    await fs.mkdir(generatedDir, { recursive: true });

    // Find all markdown files in the input directory
    const markdownPaths = await findMarkdownFiles(srcDir);

    const markdownFiles = markdownPaths.map((inputPath) => ({
      inputPath,
      outputPath: inputPath
        .replace(srcDir, dir.output)
        .replace(/\.md$/, "/index.html"),
    }));

    // Copy markdown source files to generated directory
    await copyMarkdownFiles(markdownFiles, srcDir, generatedDir);

    // Generate llms.txt in generated directory
    await generateLlmsTxt(generatedDir, markdownFiles, srcDir, {
      siteUrl,
      siteName,
      siteDescription,
    });

    // Copy static files (CNAME, favicon) to generated directory
    const staticFiles = ["CNAME", "favicon.svg"];
    for (const file of staticFiles) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(generatedDir, file);
      try {
        await fs.copyFile(srcPath, destPath);
      } catch {
        // File may not exist, that's ok
      }
    }
  });

  // Copy feed.xml to llms-generated after Eleventy generates it
  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    const generatedDir = ".llms-generated";
    const feedSrc = path.join(dir.output, "feed.xml");
    const feedDest = path.join(generatedDir, "feed.xml");

    try {
      await fs.access(feedSrc);
      await fs.copyFile(feedSrc, feedDest);
    } catch {
      // feed.xml doesn't exist
    }
  });
}

async function findMarkdownFiles(dir) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith("_")) {
      results.push(...(await findMarkdownFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results;
}

async function copyMarkdownFiles(markdownFiles, inputDir, outputDir) {
  for (const { inputPath } of markdownFiles) {
    try {
      const relativePath = path.relative(inputDir, inputPath);
      const destPath = path.join(outputDir, relativePath);

      // Ensure destination directory exists
      await fs.mkdir(path.dirname(destPath), { recursive: true });

      // Copy the markdown file
      await fs.copyFile(inputPath, destPath);
    } catch (error) {
      console.error(`Failed to copy ${inputPath}:`, error.message);
      throw error;
    }
  }
}

async function generateLlmsTxt(
  outputDir,
  markdownFiles,
  inputDir,
  { siteUrl, siteName, siteDescription },
) {
  const lines = [];

  // H1 with site name (required per llmstxt.org spec)
  lines.push(`# ${siteName}`);
  lines.push("");

  // Blockquote with summary (optional but recommended)
  lines.push(`> ${siteDescription}`);
  lines.push("");

  // H2 section with markdown files
  lines.push("## Documentation");
  lines.push("");

  for (const { inputPath } of markdownFiles) {
    try {
      const relativePath = path.relative(inputDir, inputPath);

      // Read frontmatter using gray-matter for robust parsing
      const content = await fs.readFile(inputPath, "utf-8");
      const { data } = grayMatter(content);
      const title = data.title || relativePath;

      // Build URL for the markdown file
      const mdUrl = siteUrl
        ? `${siteUrl.replace(/\/$/, "")}/${relativePath}`
        : `/${relativePath}`;

      lines.push(`- [${title}](${mdUrl})`);
    } catch (error) {
      console.error(`Failed to process ${inputPath}:`, error.message);
      throw error;
    }
  }

  // Write llms.txt to output directory
  try {
    const llmsTxtPath = path.join(outputDir, "llms.txt");
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(llmsTxtPath, lines.join("\n") + "\n", "utf-8");
  } catch (error) {
    console.error("Failed to write llms.txt:", error.message);
    throw error;
  }
}
