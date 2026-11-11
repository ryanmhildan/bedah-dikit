import type {ReactNode} from 'react';
import {useCurrentFrame} from 'remotion';
import {BAHAN, BAYANG_KONTAK, BUKU, DAUN, INTERIOR, JENDELA, PROPERTI as W, type NamaBahan, type WarnaInterior} from '../../tema';
import {Properti} from '../properti';
import {DaunDepan, MejaSamping, titikMeja, type GayaKaki, type UkuranMeja} from './meja';
import type {HasilSet, Slot} from './tipe';

// Interior tampak samping. Semua varian memakai kerangka yang sama: dinding, lantai, meja, dan perabot.
// Variasi dibuat dengan menukar daftar perabot, bukan menggambar ulang ruangan.

export type VarianInterior = 'kerja' | 'kamar' | 'dapur' | 'kafe' | 'klinik';
export const NAMA_INTERIOR: VarianInterior[] = ['kerja', 'kamar', 'dapur', 'kafe', 'klinik'];

const LANTAI = 1560;
const KIRI = -700;
const LEBAR = 2500;

// ---------------- Perabot ----------------
// `malam` mengganti langit sore dengan langit malam dan bulan.
const Jendela = ({x, y, w, h, kisi = false, tirai, id, malam = false}: {x: number; y: number; w: number; h: number; kisi?: boolean; tirai?: string; id: string; malam?: boolean}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-kaca`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={(malam ? JENDELA.langitMalam : JENDELA.langit)[0]} />
        <stop offset="100%" stopColor={(malam ? JENDELA.langitMalam : JENDELA.langit)[1]} />
      </linearGradient>
    </defs>
    <rect x={x - 18} y={y - 18} width={w + 36} height={h + 36} rx={10} fill={JENDELA.bingkai} />
    <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-kaca)`} />
    {malam && <circle cx={x + w * 0.7} cy={y + h * 0.28} r={Math.min(w, h) * 0.1} fill={JENDELA.bulan} />}
    <path d={`M${x} ${y + h * 0.75} L${x + w * 0.55} ${y} H${x + w * 0.78} L${x} ${y + h}`} fill={JENDELA.kilap} />
    <rect x={x + w / 2 - 8} y={y} width={16} height={h} fill={JENDELA.bingkai} />
    <rect x={x} y={y + h / 2 - 8} width={w} height={16} fill={JENDELA.bingkai} />
    {kisi && Array.from({length: Math.floor(h / 46)}, (_, i) => <rect key={i} x={x} y={y + i * 46} width={w} height={20} fill={JENDELA.bingkai} opacity={0.55} />)}
    <rect x={x - 34} y={y + h + 14} width={w + 68} height={20} rx={6} fill={JENDELA.bingkai} />
    {tirai && (
      <g fill={tirai}>
        <path d={`M${x - 70} ${y - 50} H${x + 40} Q${x + 10} ${y + h * 0.5} ${x + 50} ${y + h + 40} H${x - 70} Z`} />
        <path d={`M${x + w + 70} ${y - 50} H${x + w - 40} Q${x + w - 10} ${y + h * 0.5} ${x + w - 50} ${y + h + 40} H${x + w + 70} Z`} />
        <rect x={x - 90} y={y - 64} width={w + 180} height={16} rx={8} />
      </g>
    )}
  </g>
);

const Rak = ({x, y, w, tingkat = 2, kayu = 'kayu'}: {x: number; y: number; w: number; tingkat?: number; kayu?: NamaBahan}) => (
  <g>
    {Array.from({length: tingkat}, (_, t) => {
      const yy = y + t * 190;
      let cx = x + 16;
      const buku: ReactNode[] = [];
      for (let i = 0; cx < x + w * 0.72; i++) {
        const lebar = 26 + ((i * 7 + t * 3) % 4) * 6;
        const tinggi = 120 + ((i * 5 + t) % 3) * 22;
        buku.push(<rect key={i} x={cx} y={yy - tinggi} width={lebar} height={tinggi} rx={4} fill={BUKU[(i + t * 2) % BUKU.length]} />);
        cx += lebar + 4;
      }
      return (
        <g key={t}>
          {buku}
          <rect x={x} y={yy} width={w} height={16} rx={4} fill={BAHAN[kayu].sisi} />
          <rect x={x} y={yy + 16} width={w} height={10} fill={BAYANG_KONTAK} opacity={0.5} />
        </g>
      );
    })}
  </g>
);

