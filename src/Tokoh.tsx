import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {FONT} from './DataShort';

export type Look = {
  name: string;
  skin: string;
  shade: string;
  hairColor: string;
  hair: 'swoop' | 'hijab' | 'curly';
  top: string;
  sleeve: string;
  pants: string;
  shoes: string;
  glasses?: boolean;
  // Perut hamil di depan badan. Rig dan rasa geraknya sama dengan tokoh lain.
  hamil?: boolean;
};

export const LOOKS = {
  raka: {
    name: 'Raka',
    skin: '#FBDDBD',
    shade: '#EFC6A0',
    hairColor: '#5A3A2B',
    hair: 'swoop',
    top: '#E8734F',
    sleeve: '#D9633F',
    pants: '#3D4A6B',
    shoes: '#F4EEE2',
  },
  nadia: {
    name: 'Nadia',
    skin: '#FCE0C4',
    shade: '#F0C9A6',
    hairColor: '#8E7CC3',
    hair: 'hijab',
    top: '#FFD76A',
    sleeve: '#F2C650',
    pants: '#4A4F73',
    shoes: '#8A5A44',
  },
  // Nadia yang sedang hamil: warna sama, hanya ditambah perut.
  nadiaHamil: {
    name: 'Nadia',
    skin: '#FCE0C4',
    shade: '#F0C9A6',
    hairColor: '#8E7CC3',
    hair: 'hijab',
    top: '#FFD76A',
    sleeve: '#F2C650',
    pants: '#4A4F73',
    shoes: '#8A5A44',
    hamil: true,
  },
  bima: {
    name: 'Bima',
    skin: '#D9A77E',
    shade: '#C28F67',
    hairColor: '#2A2426',
    hair: 'curly',
    top: '#6FBF73',
    sleeve: '#5BAA60',
    pants: '#3A3D46',
    shoes: '#F4EEE2',
    glasses: true,
  },
} satisfies Record<string, Look>;

export type LookName = keyof typeof LOOKS;

const rad = (degrees: number) => (degrees * Math.PI) / 180;

// Sudut lengan: 0 lurus ke bawah, 90 mendatar ke luar, 180 ke atas, negatif masuk ke arah badan.
type Lengan = {atas: number; bawah: number; jari?: number; buka?: number; depan?: number};

export type Sikap = {
  utama: Lengan;
  bantu: Lengan;
  pandang: number;
  dongak: number;
  miring: number;
  condong: number;
  bahu: number;
};

const sikap = (utama: Lengan, bantu: Lengan, kepala: Partial<Omit<Sikap, 'utama' | 'bantu'>> = {}): Sikap => ({
  utama,
  bantu,
  pandang: 0,
  dongak: 0,
  miring: 0,
  condong: 0,
  bahu: 0,
  ...kepala,
});

// Lengan utama berada di sisi `arah`, jadi pose yang sama bisa dicerminkan sesuai letak tokoh.
export const POSE = {
  netral: sikap({atas: 12, bawah: 18}, {atas: 10, bawah: 16}),
  jelaskan: sikap({atas: 70, bawah: 150, buka: 1}, {atas: 48, bawah: 135, buka: 0.6}, {pandang: 0.15, dongak: 0.1, miring: 2, condong: 0.2}),
  tunjuk: sikap({atas: 75, bawah: 150, jari: 1}, {atas: 20, bawah: -25}, {pandang: 0.35, dongak: 0.35, miring: 3}),
  bahu: sikap({atas: 66, bawah: 145, buka: 1}, {atas: 66, bawah: 145, buka: 1}, {pandang: -0.1, dongak: 0.05, miring: -5, bahu: 12}),
  kepala: sikap({atas: 118, bawah: 170, buka: 0.5, depan: 1}, {atas: 38, bawah: -30}, {pandang: -0.2, dongak: 0.25, miring: 6}),
  toleh: sikap({atas: 18, bawah: 30}, {atas: 60, bawah: 150, buka: 1}, {pandang: -0.75, dongak: 0.1, miring: -4}),
  condong: sikap({atas: 45, bawah: 175, jari: 0.8}, {atas: 30, bawah: -60}, {pandang: 0.1, dongak: -0.1, condong: 1}),
  pikir: sikap({atas: 50, bawah: 215, depan: 1}, {atas: 32, bawah: -70}, {pandang: -0.3, dongak: 0.6, miring: 3}),
} satisfies Record<string, Sikap>;

