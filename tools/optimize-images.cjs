const fs = require("node:fs");
const path = require("node:path");
const sharp = require("C:/Users/FQX/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");
(async () => {
  const inputDir = path.resolve("generated/images");
  const outputDir = path.resolve("site/assets/images");
  fs.mkdirSync(outputDir, { recursive: true });
  for (const name of fs.readdirSync(inputDir).filter((item) => item.endsWith(".png"))) {
    const output = path.join(outputDir, name.replace(/\.png$/i, ".webp"));
    await sharp(path.join(inputDir, name))
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(output);
    console.log(output);
  }
})().catch((error) => { console.error(error); process.exit(1); });