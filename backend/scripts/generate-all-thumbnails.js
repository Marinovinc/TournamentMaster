/**
 * Script per generare thumbnail per tutti i video nel database
 * Usage: node scripts/generate-all-thumbnails.js
 */

const { PrismaClient } = require('@prisma/client');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Directory
const THUMBNAILS_DIR = path.join(__dirname, '../../frontend/public/thumbnails');
const BANNERS_DIR = path.join(__dirname, '../../frontend/public/images/banners');

// Estensioni video
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.mpg', '.mpeg'];

// Assicurati che la directory thumbnails esista
if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

function isVideo(filename) {
  const ext = path.extname(filename).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

async function getVideoMetadata(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        resolve(null);
        return;
      }
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      resolve({
        duration: Math.round(metadata.format.duration || 0),
        width: videoStream?.width || null,
        height: videoStream?.height || null,
      });
    });
  });
}

async function generateThumbnail(videoPath, outputName) {
  return new Promise((resolve, reject) => {
    const thumbnailPath = path.join(THUMBNAILS_DIR, `${outputName}.jpg`);

    // Se esiste già, skip
    if (fs.existsSync(thumbnailPath)) {
      resolve({ success: true, path: `/thumbnails/${outputName}.jpg`, skipped: true });
      return;
    }

    ffmpeg(videoPath)
      .screenshots({
        timestamps: [1],
        filename: `${outputName}.jpg`,
        folder: THUMBNAILS_DIR,
        size: '480x?',
      })
      .on('end', () => {
        resolve({ success: true, path: `/thumbnails/${outputName}.jpg` });
      })
      .on('error', (err) => {
        resolve({ success: false, error: err.message });
      });
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('Generazione Thumbnails per tutti i video nel database');
  console.log('='.repeat(60));
  console.log('');

  // Trova tutti i video nel database
  const allMedia = await prisma.bannerImage.findMany({
    where: { isActive: true },
    select: {
      id: true,
      filename: true,
      path: true,
      title: true,
      thumbnailPath: true,
      duration: true,
    },
  });

  const videos = allMedia.filter(m => isVideo(m.filename));

  console.log(`Totale media nel database: ${allMedia.length}`);
  console.log(`Video trovati: ${videos.length}`);
  console.log('');

  if (videos.length === 0) {
    console.log('Nessun video da processare.');
    return;
  }

  let processed = 0;
  let skipped = 0;
  let failed = 0;
  let updated = 0;

  for (const video of videos) {
    console.log('-'.repeat(60));
    console.log(`[${processed + skipped + failed + 1}/${videos.length}] ${video.title}`);
    console.log(`   File: ${video.filename}`);

    // Costruisci il path completo del video
    const videoPath = path.join(BANNERS_DIR, video.filename);

    // Verifica che il file esista
    if (!fs.existsSync(videoPath)) {
      console.log(`   SKIP: File non trovato su disco`);
      failed++;
      continue;
    }

    // Genera nome thumbnail dal nome file (senza estensione)
    const thumbnailName = path.parse(video.filename).name;

    // Genera thumbnail
    const result = await generateThumbnail(videoPath, thumbnailName);

    if (!result.success) {
      console.log(`   ERRORE: ${result.error}`);
      failed++;
      continue;
    }

    if (result.skipped) {
      console.log(`   Thumbnail già esistente`);
      skipped++;
    } else {
      console.log(`   Thumbnail generato: ${result.path}`);
      processed++;
    }

    // Ottieni metadati video se non presenti
    let duration = video.duration;
    if (!duration) {
      const metadata = await getVideoMetadata(videoPath);
      if (metadata) {
        duration = metadata.duration;
      }
    }

    // Aggiorna database se necessario
    if (video.thumbnailPath !== result.path || video.duration !== duration) {
      await prisma.bannerImage.update({
        where: { id: video.id },
        data: {
          thumbnailPath: result.path,
          duration: duration,
        },
      });
      console.log(`   Database aggiornato`);
      updated++;
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('RIEPILOGO');
  console.log('='.repeat(60));
  console.log(`Video totali:     ${videos.length}`);
  console.log(`Thumbnail nuovi:  ${processed}`);
  console.log(`Già esistenti:    ${skipped}`);
  console.log(`Falliti:          ${failed}`);
  console.log(`DB aggiornati:    ${updated}`);
  console.log('='.repeat(60));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