export type NamaPose = keyof typeof POSE;

const URUTAN_POSE: Record<string, NamaPose[]> = {
  pembuka: ['jelaskan', 'tunjuk', 'kepala', 'toleh', 'bahu'],
  penjelasan: ['tunjuk', 'jelaskan', 'toleh', 'condong', 'pikir'],
  grafik: ['tunjuk', 'condong', 'bahu', 'jelaskan'],
  penutup: ['condong', 'jelaskan', 'toleh', 'tunjuk', 'bahu'],
};
const URUTAN_UMUM: NamaPose[] = ['jelaskan', 'tunjuk', 'toleh', 'condong'];
const POSE_TANYA: NamaPose[] = ['pikir', 'bahu'];

type KunciPose = {mulai: number; pose: NamaPose; tengah: number | null; lirik: number; dongak: number};

const LEPAS_AWAL = 3;
const LAMA_GERAK = 10;
const TUNDA_LENGAN = 2;
const BARIS_BISA_LIRIK = 70;

// Satu gestur per baris narasi. Pilihan hanya bergantung pada isi adegan, jadi hasilnya selalu sama.
export const rencanaPose = (baris: {start: number; frames: number; teks: string; pose?: string}[], jenis: string, id: string): KunciPose[] => {
  const daftar = URUTAN_POSE[jenis] ?? URUTAN_UMUM;
  // Id adegan sering sama antar-episode, jadi kalimat pertama ikut menentukan urutan.
  const geser = Array.from(id + (baris[0]?.teks ?? '')).reduce((jumlah, huruf) => jumlah + huruf.charCodeAt(0), 0);
  let sebelum: NamaPose = 'netral';
  return baris.map((line, i) => {
    const urutan = (i + geser) % daftar.length;
    let pose = line.teks.trim().endsWith('?') ? POSE_TANYA[i % POSE_TANYA.length] : daftar[urutan];
    if (pose === sebelum) pose = daftar[(urutan + 1) % daftar.length];
    if (line.pose && line.pose in POSE) pose = line.pose as NamaPose;
    sebelum = pose;
    return {
      mulai: line.start - LEPAS_AWAL,
      pose,
      tengah: line.frames >= BARIS_BISA_LIRIK ? line.start + Math.round(line.frames * 0.55) : null,
      lirik: POSE[pose].pandang > 0 ? -0.5 : 0.5,
      dongak: i % 2 ? -0.25 : 0.25,
    };
  });
};

const lembut = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

const campur = (a: number, b: number, t: number) => a + (b - a) * t;

const campurLengan = (a: Lengan, b: Lengan, t: number): Lengan => ({
  atas: campur(a.atas, b.atas, t),
  bawah: campur(a.bawah, b.bawah, t),
  jari: campur(a.jari ?? 0, b.jari ?? 0, t),
  buka: campur(a.buka ?? 0, b.buka ?? 0, t),
  // Lengan tetap di depan kepala selama berpindah, supaya tidak menembus wajah di tengah jalan.
  depan: t >= 1 ? (b.depan ?? 0) : t <= 0 ? (a.depan ?? 0) : Math.max(a.depan ?? 0, b.depan ?? 0),
});

