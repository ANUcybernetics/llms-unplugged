import EleventyVitePlugin from "@11ty/eleventy-plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import markdownIt from "markdown-it";
import markdownItFootnote from "markdown-it-footnote";
import interlinker from "@photogabble/eleventy-plugin-interlinker";
import llmsPlugin from "./eleventy-plugin-llms.js";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");

  // Configure markdown-it with typographer for em dashes and smart quotes
  const md = markdownIt({
    html: true,
    typographer: true,
  }).use(markdownItFootnote);

  // Customize footnote rendering to use Tailwind classes
  md.renderer.rules.footnote_block_open = () =>
    '<hr class="border-anu-gold my-12">\n' +
    '<section class="footnotes text-sm mt-12">\n' +
    '<ol class="list-decimal pl-6">\n';

  md.renderer.rules.footnote_block_close = () => "</ol>\n" + "</section>\n";

  eleventyConfig.setLibrary("md", md);

  eleventyConfig.addPlugin(interlinker, {
    deadLinkReport: "console",
    errorOnDeadLinks: true,
  });

  eleventyConfig.addPlugin(llmsPlugin, {
    siteUrl: "https://www.llmsunplugged.org",
    siteName: "LLMs Unplugged",
    siteDescription:
      "Ready-to-use teaching resources for understanding how large language models work through hands-on activities.",
  });

  eleventyConfig.addPlugin(EleventyVitePlugin, {
    viteOptions: {
      base: "/",
      publicDir: ".llms-generated",
      plugins: [
        tailwindcss(),
        viteStaticCopy({
          targets: [
            {
              src: "../src/assets/pdfs/*",
              dest: "assets/pdfs",
            },
          ],
        }),
      ],
      build: {
        rollupOptions: {
          input: {
            main: "src/assets/main.js",
            styles: "src/assets/main.css",
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
