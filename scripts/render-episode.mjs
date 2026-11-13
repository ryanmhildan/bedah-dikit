// Render penuh satu episode lalu memverifikasi hasilnya, dengan satu ringkasan di akhir.
// Menggantikan pekerjaan rutin agent operator-render; agent itu hanya dipanggil jika render gagal dua kali.
// Pemakaian: node scripts/render-episode.mjs <slug> [--lanjut]
// Jalankan di latar belakang. Log lengkap ada di out/episode/<slug>/render.log.
// Exit 0 hanya jika semua cek lolos.
import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {FPS, baca} from './naskah-util.mjs';

const slug = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
if (!slug) throw new Error('Pemakaian: node scripts/render-episode.mjs <slug> [--lanjut]');
const lanjut = process.argv.includes('--lanjut');

const hasil = `out/episode/${slug}`;
const video = `${hasil}/video.mp4`;
const fileLog = `${hasil}/render.log`;
const FFPROBE = 'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe';
const ffprobe = fs.existsSync(FFPROBE) ? FFPROBE : 'ffprobe';
fs.mkdirSync(hasil, {recursive: true});

const gagal = [];
const catatan = [];

// Ruang disk minimal 2 GB.
const disk = fs.statfsSync('.');
const sisaGB = (disk.bavail * disk.bsize) / 1024 ** 3;
if (sisaGB < 2) {
  console.log(`GAGAL ${slug}: ruang disk tinggal ${sisaGB.toFixed(1)} GB, minimal 2 GB. Render tidak dijalankan.`);
  process.exit(1);
}

// Hanya satu render boleh berjalan.
const kunci = 'out/episode/.render-berjalan';
if (fs.existsSync(kunci)) {
  console.log(`GAGAL ${slug}: render lain masih berjalan (${fs.readFileSync(kunci, 'utf8').trim()}). Hapus ${kunci} jika itu sisa render yang sudah mati.`);
  process.exit(1);
}
fs.writeFileSync(kunci, `${slug} sejak ${new Date().toISOString()}`);

const mulai = Date.now();
const log = fs.createWriteStream(fileLog);
const kode = await new Promise((resolve) => {
  const proses = spawn(process.execPath, ['scripts/episode.mjs', slug, ...(lanjut ? ['--lanjut'] : [])]);
  proses.stdout.pipe(log, {end: false});
  proses.stderr.pipe(log, {end: false});
  proses.on('close', resolve);
});
log.end();
fs.rmSync(kunci, {force: true});
const isiLog = fs.readFileSync(fileLog, 'utf8');
const menit = ((Date.now() - mulai) / 60000).toFixed(1);

if (kode !== 0) gagal.push(`episode.mjs keluar dengan kode ${kode}. Potongan log:\n${isiLog.trim().split('\n').slice(-12).join('\n')}`);
const suaraBaru = isiLog.split('\n').filter((l) => l.startsWith('Suara '));
if (suaraBaru.length) catatan.push(`${suaraBaru.length} baris suara dibuat ulang (memakai kredit ElevenLabs): ${suaraBaru.map((l) => l.split(':')[0].slice(6)).join(', ')}`);
const pulih = isiLog.split('\n').filter((l) => /percobaan [2-9]: berhasil/.test(l));
if (pulih.length) catatan.push(`bagian yang gagal lalu pulih: ${pulih.join('; ')}`);

if (kode === 0) {
  if (!fs.existsSync(video)) gagal.push('video.mp4 tidak ada');
  else if (fs.statSync(video).mtimeMs < mulai) gagal.push('video.mp4 tidak diperbarui (stempel waktu lama)');
  else {
    const probe = spawnSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name', '-of', 'json', video], {encoding: 'utf8'});
    const info = JSON.parse(probe.stdout || '{}');
    const aliran = info.streams ?? [];
    const durasi = Number(info.format?.duration ?? 0);
    const target = baca(`${hasil}/props.json`).total / FPS;
    if (!aliran.some((s) => s.codec_type === 'video')) gagal.push('tidak ada aliran video');
    if (!aliran.some((s) => s.codec_type === 'audio' && s.codec_name === 'aac')) gagal.push('tidak ada aliran audio AAC');
    if (Math.abs(durasi - target) > 0.5) gagal.push(`durasi ${durasi.toFixed(1)} detik, seharusnya ${target.toFixed(1)}`);
    catatan.unshift(`${video}, ${durasi.toFixed(1)} detik, ${(Number(info.format?.size ?? 0) / 1024 ** 2).toFixed(1)} MB`);
  }
}

const sisaAkhir = (fs.statfsSync('.').bavail * disk.bsize) / 1024 ** 3;
console.log(`${gagal.length ? 'GAGAL' : 'LOLOS'} render ${slug} dalam ${menit} menit, sisa disk ${sisaAkhir.toFixed(1)} GB`);
for (const c of catatan) console.log(`  ${c}`);
for (const g of gagal) console.log(`  GAGAL: ${g}`);
if (gagal.length && kode !== 0) console.log(`  Jika kode belum berubah, coba: node scripts/render-episode.mjs ${slug} --lanjut`);
process.exit(gagal.length ? 1 : 0);