// Kepala mulai lebih dulu, lengan menyusul dua frame kemudian. Total 12 frame, tanpa pantulan.
export const sikapDiFrame = (rencana: KunciPose[], frame: number): Sikap =>
  rencana.reduce<Sikap>((kini, kunci) => {
    if (frame < kunci.mulai) return kini;
    const target = POSE[kunci.pose];
    const kepala = lembut(frame, kunci.mulai, kunci.mulai + LAMA_GERAK);
    const lengan = lembut(frame, kunci.mulai + TUNDA_LENGAN, kunci.mulai + TUNDA_LENGAN + LAMA_GERAK);
    const lirik = kunci.tengah === null ? 0 : lembut(frame, kunci.tengah, kunci.tengah + LAMA_GERAK);
    return {
      utama: campurLengan(kini.utama, target.utama, lengan),
      bantu: campurLengan(kini.bantu, target.bantu, lengan),
      pandang: campur(kini.pandang, target.pandang, kepala) + kunci.lirik * lirik,
      dongak: campur(kini.dongak, target.dongak, kepala) + kunci.dongak * lirik,
      miring: campur(kini.miring, target.miring, kepala),
      condong: campur(kini.condong, target.condong, lengan),
      bahu: campur(kini.bahu, target.bahu, lengan),
    };
  }, POSE.netral);

// Lengan di sisi tepi layar tetap menggestur, tetapi ditahan dekat badan agar tangan tidak keluar area aman.
const lenganRapat = (data: Lengan): Lengan => ({
  ...data,
  atas: interpolate(data.atas, [0, 20, 120], [0, 20, 24], {extrapolateRight: 'clamp'}),
  bawah: interpolate(data.bawah, [90, 135, 215], [90, 165, 215], {extrapolateLeft: 'identity', extrapolateRight: 'clamp'}),
});

