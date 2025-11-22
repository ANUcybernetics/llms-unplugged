import EleventyVitePlugin from "@11ty/eleventy-plugin-vite";
import pluginRss from "@11ty/eleventy-plugin-rss";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs/promises";
import path from "node:path";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItFootnote from "markdown-it-footnote";
import markdownItTocDoneRight from "markdown-it-toc-done-right";
import llmsPlugin from "./eleventy-plugin-llms.js";
import { viteStaticCopy } from "vite-plugin-static-copy";

function preservePassthroughOutputs() {
  let rootDir;
  let outDir;

  async function fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async function copyMatchingFiles(current, destinationRoot, extension) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const sourcePath = path.join(current, entry.name);
      const relativePath = path.relative(rootDir, sourcePath);
      const destinationPath = path.join(destinationRoot, relativePath);

      if (entry.isDirectory()) {
        await copyMatchingFiles(sourcePath, destinationRoot, extension);
      } else if (path.extname(entry.name) === extension) {
        await fs.mkdir(path.dirname(destinationPath), { recursive: true });
        await fs.copyFile(sourcePath, destinationPath);
      }
    }
  }

  return {
    name: "preserve-eleventy-passthrough",
    apply: "build",
    configResolved(config) {
      rootDir = config.root;
      outDir = config.build.outDir;
    },
    async closeBundle() {
      const passthroughFiles = ["CNAME", "feed.xml", "favicon.svg", "llms.txt"];

      for (const file of passthroughFiles) {
        const sourcePath = path.join(rootDir, file);
        if (await fileExists(sourcePath)) {
          const destinationPath = path.join(outDir, file);
          await fs.mkdir(path.dirname(destinationPath), { recursive: true });
          await fs.copyFile(sourcePath, destinationPath);
        }
      }

      await copyMatchingFiles(rootDir, outDir, ".md");
    },
  };
}

export default function (eleventyConfig) {
  // Global site data available in all templates as `site`
  eleventyConfig.addGlobalData("site", {
    name: "LLMs Unplugged",
    url: "https://www.llmsunplugged.org",
    repository: "https://github.com/ANUcybernetics/llms-unplugged",
    description:
      "Ready-to-use teaching resources for understanding how large language models work through hands-on activities.",
  });

  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");
  eleventyConfig.addPassthroughCopy("src/**/*.md");

  // RSS plugin
  eleventyConfig.addPlugin(pluginRss);

  // Date filters for news posts
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return new Date(dateObj).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return new Date(dateObj).toISOString().split("T")[0];
  });

  // Filter collection by tag
  eleventyConfig.addFilter("filterByTag", (collection, tag) => {
    return collection.filter(
      (item) => item.data.tags && item.data.tags.includes(tag),
    );
  });

  // String starts with check for navigation highlighting
  eleventyConfig.addFilter("startswith", (str, prefix) => {
    return str && str.startsWith(prefix);
  });

  // Head filter for limiting array items
  eleventyConfig.addFilter("head", (array, n) => {
    if (!Array.isArray(array)) return [];
    return array.slice(0, n);
  });

  // News collection - all posts in src/news/
  eleventyConfig.addCollection("news", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/news/*.md")
      .sort((a, b) => b.date - a.date);
  });

  // Configure markdown-it with typographer for em dashes and smart quotes
  const md = markdownIt({
    html: true,
    typographer: true,
  })
    .use(markdownItFootnote)
    .use(markdownItAnchor, {
      permalink: markdownItAnchor.permalink.headerLink(),
      slugify: eleventyConfig.getFilter("slugify"),
    })
    .use(markdownItTocDoneRight, {
      listType: "ul",
      level: [2],
    });

  // Customize footnote rendering to use Tailwind classes
  md.renderer.rules.footnote_block_open = () =>
    '<hr class="border-anu-gold my-12">\n' +
    '<section class="footnotes text-sm mt-12">\n' +
    '<ol class="list-decimal pl-6">\n';

  md.renderer.rules.footnote_block_close = () => "</ol>\n" + "</section>\n";

  eleventyConfig.setLibrary("md", md);

  eleventyConfig.addPlugin(llmsPlugin);
  eleventyConfig.addTransform("normalizeFaviconPath", (content, outputPath) => {
    if (outputPath && outputPath.endsWith(".html")) {
      return content.replace(
        /href="\/assets\/favicon-[^"]+\.svg"/g,
        'href="/favicon.svg"',
      );
    }
    return content;
  });

  eleventyConfig.addPlugin(EleventyVitePlugin, {
    viteOptions: {
      base: "/",
      plugins: [
        tailwindcss(),
        viteStaticCopy({
          targets: [
            {
              src: "assets/pdfs/**/*",
              dest: ".",
            },
          ],
          structured: true,
        }),
        preservePassthroughOutputs(),
      ],
      build: {
        rollupOptions: {
          input: {
            main: "src/assets/main.js",
            slides: "src/assets/slides.js",
          },
          output: {
            assetFileNames: (assetInfo) => {
              if (assetInfo.name === "favicon.svg") {
                return "favicon.svg";
              }
              return "assets/[name]-[hash][extname]";
            },
          },
        },
      },
    },
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
    },
    pathPrefix: "/",
  };
}
