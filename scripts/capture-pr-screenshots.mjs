import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const OUT_DIR = "docs/art/puppet/pr_v5";
mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
  });

  console.log("Navigating to http://127.0.0.1:8080/dev?lab=puppet&sheet=1 ...");
  await page.goto("http://127.0.0.1:8080/dev?lab=puppet&sheet=1", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 1. Both genders at 3 skin tones
  const elTones = await page.$("#qa-tones");
  if (elTones) {
    await elTones.screenshot({ path: `${OUT_DIR}/01_both_genders_3_skin_tones.png` });
    console.log("Captured 01_both_genders_3_skin_tones.png");
  }

  // 2. Every expression
  const elExpr = await page.$("#qa-expressions");
  if (elExpr) {
    await elExpr.screenshot({ path: `${OUT_DIR}/02_every_expression.png` });
    console.log("Captured 02_every_expression.png");
  }

  // 3. Each cap colour on Lelaki & Perempuan
  const elCaps = await page.$("#qa-caps");
  if (elCaps) {
    await elCaps.screenshot({ path: `${OUT_DIR}/03_each_cap_colour.png` });
    console.log("Captured 03_each_cap_colour.png");
  }

  // 4. Each footwear option with jeans and sarong
  const elFoot = await page.$("#qa-footwear");
  if (elFoot) {
    await elFoot.screenshot({ path: `${OUT_DIR}/04_footwear_jeans_sarong.png` });
    console.log("Captured 04_footwear_jeans_sarong.png");
  }

  // 5. Puppet Lab Main Page
  await page.goto("http://127.0.0.1:8080/dev?lab=puppet", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT_DIR}/05_puppet_lab_desktop.png`, fullPage: false });
  console.log("Captured 05_puppet_lab_desktop.png");

  await browser.close();
  console.log("All screenshots captured successfully.");
}

main().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