const Bingkai = ({x, y, w, h, warna}: {x: number; y: number; w: number; h: number; warna: WarnaInterior}) => (
  <g>
    <rect x={x - 14} y={y - 14} width={w + 28} height={h + 28} rx={6} fill={warna.aksen[0]} />
    <rect x={x} y={y} width={w} height={h} fill={warna.aksen[2]} />
    <circle cx={x + w * 0.7} cy={y + h * 0.35} r={Math.min(w, h) * 0.16} fill={warna.aksen[1]} />
    <path d={`M${x} ${y + h} L${x + w * 0.35} ${y + h * 0.5} L${x + w * 0.6} ${y + h * 0.78} L${x + w * 0.8} ${y + h * 0.6} L${x + w} ${y + h} Z`} fill={warna.aksen[0]} opacity={0.7} />
  </g>
);

const Tanaman = ({x, y, skala = 1, pot}: {x: number; y: number; skala?: number; pot: string}) => (
  <g transform={`translate(${x} ${y}) scale(${skala})`}>
    {[-40, -18, 6, 30, 52].map((sudut, i) => (
      <path key={sudut} d="M0 -60 Q-34 -150 0 -250 Q34 -150 0 -60 Z" fill={DAUN[i % 2]} transform={`rotate(${sudut} 0 -60)`} />
    ))}
    <path d="M-56 -80 H56 L44 0 H-44 Z" fill={pot} />
    <rect x={-62} y={-92} width={124} height={20} rx={6} fill={pot} />
  </g>
);

// Lampu meja dengan genangan cahaya hangat. Kepala lampu condong ke `arah`.
export const LampuMeja = ({x, y, arah = 1}: {x: number; y: number; arah?: 1 | -1}) => (
  <g transform={`translate(${x} ${y}) scale(${arah} 1)`}>
    <ellipse cx={120} cy={-2} rx={170} ry={26} fill={W.lampuCahaya} opacity={0.35} />
    <ellipse cy={-6} rx={58} ry={14} fill={W.lampu} />
    <path d="M0 -12 L-30 -190 L80 -280" fill="none" stroke={W.lampu} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
    <g transform="translate(80 -280) rotate(32)">
      <path d="M-58 50 L-20 -24 H20 L58 50 Z" fill={W.lampu} />
      <ellipse cy={50} rx={58} ry={14} fill={W.lampuCahaya} />
    </g>
  </g>
);

const LampuGantung = ({x, y, panjang, id}: {x: number; y: number; panjang: number; id: string}) => (
  <g>
    <defs>
      <radialGradient id={id}>
        <stop offset="0%" stopColor={W.lampuCahaya} stopOpacity={0.45} />
        <stop offset="100%" stopColor={W.lampuCahaya} stopOpacity={0} />
      </radialGradient>
    </defs>
    <path d={`M${x} ${y - panjang} V${y}`} stroke={W.lampu} strokeWidth={5} />
    <circle cx={x} cy={y + 80} r={190} fill={`url(#${id})`} />
    <path d={`M${x - 80} ${y + 70} Q${x - 70} ${y} ${x} ${y} Q${x + 70} ${y} ${x + 80} ${y + 70} Z`} fill={W.lampu} />
    <ellipse cx={x} cy={y + 70} rx={58} ry={14} fill={W.lampuCahaya} />
  </g>
);

const LemariAtas = ({x, y, w, h, bahan}: {x: number; y: number; w: number; h: number; bahan: NamaBahan}) => {
  const pintu = Math.max(1, Math.round(w / 240));
  const b = BAHAN[bahan];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={b.sisi} />
      <rect x={x} y={y + h} width={w} height={22} fill={BAYANG_KONTAK} opacity={0.45} />
      {Array.from({length: pintu}, (_, i) => (
        <g key={i}>
          <rect x={x + (w / pintu) * i + 12} y={y + 14} width={w / pintu - 24} height={h - 28} rx={6} fill={b.gelap} opacity={0.25} />
          <rect x={x + (w / pintu) * (i + 0.5) - 6} y={y + h - 80} width={12} height={50} rx={6} fill={W.logam} />
        </g>
      ))}
    </g>
  );
};

const Ubin = ({x, y, w, h, warna}: {x: number; y: number; w: number; h: number; warna: string}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill={warna} />
    {Array.from({length: Math.ceil(w / 80)}, (_, i) => (
      <rect key={`v${i}`} x={x + i * 80} y={y} width={3} height={h} fill={BAYANG_KONTAK} opacity={0.25} />
    ))}
    {Array.from({length: Math.ceil(h / 60)}, (_, i) => (
      <rect key={`h${i}`} x={x} y={y + i * 60} width={w} height={3} fill={BAYANG_KONTAK} opacity={0.25} />
    ))}
  </g>
);

