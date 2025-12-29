import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public', 'icons');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG icon - pesce stilizzato con onde
const createSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9"/>
      <stop offset="100%" style="stop-color:#0369a1"/>
    </linearGradient>
    <linearGradient id="fish" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f8fafc"/>
      <stop offset="100%" style="stop-color:#e2e8f0"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="100" fill="url(#bg)"/>

  <!-- Trophy/Cup base -->
  <path d="M200 380 L312 380 L290 340 L222 340 Z" fill="#fbbf24"/>
  <rect x="230" y="320" width="52" height="25" fill="#f59e0b"/>

  <!-- Fish body -->
  <ellipse cx="256" cy="220" rx="120" ry="60" fill="url(#fish)"/>

  <!-- Fish tail -->
  <path d="M136 220 L80 170 L80 270 Z" fill="url(#fish)"/>

  <!-- Fish eye -->
  <circle cx="320" cy="200" r="15" fill="#0f172a"/>
  <circle cx="325" cy="195" r="5" fill="#ffffff"/>

  <!-- Fish fin top -->
  <path d="M230 160 L256 100 L282 160" fill="#94a3b8" stroke="#64748b" stroke-width="2"/>

  <!-- Waves -->
  <path d="M100 420 Q130 400 160 420 T220 420 T280 420 T340 420 T400 420"
        fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" opacity="0.5"/>
  <path d="M80 450 Q110 430 140 450 T200 450 T260 450 T320 450 T380 450 T440 450"
        fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity="0.3"/>
</svg>
`;

async function generateIcons() {
  await mkdir(publicDir, { recursive: true });

  for (const size of sizes) {
    const svg = createSvg(size);
    const outputPath = join(publicDir, `icon-${size}x${size}.png`);

    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`Generated: icon-${size}x${size}.png`);
  }

  // Apple touch icon
  const appleSvg = createSvg(180);
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated: apple-touch-icon.png');

  // Favicon
  const faviconSvg = createSvg(32);
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon-32x32.png'));
  console.log('Generated: favicon-32x32.png');

  await sharp(Buffer.from(createSvg(16)))
    .resize(16, 16)
    .png()
    .toFile(join(publicDir, 'favicon-16x16.png'));
  console.log('Generated: favicon-16x16.png');
}

generateIcons().catch(console.error);
