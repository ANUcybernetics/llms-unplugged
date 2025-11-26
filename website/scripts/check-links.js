import { LinkChecker } from "linkinator";

const PORT = 5555;
const SITE_URL = "https://www.llmsunplugged.org";

async function main() {
  const checker = new LinkChecker();

  checker.on("pagestart", (url) => {
    console.log(`→ ${url}`);
  });

  checker.on("link", (result) => {
    const status = result.status || 0;
    const state = result.state;

    if (state === "BROKEN") {
      console.log(`[${status}] ${result.url}`);
    }
  });

  const result = await checker.check({
    path: "_site",
    port: PORT,
    recurse: true,
    urlRewriteExpressions: [
      {
        pattern: new RegExp(`^${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
        replacement: `http://localhost:${PORT}`,
      },
    ],
  });

  console.log("\n---");
  console.log(`Scanned ${result.links.length} links`);

  const broken = result.links.filter((l) => l.state === "BROKEN");
  if (broken.length > 0) {
    console.log(`Found ${broken.length} broken links:\n`);
    for (const link of broken) {
      console.log(`  [${link.status || 0}] ${link.url}`);
      if (link.parent) {
        console.log(`      ↳ from ${link.parent}`);
      }
    }
    process.exit(1);
  } else {
    console.log("No broken links found!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
