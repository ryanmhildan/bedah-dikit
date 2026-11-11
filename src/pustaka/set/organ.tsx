import {random, useCurrentFrame} from 'remotion';
import {ORGAN, PABRIK} from '../../tema';
import type {HasilSet, Slot} from './tipe';

// Panggung organ: ruang tubuh bervinyet dengan satu organ di tengah. Organ bisa diganti lewat `ORGAN_GAMBAR`.
// Organ digambar di sekitar titik asal, kira-kira selebar 440 px pada skala 1.

export type KeadaanOrgan = {
  // Denyut per menit. 0 berarti diam.
  denyut?: number;
  // Jarak antar-ketukan acak (deterministik): kadang rapat, kadang terlambat. `denyut` menjadi rata-ratanya.
  tidakTeratur?: boolean;
};

const FPS = 30;

// Ketukan yang sedang berjalan: frame awalnya dan panjangnya sampai ketukan berikutnya.
export const ketukanDi = (frame: number, bpm: number, tidakTeratur = false) => {
  const periode = (FPS * 60) / bpm;
  if (!tidakTeratur) {
    const awal = Math.floor(frame / periode) * periode;
    return {awal, panjang: periode};
  }
  // Ketukan pertama tepat di frame 0, supaya ketidakteraturan langsung terlihat di awal shot.
  if (frame < 0) return {awal: frame - periode, panjang: periode};
  let awal = 0;
  for (let i = 0; ; i++) {
    // Pola jarak: rapat, terlambat, dan sedang bergantian, ditambah variasi kecil yang deterministik.
    const panjang = periode * POLA_TAK_TERATUR[i % POLA_TAK_TERATUR.length] * (0.9 + random(`detak-tak-teratur-${i}`) * 0.2);
    if (awal + panjang > frame) return {awal, panjang};
    awal += panjang;
  }
};

const POLA_TAK_TERATUR = [1, 0.45, 1.6, 0.8, 0.5, 1.35, 1.1, 0.42, 1.75, 0.9];

// Detak dua ketukan: kontraksi cepat, ketukan kedua lebih kecil, lalu istirahat.
// Bentuk ketukan selalu sepanjang satu periode rata-rata, jadi detak tidak beraturan tetap terlihat seperti detak.
export const detak = (frame: number, bpm: number, tidakTeratur = false) => {
  if (bpm <= 0) return 0;
  const periode = (FPS * 60) / bpm;
  const {awal} = ketukanDi(frame, bpm, tidakTeratur);
  const t = (frame - awal) / periode;
  const ketuk = (pusat: number, lebar: number, kuat: number) => kuat * Math.max(0, 1 - Math.abs(t - pusat) / lebar);
  return ketuk(0.08, 0.08, 1) + ketuk(0.28, 0.08, 0.55);
};

const Jantung = ({keadaan, frame}: {keadaan: KeadaanOrgan; frame: number}) => {
  const w = ORGAN.jantung;
  const d = detak(frame, keadaan.denyut ?? 72, keadaan.tidakTeratur);
  const s = 1 - d * 0.06;
  return (
    <g transform={`scale(${s} ${1 - d * 0.04})`}>
      {/* Pembuluh besar di atas. */}
      <path d="M-30 -170 C-30 -260 70 -280 110 -220" fill="none" stroke={w.arteri} strokeWidth={56} strokeLinecap="round" />
      <path d="M-90 -150 V-250" stroke={w.vena} strokeWidth={46} strokeLinecap="round" />
      <path d="M60 -150 C70 -200 120 -200 150 -180" fill="none" stroke={w.vena} strokeWidth={34} strokeLinecap="round" />
      {/* Badan jantung: miring, ujung ke kiri bawah. */}
      <path d="M-150 -110 C-200 -20 -150 120 -30 220 C10 250 40 240 70 200 C170 80 210 -40 150 -130 C100 -200 -100 -200 -150 -110 Z" fill={w.daging} />
      <path d="M70 200 C170 80 210 -40 150 -130 C130 -160 100 -175 70 -180 C140 -80 130 60 70 200 Z" fill={w.bayang} opacity={0.6} />
      <path d="M-40 -150 C-10 -40 -20 80 -60 190" fill="none" stroke={w.lemak} strokeWidth={14} strokeLinecap="round" opacity={0.75} />
      <path d="M-120 -90 C-140 -40 -130 10 -110 40" fill="none" stroke={w.kilau} strokeWidth={22} strokeLinecap="round" />
    </g>
  );
};