// Papan menu kafe tanpa tulisan nyata: hanya garis kapur.
const PapanMenu = ({x, y, w, h, warna}: {x: number; y: number; w: number; h: number; warna: WarnaInterior}) => (
  <g>
    <rect x={x - 16} y={y - 16} width={w + 32} height={h + 32} rx={10} fill={BAHAN.kayuTua.sisi} />
    <rect x={x} y={y} width={w} height={h} rx={6} fill={warna.aksen[1]} />
    {Array.from({length: 6}, (_, i) => (
      <g key={i} fill={warna.aksen[2]} opacity={0.6}>
        <rect x={x + 40} y={y + 60 + i * 70} width={w * (0.35 + ((i * 3) % 4) * 0.08)} height={12} rx={6} />
        <rect x={x + w - 110} y={y + 60 + i * 70} width={70} height={12} rx={6} />
      </g>
    ))}
  </g>
);

const KursiKerja = ({x, y}: {x: number; y: number}) => (
  <g>
    <rect x={x - 150} y={y - 470} width={300} height={420} rx={70} fill={W.lampu} />
    <rect x={x - 120} y={y - 440} width={240} height={360} rx={56} fill={W.laptopGelap} opacity={0.35} />
  </g>
);

const Pintu = ({x, y, w, h, warna}: {x: number; y: number; w: number; h: number; warna: WarnaInterior}) => (
  <g>
    <rect x={x - 12} y={y - 12} width={w + 24} height={h + 12} fill={warna.list} />
    <rect x={x} y={y} width={w} height={h} fill={warna.aksen[1]} />
    <rect x={x + w * 0.2} y={y + h * 0.12} width={w * 0.6} height={h * 0.22} rx={6} fill={JENDELA.kilap} />
    <rect x={x + w - 34} y={y + h * 0.52} width={14} height={60} rx={7} fill={W.logamGelap} />
  </g>
);

// Lorong IGD satu titik hilang: dinding samping, lantai mengilap, lampu langit-langit, dan pintu.
const Lorong = ({warna}: {warna: WarnaInterior}) => {
  const hilang = {x: 540, y: 820};
  const ujung = {kiri: 380, kanan: 700, atas: 650, bawah: 1000};
  return (
    <g>
      <rect x={KIRI} y={-900} width={LEBAR} height={3600} fill={warna.dinding} />
      <rect x={ujung.kiri} y={ujung.atas} width={ujung.kanan - ujung.kiri} height={ujung.bawah - ujung.atas} fill={warna.dindingBawah} />
      <path d={`M${KIRI} ${LANTAI + 900} L${ujung.kiri} ${ujung.bawah} H${ujung.kanan} L${KIRI + LEBAR} ${LANTAI + 900} Z`} fill={warna.lantai} />
      <path d={`M${KIRI} -400 L${ujung.kiri} ${ujung.atas} H${ujung.kanan} L${KIRI + LEBAR} -400 Z`} fill={warna.dindingBawah} opacity={0.5} />
      {[-0.6, -0.2, 0.2, 0.6].map((u) => (
        <path key={u} d={`M${hilang.x + u * 160} ${ujung.bawah} L${hilang.x + u * 2400} ${LANTAI + 900}`} stroke={warna.lantaiGaris} strokeWidth={6} />
      ))}
      {[0.25, 0.5, 0.75].map((t) => {
        const y = ujung.atas + (-400 - ujung.atas) * t;
        const setengah = 160 + t * 900;
        return <rect key={t} x={hilang.x - setengah * 0.35} y={y} width={setengah * 0.7} height={18 + t * 30} rx={8} fill={W.bantal} opacity={0.9} />;
      })}
      {/* Pita warna di dinding samping, mengarah ke titik hilang. */}
      <path d={`M${KIRI} 1180 L${ujung.kiri} 900 V930 L${KIRI} 1260 Z`} fill={warna.aksen[0]} />
      <path d={`M${KIRI + LEBAR} 1180 L${ujung.kanan} 900 V930 L${KIRI + LEBAR} 1260 Z`} fill={warna.aksen[0]} />
      <path d={`M90 560 L250 690 V1050 L90 1180 Z`} fill={warna.aksen[1]} />
      <path d={`M990 560 L830 690 V1050 L990 1180 Z`} fill={warna.aksen[1]} />
    </g>
  );
};

