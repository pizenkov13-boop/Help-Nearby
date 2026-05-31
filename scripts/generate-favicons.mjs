import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import toIco from "to-ico";

const root = process.cwd();
const logoPath = path.join(root, "public", "images", "logo.svg");
const publicDir = path.join(root, "public");
const iconsDir = path.join(publicDir, "icons");
const appDir = path.join(root, "app");

const sizes = [
  { name: "favicon-16x16.png", size: 16, dir: publicDir },
  { name: "favicon-32x32.png", size: 32, dir: publicDir },
  { name: "favicon.png", size: 32, dir: publicDir },
  { name: "icon-192.png", size: 192, dir: iconsDir },
  { name: "icon-512.png", size: 512, dir: iconsDir },
  { name: "icon-maskable-512.png", size: 512, dir: iconsDir },
];

async function renderPng(size) {
  return sharp(logoPath, { density: Math.max(192, size * 4) })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

await mkdir(iconsDir, { recursive: true });

const pngBySize = new Map();
for (const { name, size, dir } of sizes) {
  const buffer = await renderPng(size);
  pngBySize.set(size, buffer);
  await writeFile(path.join(dir, name), buffer);
  console.log(`Wrote ${path.relative(root, path.join(dir, name))}`);
}

const faviconIco = await toIco([pngBySize.get(16), pngBySize.get(32)]);
await writeFile(path.join(publicDir, "favicon.ico"), faviconIco);
console.log("Wrote public/favicon.ico");

await copyFile(path.join(publicDir, "favicon.ico"), path.join(appDir, "favicon.ico"));
await copyFile(path.join(publicDir, "favicon.png"), path.join(appDir, "icon.png"));
await copyFile(path.join(iconsDir, "icon-192.png"), path.join(appDir, "apple-icon.png"));
console.log("Copied favicon.ico, icon.png, apple-icon.png to app/");
