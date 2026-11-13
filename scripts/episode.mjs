// Mengubah episodes/<slug>/episode.json menjadi video.
// Pemakaian: node scripts/episode.mjs <slug> [--cek] [--audio-saja] [--lanjut]
//   --cek         hanya membuat suara, jadwal, dan satu gambar per adegan
//   --audio-saja  memperbarui audio tanpa merender ulang gambar
//   --lanjut      melanjutkan render yang terhenti
import {spawn, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {campurLatar} from './audio-latar.mjs';

if (fs.existsSync('.env')) process.loadEnvFile('.env');

const slug = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
if (!slug) throw new Error('Pemakaian: node scripts/episode.mjs <slug>');
const flag = (nama) => process.argv.includes(nama);

const FPS = 30;
const GAP = 9;
const EDGE = 14;
const CHUNK = 450;
const CONCURRENCY = 3;
const RETRIES = 3;
const RATE = 48000;

const dir = `episodes/${slug}`;
const hasil = `out/episode/${slug}`;
const work = `${hasil}/kerja`;
const video = `${hasil}/video.mp4`;
const props = `${hasil}/props.json`;
const python = process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python';

const baca = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const episode = baca(`${dir}/episode.json`);
const suara = baca('data/suara.json');

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

const JUMLAH = {
  penjelasan: (data) => data.gambar,
  perbandingan: (data) => [data.kiri, data.kanan],
  grafik: (data) => data.item,
  rantai: (data) => data.langkah,
  linimasa: (data) => data.titik,
  peta: (data) => data.tanda,
};
const JENIS = ['pembuka', 'penutup', ...Object.keys(JUMLAH)];
const LATAR = ['kota', 'malam', 'senja', 'langit', 'alam'];
// Set topik dari src/pustaka/set/. Tambahkan nama baru di sini saat set baru dibuat.
const SET = ['ruang', 'meja', 'interior', 'organ', 'mikro', 'tembus', 'wahana', 'belah', 'lab'];

const periksa = () => {
  const salah = [];
  const blok = fs.readFileSync('src/pustaka/ikon.tsx', 'utf8').split('export const IKON = {')[1].split('};')[0];
  const ikon = [...blok.matchAll(/^\s+(\w+):/gm)].map((match) => match[1]);
  if (!suara.tokoh[episode.tokoh]) salah.push(`Tokoh ${episode.tokoh} tidak terdaftar di data/suara.json`);
  if ((episode.sumber ?? []).length < 2) salah.push('Episode wajib punya minimal dua sumber');
  for (const adegan of episode.adegan) {
    if (!JENIS.includes(adegan.jenis)) salah.push(`${adegan.id}: jenis ${adegan.jenis} tidak dikenal`);
    const pakaiSet = adegan.baris.some((line) => Array.isArray(line.shot) && line.shot.length);
    if (pakaiSet) {
      for (const line of adegan.baris) {
        if (!Array.isArray(line.shot) || !line.shot.length) salah.push(`${line.id}: adegan memakai set, jadi setiap baris wajib punya shot`);
        for (const shot of line.shot ?? []) if (!SET.includes(shot.set)) salah.push(`${line.id}: set ${shot.set} tidak dikenal`);
      }
    }
    if (!pakaiSet && adegan.jenis !== 'peta' && !LATAR.includes(adegan.data?.latar)) salah.push(`${adegan.id}: latar ${adegan.data?.latar} tidak dikenal`);
    for (const line of adegan.baris) {
      if (line.teks.length > 84) salah.push(`${line.id}: teks layar ${line.teks.length} karakter, maksimal 84`);
    }
    for (const nama of JSON.stringify(adegan.data).matchAll(/"ikon":"(\w+)"/g)) {
      if (!ikon.includes(nama[1])) salah.push(`${adegan.id}: ikon ${nama[1]} tidak ada`);
    }
  }
  if (salah.length) throw new Error(`Episode tidak valid:\n${salah.join('\n')}`);
};

const durasiMp3 = (file) => {
  const log = must(`ffprobe -v error -show_entries format=duration -of csv=p=0 ${file}`, `durasi ${file}`);
  return Number(log.trim().split(/\s+/)[0]);
};

const suaraElevenLabs = async (line, {voice, model, pengaturan}, file) => {
  const kunci = process.env.ELEVENLABS_API_KEY;
  if (!kunci) throw new Error('ELEVENLABS_API_KEY belum ada di file .env');
  const respons = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {'xi-api-key': kunci, 'Content-Type': 'application/json'},
    body: JSON.stringify({text: line.ucap, model_id: model, voice_settings: pengaturan}),
  });
  if (!respons.ok) throw new Error(`Suara ${line.id} gagal (${respons.status}): ${(await respons.text()).slice(0, 300)}`);
  fs.writeFileSync(file, Buffer.from(await respons.arrayBuffer()));
};

