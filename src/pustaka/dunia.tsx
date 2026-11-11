import {AbsoluteFill, random, useCurrentFrame} from 'remotion';

// Dunia ilustrasi berlapis. Tiap lapisan bergeser dengan kecepatan berbeda agar terasa dalam.
const LEBAR = 3600;
const TANAH = 1540;

type Tema = {
  langit: [string, string, string];
  matahari?: string;
  bintang?: boolean;
  awan: string;
  gunung: string;
  jauh?: string;
  gedung?: string[];
  jendela: string;
  bukit: [string, string];
  tanah: string;
  semak: string;
  teks: string;
  bayangan: string;
};

export const TEMA: Record<string, Tema> = {
  kota: {
    langit: ['#8CCFE6', '#BFE6EE', '#F1EFDC'],
    matahari: '#FFC94D',
    awan: '#F7FBFC',
    gunung: '#8FB4C2',
    jauh: '#A9CBD3',
    gedung: ['#6F97A8', '#8AA9B5', '#C9B48C', '#DCC79C', '#5F8FB0'],
    jendela: '#DDF1F5',
    bukit: ['#B7CF7C', '#9DBE6A'],
    tanah: '#A7C46C',
    semak: '#6F9F52',
    teks: '#262B52',
    bayangan: 'rgba(255,255,255,0.65)',
  },
  malam: {
    langit: ['#17153F', '#2C2A66', '#54559C'],
    bintang: true,
    awan: '#3C3C7C',
    gunung: '#2B2E63',
    jauh: '#2F3672',
    gedung: ['#2A3268', '#343C78', '#25305F', '#3B4586'],
    jendela: '#FFD76A',
    bukit: ['#3C5A4E', '#2F4C45'],
    tanah: '#2C4640',
    semak: '#1D3234',
    teks: '#FFFFFF',
    bayangan: 'rgba(10,8,40,0.7)',
  },
  senja: {
    langit: ['#5D5FAE', '#E58A8E', '#FFC77D'],
    matahari: '#FFE3A0',
    awan: '#F4B7A6',
    gunung: '#9A6F9C',
    jauh: '#B9789A',
    gedung: ['#6B4A84', '#7D5590', '#5B3F78'],
    jendela: '#FFD98A',
    bukit: ['#8E6A5E', '#6E5450'],
    tanah: '#5F4A4E',
    semak: '#3E3340',
    teks: '#FFFFFF',
    bayangan: 'rgba(50,20,50,0.6)',
  },
  langit: {
    langit: ['#6FBDE8', '#A9DDF3', '#E6F5F2'],
    matahari: '#FFD45E',
    awan: '#FFFFFF',
    gunung: '#A7CFE0',
    bukit: ['#A8D47E', '#8CC272'],
    jendela: '#FFFFFF',
    tanah: '#82B868',
    semak: '#5F9C58',
    teks: '#262B52',
    bayangan: 'rgba(255,255,255,0.7)',
  },
  alam: {
    langit: ['#9AD9EE', '#D3EEF0', '#F6F2DC'],
    matahari: '#FFD45E',
    awan: '#FFFFFF',
    gunung: '#7FA6A0',
    bukit: ['#B4D47E', '#8FC16E'],
    jendela: '#FFFFFF',
    tanah: '#7FB562',
    semak: '#5A9650',
    teks: '#262B52',
    bayangan: 'rgba(255,255,255,0.7)',
  },
};

export const NAMA_DUNIA = Object.keys(TEMA);

const urut = (jumlah: number, seed: string) =>
  Array.from({length: jumlah}, (_, i) => ({
    a: random(`${seed}a${i}`),
    b: random(`${seed}b${i}`),
    c: random(`${seed}c${i}`),
    i,
  }));

const AWAN = urut(16, 'awan');
const BINTANG = urut(150, 'bintang');
const JAUH = urut(34, 'jauh');
const GEDUNG = urut(24, 'gedung');
const RUMAH = urut(20, 'rumah');
const POHON = urut(34, 'pohon');
const BUNGA = urut(70, 'bunga');
const SEMAK = urut(13, 'semak');

