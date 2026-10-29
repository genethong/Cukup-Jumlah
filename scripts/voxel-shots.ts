/**
 * Headless shots of the voxel proof at desktop and phone sizes, plus the
 * six skin tones and three headwear options. Prints renderer stats as JSON.
 *
 *   node --experimental-strip-types scripts/voxel-shots.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";

const base = process.env.VOXEL_BASE ?? "http://127.0.0.1:8080";
const outDir = path.resolve("docs/art/poc");

async function launch() {
  return chromium.launch({
    executablePath: "/opt/google/chrome/chrome",
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
  });
}

async function capture(page: Page, url: string, file: string, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForFunction(() => window.__VOXEL_POC__?.ready === true, null, { timeout: 60000 });
  await page.waitForTimeout(200);
  await page.locator("canvas").screenshot({ path: path.join(outDir, file) });
  return page.evaluate(() => window.__VOXEL_POC__);
}

async function measureFps(page: Page, throttle: number) {
  const client = await page.context().newCDPSession(page);
  if (throttle > 1) await client.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  await page.setViewportSize({ width: 1080, height: 1080 });
  await page.goto(`${base}/voxel-poc`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForFunction(() => (window.__VOXEL_POC__?.fps ?? 0) > 0, null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  const stats = await page.evaluate(() => window.__VOXEL_POC__);
  if (throttle > 1) await client.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  return stats;
}

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
page.on("pageerror", (err) => console.error("PAGE", err.message));
await mkdir(outDir, { recursive: true });

const hero = await capture(page, `${base}/voxel-poc?shot=1`, "hero-1080.png", 1080, 1080);
await capture(page, `${base}/voxel-poc?shot=1`, "hero-390.png", 390, 844);

for (let skin = 0; skin < 6; skin++) {
  await capture(page, `${base}/voxel-poc?shot=1&skin=${skin}`, `skin-${skin}.png`, 640, 640);
}
for (const wear of ["songkok", "tudung", "cap"] as const) {
  await capture(page, `${base}/voxel-poc?shot=1&wear=${wear}`, `wear-${wear}.png`, 640, 640);
}

const desktop = await measureFps(page, 1);
const throttled = await measureFps(page, 4);
await browser.close();

const report = { hero, desktop, throttled };
await writeFile(path.join(outDir, "stats.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
