// Mencampur narasi, musik latar berlisensi, dan efek suara yang disintesis dari kode.
import fs from 'node:fs';

const acak = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
};

// Membaca WAV 16-bit stereo, lalu mengulangnya jika lebih pendek dari video.
const siapkanMusik = (wav, n) => {
  const mulai = wav.indexOf('data', 12) + 8;
  const total = Math.floor((wav.length - mulai) / 4);
  const kiri = new Float32Array(n);
  const kanan = new Float32Array(n);
  let puncak = 1;
  for (let i = 0; i < n; i++) {
    const posisi = mulai + (i % total) * 4;
    kiri[i] = wav.readInt16LE(posisi);
    kanan[i] = wav.readInt16LE(posisi + 2);
    puncak = Math.max(puncak, Math.abs(kiri[i]), Math.abs(kanan[i]));
  }
  for (let i = 0; i < n; i++) {
    kiri[i] /= puncak;
    kanan[i] /= puncak;
  }
  return [kiri, kanan];
};

// Gain per jenis efek, diisi sebelum tiap efek disintesis (lihat volume.efekPerJenis).
let penguat = 1;

const tulis = (kiri, kanan, rate, detik, lama, fungsi) => {
  const mulai = Math.max(0, Math.round(detik * rate));
  const panjang = Math.min(Math.round(lama * rate), kiri.length - mulai);
  for (let i = 0; i < panjang; i++) {
    const [l, r] = fungsi(i / rate, i / panjang);
    kiri[mulai + i] += l * penguat;
    kanan[mulai + i] += r * penguat;
  }
};

const EFEK = {
  whoosh(kiri, kanan, rate, detik, _nada, noise) {
    let lp = 0;
    tulis(kiri, kanan, rate, detik, 0.55, (_t, u) => {
      const potong = 350 + 3200 * Math.sin(Math.PI * u) ** 2;
      lp += (1 - Math.exp((-2 * Math.PI * potong) / rate)) * (noise() - lp);
      const nilai = lp * Math.sin(Math.PI * u) ** 2 * 1.5;
      const pan = u * 1.2 - 0.6;
      return [nilai * (1 - pan) * 0.7, nilai * (1 + pan) * 0.7];
    });
  },
  pop(kiri, kanan, rate, detik, tinggi) {
    let fase = 0;
    tulis(kiri, kanan, rate, detik, 0.09, (t) => {
      fase += (2 * Math.PI * (950 * tinggi * Math.exp(-t * 22) + 240)) / rate;
      const nilai = Math.sin(fase) * Math.exp(-t * 42) * 0.7;
      return [nilai, nilai];
    });
  },
  ting(kiri, kanan, rate, detik) {
    tulis(kiri, kanan, rate, detik, 0.7, (t) => {
      const nilai = (Math.sin(2 * Math.PI * 1318 * t) + 0.5 * Math.sin(2 * Math.PI * 2637 * t)) * Math.exp(-t * 7) * 0.45;
      return [nilai, nilai];
    });
  },
  hentak(kiri, kanan, rate, detik, _nada, noise) {
    let fase = 0;
    tulis(kiri, kanan, rate, detik, 0.24, (t) => {
      fase += (2 * Math.PI * (70 + 90 * Math.exp(-t * 28))) / rate;
      const nilai = Math.sin(fase) * Math.exp(-t * 17) * 1.1 + noise() * Math.exp(-t * 130) * 0.25;
      return [nilai, nilai];
    });
  },
  kertas(kiri, kanan, rate, detik, _nada, noise) {
    let lp = 0;
    for (const [geser, kuat] of [[0, 0.8], [0.06, 0.5]]) {
      tulis(kiri, kanan, rate, detik + geser, 0.07, (t) => {
        const putih = noise();
        lp += 0.25 * (putih - lp);
        const nilai = (putih - lp) * Math.exp(-t * 55) * kuat;
        return [nilai, nilai];
      });
    }
    let fase = 0;
    tulis(kiri, kanan, rate, detik, 0.08, (t) => {
      fase += (2 * Math.PI * 135) / rate;
      const nilai = Math.sin(fase) * Math.exp(-t * 45) * 0.5;
      return [nilai, nilai];
    });
  },
  kaching(kiri, kanan, rate, detik, _nada, noise) {
    EFEK.kertas(kiri, kanan, rate, detik, 1, noise);
    for (const [geser, frekuensi] of [[0.05, 1760], [0.15, 2349]]) {
      tulis(kiri, kanan, rate, detik + geser, 0.75, (t) => {
        const nilai = (Math.sin(2 * Math.PI * frekuensi * t) + 0.45 * Math.sin(2 * Math.PI * frekuensi * 2.76 * t)) * Math.exp(-t * 6) * 0.42;
        return [nilai, nilai];
      });
    }
  },
};

// Kebalikan Easing.inOut(cubic), untuk mencari saat tiap ikatan uang muncul.
const waktuEasing = (p) => (p < 0.5 ? Math.cbrt(p / 4) : 1 - Math.cbrt(2 * (1 - p)) / 2);

