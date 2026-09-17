const { chromium } = require("C:/Users/FQX/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const siteRoot = path.join(projectRoot, "site");
const fileUrl = (name) => "file:///" + path.join(siteRoot, name).replaceAll("\\", "/").replaceAll(" ", "%20");

(async () => {
  const screenshots = path.join(siteRoot, "screenshots");
  fs.mkdirSync(screenshots, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    args: ["--no-proxy-server"]
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push("console: " + msg.text()); });
  page.on("pageerror", (error) => errors.push("pageerror: " + error.message));

  await page.goto(fileUrl("index.html"), { waitUntil: "networkidle" });
  if ((await page.locator(".roadmap-table tbody tr").count()) !== 21) throw new Error("Roadmap should contain 21 rows");
  if ((await page.locator('a[href^="lesson-"]').count()) < 21) throw new Error("Home should link to all 21 lessons");
  await page.screenshot({ path: path.join(screenshots, "desktop-home.png"), fullPage: true });

  await page.locator('[data-search-open]').click();
  await page.locator('[data-search-input]').fill("限速");
  if ((await page.locator(".search-result").count()) < 1) throw new Error("Search index missing speed-limit lesson");
  await page.keyboard.press("Escape");

  for (let i = 0; i <= 20; i += 1) {
    const number = String(i).padStart(2, "0");
    await page.goto(fileUrl(`lesson-${number}.html`), { waitUntil: "networkidle" });
    if ((await page.locator(".lesson-header h1").count()) !== 1) throw new Error(`Lesson ${number} should have exactly one hero heading`);
    if ((await page.locator(".nav-link[data-lesson-id]").count()) !== 21) throw new Error(`Lesson ${number} sidebar should contain 21 units`);
    if ((await page.locator(".lesson-content pre").count()) < 2) throw new Error(`Lesson ${number} should contain code examples`);
    const visibility = await page.locator(".lesson-content").evaluate((el) => ({ opacity: getComputedStyle(el).opacity, textLength: el.innerText.length }));
    if (visibility.opacity === "0" || visibility.textLength < 500) throw new Error(`Lesson ${number} content is not visible`);
    if (i >= 2) {
      const content = await page.locator(".lesson-content").innerText();
      if (!content.includes("源码位置")) throw new Error(`Lesson ${number} is missing source locations`);
    }
    if ([1, 2, 3, 8, 10, 11, 12, 14, 15, 16, 18, 20].includes(i)) {
      await page.waitForSelector(".lesson-content .mermaid svg", { timeout: 15000 });
    }
    if ([1, 2, 3, 5, 15, 19].includes(i)) {
      const image = page.locator(".lesson-illustration img").first();
      await image.scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      const imageLoaded = await image.evaluate((img) => img.complete && img.naturalWidth > 0);
      if (!imageLoaded) throw new Error(`Lesson ${number} illustration failed to load`);
    }
  }

  await page.goto(fileUrl("lesson-02.html"), { waitUntil: "networkidle" });
  await page.waitForSelector(".lesson-content .mermaid svg", { timeout: 15000 });
  await page.locator("[data-theme-toggle]").click();
  await page.waitForTimeout(250);
  if ((await page.locator(".lesson-content .mermaid svg").count()) < 1) throw new Error("Mermaid failed after theme toggle");

  await page.goto(fileUrl("lesson-00.html"), { waitUntil: "networkidle" });
  const initialTheme = await page.locator("html").getAttribute("data-theme");
  await page.locator("[data-theme-toggle]").click();
  if (initialTheme === await page.locator("html").getAttribute("data-theme")) throw new Error("Theme toggle failed");
  await page.locator("[data-complete-lesson]").click();
  await page.reload({ waitUntil: "networkidle" });
  if ((await page.locator("[data-progress-value]").first().innerText()) !== "5%") throw new Error("Progress was not persisted");
  await page.screenshot({ path: path.join(screenshots, "desktop-lesson-00.png"), fullPage: true });

  await page.goto(fileUrl("lesson-11.html"), { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(screenshots, "desktop-lesson-11.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-menu-toggle]").click();
  if (!(await page.locator(".sidebar").getAttribute("class")).includes("is-open")) throw new Error("Mobile menu did not open");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) throw new Error("Mobile horizontal overflow: " + overflow + "px");
  await page.screenshot({ path: path.join(screenshots, "mobile-lesson-11.png"), fullPage: false });

  await browser.close();
  if (errors.length) throw new Error(errors.join("\n"));
  console.log("All 21 lesson pages, source labels, search, theme, progress, and mobile checks passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
