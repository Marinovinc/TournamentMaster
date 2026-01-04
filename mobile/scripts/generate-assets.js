/**
 * =============================================================================
 * TournamentMaster - Asset Generator V5
 * =============================================================================
 * Design: Pesce di Pietra (Stone Fish) - Stile FUMETTO/CARTOON
 * Immagine: fish-534760_1920.jpg da Pixabay
 * =============================================================================
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = 'C:\\Users\\marin\\Downloads\\fish-534760_1920.jpg';
const ASSETS_DIR = path.join(__dirname, '..', 'assets');

// Colori brand
const OCEAN_BLUE = { r: 0, g: 102, b: 204 };

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

/**
 * Applica effetto fumetto/cartoon all'immagine
 * - Aumenta saturazione per colori vivaci
 * - Aumenta contrasto
 * - Semplifica dettagli con median filter
 * - Bordi più netti con sharpen
 */
async function applyCartoonEffect(inputBuffer) {
  return await sharp(inputBuffer)
    // Aumenta saturazione (+40%) e luminosità (+10%)
    .modulate({
      saturation: 1.5,
      brightness: 1.1
    })
    // Semplifica i dettagli (effetto pittura)
    .median(3)
    // Aumenta contrasto
    .normalize()
    // Bordi più netti
    .sharpen({
      sigma: 2,
      m1: 1.5,
      m2: 0.7
    })
    .toBuffer();
}

/**
 * Genera l'icona principale 1024x1024
 */
async function generateAppIcon() {
  console.log('Generando icon.png (1024x1024)...');

  const metadata = await sharp(SOURCE_IMAGE).metadata();

  // Estrai la porzione con il pesce (rimuovi sfondo superiore e legno inferiore)
  const cropWidth = Math.floor(metadata.width * 0.92);
  const cropHeight = Math.floor(metadata.height * 0.72);
  const cropLeft = Math.floor((metadata.width - cropWidth) / 2);
  const cropTop = Math.floor(metadata.height * 0.05);

  // Estrai e ridimensiona il pesce
  const fishRaw = await sharp(SOURCE_IMAGE)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .resize(820, 530, { fit: 'inside', background: { r: 0, g: 102, b: 204, alpha: 0 } })
    .toBuffer();

  // Applica effetto fumetto
  const fishBuffer = await applyCartoonEffect(fishRaw);

  // Crea sfondo blu oceano
  const background = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { ...OCEAN_BLUE, alpha: 1 } }
  }).png().toBuffer();

  // Crea overlay TM
  const tmOverlay = Buffer.from(`
    <svg width="1024" height="1024">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <text x="512" y="920" font-family="Arial Black, Arial" font-size="72" font-weight="bold"
            fill="white" text-anchor="middle" filter="url(#shadow)">TournamentMaster</text>
    </svg>
  `);

  // Componi: sfondo + pesce + testo
  await sharp(background)
    .composite([
      { input: fishBuffer, top: 180, left: 102 },
      { input: tmOverlay, top: 0, left: 0 }
    ])
    .png()
    .toFile(path.join(ASSETS_DIR, 'icon.png'));

  console.log('  -> icon.png creato');
}

/**
 * Genera adaptive icon per Android (safe zone 66%)
 */
async function generateAdaptiveIcon() {
  console.log('Generando adaptive-icon.png...');

  const metadata = await sharp(SOURCE_IMAGE).metadata();

  const cropWidth = Math.floor(metadata.width * 0.92);
  const cropHeight = Math.floor(metadata.height * 0.72);
  const cropLeft = Math.floor((metadata.width - cropWidth) / 2);
  const cropTop = Math.floor(metadata.height * 0.05);

  // Per adaptive icon, contenuto nella safe zone centrale (più piccolo)
  const fishRaw = await sharp(SOURCE_IMAGE)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .resize(620, 400, { fit: 'inside' })
    .toBuffer();

  // Applica effetto fumetto
  const fishBuffer = await applyCartoonEffect(fishRaw);

  const background = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { ...OCEAN_BLUE, alpha: 1 } }
  }).png().toBuffer();

  await sharp(background)
    .composite([{ input: fishBuffer, top: 312, left: 202 }])
    .png()
    .toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));

  console.log('  -> adaptive-icon.png creato');
}

/**
 * Genera splash screen 1284x2778
 */
