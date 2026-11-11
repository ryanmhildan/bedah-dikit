import {BAR, NAVY, ROSE, SENJA_CAKRAWALA, SENJA_INTI, SENJA_SURYA} from '../tema';

// Pustaka ikon datar tanpa garis tepi. Semua digambar pada bidang -110..110.
export const Bumi = () => (
  <g>
    <circle r={92} fill="#6FC3DF" />
    <path d="M-70 -48 Q-30 -82 6 -62 Q18 -26 -22 -16 Q-58 -10 -70 -48 Z M16 12 Q58 -6 80 22 Q60 72 18 72 Q-2 42 16 12 Z" fill="#7CC47F" />
  </g>
);

export const Bohlam = () => (
  <g>
    <circle cy={-22} r={72} fill="#FFD76A" />
    <rect x={-30} y={40} width={60} height={46} rx={10} fill="#8C8476" />
    <path d="M-22 -18 L-6 8 L6 -14 L22 8" fill="none" stroke="#E0A63A" strokeWidth={8} strokeLinejoin="round" />
  </g>
);

export const Roda = () => (
  <g fill="#8E9BC4">
    {[0, 45, 90, 135, 180, 225, 270, 315].map((sudut) => (
      <rect key={sudut} x={-16} y={-96} width={32} height={40} rx={6} transform={`rotate(${sudut})`} />
    ))}
    <circle r={68} />
    <circle r={26} fill="#FCE9CF" />
  </g>
);

export const Jam = () => (
  <g>
    <circle r={90} fill="#EF5F74" />
    <circle r={70} fill="#FFF6EA" />
    <path d="M0 0 V-48 M0 0 L34 20" stroke="#3B3F66" strokeWidth={10} strokeLinecap="round" />
  </g>
);

export const Apel = () => (
  <g>
    <path d="M0 -44 Q62 -84 84 -18 Q88 56 34 80 Q0 66 -34 80 Q-88 56 -84 -18 Q-62 -84 0 -44 Z" fill="#E8734F" />
    <path d="M2 -46 Q6 -82 34 -92" stroke="#7A5238" strokeWidth={9} fill="none" strokeLinecap="round" />
  </g>
);

export const Planet = () => (
  <g>
    <ellipse rx={104} ry={28} fill="none" stroke="#FFD76A" strokeWidth={13} transform="rotate(-18)" />
    <circle r={62} fill="#B79CED" />
  </g>
);

export const Buku = () => (
  <g>
    <rect x={-84} y={-66} width={168} height={132} rx={10} fill="#5B9BD5" />
    <rect x={-70} y={-54} width={140} height={108} rx={4} fill="#FFF6EA" />
    <path d="M0 -54 V54 M-54 -28 H-14 M-54 0 H-14 M14 -28 H54 M14 0 H54" stroke="#C9BAA0" strokeWidth={7} />
  </g>
);

export const Tabung = () => (
  <g>
    <path d="M-20 -86 H20 V-22 L66 70 Q72 88 52 88 H-52 Q-72 88 -66 70 L-20 -22 Z" fill="#DDF3EE" />
    <path d="M-40 30 H40 L60 74 Q62 80 52 80 H-52 Q-62 80 -60 74 Z" fill="#4FC4A8" />
  </g>
);

const Matahari = () => (
  <g fill="#FFC94D">
    {Array.from({length: 12}, (_, i) => (
      <rect key={i} x={-7} y={-102} width={14} height={28} rx={7} transform={`rotate(${i * 30})`} />
    ))}
    <circle r={62} />
  </g>
);

const Awan = () => (
  <path d="M-78 50 a34 34 0 0 1 2 -68 a50 50 0 0 1 94 -14 a40 40 0 0 1 62 30 a28 28 0 0 1 -6 52 z" fill="#F4F7FB" />
);

const Rumah = () => (
  <g>
    <rect x={-66} y={-14} width={132} height={92} rx={6} fill="#F4A261" />
    <path d="M-88 -8 L0 -82 L88 -8 Z" fill="#D9633F" />
    <rect x={-18} y={26} width={36} height={52} rx={4} fill="#7A5238" />
  </g>
);

