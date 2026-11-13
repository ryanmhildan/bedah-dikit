import {createContext, useContext, useId, type ReactNode} from 'react';
import {random, useCurrentFrame} from 'remotion';
import {FONT} from '../DataShort';
import {BAYANG_KONTAK, MAKANAN as M, OTAK, ORANG, PENGHITUNG, PROPERTI as W, TABUNG, TIDUR, WAHANA} from '../tema';
import {Kapsaisin} from './molekul';

// Properti: benda yang dipegang, ditaruh, atau bertindak. Terpisah dari ikon, yang hanya simbol.
// Semua digambar sebagai <g> SVG dengan titik asal di alas tengah (tampak samping) atau pusat (tampak atas),
// dalam piksel pada skala 1. Titik `pegang` adalah tempat ujung tangan menggenggam.

export type KeadaanProperti = {
  // 0..1 kekuatan uap.
  uap?: number;
  // 0..1 isi wadah.
  isi?: number;
  // 0..1 kekuatan getar.
  getar?: number;
  // 0..1 seberapa jauh isi tumpah.
  tumpah?: number;
  // 0..1 posisi tanda, misalnya garis batas gelas atau jarum bayangan di meter.
  tanda?: number;
  // Jumlah molekul yang mengapung di wadah, misalnya kapsaisin di air.
  partikel?: number;
};

export type Tampak = 'samping' | 'atas' | 'depan' | 'belakang';

type Gambar = {keadaan: KeadaanProperti; tampak: Tampak; frame: number; varian?: string; teks?: string; cermin?: boolean};

const batas01 = (v: number | undefined, awal: number) => Math.min(1, Math.max(0, v ?? awal));

// Uap: tiga garis bergelombang yang naik dan memudar. Gerak dihitung dari frame.
const Uap = ({kuat, frame, lebar = 30, tinggi = 90, y = 0, warna = W.uap, tebal = 7}: {kuat: number; frame: number; lebar?: number; tinggi?: number; y?: number; warna?: string; tebal?: number}) => {
  if (kuat <= 0) return null;
  return (
    <g fill="none" stroke={warna} strokeWidth={tebal} strokeLinecap="round" opacity={kuat}>
      {[-1, 0, 1].map((i) => {
        const titik = Array.from({length: 9}, (_, j) => {
          const h = (j / 8) * tinggi;
          const x = i * lebar + Math.sin((h + frame * 2.4 + i * 40) / 16) * (4 + j * 0.9);
          return `${j === 0 ? 'M' : 'L'}${x.toFixed(1)} ${(y - h).toFixed(1)}`;
        }).join(' ');
        return <path key={i} d={titik} opacity={0.75 - Math.abs(i) * 0.15} strokeDasharray={`${tinggi * 0.7} ${tinggi}`} strokeDashoffset={-((frame * 1.6 + i * 25) % (tinggi * 1.7))} />;
      })}
    </g>
  );
};

// Bayangan kontak hanya untuk benda yang berdiri di permukaan. Benda yang digenggam atau melayang tidak berbayang.
const AdaBayang = createContext(true);
const Bayang = ({lebar, y = 0}: {lebar: number; y?: number}) => (useContext(AdaBayang) ? <ellipse cy={y + 2} rx={lebar} ry={lebar * 0.14} fill={BAYANG_KONTAK} /> : null);

// ---------------- Cangkir ----------------
const CANGKIR_BADAN = 'M-42 -76 H42 L36 -12 Q34 0 22 0 H-22 Q-34 0 -36 -12 Z';
const CANGKIR_PITA = 'M-39.3 -44 H39.3 L36 -12 Q34 0 22 0 H-22 Q-34 0 -36 -12 Z';

// Riak di permukaan kopi saat cangkir bergetar: lingkaran yang meluas dari tengah.
const Riak = ({r, getar, frame}: {r: number; getar: number; frame: number}) =>
  getar <= 0 ? null : (
    <g fill="none" stroke={W.busa} strokeWidth={3}>
      {[0, 1, 2].map((i) => {
        const t = ((frame * 0.09 + i / 3) % 1 + 1) % 1;
        return <circle key={i} r={r * (0.15 + t * 0.85)} opacity={getar * (1 - t) * 0.8} />;
      })}
    </g>
  );

// Label gantung di gagang cangkir, untuk angka yang menempel pada benda. Teks tidak ikut tercermin.
const LabelGantung = ({teks, cermin}: {teks: string; cermin?: boolean}) => {
  const ukuran = 34;
  const lebar = teks.length * ukuran * 0.6 + 26;
  return (
    <g>
      <path d="M58 -40 Q74 -10 70 16" fill="none" stroke={W.tali} strokeWidth={3} />
      <g transform={`translate(70 16) scale(${cermin ? -1 : 1} 1)`}>
        <rect x={-lebar / 2} y={0} width={lebar} height={ukuran * 1.45} rx={10} fill={W.labelLatar} />
        <text x={0} y={ukuran * 1.05} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={ukuran} fill={W.labelTeks}>
          {teks}
        </text>
      </g>
    </g>
  );
};

const Cangkir = ({keadaan, tampak, frame, teks, cermin}: Gambar) => {
  const isi = batas01(keadaan.isi, 0.85);
  const uap = batas01(keadaan.uap, 0);
  const tumpah = batas01(keadaan.tumpah, 0);
  const getar = batas01(keadaan.getar, 0);
  if (tampak === 'atas') {
    return (
      <g>
        <circle r={50} cx={4} cy={6} fill={BAYANG_KONTAK} />
        <rect x={40} y={-10} width={32} height={20} rx={10} fill={W.keramik} />
        <circle r={48} fill={W.keramik} />
        <circle r={48} fill="none" stroke={W.keramikBayang} strokeWidth={4} />
        {isi > 0 && <circle r={39 * (0.75 + isi * 0.25)} fill={W.kopi} />}
        {isi > 0 && <path d="M-26 -14 Q-14 -28 4 -28" fill="none" stroke={W.busa} strokeWidth={5} strokeLinecap="round" opacity={0.7 * (1 - getar)} />}
        {isi > 0 && <Riak r={39 * (0.75 + isi * 0.25)} getar={getar} frame={frame} />}
        <Uap kuat={uap} frame={frame} lebar={14} tinggi={60} y={-10} />
      </g>
    );
  }
  return (
    <g>
      {tumpah > 0 && <ellipse cx={60 + tumpah * 40} cy={2} rx={20 + tumpah * 90} ry={5 + tumpah * 9} fill={W.kopi} opacity={0.9} />}
      <Bayang lebar={44} />
      <g transform={`rotate(${tumpah * 96} 36 0)`}>
        <path d="M36 -62 Q68 -62 66 -40 Q64 -20 34 -22" fill="none" stroke={W.keramik} strokeWidth={11} strokeLinecap="round" />
        <path d={CANGKIR_BADAN} fill={W.keramik} />
        <path d={CANGKIR_PITA} fill={W.cangkirAksen} />
        <path d="M14 -76 H42 L36 -12 Q34 0 22 0 H8 Z" fill={W.keramikBayang} opacity={0.35} />
        <ellipse cy={-76} rx={42} ry={9} fill={W.keramikBayang} />
        {isi > 0 && <ellipse cy={-75 + (1 - isi) * 4} rx={36} ry={6.5} fill={W.kopi} />}
        <Uap kuat={uap * (1 - tumpah)} frame={frame} lebar={16} tinggi={80} y={-90} />
        {teks && <LabelGantung teks={teks} cermin={cermin} />}
      </g>
    </g>
  );
};

// ---------------- Noda cincin kopi (tampak atas) ----------------
const Noda = ({varian}: Gambar) => {
  const seed = varian ?? 'noda';
  const putar = random(`${seed}-putar`) * 360;
  return (
    <g transform={`rotate(${putar})`}>
      <circle r={45} fill="none" stroke={W.noda} strokeWidth={5} />
      <path d="M-44 -8 A45 45 0 0 1 10 -44" fill="none" stroke={W.noda} strokeWidth={10} strokeLinecap="round" />
      <circle cx={50 + random(`${seed}-tetes`) * 12} cy={18} r={5} fill={W.noda} />
    </g>
  );
};

