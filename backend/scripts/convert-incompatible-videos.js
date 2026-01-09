/**
 * Script per convertire video non compatibili con i browser in MP4 (H.264)
 * Usage: node scripts/convert-incompatible-videos.js
 *
 * Converte automaticamente i video con estensioni .mpg, .mpeg, .avi, .mkv
 * in formato MP4 compatibile con tutti i browser.
 */

const { PrismaClient } = require('@prisma/client');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Directory
const BANNERS_DIR = path.join(__dirname, '../../frontend/public/images/banners');
const THUMBNAILS_DIR = path.join(__dirname, '../../frontend/public/thumbnails');

// Estensioni video
const ALL_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.mpg', '.mpeg'];
// Estensioni compatibili con i browser
const BROWSER_COMPATIBLE = ['.mp4', '.webm'];

function isVideo(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ALL_VIDEO_EXTENSIONS.includes(ext);
}

function needsConversion(filename) {
  const ext = path.extname(filename).toLowerCase();
  return isVideo(filename) && !BROWSER_COMPATIBLE.includes(ext);
}

async function getVideoMetadata(videoPath) {
  return new Promise((resolve) => {
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

async function convertToMp4(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`   Conversione in corso...`);

    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart',
      ])
      .output(outputPath)
      .on('start', () => {
        console.log(`   FFmpeg avviato...`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`\r   Progresso: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log(`\n   Conversione completata!`);
        resolve(true);
      })
      .on('error', (err) => {
        console.error(`\n   Errore FFmpeg: ${err.message}`);
        resolve(false);
      })
      .run();
  });
}

async function generateThumbnail(videoPath, outputName) {
  return new Promise((resolve) => {
    const thumbnailPath = path.join(THUMBNAILS_DIR, `${outputName}.jpg`);

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
  console.log('='.repeat(70));
  console.log('Conversione Video Non Compatibili in MP4');
  console.log('='.repeat(70));
  console.log('');
  console.log('Formati non compatibili: .mpg, .mpeg, .avi, .mkv, .mov');
  console.log('Formato target: .mp4 (H.264 + AAC)');
  console.log('');

  // Assicurati che le directory esistano
  if (!fs.existsSync(THUMBNAILS_DIR)) {
    fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
  }

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
      width: true,
      height: true,
    },
  });

  // Filtra solo i video che necessitano conversione
  const videosToConvert = allMedia.filter(m => needsConversion(m.filename));

  console.log(`Totale media nel database: ${allMedia.length}`);
  console.log(`Video da convertire: ${videosToConvert.length}`);
  console.log('');

  if (videosToConvert.length === 0) {
    console.log('Nessun video da convertire. Tutti i video sono gia in formato compatibile.');
    return;
  }

  // Elenca i video da convertire
  console.log('Video da convertire:');
  videosToConvert.forEach((v, i) => {
    const ext = path.extname(v.filename);
    console.log(`  ${i + 1}. ${v.title} (${ext})`);
  });
  console.log('');

  let converted = 0;
  let failed = 0;
  let skipped = 0;

  for (const video of videosToConvert) {
    console.log('-'.repeat(70));
    console.log(`[${converted + failed + skipped + 1}/${videosToConvert.length}] ${video.title}`);
    console.log(`   File originale: ${video.filename}`);

    // Path del file originale
    const originalPath = path.join(BANNERS_DIR, video.filename);

    // Verifica che il file esista
    if (!fs.existsSync(originalPath)) {
      console.log(`   SKIP: File non trovato su disco`);
      skipped++;
      continue;
    }

    const fileStats = fs.statSync(originalPath);
    console.log(`   Dimensione: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

    // Nome del nuovo file MP4
    const baseName = path.parse(video.filename).name;
    const newFilename = `${baseName}.mp4`;
    const newPath = path.join(BANNERS_DIR, newFilename);

    // Se esiste gia un file MP4 con lo stesso nome, salta
    if (fs.existsSync(newPath) && newFilename !== video.filename) {
      console.log(`   File MP4 gia esistente, aggiorno solo database`);

      // Aggiorna database
      await prisma.bannerImage.update({
        where: { id: video.id },
        data: {
          filename: newFilename,
          path: `/images/banners/${newFilename}`,
        },
      });

      // Elimina file originale se diverso
      if (video.filename !== newFilename) {
        fs.unlinkSync(originalPath);
        console.log(`   File originale eliminato`);
      }

      converted++;
      continue;
    }

    // Converti in MP4
    const success = await convertToMp4(originalPath, newPath);

    if (!success) {
      console.log(`   ERRORE: Conversione fallita`);
      failed++;
      continue;
    }

    // Verifica che il file convertito esista
    if (!fs.existsSync(newPath)) {
      console.log(`   ERRORE: File convertito non trovato`);
      failed++;
      continue;
    }

    const newStats = fs.statSync(newPath);
    console.log(`   Nuova dimensione: ${(newStats.size / 1024 / 1024).toFixed(2)} MB`);

    // Ottieni metadati del video convertito
    const metadata = await getVideoMetadata(newPath);

    // Genera nuovo thumbnail dal video convertito
    let thumbnailPath = video.thumbnailPath;
    const thumbResult = await generateThumbnail(newPath, baseName);
    if (thumbResult.success) {
      thumbnailPath = thumbResult.path;
      console.log(`   Thumbnail generato: ${thumbnailPath}`);
    }

    // Aggiorna database
    await prisma.bannerImage.update({
      where: { id: video.id },
      data: {
        filename: newFilename,
        path: `/images/banners/${newFilename}`,
        thumbnailPath: thumbnailPath,
        duration: metadata?.duration || video.duration,
        width: metadata?.width || video.width,
        height: metadata?.height || video.height,
      },
    });
    console.log(`   Database aggiornato`);

    // Elimina file originale
    if (video.filename !== newFilename && fs.existsSync(originalPath)) {
      fs.unlinkSync(originalPath);
      console.log(`   File originale eliminato: ${video.filename}`);
    }

    converted++;
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('RIEPILOGO');
  console.log('='.repeat(70));
  console.log(`Video totali da convertire: ${videosToConvert.length}`);
  console.log(`Convertiti con successo:    ${converted}`);
  console.log(`Falliti:                    ${failed}`);
  console.log(`Saltati (file mancante):    ${skipped}`);
  console.log('='.repeat(70));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
