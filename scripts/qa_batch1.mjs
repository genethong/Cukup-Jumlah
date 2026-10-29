import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });

  // 1. Desktop Lab
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  await page.goto("http://127.0.0.1:8080/dev?lab=puppet", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: "docs/art/puppet/batch1_desktop_lab.png" });
  console.log("Saved docs/art/puppet/batch1_desktop_lab.png");

  // 2. Mobile Lab (390px)
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto("http://127.0.0.1:8080/dev?lab=puppet", { waitUntil: "networkidle" });
  await mobile.waitForTimeout(600);
  await mobile.screenshot({ path: "docs/art/puppet/batch1_mobile_lab.png" });
  console.log("Saved docs/art/puppet/batch1_mobile_lab.png");

  // 3. Combos sheet
  const sheet = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await sheet.goto("http://127.0.0.1:8080/dev?lab=puppet&sheet=1", { waitUntil: "networkidle" });
  await sheet.waitForTimeout(1000);
  await sheet.screenshot({ path: "docs/art/puppet/batch1_combos_sheet.png" });
  console.log("Saved docs/art/puppet/batch1_combos_sheet.png");

  // 4. Style check: Baju Melayu vs T-shirt Puppet side by side
  const stage = await page.$("section:has(.grid-cols-3)");
  if (stage) {
    await stage.screenshot({ path: "docs/art/puppet/batch1_style_check.png" });
    console.log("Saved docs/art/puppet/batch1_style_check.png");
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
