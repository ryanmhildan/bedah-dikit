import {useMemo, type CSSProperties, type ReactNode} from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, random, useCurrentFrame} from 'remotion';
import provinces from '../data/indonesia-provinces.json';
import {FONT} from './DataShort';
import {Depan, Dunia, TEMA} from './pustaka/dunia';
import {Ikon, type NamaIkon} from './pustaka/ikon';
import {AdeganSet} from './pustaka/set/panggung';
import type {MasukShot, Shot as ShotSet} from './pustaka/set/tipe';
import {TokohRig, naskahAdegan, type BatasTangan, type NamaPoseRig} from './pustaka/tokoh-rig';
import {BAR, CAIR_BAHAN, FADE, KARTU, NAVY, PETA_DARAT, PETA_LAUT, PETA_PANTAI, PETA_PANTAI_LUAR, PITA, PITA_TENANG, REDUP, ROSE, SUMBER_LATAR, WHITE, type NamaCair} from './tema';
import type {LookName} from './Tokoh';

// `pose` opsional menimpa pilihan otomatis untuk baris itu. `shot` membuat adegan digambar dengan set topik.
type Baris = {id: string; teks: string; start: number; frames: number; pose?: NamaPoseRig; shot?: ShotSet[]};
type Adegan = {
  id: string;
  jenis: string;
  start: number;
  durasi: number;
  baris: Baris[];
  muncul: number[];
  // Isi berbeda untuk tiap jenis adegan, dan sudah divalidasi oleh scripts/episode.mjs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};

export type EpisodeProps = {tokoh: LookName; sumber: string; total: number; adegan: Adegan[]};

type Isi = {adegan: Adegan; tokoh: LookName; sumber: string; shots: Shot[]};

const BALON_PEMBUKA = 22;
const BALON_PENUTUP = 2;

const halus = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

const keluar = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.5)),
  });

// Perencana shot: memecah adegan menjadi shot 3-4 detik dari `baris` dan `muncul`, tanpa mengubah durasi adegan.
type Ukuran = 'dekat' | 'lebar' | 'badan' | 'sisipan' | 'normal';
type Sisi = 'kiri' | 'kanan' | 'belah';
type Shot = {
  mulai: number;
  akhir: number;
  nomor: number;
  ukuran: Ukuran;
  lewat: 'awal' | 'potong' | 'sapu';
  fokus?: number;
  sisi?: Sisi;
  cepat?: number;
};

const SHOT_PAS: [number, number] = [90, 120];
const SHOT_MAKS = 150;
const SHOT_MIN = 40;
const SHOT_PENDEK = 60;
const JEDA_ELEMEN = 36;
const LAMA_CEPAT = 30;
const BONUS_BARIS = -1500;
const BIAYA_BEBAS = 1100;

const POLA_CERITA: Record<string, Ukuran[]> = {
  pembuka: ['dekat', 'lebar', 'badan'],
  penutup: ['lebar', 'dekat', 'badan'],
  penjelasan: ['badan', 'sisipan', 'dekat', 'lebar'],
};

// Elemen yang tidak boleh terpotong saat masuk, termasuk balon yang tidak tercatat di `muncul`.
const elemenAdegan = (adegan: Adegan) => {
  const akhir = adegan.baris[adegan.baris.length - 1];
  if (adegan.jenis === 'pembuka') return [BALON_PEMBUKA];
  if (adegan.jenis === 'penutup') return [akhir.start + BALON_PENUTUP];
  return adegan.muncul;
};

const berlintasan = (adegan: Adegan) => adegan.jenis === 'rantai' || adegan.jenis === 'linimasa';

// Lintasan selalu berganti shot saat sapuan mulai. Grafik mendekat ke tiap batang, lalu kembali ke semua batang.
const potongWajib = (adegan: Adegan) => {
  if (berlintasan(adegan)) return adegan.muncul.slice(1).map((m) => m - 6);
  if (adegan.jenis !== 'grafik') return [];
  const hasil: number[] = [];
  adegan.muncul.forEach((m) => {
    const sebelum = hasil[hasil.length - 1] ?? 0;
    if (m - 7 >= sebelum + SHOT_MIN + 7) hasil.push(m - 7);
  });
  const balik = adegan.muncul[adegan.muncul.length - 1] + JEDA_ELEMEN + 6;
  return adegan.durasi - balik >= SHOT_PENDEK ? [...hasil, balik] : hasil;
};

// Biaya titik potong: awal baris paling baik, lalu tanda baca, dan titik bebas hanya bila terpaksa.
const calonPotong = (adegan: Adegan, wajib: number[]) => {
  const calon = new Map<number, number>();
  const tambah = (frame: number, biaya: number) => {
    const titik = Math.round(frame);
    calon.set(titik, Math.min(biaya, calon.get(titik) ?? Infinity));
  };
  for (let frame = SHOT_MIN; frame <= adegan.durasi - SHOT_PENDEK; frame += 3) tambah(frame, BIAYA_BEBAS);
  adegan.baris.forEach((line, i) => {
    if (i > 0) tambah(line.start - 3, BONUS_BARIS);
    for (const tanda of line.teks.matchAll(/[.?!,;](?=\s)/g)) {
      tambah(line.start + (line.frames * (tanda.index + 1)) / line.teks.length, /[,;]/.test(tanda[0]) ? 400 : 150);
    }
  });
  adegan.muncul.forEach((m) => tambah(m - 6, 50));
  const elemen = elemenAdegan(adegan);
  const aman = (frame: number) => frame >= SHOT_MIN && frame <= adegan.durasi - SHOT_MIN && !elemen.some((e) => frame >= e - 4 && frame < e + JEDA_ELEMEN);
  const hasil = [...calon].filter(([frame]) => aman(frame) && !wajib.includes(frame));
  wajib.forEach((frame) => hasil.push([frame, 0]));
  return hasil.sort((a, b) => a[0] - b[0]);
};

const biayaPanjang = (panjang: number) => {
  const kurang = Math.max(SHOT_PAS[0] - panjang, 0);
  const lebih = Math.max(panjang - SHOT_PAS[1], 0);
  return kurang ** 2 + 2 * lebih ** 2 + Math.max(0, panjang - SHOT_MAKS) * 200 + Math.max(0, SHOT_PENDEK - panjang) * 60 + (panjang < SHOT_MIN ? 1e6 : 0);
};

