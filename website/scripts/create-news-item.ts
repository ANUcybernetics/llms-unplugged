#!/usr/bin/env npx tsx
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const newsDir = join(__dirname, "../src/content/news");

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const postName = process.argv[2];

if (!postName) {
  console.error("Usage: create-news-item.ts <post-name>");
  console.error('Example: create-news-item.ts "New workshop announced"');
  process.exit(1);
}

const today = new Date();
const dateStr = formatDate(today);
const slug = slugify(postName);
const filename = `${dateStr}-${slug}.md`;
const filepath = join(newsDir, filename);

if (existsSync(filepath)) {
  console.error(`Error: ${filename} already exists`);
  process.exit(1);
}

const content = `---
title: ${JSON.stringify(postName)}
date: ${dateStr}
author: Ben Swift
description: TODO
---

<!-- Hero images are auto-loaded from src/assets/images/hero-news-${filename.replace(".md", "")}.avif -->

TODO: Write your news item here.
`;

writeFileSync(filepath, content);
console.log(`Created ${filename}`);
