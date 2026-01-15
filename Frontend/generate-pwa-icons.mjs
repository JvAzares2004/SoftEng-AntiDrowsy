import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputImage = join(__dirname, 'src', 'component', 'img', 'Drowsiness-Logo.png');
const outputDir = join(__dirname, 'public');

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }
];

async function generateIcons() {
  console.log('Generating PWA icons...\n');

  if (!fs.existsSync(inputImage)) {
    console.error(`Error: Input image not found at ${inputImage}`);
    process.exit(1);
  }

  for (const { name, size } of sizes) {
    const outputPath = join(outputDir, name);
    
    try {
      await sharp(inputImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }

  console.log('\n✓ All icons generated successfully!');
  console.log('Icons saved in:', outputDir);
}

generateIcons().catch(console.error);
