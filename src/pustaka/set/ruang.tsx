import type {ReactNode} from 'react';
import {AbsoluteFill, interpolateColors, random, useCurrentFrame} from 'remotion';
import {SUASANA, type NamaSuasana, type Suasana} from '../../tema';
import {KEDALAMAN, Lapis, keLayar, type Kamera} from './kamera';

// Ruang polos bergradasi dengan satu sumber cahaya. Dipakai sendiri sebagai latar benda penting,
// dan bagian `Cahaya` serta `Lensa` dipakai di atas set lain supaya semua set punya cahaya bersumber.

export type SuasanaKini = NamaSuasana | {dari: NamaSuasana; ke: NamaSuasana; t: number};

const campurWarna = (a: string, b: string, t: number) => interpolateColors(t, [0, 1], [a, b]);
const campurAngka = (a: number, b: number, t: number) => a + (b - a) * t;

export const campurSuasana = (a: Suasana, b: Suasana, t: number): Suasana => ({
  latar: [campurWarna(a.latar[0], b.latar[0], t), campurWarna(a.latar[1], b.latar[1], t), campurWarna(a.latar[2], b.latar[2], t)],
  sorot: campurWarna(a.sorot, b.sorot, t),
  sorotKuat: campurAngka(a.sorotKuat, b.sorotKuat, t),
  rona: campurWarna(a.rona, b.rona, t),
  ronaKuat: campurAngka(a.ronaKuat, b.ronaKuat, t),
  vinyet: campurWarna(a.vinyet, b.vinyet, t),
  vinyetKuat: campurAngka(a.vinyetKuat, b.vinyetKuat, t),
  bokeh: campurWarna(a.bokeh, b.bokeh, t),
  butir: campurAngka(a.butir, b.butir, t),
});

export const suasanaDari = (s: SuasanaKini): Suasana => {
  if (typeof s === 'string') return SUASANA[s];
  const t = Math.min(1, Math.max(0, s.t));
  return campurSuasana(SUASANA[s.dari], SUASANA[s.ke], t);
};

// Sorot dalam koordinat dunia. `x, y` pusat genangan cahaya, `lebar` jari-jarinya.
// `jenis` atas: berkas dari langit-langit. samping: cahaya jendela dari kiri atau kanan. titik: lampu kecil tanpa berkas.
export type Sorot = {x: number; y: number; lebar: number; jenis?: 'atas' | 'samping' | 'titik'; sisi?: 1 | -1};

export const SOROT_TENGAH: Sorot = {x: 540, y: 1120, lebar: 520, jenis: 'atas'};

const BOKEH = Array.from({length: 18}, (_, i) => ({
  x: random(`bokeh-x-${i}`) * 1500 - 210,
  y: random(`bokeh-y-${i}`) * 1500 + 120,
  r: 22 + random(`bokeh-r-${i}`) * 70,
  a: 0.08 + random(`bokeh-a-${i}`) * 0.2,
  laju: 0.15 + random(`bokeh-l-${i}`) * 0.35,
}));

// Latar ruang: gradasi radial yang terang di genangan cahaya, lantai samar, dan bokeh buram.
export const LatarRuang = ({
  suasana,
  kamera,
  sorot = SOROT_TENGAH,
  lantai,
  bokeh = true,
  id = 'ruang',
}: {
  suasana: SuasanaKini;
  kamera: Kamera;
  sorot?: Sorot;
  // Garis lantai dalam koordinat dunia. Tanpa nilai ini ruang tidak berlantai.
  lantai?: number;
  bokeh?: boolean;
  id?: string;
}) => {
  const frame = useCurrentFrame();
  const s = suasanaDari(suasana);
  const p = KEDALAMAN.belakang;
  return (
    <AbsoluteFill>
      <Lapis kamera={kamera} p={p}>
        <defs>
          <radialGradient id={`${id}-latar`} cx={sorot.x} cy={sorot.y - sorot.lebar * 0.6} r={sorot.lebar * 2.6} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={s.latar[0]} />
            <stop offset="45%" stopColor={s.latar[1]} />
            <stop offset="100%" stopColor={s.latar[2]} />
          </radialGradient>
          <linearGradient id={`${id}-lantai`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.latar[2]} stopOpacity={0} />
            <stop offset="18%" stopColor={s.latar[2]} stopOpacity={0.55} />
            <stop offset="100%" stopColor={s.latar[2]} stopOpacity={0.85} />
          </linearGradient>
          <radialGradient id={`${id}-genangan`}>
            <stop offset="0%" stopColor={s.sorot} stopOpacity={0.5} />
            <stop offset="100%" stopColor={s.sorot} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect x={-1200} y={-1200} width={3480} height={4320} fill={`url(#${id}-latar)`} />
        {lantai !== undefined && (
          <>
            <rect x={-1200} y={lantai - 60} width={3480} height={3000} fill={`url(#${id}-lantai)`} />
            <ellipse cx={sorot.x} cy={lantai + 140} rx={sorot.lebar * 1.1} ry={sorot.lebar * 0.28} fill={`url(#${id}-genangan)`} />
          </>
        )}
      </Lapis>
      {bokeh && (
        <Lapis kamera={kamera} p={p * 0.7} blur={18}>
          {BOKEH.map((b, i) => (
            <circle key={i} cx={b.x + Math.sin(frame / 70 + i) * 14} cy={b.y - frame * b.laju} r={b.r} fill={s.bokeh} opacity={b.a} />
          ))}
        </Lapis>
      )}
    </AbsoluteFill>
  );
};