const daftarEfek = (scenes, konfigurasi) => {
  const hasil = [];
  scenes.forEach((scene, indeks) => {
    if (indeks > 0) hasil.push({jenis: 'whoosh', frame: scene.start - 8, nada: 1});
  });
  for (const efek of konfigurasi.efek) {
    const scene = scenes.find((item) => item.id === efek.scene);
    if (efek.jenis === 'tumpukan') {
      const baris = scene.lines[0];
      const dari = baris.start + 6;
      const sampai = baris.start + baris.frames + 20;
      for (let ikatan = 1; ikatan <= 7; ikatan++) {
        const p = Math.min(0.995, ((ikatan - 0.5) * 100) / 688);
        hasil.push({jenis: 'kertas', frame: dari + (sampai - dari) * waktuEasing(p), nada: 1});
      }
      continue;
    }
    let frame = scene.start + (efek.frame ?? 0);
    if (efek.baris !== undefined) frame = scene.lines[efek.baris].start + (efek.offset ?? 0);
    if (efek.persen !== undefined) frame = scene.start + scene.duration * efek.persen;
    hasil.push({jenis: efek.jenis, frame, nada: efek.nada ?? 1});
  }
  return hasil;
};

// Mencampur narasi di pcm (16-bit stereo) dengan musik dan efek, lalu menulis hasilnya ke pcm.
export const campurLatar = ({pcm, rate, scenes, bacaMusik, efekJadi}) => {
  const konfigurasi = JSON.parse(fs.readFileSync('data/efek-suara.json', 'utf8'));
  const volume = konfigurasi.volume;
  const n = pcm.length / 4;

  const suara = new Float32Array(n);
  let puncak = 1;
  for (let i = 0; i < n; i++) {
    suara[i] = pcm.readInt16LE(i * 4);
    puncak = Math.max(puncak, Math.abs(suara[i]));
  }
  for (let i = 0; i < n; i++) suara[i] = (suara[i] / puncak) * volume.narasi;

  const bicara = new Uint8Array(n);
  for (const scene of scenes) {
    for (const line of scene.lines) {
      const dari = Math.max(0, Math.round(((line.start - 3) / 30) * rate));
      const sampai = Math.min(n, Math.round(((line.start + line.frames) / 30) * rate));
      bicara.fill(1, dari, sampai);
    }
  }

  // User memilih tanpa musik latar (2026-11-12). Set `musik.aktif` ke true untuk menyalakannya lagi.
  const pakaiMusik = konfigurasi.musik?.aktif !== false;
  const [musikKiri, musikKanan] = pakaiMusik ? siapkanMusik(bacaMusik(konfigurasi.musik.file), n) : [new Float32Array(n), new Float32Array(n)];
  const efekKiri = new Float32Array(n);
  const efekKanan = new Float32Array(n);
  const noise = acak(77);
  const efek = efekJadi ?? daftarEfek(scenes, konfigurasi);
  for (const item of efek) {
    penguat = volume.efekPerJenis?.[item.jenis] ?? 1;
    EFEK[item.jenis](efekKiri, efekKanan, rate, item.frame / 30, item.nada, noise);
  }
  penguat = 1;

  const naik = 1 - Math.exp(-1 / (0.06 * rate));
  const turun = 1 - Math.exp(-1 / (0.3 * rate));
  const redam = (x) => (Math.abs(x) < 0.85 ? x : Math.sign(x) * (0.85 + 0.14 * Math.tanh((Math.abs(x) - 0.85) / 0.14)));
  const ukur = {bicara: [0, 0], jeda: [0, 0], suara: [0, 0]};
  let selubung = 0;
  for (let i = 0; i < n; i++) {
    selubung += (bicara[i] - selubung) * (bicara[i] ? naik : turun);
    const masuk = Math.min(1, i / (rate * 0.8));
    const keluar = Math.min(1, (n - i) / (rate * 1.5));
    const gain = (volume.musikSaatJeda + (volume.musikSaatBicara - volume.musikSaatJeda) * selubung) * masuk * keluar;
    const musik = musikKiri[i] * gain;
    const grup = bicara[i] ? ukur.bicara : ukur.jeda;
    grup[0] += musik * musik;
    grup[1]++;
    if (bicara[i]) {
      ukur.suara[0] += suara[i] * suara[i];
      ukur.suara[1]++;
    }
    pcm.writeInt16LE(Math.round(redam(suara[i] + musik + efekKiri[i] * volume.efek) * 32767), i * 4);
    pcm.writeInt16LE(Math.round(redam(suara[i] + musikKanan[i] * gain + efekKanan[i] * volume.efek) * 32767), i * 4 + 2);
  }
  const db = ([jumlah, banyak]) => (10 * Math.log10(jumlah / Math.max(1, banyak) + 1e-12)).toFixed(1);
  console.log(`Efek: ${efek.length}. Narasi ${db(ukur.suara)} dB, musik saat bicara ${db(ukur.bicara)} dB, musik saat jeda ${db(ukur.jeda)} dB`);
};
