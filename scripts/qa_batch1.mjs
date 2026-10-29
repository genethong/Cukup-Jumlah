import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });

  // 1. Desktop Lab (default)
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

  // 4. Style check: Baju Melayu vs T-shirt vs Hoodie at identical scale
  const stagePage = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  await stagePage.goto("http://127.0.0.1:8080/dev?lab=puppet", { waitUntil: "networkidle" });
  await stagePage.waitForTimeout(500);

  const stageButtons = await stagePage.$$("section .grid-cols-3 > div > button");

  async function applyPicker(labelContains, buttonText) {
    const pickers = await stagePage.$$("fieldset");
    for (const f of pickers) {
      const text = await f.textContent();
      if (text.includes(labelContains)) {
        const btn = await f.$(`button:has-text("${buttonText}")`);
        if (btn) await btn.click();
      }
    }
    await stagePage.waitForTimeout(100);
  }

  // Puppet 2 (middle): male, short hair, T-shirt, Jeans, Sneakers
  await stageButtons[1].click();
  await stagePage.waitForTimeout(200);
  await applyPicker("Jantina", "Lelaki");
  await applyPicker("Kepala", "Kepala L1");
  await applyPicker("Tutup kepala", "Tiada");
  await applyPicker("Baju", "T-shirt");
  await applyPicker("Seluar", "Jeans");
  await applyPicker("Kasut", "Sneakers");

  // Puppet 3 (right): male, short hair, Hoodie, Jeans, Sneakers
  await stageButtons[2].click();
  await stagePage.waitForTimeout(200);
  await applyPicker("Jantina", "Lelaki");
  await applyPicker("Kepala", "Kepala L2");
  await applyPicker("Tutup kepala", "Tiada");
  await applyPicker("Baju", "Hoodie");
  await applyPicker("Seluar", "Jeans");
  await applyPicker("Kasut", "Sneakers");

  // Reset selection to middle
  await stageButtons[1].click();
  await stagePage.waitForTimeout(400);

  const stage = await stagePage.$("section:has(.grid-cols-3)");
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