async function generateSplashScreen() {
  console.log('Generando splash.png (1284x2778)...');

  const metadata = await sharp(SOURCE_IMAGE).metadata();

  const cropWidth = Math.floor(metadata.width * 0.92);
  const cropHeight = Math.floor(metadata.height * 0.72);
  const cropLeft = Math.floor((metadata.width - cropWidth) / 2);
  const cropTop = Math.floor(metadata.height * 0.05);

  // Pesce grande per splash
  const fishRaw = await sharp(SOURCE_IMAGE)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .resize(1000, 650, { fit: 'inside' })
    .toBuffer();

  // Applica effetto fumetto
  const fishBuffer = await applyCartoonEffect(fishRaw);

  const background = await sharp({
    create: { width: 1284, height: 2778, channels: 4, background: { ...OCEAN_BLUE, alpha: 1 } }
  }).png().toBuffer();

  // Overlay con titolo
  const textOverlay = Buffer.from(`
    <svg width="1284" height="2778">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <text x="642" y="1550" font-family="Arial Black, Arial" font-size="88" font-weight="bold"
            fill="white" text-anchor="middle" filter="url(#glow)">TOURNAMENT</text>
      <text x="642" y="1660" font-family="Arial Black, Arial" font-size="88" font-weight="bold"
            fill="#00D4FF" text-anchor="middle">MASTER</text>
      <text x="642" y="1750" font-family="Arial" font-size="32"
            fill="white" text-anchor="middle" opacity="0.7">PESCA SPORTIVA</text>
      <line x1="442" y1="1800" x2="842" y2="1800" stroke="#FFD700" stroke-width="2" opacity="0.5"/>
    </svg>
  `);

  await sharp(background)
    .composite([
      { input: fishBuffer, top: 800, left: 142 },
      { input: textOverlay, top: 0, left: 0 }
    ])
    .png()
    .toFile(path.join(ASSETS_DIR, 'splash.png'));

  console.log('  -> splash.png creato');
}

/**
 * Genera favicon 48x48
 */
async function generateFavicon() {
  console.log('Generando favicon.png (48x48)...');

  const metadata = await sharp(SOURCE_IMAGE).metadata();

  const cropWidth = Math.floor(metadata.width * 0.92);
  const cropHeight = Math.floor(metadata.height * 0.72);
  const cropLeft = Math.floor((metadata.width - cropWidth) / 2);
  const cropTop = Math.floor(metadata.height * 0.05);

  const fishRaw = await sharp(SOURCE_IMAGE)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .resize(40, 26, { fit: 'inside' })
    .toBuffer();

  // Applica effetto fumetto
  const fishBuffer = await applyCartoonEffect(fishRaw);

  const background = await sharp({
    create: { width: 48, height: 48, channels: 4, background: { ...OCEAN_BLUE, alpha: 1 } }
  }).png().toBuffer();

  await sharp(background)
    .composite([{ input: fishBuffer, top: 11, left: 4 }])
    .png()
    .toFile(path.join(ASSETS_DIR, 'favicon.png'));

  console.log('  -> favicon.png creato');
}

async function main() {
  console.log('\n========================================');
  console.log('  TournamentMaster Asset Generator V4');
  console.log('  Design: Pesce di Pietra (Stone Fish)');
  console.log('========================================\n');

  // Verifica immagine sorgente
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error('Immagine sorgente non trovata:', SOURCE_IMAGE);
    process.exit(1);
  }

  const metadata = await sharp(SOURCE_IMAGE).metadata();
  console.log(`Immagine sorgente: ${metadata.width}x${metadata.height}\n`);

  try {
    await generateAppIcon();
    await generateAdaptiveIcon();
    await generateSplashScreen();
    await generateFavicon();

    console.log('\n========================================');
    console.log('  Asset generati con successo!');
    console.log('========================================\n');

    // Mostra riepilogo
    const files = fs.readdirSync(ASSETS_DIR).filter(f => f.endsWith('.png'));
    console.log('File creati:');
    files.forEach(file => {
      const stats = fs.statSync(path.join(ASSETS_DIR, file));
      console.log(`  - ${file} (${Math.round(stats.size / 1024)}KB)`);
    });

  } catch (error) {
    console.error('Errore:', error);
    process.exit(1);
  }
}

main();
