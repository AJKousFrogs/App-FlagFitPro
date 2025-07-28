#!/usr/bin/env node

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes that are missing from the manifest
const sizes = [96, 128, 144, 152, 384];
const iconsDir = path.join(__dirname, '../public/icons');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Create gradient background matching the SVG
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4a7c59'); // Green
  gradient.addColorStop(1, '#3B82F6'); // Blue
  
  // Draw rounded rectangle background
  const radius = size * 0.125; // 64px for 512px icon
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Draw circle overlay
  const circleRadius = size * 0.35; // 180px for 512px icon
  ctx.beginPath();
  ctx.arc(size/2, size/2, circleRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = size * 0.008; // 4px for 512px icon
  ctx.stroke();
  
  // Fill circle with semi-transparent white
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fill();
  
  // Draw "FF" text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.23}px Arial`; // 120px for 512px icon
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FF', size/2, size/2 - size * 0.14); // 280px for 512px icon
  
  // Draw "Pro" text
  ctx.font = `${size * 0.078}px Arial`; // 40px for 512px icon
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('Pro', size/2, size/2 + size * 0.18); // 350px for 512px icon
  
  return canvas;
}

function generateAllIcons() {
  console.log('🎨 Generating missing PWA icons...');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  sizes.forEach(size => {
    try {
      const canvas = generateIcon(size);
      const buffer = canvas.toBuffer('image/png');
      const filename = `icon-${size}x${size}.png`;
      const filepath = path.join(iconsDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      console.log(`✅ Generated ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to generate icon-${size}x${size}.png:`, error.message);
    }
  });
  
  console.log('🎉 Icon generation complete!');
  console.log('\n📋 Generated icons:');
  sizes.forEach(size => {
    console.log(`   - icon-${size}x${size}.png`);
  });
}

// Run the generator
generateAllIcons(); 