const suaraEdge = (line, voice, rate, file) =>
  new Promise((resolve, reject) => {
    const proses = spawn(python, ['-m', 'edge_tts', '--voice', voice, `--rate=${rate}`, '--text', line.ucap, '--write-media', file]);
    proses.on('error', reject);
    proses.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Suara ${line.id} gagal`))));
  });

// Suara hanya dibuat ulang jika teks atau suaranya berubah.
const buatSuara = async () => {
  const pilihan = suara[suara.tokoh[episode.tokoh]];
  const {voice, rate} = pilihan;
  const satuSuara = (line, file) => (pilihan.penyedia === 'elevenlabs' ? suaraElevenLabs(line, pilihan, file) : suaraEdge(line, voice, rate, file));
  fs.mkdirSync(`${dir}/suara`, {recursive: true});
  const fileWaktu = `${dir}/suara/waktu.json`;
  const lama = fs.existsSync(fileWaktu) ? baca(fileWaktu) : {};
  const baru = {};
  const antre = episode.adegan.flatMap((adegan) => adegan.baris);
  const kerja = async () => {
    while (antre.length) {
      const line = antre.shift();
      const hash = createHash('sha1').update(pilihan.penyedia ? JSON.stringify([pilihan, line.ucap]) : `${voice}|${rate}|${line.ucap}`).digest('hex');
      const file = `${dir}/suara/${line.id}.mp3`;
      if (lama[line.id]?.hash === hash && fs.existsSync(file)) {
        baru[line.id] = lama[line.id];
        continue;
      }
      await satuSuara(line, file);
      baru[line.id] = {hash, detik: durasiMp3(file)};
      console.log(`Suara ${line.id}: ${baru[line.id].detik} detik`);
    }
  };
  await Promise.all([kerja(), kerja(), kerja()]);
  fs.writeFileSync(fileWaktu, `${JSON.stringify(baru, null, 2)}\n`);
  return baru;
};

// Waktu kemunculan tiap elemen mengikuti baris narasi yang membahasnya.
const hitungMuncul = (adegan, baris) => {
  const daftar = JUMLAH[adegan.jenis]?.(adegan.data) ?? [];
  const terakhir = baris[baris.length - 1];
  // Angka grafik biasanya disebut di baris terakhir, jadi batang muncul merata sepanjang baris itu.
  // Dengan "perBaris": true, batang ke-i muncul saat baris ke-i mulai.
  if (adegan.jenis === 'grafik' && !(adegan.data.perBaris && daftar.length <= baris.length)) return daftar.map((_, i) => Math.round(terakhir.start + 4 + (terakhir.frames * i) / daftar.length));
  if (daftar.length <= baris.length) {
    // Elemen mengikuti baris narasi, dan sisa baris tetap membahas elemen terakhir.
    return daftar.map((_, i) => baris[i].start + 4);
  }
  const awal = baris[0].start + 4;
  // Titik puncak linimasa muncul saat baris terakhir mulai, supaya sempat ditahan di layar.
  if (adegan.jenis === 'linimasa' && baris.length > 1) {
    return daftar.map((_, i) => Math.round(awal + ((terakhir.start + 4 - awal) * i) / (daftar.length - 1)));
  }
  const akhir = terakhir.start + terakhir.frames - 30;
  return daftar.map((_, i) => Math.round(awal + ((akhir - awal) * i) / (daftar.length - 1)));
};

// Efek adegan set mengikuti aksi di tiap shot, bukan jadwal `muncul` lama.
// Aksi yang hanya menampilkan keadaan akhir (`selesai`) atau tanpa `mulai` tidak bersuara.
const efekSet = (baris, awal) => {
  const hasil = [];
  for (const line of baris) {
    for (const shot of line.shot ?? []) {
      const mulaiShot = line.start + (shot.pada ?? Math.round((shot.porsi ?? 0) * line.frames));
      for (const aksi of shot.aksi ?? []) {
        if (aksi.selesai || typeof aksi.mulai !== 'number') continue;
        const frame = awal + mulaiShot + Math.max(0, aksi.mulai);
        if (aksi.aksi === 'tuang') {
          for (let i = 0; i < (aksi.jumlah ?? 1); i++) hasil.push({jenis: 'pop', frame: frame + i * (aksi.jeda ?? 20) + 10, nada: 0.9 + i * 0.07});
        } else if (aksi.aksi === 'serobot' || aksi.aksi === 'hentak') {
          hasil.push({jenis: 'hentak', frame, nada: 1});
        } else {
          hasil.push({jenis: 'pop', frame: frame + 6, nada: 1});
        }
      }
      if (shot.balon) hasil.push({jenis: 'pop', frame: awal + mulaiShot + (shot.balon.mulai ?? 0) + 4, nada: 1.1});
    }
  }
  // Efek sejenis yang jatuh berdekatan (kurang dari 4 frame) digabung supaya tidak menumpuk volumenya.
  hasil.sort((a, b) => a.frame - b.frame);
  return hasil.filter((item, i) => !hasil.slice(0, i).some((lain) => lain.jenis === item.jenis && item.frame - lain.frame < 4));
};

const buatJadwal = (waktu) => {
  let awal = 0;
  const efek = [];
  const adegan = episode.adegan.map((item, nomor) => {
    let cursor = EDGE;
    const baris = item.baris.map((line) => {
      const frames = Math.ceil(waktu[line.id].detik * FPS);
      const hasilBaris = {id: line.id, teks: line.teks, start: cursor, frames, pose: line.pose, shot: line.shot};
      cursor += frames + GAP;
      return hasilBaris;
    });
    const durasi = cursor + EDGE;
    const muncul = hitungMuncul(item, baris);
    if (nomor > 0) efek.push({jenis: 'whoosh', frame: awal - 8, nada: 1});
    const pakaiSet = baris.some((line) => line.shot?.length);
    if (pakaiSet) efek.push(...efekSet(baris, awal));
    else muncul.forEach((frame, i) => efek.push({jenis: 'pop', frame: awal + frame + 6, nada: 1 + (i % 8) * 0.07}));
    if (!pakaiSet && item.jenis === 'pembuka') efek.push({jenis: 'hentak', frame: awal + 46, nada: 1});
    if (!pakaiSet && item.jenis === 'penutup') efek.push({jenis: 'hentak', frame: awal + baris[baris.length - 1].start + 12, nada: 1});
    if (!pakaiSet && item.jenis === 'grafik' && item.data.sorot?.length) efek.push({jenis: 'ting', frame: awal + baris[baris.length - 1].start + 4, nada: 1});
    const jadi = {id: item.id, jenis: item.jenis, start: awal, durasi, baris, muncul, data: item.data};
    awal += durasi;
    return jadi;
  });
  return {tokoh: episode.tokoh, sumber: `Sumber: ${episode.sumber.map((item) => item.nama).join(', ')}`, total: awal, adegan, efek};
};

const buatAudio = (jadwal, file) => {
  const bytes = 4;
  const pcm = Buffer.alloc(Math.ceil((jadwal.total / FPS) * RATE) * bytes);
  const scenes = jadwal.adegan.map((adegan) => {
    const lines = adegan.baris.map((line) => {
      const sementara = `${work}/baris.wav`;
      must(`ffmpeg -y -v error -i ${dir}/suara/${line.id}.mp3 -ar ${RATE} -ac 2 -c:a pcm_s16le ${sementara}`, `audio ${line.id}`);
      const wav = fs.readFileSync(sementara);
      const start = adegan.start + line.start;
      wav.copy(pcm, Math.round((start / FPS) * RATE) * bytes, wav.indexOf('data', 12) + 8);
      return {start, frames: line.frames};
    });
    return {id: adegan.id, start: adegan.start, duration: adegan.durasi, lines};
  });
  const bacaMusik = (sumber) => {
    must(`ffmpeg -y -v error -i ${sumber} -ar ${RATE} -ac 2 -c:a pcm_s16le ${work}/musik.wav`, 'baca musik');
    return fs.readFileSync(`${work}/musik.wav`);
  };
  // Episode boleh mematikan musik sendiri lewat "musik": false di episode.json.
  campurLatar({pcm, rate: RATE, scenes, bacaMusik, efekJadi: jadwal.efek, tanpaMusik: episode.musik === false});
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * bytes, 28);
  header.writeUInt16LE(bytes, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(file, Buffer.concat([header, pcm]));
};

const gabung = (sumberVideo) => {
  must(`ffmpeg -y -v error -i ${sumberVideo} -i ${work}/suara.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest ${work}/final.mp4`, 'pasang audio');
  fs.copyFileSync(`${work}/final.mp4`, video);
  fs.rmSync(work, {recursive: true, force: true});
};

periksa();
const waktu = await buatSuara();
const jadwal = buatJadwal(waktu);
if (!flag('--lanjut')) fs.rmSync(work, {recursive: true, force: true});
fs.mkdirSync(work, {recursive: true});
fs.writeFileSync(props, JSON.stringify(jadwal));
console.log(`Durasi ${(jadwal.total / FPS).toFixed(1)} detik, ${jadwal.adegan.length} adegan, ${jadwal.efek.length} efek`);

if (flag('--audio-saja')) {
  fs.copyFileSync(video, `${work}/lama.mp4`);
  buatAudio(jadwal, `${work}/suara.wav`);
  gabung(`${work}/lama.mp4`);
  console.log(`Audio diperbarui: ${video}`);
  process.exit(0);
}

if (!fs.existsSync(`${work}/build`)) must(`bundle src/index.ts --out-dir=${work}/build`, 'bundle');

if (flag('--cek')) {
  fs.mkdirSync(`${hasil}/cek`, {recursive: true});
  for (const adegan of jadwal.adegan) {
    const frame = adegan.start + adegan.durasi - 40;
    must(`still ${work}/build Episode ${hasil}/cek/${adegan.id}.png --props=${props} --frame=${frame} --overwrite`, `gambar ${adegan.id}`);
    console.log(`Gambar ${adegan.id}`);
  }
  fs.rmSync(work, {recursive: true, force: true});
  process.exit(0);
}

const bagian = [];
for (let start = 0, index = 0; start < jadwal.total; start += CHUNK, index++) {
  const end = Math.min(start + CHUNK, jadwal.total) - 1;
  const file = `${work}/v${index}.mp4`;
  let selesai = flag('--lanjut') && fs.existsSync(file);
  for (let percobaan = 1; percobaan <= RETRIES && !selesai; percobaan++) {
    const result = run(`render ${work}/build Episode ${file} --props=${props} --frames=${start}-${end} --muted --concurrency=${CONCURRENCY} --overwrite`);
    selesai = result.ok && fs.existsSync(file);
    console.log(`Bagian ${index} percobaan ${percobaan}: ${selesai ? 'berhasil' : 'gagal'}`);
  }
  if (!selesai) throw new Error(`Bagian ${index} gagal setelah ${RETRIES} percobaan`);
  bagian.push(`file 'v${index}.mp4'`);
}

fs.writeFileSync(`${work}/daftar.txt`, `${bagian.join('\n')}\n`);
buatAudio(jadwal, `${work}/suara.wav`);
must(`ffmpeg -y -v error -f concat -safe 0 -i ${work}/daftar.txt -c copy ${work}/video.mp4`, 'gabung video');
gabung(`${work}/video.mp4`);
console.log(`Selesai: ${video}`);
