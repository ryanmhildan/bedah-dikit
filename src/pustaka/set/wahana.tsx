import {useCurrentFrame} from 'remotion';
import {WAHANA} from '../../tema';
import type {HasilSet, Slot} from './tipe';

// Wahana roller coaster di luar ruang, tampak samping: langit siang, awan, bukit, tiang putih, dan rel merah
// dengan puncak di kiri, turunan curam, lalu naik lagi di kanan. Gerbong digambar oleh aksi `meluncur`,
// yang membaca posisi dan kemiringan rel dari `titikRel`.

// Titik kendali rel dalam koordinat dunia, dilewati kurva Catmull-Rom terbuka.
const KENDALI: [number, number][] = [
  [-700, 980],
  [-260, 700],
  [120, 560],
  [330, 620],
  [560, 1060],
  [760, 1300],
  [1000, 1250],
  [1260, 900],
  [1700, 700],
];
const TANAH = 1760;

const catmull = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

// Sampel rapat sepanjang kurva, lalu panjang kumulatif supaya `s` 0..1 bergerak dengan laju rata.
const SAMPEL = (() => {
  const titik: {x: number; y: number}[] = [];
  const n = KENDALI.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = KENDALI[Math.max(0, i - 1)];
    const p1 = KENDALI[i];
    const p2 = KENDALI[i + 1];
    const p3 = KENDALI[Math.min(n - 1, i + 2)];
    for (let j = 0; j < 60; j++) {
      const t = j / 60;
      titik.push({x: catmull(p0[0], p1[0], p2[0], p3[0], t), y: catmull(p0[1], p1[1], p2[1], p3[1], t)});
    }
  }
  titik.push({x: KENDALI[n - 1][0], y: KENDALI[n - 1][1]});
  const panjang = [0];
  for (let i = 1; i < titik.length; i++) panjang.push(panjang[i - 1] + Math.hypot(titik[i].x - titik[i - 1].x, titik[i].y - titik[i - 1].y));
  return {titik, panjang, total: panjang[panjang.length - 1]};
})();

// Titik dan sudut rel (derajat, 0 mendatar, positif menurun ke kanan) pada `s` 0..1 sepanjang rel.
export const titikRel = (s: number) => {
  const target = Math.min(1, Math.max(0, s)) * SAMPEL.total;
  let i = 1;
  while (i < SAMPEL.panjang.length - 1 && SAMPEL.panjang[i] < target) i++;
  const a = SAMPEL.titik[i - 1];
  const b = SAMPEL.titik[i];
  const ruas = SAMPEL.panjang[i] - SAMPEL.panjang[i - 1] || 1;
  const t = (target - SAMPEL.panjang[i - 1]) / ruas;
  return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, sudut: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI};
};

// `s` terdekat untuk sebuah x dunia, untuk menaruh slot dan tiang.
const sDiX = (x: number) => {
  let terbaik = 0;
  let jarak = Infinity;
  for (let i = 0; i <= 400; i++) {
    const d = Math.abs(titikRel(i / 400).x - x);
    if (d < jarak) {
      jarak = d;
      terbaik = i / 400;
    }
  }
  return terbaik;
};

const jalurRel = () => SAMPEL.titik.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

const Langit = () => {
  const frame = useCurrentFrame();
  return (
    <g>
      <defs>
        <linearGradient id="wahana-langit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={WAHANA.langit[0]} />
          <stop offset="100%" stopColor={WAHANA.langit[1]} />
        </linearGradient>
      </defs>
      <rect x={-1500} y={-1500} width={4200} height={4600} fill="url(#wahana-langit)" />
      {[
        [80, 300, 1.1],
        [760, 200, 0.8],
        [1240, 420, 1],
        [-420, 460, 0.9],
      ].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x + frame * 0.4 * (i % 2 ? 1 : 0.6)} ${y}) scale(${s})`} fill={WAHANA.awan} opacity={0.9}>
          <ellipse rx={120} ry={46} />
          <circle cx={-50} cy={-30} r={52} />
          <circle cx={30} cy={-46} r={64} />
        </g>
      ))}
      <path d="M-1500 1520 Q-700 1300 0 1450 Q600 1560 1200 1380 Q1900 1240 2700 1460 V3100 H-1500 Z" fill={WAHANA.bukit[0]} />
      <path d="M-1500 1640 Q-500 1520 400 1620 Q1200 1700 2700 1580 V3100 H-1500 Z" fill={WAHANA.bukit[1]} />
    </g>
  );
};

// Tiang putih dari rel ke tanah, dengan palang silang tipis.
const Tiang = () => (
  <g>
    {Array.from({length: 22}, (_, i) => {
      const x = -640 + i * 110;
      const p = titikRel(sDiX(x));
      if (Math.abs(p.x - x) > 30) return null;
      return (
        <g key={i}>
          <rect x={p.x - 9} y={p.y + 10} width={18} height={TANAH - p.y} fill={WAHANA.tiang} />
          <rect x={p.x + 3} y={p.y + 10} width={6} height={TANAH - p.y} fill={WAHANA.tiangBayang} />
          {i % 2 === 0 && p.y < TANAH - 240 && <path d={`M${p.x} ${p.y + 80} L${p.x + 110} ${Math.min(TANAH, p.y + 300)}`} stroke={WAHANA.tiangBayang} strokeWidth={7} />}
        </g>
      );
    })}
  </g>
);

const Rel = () => {
  const d = jalurRel();
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={WAHANA.bantalan} strokeWidth={34} strokeDasharray="10 26" />
      <path d={d} stroke={WAHANA.relGelap} strokeWidth={22} transform="translate(0 6)" />
      <path d={d} stroke={WAHANA.rel} strokeWidth={14} />
    </g>
  );
};

const SLOT_WAHANA: Record<string, Slot> = {
  puncak: titikRel(sDiX(120)),
  turunan: titikRel(sDiX(470)),
  lembah: titikRel(sDiX(820)),
  tanjakan: titikRel(sDiX(1180)),
};

export const setWahana = (): HasilSet => ({
  belakang: <Langit />,
  tengahBelakang: (
    <g>
      <Tiang />
      <Rel />
    </g>
  ),
  slot: SLOT_WAHANA,
  sorot: {x: 760, y: 500, lebar: 700, jenis: 'titik'},
  pakaiLatar: false,
});
