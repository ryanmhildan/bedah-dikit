// Pemeriksaan mekanis episode, supaya agent tidak perlu membaca episode.json utuh untuk aturan yang bisa dihitung.
// Pemakaian: node scripts/lint-episode.mjs <slug>
// Keluaran: GAGAL (exit 1) jika ada kesalahan, LOLOS jika hanya ada peringatan atau bersih.
// Lint tidak menggantikan pemeriksaan mata: ekspresi, keterbacaan, dan kecocokan gambar tetap dicek manual.
import fs from 'node:fs';
import {FPS, baca, muatEpisode, muatProps} from './naskah-util.mjs';

const slug = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
if (!slug) throw new Error('Pemakaian: node scripts/lint-episode.mjs <slug>');

const ep = muatEpisode(slug);
const {props, alasan} = muatProps(slug);
const salah = [];
const awas = [];

// Daftar set dibaca dari scripts/episode.mjs supaya tidak ada dua sumber kebenaran.
const SET = JSON.parse(fs.readFileSync('scripts/episode.mjs', 'utf8').match(/const SET = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
const suara = baca('data/suara.json');
const musikNyala = ep.musik !== false && baca('data/efek-suara.json').musik?.aktif !== false;

// Naskah dasar
if (!suara.tokoh[ep.tokoh]) salah.push(`tokoh ${ep.tokoh} tidak terdaftar di data/suara.json`);
if (ep.tokoh !== 'raka') awas.push(`tokoh ${ep.tokoh}, tokoh utama saat ini Raka`);
const sumber = ep.sumber ?? [];
if (sumber.length < 2) salah.push(`sumber hanya ${sumber.length}, minimal 2`);
for (const s of sumber) if (!/^https?:\/\//.test(s.url ?? '')) salah.push(`sumber "${s.nama}" tanpa url`);
if (ep.adegan.length > 7) awas.push(`${ep.adegan.length} adegan, target maksimal 7`);
const semuaBaris = ep.adegan.flatMap((a) => a.baris);
if (semuaBaris.length > 15) awas.push(`${semuaBaris.length} baris, target maksimal 15`);

const angka = (teks) => [...String(teks).matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => m[0].replace(',', '.'));
const angkaNaskah = new Set(semuaBaris.flatMap((b) => angka(b.teks)));

for (const adegan of ep.adegan) {
  const pakaiSet = adegan.baris.some((b) => b.shot?.length);
  for (const b of adegan.baris) {
    if (b.teks.length > 84) salah.push(`${b.id}: teks ${b.teks.length} karakter, maksimal 84`);
    if (/\d/.test(b.ucap ?? '')) salah.push(`${b.id}: ucap memuat angka digit, tulis sebagai kata`);
    if (/\b[A-Z]{2,}\b/.test(b.ucap ?? '')) awas.push(`${b.id}: ucap memuat singkatan kapital, cek pelafalannya`);
    if (pakaiSet && !b.shot?.length) salah.push(`${b.id}: adegan memakai set, baris wajib punya shot`);
    (b.shot ?? []).forEach((shot, k) => {
      const nama = `${b.id} shot ${k + 1}`;
      if (!SET.includes(shot.set)) salah.push(`${nama}: set ${shot.set} tidak dikenal`);
      if (!shot.kamera?.dari) salah.push(`${nama}: kamera.dari wajib ada`);
      if (!shot.suasana) salah.push(`${nama}: suasana wajib ada`);
      const tampil = [
        ...(shot.aksi ?? []).filter((a) => a.teks).map((a) => ({sumber: `aksi ${a.aksi}`, teks: a.teks})),
        ...(shot.properti ?? []).filter((p) => p.teks).map((p) => ({sumber: `properti ${p.nama}`, teks: p.teks})),
        ...(shot.tokoh?.pegang?.teks ? [{sumber: 'pegang', teks: shot.tokoh.pegang.teks}] : []),
        ...(shot.balon ? [{sumber: 'balon', teks: shot.balon.teks}] : []),
      ];
      for (const t of tampil) {
        const asing = angka(t.teks).filter((n) => !angkaNaskah.has(n));
        if (asing.length) awas.push(`${nama}: angka ${asing.join(', ')} di ${t.sumber} "${t.teks}" tidak ada di teks naskah, pastikan dari sumber`);
      }
      for (const a of shot.aksi ?? []) {
        if (a.aksi === 'label' && !a.tetap) awas.push(`${nama}: label "${a.teks}" tanpa tetap: true, bisa mengecil saat zoom`);
      }
    });
  }
}

// Caption
const fileCaption = `episodes/${slug}/caption.md`;
if (!fs.existsSync(fileCaption)) {
  awas.push('caption.md belum ada');
} else {
  const caption = fs.readFileSync(fileCaption, 'utf8');
  for (const s of sumber) if (s.url && !caption.includes(s.url)) awas.push(`caption tidak memuat url sumber ${s.nama}`);
  if (!musikNyala && /Musik:/i.test(caption)) awas.push('musik mati tetapi caption masih memuat kredit musik');
  if (musikNyala && !/Musik:/i.test(caption)) salah.push('musik menyala tetapi caption tanpa kredit musik');
}

// Waktu dan efek, hanya jika props.json masih baru
let ringkas = '';
if (props) {
  const durasi = props.total / FPS;
  const hentak = props.efek.filter((e) => e.jenis === 'hentak').length;
  ringkas = `durasi ${durasi.toFixed(1)} detik, ${props.efek.length} efek (${hentak} hentak)`;
  if (durasi < 70 || durasi > 85) awas.push(`durasi ${durasi.toFixed(1)} detik, target 70 sampai 85`);
  if (props.efek.length > 25) awas.push(`${props.efek.length} efek, target sekitar 20`);
  if (hentak > 3) awas.push(`${hentak} hentak, target 2 sampai 3`);
} else {
  ringkas = `waktu tidak dicek: ${alasan}`;
}

console.log(`${salah.length ? 'GAGAL' : 'LOLOS'} ${slug}: ${salah.length} kesalahan, ${awas.length} peringatan, ${ringkas}`);
for (const s of salah) console.log(`  SALAH  ${s}`);
for (const s of awas) console.log(`  AWAS   ${s}`);
process.exit(salah.length ? 1 : 0);