const Gunung = () => (
  <g>
    <path d="M-100 76 L-26 -56 L14 8 L38 -24 L100 76 Z" fill="#7C8FB5" />
    <path d="M-26 -56 L-50 -14 L-32 -24 L-20 -10 L-6 -24 Z" fill="#F4F7FB" />
  </g>
);

const Mata = () => (
  <g>
    <path d="M-100 0 Q0 -84 100 0 Q0 84 -100 0 Z" fill="#FFF6EA" />
    <circle r={40} fill="#5B9BD5" />
    <circle r={19} fill="#262B52" />
    <circle cx={-10} cy={-12} r={8} fill="#FFFFFF" />
  </g>
);

const Gelombang = () => (
  <g fill="none" strokeWidth={13} strokeLinecap="round">
    <path d="M-100 -46 Q-75 -92 -50 -46 T0 -46 T50 -46 T100 -46" stroke="#EF5F74" />
    <path d="M-100 40 q12 -22 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0" stroke="#5B9BD5" />
  </g>
);

const Udara = () => (
  <g>
    {[[-54, -44, 24], [34, -60, 18], [64, 8, 26], [-20, 18, 30], [-72, 44, 16], [30, 68, 20]].map(([x, y, r]) => (
      <circle key={`${x}`} cx={x} cy={y} r={r} fill="#3E8FC4" />
    ))}
  </g>
);

