import {createContext, useContext, type ReactNode} from 'react';
import {random, useCurrentFrame} from 'remotion';
import {FONT} from '../DataShort';
import {BAYANG_KONTAK, PROPERTI as W} from '../tema';

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
};

export type Tampak = 'samping' | 'atas' | 'depan' | 'belakang';

type Gambar = {keadaan: KeadaanProperti; tampak: Tampak; frame: number; varian?: string; teks?: string; cermin?: boolean};

const batas01 = (v: number | undefined, awal: number) => Math.min(1, Math.max(0, v ?? awal));

// Uap: tiga garis bergelombang yang naik dan memudar. Gerak dihitung dari frame.
const Uap = ({kuat, frame, lebar = 30, tinggi = 90, y = 0}: {kuat: number; frame: number; lebar?: number; tinggi?: number; y?: number}) => {
  if (kuat <= 0) return null;
  return (
    <g fill="none" stroke={W.uap} strokeWidth={7} strokeLinecap="round" opacity={kuat}>
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
const Sendok = ({keadaan}: Gambar) => {
  const isi = batas01(keadaan.isi, 1);
  const tumpah = batas01(keadaan.tumpah, 0);
  return (
    <g>
      <Bayang lebar={60} />
      {tumpah > 0 && <ellipse cx={66} cy={0} rx={14 + tumpah * 46} ry={4 + tumpah * 6} fill={W.bubuk} />}
      <path d="M-30 -14 C-80 -20 -130 -30 -176 -30" fill="none" stroke={W.logamGelap} strokeWidth={14} strokeLinecap="round" />
      <path d="M-30 -16 C-80 -22 -130 -32 -176 -32" fill="none" stroke={W.logam} strokeWidth={10} strokeLinecap="round" />
      <path d="M-46 -16 Q-46 2 0 2 Q46 2 48 -18 Z" fill={W.logamGelap} />
      <ellipse cy={-17} rx={48} ry={10} fill={W.logam} />
      {isi > 0 && (
        <g transform={`translate(0 -17) scale(1 ${isi})`}>
          <path d="M-40 0 Q-30 -30 -4 -36 Q26 -38 40 0 Z" fill={W.bubuk} />
          <path d="M8 -34 Q30 -28 40 0 H14 Z" fill={W.bubukBayang} opacity={0.7} />
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
const JamWeker = ({keadaan, frame}: Gambar) => {
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

// Daftar properti dengan titik pegang per tampak. Tampak yang tidak tersedia memakai `samping`.
type DataProperti = {Gambar: (p: Gambar) => ReactNode; pegang: Partial<Record<Tampak, {x: number; y: number}>> & {samping: {x: number; y: number}}; tinggi: number};

export const PROPERTI_DATA = {
  cangkir: {Gambar: Cangkir, pegang: {samping: {x: 60, y: -41}, atas: {x: 62, y: 0}}, tinggi: 78},
  noda: {Gambar: Noda, pegang: {samping: {x: 0, y: 0}}, tinggi: 0},
  gelas: {Gambar: GelasBawaan, pegang: {samping: {x: -88, y: -150}}, tinggi: 290},
  sendok: {Gambar: Sendok, pegang: {samping: {x: -160, y: -30}}, tinggi: 50},
  pil: {Gambar: Pil, pegang: {samping: {x: 0, y: -12}}, tinggi: 26},
  jam: {Gambar: JamWeker, pegang: {samping: {x: 0, y: -150}}, tinggi: 150},
  laptop: {Gambar: Laptop, pegang: {samping: {x: -150, y: -8}}, tinggi: 212},
  piring: {Gambar: Piring, pegang: {samping: {x: 110, y: -12}}, tinggi: 20},
  botol: {Gambar: Botol, pegang: {samping: {x: 0, y: -100}}, tinggi: 232},
  ranjang: {Gambar: Ranjang, pegang: {samping: {x: 0, y: -160}}, tinggi: 230},
  papan: {Gambar: Papan, pegang: {samping: {x: 0, y: -40}}, tinggi: 230},
  pintu: {Gambar: Pintu, pegang: {samping: {x: 112, y: -300}}, tinggi: 640},
} satisfies Record<string, DataProperti>;

export type NamaProperti = keyof typeof PROPERTI_DATA;
export const NAMA_PROPERTI = Object.keys(PROPERTI_DATA) as NamaProperti[];

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
