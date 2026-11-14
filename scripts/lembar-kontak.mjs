// Menyusun banyak frame menjadi beberapa lembar grid, supaya pemeriksaan visual cukup melihat sedikit gambar.
// Pemakaian:
//   node scripts/lembar-kontak.mjs <slug>                  satu frame per shot (di 70% shot) + frame transisi tiap adegan, dari video.mp4
//   node scripts/lembar-kontak.mjs <slug> --rapat          tiga frame per shot: 15%, 50%, dan 90%
//   node scripts/lembar-kontak.mjs <slug> --detik 12.5,30  frame pada detik tertentu
//   node scripts/lembar-kontak.mjs <slug> --cek            gambar dari out/episode/<slug>/cek/ (hasil --cek)
// Pilihan: --kolom 4 --baris 2 --lebar 360, --polos tanpa nomor dan detik (untuk gambar dokumentasi)
// Hasil: out/frames/<slug>/lembar-NN.png. Setiap sel diberi nomor dan detik di pojok kiri atas; daftar nomor dicetak ke layar.
// Untuk cacat kecil (salah ketik, label terpotong), ambil frame penuh: --detik <d> --kolom 1 --baris 1 --lebar 1080.
// ffmpeg bawaan Remotion tidak punya filter tile atau drawtext, jadi grid dan angka disusun di sini.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {FPS, daftarShot, detik, muatProps} from './naskah-util.mjs';

const argv = process.argv.slice(2);
const slug = argv.find((arg, i) => !arg.startsWith('--') && !argv[i - 1]?.match(/^--(detik|kolom|baris|lebar)$/));
if (!slug) throw new Error('Pemakaian: node scripts/lembar-kontak.mjs <slug> [--rapat | --detik a,b | --cek]');
const opsi = (nama, bawaan) => {
  const i = argv.indexOf(nama);
  return i >= 0 ? argv[i + 1] : bawaan;
};
const kolom = Number(opsi('--kolom', 4));
const baris = Number(opsi('--baris', 2));
const W = Number(opsi('--lebar', 360));
const H = Math.round((W * 16) / 9);
const JARAK = 4;
const perLembar = kolom * baris;

const FFMPEG = 'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe';
const ffmpeg = fs.existsSync(FFMPEG) ? FFMPEG : 'ffmpeg';

const keluar = `out/frames/${slug}`;
fs.rmSync(keluar, {recursive: true, force: true});
fs.mkdirSync(keluar, {recursive: true});

// Satu frame sebagai RGB mentah W×H.
const ambil = (masukan) => {
  const hasil = spawnSync(ffmpeg, ['-v', 'error', ...masukan, '-frames:v', '1', '-vf', `scale=${W}:${H}`, '-pix_fmt', 'rgb24', '-c:v', 'rawvideo', '-f', 'image2pipe', '-'], {maxBuffer: 64 * 1024 * 1024});
  if (hasil.status !== 0 || hasil.stdout.length !== W * H * 3) throw new Error(`ffmpeg gagal: ${String(hasil.stderr).slice(-600)}`);
  return hasil.stdout;
};

// Huruf bitmap 3×5 untuk nomor dan detik.
const HURUF = {
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
  5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111',
  '.': '000000000000010', s: '011100010001110', ' ': '000000000000000', '#': '101111101111101',
};
const tulis = (kanvas, lebarKanvas, x0, y0, teks) => {
  const s = Math.max(2, Math.round(W / 90));
  const lebarTeks = teks.length * 4 * s + s;
  for (let y = y0; y < y0 + 7 * s; y++) for (let x = x0; x < x0 + lebarTeks; x++) kanvas.fill(0, (y * lebarKanvas + x) * 3, (y * lebarKanvas + x) * 3 + 3);
  [...teks].forEach((c, i) => {
    const pola = HURUF[c] ?? HURUF[' '];
    for (let py = 0; py < 5; py++) for (let px = 0; px < 3; px++) {
      if (pola[py * 3 + px] !== '1') continue;
      for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) {
        const p = ((y0 + s + py * s + dy) * lebarKanvas + x0 + s + i * 4 * s + px * s + dx) * 3;
        kanvas[p] = 255;
        kanvas[p + 1] = 220;
        kanvas[p + 2] = 0;
      }
    }
  });
};