// Program dinamis atas semua titik calon, jadi hasilnya sama setiap frame dan setiap render.
const pilihPotong = (adegan: Adegan) => {
  const wajib = potongWajib(adegan);
  const titik: [number, number][] = [[0, 0], ...calonPotong(adegan, wajib), [adegan.durasi, 0]];
  const terbaik = titik.map(() => Infinity);
  const asal = titik.map(() => 0);
  terbaik[0] = 0;
  for (let j = 1; j < titik.length; j++) {
    for (let i = j - 1; i >= 0; i--) {
      const biaya = terbaik[i] + biayaPanjang(titik[j][0] - titik[i][0]) + titik[j][1];
      if (biaya < terbaik[j]) {
        terbaik[j] = biaya;
        asal[j] = i;
      }
      if (wajib.includes(titik[i][0])) break;
    }
  }
  const hasil: number[] = [];
  for (let j = titik.length - 1; j > 0; j = asal[j]) hasil.unshift(titik[j][0]);
  return {batas: [0, ...hasil], wajib};
};

const tataShot = (adegan: Adegan, kosong: Shot[], cepat: boolean): Shot[] => {
  const {jenis, muncul} = adegan;
  const pola = POLA_CERITA[jenis];
  if (pola) return kosong.map((shot, i) => ({...shot, ukuran: pola[i % pola.length]}));
  if (jenis === 'grafik') {
    return kosong.map((shot) => {
      const fokus = muncul.findIndex((m) => m >= shot.mulai && m <= shot.mulai + 12);
      return {...shot, ukuran: fokus < 0 ? 'lebar' : 'dekat', fokus: fokus < 0 ? undefined : fokus};
    });
  }
  if (jenis === 'perbandingan') {
    let sebelum: Sisi = 'kiri';
    return kosong.map((shot, i) => {
      const sisi: Sisi = shot.akhir <= muncul[1] - 6 ? 'kiri' : sebelum !== 'belah' ? 'belah' : 'kanan';
      sebelum = sisi;
      // Shot satu sisi yang berurutan harus beda ukuran, kalau tidak potongannya tidak terlihat.
      const ukuran: Ukuran = sisi === 'belah' || (sisi === 'kiri' && i % 2 === 0) ? 'normal' : 'dekat';
      return {...shot, sisi, ukuran, cepat: cepat && sisi === 'kanan' ? shot.mulai + 4 : undefined};
    });
  }
  if (berlintasan(adegan)) {
    let ke = 0;
    return kosong.map((shot, i) => {
      ke = shot.lewat === 'potong' ? ke + 1 : 0;
      // Langkah puncak sudah mendekat lewat kamera cepat, jadi potongan berikutnya kembali lebar.
      const langkahPuncak = cepat && kosong[i - ke].mulai === muncul[muncul.length - 1] - 6;
      const puncak = langkahPuncak && ke === 0;
      const dekat = langkahPuncak ? ke % 2 === 0 : ke % 2 === 1;
      return {...shot, ukuran: dekat ? 'dekat' : 'normal', cepat: puncak ? shot.mulai + 22 : undefined};
    });
  }
  return kosong.map((shot, i) => ({...shot, ukuran: i === 0 ? 'dekat' : 'lebar'}));
};

export const rencanaShot = (adegan: Adegan, cepat = false): Shot[] => {
  const {batas, wajib} = pilihPotong(adegan);
  const kosong = batas.slice(0, -1).map(
    (mulai, nomor): Shot => ({mulai, akhir: batas[nomor + 1], nomor, ukuran: 'normal', lewat: nomor === 0 ? 'awal' : berlintasan(adegan) && wajib.includes(mulai) ? 'sapu' : 'potong'}),
  );
  return tataShot(adegan, kosong, cepat);
};

// Kamera cepat hanya di puncak penjelasan: langkah terakhir rantai atau linimasa, lalu sisi kedua perbandingan.
const PUNCAK = ['rantai', 'linimasa', 'perbandingan'];

export const rencanaEpisode = (adegan: Adegan[]) => {
  const dipilih = adegan
    .filter((item) => PUNCAK.includes(item.jenis))
    .sort((a, b) => PUNCAK.indexOf(a.jenis) - PUNCAK.indexOf(b.jenis))
    .slice(0, 2)
    .map((item) => item.id);
  return adegan.map((item) => rencanaShot(item, dipilih.includes(item.id)));
};

const shotDi = (shots: Shot[], frame: number) => shots.find((shot) => frame < shot.akhir) ?? shots[shots.length - 1];

const nilaiCepat = (shot: Shot, frame: number) => (shot.cepat === undefined ? 0 : halus(frame, shot.cepat, shot.cepat + LAMA_CEPAT));

// Tiap shot melihat bagian dunia yang berbeda, supaya potongan tidak terasa seperti lompatan di tempat.
const geserShot = (shot: Shot, frame: number) => frame * 0.9 + (shot.nomor % 3) * 300;

// Pada shot lebar daratan naik, sehingga kaki tokoh kecil berada di atas caption.
const ANGKAT_LEBAR = 175;

const turunDepan = (shot: Shot) => (shot.ukuran === 'lebar' || shot.ukuran === 'badan' ? 150 : 0);

const ZOOM_SHOT: Record<Ukuran, [number, number]> = {
  dekat: [1.06, 1.12],
  badan: [1.03, 1.07],
  lebar: [1, 1.035],
  sisipan: [1.08, 1.14],
  normal: [1.02, 1.06],
};

// Letak tokoh: `tengah` untuk pembuka dan penutup, `samping` saat berbagi layar dengan ikon.
const TOKOH_TENGAH: Record<string, {size: number; left: number; top: number}> = {
  dekat: {size: 1040, left: 20, top: 700},
  lebar: {size: 320, left: 380, top: 936},
  badan: {size: 640, left: 220, top: 682},
};
const TOKOH_SAMPING: Record<string, {size: number; left: number; top: number}> = {
  ...TOKOH_TENGAH,
  lebar: {size: 320, left: 90, top: 936},
  badan: {size: 340, left: 100, top: 909},
};

const IKON_SHOT: Record<string, {size: number; left: number; top: number}> = {
  badan: {size: 600, left: 340, top: 430},
  lebar: {size: 460, left: 430, top: 520},
  sisipan: {size: 760, left: 160, top: 480},
  dekat: {size: 230, left: 720, top: 430},
};

const Captions = ({adegan, top = 1390}: {adegan: Adegan; top?: number}) => {
  const frame = useCurrentFrame();
  const line = adegan.baris.find((item) => frame >= item.start - 2 && frame < item.start + item.frames + 7);
  if (!line) return null;
  const opacity = interpolate(frame - line.start, [-2, 5, line.frames + 2, line.frames + 7], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{position: 'absolute', top, left: 80, width: 860, textAlign: 'center', opacity, fontFamily: FONT}}>
      <span
        style={{
          fontSize: 40,
          fontWeight: 500,
          lineHeight: 1.5,
          color: WHITE,
          backgroundColor: 'rgba(12,12,18,0.78)',
          padding: '5px 14px',
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
        }}
      >
        {line.teks}
      </span>
    </div>
  );
};

