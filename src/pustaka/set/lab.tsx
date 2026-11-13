import {useCurrentFrame} from 'remotion';
import {BAYANG_KONTAK, LAB} from '../../tema';
import {Properti} from '../properti';
import type {HasilSet, Slot} from './tipe';

// Laboratorium tidur: tiga bilik bertirai berdampingan, masing-masing dengan kasur dan monitor gelombang tidur.
// Dipakai untuk eksperimen dengan beberapa kelompok. Label kelompok, batang ukur, dan papan penghitung ditaruh lewat slot.

const LANTAI = 1300;
const KIRI = -700;
const LEBAR = 2500;
// Pusat bilik. Bilik tambahan di luar layar kiri dan kanan supaya kamera yang menyapu tetap melihat ruangan.
export const BILIK_X = [230, 540, 850];
const LEBAR_BILIK = 290;
const ATAS_BILIK = 600;

// Monitor kecil di dinding bilik dengan gelombang tidur yang bergulir.
const Monitor = ({x, y, fase}: {x: number; y: number; fase: number}) => {
  const frame = useCurrentFrame();
  const titik = Array.from({length: 24}, (_, i) => {
    const xx = x - 62 + i * 5.4;
    const yy = y + Math.sin((i + frame * 0.6 + fase) / 2.2) * 10 * (0.5 + 0.5 * Math.sin((i + fase) / 5));
    return `${i === 0 ? 'M' : 'L'}${xx.toFixed(1)} ${yy.toFixed(1)}`;
  }).join(' ');
  return (
    <g>
      <rect x={x - 76} y={y - 38} width={152} height={76} rx={12} fill={LAB.monitor} />
      <rect x={x - 66} y={y - 28} width={132} height={56} rx={6} fill={LAB.monitorLayar} />
      <path d={titik} stroke={LAB.gelombang} strokeWidth={4} fill="none" strokeLinecap="round" />
    </g>
  );
};

const Bilik = ({x, fase}: {x: number; fase: number}) => (
  <g>
    <rect x={x - LEBAR_BILIK / 2} y={ATAS_BILIK} width={LEBAR_BILIK} height={LANTAI - ATAS_BILIK} rx={18} fill={LAB.panel} />
    {Array.from({length: 4}, (_, i) => (
      <rect key={i} x={x - LEBAR_BILIK / 2 + 20} y={ATAS_BILIK + 140 + i * 130} width={LEBAR_BILIK - 40} height={4} rx={2} fill={LAB.panelGaris} />
    ))}
    <Monitor x={x} y={ATAS_BILIK + 62} fase={fase} />
  </g>
);

// Tirai pemisah antar-bilik: kain berlipat tergantung di rel.
const Tirai = ({x}: {x: number}) => (
  <g>
    <path d={`M${x - 26} ${ATAS_BILIK - 30} Q${x - 34} ${(ATAS_BILIK + LANTAI) / 2} ${x - 22} ${LANTAI - 20} H${x + 22} Q${x + 34} ${(ATAS_BILIK + LANTAI) / 2} ${x + 26} ${ATAS_BILIK - 30} Z`} fill={LAB.tirai} />
    {[-12, 6].map((d) => (
      <path key={d} d={`M${x + d} ${ATAS_BILIK - 20} V${LANTAI - 30}`} stroke={LAB.tiraiGelap} strokeWidth={6} opacity={0.6} />
    ))}
  </g>
);

const Ruangan = () => (
  <g>
    <rect x={KIRI} y={-900} width={LEBAR} height={3600} fill={LAB.dinding} />
    <rect x={KIRI} y={1120} width={LEBAR} height={LANTAI - 1120} fill={LAB.dindingBawah} />
  </g>
);

const Lantai = () => (
  <g>
    <rect x={KIRI} y={LANTAI} width={LEBAR} height={1200} fill={LAB.lantai} />
    {Array.from({length: 18}, (_, i) => (
      <path key={i} d={`M${KIRI + i * 150} ${LANTAI} l-60 1200`} stroke={LAB.lantaiGaris} strokeWidth={4} />
    ))}
    <rect x={KIRI} y={LANTAI - 20} width={LEBAR} height={24} fill={LAB.list} />
    <rect x={KIRI} y={LANTAI + 4} width={LEBAR} height={14} fill={BAYANG_KONTAK} opacity={0.35} />
  </g>
);

// Slot: `bilik.i` lantai di depan bilik (alas kasur), `batang.i` dasar batang ukur di dinding bilik,
// `label.i` di atas bilik, `penghitung` papan di tengah atas.
const SLOT_LAB: Record<string, Slot> = {
  ...Object.fromEntries(BILIK_X.map((x, i) => [`bilik.${i}`, {x, y: LANTAI - 6}])),
  ...Object.fromEntries(BILIK_X.map((x, i) => [`batang.${i}`, {x, y: 1085}])),
  ...Object.fromEntries(BILIK_X.map((x, i) => [`label.${i}`, {x, y: ATAS_BILIK - 25}])),
  penghitung: {x: 540, y: ATAS_BILIK - 128},
};

export const setLab = (): HasilSet => ({
  belakang: <Ruangan />,
  tengahBelakang: (
    <g>
      <Lantai />
      <rect x={KIRI} y={ATAS_BILIK - 44} width={LEBAR} height={12} rx={6} fill={LAB.rel} />
      {/* Bilik tambahan di luar layar kiri dan kanan, supaya ruangan terasa panjang saat kamera menyapu. */}
      {[-80, ...BILIK_X, 1160].map((x, i) => (
        <Bilik key={x} x={x} fase={i * 5} />
      ))}
      {[75, 385, 695, 1005].map((x) => (
        <Tirai key={x} x={x} />
      ))}
      {BILIK_X.map((x) => (
        <Properti key={x} nama="ranjang" varian="klinik" x={x} y={LANTAI - 6} skala={0.5} />
      ))}
    </g>
  ),
  slot: SLOT_LAB,
  sorot: {x: 540, y: 900, lebar: 620, jenis: 'atas'},
  pakaiLatar: false,
  lantai: LANTAI,
});