const Arm = ({
  side,
  upper,
  lower,
  color,
  skin,
  panjang = [70, 62],
  angkat = 0,
  jari = 0,
  buka = 0,
  tangan = 12,
}: {
  side: 1 | -1;
  upper: number;
  lower: number;
  color: string;
  skin: string;
  panjang?: [number, number];
  angkat?: number;
  jari?: number;
  buka?: number;
  tangan?: number;
}) => {
  const shoulderX = side * 46;
  const shoulderY = -78 - angkat;
  const elbowX = shoulderX + side * Math.sin(rad(upper)) * panjang[0];
  const elbowY = shoulderY + Math.cos(rad(upper)) * panjang[0];
  const wristX = elbowX + side * Math.sin(rad(lower)) * panjang[1];
  const wristY = elbowY + Math.cos(rad(lower)) * panjang[1];
  const handX = wristX + side * Math.sin(rad(lower)) * 8;
  const handY = wristY + Math.cos(rad(lower)) * 8;
  const ujung = (sudut: number, jarak: number) => `M${handX} ${handY} L${handX + side * Math.sin(rad(lower + sudut)) * jarak} ${handY + Math.cos(rad(lower + sudut)) * jarak}`;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${shoulderX} ${shoulderY} L${elbowX} ${elbowY} L${wristX} ${wristY}`} stroke={color} strokeWidth={25} />
      {jari > 0 && <path d={ujung(0, tangan + 16 * jari)} stroke={skin} strokeWidth={10} />}
      {buka > 0 && <path d={[-52, -18, 18, 52].map((sudut) => ujung(sudut, tangan + 8 * buka)).join(' ')} stroke={skin} strokeWidth={8} />}
      <circle cx={handX} cy={handY} r={tangan} fill={skin} />
    </g>
  );
};

// Tokoh datar berkepala lebar: mata titik rendah dan berjauhan, tanpa alis dan hidung.
export const Tokoh = ({
  size,
  variant,
  look = 0,
  up = 0,
  raise = 0,
  bicara = false,
  id,
  sikap: gerak,
  arah = 1,
  rapat = false,
}: {
  size: number;
  variant: LookName;
  look?: number;
  up?: number;
  raise?: number;
  bicara?: boolean;
  id: string;
  // Tanpa `sikap`, tokoh tampil seperti rig lama. Sinematik dan Banner memakai jalur itu.
  sikap?: Sikap;
  arah?: 1 | -1;
  rapat?: boolean;
}) => {
  const frame = useCurrentFrame();
  const style: Look = LOOKS[variant];
  const breath = Math.sin(frame / 24);
  const sway = Math.sin(frame / 41);
  const blink = frame % 124 < 5;
  const lookKini = gerak ? Math.max(-0.9, Math.min(0.9, look + gerak.pandang * arah)) : look;
  const upKini = gerak ? Math.max(-0.3, Math.min(1.1, up + gerak.dongak)) : up;
  const tilt = lookKini * 7 + sway * 1.3 - upKini * 2 + (gerak ? gerak.miring * arah : 0);
  const faceX = lookKini * 30;
  const faceY = -upKini * 26;
  const eye = blink ? 1.4 : 9;
  const upper = 10 + raise * 100 + sway;
  const lower = 16 + raise * 140 + sway * 2;
  const shine = `${id}shine`;
  const condong = gerak?.condong ?? 0;
  const bahu = gerak?.bahu ?? 0;
  const badan = `translate(0 ${breath * 1.2})${gerak ? ` rotate(${condong * 3 * arah} 0 60)` : ''}`;
  // Kepala membesar dari leher, jadi condong tidak menurunkan dagu ke area teks.
  const kepala = gerak
    ? `translate(${condong * 10 * arah} ${breath * 1.8 + bahu * 0.3}) rotate(${tilt} 0 -96) translate(0 -96) scale(${1 + condong * 0.07}) translate(0 96)`
    : `translate(0 ${breath * 1.8}) rotate(${tilt} 0 -96)`;
  const lenganPose = (side: 1 | -1) => {
    const data = side === arah ? gerak!.utama : rapat ? lenganRapat(gerak!.bantu) : gerak!.bantu;
    return (
      <Arm
        side={side}
        upper={data.atas + sway * 1.5}
        lower={data.bawah + sway * 2}
        color={style.sleeve}
        skin={style.skin}
        panjang={[78, 70]}
        angkat={bahu}
        jari={data.jari}
        buka={data.buka}
        tangan={14}
      />
    );
  };
  const diDepan = (side: 1 | -1) => ((side === arah ? gerak?.utama.depan : gerak?.bantu.depan) ?? 0) > 0;

  return (
    <svg width={size} height={size * 1.43} viewBox="-210 -320 420 600" style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id={shine} x1="0" y1="0" x2="1" y2="1">
          <stop offset="55%" stopColor={style.shade} stopOpacity={0} />
          <stop offset="100%" stopColor={style.shade} stopOpacity={0.9} />
        </linearGradient>
      </defs>
      <g fill="none" strokeLinecap="round">
        <path d="M-22 56 L-27 232" stroke={style.pants} strokeWidth={36} />
        <path d="M22 56 L27 232" stroke={style.pants} strokeWidth={36} />
      </g>
      <path d="M-56 256 Q-58 234 -32 232 H-12 Q-6 244 -8 256 Z" fill={style.shoes} />
      <path d="M8 256 Q6 244 12 232 H32 Q58 234 56 256 Z" fill={style.shoes} />
      <g transform={badan}>
        {!gerak && <Arm side={-1} upper={10 - sway} lower={16} color={style.sleeve} skin={style.skin} />}
        <path d="M-54 -74 Q-52 -100 -24 -102 H24 Q52 -100 54 -74 L48 62 Q0 72 -48 62 Z" fill={style.top} />
        {!gerak && <Arm side={1} upper={upper} lower={lower} color={style.sleeve} skin={style.skin} />}
        {gerak && !diDepan(-1) && lenganPose(-1)}
        {gerak && !diDepan(1) && lenganPose(1)}
      </g>
      <g transform={kepala}>
        {style.hair === 'hijab' && (
          <path d="M-138 -190 Q-138 -316 0 -316 Q138 -316 138 -190 Q140 -96 70 -66 Q0 -46 -70 -66 Q-140 -96 -138 -190 Z" fill={style.hairColor} />
        )}
        {style.hair !== 'hijab' && (
          <>
            <ellipse cx={-122} cy={-176} rx={15} ry={22} fill={style.shade} />
            <ellipse cx={122} cy={-176} rx={15} ry={22} fill={style.shade} />
          </>
        )}
        <ellipse cx={0} cy={-190} rx={124} ry={106} fill={style.skin} />
        <ellipse cx={0} cy={-190} rx={124} ry={106} fill={`url(#${shine})`} />
        <g transform={`translate(${faceX} ${faceY})`}>
          <ellipse cx={-52} cy={-156} rx={9} ry={eye} fill="#17141A" />
          <ellipse cx={52} cy={-156} rx={9} ry={eye} fill="#17141A" />
          {bicara ? (
            <ellipse cy={-124} rx={11} ry={3 + Math.abs(Math.sin(frame / 2.4)) * 8} fill="#8A4E3F" />
          ) : (
            <path d="M-10 -128 Q0 -121 10 -128" stroke="#A3604B" strokeWidth={5} fill="none" strokeLinecap="round" />
          )}
          {style.glasses && (
            <g fill="none" stroke="#17141A" strokeWidth={6}>
              <circle cx={-52} cy={-156} r={30} />
              <circle cx={52} cy={-156} r={30} />
              <path d="M-22 -156 H22" />
            </g>
          )}
        </g>
        {style.hair === 'swoop' && (
          <path
            d="M-130 -176 Q-142 -312 -2 -314 Q44 -344 58 -306 Q138 -282 130 -172 Q118 -216 88 -230 Q52 -198 -12 -222 Q-30 -196 -74 -218 Q-112 -214 -130 -176 Z"
            fill={style.hairColor}
          />
        )}
        {style.hair === 'curly' && (
          <g fill={style.hairColor}>
            {[[-100, -226, 40], [-66, -270, 44], [-16, -292, 46], [40, -286, 44], [88, -252, 40], [112, -208, 30], [-120, -190, 26], [0, -246, 40]].map(([x, y, r]) => (
              <circle key={`${x}`} cx={x} cy={y} r={r} />
            ))}
          </g>
        )}
        {style.hair === 'hijab' && (
          <path
            fillRule="evenodd"
            d="M-138 -190 Q-138 -316 0 -316 Q138 -316 138 -190 Q140 -96 70 -66 Q0 -46 -70 -66 Q-140 -96 -138 -190 Z M-104 -176 Q-98 -108 0 -96 Q98 -108 104 -176 Q100 -258 0 -262 Q-100 -258 -104 -176 Z"
            fill={style.hairColor}
          />
        )}
      </g>
      {gerak && (diDepan(-1) || diDepan(1)) && (
        <g transform={badan}>
          {diDepan(-1) && lenganPose(-1)}
          {diDepan(1) && lenganPose(1)}
        </g>
      )}
    </svg>
  );
};

export const Karakter = () => (
  <AbsoluteFill style={{background: 'linear-gradient(160deg, #FFE7C9, #CFE8F3)', fontFamily: FONT}}>
    <div style={{display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%', padding: '0 40px 30px'}}>
      {(Object.keys(LOOKS) as LookName[]).filter((name) => !(LOOKS[name] as Look).hamil).map((name) => (
        <div key={name} style={{textAlign: 'center', color: '#2A2A3A'}}>
          <Tokoh size={500} variant={name} look={name === 'bima' ? -0.25 : 0.25} raise={name === 'raka' ? 0.4 : 0} id={name} />
          <div style={{fontSize: 44, fontWeight: 700, marginTop: 6}}>{LOOKS[name].name}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);