// `top` bawaan 1500 hanya untuk adegan lama. Adegan set memakai `SUMBER_SET` supaya tetap di dalam area aman.
const Sumber = ({teks, top = 1500, lineHeight, ukuran = 24}: {teks: string; top?: number; lineHeight?: number; ukuran?: number}) => (
  <div style={{position: 'absolute', left: 80, top, width: 860, fontSize: ukuran, fontWeight: 500, color: WHITE, lineHeight}}>
    <span style={{backgroundColor: SUMBER_LATAR, padding: '4px 12px', borderRadius: 8}}>{teks}</span>
  </div>
);

const JudulBesar = ({teks, nama, start = 0, pudar = 0}: {teks: string; nama: string; start?: number; pudar?: number}) => {
  const frame = useCurrentFrame();
  const p = keluar(frame, start, start + 16);
  const tema = TEMA[nama] ?? TEMA.kota;
  return (
    <div
      style={{
        position: 'absolute',
        top: 240,
        left: 70,
        width: 940,
        textAlign: 'center',
        fontSize: 74,
        fontWeight: 900,
        lineHeight: 1.08,
        color: tema.teks,
        textShadow: `0 0 26px ${tema.bayangan}`,
        opacity: Math.min(1, p * 2) * (1 - pudar),
        transform: `scale(${0.82 + 0.18 * p})`,
      }}
    >
      {teks}
    </div>
  );
};

// Area aman layar dalam koordinat rig. Titik asal rig ada di (210, 320) pada viewBox selebar 420.
export const batasTanganDi = ({size, left, top, closeup = false}: {size: number; left: number; top: number; closeup?: boolean}): BatasTangan => {
  const skala = size / 420;
  return {
    kiri: (80 - left) / skala - 210,
    kanan: (950 - left) / skala - 210,
    atas: (230 - top) / skala - 320,
    // Shot dekat membingkai dada ke atas, jadi lengan yang turun hilang ke bawah bingkai.
    bawah: closeup ? undefined : (1500 - top) / skala - 320,
  };
};

// Karakter dibingkai dari dada ke atas dan masuk dari bawah layar. Kunci naskah dan `useCurrentFrame` sama-sama lokal adegan.
const Dada = ({adegan, tokoh, size, left, top, look = 0, up = 0, arah = 1, rapat = false, closeup = false}: {adegan: Adegan; tokoh: LookName; size: number; left: number; top: number; look?: number; up?: number; arah?: 1 | -1; rapat?: boolean; closeup?: boolean}) => {
  const frame = useCurrentFrame();
  const masuk = keluar(frame, 4, 26);
  const naskah = useMemo(() => naskahAdegan({baris: adegan.baris, jenis: adegan.jenis, id: adegan.id, look, up, arah, dekat: closeup}), [adegan, look, up, arah, closeup]);
  return (
    <div style={{position: 'absolute', left, top: top + (1 - masuk) * 700}}>
      <TokohRig naskah={naskah} variant={tokoh} size={size} id={adegan.id} closeup={closeup} rapat={rapat} batasTangan={batasTanganDi({size, left, top, closeup})} />
    </div>
  );
};

// Balon adegan set selebar 860 supaya tepi kanan berhenti di x 950, batas area aman.
// Adegan lama tanpa set tetap 900 supaya judul pembuka video lama tidak terlipat ulang.
const LEBAR_BALON_SET = 860;
const LEBAR_BALON_LAMA = 900;

const Balon = ({start, teks, sub, ekor = true, ukuran = 76, lebar = LEBAR_BALON_LAMA}: {start: number; teks: string; sub?: string; ekor?: boolean; ukuran?: number; lebar?: number}) => {
  const frame = useCurrentFrame();
  const p = keluar(frame, start, start + 14);
  return (
    <div style={{position: 'absolute', left: 90, top: 260, width: lebar, opacity: Math.min(1, p * 2), transform: `scale(${p})`, transformOrigin: '50% 100%'}}>
      <div style={{backgroundColor: WHITE, borderRadius: 64, padding: '38px 44px', textAlign: 'center', color: NAVY}}>
        <div style={{fontSize: ukuran, fontWeight: 900, lineHeight: 1.1}}>{teks}</div>
        {sub && <div style={{fontSize: 36, fontWeight: 500, marginTop: 12}}>{sub}</div>}
      </div>
      {ekor && (
        <svg width={120} height={70} style={{position: 'absolute', left: lebar / 2 - 60, bottom: -60}}>
          <path d="M6 0 H96 L62 66 Z" fill={WHITE} />
        </svg>
      )}
    </div>
  );
};

const Dorong = ({shot, nama, naik = shot.ukuran === 'lebar'}: {shot: Shot; nama: string; naik?: boolean}) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [shot.mulai, shot.akhir], ZOOM_SHOT[shot.ukuran], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  });
  return <Dunia nama={nama} zoom={zoom} geser={geserShot(shot, frame)} angkat={naik ? ANGKAT_LEBAR : 0} />;
};

const Pembuka = ({adegan, tokoh, shots}: Isi) => {
  const frame = useCurrentFrame();
  const shot = shotDi(shots, frame);
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Dorong shot={shot} nama={adegan.data.latar} />
      <Dada adegan={adegan} tokoh={tokoh} {...TOKOH_TENGAH[shot.ukuran]} look={0.1} up={0.5} closeup={shot.ukuran === 'dekat'} />
      <Depan nama={adegan.data.latar} geser={geserShot(shot, frame)} turun={turunDepan(shot)} />
      <Balon start={BALON_PEMBUKA} teks={adegan.data.judul} sub={adegan.data.sub} ekor={shot.ukuran !== 'lebar'} />
      <Captions adegan={adegan} />
    </AbsoluteFill>
  );
};

const Penutup = ({adegan, tokoh, shots}: Isi) => {
  const frame = useCurrentFrame();
  const shot = shotDi(shots, frame);
  const akhir = adegan.baris[adegan.baris.length - 1];
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Dorong shot={shot} nama={adegan.data.latar} />
      <Dada adegan={adegan} tokoh={tokoh} {...TOKOH_TENGAH[shot.ukuran]} look={-0.15} up={0.5} arah={-1} closeup={shot.ukuran === 'dekat'} />
      <Depan nama={adegan.data.latar} geser={geserShot(shot, frame)} turun={turunDepan(shot)} />
      <Balon start={akhir.start + BALON_PENUTUP} teks={adegan.data.pertanyaan} ekor={shot.ukuran !== 'lebar'} />
      <Captions adegan={adegan} />
    </AbsoluteFill>
  );
};