const png = (rgb, w, h) => {
  const mentah = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) rgb.copy(mentah, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  const potong = (jenis, data) => {
    const isi = Buffer.concat([Buffer.from(jenis), data]);
    const kepala = Buffer.alloc(4);
    kepala.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(isi));
    return Buffer.concat([kepala, isi, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), potong('IHDR', ihdr), potong('IDAT', zlib.deflateSync(mentah)), potong('IEND', Buffer.alloc(0))]);
};

// Susun daftar {masukan ffmpeg, label, keterangan}.
let titik = [];
if (argv.includes('--cek')) {
  const folder = `out/episode/${slug}/cek`;
  titik = fs.readdirSync(folder).filter((f) => f.endsWith('.png')).sort().map((f) => ({masukan: ['-i', path.join(folder, f)], waktu: '', ket: f}));
  if (!titik.length) throw new Error(`Tidak ada PNG di ${folder}`);
} else {
  const video = `out/episode/${slug}/video.mp4`;
  if (!fs.existsSync(video)) throw new Error(`Tidak ada ${video}`);
  let frame = [];
  if (argv.includes('--detik')) {
    frame = opsi('--detik', '').split(',').map((d) => ({frame: Math.round(Number(d) * FPS), ket: `detik ${d}`}));
  } else {
    const {props, alasan} = muatProps(slug);
    if (!props) throw new Error(alasan);
    if (fs.statSync(video).mtimeMs < fs.statSync(`out/episode/${slug}/props.json`).mtimeMs) {
      console.log('PERINGATAN: video.mp4 lebih tua dari props.json, frame bisa tidak cocok dengan naskah terbaru.');
    }
    const porsi = argv.includes('--rapat') ? [0.15, 0.5, 0.9] : [0.7];
    for (const shot of daftarShot(props)) {
      if (shot.masuk && shot.mulai > 0) frame.push({frame: shot.mulai + 4, ket: `${shot.adegan} transisi ${shot.masuk}`});
      for (const p of porsi) frame.push({frame: Math.round(shot.mulai + (shot.akhir - shot.mulai) * p), ket: `${shot.baris} shot ${shot.ke} (${shot.set})`});
    }
    frame = frame.filter((t) => t.frame < props.total);
  }
  frame.sort((a, b) => a.frame - b.frame);
  // Seek per frame; (frame + 0.5)/FPS menghindari meleset satu frame karena pembulatan.
  titik = frame.map((t) => ({masukan: ['-ss', ((t.frame + 0.5) / FPS).toFixed(3), '-i', video], waktu: `${detik(t.frame)}s`, ket: t.ket}));
}

const lebarLembar = kolom * W + (kolom - 1) * JARAK;
for (let i = 0; i < titik.length; i += perLembar) {
  const bagian = titik.slice(i, i + perLembar);
  const tinggiLembar = Math.ceil(bagian.length / kolom) * (H + JARAK) - JARAK;
  const kanvas = Buffer.alloc(lebarLembar * tinggiLembar * 3, 40);
  bagian.forEach((t, k) => {
    const sel = ambil(t.masukan);
    const x0 = (k % kolom) * (W + JARAK);
    const y0 = Math.floor(k / kolom) * (H + JARAK);
    for (let y = 0; y < H; y++) sel.copy(kanvas, ((y0 + y) * lebarLembar + x0) * 3, y * W * 3, (y + 1) * W * 3);
    if (!argv.includes('--polos')) tulis(kanvas, lebarLembar, x0 + 4, y0 + 4, `#${i + k + 1} ${t.waktu}`.trim());
  });
  fs.writeFileSync(path.join(keluar, `lembar-${String(i / perLembar + 1).padStart(2, '0')}.png`), png(kanvas, lebarLembar, tinggiLembar));
}

titik.forEach((t, i) => console.log(`${i + 1}. ${t.waktu} ${t.ket}`.replace('  ', ' ')));
console.log(`${Math.ceil(titik.length / perLembar)} lembar di ${keluar}/ (${titik.length} frame). Hapus folder ini setelah selesai.`);
