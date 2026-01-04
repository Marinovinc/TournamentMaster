/**
 * Genera mockup Home Screen Android e iOS
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const ICON_PATH = path.join(ASSETS_DIR, 'icon.png');

async function main() {
  console.log('\nGenerando mockup home screen...\n');

  // =====================================================
  // MOCKUP ANDROID
  // =====================================================
  console.log('1. Android Home Screen...');

  // Sfondo Android (gradient scuro)
  const androidBg = Buffer.from(`
    <svg width="1080" height="1920">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e"/>
          <stop offset="100%" style="stop-color:#16213e"/>
        </linearGradient>
      </defs>
      <rect width="1080" height="1920" fill="url(#bg)"/>

      <!-- Status bar -->
      <text x="50" y="50" font-family="Arial" font-size="28" fill="white">9:41</text>
      <text x="950" y="50" font-family="Arial" font-size="28" fill="white">100%</text>

      <!-- Dock bar in basso -->
      <rect x="0" y="1750" width="1080" height="170" fill="rgba(0,0,0,0.3)"/>

      <!-- Griglia icone placeholder -->
      <g fill="rgba(255,255,255,0.1)">
        <rect x="80" y="200" width="160" height="160" rx="30"/>
        <rect x="300" y="200" width="160" height="160" rx="30"/>
        <rect x="520" y="200" width="160" height="160" rx="30"/>
        <rect x="740" y="200" width="160" height="160" rx="30"/>

        <rect x="80" y="450" width="160" height="160" rx="30"/>
        <rect x="300" y="450" width="160" height="160" rx="30"/>
        <!-- TournamentMaster qui -->
        <rect x="740" y="450" width="160" height="160" rx="30"/>
      </g>

      <!-- Label per TournamentMaster -->
      <text x="600" y="660" font-family="Arial" font-size="24" fill="white" text-anchor="middle">Tournament</text>
      <text x="600" y="690" font-family="Arial" font-size="24" fill="white" text-anchor="middle">Master</text>
    </svg>
  `);

  const androidBgBuffer = await sharp(androidBg).png().toBuffer();

  // Icona ridimensionata per Android (160x160 con bordi arrotondati)
  const androidIcon = await sharp(ICON_PATH)
    .resize(160, 160)
    .toBuffer();

  await sharp(androidBgBuffer)
    .composite([
      { input: androidIcon, top: 450, left: 520 }
    ])
    .png()
    .toFile(path.join(ASSETS_DIR, 'mockup_android.png'));

  console.log('   -> mockup_android.png OK');

  // =====================================================
  // MOCKUP iOS
  // =====================================================
  console.log('2. iOS Home Screen...');

  // Sfondo iOS (gradient chiaro/colorato)
  const iosBg = Buffer.from(`
    <svg width="1170" height="2532">
      <defs>
        <linearGradient id="iosbg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea"/>
          <stop offset="50%" style="stop-color:#764ba2"/>
          <stop offset="100%" style="stop-color:#f093fb"/>
        </linearGradient>
      </defs>
      <rect width="1170" height="2532" fill="url(#iosbg)"/>

      <!-- Status bar iOS -->
      <text x="80" y="80" font-family="SF Pro, Arial" font-size="34" fill="white" font-weight="600">9:41</text>

      <!-- Notch area -->
      <rect x="400" y="0" width="370" height="60" rx="30" fill="black"/>

      <!-- Dock iOS -->
      <rect x="60" y="2300" width="1050" height="180" rx="40" fill="rgba(255,255,255,0.2)"/>

      <!-- Griglia icone iOS placeholder -->
      <g fill="rgba(255,255,255,0.15)">
        <rect x="100" y="250" width="180" height="180" rx="40"/>
        <rect x="340" y="250" width="180" height="180" rx="40"/>
        <rect x="580" y="250" width="180" height="180" rx="40"/>
        <rect x="820" y="250" width="180" height="180" rx="40"/>

        <rect x="100" y="530" width="180" height="180" rx="40"/>
        <rect x="340" y="530" width="180" height="180" rx="40"/>
        <!-- TournamentMaster qui -->
        <rect x="820" y="530" width="180" height="180" rx="40"/>
      </g>

      <!-- Label per TournamentMaster -->
      <text x="670" y="760" font-family="SF Pro, Arial" font-size="26" fill="white" text-anchor="middle">TournamentMaster</text>
    </svg>
  `);

  const iosBgBuffer = await sharp(iosBg).png().toBuffer();

  // Icona ridimensionata per iOS (180x180)
  const iosIcon = await sharp(ICON_PATH)
    .resize(180, 180)
    .toBuffer();

  // Aggiungi bordi arrotondati iOS style
  const iosIconRounded = await sharp(iosIcon)
    .composite([{
      input: Buffer.from(`
        <svg width="180" height="180">
          <rect width="180" height="180" rx="40" fill="white"/>
        </svg>
      `),
      blend: 'dest-in'
    }])
    .toBuffer();

  await sharp(iosBgBuffer)
    .composite([
      { input: iosIconRounded, top: 530, left: 580 }
    ])
    .png()
    .toFile(path.join(ASSETS_DIR, 'mockup_ios.png'));

  console.log('   -> mockup_ios.png OK');

  console.log('\nMockup completati!');
}

main().catch(console.error);
