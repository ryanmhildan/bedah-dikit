import type {ReactNode} from 'react';
import {Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {LOOKS, POSE, rencanaPose, type Look, type LookName} from '../Tokoh';
import {RIG_HIJAB_LIPAT, RIG_KANTUNG, RIG_KERINGAT, RIG_KERINGAT_KILAU, RIG_KILAU as WARNA_KILAU, RIG_LAYAR, RIG_LIDAH, RIG_MATA, RIG_MERAH, RIG_MULUT, RIG_SENYUM} from '../tema';

// Rig boneka untuk semua tokoh. Seluruh keadaan tubuh dihitung dari frame oleh `hitungRig`,
// jadi adegan cukup menulis naskah kunci gerak, tanpa animasi tangan per adegan.

// Unsur ketiga pada titik adalah kelenturan: 1 mulus, 0 sudut tajam.
type Titik = readonly [number, number, number?];
type Bentuk = readonly Titik[];

const campur = (a: number, b: number, t: number) => a + (b - a) * t;
const batas = (v: number, bawah: number, atas: number) => Math.min(atas, Math.max(bawah, v));
const rad = (derajat: number) => (derajat * Math.PI) / 180;

// Kurva Catmull-Rom tertutup yang lewat di semua titik, jadi bentuk bisa berubah per frame tanpa patah.
const kurva = (titik: Bentuk) => {
  const n = titik.length;
  const ambil = (i: number) => titik[(i + n) % n];
  let d = `M${titik[0][0].toFixed(2)} ${titik[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [ambil(i - 1), ambil(i), ambil(i + 1), ambil(i + 2)];
    const k1 = (p1[2] ?? 1) / 6;
    const k2 = (p2[2] ?? 1) / 6;
    const c1 = [p1[0] + (p2[0] - p0[0]) * k1, p1[1] + (p2[1] - p0[1]) * k1];
    const c2 = [p2[0] - (p3[0] - p1[0]) * k2, p2[1] - (p3[1] - p1[1]) * k2];
    d += ` C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return `${d} Z`;
};

const campurBentuk = (a: Bentuk, b: Bentuk, t: number): Bentuk =>
  a.map((titik, i): Titik => [campur(titik[0], b[i][0], t), campur(titik[1], b[i][1], t), campur(titik[2] ?? 1, b[i][2] ?? 1, batas(t, 0, 1))]);

// Tiga gambar kepala: v -1 tiga perempat kiri, 0 depan, 1 tiga perempat kanan.
const tigaSudut = (kiri: Bentuk, depan: Bentuk, kanan: Bentuk, v: number) => (v < 0 ? campurBentuk(depan, kiri, -v) : campurBentuk(depan, kanan, v));
const tigaNilai = (kiri: number, depan: number, kanan: number, v: number) => (v < 0 ? campur(depan, kiri, -v) : campur(depan, kanan, v));

const KEPALA_DEPAN: Bentuk = [[0, -297], [88, -272], [125, -198], [108, -130], [58, -92], [0, -84], [-60, -93], [-110, -132], [-124, -200], [-86, -273]];
const KEPALA_KANAN: Bentuk = [[4, -298], [90, -270], [124, -198], [112, -138], [78, -98], [32, -85], [-34, -90], [-92, -120], [-130, -190], [-92, -274]];
const KEPALA_KIRI: Bentuk = [[-4, -298], [92, -274], [130, -190], [92, -120], [34, -90], [-32, -85], [-78, -98], [-112, -138], [-124, -198], [-90, -270]];

// Urutan titik rambut sama di tiga sudut: cambang kiri, belakang kiri, jambul, belakang kanan, cambang kanan, poni.
const RAMBUT_DEPAN: Bentuk = [
  [-128, -172, 0], [-130, -186], [-132, -200], [-133, -222], [-128, -262], [-96, -298], [-46, -315], [-4, -316], [24, -335, 0.75], [56, -310], [104, -286], [133, -240],
  [134, -222], [133, -200], [131, -186], [130, -172, 0], [112, -214], [88, -232], [50, -204], [-12, -222, 0.7], [-34, -204], [-74, -220], [-108, -212],
];
const RAMBUT_KANAN: Bentuk = [
  [-34, -180, 0.5], [-42, -206], [-78, -216], [-116, -156, 0.6], [-144, -222], [-120, -284], [-60, -318], [4, -322], [38, -341, 0.75], [68, -314], [112, -284], [134, -240],
  [135, -220], [132, -204], [126, -194], [120, -180, 0], [106, -216], [84, -236], [58, -212], [10, -232, 0.7], [-2, -220], [-12, -224], [-24, -212],
];
const RAMBUT_KIRI: Bentuk = [
  [-120, -180, 0], [-126, -194], [-132, -204], [-135, -220], [-134, -240], [-112, -284], [-72, -310], [-36, -320], [-14, -341, 0.75], [60, -318], [120, -284], [144, -222],
  [116, -156, 0.6], [78, -216], [42, -206], [34, -180, 0.5], [24, -212], [12, -224], [2, -220], [-10, -232, 0.7], [-58, -212], [-84, -236], [-106, -216],
];

// Sudut kiri selalu cermin sudut kanan. Titik 0 dan titik tengah daftar berada di sumbu, jadi urutannya tetap cocok dengan gambar depan.
const cermin = (bentuk: Bentuk): Bentuk => bentuk.map((_, i): Titik => {
  const [x, y, lain] = bentuk[(bentuk.length - i) % bentuk.length];
  return [-x, y, lain];
});

// Hijab: kain luar mengikuti `yawRambut`, wajah di dalamnya mengikuti `yaw`, seperti kain yang tertinggal dari kepala.
const HIJAB_DEPAN: Bentuk = [[0, -318], [78, -304], [124, -262], [139, -196], [132, -134], [98, -88], [50, -62], [0, -54], [-50, -62], [-98, -88], [-132, -134], [-139, -196], [-124, -262], [-78, -304]];
const HIJAB_KANAN: Bentuk = [[8, -319], [84, -302], [128, -258], [138, -196], [130, -136], [104, -92], [66, -64], [18, -52], [-40, -56], [-96, -78], [-136, -122], [-150, -190], [-130, -262], [-70, -306]];
const HIJAB_KIRI = cermin(HIJAB_KANAN);

const WAJAH_DEPAN: Bentuk = [[0, -262], [60, -254], [98, -218], [106, -172], [90, -128], [50, -102], [0, -94], [-50, -102], [-90, -128], [-106, -172], [-98, -218], [-60, -254]];
const WAJAH_KANAN: Bentuk = [[42, -262], [92, -250], [118, -214], [122, -172], [110, -128], [78, -102], [40, -94], [0, -100], [-28, -124], [-42, -168], [-30, -216], [0, -250]];
const WAJAH_KIRI = cermin(WAJAH_KANAN);

const LIPAT_DEPAN: Bentuk = [[0, -82], [54, -92], [96, -122], [72, -82], [0, -64], [-72, -82], [-96, -122], [-54, -92]];
const LIPAT_KANAN: Bentuk = [[46, -80], [84, -92], [116, -124], [96, -84], [42, -62], [-22, -74], [-20, -112], [14, -86]];
const LIPAT_KIRI = cermin(LIPAT_KANAN);

// Rambut keriting: gumpalan bulat, ditulis melingkar. Unsur ketiga di sini adalah jari-jari gumpalan.
const KERITING_DEPAN: Bentuk = [
  [0, -298, 42], [50, -292, 42], [96, -268, 40], [126, -228, 34], [140, -194, 22], [92, -236, 30], [44, -240, 34], [0, -244, 36],
  [-44, -240, 34], [-92, -236, 30], [-140, -194, 22], [-126, -228, 34], [-96, -268, 40], [-50, -292, 42],
];
const KERITING_KANAN: Bentuk = [
  [10, -300, 42], [60, -290, 42], [102, -262, 38], [126, -222, 30], [134, -190, 18], [104, -232, 26], [64, -238, 32], [22, -240, 36],
  [-22, -238, 38], [-66, -240, 38], [-134, -196, 26], [-134, -236, 38], [-100, -274, 42], [-46, -298, 44],
];
const KERITING_KIRI = cermin(KERITING_KANAN);

const TORSO: Bentuk = [[-53, -80], [-27, -102], [26, -101], [54, -79], [50, 0], [47, 61, 0.5], [1, 69], [-48, 62, 0.5], [-52, 2]];

// Lengan menggantung sebagai kapsul, hanya untuk siluet.
const kapsul = (x1: number, y1: number, x2: number, y2: number, r: number) => {
  const sudut = Math.atan2(y2 - y1, x2 - x1);
  const nx = -Math.sin(sudut) * r;
  const ny = Math.cos(sudut) * r;
  return `M${x1 + nx} ${y1 + ny} L${x2 + nx} ${y2 + ny} A${r} ${r} 0 0 1 ${x2 - nx} ${y2 - ny} L${x1 - nx} ${y1 - ny} A${r} ${r} 0 0 1 ${x1 + nx} ${y1 + ny} Z`;
};

// Bentuk tokoh tampak depan dalam satuan rig, untuk siluet tembus pandang. Badan, lengan, dan kepala satu path supaya isinya tidak bertumpuk.
export const SILUET_RIG = {
  badan: [kurva(TORSO), kapsul(-62, -74, -70, 64, 14), kapsul(62, -74, 70, 64, 14)].join(' '),
  kepala: kurva(KEPALA_DEPAN),
  rambut: kurva(RAMBUT_DEPAN),
};

// Tangan tumpul tanpa garis jari. Sumbu tangan mengarah ke +y, ibu jari di sisi +x.
const TANGAN_TUMPUL: Bentuk = [[-14, 1], [-17, 14], [-13, 28], [0, 34], [13, 28], [16, 16], [23, 9], [14, 1]];
const TANGAN_TUNJUK: Bentuk = [[-14, 1], [-15, 14], [-9, 34], [0, 41], [9, 34], [14, 20], [22, 11], [14, 1]];
// Kepalan dengan ibu jari tegak di sisi +x. Saat lengan bawah mendatar ke luar, ibu jari menunjuk ke atas.
const TANGAN_JEMPOL: Bentuk = [[-14, 1], [-16, 13], [-12, 25], [0, 28], [12, 25], [18, 17], [42, 13, 0.6], [16, 3]];

// Kurva gestur dari studi referensi: melesat sekitar 5 frame, lalu melambat.
export const KURVA_GESTUR = [0.02, 0.08, 0.24, 0.4, 0.52, 0.63, 0.71, 0.78, 0.83, 0.88, 0.92, 0.95, 0.97, 0.99, 1, 1];

// Lengan melewati target paling jauh 2,5 derajat, lalu kembali sebelum pose ditahan.
const LEWAT_DERAJAT = 2.5;
const LEWAT_MULAI = 11;
const LEWAT_LAMA = 11;
export const LAMA_GESTUR = LEWAT_MULAI + LEWAT_LAMA;
export const TAHAN_MIN = 8;

const progresGestur = (t: number) => (t < 0 ? 0 : t >= KURVA_GESTUR.length ? 1 : KURVA_GESTUR[t]);
const lewat = (t: number) => (t <= LEWAT_MULAI || t >= LAMA_GESTUR ? 0 : Math.sin((Math.PI * (t - LEWAT_MULAI)) / LEWAT_LAMA) * LEWAT_DERAJAT);

// Sudut lengan: 0 lurus ke bawah, 90 mendatar ke luar, 180 ke atas. `tangan` memakai ukuran yang sama.
type Lengan = {atas: number; bawah: number; tangan: number; tunjuk?: number; jempol?: number; depan?: boolean};

export type PoseRig = {
  utama: Lengan;
  bantu: Lengan;
  miring?: number;
  dongak?: number;
  condong?: number;
  bahu?: number;
};

export const POSE_RIG = {
  netral: {utama: {atas: 9, bawah: 15, tangan: 12}, bantu: {atas: 8, bawah: 14, tangan: 10}},
  tunjuk: {utama: {atas: 64, bawah: 112, tangan: 108, tunjuk: 1}, bantu: {atas: 11, bawah: 4, tangan: 2}, miring: 3, dongak: 0.08, condong: 0.5},
  jelaskan: {utama: {atas: 30, bawah: 120, tangan: 150}, bantu: {atas: 24, bawah: 108, tangan: 130}, miring: 2, dongak: 0.1, condong: 0.2},
  kaget: {utama: {atas: 34, bawah: 150, tangan: 172}, bantu: {atas: 10, bawah: 150, tangan: 170}, dongak: 0.22, condong: -0.6, bahu: 12},
  tadah: {utama: {atas: 50, bawah: 105, tangan: 165}, bantu: {atas: 10, bawah: 6, tangan: 6}, miring: 2, dongak: 0.2, condong: 0.3},
  pikir: {utama: {atas: 40, bawah: 205, tangan: 205, depan: true}, bantu: {atas: 24, bawah: -52, tangan: -60}, miring: -3, dongak: 0.3},
  bahu: {utama: {atas: 40, bawah: 118, tangan: 150}, bantu: {atas: 40, bawah: 118, tangan: 150}, miring: -4, dongak: 0.05, condong: -0.2, bahu: 14},
  kepala: {utama: {atas: 112, bawah: 186, tangan: 195, depan: true}, bantu: {atas: 22, bawah: -34, tangan: -40}, miring: 5, dongak: 0.2},
  toleh: {utama: {atas: 14, bawah: 24, tangan: 20}, bantu: {atas: 36, bawah: 116, tangan: 150}, miring: -4, dongak: 0.1},
  condong: {utama: {atas: 44, bawah: 165, tangan: 165, tunjuk: 0.8}, bantu: {atas: 26, bawah: -50, tangan: -56}, dongak: -0.1, condong: 1},
  // Memegang benda setinggi dada: siku rendah, lengan bawah naik ke luar, jadi benda tetap terlihat di atas meja.
  // Benda ditempel lewat `bawaan` di TokohRig.
  pegang: {utama: {atas: 18, bawah: 140, tangan: 128}, bantu: {atas: 8, bawah: 14, tangan: 10}, dongak: 0.05, condong: 0.1},
  // Siku terangkat ke samping dan tangan naik sampai setinggi mulut, di depan kepala. Kepala sedikit mendongak seperti meneguk.
  minum: {utama: {atas: 70, bawah: 225, tangan: 215, depan: true}, bantu: {atas: 8, bawah: 14, tangan: 10}, miring: -3, dongak: 0.3},
  // Satu tangan memegang benda setinggi dada, tangan lain menempel di perut, misalnya tokoh yang sedang hamil.
  elus: {utama: {atas: 18, bawah: 140, tangan: 128}, bantu: {atas: 10, bawah: -58, tangan: -72}, dongak: 0.05, condong: 0.1},
  // Dua tangan menahan perut, badan sedikit membungkuk dan kepala tertunduk, misalnya saat mual.
  perut: {utama: {atas: 12, bawah: -62, tangan: -76}, bantu: {atas: 10, bawah: -58, tangan: -72}, miring: 3, dongak: -0.2, condong: 0.5},
  // Menunjuk serong ke atas, misalnya ke papan penunjuk di atas kepala. Lengan lain menggantung.
  tunjukAtas: {utama: {atas: 124, bawah: 150, tangan: 148, tunjuk: 1}, bantu: {atas: 11, bawah: 4, tangan: 2}, miring: 2, dongak: 0.25, condong: 0.2},
  // Mengibas asap atau panas di atas kepala: berganti antara `kibas` (tangan tinggi) dan `kibasRendah`.
  kibas: {utama: {atas: 150, bawah: 178, tangan: 192}, bantu: {atas: 12, bawah: 8, tangan: 6}, miring: -3, dongak: 0.2, condong: -0.2},
  kibasRendah: {utama: {atas: 112, bawah: 128, tangan: 112}, bantu: {atas: 12, bawah: 8, tangan: 6}, miring: 2, dongak: 0.12, condong: -0.1},
  // Jempol: lengan bawah mendatar ke luar setinggi dada, kepalan dengan ibu jari tegak, misalnya merasa baik-baik saja.
  jempol: {utama: {atas: 26, bawah: 96, tangan: 92, jempol: 1}, bantu: {atas: 8, bawah: 14, tangan: 10}, miring: 3, dongak: 0.08, condong: 0.2},
} satisfies Record<string, PoseRig>;

export type NamaPoseRig = keyof typeof POSE_RIG;

// Shot dekat hanya punya ruang sempit di samping dagu. Siku turun dan lengan bawah naik,
// jadi tangan yang terangkat tetap lebar dan berada di atas kotak narasi. Lengan yang menggantung tidak diubah.
const POSE_DEKAT: Record<NamaPoseRig, PoseRig> = {
  ...POSE_RIG,
  tunjuk: {...POSE_RIG.tunjuk, utama: {atas: 18, bawah: 150, tangan: 115, tunjuk: 1}},
  jelaskan: {...POSE_RIG.jelaskan, utama: {atas: 22, bawah: 146, tangan: 155}, bantu: {atas: 18, bawah: 138, tangan: 142}},
  tadah: {...POSE_RIG.tadah, utama: {atas: 20, bawah: 135, tangan: 165}},
  bahu: {...POSE_RIG.bahu, utama: {atas: 22, bawah: 140, tangan: 150}, bantu: {atas: 22, bawah: 140, tangan: 150}},
  toleh: {...POSE_RIG.toleh, bantu: {atas: 22, bawah: 140, tangan: 150}},
};
// `pejam` mata terpejam rapat seperti menahan sakit atau pedas. `sayu` kelopak berat setengah turun dengan kantung di bawah, untuk lelah atau mengantuk.
export type BentukMata = 'titik' | 'senang' | 'kaget' | 'datar' | 'pejam' | 'sayu';
// `cemas` lengkung turun untuk wajah serius atau khawatir. `megap` mulut terbuka lebar dengan lidah (bersama mata `pejam` terbaca tertawa).
// `kepanasan` mulut kecil terbuka dengan ujung lidah menjulur, seperti terengah kepanasan, untuk kepedasan atau kesakitan.
export type BentukMulutRig = BentukMulut | 'senyum' | 'cemas' | 'megap' | 'kepanasan';

// Ekspresi tubuh di atas wajah, masing-masing 0..1: wajah memerah, keringat menetes, dan air mata.
// Kunci yang tidak menulis sebuah nilai mewarisi nilai kunci sebelumnya. Perpindahan antar-kunci 12 frame.
// `layar` cahaya layar ponsel yang menyinari wajah dari bawah.
export type KunciEkspresi = {mulai: number; merah?: number; keringat?: number; airMata?: number; layar?: number};
type NilaiEkspresi = {merah: number; keringat: number; airMata: number; layar: number};

// `potong: true` langsung memasang pose atau arah, dipakai tepat di potongan shot.
type KunciGestur = {mulai: number; pose: NamaPoseRig; potong?: boolean};
type KunciToleh = {mulai: number; ke: number; lama?: 'cepat' | 'pelan'; durasi?: number; potong?: boolean};
type KunciMata = {mulai: number; bentuk: BentukMata};
type KunciMulut = {mulai: number; bentuk: BentukMulutRig};

export type NaskahRig = {
  seed: string;
  gestur: KunciGestur[];
  toleh?: KunciToleh[];
  mata?: KunciMata[];
  // Rentang frame [mulai, akhir). Di luar rentang mulut diam.
  bicara?: [number, number][];
  // Bentuk mulut tetap di luar rentang bicara, misalnya menguap atau tanpa senyum. Tanpa nilai ini mulut mengikuti mata.
  mulut?: KunciMulut[];
  // Sisi lengan utama: 1 kanan layar, -1 kiri layar.
  arah?: 1 | -1;
  // Dongak dasar yang ditambahkan ke dongak tiap pose.
  dongak?: number;
  // Memakai sudut pose untuk shot dekat. Kurva gerak tetap sama.
  dekat?: boolean;
  ekspresi?: KunciEkspresi[];
};

// Menolak naskah yang memotong gestur sebelum sempat ditahan minimal 8 frame.
export const naskahRig = (naskah: NaskahRig): NaskahRig => {
  naskah.gestur.forEach((kunci, i) => {
    const sebelum = naskah.gestur[i - 1];
    if (sebelum && !sebelum.potong && !kunci.potong && kunci.mulai - sebelum.mulai < LAMA_GESTUR + TAHAN_MIN) {
      throw new Error(`Gestur frame ${kunci.mulai} terlalu dekat dengan frame ${sebelum.mulai}: pose harus ditahan minimal ${TAHAN_MIN} frame.`);
    }
  });
  return naskah;
};

const daftarPose = (naskah: NaskahRig): Record<NamaPoseRig, PoseRig> => (naskah.dekat ? POSE_DEKAT : POSE_RIG);

const kunciTerakhir = <T extends {mulai: number}>(daftar: T[], frame: number) => {
  let indeks = -1;
  daftar.forEach((kunci, i) => {
    if (kunci.mulai <= frame) indeks = i;
  });
  return indeks;
};

// Nilai pose pada frame tertentu. Pemanggil menggeser frame untuk membuat bagian tubuh tertinggal.
const nilaiPose = (naskah: NaskahRig, frame: number, ambil: (pose: PoseRig) => number, pakaiLewat: boolean) => {
  const pose = daftarPose(naskah);
  const i = kunciTerakhir(naskah.gestur, frame);
  if (i < 0) return ambil(pose[naskah.gestur[0]?.pose ?? 'netral']);
  const kunci = naskah.gestur[i];
  const target = ambil(pose[kunci.pose]);
  if (kunci.potong) return target;
  const awal = i === 0 ? ambil(pose.netral) : ambil(pose[naskah.gestur[i - 1].pose]);
  const t = frame - kunci.mulai;
  const selisih = target - awal;
  const tambahan = pakaiLewat ? Math.sign(selisih) * lewat(t) * Math.min(1, Math.abs(selisih) / 12) : 0;
  return campur(awal, target, progresGestur(t)) + tambahan;
};

// Menoleh cepat: frame 1 wajah 35 persen, frame 2 wajah 80 persen, frame 3 akhir, lalu ekor 8 frame.
const TOLEH_WAJAH = [0, 0.35, 0.8, 1, 1.05, 1.045, 1.035, 1.025, 1.015, 1.008, 1.003, 1];
const TOLEH_RAMBUT = [0, 0.14, 0.4, 0.72, 0.92, 1.03, 1.06, 1.05, 1.03, 1.015, 1.005, 1];
const TOLEH_BAHU = [0, 0.04, 0.16, 0.42, 0.7, 0.9, 1.04, 1.06, 1.04, 1.02, 1.005, 1];
export const BAHU_IKUT = 0.25;
const LAMA_PELAN = 27;

const tabel = (daftar: number[], t: number) => (t <= 0 ? 0 : t >= daftar.length ? 1 : daftar[t]);
const pelan = (t: number, durasi: number) =>
  interpolate(t, [0, durasi], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});