const Penjelasan = ({adegan, tokoh, shots}: Isi) => {
  const frame = useCurrentFrame();
  const shot = shotDi(shots, frame);
  const gambar: {ikon: NamaIkon; label?: string}[] = adegan.data.gambar;
  const aktif = gambar.reduce((hasil, _, i) => (frame >= adegan.muncul[i] ? i : hasil), 0);
  const tata = IKON_SHOT[shot.ukuran];
  const k = tata.size / 620;
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Dorong shot={shot} nama={adegan.data.latar} naik={shot.ukuran === 'lebar' || shot.ukuran === 'badan'} />
      {gambar.map((item, i) => {
        const mulai = adegan.muncul[i];
        const p = halus(frame, mulai, mulai + 16);
        const pergi = i < gambar.length - 1 ? halus(frame, adegan.muncul[i + 1] - 4, adegan.muncul[i + 1] + 12) : 0;
        if (p === 0 || pergi === 1) return null;
        return (
          <div key={item.ikon} style={{position: 'absolute', left: tata.left, top: tata.top + Math.sin(frame / 22) * 12, transform: `translateX(${(1 - p) * 1100 - pergi * 1100}px) rotate(${(1 - p) * 14 - pergi * 14}deg)`}}>
            <div style={{position: 'absolute', left: 90 * k, top: 580 * k, width: 440 * k, height: 50 * k, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.16)', filter: 'blur(16px)'}} />
            <Ikon nama={item.ikon} size={tata.size} />
          </div>
        );
      })}
      {gambar[aktif].label && <JudulBesar key={aktif} nama={adegan.data.latar} teks={gambar[aktif].label!} start={adegan.muncul[aktif]} />}
      {shot.ukuran !== 'sisipan' && <Dada adegan={adegan} tokoh={tokoh} {...TOKOH_SAMPING[shot.ukuran]} look={shot.ukuran === 'dekat' ? 0.1 : 0.45} up={0.7} closeup={shot.ukuran === 'dekat'} />}
      <Depan nama={adegan.data.latar} geser={geserShot(shot, frame)} turun={turunDepan(shot)} />
      <Captions adegan={adegan} />
    </AbsoluteFill>
  );
};

