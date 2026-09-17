const sharp = require("C:/Users/FQX/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");
sharp("generated/images/anime-apollo-architecture-flow.png")
  .resize({ width: 1440, withoutEnlargement: true })
  .webp({ quality: 88, effort: 6 })
  .toFile("site/assets/images/anime-apollo-architecture-flow.webp")
  .then((info) => console.log(info))
  .catch((error) => { console.error(error); process.exit(1); });