const Hati = ({keadaan, frame}: {keadaan: KeadaanOrgan; frame: number}) => {
  const w = ORGAN.hati;
  const napas = Math.sin(frame / 30) * 0.015;
  return (
    <g transform={`scale(${1 + napas} ${1 - napas})`}>
      {/* Lobus kanan besar di kiri layar, lobus kiri meruncing ke kanan. */}
      <path d="M-230 -60 C-240 -150 -120 -170 20 -150 C140 -135 250 -110 260 -60 C260 -20 160 20 60 60 C-20 90 -80 150 -150 140 C-230 120 -225 20 -230 -60 Z" fill={w.daging} />
      <path d="M-150 140 C-80 150 -20 90 60 60 C-10 70 -110 90 -190 60 C-210 100 -190 130 -150 140 Z" fill={w.bayang} opacity={0.7} />
      <path d="M-10 -148 C0 -60 -10 20 -30 80" fill="none" stroke={w.bayang} strokeWidth={10} strokeLinecap="round" opacity={0.6} />
      <ellipse cx={-60} cy={90} rx={34} ry={22} fill={w.empedu} transform="rotate(-20 -60 90)" />
      <path d="M-170 -100 C-120 -130 -40 -130 30 -120" fill="none" stroke={w.kilau} strokeWidth={20} strokeLinecap="round" />
      <path d="M10 70 V160" stroke={w.pembuluh} strokeWidth={26} strokeLinecap="round" />
    </g>
  );
};

export const ORGAN_GAMBAR = {jantung: Jantung, hati: Hati};
export type NamaOrgan = keyof typeof ORGAN_GAMBAR;

export const OrganTengah = ({nama, keadaan = {}, x = 540, y = 960, skala = 1}: {nama: NamaOrgan; keadaan?: KeadaanOrgan; x?: number; y?: number; skala?: number}) => {
  const frame = useCurrentFrame();
  const Gambar = ORGAN_GAMBAR[nama];
  return (
    <g transform={`translate(${x} ${y}) scale(${skala})`}>
      <Gambar keadaan={keadaan} frame={frame} />
    </g>
  );
};

// Sel buram yang melayang pelan, di belakang dan di depan organ.
const SEL = Array.from({length: 14}, (_, i) => ({
  x: random(`sel-x-${i}`) * 1500 - 210,
  y: random(`sel-y-${i}`) * 2300 - 190,
  r: 40 + random(`sel-r-${i}`) * 110,
}));

const Sel = ({geser}: {geser: number}) => {
  const frame = useCurrentFrame();
  return (
    <g fill="none" stroke={ORGAN.sel} strokeWidth={18}>
      {SEL.map((s, i) => (
        <circle key={i} cx={s.x + Math.sin(frame / 50 + i) * 20 + geser} cy={s.y + Math.cos(frame / 60 + i) * 16} r={s.r} />
      ))}
    </g>
  );
};

const SLOT_ORGAN: Record<string, Slot> = {
  organ: {x: 540, y: 900, skala: 1.4},
  kiri: {x: 250, y: 1150},
  kanan: {x: 830, y: 1150},
  atas: {x: 540, y: 420},
};

// Pemisah layar belah: pita terang mendatar. Tiap paruh tetap punya dunianya sendiri.
const Pemisah = ({y}: {y: number}) => (
  <g>
    <rect x={-800} y={y - 9} width={2700} height={18} fill={PABRIK.pemisah} />
    <rect x={-800} y={y + 9} width={2700} height={26} fill={ORGAN.hati.bayang} opacity={0.25} />
  </g>
);

// Organ sebagai pabrik: organ menjadi dinding besar yang buram di belakang, dan aksi (misalnya `pecah`) bekerja di depannya.
// `belah` memberi pemisah mendatar di garis y itu.
export const setOrganPabrik = (nama: NamaOrgan, {belah}: {belah?: number} = {}): HasilSet => ({
  belakang: (
    <g>
      <Sel geser={0} />
      <g opacity={0.55}>
        <OrganTengah nama={nama} x={540} y={belah ?? 960} skala={3.2} />
      </g>
    </g>
  ),
  tengah: belah === undefined ? undefined : <Pemisah y={belah} />,
  depan: <Sel geser={300} />,
  slot: {...SLOT_ORGAN, atas: {x: 540, y: 640}, bawah: {x: 540, y: 1200}},
  sorot: {x: 540, y: belah ?? 900, lebar: 620, jenis: 'titik'},
  pakaiLatar: true,
});

export const setOrgan = (nama: NamaOrgan, keadaan: KeadaanOrgan = {}): HasilSet => ({
  belakang: <Sel geser={0} />,
  tengah: <OrganTengah nama={nama} keadaan={keadaan} {...SLOT_ORGAN.organ} />,
  depan: <Sel geser={300} />,
  slot: SLOT_ORGAN,
  sorot: {x: 540, y: 900, lebar: 560, jenis: 'titik'},
  pakaiLatar: true,
});
