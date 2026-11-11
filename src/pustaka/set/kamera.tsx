import type {ReactNode} from 'react';
import {Easing, interpolate} from 'remotion';

// Kamera set. `x` dan `y` adalah titik dunia yang tepat berada di tengah layar, `zoom` 1 berarti 1 satuan dunia = 1 px.
// Dunia memakai satuan yang sama dengan layar 1080x1920, jadi set yang dilihat dengan kamera {540, 960, 1} tampil apa adanya.
export type Kamera = {x: number; y: number; zoom: number};

export const KAMERA_DASAR: Kamera = {x: 540, y: 960, zoom: 1};

export const LEBAR_LAYAR = 1080;
export const TINGGI_LAYAR = 1920;
const TENGAH_X = LEBAR_LAYAR / 2;
const TENGAH_Y = TINGGI_LAYAR / 2;

// Kedalaman lapisan. Lapisan belakang bergeser lebih sedikit, lapisan depan lebih banyak dan buram.
export const KEDALAMAN = {belakang: 0.55, tengah: 1, depan: 1.45} as const;
export type NamaLapis = keyof typeof KEDALAMAN;

// Skala dan pergeseran lapisan dengan kedalaman `p`. Pada p = 1 hasilnya sama persis dengan kamera.
const skalaLapis = (k: Kamera, p: number) => 1 + (k.zoom - 1) * p;

// Kotak dunia yang terlihat oleh lapisan berkedalaman `p`, dipakai langsung sebagai viewBox.
export const kotakLapis = (k: Kamera, p: number) => {
  const s = skalaLapis(k, p);
  const lebar = LEBAR_LAYAR / s;
  const tinggi = TINGGI_LAYAR / s;
  return {
    x: TENGAH_X + (k.x - TENGAH_X) * p - lebar / 2,
    y: TENGAH_Y + (k.y - TENGAH_Y) * p - tinggi / 2,
    lebar,
    tinggi,
  };
};

// Titik dunia ke titik layar, misalnya untuk menaruh cahaya atau memeriksa area aman.
export const keLayar = (k: Kamera, titik: {x: number; y: number}, p = 1) => {
  const kotak = kotakLapis(k, p);
  const s = skalaLapis(k, p);
  return {x: (titik.x - kotak.x) * s, y: (titik.y - kotak.y) * s};
};

// Satu lapisan set: SVG selayar yang viewBox-nya mengikuti kamera. Isi digambar dalam koordinat dunia.
export const Lapis = ({kamera, p, blur = 0, children}: {kamera: Kamera; p: number; blur?: number; children: ReactNode}) => {
  const kotak = kotakLapis(kamera, p);
  return (
    <svg
      width={LEBAR_LAYAR}
      height={TINGGI_LAYAR}
      viewBox={`${kotak.x} ${kotak.y} ${kotak.lebar} ${kotak.tinggi}`}
      style={{position: 'absolute', inset: 0, overflow: 'hidden', filter: blur > 0 ? `blur(${blur}px)` : undefined}}
    >
      {children}
    </svg>
  );
};

// Kurva kamera. `dorong` cepat di awal dengan ekor panjang, `sorot` mulus di dua ujung, `diam` tidak bergerak.
export type KurvaKamera = 'dorong' | 'sorot' | 'diam';
const KURVA: Record<KurvaKamera, (t: number) => number> = {
  dorong: (t) => 1 - Math.pow(1 - t, 4),
  sorot: Easing.inOut(Easing.cubic),
  diam: () => 0,
};

export type GerakKamera = {dari: Kamera; ke?: Kamera; mulai?: number; lama?: number; kurva?: KurvaKamera};

export const kameraDi = (gerak: GerakKamera, frame: number): Kamera => {
  const {dari, ke, mulai = 0, lama = 1, kurva = 'sorot'} = gerak;
  if (!ke || kurva === 'diam') return dari;
  const t = KURVA[kurva](interpolate(frame, [mulai, mulai + lama], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  return {x: dari.x + (ke.x - dari.x) * t, y: dari.y + (ke.y - dari.y) * t, zoom: dari.zoom + (ke.zoom - dari.zoom) * t};
};