const Awan = ({x, y, s, fill}: {x: number; y: number; s: number; fill: string}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
    <rect x={-120} y={-14} width={240} height={34} rx={17} />
    <circle cx={-60} cy={-20} r={38} />
    <circle cx={-6} cy={-42} r={54} />
    <circle cx={58} cy={-22} r={40} />
  </g>
);

const Gedung = ({x, w, h, fill, id, antena}: {x: number; w: number; h: number; fill: string; id: string; antena: boolean}) => (
  <g>
    {antena && <rect x={x + w / 2 - 3} y={TANAH - h - 70} width={6} height={72} fill={fill} />}
    <rect x={x} y={TANAH - h} width={w} height={h} fill={fill} />
    <rect x={x} y={TANAH - h} width={w} height={h} fill={`url(#${id})`} />
    <rect x={x - 5} y={TANAH - h - 8} width={w + 10} height={12} fill={fill} />
    <rect x={x + w * 0.72} y={TANAH - h} width={w * 0.28} height={h} fill="rgba(0,0,0,0.12)" />
  </g>
);

const Rumah = ({x, s, dinding, atap}: {x: number; s: number; dinding: string; atap: string}) => (
  <g transform={`translate(${x} ${TANAH + 18}) scale(${s})`}>
    <rect x={-70} y={-80} width={140} height={84} fill={dinding} />
    <path d="M-90 -76 L0 -142 L90 -76 Z" fill={atap} />
    <rect x={-46} y={-54} width={32} height={32} fill="#CDE8F2" />
    <rect x={14} y={-58} width={34} height={62} fill="#7A5238" />
  </g>
);

