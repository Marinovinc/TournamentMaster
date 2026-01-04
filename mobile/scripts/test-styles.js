/**
 * Test 5 stilizzazioni diverse del Pesce di Pietra
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = 'C:\\Users\\marin\\Downloads\\fish-534760_1920.jpg';
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'test-styles');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function extractFish() {
  const metadata = await sharp(SOURCE_IMAGE).metadata();
  const cropWidth = Math.floor(metadata.width * 0.92);
  const cropHeight = Math.floor(metadata.height * 0.72);
  const cropLeft = Math.floor((metadata.width - cropWidth) / 2);
  const cropTop = Math.floor(metadata.height * 0.05);

  return await sharp(SOURCE_IMAGE)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .resize(800, 520, { fit: 'inside' })
    .toBuffer();
}

async function main() {
  console.log('\n===========================================');
  console.log('  5 STILIZZAZIONI - Pesce di Pietra');
  console.log('===========================================\n');

  const fishRaw = await extractFish();

  // =====================================================
  // STILE 1: CARTOON VIVACE
  // Colori saturi, bordi netti, look fumetto classico
  // =====================================================
  console.log('1. Cartoon Vivace...');
  const style1 = await sharp(fishRaw)
    .modulate({ saturation: 1.8, brightness: 1.15 })
    .median(3)
    .sharpen({ sigma: 2.5 })
    .toBuffer();
  await sharp(style1).toFile(path.join(OUTPUT_DIR, '1_cartoon_vivace.png'));

  // =====================================================
  // STILE 2: VINTAGE SEPPIA
  // Toni caldi, effetto foto antica
  // =====================================================
  console.log('2. Vintage Seppia...');
  const style2 = await sharp(fishRaw)
    .modulate({ saturation: 0.3, brightness: 1.05 })
    .tint({ r: 180, g: 140, b: 100 })
    .gamma(1.2)
    .toBuffer();
  await sharp(style2).toFile(path.join(OUTPUT_DIR, '2_vintage_seppia.png'));

  // =====================================================
  // STILE 3: HIGH CONTRAST B/W
  // Bianco e nero drammatico
  // =====================================================
  console.log('3. High Contrast B/W...');
  const style3 = await sharp(fishRaw)
    .greyscale()
    .normalize()
    .sharpen({ sigma: 1.5 })
    .modulate({ brightness: 1.1 })
    .toBuffer();
  await sharp(style3).toFile(path.join(OUTPUT_DIR, '3_bw_contrast.png'));

  // =====================================================
  // STILE 4: POP ART / POSTERIZE
  // Riduzione colori, stile Andy Warhol
  // =====================================================
  console.log('4. Pop Art...');
  const style4 = await sharp(fishRaw)
    .modulate({ saturation: 2.2, brightness: 1.2 })
    .normalize()
    .median(5)
    .sharpen({ sigma: 3 })
    .toBuffer();
  await sharp(style4).toFile(path.join(OUTPUT_DIR, '4_pop_art.png'));

  // =====================================================
  // STILE 5: ACQUARELLO / PITTURA
  // Effetto dipinto a mano, bordi morbidi
  // =====================================================
  console.log('5. Acquarello...');
  const style5 = await sharp(fishRaw)
    .modulate({ saturation: 1.3, brightness: 1.1 })
    .blur(0.8)
    .median(4)
    .modulate({ saturation: 1.4 })
    .toBuffer();
  await sharp(style5).toFile(path.join(OUTPUT_DIR, '5_acquarello.png'));

  // Salva anche originale per confronto
  console.log('0. Originale (per confronto)...');
  await sharp(fishRaw).toFile(path.join(OUTPUT_DIR, '0_originale.png'));

  console.log('\n===========================================');
  console.log('  File creati in: assets/test-styles/');
  console.log('===========================================\n');

  const files = fs.readdirSync(OUTPUT_DIR).sort();
  files.forEach(f => {
    const stats = fs.statSync(path.join(OUTPUT_DIR, f));
    console.log(`  ${f} (${Math.round(stats.size/1024)}KB)`);
  });
}

main().catch(console.error);