// Cahaya bersumber di atas set: berkas, kilau genangan, dan gelap yang menjauh dari cahaya.
export const Cahaya = ({suasana, kamera, sorot = SOROT_TENGAH, id = 'cahaya'}: {suasana: SuasanaKini; kamera: Kamera; sorot?: Sorot; id?: string}) => {
  const s = suasanaDari(suasana);
  const pusat = keLayar(kamera, sorot);
  const r = sorot.lebar * kamera.zoom;
  const jenis = sorot.jenis ?? 'atas';
  const sisi = sorot.sisi ?? -1;
  // Berkas: dari sumber sempit di luar bingkai ke genangan lebar.
  const berkas =
    jenis === 'atas'
      ? `M${pusat.x - r * 0.18} -80 L${pusat.x + r * 0.18} -80 L${pusat.x + r * 1.05} ${pusat.y + r * 0.2} L${pusat.x - r * 1.05} ${pusat.y + r * 0.2} Z`
      : jenis === 'samping'
        ? `M${sisi < 0 ? -80 : 1160} ${pusat.y - r * 1.6} L${sisi < 0 ? -80 : 1160} ${pusat.y - r * 0.6} L${pusat.x + sisi * r * 0.9} ${pusat.y + r * 0.9} L${pusat.x - sisi * r * 0.9} ${pusat.y + r * 0.2} Z`
        : '';
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id={`${id}-gelap`} cx={pusat.x} cy={pusat.y} r={r * 2.3} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={s.vinyet} stopOpacity={0} />
            <stop offset="38%" stopColor={s.vinyet} stopOpacity={0} />
            <stop offset="100%" stopColor={s.vinyet} stopOpacity={s.vinyetKuat * 0.75} />
          </radialGradient>
          <linearGradient id={`${id}-berkas`} x1={jenis === 'samping' ? (sisi < 0 ? '0' : '1') : '0'} y1="0" x2={jenis === 'samping' ? (sisi < 0 ? '1' : '0') : '0'} y2="1">
            <stop offset="0%" stopColor={s.sorot} stopOpacity={s.sorotKuat * 0.55} />
            <stop offset="100%" stopColor={s.sorot} stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect width={1080} height={1920} fill={`url(#${id}-gelap)`} />
      </svg>
      {/* Berkas dan kilau ditambahkan dengan blend layar, jadi warna set di bawahnya tetap terbaca. */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', filter: 'blur(28px)'}}>
        {berkas && <path d={berkas} fill={`url(#${id}-berkas)`} />}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: pusat.x - r,
          top: pusat.y - r * 0.7,
          width: r * 2,
          height: r * 1.4,
          borderRadius: '50%',
          background: `radial-gradient(closest-side, ${s.sorot}, transparent)`,
          opacity: s.sorotKuat * 0.45,
          mixBlendMode: 'soft-light',
        }}
      />
    </AbsoluteFill>
  );
};

// Lensa: rona suasana, vinyet bingkai, dan butiran yang berganti tiap frame. Dipasang paling atas, di bawah teks.
export const Lensa = ({suasana, id = 'lensa'}: {suasana: SuasanaKini; id?: string}) => {
  const frame = useCurrentFrame();
  const s = suasanaDari(suasana);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{backgroundColor: s.rona, opacity: s.ronaKuat, mixBlendMode: 'multiply'}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 78% 62% at 50% 46%, transparent 55%, ${s.vinyet})`, opacity: s.vinyetKuat * 0.7}} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: s.butir * 4}}>
        <filter id={`${id}-butir`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={1} seed={frame % 61} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={1080} height={1920} filter={`url(#${id}-butir)`} opacity={0.5} />
      </svg>
    </AbsoluteFill>
  );
};

// Ruang lengkap untuk benda penting: latar, isi di lapisan tengah, lalu cahaya dan lensa.
export const Ruang = ({
  suasana,
  kamera,
  sorot = SOROT_TENGAH,
  lantai,
  bokeh = true,
  id = 'ruang',
  children,
}: {
  suasana: SuasanaKini;
  kamera: Kamera;
  sorot?: Sorot;
  lantai?: number;
  bokeh?: boolean;
  id?: string;
  children?: ReactNode;
}) => (
  <AbsoluteFill>
    <LatarRuang suasana={suasana} kamera={kamera} sorot={sorot} lantai={lantai} bokeh={bokeh} id={id} />
    {children}
    <Cahaya suasana={suasana} kamera={kamera} sorot={sorot} id={`${id}-cahaya`} />
    <Lensa suasana={suasana} id={`${id}-lensa`} />
  </AbsoluteFill>
);
