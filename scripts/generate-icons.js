#!/usr/bin/env node
/**
 * Generate PWA icons for FlagFit Pro
 * Creates proper PNG icons from SVG using sharp
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.join(__dirname, "../angular/src/assets/icons");
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

async function generateWithSharp() {
  try {
    const sharp = (await import("sharp")).default;

    for (const size of SIZES) {
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6"/>
      <stop offset="100%" style="stop-color:#1D4ED8"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${Math.round(size * 0.15)}"/>
  <text x="${size / 2}" y="${size * 0.68}" font-size="${Math.round(size * 0.5)}" text-anchor="middle" dominant-baseline="middle">🏈</text>
</svg>`;

      const svgPath = path.join(ICONS_DIR, `icon-${size}x${size}.svg`);
      fs.writeFileSync(svgPath, svgContent);
      console.log(`✅ Created ${path.basename(svgPath)}`);

      const pngPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(pngPath);
      console.log(`✅ Created ${path.basename(pngPath)}`);
    }

    return true;
  } catch (err) {
    console.log("Sharp not available or failed:", err.message);
    return false;
  }
}

async function generateFallbackPngs() {
  try {
    const sharp = (await import("sharp")).default;

    for (const size of SIZES) {
      const pngPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);

      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 59, g: 130, b: 246, alpha: 1 },
        },
      })
        .png()
        .toFile(pngPath);

      console.log(`✅ Created ${path.basename(pngPath)} (solid color)`);
    }
    return true;
  } catch (err) {
    console.log("Fallback also failed:", err.message);
    return false;
  }
}

function generateSvgsOnly() {
  for (const size of SIZES) {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6"/>
      <stop offset="100%" style="stop-color:#1D4ED8"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${Math.round(size * 0.15)}"/>
  <text x="${size / 2}" y="${size * 0.68}" font-size="${Math.round(size * 0.5)}" text-anchor="middle" dominant-baseline="middle">🏈</text>
</svg>`;

    const svgPath = path.join(ICONS_DIR, `icon-${size}x${size}.svg`);
    fs.writeFileSync(svgPath, svgContent);
    console.log(`✅ Created ${path.basename(svgPath)}`);
  }
}

async function main() {
  console.log("🎨 Generating PWA icons for FlagFit Pro...\n");

  let success = await generateWithSharp();

  if (!success) {
    console.log("\n⚠️  Trying fallback PNG generation...\n");
    success = await generateFallbackPngs();
  }

  if (!success) {
    console.log("\n⚠️  Creating SVG icons only (PNG generation failed)\n");
    generateSvgsOnly();
  }

  console.log("\n📱 Icon generation complete!");
  console.log(`Icons saved to: ${ICONS_DIR}`);
}

main().catch(console.error);