const nilaiToleh = (naskah: NaskahRig, frame: number, bagian: number[], tunda: number) => {
  const daftar = naskah.toleh ?? [];
  const i = kunciTerakhir(daftar, frame);
  if (i < 0) return 0;
  const kunci = daftar[i];
  if (kunci.potong) return kunci.ke;
  const awal = i === 0 ? 0 : daftar[i - 1].ke;
  const t = frame - kunci.mulai;
  const p = kunci.lama === 'pelan' ? pelan(t - tunda, kunci.durasi ?? LAMA_PELAN) : tabel(bagian, t);
  return campur(awal, kunci.ke, p);
};

// Jeda kedip acak 2-5 detik dari seed tetap, jadi tiap render menghasilkan kedipan yang sama.
const JADWAL_KEDIP = new Map<string, number[]>();
const jadwalKedip = (seed: string) => {
  const ada = JADWAL_KEDIP.get(seed);
  if (ada) return ada;
  const jadwal: number[] = [];
  let f = 20 + Math.round(random(`${seed}-kedip-awal`) * 60);
  for (let i = 0; f < 40000; i++) {
    jadwal.push(f);
    f += 60 + Math.round(random(`${seed}-kedip-${i}`) * 90);
  }
  JADWAL_KEDIP.set(seed, jadwal);
  return jadwal;
};