// ---------------- Kerangka ruangan ----------------
const Dinding = ({warna, garis = 1040}: {warna: WarnaInterior; garis?: number}) => (
  <g>
    <rect x={KIRI} y={-900} width={LEBAR} height={3600} fill={warna.dinding} />
    <rect x={KIRI} y={garis} width={LEBAR} height={Math.max(0, LANTAI - garis + 200)} fill={warna.dindingBawah} />
    <rect x={KIRI} y={garis - 10} width={LEBAR} height={14} fill={warna.list} />
  </g>
);

const Lantai = ({warna}: {warna: WarnaInterior}) => (
  <g>
    <rect x={KIRI} y={LANTAI} width={LEBAR} height={1200} fill={warna.lantai} />
    {Array.from({length: 18}, (_, i) => (
      <path key={i} d={`M${KIRI + i * 150} ${LANTAI} l-60 1200`} stroke={warna.lantaiGaris} strokeWidth={4} />
    ))}
    <rect x={KIRI} y={LANTAI - 26} width={LEBAR} height={30} fill={warna.list} />
  </g>
);

// Isi tiap varian. Meja dan tokoh berbagi kerangka yang sama: tokoh duduk di slot `tokoh` di belakang meja.
type IsiVarian = {
  belakang: (id: string, warna: WarnaInterior, malam: boolean) => ReactNode;
  lantai?: boolean;
  meja?: {ukuran: UkuranMeja; bahan: NamaBahan; gaya: GayaKaki};
  tengahBelakang?: (warna: WarnaInterior) => ReactNode;
  tengah?: (warna: WarnaInterior, frame: number) => ReactNode;
  depan: (warna: WarnaInterior) => ReactNode;
  sorot: HasilSet['sorot'];
  slot?: Record<string, Slot>;
};

const MEJA_KERJA: UkuranMeja = {kiri: -40, kanan: 1120, atas: 1150, lantai: LANTAI};
const MEJA_DAPUR: UkuranMeja = {kiri: -300, kanan: 1400, atas: 1250, lantai: LANTAI, kedalaman: 60, tebal: 34};
const MEJA_KAFE: UkuranMeja = {kiri: 120, kanan: 960, atas: 1180, lantai: LANTAI};
const NAKAS: UkuranMeja = {kiri: 700, kanan: 1000, atas: 1220, lantai: LANTAI};

