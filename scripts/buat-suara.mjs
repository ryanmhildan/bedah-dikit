// Membuat MP3 tiap baris narasi dan mencatat durasinya.
// Pemakaian: node scripts/buat-suara.mjs
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const python = process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python';
const narasi = JSON.parse(fs.readFileSync('data/narasi.json', 'utf8'));
const suara = JSON.parse(fs.readFileSync('data/suara.json', 'utf8'));
const jenis = suara.tokoh[narasi.tokoh];
if (!jenis) throw new Error(`Tokoh ${narasi.tokoh} belum terdaftar di data/suara.json`);
const {voice, rate} = suara[jenis];
console.log(`Tokoh ${narasi.tokoh}: ${voice}`);
fs.mkdirSync('public/suara', {recursive: true});

const ffprobe = (file) => {
  const output = execFileSync(
    'npx',
    ['remotion', 'ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
    {encoding: 'utf8', shell: true},
  );
  return Number(output.trim().split(/\s+/).pop());
};

const waktu = {};
for (const scene of narasi.scenes) {
  for (const line of scene.lines) {
    const file = `public/suara/${line.id}.mp3`;
    execFileSync(python, [
      '-m',
      'edge_tts',
      '--voice',
      voice,
      `--rate=${rate}`,
      '--text',
      line.ucap,
      '--write-media',
      file,
    ]);
    waktu[line.id] = ffprobe(file);
    console.log(line.id, waktu[line.id]);
  }
}

fs.writeFileSync('data/narasi-waktu.json', `${JSON.stringify(waktu, null, 2)}\n`);
const total = Object.values(waktu).reduce((sum, seconds) => sum + seconds, 0);
console.log(`Total suara: ${total.toFixed(1)} detik`);