const Perbandingan = ({adegan, sumber, shots}: Isi) => {
  const frame = useCurrentFrame();
  const shot = shotDi(shots, frame);
  const {judul, kiri, kanan, latar, latarKiri = latar} = adegan.data;
  const sisi: {ikon: NamaIkon; label: string; nilai?: string; dunia: string}[] = [
    {...kiri, dunia: latarKiri},
    {...kanan, dunia: latar},
  ];
  const penuh = shot.sisi !== 'belah';
  const dorong = shot.cepat !== undefined ? nilaiCepat(shot, frame) : shot.ukuran === 'dekat' ? 1 : 0;
  return (
    <AbsoluteFill style={{fontFamily: FONT, backgroundColor: WHITE}}>
      {sisi.map((item, i) => {
        if (penuh && shot.sisi !== (i === 0 ? 'kiri' : 'kanan')) return null;
        // Dunia selalu terlihat. Sisi yang barisnya belum tiba hanya redup dan belum punya isi.
        const terang = i === 0 ? 1 : halus(frame, adegan.muncul[i] - 12, adegan.muncul[i] + 8);
        const isi = i === 0 ? 1 : halus(frame, adegan.muncul[i] - 6, adegan.muncul[i] + 12);
        const tema = TEMA[item.dunia] ?? TEMA.kota;
        const lebar = penuh ? 1080 : 536;
        return (
          <div
            key={item.label}
            style={{
              position: 'absolute',
              left: penuh ? 0 : i * 544,
              top: 0,
              width: lebar,
              height: 1920,
              overflow: 'hidden',
            }}
          >
            <div style={{position: 'absolute', left: penuh ? 0 : -272, width: 1080, height: 1920}}>
              <Dunia nama={item.dunia} zoom={1.05 + dorong * 0.25} geser={frame * 0.9 + i * 700} />
            </div>
            <div style={{position: 'absolute', inset: 0, backgroundColor: REDUP, opacity: 1 - terang}} />
            <div style={{position: 'absolute', top: penuh ? 440 : 500, left: 0, width: lebar, textAlign: 'center', color: tema.teks, textShadow: `0 0 24px ${tema.bayangan}`, opacity: Math.min(1, isi * 2), transform: `translateY(${(1 - isi) * 90}px)`}}>
              <div style={{display: 'flex', justifyContent: 'center', transform: `translateY(${Math.sin(frame / 20 + i) * 10}px) scale(${1 + dorong * 0.1})`, transformOrigin: '50% 100%'}}>
                <Ikon nama={item.ikon} size={penuh ? 560 : 400} />
              </div>
              <div style={{fontSize: penuh ? 84 : 64, fontWeight: 900, marginTop: 24}}>{item.label}</div>
              {item.nilai && <div style={{fontSize: penuh ? 64 : 52, fontWeight: 700, marginTop: 6, lineHeight: 1.1, padding: '0 20px'}}>{item.nilai}</div>}
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', top: 236, left: 70, width: 940, textAlign: 'center'}}>
        <div style={{display: 'inline-block', backgroundColor: WHITE, color: NAVY, fontSize: 48, fontWeight: 900, lineHeight: 1.12, padding: '14px 34px', borderRadius: 40}}>{judul}</div>
      </div>
      <Captions adegan={adegan} top={1340} />
      <Sumber teks={sumber} />
    </AbsoluteFill>
  );
};

const angka = (nilai: number) => {
  const [depan, belakang] = (Math.round(nilai * 10) / 10).toString().split('.');
  return depan.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (belakang ? `,${belakang}` : '');
};

const Grafik = ({adegan, tokoh, sumber, shots}: Isi) => {
  const frame = useCurrentFrame();
  const shot = shotDi(shots, frame);
  const {judul, item, satuan = '', awalan = '', sorot = [], latar} = adegan.data;
  const data: {label: string; nilai: number}[] = item;
  const tema = TEMA[latar] ?? TEMA.kota;
  const tertinggi = Math.max(...data.map((baris) => baris.nilai));
  const sedikit = data.length <= 3;
  const jarak = sedikit ? 250 : Math.min(120, 860 / data.length);
  return (
    <AbsoluteFill style={{fontFamily: FONT, color: tema.teks}}>
      <Dorong shot={shot} nama={latar} />
      <JudulBesar nama={latar} teks={judul} />
      {data.map((baris, i) => {
        // Shot dekat membesarkan batang yang sedang disebut. Batang sebelumnya tetap terlihat kecil sebagai pembanding.
        const dekat = shot.fokus === i;
        const rujukan = shot.fokus !== undefined && i === shot.fokus - 1;
        if (shot.fokus !== undefined && !dekat && !rujukan) return null;
        const p = halus(frame, adegan.muncul[i], adegan.muncul[i] + 36);
        const utama = sorot.includes(baris.label);
        const kecil = rujukan || !sedikit;
        const tinggi = dekat ? 84 : kecil ? 28 : 46;
        const atas = dekat ? (i > 0 ? 610 : 520) : rujukan ? 470 : 480 + i * jarak;
        return (
          <div key={baris.label} style={{position: 'absolute', top: atas, left: 80, width: 900, textShadow: `0 0 20px ${tema.bayangan}`}}>
            <div style={{display: 'flex', flexDirection: dekat ? 'column' : 'row', justifyContent: 'space-between', alignItems: dekat ? 'flex-start' : 'baseline', whiteSpace: 'nowrap'}}>
              <span style={{fontSize: dekat ? 50 : kecil ? 34 : 42, fontWeight: utama ? 900 : 500}}>{baris.label}</span>
              <span style={{fontSize: dekat ? 150 : rujukan ? 44 : sedikit ? 96 : 36, fontWeight: 900, visibility: p > 0 ? 'visible' : 'hidden'}}>{`${awalan}${angka(baris.nilai * p)}${satuan}`}</span>
            </div>
            <div style={{position: 'relative', height: tinggi, marginTop: 8}}>
              <div style={{position: 'absolute', inset: 0, borderRadius: tinggi / 2, backgroundColor: tema.teks, opacity: 0.16}} />
              <div style={{position: 'absolute', left: 0, top: 0, height: tinggi, borderRadius: tinggi / 2, width: `${(baris.nilai / tertinggi) * 100 * p}%`, backgroundColor: utama ? ROSE : BAR}} />
            </div>
          </div>
        );
      })}
      {sedikit && <Dada adegan={adegan} tokoh={tokoh} size={530} left={490} top={990} look={-0.3} up={0.8} arah={-1} rapat />}
      <Depan nama={latar} geser={geserShot(shot, frame)} turun={sedikit ? -170 : 0} />
      <Captions adegan={adegan} top={1340} />
      <Sumber teks={sumber} />
    </AbsoluteFill>
  );
};

// Kamera menyapu dari satu titik ke titik berikutnya di dunia yang sama.
const Lintasan = ({adegan, sumber, judul, jumlah, isi, shots}: Isi & {judul: string; jumlah: number; isi: (i: number, dekat: number) => ReactNode}) => {
  const frame = useCurrentFrame();
  const shot = shotDi(shots, frame);
  const latar = adegan.data.latar;
  const tema = TEMA[latar] ?? TEMA.kota;
  const JARAK = 1120;
  let posisi = 0;
  for (let i = 1; i < jumlah; i++) posisi += halus(frame, adegan.muncul[i] - 6, adegan.muncul[i] + 16);
  const aktif = Math.round(posisi);
  // Bila satu ide lama diam, potongan mendekatkan isinya. Kamera cepat melakukan hal yang sama dalam 30 frame.
  // Sebelum sapuan, shot dekat ditarik mundur supaya sapuan tidak diawali lompatan.
  const tarik = shots[shot.nomor + 1]?.lewat === 'sapu' ? halus(frame, shot.akhir - 12, shot.akhir) : 0;
  const dekat = (shot.cepat !== undefined ? nilaiCepat(shot, frame) : shot.ukuran === 'dekat' ? 1 : 0) * (1 - tarik);
  // Setelah potongan dari shot dekat, judul muncul pelan, bukan mendadak.
  const dariDekat = shot.lewat === 'potong' && shot.ukuran !== 'dekat' && shots[shot.nomor - 1]?.ukuran === 'dekat';
  const pudarJudul = dariDekat ? 1 - halus(frame, shot.mulai, shot.mulai + 24) : dekat;
  const potongan = shots.slice(0, shot.nomor + 1).filter((item) => item.lewat === 'potong').length;
  const geser = frame * 0.5 + posisi * 300 + potongan * 180;
  return (
    <AbsoluteFill style={{fontFamily: FONT, color: tema.teks}}>
      <Dunia nama={latar} zoom={1.05 + dekat * 0.1} geser={geser} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translateX(${-posisi * JARAK}px)`}}>
        <svg width={JARAK * jumlah} height={1920} style={{position: 'absolute', inset: 0}}>
          <path d={`M540 960 H${540 + (jumlah - 1) * JARAK}`} stroke={tema.teks} strokeWidth={10} strokeDasharray="4 34" strokeLinecap="round" opacity={0.5} />
        </svg>
        {Array.from({length: jumlah}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: i * JARAK + 70, top: 450, width: 940, textAlign: 'center', textShadow: `0 0 24px ${tema.bayangan}`}}>
            {isi(i, i === aktif ? dekat : 0)}
          </div>
        ))}
      </div>
      <JudulBesar nama={latar} teks={judul} pudar={pudarJudul} />
      <div style={{position: 'absolute', top: 1270, left: 0, width: 1080, display: 'flex', justifyContent: 'center', gap: 18}}>
        {Array.from({length: jumlah}, (_, i) => (
          <div key={i} style={{width: i === aktif ? 54 : 18, height: 18, borderRadius: 9, backgroundColor: i === aktif ? ROSE : tema.teks, opacity: i === aktif ? 1 : 0.45}} />
        ))}
      </div>
      <Depan nama={latar} geser={geser} />
      <Captions adegan={adegan} top={1340} />
      <Sumber teks={sumber} />
    </AbsoluteFill>
  );
};

const Rantai = (props: Isi) => {
  const frame = useCurrentFrame();
  const data: {ikon: NamaIkon; teks: string}[] = props.adegan.data.langkah;
  return (
    <Lintasan
      {...props}
      judul={props.adegan.data.judul}
      jumlah={data.length}
      isi={(i, dekat) => (
        <>
          <div style={{display: 'flex', justifyContent: 'center', transform: `translateY(${Math.sin(frame / 20 + i) * 12}px) scale(${1 + dekat * 0.25})`, transformOrigin: '50% 100%'}}>
            <Ikon nama={data[i].ikon} size={520} />
          </div>
          <div style={{fontSize: 62, fontWeight: 900, lineHeight: 1.12, marginTop: 30}}>{data[i].teks}</div>
        </>
      )}
    />
  );
};

// Teks waktu berpusat di x 540, jadi batas kanan area aman (x 950) menyisakan lebar 820 px.
const LEBAR_WAKTU = 820;
const LEBAR_HURUF = 0.594;
const ukuranWaktu = (teks: string) => Math.min(170, Math.floor(LEBAR_WAKTU / (teks.length * LEBAR_HURUF)));
const ruangWaktu = (teks: string) => Math.max(0, Math.min(0.14, LEBAR_WAKTU / (teks.length * LEBAR_HURUF * ukuranWaktu(teks)) - 1));

const Linimasa = (props: Isi) => {
  const data: {waktu: string; teks: string}[] = props.adegan.data.titik;
  // Di latar gelap, merah tenggelam di atas gedung. Keterangan memakai kuning dan naik menjauhi gedung.
  const gelap = (TEMA[props.adegan.data.latar] ?? TEMA.kota).teks === WHITE;
  return (
    <Lintasan
      {...props}
      judul={props.adegan.data.judul}
      jumlah={data.length}
      isi={(i, dekat) => (
        <div style={{marginTop: gelap ? 60 : 130}}>
          <div style={{fontSize: ukuranWaktu(data[i].waktu), fontWeight: 900, lineHeight: 1, transform: `scale(${1 + dekat * ruangWaktu(data[i].waktu)})`}}>{data[i].waktu}</div>
          <div style={{fontSize: 92, fontWeight: 700, color: gelap ? BAR : ROSE, marginTop: 40}}>{data[i].teks}</div>
        </div>
      )}
    />
  );
};

const mapX = (lon: number) => (lon - 118) * 10;
const mapY = (lat: number) => -(lat + 2) * 10;

const DARATAN = (provinces as {rings: number[][][]}[])
  .flatMap((province) => province.rings)
  .map((ring) => `M${ring.map(([x, y]) => `${mapX(x).toFixed(1)} ${mapY(y).toFixed(1)}`).join('L')}Z`)
  .join('');

const Peta = ({adegan, sumber, shots}: Isi) => {
  const frame = useCurrentFrame();
  const shot = shotDi(shots, frame);
  const {judul, fokus, tanda} = adegan.data;
  const data: {lon: number; lat: number; teks: string; arah?: number}[] = tanda;
  // Tiap shot mundur pelan dari jarak yang berbeda, dan shot terakhir menampilkan seluruh peta.
  const t = halus(frame, shot.mulai, shot.akhir);
  const tahap = shots.length > 1 ? shot.nomor / (shots.length - 1) : 0;
  const akhirPeta = shot.nomor === shots.length - 1;
  const skalaAwal = shots.length > 1 ? Math.exp(interpolate(tahap, [0, 1], [Math.log(4.4), Math.log(2.4)])) : 4.4;
  const skala = interpolate(t, [0, 1], [skalaAwal, akhirPeta ? 2.25 : skalaAwal * 0.78]);
  const geserPeta = interpolate(tahap + (akhirPeta ? 0 : t * 0.5 / Math.max(1, shots.length - 1)), [0, 1], [0, 1]);
  const pusatX = interpolate(geserPeta, [0, 1], [mapX(fokus.lon), 0]);
  const pusatY = interpolate(geserPeta, [0, 1], [mapY(fokus.lat), 10]);
  const tengahY = 800;
  const layar = (lon: number, lat: number) => [540 + (mapX(lon) - pusatX) * skala, tengahY + (mapY(lat) - pusatY) * skala];
  const garis = Array.from({length: 24}, (_, i) => i * 60 - 720);
  return (
    <AbsoluteFill style={{fontFamily: FONT, backgroundColor: PETA_LAUT}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(540 ${tengahY}) scale(${skala}) translate(${-pusatX} ${-pusatY})`}>
          <g stroke={WHITE} strokeWidth={0.8} opacity={0.55}>
            {garis.map((x) => (
              <line key={`v${x}`} x1={x} y1={-760} x2={x} y2={760} />
            ))}
            {garis.map((y) => (
              <line key={`h${y}`} x1={-760} y1={y} x2={760} y2={y} />
            ))}
          </g>
          <path d={DARATAN} fill={PETA_PANTAI_LUAR} stroke={PETA_PANTAI_LUAR} strokeWidth={15} strokeLinejoin="round" opacity={0.55} />
          <path d={DARATAN} fill={PETA_PANTAI} stroke={PETA_PANTAI} strokeWidth={4} strokeLinejoin="round" />
          <path d={DARATAN} fill={PETA_DARAT} />
        </g>
      </svg>
      {data.map((item, i) => {
        const p = keluar(frame, adegan.muncul[i], adegan.muncul[i] + 16);
        const [x, y] = layar(item.lon, item.lat);
        return (
          <div key={item.teks} style={{position: 'absolute', left: x - 200, top: y - 60, width: 400, textAlign: 'center', opacity: Math.min(1, p * 2), transform: `scale(${Math.max(0, p)})`}}>
            {item.arah !== undefined && (
              <svg width={150} height={150} viewBox="-75 -75 150 150" style={{display: 'block', margin: '0 auto', transform: `rotate(${item.arah}deg) translateY(${Math.sin(frame / 9) * 8}px)`}}>
                <path d="M0 62 V-44 M-36 -8 L0 -52 L36 -8" fill="none" stroke={ROSE} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <div style={{display: 'inline-block', backgroundColor: WHITE, color: NAVY, fontSize: 34, fontWeight: 900, padding: '8px 22px', borderRadius: 30, marginTop: 6}}>{item.teks}</div>
          </div>
        );
      })}
      <JudulBesar nama="kota" teks={judul} />
      <Captions adegan={adegan} top={1340} />
      <Sumber teks={sumber} />
    </AbsoluteFill>
  );
};

// ---------------- Adegan dengan set topik ----------------

// Adegan memakai set bila ada baris yang punya `shot`.
export const pakaiSet = (adegan: Adegan) => adegan.baris.some((line) => (line.shot?.length ?? 0) > 0);

// Pergantian baris dipotong 3 frame sebelum suara mulai, seperti perencana shot lama.
const POTONG_DINI = 3;

type ShotTerjadwal = {shot: ShotSet; mulai: number; akhir: number; baris: [number, number]; kode: string};

// Jadwal shot dalam frame lokal adegan. Shot pertama tiap baris mulai di awal baris, shot berikutnya di `pada` atau `porsi`.
export const jadwalSet = (adegan: Adegan): ShotTerjadwal[] => {
  const hasil: ShotTerjadwal[] = [];
  const akhirBaris = adegan.baris.length - 1;
  adegan.baris.forEach((line, i) => {
    const awal = i === 0 ? 0 : line.start - POTONG_DINI;
    const akhir = i === akhirBaris ? adegan.durasi : adegan.baris[i + 1].start - POTONG_DINI;
    const daftar = line.shot ?? [];
    const mulai = daftar.map((shot, j) => {
      if (j === 0) return awal;
      const relatif = shot.pada ?? Math.round((shot.porsi ?? 0) * line.frames);
      return Math.min(akhir - 1, Math.max(awal + 1, line.start + relatif));
    });
    daftar.forEach((shot, j) => {
      const dari = mulai[j];
      hasil.push({shot, mulai: dari, akhir: j < daftar.length - 1 ? mulai[j + 1] : akhir, baris: [line.start - dari, line.start + line.frames - dari], kode: `${line.id}-${j}`});
    });
  });
  return hasil;
};

// Adegan set: teks narasi selalu di posisi yang sama, dan baris sumber di bawahnya tetap di atas y 1500.
// Dua baris narasi berakhir sekitar y 1450, sumber berada di y 1458 sampai 1492.
const NARASI_SET = 1330;
const SUMBER_SET = 1462;

const ADA_ANGKA = /\d/;

// Baris sumber di adegan set harus satu baris supaya tidak melewati y 1500. Sumber yang panjang dikecilkan.
const MUAT_SUMBER = 70;
const ukuranSumber = (teks: string) => (teks.length > MUAT_SUMBER ? Math.floor((24 * MUAT_SUMBER) / teks.length) : 24);

// Sumber tampil di setiap shot yang menampilkan angka, atau bila shot menulis `sumber: true`.
// Angka dibaca dari label gelas ukur, label aksi, teks properti, teks benda di tangan, dan balon.
export const shotBerangka = (shot: ShotSet): boolean => {
  if (shot.sumber !== undefined) return shot.sumber;
  const teks: (string | undefined)[] = [shot.balon?.teks, shot.tokoh?.pegang?.teks, ...(shot.properti ?? []).map((p) => p.teks)];
  for (const a of shot.aksi ?? []) {
    if (a.aksi === 'tuang' && a.garis.length > 0) return true;
    if (a.aksi === 'label' || a.aksi === 'taruh' || a.aksi === 'muncul') teks.push(a.teks);
  }
  return teks.some((t) => t !== undefined && ADA_ANGKA.test(t));
};

const AdeganBerset = ({adegan, tokoh, sumber}: Isi) => {
  const jadwal = useMemo(() => jadwalSet(adegan), [adegan]);
  return (
    <AbsoluteFill style={{fontFamily: FONT, backgroundColor: NAVY}}>
      {jadwal.map((item) => (
        <Sequence key={item.kode} from={item.mulai} durationInFrames={item.akhir - item.mulai}>
          <AdeganSet shot={item.shot} id={`${adegan.id}-${item.kode}`} durasi={item.akhir - item.mulai} baris={item.baris} tokohUtama={tokoh} />
          {item.shot.balon && <Balon start={item.shot.balon.mulai} teks={item.shot.balon.teks} ukuran={60} lebar={LEBAR_BALON_SET} />}
        </Sequence>
      ))}
      <Captions adegan={adegan} top={NARASI_SET} />
      {jadwal.map((item) =>
        shotBerangka(item.shot) ? (
          <Sequence key={`sumber-${item.kode}`} from={item.mulai} durationInFrames={item.akhir - item.mulai}>
            <Sumber teks={sumber} top={SUMBER_SET} lineHeight={1} ukuran={ukuranSumber(sumber)} />
          </Sequence>
        ) : null,
      )}
    </AbsoluteFill>
  );
};

const JENIS: Record<string, (props: Isi) => ReactNode> = {
  pembuka: Pembuka,
  penjelasan: Penjelasan,
  perbandingan: Perbandingan,
  grafik: Grafik,
  rantai: Rantai,
  linimasa: Linimasa,
  peta: Peta,
  penutup: Penutup,
};

// Cara masuk sebuah adegan. Adegan lama tanpa set selalu memakai sapuan pita.
const masukAdegan = (adegan: Adegan): MasukShot => (pakaiSet(adegan) ? (adegan.baris.find((line) => line.shot?.length)?.shot?.[0].masuk ?? 'sapu') : 'sapu');
// Bahan cairan untuk adegan yang masuk lewat `cair`.
const cairAdegan = (adegan: Adegan): NamaCair => (pakaiSet(adegan) ? (adegan.baris.find((line) => line.shot?.length)?.shot?.[0].cair ?? 'kopi') : 'kopi');

const LAMA_TUTUP = 12;
const LAMA_BUKA = 14;

// Kartu pemisah bab: warna polos dengan garis miring yang menyapu dari kanan, menutup, lalu keluar ke kiri.
const Kartu = ({durasi, awal, akhir}: {durasi: number; awal: boolean; akhir: boolean}) => {
  const frame = useCurrentFrame();
  const tutup = akhir ? halus(frame, durasi - LAMA_TUTUP - 2, durasi - 2) : 0;
  const buka = awal ? halus(frame, 2, 2 + LAMA_BUKA) : 1;
  // Posisi 0 di luar kanan, 1 menutup layar, 2 di luar kiri.
  const posisi = awal && buka < 1 ? 1 + buka : tutup;
  if (posisi <= 0 || posisi >= 2) return null;
  const x = posisi <= 1 ? (1 - posisi) * 1900 : -(posisi - 1) * 1900;
  // Panel dan garis digambar sebagai vektor SVG, jadi tepinya halus saat bergeser. Gradien CSS berulang membuat tepi bertangga.
  const kiri = -420 + x;
  const geser = ((frame * 6) % JARAK_GARIS_KARTU) - JARAK_GARIS_KARTU;
  const jumlah = Math.ceil((1920 + 2120 * MIRING_GARIS_KARTU) / JARAK_GARIS_KARTU) + 3;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id="kartu-panel">
            <rect x={kiri} y={-100} width={1920} height={2120} />
          </clipPath>
        </defs>
        {/* Miring 14 derajat terhadap tengah layar, sama dengan panel CSS lama. */}
        <g transform={`translate(0 960) skewX(-14) translate(0 -960)`}>
          <rect x={kiri - 40} y={-100} width={1960} height={2120} fill={KARTU.tepi} />
          <rect x={kiri} y={-100} width={1920} height={2120} fill={KARTU.latar} />
          <g clipPath="url(#kartu-panel)">
            {Array.from({length: jumlah}, (_, i) => {
              const bawah = kiri - 2120 * MIRING_GARIS_KARTU + geser + i * JARAK_GARIS_KARTU;
              return <path key={i} d={`M${bawah} 2020 L${bawah + 2120 * MIRING_GARIS_KARTU} -100`} stroke={KARTU.garis} strokeWidth={LEBAR_GARIS_KARTU} />;
            })}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// Garis kartu: tebal 14, jarak tegak lurus 84 seperti pola lama, condong ke kanan atas.
const LEBAR_GARIS_KARTU = 14;
const MIRING_GARIS_KARTU = 0.625;
const JARAK_GARIS_KARTU = 84 / Math.cos(Math.atan(MIRING_GARIS_KARTU));

// Lewat cairan: kopi naik dari bawah menutup layar, lalu surut ke bawah. Layar tertutup penuh hanya 4 frame
// (2 frame terakhir adegan lama, 2 frame pertama adegan baru). Cairan selalu punya riak, kilau, buih, dan gelembung.
const LAMA_CAIR_NAIK = 12;
const LAMA_CAIR_SURUT = 20;
// Permukaan di atas -AMPLITUDO_CAIR berarti layar tertutup penuh.
const AMPLITUDO_CAIR = 26;

const permukaanCair = (frame: number, durasi: number, awal: boolean, akhir: boolean) => {
  if (akhir && frame >= durasi - LAMA_CAIR_NAIK) {
    // Naik makin cepat, menutup penuh di 2 frame terakhir.
    const t = interpolate(frame, [durasi - LAMA_CAIR_NAIK, durasi - 2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
    return 1980 - t * (1980 + AMPLITUDO_CAIR + 50);
  }
  if (awal && frame < LAMA_CAIR_SURUT) {
    // Tertutup penuh di frame 0-1, lalu langsung surut dan melambat di bawah.
    const t = interpolate(frame, [1.5, LAMA_CAIR_SURUT], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
    return -AMPLITUDO_CAIR - 50 + t * (2060 + AMPLITUDO_CAIR + 50);
  }
  return null;
};

// `bahanAwal` warna cairan yang surut di awal adegan, `bahanAkhir` warna cairan yang naik di akhir adegan.
const Cair = ({durasi, awal, akhir, bahanAwal = 'kopi', bahanAkhir = 'kopi'}: {durasi: number; awal: boolean; akhir: boolean; bahanAwal?: NamaCair; bahanAkhir?: NamaCair}) => {
  const frame = useCurrentFrame();
  const permukaan = permukaanCair(frame, durasi, awal, akhir);
  if (permukaan === null) return null;
  const warna = CAIR_BAHAN[frame < durasi / 2 ? bahanAwal : bahanAkhir];
  const gelombang = (geser: number, tinggi: number, fase: number) =>
    Array.from({length: 73}, (_, i) => {
      const x = i * 15;
      const u = i / 3;
      const y = permukaan + geser + Math.sin(u * 0.55 + frame * 0.45 + fase) * tinggi + Math.sin(u * 1.3 - frame * 0.3) * tinggi * 0.25;
      return `${i === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`;
    }).join(' ');
  // Gelembung naik pelan di dalam cairan. Posisi dari `random` Remotion yang deterministik.
  const gelembung = Array.from({length: 18}, (_, i) => {
    const x = random(`cair-x-${i}`) * 1080;
    const y = ((random(`cair-y-${i}`) * 2200 - frame * (6 + random(`cair-v-${i}`) * 8)) % 2200 + 2200) % 2200 - 100;
    return {x: x + Math.sin(frame * 0.2 + i) * 8, y, r: 6 + random(`cair-r-${i}`) * 16};
  }).filter((g) => g.y > permukaan + 40);
  // Pita kilau miring yang bergeser, supaya cairan yang menutup layar tetap terasa bergerak.
  const kilau = [0, 1, 2, 3, 4].map((i) => ({x: ((frame * 26 + i * 380) % 1500) - 240, y: permukaan + 150 + i * 330}));
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <path d={`${gelombang(-34, 20, 1.7)} L1080 2100 L0 2100 Z`} fill={warna.terang} opacity={0.75} />
        <path d={`${gelombang(0, AMPLITUDO_CAIR, 0)} L1080 2100 L0 2100 Z`} fill={warna.isi} />
        <path d={gelombang(4, AMPLITUDO_CAIR, 0)} fill="none" stroke={warna.buih} strokeWidth={10} strokeLinecap="round" opacity={0.8} />
        {kilau.map((k, i) => (
          <ellipse key={i} cx={k.x} cy={k.y} rx={150 + (i % 2) * 70} ry={9 + (i % 3) * 3} fill={warna.kilau} transform={`rotate(-8 ${k.x} ${k.y})`} />
        ))}
        {gelembung.map((g, i) => (
          <circle key={i} cx={g.x} cy={g.y} r={g.r} fill="none" stroke={warna.gelembung} strokeWidth={4} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// Transisi: pita miring menutup adegan, lalu membuka adegan berikutnya.
// `palet` bawaan PITA untuk adegan lama. Sapuan menuju atau dari adegan set memakai PITA_TENANG.
const Sapuan = ({durasi, awal, akhir, paletAwal = PITA, paletAkhir = PITA}: {durasi: number; awal: boolean; akhir: boolean; paletAwal?: string[]; paletAkhir?: string[]}) => {
  const frame = useCurrentFrame();
  // Satu sapuan hanya memakai satu palet: palet awal saat membuka, palet akhir saat menutup.
  const palet = awal && frame < durasi / 2 ? paletAwal : paletAkhir;
  const warna = Array.from({length: 9}, (_, i) => palet[i % palet.length]);
  const gaya = (y: number): CSSProperties => ({transform: `translateY(${y}px) skewX(-24deg)`});
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {warna.map((fill, i) => {
        const buka = awal ? halus(frame, i, 10 + i) : 1;
        const tutup = akhir ? halus(frame, durasi - 16 + i * 0.8, durasi - 7 + i * 0.8) : 0;
        const y = buka < 1 ? buka * 3000 : -3000 + tutup * 3000;
        return <div key={i} style={{position: 'absolute', left: -780 + i * 325, top: -340, width: 340, height: 2600, backgroundColor: fill, ...gaya(y)}} />;
      })}
    </AbsoluteFill>
  );
};

export const Episode = ({tokoh, sumber, adegan}: EpisodeProps) => {
  const rencana = useMemo(() => rencanaEpisode(adegan), [adegan]);
  return (
    <AbsoluteFill style={{backgroundColor: FADE}}>
      {adegan.map((item, nomor) => {
        const Tampilan = pakaiSet(item) ? AdeganBerset : JENIS[item.jenis];
        // Adegan lama selalu bersapuan pita. Adegan bertset memilih cara masuknya lewat `masuk` di shot pertama.
        const masuk = nomor > 0 ? masukAdegan(item) : undefined;
        const keluar = nomor < adegan.length - 1 ? masukAdegan(adegan[nomor + 1]) : undefined;
        return (
          <Sequence key={item.id} from={item.start} durationInFrames={item.durasi}>
            <Tampilan adegan={item} tokoh={tokoh} sumber={sumber} shots={rencana[nomor]} />
            <Sapuan
              durasi={item.durasi}
              awal={masuk === 'sapu'}
              akhir={keluar === 'sapu'}
              paletAwal={pakaiSet(item) ? PITA_TENANG : PITA}
              paletAkhir={nomor < adegan.length - 1 && pakaiSet(adegan[nomor + 1]) ? PITA_TENANG : PITA}
            />
            {(masuk === 'kartu' || keluar === 'kartu') && <Kartu durasi={item.durasi} awal={masuk === 'kartu'} akhir={keluar === 'kartu'} />}
            {(masuk === 'cair' || keluar === 'cair') && <Cair durasi={item.durasi} awal={masuk === 'cair'} akhir={keluar === 'cair'} bahanAwal={cairAdegan(item)} bahanAkhir={nomor < adegan.length - 1 ? cairAdegan(adegan[nomor + 1]) : 'kopi'} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