// ---------------- Gelas ukur ----------------
// Label angka yang menempel di benda: kotak putih, angka tebal.
// `rata` kiri: (x, y) di tepi kiri tengah label. `tengah`: (x, y) di tengah label.
export const LabelUkur = ({x, y, teks, ukuran = 40, skala = 1, rata = 'kiri'}: {x: number; y: number; teks: string; ukuran?: number; skala?: number; rata?: 'kiri' | 'tengah'}) => {
  const lebar = teks.length * ukuran * 0.58 + ukuran * 0.7;
  return (
    <g transform={`translate(${x} ${y}) scale(${skala}) translate(${rata === 'tengah' ? -lebar / 2 : 0} 0)`}>
      <rect y={-ukuran * 0.72} width={lebar} height={ukuran * 1.44} rx={ukuran * 0.4} fill={W.labelLatar} />
      <text x={lebar / 2} y={ukuran * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={ukuran} fill={W.labelTeks}>
        {teks}
      </text>
    </g>
  );
};

// Garis ukur dihitung dari nilai: tinggi garis = nilai x `perSatuan`, dengan dasar gelas sebagai nol.
// `skala` dipakai untuk pop label, 1 berarti ukuran penuh.
export type GarisUkur = {nilai: number; label?: string; skala?: number};

const TEBAL_KACA = 9;
const TEBAL_DASAR = 16;

export const GelasUkur = ({
  tinggi,
  lebar = 300,
  perSatuan,
  isi = 0,
  garis = [],
  langkah,
  ukuranLabel = 40,
  bagian = 'semua',
}: {
  // Tinggi ruang dalam gelas, dalam piksel dunia.
  tinggi: number;
  // Lebar ruang dalam.
  lebar?: number;
  // Piksel per satuan nilai, misalnya per mg.
  perSatuan: number;
  // Isi dalam satuan nilai.
  isi?: number;
  garis?: GarisUkur[];
  // Jarak garis kecil tanpa label, dalam satuan nilai.
  langkah?: number;
  ukuranLabel?: number;
  // `label` hanya menggambar label, untuk lapisan di atas lensa supaya angka tidak ikut terwarnai suasana.
  bagian?: 'semua' | 'gelas' | 'label';
}) => {
  const kiri = -lebar / 2;
  const dasar = -TEBAL_DASAR;
  const atas = dasar - tinggi;
  const yNilai = (nilai: number) => dasar - nilai * perSatuan;
  const tinggiIsi = Math.min(tinggi, Math.max(0, isi * perSatuan));
  const pakaiLabel = bagian !== 'gelas';
  const kecil = langkah ? Array.from({length: Math.floor(tinggi / (langkah * perSatuan))}, (_, i) => (i + 1) * langkah) : [];
  if (bagian === 'label') {
    return (
      <g>
        {garis.map(({nilai, label, skala = 1}) => {
          const y = yNilai(nilai);
          if (!label || skala <= 0 || y < atas + 4) return null;
          return <LabelUkur key={nilai} x={kiri + 68} y={y} teks={label} ukuran={ukuranLabel} skala={skala} />;
        })}
      </g>
    );
  }
  return (
    <g>
      <Bayang lebar={lebar * 0.62} />
      {/* Dinding belakang kaca. */}
      <rect x={kiri - TEBAL_KACA} y={atas} width={lebar + TEBAL_KACA * 2} height={tinggi + TEBAL_DASAR} rx={18} fill={W.kaca} />
      {tinggiIsi > 0 && (
        <g>
          <rect x={kiri} y={dasar - tinggiIsi} width={lebar} height={tinggiIsi} rx={6} fill={W.kopi} />
          <rect x={kiri} y={dasar - tinggiIsi} width={lebar} height={Math.min(14, tinggiIsi)} fill={W.busa} opacity={0.85} />
          <rect x={kiri + lebar * 0.62} y={dasar - tinggiIsi + 14} width={lebar * 0.2} height={Math.max(0, tinggiIsi - 20)} fill={W.kopiTerang} opacity={0.35} />
        </g>
      )}
      {kecil.map((nilai) => (
        <rect key={nilai} x={kiri} y={yNilai(nilai) - 2} width={26} height={4} rx={2} fill={W.garis} opacity={0.7} />
      ))}
      {garis.map(({nilai, label, skala = 1}) => {
        const y = yNilai(nilai);
        if (y < atas + 4) return null;
        return (
          <g key={nilai}>
            <rect x={kiri} y={y - 3.5} width={58} height={7} rx={3.5} fill={W.garis} />
            {pakaiLabel && label && skala > 0 && <LabelUkur x={kiri + 68} y={y} teks={label} ukuran={ukuranLabel} skala={skala} />}
          </g>
        );
      })}
      {/* Dinding kaca, kilap, dan bibir gelas. */}
      <path
        d={`M${kiri - TEBAL_KACA} ${atas} V${-18} Q${kiri - TEBAL_KACA} 0 ${kiri + 10} 0 H${-kiri - 10} Q${-kiri + TEBAL_KACA} 0 ${-kiri + TEBAL_KACA} ${-18} V${atas}`}
        fill="none"
        stroke={W.kacaTepi}
        strokeWidth={TEBAL_KACA}
        strokeLinejoin="round"
      />
      <rect x={-kiri - 34} y={atas + 30} width={12} height={Math.max(0, tinggi - 60)} rx={6} fill={W.kacaKilap} />
      <ellipse cx={0} cy={atas} rx={lebar / 2 + TEBAL_KACA} ry={12} fill="none" stroke={W.kacaTepi} strokeWidth={6} />
      <path d={`M${kiri - TEBAL_KACA} ${atas} q-22 -6 -30 -20`} fill="none" stroke={W.kacaTepi} strokeWidth={TEBAL_KACA} strokeLinecap="round" />
    </g>
  );
};

// Aliran tuang dari bibir wadah ke permukaan isi. Sedikit bergelombang supaya terlihat cair.
export const AliranTuang = ({dari, ke, lebar = 14, frame}: {dari: {x: number; y: number}; ke: {x: number; y: number}; lebar?: number; frame: number}) => {
  const tengah = (dari.y + ke.y) / 2;
  const goyang = Math.sin(frame / 2.3) * 3;
  return (
    <path
      d={`M${dari.x} ${dari.y} Q${dari.x + 12} ${dari.y + 10} ${dari.x + 14 + goyang} ${tengah} T${ke.x + goyang * 0.5} ${ke.y}`}
      fill="none"
      stroke={W.kopi}
      strokeWidth={lebar}
      strokeLinecap="round"
    />
  );
};

const GelasBawaan = ({keadaan}: Gambar) => <GelasUkur tinggi={260} lebar={160} perSatuan={260} isi={batas01(keadaan.isi, 0.5)} langkah={0.25} />;

// ---------------- Sendok berisi bubuk ----------------
// Varian `sambal` mengisi sendok dengan sambal merah. Tampak atas untuk sisipan meja.
const Sendok = ({keadaan, varian, tampak}: Gambar) => {
  const isi = batas01(keadaan.isi, 1);
  const tumpah = batas01(keadaan.tumpah, 0);
  const sambal = varian === 'sambal';
  const muatan = sambal ? M.sambal : W.bubuk;
  const muatanBayang = sambal ? M.sambalTerang : W.bubukBayang;
  if (tampak === 'atas') {
    return (
      <g>
        <ellipse cx={4} cy={6} rx={52} ry={40} fill={BAYANG_KONTAK} />
        <path d="M-40 0 L-200 -6" stroke={W.logamGelap} strokeWidth={18} strokeLinecap="round" />
        <path d="M-40 -2 L-200 -8" stroke={W.logam} strokeWidth={12} strokeLinecap="round" />
        <ellipse rx={50} ry={38} fill={W.logam} />
        <ellipse rx={42} ry={30} fill={W.logamGelap} opacity={0.5} />
        {isi > 0 && (
          <g transform={`scale(${0.6 + isi * 0.4})`}>
            <ellipse rx={38} ry={27} fill={muatan} />
            <ellipse cx={-10} cy={-8} rx={16} ry={10} fill={muatanBayang} />
            {sambal && [[-14, 8], [10, -10], [18, 10]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3.5} fill={M.sambalBiji} />)}
          </g>
        )}
      </g>
    );
  }
  return (
    <g>
      <Bayang lebar={60} />
      {tumpah > 0 && <ellipse cx={66} cy={0} rx={14 + tumpah * 46} ry={4 + tumpah * 6} fill={muatan} />}
      <path d="M-30 -14 C-80 -20 -130 -30 -176 -30" fill="none" stroke={W.logamGelap} strokeWidth={14} strokeLinecap="round" />
      <path d="M-30 -16 C-80 -22 -130 -32 -176 -32" fill="none" stroke={W.logam} strokeWidth={10} strokeLinecap="round" />
      <path d="M-46 -16 Q-46 2 0 2 Q46 2 48 -18 Z" fill={W.logamGelap} />
      <ellipse cy={-17} rx={48} ry={10} fill={W.logam} />
      {isi > 0 && (
        <g transform={`translate(0 -17) scale(1 ${isi})`}>
          <path d="M-40 0 Q-30 -30 -4 -36 Q26 -38 40 0 Z" fill={muatan} />
          <path d="M8 -34 Q30 -28 40 0 H14 Z" fill={muatanBayang} opacity={0.7} />
        </g>
      )}
    </g>
  );
};

