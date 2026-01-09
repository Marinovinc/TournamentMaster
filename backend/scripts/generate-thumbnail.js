/**
 * Script per generare thumbnail da video
 * Usage: node scripts/generate-thumbnail.js "path/to/video.mp4"
 */

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

// Directory output thumbnails
const THUMBNAILS_DIR = path.join(__dirname, '../../frontend/public/thumbnails');

// Assicurati che la directory esista
if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

async function generateThumbnail(videoPath, outputName) {
  console.log('='.repeat(50));
  console.log('Generazione Thumbnail');
  console.log('='.repeat(50));
  console.log('Video:', videoPath);

  // Verifica che il file esista
  if (!fs.existsSync(videoPath)) {
    console.error('ERRORE: File video non trovato:', videoPath);
    process.exit(1);
  }

  const stats = fs.statSync(videoPath);
  console.log('Dimensione:', (stats.size / 1024 / 1024).toFixed(2), 'MB');

  // Nome output
  const thumbnailName = outputName || path.parse(videoPath).name;
  const thumbnailPath = path.join(THUMBNAILS_DIR, `${thumbnailName}.jpg`);

  console.log('Output:', thumbnailPath);
  console.log('-'.repeat(50));

  // Prima ottieni i metadati
  console.log('\n1. Lettura metadati video...');

  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error('Errore ffprobe:', err.message);
        // Continua comunque con valori di default
      } else {
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        console.log('   Durata:', Math.round(metadata.format.duration || 0), 'secondi');
        console.log('   Risoluzione:', videoStream?.width, 'x', videoStream?.height);
        console.log('   Codec:', videoStream?.codec_name);
        console.log('   Formato:', metadata.format.format_name);
      }

      console.log('\n2. Generazione thumbnail (frame a 1 secondo)...');

      ffmpeg(videoPath)
        .screenshots({
          timestamps: [1], // Frame a 1 secondo
          filename: `${thumbnailName}.jpg`,
          folder: THUMBNAILS_DIR,
          size: '480x?', // Larghezza 480px, altezza proporzionale
        })
        .on('start', (cmd) => {
          console.log('   Comando FFmpeg avviato...');
        })
        .on('end', () => {
          console.log('\n' + '='.repeat(50));
          console.log('SUCCESSO! Thumbnail generato:');
          console.log(thumbnailPath);
          console.log('='.repeat(50));

          // Verifica che il file sia stato creato
          if (fs.existsSync(thumbnailPath)) {
            const thumbStats = fs.statSync(thumbnailPath);
            console.log('Dimensione thumbnail:', (thumbStats.size / 1024).toFixed(2), 'KB');
          }

          resolve(thumbnailPath);
        })
        .on('error', (err) => {
          console.error('\nERRORE FFmpeg:', err.message);
          console.error('\nAssicurati che FFmpeg sia installato:');
          console.error('  choco install ffmpeg');
          console.error('  oppure scarica da https://ffmpeg.org/download.html');
          reject(err);
        });
    });
  });
}

// Main
const videoPath = process.argv[2] || 'F:\\FOTO\\2007.07.16 Palmarola\\Delfini Ponza.MPG';
const outputName = process.argv[3];

generateThumbnail(videoPath, outputName)
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nFailed:', err.message);
    process.exit(1);
  });