const KEDIP_TINGGI = [0.5, 0.12, 0.5];
const tinggiKedip = (seed: string, frame: number) => {
  const mulai = jadwalKedip(seed).find((f) => frame >= f && frame < f + KEDIP_TINGGI.length);
  return mulai === undefined ? 1 : KEDIP_TINGGI[frame - mulai];
};

type BentukMulut = 'tutup' | 'kecil' | 'lebar' | 'bulat' | 'pipih';
const PILIHAN_MULUT: BentukMulut[] = ['kecil', 'lebar', 'bulat', 'pipih', 'tutup'];

// Mulut berganti bentuk tiap 3-5 frame dan tidak pernah memakai bentuk yang sama dua kali berturut-turut.
const mulutBicara = (seed: string, mulai: number, frame: number): BentukMulut => {
  let f = mulai;
  let kini = 0;
  for (let i = 0; ; i++) {
    const lompat = 1 + Math.floor(random(`${seed}-mulut-${mulai}-${i}`) * (PILIHAN_MULUT.length - 1));
    kini = (kini + lompat) % PILIHAN_MULUT.length;
    f += 3 + Math.floor(random(`${seed}-tahan-${mulai}-${i}`) * 3);
    if (frame < f) return PILIHAN_MULUT[kini];
  }
};

const bentukMulut = (naskah: NaskahRig, frame: number, mata: BentukMata): BentukMulutRig => {
  const rentang = (naskah.bicara ?? []).find(([mulai, akhir]) => frame >= mulai && frame < akhir);
  if (rentang) return mulutBicara(naskah.seed, rentang[0], frame);
  const iMulut = kunciTerakhir(naskah.mulut ?? [], frame);
  if (iMulut >= 0) return naskah.mulut![iMulut].bentuk;
  if (mata === 'kaget') return 'bulat';
  if (mata === 'senang') return 'lebar';
  return 'senyum';
};

// Gerak dasar hanya penuh saat tokoh sedang bergerak. Selebihnya pose ditahan: nol, atau 20 persen pada close-up.
const TAHAN_CLOSEUP = 0.2;
const LAMA_REDA = 8;
const LAMA_MASUK = 4;
const LAMA_TOLEH_CEPAT = TOLEH_WAJAH.length;

const kekuatanDasar = (naskah: NaskahRig, frame: number, closeup: boolean) => {
  const sisa = closeup ? TAHAN_CLOSEUP : 0;
  const gerak = [
    ...naskah.gestur.filter((k) => !k.potong).map((k) => ({mulai: k.mulai, akhir: k.mulai + LAMA_GESTUR})),
    ...(naskah.toleh ?? []).filter((k) => !k.potong).map((k) => ({mulai: k.mulai, akhir: k.mulai + (k.lama === 'pelan' ? (k.durasi ?? LAMA_PELAN) : LAMA_TOLEH_CEPAT)})),
  ];
  const kekuatan = gerak.map(({mulai, akhir}) => {
    if (frame < mulai) return 0;
    if (frame <= akhir) return Math.min(1, (frame - mulai) / LAMA_MASUK);
    return 1 - (frame - akhir) / LAMA_REDA;
  });
  return Math.max(sisa, ...kekuatan);
};

