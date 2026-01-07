/**
 * Resize all banner images to 800x400
 * Run with: node scripts/resize-banners.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BANNERS_DIR = path.join(__dirname, '../public/images/banners');
const OUTPUT_DIR = path.join(__dirname, '../public/images/banners');
const TARGET_WIDTH = 800;
const TARGET_HEIGHT = 400;

async function resizeBanners() {
  const files = fs.readdirSync(BANNERS_DIR);

  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png)$/i)) {
      const inputPath = path.join(BANNERS_DIR, file);
      const outputPath = path.join(OUTPUT_DIR, file.replace(/\.(jpg|jpeg|png)$/i, '.jpg'));

      try {
        const metadata = await sharp(inputPath).metadata();
        console.log(`Processing ${file}: ${metadata.width}x${metadata.height}`);

        await sharp(inputPath)
          .resize(TARGET_WIDTH, TARGET_HEIGHT, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 85 })
          .toFile(outputPath + '.tmp');

        // Replace original with resized
        fs.unlinkSync(inputPath);
        fs.renameSync(outputPath + '.tmp', outputPath);

        console.log(`  -> Resized to ${TARGET_WIDTH}x${TARGET_HEIGHT}: ${outputPath}`);
      } catch (err) {
        console.error(`Error processing ${file}:`, err.message);
      }
    }
  }

  console.log('\nDone! All banners resized to 800x400.');
}

resizeBanners();