const VARIAN: Record<VarianInterior, IsiVarian> = {
  kerja: {
    belakang: (id, w, malam) => (
      <g>
        <Dinding warna={w} />
        <Jendela x={60} y={300} w={380} h={520} kisi id={id} malam={malam} />
        <Rak x={620} y={560} w={420} />
        <Bingkai x={700} y={180} w={200} h={150} warna={w} />
      </g>
    ),
    lantai: true,
    // Meja kerja berpanel laci sampai lantai, jadi tokoh yang duduk di belakangnya hanya terlihat dari perut ke atas.
    meja: {ukuran: MEJA_KERJA, bahan: 'kayu', gaya: 'lemari'},
    tengahBelakang: () => <KursiKerja x={540} y={1180} />,
    tengah: () => <LampuMeja x={110} y={titikMeja(MEJA_KERJA, 0, 0.5).y} />,
    depan: (w) => (
      <g>
        <Tanaman x={1040} y={2020} skala={1.9} pot={w.aksen[0]} />
        <DaunDepan x={-80} y={2100} skala={1.3} putar={30} />
      </g>
    ),
    sorot: {x: 300, y: 1000, lebar: 620, jenis: 'samping', sisi: -1},
  },
  kamar: {
    belakang: (id, w, malam) => (
      <g>
        <Dinding warna={w} garis={1100} />
        <Jendela x={140} y={320} w={360} h={480} tirai={w.aksen[1]} id={id} malam={malam} />
        <Bingkai x={700} y={360} w={240} h={300} warna={w} />
      </g>
    ),
    lantai: true,
    meja: {ukuran: NAKAS, bahan: 'kayu', gaya: 'lemari'},
    tengahBelakang: () => <Properti nama="ranjang" x={260} y={LANTAI} skala={1.3} />,
    depan: (w) => <Tanaman x={-30} y={2050} skala={1.8} pot={w.aksen[2]} />,
    sorot: {x: 340, y: 1100, lebar: 600, jenis: 'samping', sisi: -1},
  },
  dapur: {
    belakang: (id, w, malam) => (
      <g>
        <Dinding warna={w} garis={2000} />
        <LemariAtas x={-300} y={140} w={560} h={420} bahan="dapur" />
        <LemariAtas x={820} y={140} w={600} h={420} bahan="dapur" />
        <Jendela x={330} y={250} w={420} h={400} id={id} malam={malam} />
        <Ubin x={-700} y={760} w={2500} h={500} warna={w.dindingBawah} />
      </g>
    ),
    lantai: true,
    meja: {ukuran: MEJA_DAPUR, bahan: 'dapur', gaya: 'lemari'},
    depan: (w) => <Properti nama="botol" x={1010} y={2010} skala={2.6} keadaan={{isi: 0.6}} />,
    sorot: {x: 540, y: 1100, lebar: 640, jenis: 'atas'},
  },
  kafe: {
    belakang: (_id, w) => (
      <g>
        <Dinding warna={w} garis={1180} />
        <PapanMenu x={150} y={260} w={420} h={520} warna={w} />
        <Rak x={650} y={520} w={380} kayu="kayuTua" />
      </g>
    ),
    lantai: true,
    meja: {ukuran: MEJA_KAFE, bahan: 'kayuTua', gaya: 'tiang'},
    tengahBelakang: () => (
      <g>
        <LampuGantung x={300} y={340} panjang={800} id="lampu-kafe-1" />
        <LampuGantung x={800} y={260} panjang={800} id="lampu-kafe-2" />
      </g>
    ),
    depan: (w) => <DaunDepan x={1150} y={2080} skala={1.4} putar={-30} />,
    sorot: {x: 540, y: 1100, lebar: 520, jenis: 'titik'},
  },
  klinik: {
    belakang: (_id, w) => <Lorong warna={w} />,
    tengahBelakang: () => <Properti nama="papan" x={540} y={560} skala={1.5} teks="IGD" />,
    depan: () => <Properti nama="ranjang" x={60} y={2160} skala={1.7} varian="klinik" />,
    sorot: {x: 540, y: 900, lebar: 560, jenis: 'atas'},
    slot: {lorong: {x: 540, y: 900}, papan: {x: 540, y: 520}, tokoh: {x: 540, y: 1340}},
  },
};

// Slot meja dihitung dari bagian meja yang ada di dalam area aman, jadi meja yang lebih lebar dari layar tetap punya slot terlihat.
// `tokoh` adalah bibir meja di tengah. Pemanggil memilih skala, lalu menurunkan pinggang tokoh 30 satuan rig dari bibir.
const AMAN_KIRI = 120;
const AMAN_KANAN = 960;
const slotMeja = (m: UkuranMeja): Record<string, Slot> => {
  const terlihat = {...m, kiri: Math.max(m.kiri, AMAN_KIRI), kanan: Math.min(m.kanan, AMAN_KANAN)};
  return {
    'meja.atas': titikMeja(terlihat, 0.5),
    'meja.kiri': titikMeja(terlihat, 0.22),
    'meja.kanan': titikMeja(terlihat, 0.8),
    'meja.tepiKiri': titikMeja(terlihat, 0.05),
    'meja.tepiKanan': titikMeja(terlihat, 0.95),
    tokoh: {x: (terlihat.kiri + terlihat.kanan) / 2, y: m.atas},
  };
};

export const setInterior = (varian: VarianInterior, {id = `interior-${varian}`, malam = false}: {id?: string; malam?: boolean} = {}): HasilSet => {
  const isi = VARIAN[varian];
  const warna = INTERIOR[varian];
  const belakang = isi.belakang(malam ? `${id}-malam` : id, warna, malam);
  return {
    belakang,
    tengahBelakang: (
      <g>
        {isi.lantai && <Lantai warna={warna} />}
        {isi.tengahBelakang?.(warna)}
      </g>
    ),
    tengah: (
      <g>
        {isi.meja && <MejaSamping ukuran={isi.meja.ukuran} bahan={isi.meja.bahan} gaya={isi.meja.gaya} />}
        <IsiTengah isi={isi} warna={warna} />
      </g>
    ),
    depan: isi.depan(warna),
    slot: {...(isi.meja ? slotMeja(isi.meja.ukuran) : {}), ...isi.slot},
    sorot: isi.sorot,
    pakaiLatar: false,
    lantai: LANTAI,
  };
};

const IsiTengah = ({isi, warna}: {isi: IsiVarian; warna: WarnaInterior}) => {
  const frame = useCurrentFrame();
  return <>{isi.tengah?.(warna, frame)}</>;
};