const Pohon = ({x, y, s, fill, goyang}: {x: number; y: number; s: number; fill: string; goyang: number}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${goyang})`}>
    <rect x={-8} y={-74} width={16} height={78} fill="#7A5A3C" />
    <circle cy={-108} r={56} fill={fill} />
    <circle cx={-34} cy={-82} r={36} fill={fill} />
    <circle cx={36} cy={-84} r={38} fill={fill} />
    <circle cx={-14} cy={-124} r={22} fill="rgba(255,255,255,0.16)" />
  </g>
);

export const Dunia = ({nama, geser, zoom = 1, angkat = 0}: {nama: string; geser?: number; zoom?: number; angkat?: number}) => {
  const frame = useCurrentFrame();
  const t = TEMA[nama] ?? TEMA.kota;
  const g = geser ?? frame * 0.9;
  const lapis = (p: number) => `translate(${-300 - g * p} ${-angkat})`;
  const id = `jendela-${nama}`;
  return (
    <AbsoluteFill style={{overflow: 'hidden', transform: `scale(${zoom})`, transformOrigin: '50% 68%'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id={`langit-${nama}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t.langit[0]} />
            <stop offset="55%" stopColor={t.langit[1]} />
            <stop offset="82%" stopColor={t.langit[2]} />
          </linearGradient>
          <radialGradient id={`sinar-${nama}`}>
            <stop offset="0%" stopColor={t.matahari ?? '#FFFFFF'} stopOpacity={0.75} />
            <stop offset="100%" stopColor={t.matahari ?? '#FFFFFF'} stopOpacity={0} />
          </radialGradient>
          <pattern id={id} width={34} height={46} patternUnits="userSpaceOnUse">
            <rect x={8} y={10} width={18} height={24} fill={t.jendela} opacity={nama === 'malam' ? 0.75 : 0.55} />
          </pattern>
        </defs>
        <rect width={1080} height={1920} fill={`url(#langit-${nama})`} />
        {t.bintang &&
          BINTANG.map(({a, b, c, i}) => (
            <circle key={i} cx={a * 1080} cy={b * 1300} r={1.2 + c * 2.6} fill="#FFFFFF" opacity={0.35 + 0.55 * Math.abs(Math.sin(frame / 22 + i))} />
          ))}
        {t.matahari && (
          <g transform={`translate(${820 - g * 0.03} ${nama === 'senja' ? 1040 : 140})`}>
            <circle r={330} fill={`url(#sinar-${nama})`} />
            <circle r={92} fill={t.matahari} />
          </g>
        )}
        <g transform={lapis(0.06)}>
          {AWAN.map(({a, b, c, i}) => (
            <Awan key={i} x={a * LEBAR + frame * (0.15 + c * 0.25)} y={500 + b * 560} s={0.5 + c * 1.1} fill={t.awan} />
          ))}
        </g>
        <g transform={lapis(0.14)}>
          <path d={`M0 ${TANAH} L260 1010 L470 1280 L760 870 L1090 1300 L1340 1040 L1680 1320 L2020 960 L2420 1330 L2760 1060 L3180 1340 L${LEBAR} 1110 V${TANAH} Z`} fill={t.gunung} />
        </g>
        {t.jauh && (
          <g transform={lapis(0.28)} fill={t.jauh}>
            {JAUH.map(({a, b, i}) => (
              <rect key={i} x={i * 108 + a * 30} y={TANAH - 230 - b * 420} width={84 + a * 34} height={700} />
            ))}
          </g>
        )}
        <g transform={lapis(0.42)}>
          <path d={`M0 ${TANAH} Q500 1250 1100 1430 T2300 1400 T${LEBAR} 1370 V1920 H0 Z`} fill={t.bukit[0]} />
        </g>
        {t.gedung && (
          <g transform={lapis(0.6)}>
            {GEDUNG.map(({a, b, c, i}) => (
              <Gedung key={i} x={i * 150 + a * 40} w={110 + c * 56} h={290 + b * 470} fill={t.gedung![i % t.gedung!.length]} id={id} antena={c > 0.66} />
            ))}
          </g>
        )}
        <g transform={lapis(1)}>
          <path d={`M0 ${TANAH - 20} Q700 ${TANAH - 120} 1500 ${TANAH - 26} T${LEBAR} ${TANAH - 50} V1920 H0 Z`} fill={t.bukit[1]} />
          <rect y={TANAH + 10} width={LEBAR} height={420 + angkat} fill={t.tanah} />
          {POHON.map(({a, b, c, i}) => (
            <Pohon key={i} x={a * LEBAR} y={TANAH + 8 + c * 30} s={0.75 + b * 0.8} fill={i % 2 ? t.semak : t.bukit[1]} goyang={Math.sin(frame / 22 + i) * 1.5} />
          ))}
          {t.gedung &&
            RUMAH.map(({a, b, i}) => (
              <Rumah key={i} x={i * 182 + a * 40} s={0.8 + b * 0.35} dinding={['#E9D9B6', '#D7C3A0', '#E8B98E', '#C9D6C2'][i % 4]} atap={['#B7654A', '#A9574A', '#8E6A54'][i % 3]} />
            ))}
          {!t.gedung &&
            BUNGA.map(({a, b, c, i}) => (
              <circle key={i} cx={a * LEBAR} cy={TANAH + 36 + b * 240} r={6 + c * 9} fill={['#FFFFFF', '#FFD76A', '#EF7F6F'][i % 3]} />
            ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// Semak buram di depan karakter, sehingga karakter terbingkai dari dada ke atas.
export const Depan = ({nama, geser, turun = 0}: {nama: string; geser?: number; turun?: number}) => {
  const frame = useCurrentFrame();
  const t = TEMA[nama] ?? TEMA.kota;
  const g = geser ?? frame * 0.9;
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${turun}px)`}}>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, filter: 'blur(14px)'}}>
      <g transform={`translate(${-300 - g * 1.2} 0)`}>
        {SEMAK.map(({a, b, i}) => (
          <circle key={i} cx={i * 300 + b * 120} cy={1760 + a * 60} r={170 + a * 70} fill={t.bukit[1]} />
        ))}
      </g>
      <g transform={`translate(${-300 - g * 1.7} 0)`}>
        {SEMAK.map(({a, b, i}) => (
          <circle key={i} cx={i * 330 + a * 90} cy={1860 + b * 50} r={200 + b * 90} fill={t.semak} />
        ))}
      </g>
      <rect y={1800} width={1080} height={400} fill={t.semak} />
    </svg>
    <div style={{position: 'absolute', left: 0, top: 1760, width: 1080, height: 160, background: `linear-gradient(transparent, ${t.semak} 45%)`}} />
    {turun < 0 && <div style={{position: 'absolute', left: 0, top: 1880, width: 1080, height: 60 - turun, backgroundColor: t.semak}} />}
    </div>
  );
};
