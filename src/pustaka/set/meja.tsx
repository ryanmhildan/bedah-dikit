import {random} from 'remotion';
import {BAHAN, BAYANG_KONTAK, DAUN, PROPERTI as W, type NamaBahan} from '../../tema';
import type {HasilSet, Slot} from './tipe';

// Meja dalam dua tampak. Tampak samping untuk shot sedang, tampak atas untuk sisipan 9:16 yang memenuhi layar.

// ---------------- Tampak samping ----------------
export type GayaKaki = 'kaki' | 'lemari' | 'panel' | 'tiang';

export type UkuranMeja = {kiri: number; kanan: number; atas: number; lantai: number; tebal?: number; kedalaman?: number};

// Titik di permukaan atas meja. `u` 0 di tepi kiri, 1 di tepi kanan. `v` 0 tepi belakang, 1 tepi depan.
export const titikMeja = (m: UkuranMeja, u: number, v = 0.55): Slot => ({
  x: m.kiri + (m.kanan - m.kiri) * u,
  y: m.atas + (m.kedalaman ?? 46) * v,
});

export const MejaSamping = ({ukuran, bahan = 'kayu', gaya = 'kaki'}: {ukuran: UkuranMeja; bahan?: NamaBahan; gaya?: GayaKaki}) => {
  const b = BAHAN[bahan];
  const {kiri, kanan, atas, lantai, tebal = 28, kedalaman = 46} = ukuran;
  const lebar = kanan - kiri;
  const depan = atas + kedalaman;
  const bawah = depan + tebal;
  const pintu = Math.max(1, Math.round(lebar / 260));
  return (
    <g>
      {/* Bayangan meja di lantai. */}
      <ellipse cx={(kiri + kanan) / 2} cy={lantai + 8} rx={lebar * 0.55} ry={26} fill={BAYANG_KONTAK} />
      {gaya === 'kaki' &&
        [kiri + 26, kanan - 50].map((x) => <rect key={x} x={x} y={bawah - 4} width={24} height={lantai - bawah + 4} fill={b.gelap} />)}
      {gaya === 'tiang' && (
        <g fill={b.gelap}>
          <rect x={(kiri + kanan) / 2 - 16} y={bawah - 4} width={32} height={lantai - bawah} />
          <ellipse cx={(kiri + kanan) / 2} cy={lantai - 4} rx={lebar * 0.3} ry={14} />
        </g>
      )}
      {gaya === 'panel' && <rect x={kiri + 30} y={bawah - 4} width={lebar - 60} height={(lantai - bawah) * 0.45} fill={b.gelap} />}
      {gaya === 'lemari' && (
        <g>
          <rect x={kiri + 8} y={bawah - 4} width={lebar - 16} height={lantai - bawah - 18} fill={b.sisi} />
          <rect x={kiri + 8} y={lantai - 24} width={lebar - 16} height={24} fill={b.gelap} />
          {Array.from({length: pintu}, (_, i) => {
            const x = kiri + 8 + ((lebar - 16) / pintu) * i;
            const w = (lebar - 16) / pintu;
            return (
              <g key={i}>
                <rect x={x + 10} y={bawah + 12} width={w - 20} height={lantai - bawah - 62} rx={6} fill={b.gelap} opacity={0.25} />
                <rect x={x + w / 2 - 34} y={bawah + 34} width={68} height={10} rx={5} fill={W.logam} />
              </g>
            );
          })}
        </g>
      )}
      {/* Permukaan atas dengan serat, lalu sisi depan dan bayangan di bawah bibir meja. */}
      <rect x={kiri} y={atas} width={lebar} height={kedalaman} rx={6} fill={b.atas} />
      {[0.3, 0.62].map((v) => (
        <path key={v} d={`M${kiri + 30} ${atas + kedalaman * v} H${kanan - 30}`} stroke={b.serat} strokeWidth={3} />
      ))}
      <rect x={kiri} y={depan - 4} width={lebar} height={tebal + 4} rx={5} fill={b.sisi} />
      <rect x={kiri} y={depan - 4} width={lebar} height={5} fill={b.atas} opacity={0.6} />
      <rect x={kiri + 8} y={bawah} width={lebar - 16} height={14} fill={b.gelap} opacity={0.35} />
    </g>
  );
};

