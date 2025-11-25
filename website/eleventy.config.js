import EleventyVitePlugin from "@11ty/eleventy-plugin-vite";
import pluginRss from "@11ty/eleventy-plugin-rss";
import pluginNavigation from "@11ty/eleventy-navigation";
import tailwindcss from "@tailwindcss/vite";
import checker from "vite-plugin-checker";
import fs from "node:fs/promises";
import path from "node:path";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItFootnote from "markdown-it-footnote";
import markdownItTocDoneRight from "markdown-it-toc-done-right";
import llmsPlugin from "./eleventy-plugin-llms.js";
import { viteStaticCopy } from "vite-plugin-static-copy";
import {
  tally,
  lmTable,
  lmGrid,
  lmGridAuto,
  parseTokens,
} from "./src/_utils/lm-utils.js";

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

  // Plugins
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginNavigation);

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

  // Lessons collection - ordered by `order` frontmatter, then title
  eleventyConfig.addCollection("lessons", (collectionApi) => {
    return collectionApi.getFilteredByGlob("src/lessons/*.md").sort((a, b) => {
      const orderA = Number.isFinite(a.data.order) ? a.data.order : 999;
      const orderB = Number.isFinite(b.data.order) ? b.data.order : 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.data.title || "").localeCompare(b.data.title || "");
    });
  });

  // Filter lessons by topic ID
  eleventyConfig.addFilter("filterByTopic", (collection, topicId) => {
    return collection
      .filter((item) => item.data.topic === topicId)
      .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));
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

  // Language model shortcodes for lesson content
  // Tally marks: {% tally 7 %} → "卌 ||"
  eleventyConfig.addShortcode("tally", (n) => tally(n));

  // Lesson intro helper: topic link + instructor notes + PDF
  eleventyConfig.addShortcode(
    "lessonIntro",
    (topicTitle, topicSlug, pdfUrl, instructorLink = "#instructor-notes") => {
      if (!topicTitle) {
        throw new Error(
          "lessonIntro shortcode requires a topic title (e.g., add `topic` frontmatter that maps to topics.json).",
        );
      }
      const topicHref = topicSlug ? `/topics/${topicSlug}/` : null;
      const instructorHref = instructorLink || "#instructor-notes";
      const topicHtml = topicHref
        ? `<a href="${topicHref}">${topicTitle} topic</a>`
        : `${topicTitle} topic`;
      const pdfHtml = pdfUrl
        ? ` If you'd like a printable version of the student handout, <a href="${pdfUrl}">download it here</a>.`
        : "";
      return `<p class="lesson-intro">This lesson is part of the ${topicHtml}, with instructions for students (including examples) and <a href="${instructorHref}">instructor notes</a>.${pdfHtml}</p>`;
    },
  );

  // Bigram grid from tokens: {% lmGrid "see spot run . see spot jump ." %}
  // Optional rows/cols: {% lmGrid "see spot", 6, 7 %}
  eleventyConfig.addShortcode("lmGrid", (tokenString, nrows, ncols) => {
    const tokens = parseTokens(tokenString);
    const options = {};
    if (nrows != null) options.nrows = nrows;
    if (ncols != null) options.ncols = ncols;
    return lmGridAuto(tokens, options);
  });

  // Generic table: {% lmTable headers, data %}
  // headers: array of column names
  // data: 2D array of cell values (numbers become tally marks)
  eleventyConfig.addShortcode("lmTable", (headers, data) => {
    return lmTable(headers, data);
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
        checker({
          root: import.meta.dirname,
          eslint: {
            lintCommand: 'eslint "src/**/*.js"',
            useFlatConfig: true,
          },
          stylelint: {
            lintCommand: 'stylelint "src/**/*.css"',
          },
        }),
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
