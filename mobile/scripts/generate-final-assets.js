/**
 * =============================================================================
 * TournamentMaster - Asset Generator FINALE
 * =============================================================================
 * Usa il logo professionale TOURNAMENTMASTER.bmp
 * =============================================================================
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_LOGO = 'C:/Users/marin/Downloads/TournamentMaster/TOURNAMENTMASTER.bmp';
const ASSETS_DIR = path.join(__dirname, '..', 'assets');

const OCEAN_BLUE = { r: 30, g: 115, b: 175 }; // Colore sfondo dal logo

async function main() {
  console.log('\n==============================================');
  console.log('  TournamentMaster - Asset Generator FINALE');
  console.log('==============================================\n');

  // Verifica sorgente
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error('Logo non trovato:', SOURCE_LOGO);
    process.exit(1);
  }

  const metadata = await sharp(SOURCE_LOGO).metadata();
  console.log(`Logo sorgente: ${metadata.width}x${metadata.height}\n`);

  // =====================================================
  // 1. ICON (1024x1024)
  // =====================================================
  console.log('1. Generando icon.png (1024x1024)...');
  await sharp(SOURCE_LOGO)
    .resize(1024, 1024, { fit: 'cover', position: 'center' })
    .png()
    .toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('   -> OK');

  // =====================================================
  // 2. ADAPTIVE ICON (1024x1024) - logo centrato con padding
  // =====================================================
  console.log('2. Generando adaptive-icon.png...');

  // Per Android adaptive icon, il contenuto deve stare nel 66% centrale
  const logoForAdaptive = await sharp(SOURCE_LOGO)
    .resize(680, 680, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const adaptiveBg = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { ...OCEAN_BLUE, alpha: 1 } }
  }).png().toBuffer();

  await sharp(adaptiveBg)
    .composite([{ input: logoForAdaptive, top: 172, left: 172 }])
    .png()
    .toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));
  console.log('   -> OK');

  // =====================================================
  // 3. SPLASH SCREEN (1284x2778)
  // =====================================================
  console.log('3. Generando splash.png (1284x2778)...');

  const logoForSplash = await sharp(SOURCE_LOGO)
    .resize(600, 600, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const splashBg = await sharp({
    create: { width: 1284, height: 2778, channels: 4, background: { ...OCEAN_BLUE, alpha: 1 } }
  }).png().toBuffer();

  await sharp(splashBg)
    .composite([{ input: logoForSplash, top: 900, left: 342 }])
    .png()
    .toFile(path.join(ASSETS_DIR, 'splash.png'));
  console.log('   -> OK');

  // =====================================================
  // 4. FAVICON (48x48)
  // =====================================================
  console.log('4. Generando favicon.png (48x48)...');
  await sharp(SOURCE_LOGO)
    .resize(48, 48, { fit: 'cover', position: 'center' })
    .png()
    .toFile(path.join(ASSETS_DIR, 'favicon.png'));
  console.log('   -> OK');

  // =====================================================
  // RIEPILOGO
  // =====================================================
  console.log('\n==============================================');
  console.log('  Asset generati con successo!');
  console.log('==============================================\n');

  const files = ['icon.png', 'adaptive-icon.png', 'splash.png', 'favicon.png'];
  console.log('File creati:');
  files.forEach(file => {
    const filePath = path.join(ASSETS_DIR, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${Math.round(stats.size / 1024)}KB)`);
    }
  });
}

main().catch(console.error);
