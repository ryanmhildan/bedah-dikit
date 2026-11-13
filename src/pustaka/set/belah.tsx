import {random, useCurrentFrame} from 'remotion';
import {BELAH} from '../../tema';
import type {HasilSet, Slot} from './tipe';

// Layar belah untuk perbandingan: dua dunia berdampingan dengan garis miring di tengah.
// Kiri merah gelap (bahaya, alarm, rasa sakit), kanan toska terang (aman, tenang). Isi tiap sisi diisi lewat properti, aksi, dan tokoh.

// Garis belah miring: x di atas dan di bawah layar.
const GARIS = {atas: 620, bawah: 460};
const xGaris = (y: number) => GARIS.atas + ((GARIS.bawah - GARIS.atas) * (y + 600)) / 3200;

const Bokeh = ({x0, x1, warna, seed}: {x0: number; x1: number; warna: string; seed: string}) => {
  const frame = useCurrentFrame();
  return (
    <g fill={warna}>
      {Array.from({length: 7}, (_, i) => (
        <circle key={i} cx={x0 + random(`${seed}-x-${i}`) * (x1 - x0)} cy={300 + random(`${seed}-y-${i}`) * 1200 - frame * (0.2 + random(`${seed}-v-${i}`) * 0.3)} r={20 + random(`${seed}-r-${i}`) * 50} opacity={0.12} />
      ))}
    </g>
  );
};

const Latar = () => {
  const kiri = `M-800 -600 L${GARIS.atas} -600 L${GARIS.bawah} 2600 L-800 2600 Z`;
  const kanan = `M${GARIS.atas} -600 L1900 -600 L1900 2600 L${GARIS.bawah} 2600 Z`;
  return (
    <g>
      <defs>
        <radialGradient id="belah-kiri" cx={250} cy={900} r={1100} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={BELAH.kiri[0]} />
          <stop offset="100%" stopColor={BELAH.kiri[1]} />
        </radialGradient>
        <radialGradient id="belah-kanan" cx={820} cy={900} r={1100} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={BELAH.kanan[0]} />
          <stop offset="100%" stopColor={BELAH.kanan[1]} />
        </radialGradient>
      </defs>
      <path d={kiri} fill="url(#belah-kiri)" />
      <path d={kanan} fill="url(#belah-kanan)" />
      <Bokeh x0={-100} x1={480} warna={BELAH.kiri[0]} seed="belah-kiri" />
      <Bokeh x0={640} x1={1180} warna={BELAH.garis} seed="belah-kanan" />
      <path d={`M${xGaris(-600)} -600 L${xGaris(2600)} 2600`} stroke={BELAH.garis} strokeWidth={14} />
    </g>
  );
};

const SLOT_BELAH: Record<string, Slot> = {
  kiri: {x: 270, y: 1180},
  kanan: {x: 810, y: 1180},
  'kiri.atas': {x: 270, y: 520},
  'kanan.atas': {x: 810, y: 520},
};

export const setBelah = (): HasilSet => ({
  tengahBelakang: <Latar />,
  slot: SLOT_BELAH,
  sorot: {x: 540, y: 900, lebar: 620, jenis: 'titik'},
  pakaiLatar: false,
});
