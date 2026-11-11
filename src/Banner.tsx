import type {ReactNode} from 'react';
import {AbsoluteFill} from 'remotion';
import {HurufIris, KORAL, KREM, RAMAH} from './Logo';
import {Apel, Bohlam, Buku, Bumi, Jam, Planet, Roda, Tabung} from './pustaka/ikon';
import {Tokoh} from './Tokoh';

export const BANNER_W = 2560;
export const BANNER_H = 1440;
// Area yang terlihat di semua perangkat, menurut panduan ukuran banner YouTube.
export const AMAN = {x: 507, y: 508, w: 1546, h: 423};

// Benda digambar pada bidang -100..100, lalu dibelah dua secara miring.
const Belah = ({id, x, y, skala, putar, children}: {id: string; x: number; y: number; skala: number; putar: number; children: ReactNode}) => (
  <g transform={`translate(${x} ${y}) rotate(${putar}) scale(${skala})`}>
    <clipPath id={`${id}a`}>
      <polygon points="-140,-140 140,-140 140,-24 -140,10" />
    </clipPath>
    <clipPath id={`${id}b`}>
      <polygon points="-140,18 140,-16 140,140 -140,140" />
    </clipPath>
    <g transform="translate(-7 -5)">
      <g clipPath={`url(#${id}a)`}>{children}</g>
    </g>
    <g transform="translate(7 5)">
      <g clipPath={`url(#${id}b)`}>{children}</g>
    </g>
  </g>
);

const BENDA: [typeof Bumi, number, number, number, number][] = [
  [Bumi, 180, 250, 1.5, -14],
  [Roda, 560, 170, 1.15, 12],
  [Buku, 930, 300, 1.2, -10],
  [Bohlam, 1290, 200, 1.25, 8],
  [Jam, 1660, 300, 1.05, -8],
  [Planet, 2010, 180, 1.2, 16],
  [Apel, 2380, 270, 1.3, 10],
  [Tabung, 120, 700, 0.85, -8],
  [Roda, 2440, 700, 0.85, 14],
  [Jam, 170, 1160, 1.25, 10],
  [Tabung, 830, 1310, 0.8, -12],
  [Planet, 1010, 1130, 1.15, -14],
  [Bumi, 1400, 1270, 1.05, 12],
  [Bohlam, 2210, 1300, 0.95, -10],
  [Apel, 2400, 1120, 1.1, -8],
];

const Latar = () => (
  <svg width={BANNER_W} height={BANNER_H} style={{position: 'absolute', inset: 0}}>
    <defs>
      <pattern id="petak" width={80} height={80} patternUnits="userSpaceOnUse">
        <path d="M80 0 H0 V80" fill="none" stroke="#E8C9A0" strokeWidth={3} />
      </pattern>
      <pattern id="petakBesar" width={400} height={400} patternUnits="userSpaceOnUse">
        <path d="M400 0 H0 V400" fill="none" stroke="#DDB488" strokeWidth={6} />
      </pattern>
    </defs>
    <rect width={BANNER_W} height={BANNER_H} fill="#FCE9CF" />
    <rect width={BANNER_W} height={BANNER_H} fill="url(#petak)" />
    <rect width={BANNER_W} height={BANNER_H} fill="url(#petakBesar)" />
    {BENDA.map(([Benda, x, y, skala, putar], indeks) => (
      <Belah key={indeks} id={`benda${indeks}`} x={x} y={y} skala={skala} putar={putar}>
        <Benda />
      </Belah>
    ))}
  </svg>
);

const PapanNama = () => (
  <div
    style={{
      position: 'absolute',
      left: 880,
      top: 548,
      width: 800,
      height: 343,
      borderRadius: 46,
      backgroundColor: KORAL,
      boxShadow: '0 16px 0 #D9604F',
      textAlign: 'center',
      color: KREM,
      fontFamily: RAMAH,
    }}
  >
    <svg width={730} height={200} viewBox="0 0 1600 440" style={{marginTop: 34}}>
      <g fontFamily={RAMAH} fontWeight={700} fill={KREM} fontSize={250}>
        <HurufIris id="banner" lebar={1600} tinggi={440} kiri={262} kanan={-48} skala={1.2}>
          <text x={224} y={318} textAnchor="end">B</text>
        </HurufIris>
        <text x={240} y={318}>EDAH DIKIT</text>
      </g>
    </svg>
    <div style={{fontSize: 52, fontWeight: 700}}>Semua hal, kita bedah</div>
  </div>
);

const Isi = () => (
  <>
    <Latar />
    <div style={{position: 'absolute', left: 150, top: 410}}>
      <Tokoh size={1000} variant="raka" look={0.55} id="bannerRaka" />
    </div>
    <div style={{position: 'absolute', left: 1410, top: 410}}>
      <Tokoh size={1000} variant="nadia" look={-0.55} id="bannerNadia" />
    </div>
    <PapanNama />
  </>
);

export const Banner = () => (
  <AbsoluteFill>
    <Isi />
  </AbsoluteFill>
);

// Pratinjau potongan paling sempit yang terlihat di ponsel.
export const BannerAman = () => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: -AMAN.x, top: -AMAN.y, width: BANNER_W, height: BANNER_H}}>
      <Isi />
    </div>
  </AbsoluteFill>
);