// ---------------- Tampak atas ----------------
const PAPAN = 6;
const LEBAR_PAPAN = 230;

// Meja tampak atas memenuhi layar: papan kayu, tepi jauh, dan lantai di baliknya.
// `luas` memperbesar meja ke segala arah, untuk kamera yang mundur jauh.
export const MejaAtas = ({bahan = 'kayu', tepi = 300, luas = false}: {bahan?: NamaBahan; tepi?: number; luas?: boolean}) => {
  const b = BAHAN[bahan];
  const kiri = luas ? -3200 : -800;
  const lebar = luas ? 7400 : 2700;
  const tinggi = luas ? 9000 : 3000;
  return (
    <g>
      <rect x={kiri} y={luas ? tepi - 800 : -800} width={lebar} height={luas ? 800 : tepi + 800} fill={b.gelap} />
      <rect x={kiri} y={tepi} width={lebar} height={tinggi} fill={b.atas} />
      {Array.from({length: luas ? Math.ceil(lebar / LEBAR_PAPAN) : PAPAN + 6}, (_, i) => {
        const x = kiri + 200 + i * LEBAR_PAPAN;
        return (
          <g key={i}>
            <rect x={x} y={tepi} width={LEBAR_PAPAN} height={tinggi} fill={i % 2 ? b.serat : 'transparent'} opacity={0.5} />
            <rect x={x - 2} y={tepi} width={4} height={tinggi} fill={b.gelap} opacity={0.35} />
            {Array.from({length: luas ? 9 : 3}, (_, j) => {
              const y = tepi + 120 + random(`serat-${i}-${j}`) * (tinggi - 1300);
              return <path key={j} d={`M${x + 40} ${y} q${LEBAR_PAPAN * 0.3} -18 ${LEBAR_PAPAN * 0.6} 0`} stroke={b.serat} strokeWidth={4} fill="none" strokeLinecap="round" />;
            })}
          </g>
        );
      })}
      {/* Tepi jauh meja yang tebal, dengan bayangan jatuh ke lantai. */}
      <rect x={kiri} y={tepi - 22} width={lebar} height={26} fill={b.sisi} />
      <rect x={kiri} y={tepi} width={lebar} height={40} fill={b.gelap} opacity={0.18} />
    </g>
  );
};

// Perabot tampak atas yang sering ada di meja kerja.
const BukuCatatan = ({x, y, putar}: {x: number; y: number; putar: number}) => (
  <g transform={`translate(${x} ${y}) rotate(${putar})`}>
    <rect x={-122} y={-162} width={250} height={330} rx={10} fill={BAYANG_KONTAK} transform="translate(6 8)" />
    <rect x={-122} y={-162} width={250} height={330} rx={10} fill={W.kertas} />
    {Array.from({length: 9}, (_, i) => (
      <path key={i} d={`M-96 ${-118 + i * 32} H104`} stroke={W.kertasGaris} strokeWidth={4} />
    ))}
    <rect x={-122} y={-162} width={22} height={330} fill={W.kertasGaris} />
  </g>
);

const Pena = ({x, y, putar}: {x: number; y: number; putar: number}) => (
  <g transform={`translate(${x} ${y}) rotate(${putar})`}>
    <rect x={-120} y={-8} width={240} height={16} rx={8} fill={W.pena} />
    <path d="M120 -8 L150 0 L120 8 Z" fill={W.logam} />
  </g>
);