const Lempeng = () => (
  <g>
    <path d="M-104 -6 H-8 L8 76 H-104 Z" fill="#B98A5E" />
    <path d="M104 -6 H-2 L-30 64 H104 Z" fill="#8C6B4C" />
    <path d="M-92 -44 H-34 M-52 -60 L-32 -44 L-52 -28" fill="none" stroke="#EF5F74" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M92 -44 H34 M52 -60 L32 -44 L52 -28" fill="none" stroke="#EF5F74" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const Getar = () => (
  <path
    d="M-104 0 H-62 L-44 -62 L-16 72 L12 -86 L38 54 L54 -24 L66 0 H104"
    fill="none"
    stroke="#EF5F74"
    strokeWidth={13}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

const Uang = () => (
  <g>
    <rect x={-96} y={-52} width={192} height={104} rx={10} fill="#7ED04B" />
    <rect x={-82} y={-38} width={164} height={76} rx={6} fill="#B7E88A" />
    <circle r={28} fill="#7ED04B" />
  </g>
);

// Separuh matahari tepat di garis cakrawala, dengan pantulan yang makin pendek ke bawah.
const Senja = () => (
  <g>
    {[-72, -36, 0, 36, 72].map((sudut) => (
      <rect key={sudut} x={-7} y={-104} width={14} height={26} rx={7} fill={SENJA_INTI} transform={`translate(0 26) rotate(${sudut})`} />
    ))}
    <path d="M-68 26 A68 68 0 0 1 68 26 Z" fill={SENJA_SURYA} />
    <path d="M-40 26 A40 40 0 0 1 40 26 Z" fill={SENJA_INTI} />
    <rect x={-104} y={24} width={208} height={9} rx={4.5} fill={SENJA_CAKRAWALA} />
    <rect x={-62} y={46} width={124} height={10} rx={5} fill={SENJA_SURYA} />
    <rect x={-40} y={66} width={80} height={10} rx={5} fill={SENJA_SURYA} />
    <rect x={-20} y={86} width={40} height={10} rx={5} fill={SENJA_SURYA} />
  </g>
);

// Cangkir kopi di atas tatakan, dengan tiga garis uap tipis.
const Kopi = () => (
  <g>
    <g fill="none" stroke="#C9BAA0" strokeWidth={8} strokeLinecap="round">
      <path d="M-26 -42 q-12 -13 0 -26 t0 -26" />
      <path d="M2 -46 q-12 -13 0 -26 t0 -26" />
      <path d="M30 -42 q-12 -13 0 -26 t0 -26" />
    </g>
    <ellipse cy={82} rx={98} ry={14} fill="#C9BAA0" />
    <path d="M56 -2 Q96 -4 94 26 Q92 56 50 56" fill="none" stroke="#F4806D" strokeWidth={15} strokeLinecap="round" />
    <path d="M-64 -24 H64 L56 64 Q54 78 40 78 H-40 Q-54 78 -56 64 Z" fill="#F4806D" />
    <ellipse cy={-24} rx={64} ry={14} fill="#FFF6EA" />
    <ellipse cy={-22} rx={52} ry={9} fill="#7A5238" />
  </g>
);

// Otak tampak samping: belahan besar, otak kecil, dan batang otak.
const Otak = () => (
  <g>
    <rect x={8} y={36} width={26} height={58} rx={12} fill="#8E9BC4" />
    <ellipse cx={58} cy={50} rx={34} ry={22} fill="#B79CED" />
    <ellipse cx={58} cy={50} rx={34} ry={22} fill={NAVY} fillOpacity={0.18} />
    <path
      d="M-96 6 Q-102 -46 -60 -68 Q-30 -96 10 -86 Q48 -98 80 -64 Q106 -38 98 -2 Q94 34 60 40 Q34 58 2 50 Q-26 66 -56 54 Q-92 46 -96 6 Z"
      fill="#B79CED"
    />
    <g fill="none" stroke={NAVY} strokeOpacity={0.22} strokeWidth={8} strokeLinecap="round">
      <path d="M-58 -42 Q-36 -30 -44 -6 Q-50 14 -30 26" />
      <path d="M-6 -70 Q8 -46 -8 -26 Q-22 -8 2 10 Q20 22 12 40" />
      <path d="M40 -66 Q30 -40 50 -26 Q72 -12 58 14" />
      <path d="M-82 -2 Q-70 6 -66 22" />
    </g>
  </g>
);

// Jantung berbentuk hati sederhana dengan kilau kecil.
const Jantung = () => (
  <g>
    <path
      d="M0 88 C-62 42 -100 8 -100 -34 C-100 -70 -74 -92 -46 -92 C-24 -92 -8 -80 0 -62 C8 -80 24 -92 46 -92 C74 -92 100 -70 100 -34 C100 8 62 42 0 88 Z"
      fill={ROSE}
    />
    <path d="M-70 -40 Q-68 -66 -44 -70" fill="none" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={12} strokeLinecap="round" />
  </g>
);

// Kapsul dua warna, miring.
const Kapsul = () => (
  <g transform="rotate(-38)">
    <path d="M0 -42 H-62 A42 42 0 0 0 -62 42 H0 Z" fill={ROSE} />
    <path d="M0 -42 H62 A42 42 0 0 1 62 42 H0 Z" fill={BAR} />
    <path d="M-70 -22 H-20 M20 -22 H70" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={10} strokeLinecap="round" />
  </g>
);

export const IKON = {
  bumi: Bumi,
  bohlam: Bohlam,
  roda: Roda,
  jam: Jam,
  apel: Apel,
  planet: Planet,
  buku: Buku,
  tabung: Tabung,
  matahari: Matahari,
  awan: Awan,
  rumah: Rumah,
  gunung: Gunung,
  mata: Mata,
  gelombang: Gelombang,
  udara: Udara,
  lempeng: Lempeng,
  getar: Getar,
  uang: Uang,
  senja: Senja,
  kopi: Kopi,
  otak: Otak,
  jantung: Jantung,
  kapsul: Kapsul,
};

export type NamaIkon = keyof typeof IKON;

export const Ikon = ({nama, size}: {nama: NamaIkon; size: number}) => {
  const Gambar = IKON[nama];
  return (
    <svg width={size} height={size} viewBox="-110 -110 220 220" style={{display: 'block', overflow: 'visible'}}>
      <Gambar />
    </svg>
  );
};