const DONGAK_MIN = -0.3;
const DONGAK_MAKS = 1.1;

const reaksiKepala = (t: number) => (t < 0 ? 0 : t <= 3 ? (t + 1) / 4 : Math.max(0, 1 - (t - 3) / 7));

// Lengan tetap di depan kepala selama berpindah dari pose di depan, supaya tangan tidak hilang di belakang wajah.
const lenganDiDepan = (naskah: NaskahRig, frame: number, bagian: 'utama' | 'bantu') => {
  const i = Math.max(0, kunciTerakhir(naskah.gestur, frame));
  const kini = naskah.gestur[i];
  const sebelum = naskah.gestur[i - 1];
  const pose = (nama?: NamaPoseRig): PoseRig => POSE_RIG[nama ?? 'netral'];
  if (pose(kini?.pose)[bagian].depan) return true;
  return Boolean(sebelum && !kini.potong && frame - kini.mulai < LAMA_GESTUR && pose(sebelum.pose)[bagian].depan);
};

const LAMA_EKSPRESI = 12;
const EKSPRESI_NOL: NilaiEkspresi = {merah: 0, keringat: 0, airMata: 0, layar: 0};

const nilaiEkspresi = (daftar: KunciEkspresi[] | undefined, frame: number): NilaiEkspresi => {
  if (!daftar?.length) return EKSPRESI_NOL;
  const hasil = {...EKSPRESI_NOL};
  for (const nama of ['merah', 'keringat', 'airMata', 'layar'] as const) {
    let sebelum = 0;
    let kini = 0;
    let mulai = -1e9;
    let pertama = true;
    for (const k of daftar) {
      if (k.mulai > frame) break;
      const v = k[nama];
      if (v === undefined) continue;
      sebelum = pertama ? v : kini;
      kini = v;
      mulai = k.mulai;
      pertama = false;
    }
    // Kunci di frame 0 atau lebih awal langsung terpasang, supaya potongan shot tidak diawali transisi.
    const t = mulai <= 0 ? 1 : interpolate(frame, [mulai, mulai + LAMA_EKSPRESI], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
    hasil[nama] = campur(sebelum, kini, t);
  }
  return hasil;
};

export type KeadaanRig = ReturnType<typeof hitungRig>;

export const hitungRig = (naskah: NaskahRig, frame: number, closeup = false) => {
  const arah = naskah.arah ?? 1;
  const dasar = kekuatanDasar(naskah, frame, closeup);
  const napas = Math.sin(frame / 24) * dasar;
  const goyang = Math.sin(frame / 41) * dasar;

  const lengan = (bagian: 'utama' | 'bantu') => ({
    atas: nilaiPose(naskah, frame, (p) => p[bagian].atas, true) + goyang * 1.2,
    bawah: nilaiPose(naskah, frame - 1, (p) => p[bagian].bawah, true) + goyang * 1.6,
    tangan: nilaiPose(naskah, frame - 2, (p) => p[bagian].tangan, true) + goyang * 2,
    tunjuk: nilaiPose(naskah, frame - 2, (p) => p[bagian].tunjuk ?? 0, false),
    jempol: nilaiPose(naskah, frame - 2, (p) => p[bagian].jempol ?? 0, false),
    depan: lenganDiDepan(naskah, frame, bagian),
  });

  const iGestur = kunciTerakhir(naskah.gestur, frame);
  const kunciGestur = naskah.gestur[iGestur];
  const reaksi = kunciGestur && !kunciGestur.potong ? reaksiKepala(frame - kunciGestur.mulai) : 0;

  const yaw = nilaiToleh(naskah, frame, TOLEH_WAJAH, 0);
  const yawRambut = nilaiToleh(naskah, frame, TOLEH_RAMBUT, 2);
  const yawBahu = nilaiToleh(naskah, frame, TOLEH_BAHU, 4) * BAHU_IKUT;

  // Hentakan kepala hanya pada menoleh cepat: miring dan turun sedikit, lalu pulih di ekor.
  const iToleh = kunciTerakhir(naskah.toleh ?? [], frame);
  const kunciToleh = naskah.toleh?.[iToleh];
  const awalToleh = iToleh > 0 ? naskah.toleh![iToleh - 1].ke : 0;
  const tToleh = kunciToleh ? frame - kunciToleh.mulai : 99;
  const hentak = kunciToleh && kunciToleh.lama !== 'pelan' && !kunciToleh.potong ? interpolate(tToleh, [0, 2, 4, 12], [0, 1, 0.8, 0], {extrapolateRight: 'clamp'}) : 0;
  const arahToleh = kunciToleh ? Math.sign(kunciToleh.ke - awalToleh) : 0;

  const iMata = kunciTerakhir(naskah.mata ?? [], frame);
  const mata = iMata < 0 ? 'titik' : naskah.mata![iMata].bentuk;

  return {
    arah,
    utama: lengan('utama'),
    bantu: lengan('bantu'),
    yaw,
    yawRambut,
    yawBahu,
    napas,
    goyang,
    miring: nilaiPose(naskah, frame, (p) => p.miring ?? 0, false) * arah + reaksi * 2.5 * arah + goyang * 1.3 + hentak * 6 * arahToleh,
    geserKepala: reaksi * 3 * arah + hentak * 8 * arahToleh,
    turunKepala: hentak * 5,
    dongak: batas(nilaiPose(naskah, frame, (p) => p.dongak ?? 0, false) + (naskah.dongak ?? 0), DONGAK_MIN, DONGAK_MAKS),
    condong: nilaiPose(naskah, frame - 1, (p) => p.condong ?? 0, false),
    bahu: nilaiPose(naskah, frame - 1, (p) => p.bahu ?? 0, false),
    mata: mata as BentukMata,
    kedip: tinggiKedip(naskah.seed, frame),
    mulut: bentukMulut(naskah, frame, mata),
    ekspresi: nilaiEkspresi(naskah.ekspresi, frame),
  };
};

type LenganKini = KeadaanRig['utama'];

const PANJANG_ATAS = 82;
const PANJANG_BAWAH = 78;
const BAHU_X = 46;
const BAHU_Y = -78;
const LEBAR_LENGAN = 26;

const titikLengan = (k: KeadaanRig, side: 1 | -1, data: LenganKini) => {
  const arahAtas = [side * Math.sin(rad(data.atas)), Math.cos(rad(data.atas))];
  const arahBawah = [side * Math.sin(rad(data.bawah)), Math.cos(rad(data.bawah))];
  const bahu = [side * BAHU_X + k.yawBahu * 60, BAHU_Y - k.bahu];
  const siku = [bahu[0] + arahAtas[0] * PANJANG_ATAS, bahu[1] + arahAtas[1] * PANJANG_ATAS];
  const pergelangan = [siku[0] + arahBawah[0] * PANJANG_BAWAH, siku[1] + arahBawah[1] * PANJANG_BAWAH];
  return {bahu, siku, pergelangan, arahAtas, arahBawah};
};

// Posisi ujung tangan dalam koordinat rig, untuk objek yang muncul dari tangan tokoh.
export const posisiTangan = (k: KeadaanRig, bagian: 'utama' | 'bantu' = 'utama') => {
  const side = (bagian === 'utama' ? k.arah : -k.arah) as 1 | -1;
  const data = k[bagian];
  const {pergelangan} = titikLengan(k, side, data);
  const panjang = 33;
  return {
    x: pergelangan[0] + side * Math.sin(rad(data.tangan)) * panjang + k.condong * 3 * k.arah,
    y: pergelangan[1] + Math.cos(rad(data.tangan)) * panjang,
  };
};

// Titik genggam: tengah telapak, 18 satuan dari pergelangan searah tangan.
const GENGGAM = 18;
const titikGenggam = (pergelangan: number[], side: 1 | -1, tangan: number) => ({
  x: pergelangan[0] + side * Math.sin(rad(tangan)) * GENGGAM,
  y: pergelangan[1] + Math.cos(rad(tangan)) * GENGGAM,
});

// Titik genggam dalam koordinat rig, sesudah lengan ikut condong dan bernapas bersama badan.
// Dipakai untuk benda yang tidak digambar di dalam rig, misalnya benda yang baru dilepas dari tangan.
export const genggaman = (k: KeadaanRig, bagian: 'utama' | 'bantu' = 'utama') => {
  const side = (bagian === 'utama' ? k.arah : -k.arah) as 1 | -1;
  const data = k[bagian];
  const {pergelangan} = titikLengan(k, side, data);
  const g = titikGenggam(pergelangan, side, data.tangan);
  const sudut = rad(k.condong * 3 * k.arah);
  const y = g.y - 60;
  return {x: g.x * Math.cos(sudut) - y * Math.sin(sudut), y: g.x * Math.sin(sudut) + y * Math.cos(sudut) + 60 + k.napas * 1.2, side};
};

// Lengan selang: satu kurva mulus dari bahu ke pergelangan, mengikuti arah lengan atas dan bawah.
const Lengan = ({k, side, data, gaya, bawaan}: {k: KeadaanRig; side: 1 | -1; data: LenganKini; gaya: Look; bawaan?: ReactNode}) => {
  const {bahu, pergelangan, arahAtas, arahBawah} = titikLengan(k, side, data);
  const genggam = titikGenggam(pergelangan, side, data.tangan);
  const kontrol1 = [bahu[0] + arahAtas[0] * PANJANG_ATAS * 0.8, bahu[1] + arahAtas[1] * PANJANG_ATAS * 0.8];
  const kontrol2 = [pergelangan[0] - arahBawah[0] * PANJANG_BAWAH * 0.8, pergelangan[1] - arahBawah[1] * PANJANG_BAWAH * 0.8];
  const garis = `M${bahu[0]} ${bahu[1]} C${kontrol1[0]} ${kontrol1[1]} ${kontrol2[0]} ${kontrol2[1]} ${pergelangan[0]} ${pergelangan[1]}`;
  return (
    <g>
      <path d={garis} stroke={gaya.sleeve} strokeWidth={LEBAR_LENGAN} strokeLinecap="round" fill="none" />
      {/* Benda bawaan berada di antara lengan dan tangan, jadi jari menutupi gagangnya. Benda tetap tegak walau badan condong. */}
      {bawaan && <g transform={`translate(${genggam.x} ${genggam.y}) rotate(${-k.condong * 3 * k.arah})`}>{bawaan}</g>}
      <g transform={`translate(${pergelangan[0]} ${pergelangan[1]}) scale(${side} 1) rotate(${-data.tangan})`}>
        <path d={kurva(data.jempol > 0 ? campurBentuk(campurBentuk(TANGAN_TUMPUL, TANGAN_TUNJUK, data.tunjuk), TANGAN_JEMPOL, data.jempol) : campurBentuk(TANGAN_TUMPUL, TANGAN_TUNJUK, data.tunjuk))} fill={gaya.skin} />
      </g>
    </g>
  );
};

const Mata = ({x, y, bentuk, kedip, lebar, sisi = 1}: {x: number; y: number; bentuk: BentukMata; kedip: number; lebar: number; sisi?: 1 | -1}) => {
  if (bentuk === 'pejam') {
    // Mata kiri layar menunjuk ke kanan, mata kanan ke kiri, seperti mata yang diperas rapat.
    const s = sisi * lebar;
    return <path d={`M${x - 11 * s} ${y - 10} L${x + 9 * s} ${y} L${x - 11 * s} ${y + 10}`} stroke={RIG_MATA} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
  }
  if (bentuk === 'senang') {
    return <path d={`M${x - 14 * lebar} ${y + 5} Q${x} ${y - 15} ${x + 14 * lebar} ${y + 5}`} stroke={RIG_MATA} strokeWidth={7} strokeLinecap="round" fill="none" />;
  }
  if (bentuk === 'sayu') {
    // Kelopak tebal yang turun melewati tengah mata, sisa bola mata setengah lingkaran kecil, dan kantung tipis di bawahnya.
    const tinggi = 7 * kedip;
    return (
      <g>
        <path d={`M${x - 9 * lebar} ${y + 1} Q${x} ${y + 1 + tinggi * 1.3} ${x + 9 * lebar} ${y + 1} Z`} fill={RIG_MATA} />
        <path d={`M${x - 12 * lebar} ${y + 1} Q${x} ${y - 3} ${x + 12 * lebar} ${y + 1}`} stroke={RIG_MATA} strokeWidth={5} strokeLinecap="round" fill="none" />
        <path d={`M${x - 9 * lebar} ${y + 17} Q${x} ${y + 23} ${x + 9 * lebar} ${y + 17}`} stroke={RIG_KANTUNG} strokeWidth={4} strokeLinecap="round" fill="none" />
      </g>
    );
  }
  if (bentuk === 'datar') {
    return <path d={`M${x - 10 * lebar} ${y - 3} H${x + 10 * lebar} Q${x + 9 * lebar} ${y + 9 * kedip} ${x} ${y + 9 * kedip} Q${x - 9 * lebar} ${y + 9 * kedip} ${x - 10 * lebar} ${y - 3} Z`} fill={RIG_MATA} />;
  }
  const rx = (bentuk === 'kaget' ? 13 : 9.5) * lebar;
  const ry = (bentuk === 'kaget' ? 18 : 10) * kedip;
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={RIG_MATA} />;
};

const Mulut = ({x, y, bentuk, lebar}: {x: number; y: number; bentuk: BentukMulutRig; lebar: number}) => {
  const w = lebar;
  const gambar = {
    senyum: <path d={`M${-11 * w} -3 Q0 6 ${11 * w} -3`} stroke={RIG_SENYUM} strokeWidth={5} strokeLinecap="round" fill="none" />,
    cemas: <path d={`M${-10 * w} 3 Q0 -6 ${10 * w} 3`} stroke={RIG_SENYUM} strokeWidth={5} strokeLinecap="round" fill="none" />,
    tutup: <path d={`M${-9 * w} 0 Q0 2 ${9 * w} -1`} stroke={RIG_SENYUM} strokeWidth={5} strokeLinecap="round" fill="none" />,
    pipih: <path d={`M${-13 * w} -3 Q0 -6 ${13 * w} -3 Q${10 * w} 6 0 6 Q${-10 * w} 6 ${-13 * w} -3 Z`} fill={RIG_MULUT} />,
    kecil: <path d={`M${-9 * w} -5 Q0 -7 ${9 * w} -5 Q${10 * w} 8 0 9 Q${-10 * w} 8 ${-9 * w} -5 Z`} fill={RIG_MULUT} />,
    lebar: <path d={`M${-16 * w} -8 Q0 -11 ${16 * w} -8 Q${15 * w} 13 0 14 Q${-15 * w} 13 ${-16 * w} -8 Z`} fill={RIG_MULUT} />,
    bulat: <ellipse rx={9.5 * w} ry={12} fill={RIG_MULUT} />,
    megap: (
      <g>
        <path d={`M${-17 * w} -9 Q0 -13 ${17 * w} -9 Q${16 * w} 18 0 19 Q${-16 * w} 18 ${-17 * w} -9 Z`} fill={RIG_MULUT} />
        <ellipse cx={2 * w} cy={11} rx={10 * w} ry={7} fill={RIG_LIDAH} />
      </g>
    ),
    // Tepi atas melengkung naik dan tepi bawah hampir datar, jadi tidak terbaca sebagai tawa. Ujung lidah keluar melewati bibir bawah.
    kepanasan: (
      <g>
        <path d={`M${-13 * w} 8 Q${-12 * w} -11 0 -11 Q${12 * w} -11 ${13 * w} 8 Q0 10 ${-13 * w} 8 Z`} fill={RIG_MULUT} />
        <path d={`M${-7 * w} 4 Q${-7 * w} 17 ${1 * w} 17 Q${8 * w} 17 ${8 * w} 4 Z`} fill={RIG_LIDAH} />
      </g>
    ),
  }[bentuk];
  return <g transform={`translate(${x} ${y})`}>{gambar}</g>;
};

const Telinga = ({x, y, besar, warna}: {x: number; y: number; besar: number; warna: string}) => <ellipse cx={x} cy={y} rx={15 * besar} ry={22 * besar} fill={warna} />;

const LENSA = 30;
const TEBAL_KACAMATA = 6;

// Kacamata menempel pada mata, jadi posisi dan lebarnya memakai nilai yang sama dengan `Mata`.
const Kacamata = ({kiriX, kananX, y, lebarKiri, lebarKanan}: {kiriX: number; kananX: number; y: number; lebarKiri: number; lebarKanan: number}) => {
  const dalamKiri = kiriX + LENSA * lebarKiri;
  const dalamKanan = kananX - LENSA * lebarKanan;
  return (
    <g fill="none" stroke={RIG_MATA} strokeWidth={TEBAL_KACAMATA}>
      <ellipse cx={kiriX} cy={y} rx={LENSA * lebarKiri} ry={LENSA} />
      <ellipse cx={kananX} cy={y} rx={LENSA * lebarKanan} ry={LENSA} />
      <path d={`M${dalamKiri} ${y - 3} Q${(dalamKiri + dalamKanan) / 2} ${y - 9} ${dalamKanan} ${y - 3}`} />
    </g>
  );
};

// Gagang berjalan dari tepi lensa ke telinga, dan hilang saat telinga sudah berada di balik lensa.
const Gagang = ({dari, ke, y, telingaY, sisi}: {dari: number; ke: number; y: number; telingaY: number; sisi: 1 | -1}) =>
  (ke - dari) * sisi <= 0 ? null : <path d={`M${dari} ${y - 3} L${ke} ${telingaY - 8}`} stroke={RIG_MATA} strokeWidth={TEBAL_KACAMATA} strokeLinecap="round" fill="none" />;

// Batas yaw tempat telinga dekat berpindah ke depan kepala, seperti bagian boneka yang diganti.
const TELINGA_DEPAN = 0.35;

// Batas tangan dalam koordinat rig.
// Tanpa `bawah`, lengan yang turun boleh keluar dari bawah bingkai seperti shot dada biasa.
export type BatasTangan = {kiri: number; kanan: number; atas: number; bawah?: number};

const UJUNG_TANGAN = 41;
const SISA_TEPI = 12;

// Ujung tangan setelah lengan ikut condong dan bernapas bersama badan.
export const ujungTangan = (k: KeadaanRig, side: 1 | -1, data: LenganKini) => {
  const {pergelangan} = titikLengan(k, side, data);
  const x = pergelangan[0] + side * Math.sin(rad(data.tangan)) * UJUNG_TANGAN;
  const y = pergelangan[1] + Math.cos(rad(data.tangan)) * UJUNG_TANGAN - 60;
  const sudut = rad(k.condong * 3 * k.arah);
  return {x: x * Math.cos(sudut) - y * Math.sin(sudut), y: x * Math.sin(sudut) + y * Math.cos(sudut) + 60 + k.napas * 1.2};
};

// Tangan yang melewati batas ditahan di tepi, lalu sudut lengan dihitung ulang dari posisi itu.
// Posisi tangan berubah menerus, jadi lengan tidak meloncat saat batas mulai bekerja.
const tahanDiTepi = (k: KeadaanRig, side: 1 | -1, data: LenganKini, tepi: BatasTangan): LenganKini => {
  const ujung = ujungTangan(k, side, data);
  const x = batas(ujung.x, tepi.kiri + SISA_TEPI, tepi.kanan - SISA_TEPI);
  const y = batas(ujung.y, tepi.atas + SISA_TEPI, (tepi.bawah ?? Infinity) - SISA_TEPI);
  if (x === ujung.x && y === ujung.y) return data;

  const sudut = rad(k.condong * 3 * k.arah);
  const yBadan = y - 60 - k.napas * 1.2;
  const lokalX = x * Math.cos(sudut) + yBadan * Math.sin(sudut);
  const lokalY = -x * Math.sin(sudut) + yBadan * Math.cos(sudut) + 60;
  const {bahu} = titikLengan(k, side, data);
  const keluar = (lokalX - side * Math.sin(rad(data.tangan)) * UJUNG_TANGAN - bahu[0]) * side;
  const turun = lokalY - Math.cos(rad(data.tangan)) * UJUNG_TANGAN - bahu[1];

  const jarakAsli = Math.hypot(keluar, turun);
  const jarak = batas(jarakAsli, Math.abs(PANJANG_ATAS - PANJANG_BAWAH) + 1, PANJANG_ATAS + PANJANG_BAWAH - 0.01);
  const arahTangan = Math.atan2(keluar, turun);
  const tekuk = Math.acos((PANJANG_ATAS ** 2 + jarak ** 2 - PANJANG_BAWAH ** 2) / (2 * PANJANG_ATAS * jarak));
  // Di shot dekat siku selalu di bawah garis bahu-tangan, supaya siku tidak berpindah sisi di tengah gestur.
  const sikuTurun = tepi.bawah === undefined && keluar > 0;
  const atas = arahTangan - (sikuTurun || data.bawah >= data.atas ? tekuk : -tekuk);
  const bawah = Math.atan2(Math.sin(arahTangan) * jarak - Math.sin(atas) * PANJANG_ATAS, Math.cos(arahTangan) * jarak - Math.cos(atas) * PANJANG_ATAS);
  return {...data, atas: (atas * 180) / Math.PI, bawah: (bawah * 180) / Math.PI};
};

// Lengan di sisi tepi layar ditahan dekat badan, tetapi tetap menggestur.
const lenganRapat = (data: LenganKini): LenganKini => ({
  ...data,
  atas: interpolate(data.atas, [0, 20, 120], [0, 20, 24], {extrapolateRight: 'clamp'}),
  bawah: interpolate(data.bawah, [90, 135, 215], [90, 165, 215], {extrapolateLeft: 'identity', extrapolateRight: 'clamp'}),
});

export const lenganAman = (k: KeadaanRig, rapat: boolean, tepi?: BatasTangan): KeadaanRig => {
  const bantuRapat = rapat ? lenganRapat(k.bantu) : k.bantu;
  if (!tepi) return {...k, bantu: bantuRapat};
  return {
    ...k,
    utama: tahanDiTepi(k, k.arah, k.utama, tepi),
    bantu: tahanDiTepi(k, -k.arah as 1 | -1, bantuRapat, tepi),
  };
};

// Benda bawaan tokoh. `isi` menerima keadaan rig, jadi benda boleh berubah mengikuti pose, misalnya cangkir yang dimiringkan saat minum.
export type Bawaan = {bagian?: 'utama' | 'bantu'; isi: (k: KeadaanRig, frame: number) => ReactNode};

// Keadaan rig yang benar-benar digambar TokohRig pada frame ini, termasuk lengan yang ditahan di tepi.
export const keadaanTampil = (naskah: NaskahRig, frame: number, {closeup = false, rapat = false, batasTangan}: {closeup?: boolean; rapat?: boolean; batasTangan?: BatasTangan} = {}) => {
  const mentah = hitungRig(naskah, frame, closeup);
  return rapat || batasTangan ? lenganAman(mentah, rapat, batasTangan) : mentah;
};

// Lengan lepas: lengan baju dan tangan yang masuk dari tepi bingkai, untuk shot sisipan tanpa badan tokoh.
// Digambar di koordinat induk. `tebal` lebar lengan dalam piksel, bentuk tangan sama dengan rig.
export const LenganLepas = ({
  dari,
  ke,
  tebal = 70,
  variant = 'raka',
  tekuk = 0.12,
  cermin = false,
  bawaan,
}: {
  dari: {x: number; y: number};
  ke: {x: number; y: number};
  tebal?: number;
  variant?: LookName;
  // Lengkung lengan, bagian dari panjang lengan. Tanda menentukan arah lengkung.
  tekuk?: number;
  cermin?: boolean;
  // Digambar dengan titik genggam di (0, 0), di antara lengan dan tangan.
  bawaan?: ReactNode;
}) => {
  const gaya: Look = LOOKS[variant];
  const s = tebal / LEBAR_LENGAN;
  const dx = ke.x - dari.x;
  const dy = ke.y - dari.y;
  const panjang = Math.hypot(dx, dy) || 1;
  const arah = {x: dx / panjang, y: dy / panjang};
  const kontrol = {x: (dari.x + ke.x) / 2 - arah.y * panjang * tekuk, y: (dari.y + ke.y) / 2 + arah.x * panjang * tekuk};
  const sudut = (Math.atan2(arah.y, arah.x) * 180) / Math.PI - 90;
  const genggam = {x: ke.x + arah.x * GENGGAM * s, y: ke.y + arah.y * GENGGAM * s};
  return (
    <g>
      <path d={`M${dari.x} ${dari.y} Q${kontrol.x} ${kontrol.y} ${ke.x} ${ke.y}`} stroke={gaya.sleeve} strokeWidth={tebal} strokeLinecap="round" fill="none" />
      {bawaan && <g transform={`translate(${genggam.x} ${genggam.y})`}>{bawaan}</g>}
      <g transform={`translate(${ke.x} ${ke.y}) rotate(${sudut}) scale(${s * (cermin ? -1 : 1)} ${s})`}>
        <path d={kurva(TANGAN_TUMPUL)} fill={gaya.skin} />
      </g>
    </g>
  );
};

// Wajah memerah: rona merata dari dagu sampai dahi, dipotong bentuk kepala. Bukan bulatan pipi.
// Kepekatan hampir sama di seluruh wajah dan hanya sedikit menipis ke ubun-ubun, supaya tidak terbaca sebagai pipi merona.
const Rona = ({id, garis, kuat}: {id: string; garis: string; kuat: number}) => (
  <g>
    <defs>
      <clipPath id={`${id}-rona`}>
        <path d={garis} />
      </clipPath>
      <linearGradient id={`${id}-rona-g`} x1="0" y1="-300" x2="0" y2="-90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor={RIG_MERAH} stopOpacity={0.7} />
        <stop offset="35%" stopColor={RIG_MERAH} stopOpacity={0.8} />
        <stop offset="100%" stopColor={RIG_MERAH} stopOpacity={0.8} />
      </linearGradient>
    </defs>
    <rect x={-160} y={-320} width={320} height={260} fill={`url(#${id}-rona-g)`} clipPath={`url(#${id}-rona)`} opacity={0.5 * kuat} />
  </g>
);

// Cahaya layar ponsel dari bawah: rona biru muda yang paling kuat di dagu dan memudar ke dahi, dipotong bentuk kepala.
const CahayaLayar = ({id, garis, kuat}: {id: string; garis: string; kuat: number}) => (
  <g>
    <defs>
      <clipPath id={`${id}-layar`}>
        <path d={garis} />
      </clipPath>
      <linearGradient id={`${id}-layar-g`} x1="0" y1="-300" x2="0" y2="-80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor={RIG_LAYAR} stopOpacity={0} />
        <stop offset="55%" stopColor={RIG_LAYAR} stopOpacity={0.35} />
        <stop offset="100%" stopColor={RIG_LAYAR} stopOpacity={0.75} />
      </linearGradient>
    </defs>
    <rect x={-160} y={-320} width={320} height={260} fill={`url(#${id}-layar-g)`} clipPath={`url(#${id}-layar)`} opacity={0.9 * kuat} />
  </g>
);

const TETES = 'M0 -16 Q11 2 0 10 Q-11 2 0 -16 Z';

// Keringat: butir di dahi dan pelipis yang meluncur turun, berulang dengan jadwal tetap dari frame.
const Keringat = ({yaw, kuat, frame}: {yaw: number; kuat: number; frame: number}) => {
  const titik = [
    {x: tigaNilai(-118, -112, -70, yaw), y: -214, fase: 0, besar: 1.15},
    {x: tigaNilai(70, 112, 118, yaw), y: -206, fase: 17, besar: 1},
    {x: tigaNilai(-40, 40, 92, yaw), y: -262, fase: 31, besar: 0.85},
  ];
  return (
    <g opacity={Math.min(1, kuat * 1.4)}>
      {titik.map((t, i) => {
        const siklus = ((frame + t.fase) % 44) / 44;
        const turun = siklus * siklus * 70;
        const hilang = siklus > 0.8 ? 1 - (siklus - 0.8) / 0.2 : 1;
        const s = t.besar * (0.85 + kuat * 0.3);
        return (
          <g key={i} transform={`translate(${t.x} ${t.y + turun}) scale(${s})`} opacity={hilang}>
            <path d={TETES} fill={RIG_KERINGAT} />
            <circle cx={-3} cy={0} r={3} fill={RIG_KERINGAT_KILAU} />
          </g>
        );
      })}
    </g>
  );
};

// Air mata: tetes yang jatuh dari bawah mata, berulang.
const AirMata = ({xs, y, kuat, frame}: {xs: number[]; y: number; kuat: number; frame: number}) => (
  <g opacity={kuat}>
    {xs.map((x, i) => {
      const siklus = ((frame + i * 19) % 38) / 38;
      return (
        <g key={i}>
          <path d={`M${x} ${y} V${y + 6 + siklus * 30}`} stroke={RIG_KERINGAT} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
          <g transform={`translate(${x} ${y + 14 + siklus * 46}) scale(0.8)`} opacity={1 - siklus * 0.6}>
            <path d={TETES} fill={RIG_KERINGAT} />
          </g>
        </g>
      );
    })}
  </g>
);

export const TokohRig = ({
  naskah,
  size,
  id,
  closeup = false,
  variant = 'raka',
  rapat = false,
  batasTangan,
  bawaan,
}: {
  naskah: NaskahRig;
  size: number;
  id: string;
  closeup?: boolean;
  variant?: LookName;
  rapat?: boolean;
  batasTangan?: BatasTangan;
  // Benda di tangan. `isi` digambar dalam satuan rig dengan titik genggam di (0, 0).
  bawaan?: Bawaan;
}) => {
  const frame = useCurrentFrame();
  const gaya: Look = LOOKS[variant];
  const mentah = hitungRig(naskah, frame, closeup);
  const k = rapat || batasTangan ? lenganAman(mentah, rapat, batasTangan) : mentah;
  const {yaw, yawRambut, yawBahu, condong, arah} = k;

  const mataKiriX = tigaNilai(-92, -52, 12, yaw);
  const mataKananX = tigaNilai(-12, 52, 92, yaw);
  const mulutX = tigaNilai(-52, 0, 52, yaw);
  const wajahY = -k.dongak * 26;
  const lebarJauh = 1 - 0.22 * Math.min(1, Math.abs(yaw));
  const lebarMulut = 1 - 0.18 * Math.min(1, Math.abs(yaw));
  const lebarKiri = yaw > 0 ? 1 : lebarJauh;
  const lebarKanan = yaw < 0 ? 1 : lebarJauh;

  const telingaKiriX = tigaNilai(-100, -122, -94, yaw);
  const telingaKananX = tigaNilai(94, 122, 100, yaw);
  const telingaY = -176 + Math.min(1, Math.abs(yaw)) * 6;
  const telingaBesar = 1 - 0.1 * Math.min(1, Math.abs(yaw));
  const kiriDekat = yaw > TELINGA_DEPAN;
  const kananDekat = yaw < -TELINGA_DEPAN;

  const badan = `translate(${yawBahu * 40} ${k.napas * 1.2}) rotate(${condong * 3 * arah} 0 60)`;
  const kepala = `translate(${condong * 10 * arah + k.geserKepala + yaw * 5 + yawBahu * 40} ${k.napas * 1.8 + k.bahu * 0.3 + k.turunKepala}) rotate(${k.miring} 0 -96)`;
  const kilap = `${id}-kilap`;
  const klipHijab = `${id}-hijab`;
  const hijab = gaya.hair === 'hijab';
  const garisKepala = kurva(tigaSudut(KEPALA_KIRI, KEPALA_DEPAN, KEPALA_KANAN, yaw));
  const garisHijab = kurva(tigaSudut(HIJAB_KIRI, HIJAB_DEPAN, HIJAB_KANAN, yawRambut));
  const garisWajah = kurva(tigaSudut(WAJAH_KIRI, WAJAH_DEPAN, WAJAH_KANAN, yaw));
  const lengan = (bagian: 'utama' | 'bantu') => (
    <Lengan k={k} side={(bagian === 'utama' ? arah : -arah) as 1 | -1} data={k[bagian]} gaya={gaya} bawaan={bawaan && (bawaan.bagian ?? 'utama') === bagian ? bawaan.isi(k, frame) : undefined} />
  );

  return (
    <svg width={size} height={size * 1.43} viewBox="-210 -320 420 600" style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id={kilap} x1="0" y1="0" x2="1" y2="1">
          <stop offset="55%" stopColor={gaya.shade} stopOpacity={0} />
          <stop offset="100%" stopColor={gaya.shade} stopOpacity={0.9} />
        </linearGradient>
        {hijab && (
          <clipPath id={klipHijab}>
            <path d={garisHijab} />
          </clipPath>
        )}
      </defs>
      <g fill="none" strokeLinecap="round">
        <path d="M-21 56 Q-25 150 -28 232" stroke={gaya.pants} strokeWidth={36} />
        <path d="M23 56 Q24 150 26 232" stroke={gaya.pants} strokeWidth={36} />
      </g>
      <path d="M-57 256 Q-59 235 -33 232 H-12 Q-6 244 -8 257 Z" fill={gaya.shoes} />
      <path d="M8 255 Q6 244 12 232 H31 Q58 233 56 256 Z" fill={gaya.shoes} />
      <g transform={badan}>
        <path d={kurva(TORSO.map(([x, y, lentur]): Titik => [x + (y < -60 ? yawBahu * 50 : 0), y, lentur]))} fill={gaya.top} />
        <ellipse cx={yawBahu * 60} cy={-92} rx={42} ry={10} fill={gaya.sleeve} />
        {gaya.hamil && (
          <g transform={`translate(${yawBahu * 30} 0)`}>
            <ellipse cx={0} cy={30} rx={60} ry={46} fill={gaya.top} />
            {/* Bayangan di bawah lengkung perut dan kilau tipis di atasnya, supaya terbaca bulat ke depan. */}
            <path d="M-50 52 Q0 88 50 52 Q30 72 0 76 Q-30 72 -50 52 Z" fill={gaya.sleeve} opacity={0.8} />
            <path d="M-34 4 Q-12 -12 16 -8" fill="none" stroke={WARNA_KILAU} strokeWidth={6} strokeLinecap="round" opacity={0.3} />
          </g>
        )}
      </g>
      <g transform={`translate(0 ${k.napas * 1.2}) rotate(${condong * 3 * arah} 0 60)`}>
        {!k.bantu.depan && lengan('bantu')}
        {!k.utama.depan && lengan('utama')}
      </g>
      <g transform={kepala}>
        {hijab ? (
          <>
            <path d={garisHijab} fill={gaya.hairColor} />
            {/* Wajah dipotong oleh kain luar, jadi kulit tidak bisa keluar dari hijab saat kain tertinggal. */}
            <g clipPath={`url(#${klipHijab})`}>
              <path d={kurva(tigaSudut(LIPAT_KIRI, LIPAT_DEPAN, LIPAT_KANAN, yawRambut))} fill={RIG_HIJAB_LIPAT} />
              <path d={garisWajah} fill={gaya.skin} />
              <path d={garisWajah} fill={`url(#${kilap})`} />
            </g>
          </>
        ) : (
          <>
            {!kiriDekat && <Telinga x={telingaKiriX} y={telingaY} besar={telingaBesar} warna={gaya.shade} />}
            {!kananDekat && <Telinga x={telingaKananX} y={telingaY} besar={telingaBesar} warna={gaya.shade} />}
            <path d={garisKepala} fill={gaya.skin} />
            <path d={garisKepala} fill={`url(#${kilap})`} />
            {kiriDekat && <Telinga x={telingaKiriX} y={telingaY} besar={telingaBesar} warna={gaya.shade} />}
            {kananDekat && <Telinga x={telingaKananX} y={telingaY} besar={telingaBesar} warna={gaya.shade} />}
          </>
        )}
        {k.ekspresi.merah > 0 && <Rona id={id} garis={hijab ? garisWajah : garisKepala} kuat={k.ekspresi.merah} />}
        {k.ekspresi.layar > 0 && <CahayaLayar id={id} garis={hijab ? garisWajah : garisKepala} kuat={k.ekspresi.layar} />}
        <Mata x={mataKiriX} y={-156 + wajahY} bentuk={k.mata} kedip={k.kedip} lebar={lebarKiri} sisi={1} />
        <Mata x={mataKananX} y={-156 + wajahY} bentuk={k.mata} kedip={k.kedip} lebar={lebarKanan} sisi={-1} />
        {k.ekspresi.airMata > 0 && <AirMata xs={[mataKiriX, mataKananX]} y={-142 + wajahY} kuat={k.ekspresi.airMata} frame={frame} />}
        <Mulut x={mulutX} y={-124 + wajahY} bentuk={k.mulut} lebar={lebarMulut} />
        {gaya.glasses && (
          <>
            <Gagang dari={mataKiriX - LENSA * lebarKiri} ke={telingaKiriX} y={-156 + wajahY} telingaY={telingaY} sisi={-1} />
            <Gagang dari={mataKananX + LENSA * lebarKanan} ke={telingaKananX} y={-156 + wajahY} telingaY={telingaY} sisi={1} />
          </>
        )}
        {gaya.hair === 'swoop' && <path d={kurva(tigaSudut(RAMBUT_KIRI, RAMBUT_DEPAN, RAMBUT_KANAN, yawRambut))} fill={gaya.hairColor} />}
        {gaya.hair === 'curly' && (
          <g fill={gaya.hairColor}>
            {tigaSudut(KERITING_KIRI, KERITING_DEPAN, KERITING_KANAN, yawRambut).map(([x, y, r], i) => (
              <circle key={i} cx={x} cy={y} r={r} />
            ))}
          </g>
        )}
        {gaya.glasses && <Kacamata kiriX={mataKiriX} kananX={mataKananX} y={-156 + wajahY} lebarKiri={lebarKiri} lebarKanan={lebarKanan} />}
        {k.ekspresi.keringat > 0 && <Keringat yaw={yaw} kuat={k.ekspresi.keringat} frame={frame} />}
      </g>
      {(k.bantu.depan || k.utama.depan) && (
        <g transform={`translate(0 ${k.napas * 1.2}) rotate(${condong * 3 * arah} 0 60)`}>
          {k.bantu.depan && lengan('bantu')}
          {k.utama.depan && lengan('utama')}
        </g>
      )}
    </svg>
  );
};

// Baris narasi satu adegan, dengan frame lokal adegan. Di dalam Sequence, `useCurrentFrame` juga lokal, jadi keduanya sekerangka.
type BarisRig = {start: number; frames: number; teks: string; pose?: string};

const JARAK_GESTUR = LAMA_GESTUR + TAHAN_MIN;

// Satu gestur per baris. Kunci otomatis yang terlalu dekat dilewati, dan `pose` tertulis mengalahkan kunci otomatis.
const jadwalGestur = (baris: BarisRig[], jenis: string, id: string) => {
  const hasil: {mulai: number; pose: NamaPoseRig; baris: number; tertulis: boolean}[] = [];
  rencanaPose(baris, jenis, id).forEach((kunci, i) => {
    const {pose: tulis, start, frames} = baris[i];
    const tertulis = tulis !== undefined && tulis in POSE_RIG;
    const pose = tertulis ? (tulis as NamaPoseRig) : kunci.pose;
    let mulai = kunci.mulai;
    for (let sebelum = hasil.at(-1); sebelum && mulai - sebelum.mulai < JARAK_GESTUR; sebelum = hasil.at(-1)) {
      if (!tertulis) return;
      if (sebelum.tertulis) {
        // Dua pose tertulis yang berdekatan: yang kedua menunggu di dalam barisnya sendiri.
        mulai = sebelum.mulai + JARAK_GESTUR;
        break;
      }
      hasil.pop();
    }
    if (mulai >= start + frames) return;
    if (!tertulis && pose === (hasil.at(-1)?.pose ?? 'netral')) return;
    hasil.push({mulai, pose, baris: i, tertulis});
  });
  return hasil;
};

// `look` lama menggeser wajah 30 px per satuan, sedangkan yaw 1 menggeser mata 64 px.
const YAW_PER_LOOK = 30 / 64;
const YAW_MAKS = 0.9;
const SELISIH_TOLEH = 0.12;
const PELUANG_IKUT_POSE = 0.65;
const PELUANG_LIRIK = 0.5;
const PELUANG_LIRIK_CEPAT = 0.35;
const TOLEH_BESAR = 0.6;
const PELAN_MIN = 24;
const PELAN_RENTANG = 7;
const TUNDA_BAHU = 4;

const pandangPose = (pose: NamaPoseRig) => (pose in POSE ? POSE[pose as keyof typeof POSE].pandang : 0);

// Pose berat menoleh penuh. Selebihnya sebagian baris saja yang menoleh, supaya kepala tidak bergerak di tiap baris.
const jadwalToleh = (seed: string, baris: BarisRig[], jenis: string, id: string, gestur: ReturnType<typeof jadwalGestur>, dasar: number, arah: 1 | -1) => {
  const hasil: KunciToleh[] = [{mulai: 0, ke: dasar, potong: true}];
  const lirikan = rencanaPose(baris, jenis, id);
  let kini = dasar;
  let bebas = 0;
  const tambah = (mulai: number, ke: number, cepat: boolean, kode: string) => {
    if (mulai < bebas || Math.abs(ke - kini) < SELISIH_TOLEH) return;
    const durasi = PELAN_MIN + Math.floor(random(`${seed}-toleh-${kode}`) * PELAN_RENTANG);
    hasil.push(cepat ? {mulai, ke} : {mulai, ke, lama: 'pelan', durasi});
    kini = ke;
    bebas = mulai + (cepat ? LAMA_TOLEH_CEPAT : durasi + TUNDA_BAHU) + TAHAN_MIN;
  };
  const arahan = (pandang: number) => batas(dasar + pandang * arah, -YAW_MAKS, YAW_MAKS);
  gestur.forEach((kunci, nomor) => {
    const ke = arahan(pandangPose(kunci.pose));
    const besar = kunci.pose === 'toleh' || Math.abs(ke - kini) >= TOLEH_BESAR;
    if (besar || kunci.tertulis || random(`${seed}-ikut-${nomor}`) < PELUANG_IKUT_POSE) tambah(kunci.mulai, ke, besar, `pose-${nomor}`);
    const {tengah, lirik} = lirikan[kunci.baris];
    if (tengah !== null && random(`${seed}-lirik-${nomor}`) < PELUANG_LIRIK) {
      tambah(tengah, arahan(pandangPose(kunci.pose) + lirik), random(`${seed}-lirik-cepat-${nomor}`) < PELUANG_LIRIK_CEPAT, `lirik-${nomor}`);
    }
  });
  return hasil;
};

const REAKSI_LAMA = 45;
const REAKSI_JEDA = 60;
const TANDA_KAGET = /!\s*$|^\s*(padahal|ternyata|justru)\b/i;

// Reaksi mata hanya di baris yang memang memintanya: seru atau kontras, tanya, dan baris akhir penutup.
const jadwalMata = (baris: BarisRig[], jenis: string) => {
  const hasil: KunciMata[] = [{mulai: 0, bentuk: 'titik'}];
  let bebas = 0;
  baris.forEach(({start, frames, teks}, i) => {
    const bentuk: BentukMata | null = TANDA_KAGET.test(teks) ? 'kaget' : jenis === 'penutup' && i === baris.length - 1 ? 'senang' : teks.trim().endsWith('?') ? 'datar' : null;
    if (!bentuk || start < bebas) return;
    hasil.push({mulai: start, bentuk}, {mulai: start + Math.min(REAKSI_LAMA, frames), bentuk: 'titik'});
    bebas = start + REAKSI_JEDA;
  });
  return hasil;
};

// Mengubah baris narasi satu adegan menjadi naskah rig. Hasilnya hanya bergantung pada isi adegan.
export const naskahAdegan = ({baris, jenis, id, look = 0, up = 0, arah = 1, dekat = false}: {baris: BarisRig[]; jenis: string; id: string; look?: number; up?: number; arah?: 1 | -1; dekat?: boolean}): NaskahRig => {
  // Id adegan sering sama antar-episode, jadi kalimat pertama ikut menentukan seed.
  const seed = `${id}-${baris[0]?.teks ?? ''}`;
  const gestur = jadwalGestur(baris, jenis, id);
  return naskahRig({
    seed,
    arah,
    dongak: up,
    dekat,
    gestur: [{mulai: 0, pose: 'netral', potong: true}, ...gestur.map(({mulai, pose}) => ({mulai, pose}))],
    toleh: jadwalToleh(seed, baris, jenis, id, gestur, look * YAW_PER_LOOK, arah),
    mata: jadwalMata(baris, jenis),
    bicara: baris.map(({start, frames}): [number, number] => [start, start + frames]),
  });
};