const Ponsel = ({x, y, putar}: {x: number; y: number; putar: number}) => (
  <g transform={`translate(${x} ${y}) rotate(${putar})`}>
    <rect x={-62} y={-122} width={124} height={244} rx={22} fill={BAYANG_KONTAK} transform="translate(5 7)" />
    <rect x={-62} y={-122} width={124} height={244} rx={22} fill={W.ponsel} />
    <rect x={-52} y={-106} width={104} height={212} rx={12} fill={W.layar} />
  </g>
);

// Daun buram di lapisan depan, untuk membingkai sisipan tampak atas.
export const DaunDepan = ({x, y, skala = 1, putar = 0}: {x: number; y: number; skala?: number; putar?: number}) => (
  <g transform={`translate(${x} ${y}) rotate(${putar}) scale(${skala})`}>
    {[-50, -15, 20, 55].map((sudut, i) => (
      <path key={sudut} d="M0 0 Q-60 -170 0 -330 Q60 -170 0 0 Z" fill={DAUN[i % 2]} transform={`rotate(${sudut})`} />
    ))}
  </g>
);

export const SLOT_MEJA_ATAS: Record<string, Slot> = {
  'meja.atas': {x: 560, y: 1000},
  'meja.kiri': {x: 330, y: 1080},
  'meja.kanan': {x: 790, y: 850},
  'meja.bawah': {x: 600, y: 1280},
  'meja.laptop': {x: 520, y: 560},
};

// Set meja tampak atas. `rapi` false menambah buku catatan, pena, dan ponsel.
// `luas` untuk kamera yang mundur jauh: meja diperluas dan daun depan dilepas.
export const setMejaAtas = ({bahan = 'kayu', rapi = false, luas = false}: {bahan?: NamaBahan; rapi?: boolean; luas?: boolean} = {}): HasilSet => ({
  // Permukaan meja dan isinya sekedalaman dengan properti, jadi benda tidak tergelincir saat kamera bergerak.
  tengahBelakang: (
    <g>
      <MejaAtas bahan={bahan} luas={luas} tepi={luas ? -4400 : 300} />
      {!rapi && (
        <g>
          <BukuCatatan x={250} y={1500} putar={-9} />
          <Pena x={310} y={1290} putar={-24} />
          <Ponsel x={900} y={1240} putar={14} />
        </g>
      )}
    </g>
  ),
  depan: luas ? undefined : (
    <g>
      <DaunDepan x={-40} y={1980} skala={1.5} putar={22} />
      <DaunDepan x={1140} y={260} skala={1.2} putar={-150} />
    </g>
  ),
  slot: SLOT_MEJA_ATAS,
  sorot: {x: 420, y: 900, lebar: 640, jenis: 'samping', sisi: -1},
  pakaiLatar: false,
});

// Meja tampak samping di ruang polos: untuk benda penting di bawah satu sorot.
export const UKURAN_MEJA_RUANG: UkuranMeja = {kiri: 240, kanan: 840, atas: 1180, lantai: 1560};

export const setMejaSamping = ({ukuran = UKURAN_MEJA_RUANG, bahan = 'kayu', gaya = 'tiang'}: {ukuran?: UkuranMeja; bahan?: NamaBahan; gaya?: GayaKaki} = {}): HasilSet => ({
  tengahBelakang: <MejaSamping ukuran={ukuran} bahan={bahan} gaya={gaya} />,
  slot: {
    'meja.atas': titikMeja(ukuran, 0.5),
    'meja.kiri': titikMeja(ukuran, 0.25),
    'meja.kanan': titikMeja(ukuran, 0.75),
    'meja.belakang': titikMeja(ukuran, 0.5, 0.25),
  },
  sorot: {x: (ukuran.kiri + ukuran.kanan) / 2, y: ukuran.atas, lebar: (ukuran.kanan - ukuran.kiri) * 0.7, jenis: 'atas'},
  pakaiLatar: true,
  lantai: ukuran.lantai,
});
