// Render per bagian agar tidak kehabisan memori. Chrome dimulai ulang tiap bagian.
// Pemakaian: node scripts/render.mjs [namaKomposisi] [fileKeluaran]
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import {campurLatar} from './audio-latar.mjs';

const positional = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const composition = positional[0] ?? 'Sinematik';
const output = positional[1] ?? 'out/sinematik.mp4';
const CHUNK = 450;
const CONCURRENCY = 3;
const RETRIES = 3;
const work = 'out/bagian';

const run = (args) => {
  const result = spawnSync(`npx remotion ${args}`, {shell: true, encoding: 'utf8'});
  return {ok: result.status === 0, log: `${result.stdout}\n${result.stderr}`};
};

const must = (args, label) => {
  const result = run(args);
  if (!result.ok) {
    console.error(result.log.slice(-1500));
    throw new Error(`Gagal: ${label}`);
  }
  return result.log;
};

const frameCount = () => {
  const waktu = JSON.parse(fs.readFileSync('data/narasi-waktu.json', 'utf8'));
  const narasi = JSON.parse(fs.readFileSync('data/narasi.json', 'utf8'));
  return narasi.scenes.reduce((total, scene) => {
    const voice = scene.lines.reduce((sum, line) => sum + Math.ceil(waktu[line.id] * 30) + 9, 0);
    return total + voice + 28;
  }, 0);
};

// Audio disusun langsung dari MP3 narasi, tanpa Chrome, sesuai waktu di adegan.
const buildAudio = (file) => {
  const rate = 48000;
  const bytesPerFrame = 4;
  const waktu = JSON.parse(fs.readFileSync('data/narasi-waktu.json', 'utf8'));
  const narasi = JSON.parse(fs.readFileSync('data/narasi.json', 'utf8'));
  const pcm = Buffer.alloc(Math.ceil((frameCount() / 30) * rate) * bytesPerFrame);
  const scenes = [];
  let sceneStart = 0;
  for (const scene of narasi.scenes) {
    let cursor = 14;
    const lines = [];
    for (const line of scene.lines) {
      lines.push({start: sceneStart + cursor, frames: Math.ceil(waktu[line.id] * 30)});
      const decoded = `${work}/baris.wav`;
      must(`ffmpeg -y -v error -i public/suara/${line.id}.mp3 -ar ${rate} -ac 2 -c:a pcm_s16le ${decoded}`, `audio ${line.id}`);
      const wav = fs.readFileSync(decoded);
      const data = wav.indexOf('data', 12) + 8;
      const offset = Math.round(((sceneStart + cursor) / 30) * rate) * bytesPerFrame;
      wav.copy(pcm, offset, data);
      cursor += Math.ceil(waktu[line.id] * 30) + 9;
    }
    scenes.push({id: scene.id, start: sceneStart, duration: cursor + 14, lines});
    sceneStart += cursor + 14;
  }
  const bacaMusik = (sumber) => {
    must(`ffmpeg -y -v error -i ${sumber} -ar ${rate} -ac 2 -c:a pcm_s16le ${work}/musik.wav`, 'baca musik');
    return fs.readFileSync(`${work}/musik.wav`);
  };
  campurLatar({pcm, rate, scenes, bacaMusik});
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * bytesPerFrame, 28);
  header.writeUInt16LE(bytesPerFrame, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(file, Buffer.concat([header, pcm]));
};

const mux = (video) => {
  must(`ffmpeg -y -v error -i ${video} -i ${work}/suara.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest ${work}/final.mp4`, 'pasang audio');
  fs.copyFileSync(`${work}/final.mp4`, output);
  fs.rmSync(work, {recursive: true, force: true});
};

// Hanya memperbarui audio, tanpa merender ulang gambar.
if (process.argv.includes('--audio-saja')) {
  fs.mkdirSync(work, {recursive: true});
  fs.copyFileSync(output, `${work}/lama.mp4`);
  buildAudio(`${work}/suara.wav`);
  mux(`${work}/lama.mp4`);
  console.log(`Audio diperbarui: ${output}`);
  process.exit(0);
}

const resume = process.argv.includes('--lanjut');
if (!resume) fs.rmSync(work, {recursive: true, force: true});
fs.mkdirSync(work, {recursive: true});
console.log(`Memori kosong: ${Math.round(os.freemem() / 1048576)} MB`);

if (!fs.existsSync(`${work}/build`)) must(`bundle src/index.ts --out-dir=${work}/build`, 'bundle');

const total = frameCount();
const parts = [];
for (let start = 0, index = 0; start < total; start += CHUNK, index++) {
  const end = Math.min(start + CHUNK, total) - 1;
  const file = `${work}/v${index}.mp4`;
  let done = resume && fs.existsSync(file);
  for (let attempt = 1; attempt <= RETRIES && !done; attempt++) {
    const result = run(
      `render ${work}/build ${composition} ${file} --frames=${start}-${end} --muted --concurrency=${CONCURRENCY} --overwrite`,
    );
    done = result.ok && fs.existsSync(file);
    console.log(`Bagian ${index} (${start}-${end}) percobaan ${attempt}: ${done ? 'berhasil' : 'gagal'}`);
  }
  if (!done) throw new Error(`Bagian ${index} gagal setelah ${RETRIES} percobaan`);
  parts.push(`file 'v${index}.mp4'`);
}

fs.writeFileSync(`${work}/daftar.txt`, `${parts.join('\n')}\n`);
buildAudio(`${work}/suara.wav`);
must(`ffmpeg -y -v error -f concat -safe 0 -i ${work}/daftar.txt -c copy ${work}/video.mp4`, 'gabung video');
mux(`${work}/video.mp4`);
console.log(`Selesai: ${output}, ${total} frame`);