// ---------------- Pil ----------------
const Pil = ({varian}: Gambar) => {
  if (varian === 'kapsul') {
    return (
      <g>
        <Bayang lebar={34} />
        <path d="M0 -26 H-20 A13 13 0 0 0 -20 0 H0 Z" fill={W.pil[2]} />
        <path d="M0 -26 H20 A13 13 0 0 1 20 0 H0 Z" fill={W.pil[0]} />
        <path d="M-24 -20 H18" stroke={W.kacaKilap} strokeWidth={4} strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      <Bayang lebar={28} />
      <path d="M-26 -14 V-6 Q-26 2 0 2 Q26 2 26 -6 V-14 Z" fill={W.pil[1]} />
      <ellipse cy={-14} rx={26} ry={10} fill={W.pil[0]} />
      <path d="M-14 -16 L14 -12" stroke={W.pilGaris} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

// ---------------- Jam weker ----------------
// Varian `sapu`: juring dari angka 12 sampai jarum jam terisi, dibagi garis per jam, ditambah 12 tanda jam di tepi muka.
// Dipakai untuk lama waktu dalam jam, misalnya tidur 7 jam: `isi` 7/12 membuat tujuh juring terisi.
const SapuJam = ({jam}: {jam: number}) => {
  const r = 46;
  const sudut = Math.min(359.9, Math.max(0, jam));
  const titikDi = (d: number, rr: number) => ({x: Math.sin((d * Math.PI) / 180) * rr, y: -74 - Math.cos((d * Math.PI) / 180) * rr});
  const ujung = titikDi(sudut, r);
  return (
    <g>
      {sudut > 0.5 && <path d={`M0 -74 L0 ${-74 - r} A${r} ${r} 0 ${sudut > 180 ? 1 : 0} 1 ${ujung.x.toFixed(2)} ${ujung.y.toFixed(2)} Z`} fill={W.jamSapu} />}
      {Array.from({length: 12}, (_, i) => {
        if (i * 30 > sudut + 1e-6) return null;
        const p = titikDi(i * 30, r);
        return <path key={`b-${i}`} d={`M0 -74 L${p.x.toFixed(2)} ${p.y.toFixed(2)}`} stroke={W.jamSapuGaris} strokeWidth={2.5} />;
      })}
      {Array.from({length: 12}, (_, i) => {
        const a = titikDi(i * 30, 41);
        const b = titikDi(i * 30, 47);
        return <path key={i} d={`M${a.x.toFixed(2)} ${a.y.toFixed(2)} L${b.x.toFixed(2)} ${b.y.toFixed(2)}`} stroke={W.jarum} strokeWidth={i % 3 ? 2 : 3.5} strokeLinecap="round" opacity={0.7} />;
      })}
    </g>
  );
};

const JamWeker = ({keadaan, frame, varian}: Gambar) => {
  const getar = batas01(keadaan.getar, 0);
  const jam = (keadaan.isi ?? 10 / 12) * 360;
  const goyang = getar * Math.sin(frame * 1.9) * 6;
  return (
    <g>
      <Bayang lebar={56} />
      <g transform={`rotate(${goyang} 0 -10)`}>
        <path d="M-40 -18 L-52 0 M40 -18 L52 0" stroke={W.jarum} strokeWidth={9} strokeLinecap="round" />
        <circle cx={-42} cy={-128} r={22} fill={W.jam} transform="rotate(-24 -42 -128)" />
        <circle cx={42} cy={-128} r={22} fill={W.jam} transform="rotate(24 42 -128)" />
        <circle cy={-74} r={62} fill={W.jam} />
        <circle cy={-74} r={49} fill={W.jamMuka} />
        {varian === 'sapu' && <SapuJam jam={jam} />}
        <path d={`M0 -74 L${Math.sin((jam * Math.PI) / 180) * 26} ${-74 - Math.cos((jam * Math.PI) / 180) * 26}`} stroke={W.jarum} strokeWidth={8} strokeLinecap="round" />
        <path d={`M0 -74 L${Math.sin((jam * 12 * Math.PI) / 180) * 38} ${-74 - Math.cos((jam * 12 * Math.PI) / 180) * 38}`} stroke={W.jarum} strokeWidth={5} strokeLinecap="round" />
        <circle cy={-74} r={6} fill={W.jarum} />
      </g>
      {getar > 0 && (
        <g fill="none" stroke={W.jam} strokeWidth={6} strokeLinecap="round" opacity={getar * (0.5 + 0.5 * Math.abs(Math.sin(frame / 3)))}>
          <path d="M-78 -150 q-14 14 -4 30 M-96 -160 q-20 22 -6 46" />
          <path d="M78 -150 q14 14 4 30 M96 -160 q20 22 6 46" />
        </g>
      )}
    </g>
  );
};

// ---------------- Laptop ----------------
const Laptop = ({tampak, frame}: Gambar) => {
  const kedip = 0.85 + 0.15 * Math.sin(frame / 9);
  if (tampak === 'atas') {
    return (
      <g>
        <rect x={-150} y={-100} width={300} height={204} rx={16} fill={BAYANG_KONTAK} transform="translate(6 8)" />
        <rect x={-150} y={-100} width={300} height={204} rx={16} fill={W.laptop} />
        <rect x={-150} y={-118} width={300} height={22} rx={8} fill={W.laptopGelap} />
        {Array.from({length: 4}, (_, r) =>
          Array.from({length: 11}, (_, c) => <rect key={`${r}-${c}`} x={-128 + c * 23.5} y={-82 + r * 23} width={19} height={18} rx={4} fill={W.tuts} />),
        )}
        <rect x={-46} y={22} width={92} height={62} rx={8} fill={W.laptopGelap} opacity={0.6} />
      </g>
    );
  }
  if (tampak === 'belakang') {
    // Punggung layar menghadap kamera. Cahaya layar memancar di tepinya.
    return (
      <g>
        <ellipse cy={-90} rx={200} ry={130} fill={W.cahayaLayar} opacity={0.16 * kedip} />
        <Bayang lebar={150} />
        <rect x={-150} y={-12} width={300} height={12} rx={5} fill={W.laptopGelap} />
        <path d="M-136 -10 L-142 -200 Q-142 -210 -132 -210 H132 Q142 -210 142 -200 L136 -10 Z" fill={W.laptop} />
        <path d="M60 -210 H132 Q142 -210 142 -200 L136 -10 H44 Z" fill={W.laptopGelap} opacity={0.3} />
        <rect x={-142} y={-212} width={284} height={4} rx={2} fill={W.cahayaLayar} opacity={0.6 * kedip} />
      </g>
    );
  }
  return (
    <g>
      <Bayang lebar={150} />
      <path d="M-160 0 L-136 -16 H136 L160 0 Z" fill={W.laptopGelap} />
      <rect x={-132} y={-212} width={264} height={196} rx={10} fill={W.laptop} />
      <rect x={-120} y={-200} width={240} height={172} rx={4} fill={W.layar} />
      <g fill={W.cahayaLayar} opacity={0.7 * kedip}>
        <rect x={-104} y={-184} width={120} height={14} rx={7} />
        <rect x={-104} y={-158} width={200} height={10} rx={5} opacity={0.6} />
        <rect x={-104} y={-140} width={170} height={10} rx={5} opacity={0.6} />
        <rect x={-104} y={-110} width={90} height={60} rx={6} opacity={0.4} />
      </g>
    </g>
  );
};

// ---------------- Piring ----------------
const Piring = ({tampak}: Gambar) => {
  if (tampak === 'atas') {
    return (
      <g>
        <circle r={112} cx={5} cy={7} fill={BAYANG_KONTAK} />
        <circle r={112} fill={W.piring} />
        <circle r={74} fill={W.piringBayang} opacity={0.45} />
        <circle r={70} fill={W.piring} />
      </g>
    );
  }
  return (
    <g>
      <Bayang lebar={100} />
      <path d="M-60 -4 H60 L48 0 H-48 Z" fill={W.piringBayang} />
      <ellipse cy={-12} rx={116} ry={18} fill={W.piring} />
      <ellipse cy={-14} rx={74} ry={9} fill={W.piringBayang} opacity={0.5} />
    </g>
  );
};

// ---------------- Botol ----------------
const Botol = ({keadaan}: Gambar) => {
  const isi = batas01(keadaan.isi, 0.7);
  const tumpah = batas01(keadaan.tumpah, 0);
  const tinggiIsi = 150 * isi;
  return (
    <g>
      {tumpah > 0 && <ellipse cx={90 + tumpah * 50} cy={2} rx={20 + tumpah * 80} ry={5 + tumpah * 8} fill={W.botol} />}
      <Bayang lebar={40} />
      <g transform={`rotate(${tumpah * 92} 36 0)`}>
        <path d="M-36 -150 Q-36 -176 -16 -186 V-214 H16 V-186 Q36 -176 36 -150 V-12 Q36 0 24 0 H-24 Q-36 0 -36 -12 Z" fill={W.kaca} />
        <path d={`M-36 ${-tinggiIsi} H36 V-12 Q36 0 24 0 H-24 Q-36 0 -36 -12 Z`} fill={W.botol} />
        <rect x={-36} y={-120} width={72} height={56} fill={W.botolLabel} />
        <rect x={-20} y={-232} width={40} height={24} rx={6} fill={W.botolTutup} />
        <rect x={18} y={-150} width={8} height={130} rx={4} fill={W.kacaKilap} />
      </g>
    </g>
  );
};

// ---------------- Ranjang ----------------
const Ranjang = ({varian}: Gambar) => {
  const klinik = varian === 'klinik';
  return (
    <g>
      <Bayang lebar={300} />
      {[-240, 240].map((x) => (
        <g key={x}>
          <rect x={x - 7} y={-120} width={14} height={104} fill={W.ranjangRangka} />
          {klinik && <circle cx={x} cy={-12} r={12} fill={W.ranjangRangka} />}
        </g>
      ))}
      <rect x={-262} y={klinik ? -270 : -230} width={16} height={klinik ? 170 : 130} rx={8} fill={W.ranjangRangka} />
      <rect x={-256} y={-134} width={512} height={22} rx={8} fill={W.ranjangRangka} />
      <rect x={-250} y={-190} width={500} height={60} rx={18} fill={W.ranjang} />
      <rect x={-236} y={-226} width={130} height={46} rx={22} fill={W.bantal} />
      <path d="M-90 -196 Q60 -210 250 -192 V-142 Q250 -126 232 -126 H-90 Z" fill={W.selimut} />
      {klinik && <rect x={-200} y={-262} width={400} height={10} rx={5} fill={W.ranjangRangka} opacity={0.8} />}
    </g>
  );
};

// ---------------- Papan penunjuk ----------------
const Papan = ({teks = 'IGD', varian}: Gambar) => {
  const arah = varian === 'kiri' ? -1 : 1;
  const ukuran = 64;
  const lebar = teks.length * ukuran * 0.66 + 170;
  return (
    <g>
      <path d={`M${-lebar / 2 + 30} -150 L-30 -230 M${lebar / 2 - 30} -150 L30 -230`} stroke={W.ranjangRangka} strokeWidth={5} />
      <rect x={-lebar / 2} y={-150} width={lebar} height={110} rx={18} fill={W.papan} />
      <text x={-lebar / 2 + 36} y={-72} fontFamily={FONT} fontWeight={900} fontSize={ukuran} fill={W.papanTeks}>
        {teks}
      </text>
      <g transform={`translate(${lebar / 2 - 62} -95) scale(${arah} 1)`}>
        <path d="M-26 0 H22 M4 -20 L24 0 L4 20" fill="none" stroke={W.papanTeks} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
};

// ---------------- Pintu ----------------
// Pintu tertutup dengan tanda tetes air (kamar mandi) dan cahaya dari celah bawah. Keadaan `isi` 0..1 adalah terang cahaya di balik pintu.
const Pintu = ({keadaan, varian}: Gambar) => {
  const cahaya = batas01(keadaan.isi, 1);
  return (
    <g>
      <ellipse cy={14} rx={300 * cahaya} ry={44} fill={W.cahayaPintu} opacity={0.5 * cahaya} />
      <ellipse cy={8} rx={190 * cahaya} ry={18} fill={W.cahayaPintu} opacity={0.7 * cahaya} />
      <rect x={-170} y={-640} width={340} height={640} fill={W.pintuBayang} />
      <rect x={-150} y={-620} width={300} height={612} rx={6} fill={W.pintu} />
      <rect x={-120} y={-580} width={240} height={230} rx={10} fill={W.pintuBayang} opacity={0.45} />
      <rect x={-120} y={-320} width={240} height={270} rx={10} fill={W.pintuBayang} opacity={0.45} />
      <circle cx={112} cy={-300} r={14} fill={W.logamGelap} />
      {varian !== 'polos' && (
        <g transform="translate(0 -470)">
          <circle r={46} fill={W.labelLatar} />
          <path d="M0 -30 C14 -10 22 2 22 12 A22 22 0 0 1 -22 12 C-22 2 -14 -10 0 -30 Z" fill={W.tanda} />
        </g>
      )}
      <rect x={-150} y={-16} width={300} height={16} fill={W.cahayaPintu} opacity={cahaya} />
    </g>
  );
};

// ---------------- Cabai ----------------
// Cabai berbaring, tangkai di kiri dan ujung melengkung ke kanan bawah. Varian `hijau`, atau `belah` yang terbelah memanjang
// sehingga daging, plasenta putih, dan bijinya terlihat. Tampak atas memakai gambar yang sama.
const BADAN_CABAI = 'M-86 -52 C-40 -78 40 -70 92 -34 Q118 -14 126 6 Q96 -6 60 -14 C10 -22 -48 -18 -88 -22 Q-100 -38 -86 -52 Z';
const Cabai = ({varian}: Gambar) => {
  const hijau = varian === 'hijau';
  const belah = varian === 'belah';
  return (
    <g>
      <Bayang lebar={90} />
      <path d={BADAN_CABAI} fill={hijau ? M.cabaiHijau : M.cabai} />
      {belah ? (
        <g>
          <path d="M-74 -46 C-30 -64 34 -58 80 -30 Q98 -18 104 -8 Q80 -14 52 -20 C8 -28 -40 -26 -78 -28 Q-86 -38 -74 -46 Z" fill={M.daging} />
          <path d="M-70 -38 C-20 -50 40 -44 92 -18" stroke={W.keramik} strokeWidth={10} strokeLinecap="round" fill="none" />
          {Array.from({length: 9}, (_, i) => (
            <ellipse key={i} cx={-58 + i * 17} cy={-40 + i * 2.6 + (i % 2) * 7 - 3} rx={6} ry={4} fill={M.biji} transform={`rotate(${-12 + i * 3} ${-58 + i * 17} ${-40 + i * 2.6})`} />
          ))}
        </g>
      ) : (
        <path d="M-60 -58 C-20 -70 40 -62 80 -38" stroke={M.cabaiKilau} strokeWidth={9} strokeLinecap="round" fill="none" />
      )}
      {!belah && <path d="M-40 -20 C10 -22 50 -16 90 -6" stroke={M.cabaiGelap} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.45} />}
      {/* Kelopak dan tangkai. */}
      <path d="M-92 -54 Q-112 -46 -106 -30 Q-98 -16 -84 -20 Q-96 -36 -92 -54 Z" fill={M.tangkai} />
      <path d="M-100 -40 Q-130 -48 -132 -84" stroke={M.tangkai} strokeWidth={10} strokeLinecap="round" fill="none" />
    </g>
  );
};

// ---------------- Cobek dan sambal ----------------
// Cobek batu dengan sambal dan ulekan. `isi` banyaknya sambal.
const BijiSambal = ({rx, ry, seed}: {rx: number; ry: number; seed: string}) => (
  <g fill={M.sambalBiji}>
    {Array.from({length: 14}, (_, i) => {
      const a = random(`${seed}-a-${i}`) * Math.PI * 2;
      const d = Math.sqrt(random(`${seed}-d-${i}`)) * 0.85;
      return <ellipse key={i} cx={Math.cos(a) * rx * d} cy={Math.sin(a) * ry * d} rx={4} ry={3} />;
    })}
  </g>
);

const Cobek = ({keadaan, tampak}: Gambar) => {
  const isi = batas01(keadaan.isi, 0.85);
  if (tampak === 'atas') {
    return (
      <g>
        <circle r={158} cx={6} cy={9} fill={BAYANG_KONTAK} />
        <circle r={158} fill={M.cobek} />
        <circle r={134} fill={M.cobekGelap} />
        {isi > 0 && (
          <g transform={`scale(${0.55 + isi * 0.45})`}>
            <circle r={122} fill={M.sambal} />
            <path d="M-80 -40 Q-30 -90 40 -70 Q10 -40 -40 -20 Z" fill={M.sambalTerang} opacity={0.8} />
            <BijiSambal rx={110} ry={110} seed="cobek-atas" />
          </g>
        )}
        {/* Ulekan melintang dari dalam ke luar cobek. */}
        <g transform="rotate(-32)">
          <rect x={-30} y={-26} width={230} height={52} rx={26} fill={M.cobekTerang} />
          <rect x={-30} y={-26} width={230} height={18} rx={9} fill={M.cobek} opacity={0.5} />
        </g>
      </g>
    );
  }
  return (
    <g>
      <Bayang lebar={150} />
      <path d="M-160 -64 Q-150 -6 -70 0 H70 Q150 -6 160 -64 Z" fill={M.cobek} />
      <path d="M40 -64 H160 Q150 -6 70 0 H30 Z" fill={M.cobekGelap} opacity={0.35} />
      <ellipse cy={-64} rx={160} ry={26} fill={M.cobekTerang} />
      <ellipse cy={-62} rx={136} ry={18} fill={M.cobekGelap} />
      {isi > 0 && (
        <g transform={`translate(0 -62) scale(1 ${0.4 + isi * 0.6})`}>
          <path d="M-128 2 Q-110 -40 -20 -44 Q100 -44 128 2 Q60 14 0 14 Q-60 14 -128 2 Z" fill={M.sambal} />
          <path d="M-90 -16 Q-60 -40 0 -38 Q-30 -22 -80 -6 Z" fill={M.sambalTerang} opacity={0.8} />
          <BijiSambal rx={100} ry={18} seed="cobek-samping" />
        </g>
      )}
      <g transform="translate(40 -80) rotate(-38)">
        <rect x={-24} y={-150} width={50} height={190} rx={25} fill={M.cobekTerang} />
        <rect x={8} y={-150} width={18} height={190} rx={9} fill={M.cobek} opacity={0.5} />
      </g>
    </g>
  );
};

// ---------------- Mangkok makanan ----------------
// Varian `mi` (bawaan) atau `nasi`, dengan akhiran `-sambal` untuk sesendok sambal di atasnya.
const Mi = ({r}: {r: number}) => (
  <g fill="none" strokeLinecap="round">
    {Array.from({length: 9}, (_, i) => {
      const y = -r * 0.7 + i * r * 0.17;
      const lebar = Math.sqrt(Math.max(0, 1 - (y / r) ** 2)) * r * 0.86;
      return <path key={i} d={`M${-lebar} ${y} q${lebar / 4} -16 ${lebar / 2} 0 t${lebar / 2} 0 t${lebar / 2} 0 t${lebar / 2} 0`} stroke={i % 2 ? M.miGelap : M.mi} strokeWidth={11} />;
    })}
  </g>
);

const Mangkok = ({keadaan, tampak, frame, varian = 'mi'}: Gambar) => {
  const uap = batas01(keadaan.uap, 0);
  const nasi = varian.startsWith('nasi');
  const sambal = varian.endsWith('sambal');
  if (tampak === 'atas') {
    return (
      <g>
        <circle r={160} cx={6} cy={9} fill={BAYANG_KONTAK} />
        <circle r={160} fill={M.mangkok} />
        <circle r={160} fill="none" stroke={M.mangkokAksen} strokeWidth={10} strokeDasharray="24 18" opacity={0.85} />
        <circle r={136} fill={nasi ? M.nasiBayang : M.kuah} />
        {nasi ? (
          <g>
            <circle r={118} fill={M.nasi} />
            {Array.from({length: 40}, (_, i) => {
              const a = random(`nasi-a-${i}`) * Math.PI * 2;
              const d = Math.sqrt(random(`nasi-d-${i}`)) * 108;
              return <ellipse key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} rx={7} ry={3.5} fill={M.nasiBayang} transform={`rotate(${a * 57} ${Math.cos(a) * d} ${Math.sin(a) * d})`} />;
            })}
          </g>
        ) : (
          <g>
            <circle r={136} fill={M.kuahGelap} opacity={0.35} />
            <Mi r={128} />
          </g>
        )}
        <g fill={M.sayur}>
          <path d="M70 -90 Q120 -60 96 -10 Q60 -40 70 -90 Z" />
          <path d="M100 -40 Q130 10 90 40 Q76 0 100 -40 Z" opacity={0.85} />
        </g>
        {sambal && (
          <g transform="translate(-40 30)">
            <path d="M-46 -6 Q-40 -38 -6 -40 Q30 -44 44 -14 Q50 16 20 30 Q-14 42 -38 24 Q-52 12 -46 -6 Z" fill={M.sambal} />
            <path d="M-26 -22 Q-4 -32 18 -24" stroke={M.sambalTerang} strokeWidth={7} strokeLinecap="round" fill="none" />
            <BijiSambal rx={32} ry={32} seed="mangkok-sambal" />
          </g>
        )}
        <Uap kuat={uap} frame={frame} lebar={30} tinggi={120} y={-20} />
      </g>
    );
  }
  return (
    <g>
      <Bayang lebar={110} />
      <Uap kuat={uap} frame={frame} lebar={34} tinggi={130} y={-130} />
      {/* Isi menggunung di atas bibir mangkok. */}
      {nasi ? (
        <path d="M-104 -100 Q-90 -168 0 -172 Q90 -168 104 -100 Z" fill={M.nasi} />
      ) : (
        <g>
          <path d="M-108 -100 Q-80 -150 0 -152 Q80 -150 108 -100 Z" fill={M.mi} />
          <g fill="none" stroke={M.miGelap} strokeWidth={7} strokeLinecap="round">
            <path d="M-80 -112 q20 -14 40 0 t40 0 t40 0 t40 0" />
            <path d="M-60 -132 q18 -12 36 0 t36 0 t36 0" />
          </g>
        </g>
      )}
      <path d="M50 -150 Q86 -132 92 -104 Q60 -116 50 -150 Z" fill={M.sayur} />
      {/* Sambal sebagai olesan pipih tidak rata di atas isi, bukan bulatan. */}
      {sambal && (
        <g>
          <path d="M-84 -122 Q-80 -140 -54 -142 Q-36 -150 -16 -142 Q8 -146 14 -130 Q4 -120 -20 -122 Q-50 -116 -84 -122 Z" fill={M.sambal} />
          <path d="M-62 -136 Q-46 -144 -28 -138" stroke={M.sambalTerang} strokeWidth={5} strokeLinecap="round" fill="none" />
          <circle cx={-40} cy={-130} r={3} fill={M.sambalBiji} />
          <circle cx={-12} cy={-132} r={3} fill={M.sambalBiji} />
        </g>
      )}
      <path d="M-128 -104 H128 Q122 -24 56 -10 L44 0 H-44 L-56 -10 Q-122 -24 -128 -104 Z" fill={M.mangkok} />
      <path d="M-124 -74 H124 Q122 -60 118 -50 H-118 Q-122 -60 -124 -74 Z" fill={M.mangkokAksen} />
      <path d="M40 -104 H128 Q122 -24 56 -10 L44 0 H20 Z" fill={M.mangkokBayang} opacity={0.4} />
      <ellipse cy={-104} rx={128} ry={14} fill={M.mangkokBayang} />
    </g>
  );
};

// ---------------- Gelas minum ----------------
// Varian `air` (bawaan) atau `susu`. `partikel` menambah molekul kapsaisin yang mengapung di permukaan tanpa larut.
const GelasMinum = ({keadaan, frame, varian = 'air'}: Gambar) => {
  const isi = batas01(keadaan.isi, 0.8);
  const susu = varian === 'susu';
  const tinggi = 230;
  const atas = -tinggi;
  const muka = -12 - isi * (tinggi - 30);
  // Dinding meruncing: lebar 70 di atas, 56 di bawah.
  const tepiDi = (y: number) => 56 + ((-y) / tinggi) * 14;
  const partikel = Math.round(keadaan.partikel ?? 0);
  return (
    <g>
      <Bayang lebar={64} />
      <path d={`M${-tepiDi(atas)} ${atas} L${-56} -10 Q-56 0 -44 0 H44 Q56 0 56 -10 L${tepiDi(atas)} ${atas} Z`} fill={W.kaca} />
      {isi > 0 && (
        <g>
          <path d={`M${-tepiDi(muka) + 6} ${muka} L-50 -14 Q-50 -6 -40 -6 H40 Q50 -6 50 -14 L${tepiDi(muka) - 6} ${muka} Z`} fill={susu ? M.susu : M.air} />
          {susu && <path d={`M14 ${muka} L${tepiDi(muka) - 6} ${muka} L50 -14 Q50 -6 40 -6 H22 Z`} fill={M.susuBayang} opacity={0.6} />}
          <ellipse cy={muka} rx={tepiDi(muka) - 6} ry={9} fill={susu ? M.susuBayang : M.airPermukaan} />
        </g>
      )}
      {Array.from({length: partikel}, (_, i) => {
        const lebar = tepiDi(muka) - 24;
        const x = -lebar + ((i + 0.5) / partikel) * lebar * 2;
        const y = muka - 4 + Math.sin(frame / 11 + i * 1.7) * 5 + (i % 2) * 12;
        return <Kapsaisin key={i} x={x} y={y} skala={0.34} putar={Math.sin(frame / 17 + i) * 18 + (i % 2 ? 160 : 0)} goyang={frame * 2 + i * 30} />;
      })}
      <path d={`M${-tepiDi(atas)} ${atas} L-56 -10 Q-56 0 -44 0 H44 Q56 0 56 -10 L${tepiDi(atas)} ${atas}`} fill="none" stroke={W.kacaTepi} strokeWidth={6} strokeLinejoin="round" />
      <ellipse cy={atas} rx={tepiDi(atas)} ry={10} fill="none" stroke={W.kacaTepi} strokeWidth={5} />
      <rect x={34} y={atas + 26} width={9} height={tinggi - 60} rx={4.5} fill={W.kacaKilap} />
    </g>
  );
};

// ---------------- Pemanggang roti ----------------
// `isi` 0 roti di dalam, 1 roti melompat keluar. Varian `gosong` menghitamkan roti. `uap` adalah asap tipis.
const Pemanggang = ({keadaan, frame, varian}: Gambar) => {
  const naik = batas01(keadaan.isi, 0) * 80;
  const asap = batas01(keadaan.uap, 0);
  const gosong = varian === 'gosong';
  return (
    <g>
      <Bayang lebar={150} />
      <Uap kuat={asap} frame={frame} lebar={40} tinggi={220} y={-250 - naik} warna={M.asap} tebal={16} />
      {[-48, 48].map((x) => (
        <g key={x} transform={`translate(${x} ${-150 - naik})`}>
          <path d="M-46 80 V-30 Q-52 -62 -20 -64 Q0 -76 20 -64 Q52 -62 46 -30 V80 Z" fill={gosong ? M.rotiGosongKerak : M.rotiKerak} />
          <path d="M-36 80 V-26 Q-40 -50 -14 -52 Q0 -62 14 -52 Q40 -50 36 -26 V80 Z" fill={gosong ? M.rotiGosong : M.roti} />
        </g>
      ))}
      <rect x={-150} y={-170} width={300} height={170} rx={48} fill={M.pemanggang} />
      <rect x={60} y={-170} width={90} height={170} rx={40} fill={M.pemanggangGelap} opacity={0.35} />
      {[-48, 48].map((x) => (
        <rect key={x} x={x - 52} y={-176} width={104} height={16} rx={8} fill={M.pemanggangGelap} />
      ))}
      <rect x={-120} y={-100} width={240} height={14} rx={7} fill={M.logamTerang} opacity={0.7} />
      <rect x={148} y={-120 + (1 - batas01(keadaan.isi, 0)) * 50} width={26} height={18} rx={6} fill={W.logamGelap} />
      <rect x={-130} y={-6} width={260} height={10} rx={5} fill={W.logamGelap} />
    </g>
  );
};

// ---------------- Alarm asap ----------------
// Menempel di plafon: titik asal di tempat alarm menempel, badan menggantung ke bawah. `getar` menyalakan lampu dan bunyi.
const AlarmAsap = ({keadaan, frame}: Gambar) => {
  const bunyi = batas01(keadaan.getar, 0);
  const nyala = bunyi > 0 && Math.floor(frame / 5) % 2 === 0;
  return (
    <g>
      <rect x={-120} y={0} width={240} height={18} rx={9} fill={M.alarmBayang} />
      <path d="M-110 16 H110 Q106 64 60 76 H-60 Q-106 64 -110 16 Z" fill={M.alarm} />
      <path d="M30 16 H110 Q106 64 60 76 H20 Z" fill={M.alarmBayang} opacity={0.5} />
      {[-60, -30, 0, 30, 60].map((x) => (
        <rect key={x} x={x - 9} y={36} width={18} height={6} rx={3} fill={M.alarmBayang} />
      ))}
      <circle cx={0} cy={60} r={nyala ? 13 : 10} fill={nyala ? M.alarmLampu : M.alarmLampuMati} />
      {nyala && <circle cx={0} cy={60} r={34} fill={M.alarmLampu} opacity={0.3} />}
      {bunyi > 0 && (
        <g fill="none" stroke={M.alarmGelombang} strokeWidth={9} strokeLinecap="round">
          {[0, 1, 2].map((i) => {
            const t = ((frame * 0.07 + i / 3) % 1 + 1) % 1;
            const r = 70 + t * 110;
            return (
              <g key={i} opacity={bunyi * (1 - t)}>
                <path d={`M${-r - 50} ${10 + r * 0.2} Q${-r - 80} ${50 + r * 0.3} ${-r - 50} ${90 + r * 0.4}`} />
                <path d={`M${r + 50} ${10 + r * 0.2} Q${r + 80} ${50 + r * 0.3} ${r + 50} ${90 + r * 0.4}`} />
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};

// ---------------- Termometer ----------------
// Berdiri, titik asal di alas. `isi` 0..1 tinggi cairan merah. Pita hijau samar menandai suhu biasa, tanpa angka.
const Termometer = ({keadaan, frame}: Gambar) => {
  const isi = batas01(keadaan.isi, 0.3);
  const tinggi = 330;
  const dasar = -70;
  const kolom = 24 + (tinggi - 40) * isi + Math.sin(frame / 9) * 1.5;
  return (
    <g>
      <Bayang lebar={50} />
      <rect x={-44} y={dasar - tinggi - 20} width={88} height={tinggi + 30} rx={44} fill={M.meter} />
      <rect x={-44} y={dasar - tinggi * 0.5} width={88} height={tinggi * 0.24} fill={M.termoAman} />
      <rect x={-16} y={dasar - tinggi} width={32} height={tinggi} rx={16} fill={W.kaca} stroke={W.kacaTepi} strokeWidth={4} />
      <rect x={-9} y={dasar - kolom} width={18} height={kolom + 10} rx={9} fill={M.termoIsi} />
      <circle cy={dasar + 22} r={44} fill={M.termoIsi} />
      <circle cx={-14} cy={dasar + 10} r={11} fill={W.kacaKilap} />
      {Array.from({length: 9}, (_, i) => (
        <rect key={i} x={22} y={dasar - 40 - i * 32} width={i % 2 ? 12 : 20} height={5} rx={2.5} fill={M.termoSkala} />
      ))}
    </g>
  );
};

// ---------------- Televisi ----------------
// Layar menampilkan adegan sedih: sosok kecil menunduk di bawah hujan. Titik asal di alas kaki.
const Televisi = ({frame}: Gambar) => (
  <g>
    <ellipse cy={-200} rx={340} ry={230} fill={M.tvCahaya} opacity={0.12} />
    <Bayang lebar={110} />
    <path d="M-70 0 L-40 -50 H40 L70 0 Z" fill={M.tvRangka} />
    <rect x={-230} y={-340} width={460} height={290} rx={18} fill={M.tv} />
    <rect x={-210} y={-322} width={420} height={136} fill={M.tvLayar[0]} />
    <rect x={-210} y={-186} width={420} height={118} fill={M.tvLayar[1]} />
    <rect x={-210} y={-130} width={420} height={6} fill={M.tvCahaya} opacity={0.25} />
    {/* Sosok menunduk, bahu turun. */}
    <g fill={M.tvSosok}>
      <circle cx={-10} cy={-196} r={22} />
      <path d="M-46 -124 Q-46 -176 -10 -176 Q26 -176 30 -124 Z" />
    </g>
    <g stroke={M.tvHujan} strokeWidth={3} strokeLinecap="round">
      {Array.from({length: 16}, (_, i) => {
        const x = -196 + ((i * 53) % 400);
        const y = -318 + (((frame * 9 + i * 71) % 230) + 230) % 230;
        return <path key={i} d={`M${x} ${y} l-6 22`} />;
      })}
    </g>
  </g>
);

// ---------------- Api ----------------
// Tiga lapis lidah api yang berkedip dari frame. `isi` 0..1 besar api. Varian `ilusi` tembus pandang, untuk api yang hanya dirasa.
const lidahApi = (lebar: number, tinggi: number, goyang: number) =>
  `M${-lebar} 0 C${-lebar * 1.15} ${-tinggi * 0.35} ${-lebar * 0.5 + goyang * 0.3} ${-tinggi * 0.6} ${goyang} ${-tinggi} C${lebar * 0.4 + goyang * 0.3} ${-tinggi * 0.62} ${lebar * 1.15} ${-tinggi * 0.38} ${lebar} 0 Q0 ${tinggi * 0.18} ${-lebar} 0 Z`;

const Api = ({keadaan, frame, varian}: Gambar) => {
  const besar = batas01(keadaan.isi, 1);
  if (besar <= 0) return null;
  const ilusi = varian === 'ilusi';
  const kedip = (fase: number) => Math.sin(frame / 3.1 + fase) * 10 + Math.sin(frame / 1.7 + fase * 2) * 5;
  const tinggi = (h: number, fase: number) => h * (1 + Math.sin(frame / 2.6 + fase) * 0.06);
  return (
    <g transform={`scale(${besar})`} opacity={ilusi ? 0.62 : 1}>
      <path d={lidahApi(70, tinggi(210, 0), kedip(0))} fill={M.apiLuar} />
      <path d={lidahApi(52, tinggi(160, 1.3), kedip(1.3))} fill={M.api} />
      <path d={lidahApi(30, tinggi(100, 2.1), kedip(2.1) * 0.6)} fill={M.apiInti} />
    </g>
  );
};

// ---------------- Meter ----------------
// Meter setengah lingkaran tanpa angka. Busur dimulai dari nol di kiri. `isi` posisi jarum 0..1,
// `tanda` posisi jarum bayangan sebelumnya, supaya selisih kecil tetap terbaca jujur.
const titikBusur = (r: number, nilai: number) => {
  const sudut = Math.PI * (1 - nilai);
  return {x: Math.cos(sudut) * r, y: -Math.sin(sudut) * r};
};
const busur = (r: number, dari: number, ke: number) => {
  const a = titikBusur(r, dari);
  const b = titikBusur(r, ke);
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)} A${r} ${r} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
};

const Meter = ({keadaan}: Gambar) => {
  const nilai = batas01(keadaan.isi, 0.9);
  const tanda = keadaan.tanda;
  const R = 200;
  const pusat = -60;
  const jarum = (v: number, warna: string, opacity = 1) => {
    const ujung = titikBusur(R - 34, v);
    return <path d={`M0 0 L${ujung.x} ${ujung.y}`} stroke={warna} strokeWidth={14} strokeLinecap="round" opacity={opacity} />;
  };
  return (
    <g>
      <Bayang lebar={200} />
      <path d={`M${-R - 50} 0 V${pusat} A${R + 50} ${R + 50} 0 0 1 ${R + 50} ${pusat} V0 Z`} fill={M.meter} />
      <g transform={`translate(0 ${pusat})`}>
        <path d={busur(R, 0, 1)} stroke={M.meterJalur} strokeWidth={36} strokeLinecap="round" fill="none" />
        {nilai > 0.002 && <path d={busur(R, 0, nilai)} stroke={M.meterIsi} strokeWidth={36} strokeLinecap="round" fill="none" />}
        {Array.from({length: 11}, (_, i) => {
          const a = titikBusur(R - 34, i / 10);
          const b = titikBusur(R - 54, i / 10);
          return <path key={i} d={`M${a.x} ${a.y} L${b.x} ${b.y}`} stroke={M.termoSkala} strokeWidth={5} strokeLinecap="round" />;
        })}
        {tanda !== undefined && jarum(tanda, M.meterBayang)}
        {jarum(nilai, M.meterJarum)}
        <circle r={22} fill={M.meterJarum} />
      </g>
    </g>
  );
};

// ---------------- Gelas batas ----------------
// Gelas tinggi berisi sambal dengan garis batas merah, tanpa angka. `isi` dan `tanda` 0..1 dari dasar ke bibir gelas.
// Cabai kecil di sisi kiri menandai level yang makin pedas ke atas.
export const GELAS_BATAS = {tinggi: 620, lebar: 250, dasar: 16};

const GelasBatas = ({keadaan, frame}: Gambar) => {
  const {tinggi, lebar, dasar} = GELAS_BATAS;
  const isi = batas01(keadaan.isi, 0);
  const tanda = keadaan.tanda;
  const kiri = -lebar / 2;
  const atas = -dasar - tinggi;
  const yNilai = (v: number) => -dasar - v * tinggi;
  const muka = yNilai(isi);
  const riak = Math.sin(frame / 5) * 4;
  return (
    <g>
      <Bayang lebar={lebar * 0.62} />
      <rect x={kiri - 9} y={atas} width={lebar + 18} height={tinggi + dasar} rx={18} fill={W.kaca} />
      {isi > 0.005 && (
        <g>
          <path d={`M${kiri} ${muka + riak} Q0 ${muka - riak} ${-kiri} ${muka + riak} V${-dasar} H${kiri} Z`} fill={M.sambal} />
          <path d={`M${kiri} ${muka + riak} Q0 ${muka - riak} ${-kiri} ${muka + riak} V${muka + riak + 16} Q0 ${muka - riak + 16} ${kiri} ${muka + riak + 16} Z`} fill={M.sambalTerang} />
          <rect x={lebar * 0.12} y={muka + 24} width={lebar * 0.18} height={Math.max(0, -dasar - muka - 30)} fill={M.sambalTerang} opacity={0.35} />
        </g>
      )}
      {/* Level cabai: makin ke atas makin besar. */}
      {[0.2, 0.4, 0.6, 0.8].map((v, i) => (
        <g key={v} transform={`translate(${kiri - 70} ${yNilai(v) + 10}) scale(${0.28 + i * 0.07}) rotate(-20)`}>
          <path d={BADAN_CABAI} fill={M.cabai} />
          <path d="M-92 -54 Q-112 -46 -106 -30 Q-98 -16 -84 -20 Q-96 -36 -92 -54 Z" fill={M.tangkai} />
        </g>
      ))}
      {tanda !== undefined && (
        <g>
          <rect x={kiri - 40} y={yNilai(tanda) - 7} width={lebar + 80} height={14} rx={7} fill={M.batas} />
        </g>
      )}
      <path
        d={`M${kiri - 9} ${atas} V${-18} Q${kiri - 9} 0 ${kiri + 10} 0 H${-kiri - 10} Q${-kiri + 9} 0 ${-kiri + 9} ${-18} V${atas}`}
        fill="none"
        stroke={W.kacaTepi}
        strokeWidth={9}
        strokeLinejoin="round"
      />
      <rect x={-kiri - 34} y={atas + 30} width={12} height={tinggi - 60} rx={6} fill={W.kacaKilap} />
      <ellipse cx={0} cy={atas} rx={lebar / 2 + 9} ry={12} fill="none" stroke={W.kacaTepi} strokeWidth={6} />
    </g>
  );
};

// ---------------- Gerbong roller coaster ----------------
// Tampak samping, titik asal di garis rel di bawah roda. `bagian` belakang (sandaran) dan depan (dinding yang menutupi kaki)
// dipisah supaya tokoh bisa duduk di antaranya. Tanpa bagian, digambar lengkap.
export const GerbongBagian = ({bagian, frame = 0}: {bagian: 'belakang' | 'depan'; frame?: number}) =>
  bagian === 'belakang' ? (
    <g>
      <rect x={-170} y={-260} width={60} height={170} rx={24} fill={WAHANA.gerbongGelap} />
      <rect x={60} y={-250} width={50} height={150} rx={22} fill={WAHANA.gerbongGelap} />
    </g>
  ) : (
    <g>
      {[-100, 100].map((x) => (
        <g key={x} transform={`translate(${x} -22) rotate(${frame * 24})`}>
          <circle r={24} fill={WAHANA.relGelap} />
          <path d="M-14 0 H14 M0 -14 V14" stroke={WAHANA.tiang} strokeWidth={5} />
        </g>
      ))}
      <path d="M-190 -150 H150 Q210 -150 214 -90 L206 -40 Q200 -26 180 -26 H-180 Q-196 -26 -196 -46 V-140 Q-196 -150 -190 -150 Z" fill={WAHANA.gerbong} />
      <path d="M-196 -96 H212" stroke={WAHANA.gerbongAksen} strokeWidth={16} />
      <path d="M40 -150 H150 Q210 -150 214 -90 L206 -40 Q200 -26 180 -26 H40 Z" fill={WAHANA.gerbongGelap} opacity={0.3} />
      <rect x={-196} y={-162} width={200} height={20} rx={10} fill={WAHANA.gerbongGelap} />
    </g>
  );

const Gerbong = ({frame}: Gambar) => (
  <g>
    <GerbongBagian bagian="belakang" />
    <GerbongBagian bagian="depan" frame={frame} />
  </g>
);

// ---------------- Ponsel ----------------
// Berdiri tegak, titik asal di alas. `isi` 0..1 terang layar. Tampak samping (bawaan) memperlihatkan punggung ponsel
// dengan pendar layar di tepi atas, seperti ponsel yang dipegang menghadap wajah. Tampak `depan` memperlihatkan layar,
// tampak `atas` ponsel tergeletak dengan layar menghadap ke atas.
const LayarPonsel = ({x, y, w, h, terang, frame}: {x: number; y: number; w: number; h: number; terang: number; frame: number}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={10} fill={TIDUR.layar} />
    {terang > 0 && (
      <g opacity={terang}>
        <rect x={x} y={y} width={w} height={h} rx={10} fill={TIDUR.layarTerang} opacity={0.35} />
        {/* Kartu konten yang bergulir pelan, tanpa tulisan. */}
        {[0, 1, 2, 3].map((i) => {
          const yy = y + 12 + ((((i * 46 - frame * 0.8) % 184) + 184) % 184);
          return yy > y + h - 34 ? null : <rect key={i} x={x + 9} y={yy} width={w - 18} height={34} rx={6} fill={TIDUR.cahaya} opacity={0.75} />;
        })}
      </g>
    )}
  </g>
);

const Ponsel = ({keadaan, tampak, frame}: Gambar) => {
  const terang = batas01(keadaan.isi, 1);
  if (tampak === 'atas') {
    return (
      <g>
        {terang > 0 && <ellipse rx={110} ry={140} fill={TIDUR.cahaya} opacity={0.1 * terang} />}
        <rect x={-44} y={-84} width={88} height={168} rx={16} fill={BAYANG_KONTAK} transform="translate(5 7)" />
        <rect x={-44} y={-84} width={88} height={168} rx={16} fill={TIDUR.ponsel} />
        <LayarPonsel x={-37} y={-74} w={74} h={148} terang={terang} frame={frame} />
      </g>
    );
  }
  if (tampak === 'depan') {
    return (
      <g>
        {terang > 0 && <ellipse cy={-80} rx={120} ry={140} fill={TIDUR.cahaya} opacity={0.2 * terang} />}
        <rect x={-40} y={-156} width={80} height={156} rx={14} fill={TIDUR.ponsel} />
        <LayarPonsel x={-34} y={-148} w={68} h={140} terang={terang} frame={frame} />
      </g>
    );
  }
  const kedip = 0.85 + 0.15 * Math.sin(frame / 7);
  return (
    <g>
      {terang > 0 && <ellipse cy={-150} rx={70} ry={34} fill={TIDUR.cahaya} opacity={0.35 * terang * kedip} />}
      <rect x={-40} y={-156} width={80} height={156} rx={14} fill={TIDUR.ponsel} />
      <rect x={-40} y={-156} width={80} height={156} rx={14} fill="none" stroke={TIDUR.ponselTepi} strokeWidth={4} />
      <rect x={-26} y={-142} width={26} height={34} rx={8} fill={TIDUR.ponselTepi} />
      <circle cx={-13} cy={-133} r={6} fill={TIDUR.ponsel} />
      {terang > 0 && <rect x={-36} y={-159} width={72} height={5} rx={2.5} fill={TIDUR.cahaya} opacity={0.8 * terang} />}
    </g>
  );
};

// ---------------- Kalender sobek ----------------
// Kalender meja: tiap lembar bergambar bulan sabit (satu malam), tanpa tanggal. `isi` 0..1 kemajuan sobekan,
// `partikel` jumlah lembar yang disobek (bawaan 7). Lembar terangkat, melayang jatuh, lalu menumpuk di kanan alas.
const LembarKalender = ({w, h}: {w: number; h: number}) => (
  <g>
    <rect x={-w / 2} y={0} width={w} height={h} rx={8} fill={TIDUR.kalender} />
    <path d="M-12 -42 A44 44 0 1 0 34 26 A34 34 0 0 1 -12 -42 Z" transform={`translate(-6 ${h * 0.44})`} fill={TIDUR.bulan} />
    <rect x={-w * 0.32} y={h * 0.8} width={w * 0.64} height={10} rx={5} fill={TIDUR.kalenderBayang} />
  </g>
);

const Kalender = ({keadaan}: Gambar) => {
  const jumlah = Math.max(1, Math.round(keadaan.partikel ?? 7));
  const maju = batas01(keadaan.isi, 0) * jumlah;
  const w = 210;
  const h = 200;
  const atas = -270;
  const tumpuk = {x: 260, y: -4};
  return (
    <g>
      <Bayang lebar={130} />
      {/* Kaki penyangga dan lembar yang masih menempel. */}
      <path d={`M${-w / 2 - 6} 0 L${-w / 2 + 20} ${atas + 40} H${w / 2 - 20} L${w / 2 + 6} 0 Z`} fill={TIDUR.kalenderBayang} />
      <g transform={`translate(0 ${atas + 40})`}>
        <rect x={-w / 2 - 4} y={6} width={w + 8} height={h} rx={10} fill={TIDUR.kalenderBayang} />
        <LembarKalender w={w} h={h} />
      </g>
      <rect x={-w / 2 - 10} y={atas} width={w + 20} height={52} rx={12} fill={TIDUR.kalenderKepala} />
      {[-60, 0, 60].map((x) => (
        <rect key={x} x={x - 7} y={atas - 14} width={14} height={34} rx={7} fill={TIDUR.kalenderCincin} />
      ))}
      {/* Lembar yang sudah disobek: terangkat, melayang, lalu rebah di tumpukan. */}
      {Array.from({length: jumlah}, (_, k) => {
        const p = Math.min(1, Math.max(0, maju - k));
        if (p <= 0) return null;
        const angkat = Math.min(1, p / 0.3);
        const jatuh = Math.max(0, (p - 0.3) / 0.7);
        const jatuhMulus = 1 - Math.pow(1 - jatuh, 2);
        const akhir = {x: tumpuk.x + (random(`kal-x-${k}`) - 0.5) * 30, y: tumpuk.y - k * 7};
        const awal = {x: 0, y: atas + 40};
        const x = awal.x + (akhir.x - awal.x) * jatuhMulus + Math.sin(jatuh * Math.PI * 2) * 40 * (1 - jatuh);
        const y = awal.y - angkat * 40 + (akhir.y - awal.y + 40) * jatuhMulus;
        const putar = angkat * -18 + jatuhMulus * (18 + (random(`kal-r-${k}`) - 0.5) * 20);
        // Lembar yang rebah dipipihkan, seperti kertas tergeletak di meja.
        const pipih = 1 - jatuhMulus * 0.84;
        return (
          <g key={k} transform={`translate(${x} ${y}) rotate(${putar}) scale(${1 - jatuhMulus * 0.15} ${pipih}) translate(0 ${-h * jatuhMulus})`}>
            <LembarKalender w={w} h={h} />
          </g>
        );
      })}
    </g>
  );
};

// ---------------- Papan penghitung ----------------
// Papan angka dengan kata satuan di atas dan deret segmen di bawah. Angka dihitung dari `isi` 0..1 dan `teks` (nilai akhir):
// varian `hari` mulai dari 1, varian `jam` mulai dari 0. Segmen menyala sebanyak angka sekarang, jumlah segmen sama dengan nilai akhir.
const SATUAN_PENGHITUNG: Record<string, {kata: string; awal: number}> = {hari: {kata: 'HARI KE', awal: 1}, jam: {kata: 'JAM TERJAGA', awal: 0}};

export const angkaPenghitung = (isi: number, maks: number, varian = 'hari') => {
  const awal = (SATUAN_PENGHITUNG[varian] ?? {awal: 0}).awal;
  return awal + Math.round(Math.min(1, Math.max(0, isi)) * (maks - awal));
};

const Penghitung = ({keadaan, varian = 'hari', teks = '1'}: Gambar) => {
  const maks = Math.max(1, Number(teks) || 1);
  const kata = (SATUAN_PENGHITUNG[varian] ?? {kata: varian.toUpperCase()}).kata;
  const n = angkaPenghitung(keadaan.isi ?? 0, maks, varian);
  const w = 380;
  const h = 260;
  const lebarSegmen = (w - 60) / maks;
  return (
    <g>
      <Bayang lebar={170} />
      <rect x={-w / 2 - 10} y={-h - 10} width={w + 20} height={h + 10} rx={30} fill={PENGHITUNG.bingkai} />
      <rect x={-w / 2} y={-h} width={w} height={h - 10} rx={24} fill={PENGHITUNG.papan} />
      <text x={0} y={-h + 46} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30} letterSpacing={3} fill={PENGHITUNG.satuan}>
        {kata}
      </text>
      <text x={0} y={-66} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={128} fill={PENGHITUNG.angka}>
        {n}
      </text>
      {Array.from({length: maks}, (_, i) => (
        <rect key={i} x={-w / 2 + 30 + i * lebarSegmen + 2} y={-46} width={lebarSegmen - 4} height={14} rx={4} fill={i < n ? PENGHITUNG.segmenNyala : PENGHITUNG.segmen} />
      ))}
    </g>
  );
};

// ---------------- Bantal ----------------
const Bantal = () => (
  <g>
    <Bayang lebar={170} />
    <path d="M-170 -10 Q-196 -70 -160 -120 Q-80 -146 0 -138 Q80 -146 160 -120 Q196 -70 170 -10 Q80 4 0 0 Q-80 4 -170 -10 Z" fill={TIDUR.bantal} />
    <path d="M-150 -24 Q-60 -12 0 -14 Q60 -12 150 -24 Q140 -6 0 -2 Q-140 -6 -150 -24 Z" fill={TIDUR.bantalBayang} />
    <path d="M-110 -100 Q-40 -116 30 -108" stroke={TIDUR.bantalBayang} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.7} />
  </g>
);

// ---------------- Selimut ----------------
// Selimut yang menutupi pangkuan tokoh di kasur. Titik asal di tengah alas, `isi` 0..1 seberapa tinggi selimut ditarik.
const Selimut = ({keadaan, frame}: Gambar) => {
  const tinggi = 70 + batas01(keadaan.isi, 0) * 190;
  const napas = Math.sin(frame / 24) * 3;
  const atas = -tinggi + napas;
  return (
    <g>
      <path d={`M-300 0 Q-312 ${atas * 0.5} -270 ${atas + 30} Q-200 ${atas - 6} -80 ${atas} Q40 ${atas + 10} 160 ${atas - 4} Q270 ${atas + 4} 300 ${atas + 40} Q316 ${atas * 0.5} 300 0 Z`} fill={TIDUR.selimut} />
      <path d={`M-270 ${atas + 30} Q-200 ${atas - 6} -80 ${atas} Q40 ${atas + 10} 160 ${atas - 4} Q270 ${atas + 4} 300 ${atas + 40} L300 ${atas + 70} Q200 ${atas + 38} 60 ${atas + 44} Q-100 ${atas + 38} -280 ${atas + 66} Z`} fill={TIDUR.selimutTerang} />
      <g stroke={TIDUR.selimutGelap} strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.55}>
        <path d={`M-150 -10 Q-140 ${atas * 0.4} -170 ${atas + 90}`} />
        <path d={`M120 -10 Q140 ${atas * 0.35} 110 ${atas + 96}`} />
      </g>
    </g>
  );
};

// ---------------- Tikus tidur ----------------
// Tikus kecil meringkuk dengan mata terpejam dan ekor melingkar. Bernapas pelan dari frame.
const Tikus = ({frame}: Gambar) => {
  const napas = 1 + Math.sin(frame / 18) * 0.03;
  return (
    <g>
      <Bayang lebar={110} />
      <path d="M90 -14 Q150 -10 150 -50 Q148 -84 110 -78" stroke={TIDUR.tikusEkor} strokeWidth={9} strokeLinecap="round" fill="none" />
      <g transform={`scale(1 ${napas})`}>
        <path d="M-120 -10 Q-130 -96 -30 -110 Q80 -118 112 -40 Q120 -6 90 0 H-100 Q-120 0 -120 -10 Z" fill={TIDUR.tikus} />
        <path d="M-60 -6 Q0 -40 90 -10 Q90 0 80 0 H-60 Z" fill={TIDUR.tikusGelap} opacity={0.45} />
      </g>
      {/* Kepala menunduk di depan badan. */}
      <ellipse cx={-104} cy={-46} rx={56} ry={44} fill={TIDUR.tikus} />
      <ellipse cx={-80} cy={-92} rx={24} ry={26} fill={TIDUR.tikus} />
      <ellipse cx={-80} cy={-90} rx={14} ry={16} fill={TIDUR.tikusTelinga} />
      <path d="M-132 -50 Q-122 -42 -112 -50" stroke={TIDUR.tikusGelap} strokeWidth={5} strokeLinecap="round" fill="none" />
      <circle cx={-158} cy={-36} r={9} fill={TIDUR.tikusTelinga} />
    </g>
  );
};

// ---------------- Pikotogram orang ----------------
// Varian `0`, `1`, `2` memberi warna kelompok. Tanpa varian berwarna polos.
const Orang = ({varian}: Gambar) => {
  const warna = varian !== undefined && ORANG.kelompok[Number(varian)] ? ORANG.kelompok[Number(varian)] : ORANG.polos;
  return (
    <g fill={warna}>
      <circle cy={-74} r={17} />
      <path d="M-24 0 V-34 Q-24 -52 -6 -52 H6 Q24 -52 24 -34 V0 Z" />
    </g>
  );
};

// ---------------- Bulan sabit ----------------
const Bulan = () => (
  <g>
    <path d="M-12 -42 A44 44 0 1 0 34 26 A34 34 0 0 1 -12 -42 Z" fill={TIDUR.bulan} />
    <path d="M-22 -26 A30 30 0 0 0 -20 18" stroke={TIDUR.bulanBayang} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.6} />
  </g>
);

// ---------------- Tabung sampel ----------------
// Tabung sampel darah bertutup di rak kecil. `isi` 0..1 tinggi cairan. Bukan botol minuman.
const Tabung = ({keadaan}: Gambar) => {
  const isi = batas01(keadaan.isi, 0.65);
  const tinggi = 250;
  const muka = -30 - isi * (tinggi - 50);
  return (
    <g>
      <Bayang lebar={120} />
      <rect x={-120} y={-34} width={240} height={34} rx={8} fill={TABUNG.rakGelap} />
      <path d={`M-34 ${-tinggi} V-36 Q-34 0 0 0 Q34 0 34 -36 V${-tinggi} Z`} fill={TABUNG.kaca} />
      <path d={`M-28 ${muka} V-36 Q-28 -6 0 -6 Q28 -6 28 -36 V${muka} Z`} fill={TABUNG.darah} />
      <ellipse cy={muka} rx={28} ry={6} fill={TABUNG.darahTerang} />
      <path d={`M-34 ${-tinggi} V-36 Q-34 0 0 0 Q34 0 34 -36 V${-tinggi}`} fill="none" stroke={TABUNG.kacaTepi} strokeWidth={5} />
      <rect x={14} y={-tinggi + 20} width={8} height={tinggi - 70} rx={4} fill={W.kacaKilap} />
      <rect x={-40} y={-tinggi - 44} width={80} height={52} rx={12} fill={TABUNG.tutup} />
      <rect x={-130} y={-120} width={260} height={22} rx={8} fill={TABUNG.rak} />
      {[-110, 110].map((x) => (
        <rect key={x} x={x - 8} y={-120} width={16} height={90} rx={4} fill={TABUNG.rak} />
      ))}
    </g>
  );
};

// ---------------- Sel otak ----------------
// Petak jaringan otak skala mikro: baris sel bulat dengan inti, dan cairan di celah antar sel. Titik asal di tengah petak.
// `isi` adalah faktor lebar celah: 1 celah biasa, 1,6 celah 60 persen lebih lebar. Sel menyusut sehingga ukuran petak tetap.
export const SEL_OTAK = {lebar: 1320, tinggi: 1640, baris: 6, kolom: 4, celah: 38};

export const geometriSelOtak = (faktor: number) => {
  const {lebar, tinggi, baris, kolom, celah} = SEL_OTAK;
  const g = celah * Math.max(0, faktor);
  const tinggiSel = (tinggi - (baris + 1) * g) / baris;
  const lebarSel = (lebar - (kolom + 1) * g) / kolom;
  const atas = -tinggi / 2;
  // Pusat tiap celah mendatar, termasuk celah di tepi atas dan bawah petak.
  const kanal = Array.from({length: baris + 1}, (_, i) => atas + g / 2 + i * (tinggiSel + g));
  return {g, tinggiSel, lebarSel, kanal, baris: Array.from({length: baris}, (_, i) => atas + g + i * (tinggiSel + g))};
};

// Satu sel glia bercabang: badan tak beraturan, satu inti, dan juluran meruncing yang sedikit masuk ke celah.
// Juluran dibatasi sepertiga lebar celah, jadi celah tetap terbaca dan melebar bersama `isi`.
const julur = (cx: number, cy: number, sudut: number, pangkal: number, panjang: number, tebal: number) => {
  const ux = Math.cos(sudut);
  const uy = Math.sin(sudut);
  const px = -uy * tebal;
  const py = ux * tebal;
  const a = {x: cx + ux * pangkal, y: cy + uy * pangkal};
  const ujung = {x: cx + ux * (pangkal + panjang), y: cy + uy * (pangkal + panjang)};
  return `M${(a.x + px).toFixed(1)} ${(a.y + py).toFixed(1)} Q${(a.x + ux * panjang * 0.55 + px * 0.45).toFixed(1)} ${(a.y + uy * panjang * 0.55 + py * 0.45).toFixed(1)} ${ujung.x.toFixed(1)} ${ujung.y.toFixed(1)} Q${(a.x + ux * panjang * 0.55 - px * 0.45).toFixed(1)} ${(a.y + uy * panjang * 0.55 - py * 0.45).toFixed(1)} ${(a.x - px).toFixed(1)} ${(a.y - py).toFixed(1)} Z`;
};

const SelGlia = ({x, y, w, h, g, kode}: {x: number; y: number; w: number; h: number; g: number; kode: string}) => {
  const cx = x + w / 2;
  const cy = y + h / 2;
  // Badan: lingkar bersegi lembut dengan sedikit gelombang, mengisi kotak sel.
  const titik = Array.from({length: 18}, (_, i) => {
    const t = (i / 18) * Math.PI * 2;
    const c = Math.cos(t);
    const sn = Math.sin(t);
    const k = 0.66 + (random(`${kode}-b-${i}`) - 0.5) * 0.12;
    return {x: cx + Math.sign(c) * Math.pow(Math.abs(c), 0.85) * (w / 2) * k, y: cy + Math.sign(sn) * Math.pow(Math.abs(sn), 0.85) * (h / 2) * k};
  });
  const badan =
    titik.map((p, i) => {
      const q = titik[(i + 1) % titik.length];
      return `${i === 0 ? `M${((p.x + q.x) / 2).toFixed(1)} ${((p.y + q.y) / 2).toFixed(1)}` : ''} Q${q.x.toFixed(1)} ${q.y.toFixed(1)} ${((q.x + titik[(i + 2) % titik.length].x) / 2).toFixed(1)} ${((q.y + titik[(i + 2) % titik.length].y) / 2).toFixed(1)}`;
    }).join(' ') + ' Z';
  const r = Math.min(w, h) / 2;
  const cabang = Array.from({length: 5}, (_, i) => {
    const sudut = (i / 5) * Math.PI * 2 + random(`${kode}-s`) * 1.2 + (random(`${kode}-s-${i}`) - 0.5) * 0.5;
    // Jarak dari pusat ke tepi kotak sel ke arah juluran.
    const tepi = Math.min(Math.abs(w / 2 / (Math.cos(sudut) || 1e-6)), Math.abs(h / 2 / (Math.sin(sudut) || 1e-6)));
    const pangkal = r * 0.4;
    const panjang = Math.max(0, tepi - pangkal) + g * 0.32;
    return {sudut, pangkal, panjang};
  });
  const intiX = cx + (random(`${kode}-ix`) - 0.5) * w * 0.2;
  const intiY = cy + (random(`${kode}-iy`) - 0.5) * h * 0.16;
  return (
    <g>
      {cabang.map(({sudut, pangkal, panjang}, i) => (
        <g key={i} fill={OTAK.sel}>
          <path d={julur(cx, cy, sudut, pangkal, panjang, h * 0.12)} />
          <path d={julur(cx + Math.cos(sudut) * (pangkal + panjang * 0.55), cy + Math.sin(sudut) * (pangkal + panjang * 0.55), sudut + (i % 2 ? 0.7 : -0.7), 0, panjang * 0.45, h * 0.05)} />
        </g>
      ))}
      <path d={badan} fill={OTAK.sel} />
      <path d={badan} fill={OTAK.selGelap} opacity={0.25} transform={`translate(${w * 0.04} ${h * 0.06})`} />
      <path d={badan} fill={OTAK.sel} transform={`translate(${cx} ${cy}) scale(0.9) translate(${-cx} ${-cy}) translate(${-w * 0.02} ${-h * 0.03})`} />
      {/* Satu inti lonjong yang samar, tanpa kilau, supaya tidak terbaca sebagai mata. */}
      <ellipse cx={intiX} cy={intiY} rx={r * 0.3} ry={r * 0.21} transform={`rotate(${(random(`${kode}-ir`) - 0.5) * 60} ${intiX} ${intiY})`} fill={OTAK.inti} opacity={0.4} />
    </g>
  );
};

// Varian `penuh` melanjutkan pola sel dua baris dan dua kolom di luar petak, supaya petak yang dizoom selalu menutup layar.
// `tanda` 0..1 menampakkan cairan celah sebagai jalur terang selebar celah, dan garis ukur kecil di celah tengah.
// Keduanya mengikuti lebar celah yang sama dengan `isi`, jadi pelebaran celah terbaca tanpa angka tambahan.
const LUAS_SEL_OTAK = 2;

const UkurCelah = ({x, g, kuat}: {x: number; g: number; kuat: number}) => {
  const atas = -g / 2;
  const bawah = g / 2;
  const panah = Math.min(9, g * 0.22);
  return (
    <g opacity={kuat} stroke={OTAK.ukur} strokeLinecap="round" fill="none">
      <path d={`M${x - 30} ${atas} H${x + 30} M${x - 30} ${bawah} H${x + 30}`} strokeWidth={5} />
      <path d={`M${x} ${atas + 4} V${bawah - 4}`} strokeWidth={4} />
      <path d={`M${x - panah} ${atas + panah + 4} L${x} ${atas + 4} L${x + panah} ${atas + panah + 4} M${x - panah} ${bawah - panah - 4} L${x} ${bawah - 4} L${x + panah} ${bawah - panah - 4}`} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
};

const SelOtak = ({keadaan, frame, varian}: Gambar) => {
  const id = `selotak${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const {lebar, tinggi, kolom, baris} = SEL_OTAK;
  const geo = geometriSelOtak(keadaan.isi ?? 1);
  const kiri = -lebar / 2;
  const luas = varian === 'penuh' ? LUAS_SEL_OTAK : 0;
  const langkahY = geo.tinggiSel + geo.g;
  const langkahX = geo.lebarSel + geo.g;
  const tambahY = luas * langkahY;
  const tambahX = luas * langkahX;
  const tanda = batas01(keadaan.tanda, 0);
  const daftarBaris = Array.from({length: baris + luas * 2}, (_, i) => i - luas);
  const xSel = (r: number, c: number) => kiri + geo.g + c * langkahX - (((r % 2) + 2) % 2 ? langkahX / 2 : 0);
  // Garis ukur di celah tengah (antara baris 2 dan 3), di x tempat kedua sel di atas dan di bawahnya bertumpuk.
  const xUkur = kiri + geo.g + geo.lebarSel / 2 + 1.25 * langkahX;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={kiri - tambahX} y={-tinggi / 2 - tambahY} width={lebar + tambahX * 2} height={tinggi + tambahY * 2} rx={luas ? 0 : 40} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x={kiri - tambahX} y={-tinggi / 2 - tambahY} width={lebar + tambahX * 2} height={tinggi + tambahY * 2} fill={OTAK.cairan} />
        {tanda > 0 && (
          <g fill={OTAK.cairanTerang} opacity={0.4 * tanda}>
            {[...daftarBaris, baris + luas].map((r) => (
              <rect key={`h-${r}`} x={kiri - tambahX} y={-tinggi / 2 + r * langkahY} width={lebar + tambahX * 2} height={geo.g} />
            ))}
            {daftarBaris.map((r) =>
              Array.from({length: kolom + 2 + luas * 2}, (_, i) => i - luas).map((c) => (
                <rect key={`v-${r}-${c}`} x={xSel(r, c) - geo.g} y={-tinggi / 2 + geo.g + r * langkahY} width={geo.g} height={geo.tinggiSel} />
              )),
            )}
          </g>
        )}
        {daftarBaris.map((r) =>
          Array.from({length: kolom + 1 + luas * 2}, (_, i) => i - luas).map((c) => {
            const x = xSel(r, c);
            const y = -tinggi / 2 + geo.g + r * langkahY;
            const goyang = Math.sin(frame / 32 + r * 1.7 + c * 2.3) * 3;
            return (
              <g key={`${r}-${c}`} transform={`translate(0 ${goyang})`}>
                <SelGlia x={x} y={y} w={geo.lebarSel} h={geo.tinggiSel} g={geo.g} kode={`sel-${r}-${c}`} />
              </g>
            );
          }),
        )}
        {tanda > 0 && <UkurCelah x={xUkur} g={geo.g} kuat={tanda} />}
      </g>
    </g>
  );
};

// Daftar properti dengan titik pegang per tampak. Tampak yang tidak tersedia memakai `samping`.
// `miringMinum` sudut benda saat diangkat ke mulut (pose `minum`). Bawaan 38 derajat untuk gelas dan cangkir.
// Sendok lebih landai supaya cekungnya berhenti di mulut, bukan di hidung.
type DataProperti = {Gambar: (p: Gambar) => ReactNode; pegang: Partial<Record<Tampak, {x: number; y: number}>> & {samping: {x: number; y: number}}; tinggi: number; miringMinum?: number};

export const PROPERTI_DATA = {
  cangkir: {Gambar: Cangkir, pegang: {samping: {x: 60, y: -41}, atas: {x: 62, y: 0}}, tinggi: 78},
  noda: {Gambar: Noda, pegang: {samping: {x: 0, y: 0}}, tinggi: 0},
  gelas: {Gambar: GelasBawaan, pegang: {samping: {x: -88, y: -150}}, tinggi: 290},
  sendok: {Gambar: Sendok, pegang: {samping: {x: -160, y: -30}, atas: {x: -180, y: -6}}, tinggi: 50, miringMinum: 14},
  pil: {Gambar: Pil, pegang: {samping: {x: 0, y: -12}}, tinggi: 26},
  jam: {Gambar: JamWeker, pegang: {samping: {x: 0, y: -150}}, tinggi: 150},
  laptop: {Gambar: Laptop, pegang: {samping: {x: -150, y: -8}}, tinggi: 212},
  piring: {Gambar: Piring, pegang: {samping: {x: 110, y: -12}}, tinggi: 20},
  botol: {Gambar: Botol, pegang: {samping: {x: 0, y: -100}}, tinggi: 232},
  ranjang: {Gambar: Ranjang, pegang: {samping: {x: 0, y: -160}}, tinggi: 230},
  papan: {Gambar: Papan, pegang: {samping: {x: 0, y: -40}}, tinggi: 230},
  pintu: {Gambar: Pintu, pegang: {samping: {x: 112, y: -300}}, tinggi: 640},
  cabai: {Gambar: Cabai, pegang: {samping: {x: -128, y: -80}}, tinggi: 90},
  cobek: {Gambar: Cobek, pegang: {samping: {x: 150, y: -50}, atas: {x: 150, y: 0}}, tinggi: 120},
  mangkok: {Gambar: Mangkok, pegang: {samping: {x: 120, y: -70}, atas: {x: 150, y: 0}}, tinggi: 170},
  gelasMinum: {Gambar: GelasMinum, pegang: {samping: {x: 62, y: -100}}, tinggi: 230},
  pemanggang: {Gambar: Pemanggang, pegang: {samping: {x: 150, y: -90}}, tinggi: 250},
  alarmAsap: {Gambar: AlarmAsap, pegang: {samping: {x: 0, y: 40}}, tinggi: 80},
  termometer: {Gambar: Termometer, pegang: {samping: {x: 0, y: -200}}, tinggi: 420},
  televisi: {Gambar: Televisi, pegang: {samping: {x: 230, y: -200}}, tinggi: 340},
  api: {Gambar: Api, pegang: {samping: {x: 0, y: -60}}, tinggi: 210},
  meter: {Gambar: Meter, pegang: {samping: {x: 0, y: -60}}, tinggi: 310},
  gelasBatas: {Gambar: GelasBatas, pegang: {samping: {x: 130, y: -300}}, tinggi: 640},
  gerbong: {Gambar: Gerbong, pegang: {samping: {x: 0, y: -100}}, tinggi: 260},
  ponsel: {Gambar: Ponsel, pegang: {samping: {x: 0, y: -40}, atas: {x: 0, y: 70}}, tinggi: 156, miringMinum: 0},
  kalender: {Gambar: Kalender, pegang: {samping: {x: 0, y: -240}}, tinggi: 284},
  penghitung: {Gambar: Penghitung, pegang: {samping: {x: 0, y: -130}}, tinggi: 270},
  bantal: {Gambar: Bantal, pegang: {samping: {x: 160, y: -70}}, tinggi: 146},
  selimut: {Gambar: Selimut, pegang: {samping: {x: 280, y: -60}}, tinggi: 260},
  tikus: {Gambar: Tikus, pegang: {samping: {x: 0, y: -60}}, tinggi: 120},
  orang: {Gambar: Orang, pegang: {samping: {x: 0, y: -40}}, tinggi: 91},
  bulan: {Gambar: Bulan, pegang: {samping: {x: 0, y: 0}}, tinggi: 88},
  tabung: {Gambar: Tabung, pegang: {samping: {x: 0, y: -150}}, tinggi: 294},
  selOtak: {Gambar: SelOtak, pegang: {samping: {x: 0, y: 0}}, tinggi: 1000},
} satisfies Record<string, DataProperti>;

export type NamaProperti = keyof typeof PROPERTI_DATA;
export const NAMA_PROPERTI = Object.keys(PROPERTI_DATA) as NamaProperti[];

export const miringMinum = (nama: NamaProperti, bawaan: number) => (PROPERTI_DATA[nama] as DataProperti).miringMinum ?? bawaan;

export const titikPegang = (nama: NamaProperti, tampak: Tampak = 'samping') => {
  const pegang: DataProperti['pegang'] = PROPERTI_DATA[nama].pegang;
  return pegang[tampak] ?? pegang.samping;
};

// Geser getar dalam koordinat induk. Dipakai juga oleh tangan yang menggenggam benda, supaya benda tetap menempel.
export const getarGeser = (getar: number, frame: number) => ({x: getar * Math.sin(frame * 2.1) * 4, y: getar * Math.cos(frame * 2.7) * 2});

// Satu properti di koordinat induknya. `digenggam` menggeser gambar supaya titik pegang berada di (x, y).
// `cermin` membalik arah kiri-kanan, misalnya cangkir di tangan kiri layar.
export const Properti = ({
  nama,
  keadaan = {},
  tampak = 'samping',
  x = 0,
  y = 0,
  skala = 1,
  putar = 0,
  digenggam = false,
  cermin = false,
  varian,
  teks,
  bayang = !digenggam,
}: {
  nama: NamaProperti;
  keadaan?: KeadaanProperti;
  tampak?: Tampak;
  x?: number;
  y?: number;
  skala?: number;
  putar?: number;
  digenggam?: boolean;
  cermin?: boolean;
  varian?: string;
  teks?: string;
  // Bayangan kontak di alas. Mati otomatis saat digenggam.
  bayang?: boolean;
}) => {
  const frame = useCurrentFrame();
  const {Gambar} = PROPERTI_DATA[nama] as DataProperti;
  const pegang = digenggam ? titikPegang(nama, tampak) : {x: 0, y: 0};
  const getar = batas01(keadaan.getar, 0);
  // Getar menggeser seluruh benda, kecuali jam weker yang bergoyang sendiri.
  const geser = getarGeser(nama === 'jam' ? 0 : getar, frame);
  const gx = geser.x;
  const gy = geser.y;
  return (
    <g transform={`translate(${x + gx} ${y + gy}) rotate(${putar}) scale(${skala * (cermin ? -1 : 1)} ${skala}) translate(${-pegang.x} ${-pegang.y})`}>
      <AdaBayang.Provider value={bayang}>
        <Gambar keadaan={keadaan} tampak={tampak} frame={frame} varian={varian} teks={teks} cermin={cermin} />
      </AdaBayang.Provider>
    </g>
  );
};
