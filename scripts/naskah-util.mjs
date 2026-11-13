// Alat bersama untuk skrip ringkas-naskah, lint-episode, dan lembar-kontak.
// Hanya membaca file, tidak mengubah apa pun.
import fs from 'node:fs';

export const FPS = 30;
export const GAP = 9;
export const EDGE = 14;

export const baca = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

export const muatEpisode = (slug) => {
  const file = `episodes/${slug}/episode.json`;
  if (!fs.existsSync(file)) throw new Error(`Tidak ada ${file}`);
  return baca(file);
};

// props.json hanya dipakai jika lebih baru dari episode.json, supaya waktu tidak basi.
export const muatProps = (slug) => {
  const props = `out/episode/${slug}/props.json`;
  const naskah = `episodes/${slug}/episode.json`;
  if (!fs.existsSync(props)) return {props: null, alasan: 'props.json belum ada, jalankan --cek dulu'};
  if (fs.statSync(props).mtimeMs < fs.statSync(naskah).mtimeMs) return {props: null, alasan: 'props.json lebih tua dari episode.json, jalankan --cek dulu'};
  return {props: baca(props), alasan: ''};
};

// Daftar shot dengan frame absolut di video. Shot berlangsung sampai shot berikutnya,
// atau sampai baris berikutnya mulai (sama dengan aturan di src/pustaka/set/tipe.ts).
export const daftarShot = (props) => {
  const hasil = [];
  for (const adegan of props.adegan) {
    adegan.baris.forEach((line, i) => {
      const shots = line.shot?.length ? line.shot : [null];
      const akhirBaris = i + 1 < adegan.baris.length ? adegan.baris[i + 1].start : adegan.durasi;
      const mulaiLokal = shots.map((shot, k) => (k === 0 ? 0 : (shot.pada ?? Math.round((shot.porsi ?? 0) * line.frames))));
      shots.forEach((shot, k) => {
        const mulai = adegan.start + line.start + mulaiLokal[k];
        const akhir = adegan.start + (k + 1 < shots.length ? line.start + mulaiLokal[k + 1] : akhirBaris);
        hasil.push({adegan: adegan.id, baris: line.id, ke: k + 1, mulai, akhir, set: shot?.set ?? adegan.jenis, masuk: k === 0 && i === 0 ? shot?.masuk : undefined});
      });
    });
  }
  return hasil;
};

export const detik = (frame) => (frame / FPS).toFixed(1);
