import type {ReactNode} from 'react';
import {Easing, interpolate, random} from 'remotion';
import {BATANG, BATANG_TERANG, BAYANG_KONTAK, CORET, MIKRO, MOLEKUL, OTAK, PABRIK, SINYAL, WAHANA, WHITE} from '../../tema';
import {AliranTuang, GelasUkur, GerbongBagian, LabelUkur, Properti, SEL_OTAK, geometriSelOtak, getarGeser, titikPegang, type KeadaanProperti, type NamaProperti, type Tampak} from '../properti';
import {Kapsaisin, Kasein, R_KAPSAISIN} from '../molekul';
import {LenganLepas, TokohRig, naskahRig, type BentukMata, type BentukMulutRig, type KunciEkspresi, type NamaPoseRig} from '../tokoh-rig';
import {titikRel} from './wahana';
import type {LookName} from '../../Tokoh';
import {keLayar, type Kamera} from './kamera';
import {campur, campurTitik, lesat, mulus, pergi, popSkala} from './gerak';
import {SOKET, SOKET_X, puncakSoket} from './mikro';
import type {HasilSet, Slot} from './tipe';

// Aksi bernama: koreografi yang dipakai ulang lewat data shot, misalnya `{"aksi": "tuang", ...}`.
// Semua frame lokal terhadap awal shot. Tiap aksi menghasilkan isi lapisan panggung dari frame saja.

type Titik = {x: number; y: number};

// Tangan masuk membawa benda, menaruhnya di slot, lalu pergi. `lepas: null` berarti benda tetap digenggam.
export type AksiTaruh = {
  aksi: 'taruh';
  nama: NamaProperti;
  ke: string | Slot;
  bahu: Titik;
  tampak?: Tampak;
  skala?: number;
  keadaan?: KeadaanProperti;
  teks?: string;
  varian?: string;
  // Lebar lengan dalam piksel dunia.
  tebal?: number;
  tekuk?: number;
  // Frame tangan mulai masuk. Negatif berarti tangan sudah di tempat sejak awal shot.
  mulai?: number;
  // Tangan dan benda sudah di tempat sejak awal shot, tanpa bunyi. Menggantikan `mulai` negatif.
  selesai?: boolean;
  lepas?: number | null;
  // Bekas yang muncul di bawah benda setelah ditaruh, misalnya cincin noda kopi.
  bekas?: {nama?: NamaProperti; varian?: string; skala?: number; geser?: Titik; muncul?: number};
  variant?: LookName;
};

// Beberapa wadah dituang bergantian ke gelas ukur. Garis dan label dihitung dari nilai, dasar gelas adalah nol.
export type AksiTuang = {
  aksi: 'tuang';
  gelas: string | Slot;
  jumlah: number;
  perWadah: number;
  // Piksel dunia per satuan nilai.
  pxPerSatuan: number;
  satuan?: string;
  garis: {nilai: number; label?: string; denyut?: number}[];
  mulai?: number;
  jeda?: number;
  // Ruang kosong di atas isi penuh, dalam satuan nilai.
  ruangAtas?: number;
  wadah?: {x?: number; jarak?: number; skala?: number};
  lebar?: number;
  // Gelas memanjang ke atas sampai nilai `ke`, misalnya saat kamera menyorot naik.
  memanjang?: {mulai: number; lama: number; ke: number};
  // Semua tuangan sudah selesai sejak awal shot.
  selesai?: boolean;
  // Hanya gelas, tanpa wadah, misalnya saat tokoh berdiri di samping gelas.
  sembunyiWadah?: boolean;
};

// Ligan turun dan menancap ke soket satu per satu. `ligan` bawaan `adenosin` (nyala ungu),
// atau `kapsaisin` (nyala merah dengan gelombang panas). `selesai` semua sudah menancap sejak awal shot, tanpa bunyi.
export type AksiTancap = {aksi: 'tancap'; soket: number[]; mulai?: number; jeda?: number; lepas?: number; ligan?: 'adenosin' | 'kapsaisin'; selesai?: boolean};
// Kasein susu turun, mengikat kapsaisin yang menancap, lalu keduanya terangkat lepas dari soket dan nyala padam.
export type AksiIkat = {aksi: 'ikat'; soket: number[]; mulai?: number; jeda?: number};
// Sinyal saraf: denyut terang berjalan di jalur lengkung dari `dari` ke `ke`, lalu kilat di tujuan.
export type AksiSinyal = {aksi: 'sinyal'; dari: string | Slot; ke: string | Slot; mulai?: number; jumlah?: number; jeda?: number; lama?: number; lengkung?: number; tebal?: number};
// Properti yang keadaannya berubah mulus dari `dari` ke `ke`, misalnya isi gelas naik, jarum meter turun, atau alarm mulai berbunyi.
// `mulai` berbunyi pop. Perubahan yang mengecil atau turun (jarum meter, api padam) memakai `sejak`, yang sama tetapi tanpa bunyi,
// karena pop terdengar seperti benda muncul. `bayang: false` untuk benda yang melayang.
export type AksiUbah = {
  aksi: 'ubah';
  nama: NamaProperti;
  slot: string | Slot;
  dari: KeadaanProperti;
  ke: KeadaanProperti;
  mulai?: number;
  sejak?: number;
  bayang?: boolean;
  lama?: number;
  tampak?: Tampak;
  skala?: number;
  putar?: number;
  varian?: string;
  teks?: string;
  lapis?: 'belakang' | 'tengah' | 'depan';
  // Perubahan bertahap dalam sejumlah langkah yang sama besar, misalnya angka hari yang naik satu per satu.
  // Dengan `langkah`, waktu berjalan rata (tanpa pelan di ujung) dan tiap langkah berpindah cepat lalu ditahan.
  langkah?: number;
};
// Batang ukur vertikal yang dasarnya nol. Tinggi isi = nilai / `maks` x `tinggi`. Dengan `turun: true`, nilai dibaca sebagai
// penurunan dari penuh, jadi isi = (`maks` - nilai), misalnya kemampuan berpikir yang turun setara 1 atau 2 malam tanpa tidur.
// `garis` menandai nilai acuan dengan label di sampingnya. Bayangan isi awal tetap terlihat supaya penurunan terbaca jujur.
// Untuk data "setara sekian", pakai mode naik (tanpa `turun`) dengan `maks` sama dengan nilai acuan terbesar dan `garis` di tiap acuan,
// supaya tinggi jalur tidak terbaca sebagai persen. `alas: 'terang'` menggelapkan jalur dan garis di set yang terang, misalnya dinding lab.
// `mulai` berbunyi pop, `sejak` tanpa bunyi (untuk isi yang turun).
export type AksiBatang = {
  aksi: 'batang';
  slot: string | Slot;
  maks: number;
  dari: number;
  ke: number;
  turun?: boolean;
  garis?: {nilai: number; label?: string; muncul?: number}[];
  mulai?: number;
  sejak?: number;
  lama?: number;
  langkah?: number;
  tinggi?: number;
  lebar?: number;
  warna?: 'kemampuan' | 'kantuk' | 'bahaya';
  // Sisi label garis: 1 kanan, -1 kiri.
  sisi?: 1 | -1;
  // Ukuran label tetap di layar walau kamera zoom.
  ukuranLabel?: number;
  alas?: 'gelap' | 'terang';
};
// Benda berjajar dalam grid, jumlahnya dihitung dari data: ceil(nilai / perBenda). Muncul satu per satu dengan jeda `lag`.
// `kelompok` membagi benda menjadi beberapa kelompok sama besar berurutan, masing-masing memakai varian `0`, `1`, `2`, dan seterusnya.
export type AksiJajar = {
  aksi: 'jajar';
  nama: NamaProperti;
  pusat: string | Slot;
  nilai: number;
  perBenda?: number;
  kolom: number;
  jarak: number;
  jarakBaris?: number;
  kelompok?: number;
  // Jarak tambahan antar-kelompok, dalam piksel dunia, bila kelompok dipisah per baris.
  celahKelompok?: number;
  mulai?: number;
  sejak?: number;
  lag?: number;
  skala?: number;
  varian?: string;
  tampak?: Tampak;
};
// Garis coret merah yang ditarik melintang di atas label, misalnya anggapan yang keliru. Dengan `tetap`, `lebar` dan `geser` dalam piksel layar,
// sama seperti label `tetap` yang dicoret: label setinggi `ukuran` berpusat `ukuran` x 0,72 + 6 piksel di atas titik slot.
export type AksiCoret = {aksi: 'coret'; slot: string | Slot; geser?: Titik; lebar: number; mulai?: number; sejak?: number; lama?: number; tetap?: boolean; miring?: number};
// Aliran cairan di celah sel otak (properti `selOtak` di slot yang sama). Limbah di celah terbawa ke kanan dengan laju `laju`,
// jadi laju 2 membersihkan celah dua kali lebih cepat. `celah` faktor celah yang sama dengan `isi` properti selOtak.
// `besar` memperbesar butir limbah, misalnya saat petak sel digambar kecil di layar belah.
export type AksiAlir = {aksi: 'alir'; slot: string | Slot; skala?: number; celah?: number; laju?: number; jumlah?: number; besar?: number; mulai?: number; sejak?: number; selesai?: boolean};
// Tokoh oleng pelan ke kiri dan kanan, misalnya mengantuk atau setengah sadar. Tanpa bunyi.
export type AksiOleng = {aksi: 'oleng'; kuat: number; sejak?: number; lama?: number};
// Gerbong di set `wahana` meluncur sepanjang rel dari posisi `dari` ke `ke` (0..1), makin cepat seperti jatuh.
// Tokoh duduk di dalam gerbong dengan pose, mata, mulut, dan ekspresi sendiri.
export type AksiMeluncur = {
  aksi: 'meluncur';
  dari: number;
  ke: number;
  mulai: number;
  lama: number;
  skala?: number;
  pose?: NamaPoseRig;
  mata?: BentukMata;
  mulut?: BentukMulutRig;
  ekspresi?: KunciEkspresi[];
  variant?: LookName;
};
// Kafein menyerobot soket yang sudah terisi adenosin, adenosin terpental.
export type AksiSerobot = {aksi: 'serobot'; soket: number[]; mulai?: number; jeda?: number};
// Ban berjalan dengan mesin pemecah. `laju` 1 cepat, makin kecil makin lambat sehingga antrean menumpuk.
export type AksiPecah = {aksi: 'pecah'; y: number; laju: number; mesinX?: number; selang?: number};
// Deretan benda yang bertambah menjauh dari pusat, untuk kamera yang mundur.
// Dengan `nilai` dan `perBenda`, jumlah benda dihitung di kode: ceil(nilai / perBenda), misalnya 1.200 mg / 95 mg = 13 cangkir.
// Benda muncul satu per satu dari yang terdekat ke pusat, dengan jeda `lag`. Tanpa `nilai`, deret memakai grid `kolom` x `baris`.
export type AksiDeret = {
  aksi: 'mundur-deret';
  nama: NamaProperti;
  pusat: string | Slot;
  jarak: number;
  kolom?: number;
  baris?: number;
  nilai?: number;
  perBenda?: number;
  mulai?: number;
  lag?: number;
  skala?: number;
  tampak?: Tampak;
};
// Getar halus pada kamera atau tokoh. `mulai` berbunyi pop, `sejak` mulai tanpa bunyi, misalnya getar yang menyertai hentak.
export type AksiGetar = {aksi: 'getar'; sasaran: 'kamera' | 'tokoh'; kuat: number; mulai?: number; sejak?: number; lama?: number};
// Benda muncul dengan pop 8 frame di frame `mulai`, dan bersuara pop. Untuk benda yang tidak bersuara, pakai `properti` dengan `muncul`.
export type AksiMuncul = {aksi: 'muncul'; nama: NamaProperti; slot: string | Slot; mulai: number; tampak?: Tampak; skala?: number; putar?: number; varian?: string; teks?: string; keadaan?: KeadaanProperti};
// Hentakan kamera singkat di momen benturan.
export type AksiHentak = {aksi: 'hentak'; mulai: number; kuat?: number};
// Debu halus di berkas cahaya.
export type AksiDebu = {aksi: 'debu'; x?: number; y?: number; lebar?: number; tinggi?: number};
// Label angka yang menempel di samping benda, dalam koordinat dunia. Ikut kamera, tidak terwarnai suasana.
// `tetap: true` menjaga ukuran label di layar walau kamera mundur: label berpusat di titik slot + `geser` (dunia)
// dan berdiri tepat di atas titik itu.
// `aman: true` (bersama `tetap`) memudarkan label yang mulai keluar dari area aman x 80..950 di layar, misalnya label bilik saat kamera zoom.
export type AksiLabel = {aksi: 'label'; teks: string; slot: string | Slot; geser?: Titik; ukuran?: number; muncul?: number; tetap?: boolean; aman?: boolean};

export type Aksi =
  | AksiTaruh
  | AksiTuang
  | AksiTancap
  | AksiSerobot
  | AksiPecah
  | AksiDeret
  | AksiGetar
  | AksiHentak
  | AksiDebu
  | AksiLabel
  | AksiMuncul
  | AksiIkat
  | AksiSinyal
  | AksiUbah
  | AksiMeluncur
  | AksiBatang
  | AksiJajar
  | AksiCoret
  | AksiAlir
  | AksiOleng;
export type NamaAksi = Aksi['aksi'];

export type IsiAksi = {belakangTokoh?: ReactNode; tengah?: ReactNode; depan?: ReactNode; label?: ReactNode};

type Konteks = {set: HasilSet; frame: number; id: string; cariSlot: (slot: string | Slot) => Slot; kamera: Kamera};

// ---------------- Kamera dan tokoh ----------------
const HENTAK = [1, 0.82, 0.6, 0.38, 0.2, 0.08, 0];

export const kameraAksi = (daftar: Aksi[], kamera: Kamera, frame: number): Kamera => {
  let {x, y, zoom} = kamera;
  for (const a of daftar) {
    if (a.aksi === 'getar' && a.sasaran === 'kamera' && aktif(a, frame)) {
      x += Math.sin(frame * 1.7) * a.kuat * 6;
      y += Math.cos(frame * 2.3) * a.kuat * 4;
    }
    if (a.aksi === 'hentak') {
      const t = frame - a.mulai;
      const k = t >= 0 && t < HENTAK.length ? HENTAK[t] * (a.kuat ?? 1) : 0;
      zoom *= 1 + k * 0.07;
      y += k * 14 * (t % 2 === 0 ? 1 : -1);
    }
  }
  return {x, y, zoom};
};

const awalAksi = (a: {mulai?: number; sejak?: number}) => a.mulai ?? a.sejak ?? 0;
const aktif = (a: {mulai?: number; sejak?: number; lama?: number}, frame: number) => frame >= awalAksi(a) && (a.lama === undefined || frame < awalAksi(a) + a.lama);

// Geser tokoh dalam piksel dunia akibat getar.
export const geserTokohAksi = (daftar: Aksi[], frame: number): Titik => {
  let x = 0;
  let y = 0;
  for (const a of daftar) {
    if (a.aksi === 'getar' && a.sasaran === 'tokoh' && aktif(a, frame)) {
      x += Math.sin(frame * 2.9) * a.kuat * 5;
      y += Math.cos(frame * 3.7) * a.kuat * 2.5;
    }
  }
  return {x, y};
};

// Sudut oleng tokoh dalam derajat, berputar di titik pinggang.
export const olengTokohAksi = (daftar: Aksi[], frame: number) => {
  let sudut = 0;
  for (const a of daftar) {
    if (a.aksi === 'oleng' && aktif(a, frame)) {
      const masuk = Math.min(1, (frame - (a.sejak ?? 0)) / 12);
      sudut += Math.sin((frame - (a.sejak ?? 0)) / 13) * a.kuat * 4 * masuk;
    }
  }
  return sudut;
};

// Waktu bertahap: `t` 0..1 dipecah menjadi `langkah` anak tangga. Tiap anak tangga berpindah dalam seperempat waktunya, lalu ditahan.
export const bertahap = (t: number, langkah: number) => {
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  const s = t * langkah;
  const k = Math.floor(s);
  const sisa = Math.min(1, (s - k) * 4);
  return (k + (1 - Math.pow(1 - sisa, 3))) / langkah;
};

const waktuUbah = (frame: number, awal: number, lama: number, langkah?: number) =>
  langkah ? bertahap(interpolate(frame, [awal, awal + lama], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), langkah) : mulus(frame, awal, lama);

// ---------------- Taruh ----------------
const isiTaruh = (a: AksiTaruh, {frame, cariSlot}: Konteks): IsiAksi => {
  const titik = cariSlot(a.ke);
  const s = a.skala ?? titik.skala ?? 1;
  const tampak = a.tampak ?? 'samping';
  const tebal = a.tebal ?? 96;
  const mulai = a.selesai ? -60 : (a.mulai ?? 4);
  const lepas = a.lepas === undefined ? mulai + 22 : a.lepas;
  const pegang = titikPegang(a.nama, tampak);
  // Tampak atas: gagang diputar searah garis bahu ke benda. Tampak samping: gagang di sisi bahu.
  const sudut = Math.atan2(a.bahu.y - titik.y, a.bahu.x - titik.x);
  const atas = tampak === 'atas';
  const cermin = !atas && a.bahu.x < titik.x;
  const putar = atas ? (sudut * 180) / Math.PI : 0;
  const genggam = atas
    ? {x: titik.x + Math.cos(sudut) * pegang.x * s, y: titik.y + Math.sin(sudut) * pegang.x * s}
    : {x: titik.x + (cermin ? -pegang.x : pegang.x) * s, y: titik.y + pegang.y * s};
  const satuan = tebal / 26;
  const jarak = Math.hypot(genggam.x - a.bahu.x, genggam.y - a.bahu.y) || 1;
  const arah = {x: (genggam.x - a.bahu.x) / jarak, y: (genggam.y - a.bahu.y) / jarak};
  const pergelanganTaruh = {x: genggam.x - arah.x * 18 * satuan, y: genggam.y - arah.y * 18 * satuan};
  const luar = campurTitik(a.bahu, pergelanganTaruh, 0.15);

  const tMasuk = lesat(frame - mulai);
  const dipegang = lepas === null || frame < lepas;
  const tPergi = lepas === null ? 0 : pergi(frame - lepas, 12);
  const goyang = getarGeser(a.keadaan?.getar ?? 0, frame);
  const pergelangan = dipegang ? campurTitik(luar, pergelanganTaruh, tMasuk) : campurTitik(pergelanganTaruh, a.bahu, tPergi);
  const angkat = dipegang && lepas !== null ? 1 - lesat(frame - mulai - 6) : 0;
  const benda = <Properti nama={a.nama} tampak={tampak} keadaan={a.keadaan} skala={s * (1 + angkat * 0.06)} putar={putar} cermin={cermin} teks={a.teks} varian={a.varian} digenggam />;
  const bekas = a.bekas;
  const popBekas = bekas ? popSkala(frame - (bekas.muncul ?? (lepas ?? 1e9) + 3)) : 0;
  return {
    belakangTokoh: bekas && popBekas > 0 && (
      <Properti nama={bekas.nama ?? 'noda'} tampak="atas" x={titik.x + (bekas.geser?.x ?? 0)} y={titik.y + (bekas.geser?.y ?? 0)} skala={(bekas.skala ?? 1.3) * popBekas} varian={bekas.varian} />
    ),
    tengah: (
      <g>
        {!dipegang && <Properti nama={a.nama} tampak={tampak} keadaan={a.keadaan} x={titik.x} y={titik.y} skala={s} putar={putar} cermin={cermin} teks={a.teks} varian={a.varian} />}
        {(frame >= mulai || mulai < 0) && tPergi < 1 && (
          <LenganLepas dari={a.bahu} ke={{x: pergelangan.x + goyang.x, y: pergelangan.y + goyang.y}} tebal={tebal} tekuk={a.tekuk ?? -0.06} variant={a.variant} bawaan={dipegang ? benda : undefined} />
        )}
      </g>
    ),
  };
};

// ---------------- Tuang ----------------
const TUANG = {angkat: 8, miring: 7, alir: 8};
const MIRING_TUANG = 112;
const TINGGI_CANGKIR = 76;

const putarTitik = (p: Titik, derajat: number) => {
  const r = (derajat * Math.PI) / 180;
  return {x: p.x * Math.cos(r) - p.y * Math.sin(r), y: p.x * Math.sin(r) + p.y * Math.cos(r)};
};

// Pemisah ribuan titik, seperti penulisan angka di narasi.
export const formatAngka = (nilai: number) => String(nilai).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const isiTuang = (a: AksiTuang, {frame, cariSlot}: Konteks): IsiAksi => {
  const gelas = cariSlot(a.gelas);
  const px = a.pxPerSatuan;
  const total = a.jumlah * a.perWadah;
  const ruangAtas = a.ruangAtas ?? 120;
  const mulai = a.selesai ? -1e4 : (a.mulai ?? 8);
  const jeda = a.jeda ?? 17;
  const skala = a.wadah?.skala ?? 0.8;
  const jarak = a.wadah?.jarak ?? 76;
  const lebar = a.lebar ?? 300;
  const xWadah = a.wadah?.x ?? gelas.x - lebar / 2 - 30 - (a.jumlah - 0.5) * jarak;
  const tinggiAwal = (total + ruangAtas) * px;
  const tinggiDi = (f: number) => (a.memanjang ? campur(tinggiAwal, a.memanjang.ke * px, mulus(f, a.memanjang.mulai, a.memanjang.lama)) : tinggiAwal);
  const tinggi = tinggiDi(frame);
  const tinggiCangkir = TINGGI_CANGKIR * skala;
  const posisiTuang = {x: gelas.x - lebar * 0.4, y: gelas.y - tinggiAwal - 90};

  const wadah = Array.from({length: a.jumlah}, (_, i) => {
    const awal = mulai + i * jeda;
    const t = frame - awal;
    const diam = {x: xWadah + i * jarak, y: gelas.y};
    const selesaiAlir = TUANG.angkat + TUANG.alir;
    const p = t < selesaiAlir ? lesat(t * 2) : 1 - lesat((t - selesaiAlir) * 2);
    const lengkung = Math.sin(Math.PI * p) * -70;
    const pos = {x: campur(diam.x, posisiTuang.x, p), y: campur(diam.y, posisiTuang.y, p) + lengkung};
    const miring = t < selesaiAlir ? lesat((t - TUANG.angkat + TUANG.miring) * 2) * MIRING_TUANG : (1 - lesat((t - selesaiAlir) * 2)) * MIRING_TUANG;
    const isi = interpolate(t, [TUANG.angkat, selesaiAlir], [0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return {i, pos, miring, isi, mengalir: t >= TUANG.angkat && t < selesaiAlir, diam: pos.y >= gelas.y - 1};
  });
  const isiDi = (f: number) => Array.from({length: a.jumlah}, (_, i) => a.perWadah * mulus(f, mulai + i * jeda + TUANG.angkat, TUANG.alir)).reduce((x, y) => x + y, 0);
  const isi = isiDi(frame);
  // Label di atas tinggi awal muncul saat bibir gelas sudah melewati garisnya.
  const munculGaris = (nilai: number) => {
    if (nilai * px + 30 <= tinggiAwal) return -1e4;
    if (!a.memanjang) return 1e9;
    for (let f = -600; f < 2000; f++) if (tinggiDi(f) >= nilai * px + 30) return f;
    return 1e9;
  };
  // Label berdenyut sekali saat isi mencapai garisnya, atau di frame `denyut` yang ditulis.
  const denyutGaris = (nilai: number, tulis?: number) => {
    let mulaiDenyut = tulis;
    if (mulaiDenyut === undefined && !a.selesai && nilai <= total) {
      for (let f = mulai; f < mulai + a.jumlah * jeda + 40; f++) {
        if (isiDi(f) >= nilai - 0.5) {
          mulaiDenyut = f;
          break;
        }
      }
    }
    const t = mulaiDenyut === undefined ? -1 : frame - mulaiDenyut;
    return t >= 0 && t < 10 ? 1 + 0.22 * Math.sin((Math.PI * t) / 10) : 1;
  };
  const garis = a.garis.map((g) => ({nilai: g.nilai, label: g.label ?? `${formatAngka(g.nilai)}${a.satuan ?? ''}`, skala: popSkala(frame - munculGaris(g.nilai)) * denyutGaris(g.nilai, g.denyut)}));
  const urutan = [...wadah].sort((x, y) => Number(!x.diam) - Number(!y.diam));
  return {
    tengah: (
      <g>
        {urutan.map(({pos, miring, mengalir, i}) => {
          if (!mengalir) return null;
          const pusat = {x: pos.x, y: pos.y - tinggiCangkir / 2};
          const bibir = putarTitik({x: 42 * skala, y: -tinggiCangkir / 2}, miring);
          const mulut = {x: pusat.x + bibir.x, y: pusat.y + bibir.y};
          return <AliranTuang key={i} dari={mulut} ke={{x: mulut.x + 26, y: gelas.y - 16 - isi * px}} frame={frame} lebar={13} />;
        })}
        <g transform={`translate(${gelas.x} ${gelas.y})`}>
          <GelasUkur tinggi={tinggi} lebar={lebar} perSatuan={px} isi={isi} langkah={a.perWadah} garis={garis} bagian="gelas" />
        </g>
        {!a.sembunyiWadah && urutan.map(({pos, miring, isi: isiCangkir, i, diam}) => (
          <g key={i} transform={`translate(${pos.x} ${pos.y - tinggiCangkir / 2}) rotate(${miring}) translate(0 ${tinggiCangkir / 2})`}>
            <Properti nama="cangkir" skala={skala} cermin keadaan={{isi: isiCangkir}} bayang={diam} />
          </g>
        ))}
      </g>
    ),
    label: (
      <g transform={`translate(${gelas.x} ${gelas.y})`}>
        <GelasUkur tinggi={tinggi} lebar={lebar} perSatuan={px} garis={garis} bagian="label" />
      </g>
    ),
  };
};

// ---------------- Ligan di celah saraf ----------------
const R_ADENOSIN = 44;
const R_KAFEIN = 50;

const Kaki = ({r}: {r: number}) => (
  <g fill={MIKRO.kaki}>
    {[-1, 1].map((s) => (
      <rect key={s} x={s * (SOKET.lubang / 2) - 7} y={r - 8} width={14} height={40} rx={7} />
    ))}
  </g>
);

export const Adenosin = ({x, y, skala = 1, putar = 0, opacity = 1}: {x: number; y: number; skala?: number; putar?: number; opacity?: number}) => (
  <g transform={`translate(${x} ${y}) rotate(${putar}) scale(${skala})`} opacity={opacity}>
    <Kaki r={R_ADENOSIN} />
    <circle r={R_ADENOSIN} fill={MIKRO.adenosin} />
    <circle cx={14} cy={10} r={R_ADENOSIN * 0.62} fill={MIKRO.adenosinBayang} opacity={0.5} />
    <circle cx={-14} cy={-16} r={10} fill={WHITE} opacity={0.6} />
  </g>
);

const segiEnam = (r: number) =>
  Array.from({length: 6}, (_, i) => {
    const s = (Math.PI / 3) * i + Math.PI / 6;
    return `${i === 0 ? 'M' : 'L'}${(Math.cos(s) * r).toFixed(1)} ${(Math.sin(s) * r).toFixed(1)}`;
  }).join(' ') + ' Z';

export const SegiEnam = ({x, y, r, warna, dalam, skala = 1, putar = 0, kaki = false}: {x: number; y: number; r: number; warna: string; dalam: string; skala?: number; putar?: number; kaki?: boolean}) => (
  <g transform={`translate(${x} ${y}) rotate(${putar}) scale(${skala})`}>
    {kaki && <Kaki r={r} />}
    <path d={segiEnam(r)} fill={warna} />
    <path d={segiEnam(r * 0.55)} fill={dalam} opacity={0.75} />
  </g>
);

const Kafein = ({x, y, skala = 1, putar = 0}: {x: number; y: number; skala?: number; putar?: number}) => (
  <SegiEnam x={x} y={y} r={R_KAFEIN} warna={MIKRO.kafein} dalam={MIKRO.kafeinDalam} skala={skala} putar={putar} kaki />
);

// Nyala lembut di wajah soket: ungu redup saat adenosin menancap, oranye saat kafein menancap.
// Nyala kafein lebih pekat supaya tetap oranye di atas soket toska.
const NyalaSoket = ({i, warna, kuat, pekat = 0.55}: {i: number; warna: string; kuat: number; pekat?: number}) =>
  kuat <= 0 ? null : <ellipse cx={SOKET_X[i]} cy={puncakSoket(i) + 56} rx={SOKET.lebar * 0.42} ry={36} fill={warna} opacity={pekat * kuat} />;

const tancapDi = (i: number) => ({x: SOKET_X[i], y: puncakSoket(i) - R_ADENOSIN - 2});
const tancapKapsaisin = (i: number) => ({x: SOKET_X[i], y: puncakSoket(i) - R_KAPSAISIN * 0.8 - 4});

const LAMA_TANCAP = 16;

// Gelombang panas yang naik dari soket yang menyala merah.
const GelombangPanas = ({i, kuat, frame}: {i: number; kuat: number; frame: number}) =>
  kuat <= 0 ? null : (
    <g fill="none" stroke={MOLEKUL.panas} strokeWidth={8} strokeLinecap="round" opacity={kuat}>
      {[-1, 0, 1].map((k) => {
        const t = ((frame * 0.035 + (k + 1) / 3) % 1 + 1) % 1;
        const x = SOKET_X[i] + k * 46;
        const y = puncakSoket(i) - 120 - t * 160;
        return <path key={k} d={`M${x} ${y + 50} q-14 -12 0 -25 t0 -25`} opacity={1 - t} />;
      })}
    </g>
  );

const isiTancapKapsaisin = (a: AksiTancap, {frame}: Konteks): IsiAksi => {
  const mulai = a.selesai ? -1e4 : (a.mulai ?? 10);
  const jeda = a.jeda ?? 18;
  const ligan = a.soket.map((i, k) => {
    const t = frame - (mulai + k * jeda);
    const awal = {x: SOKET_X[i] + (k % 2 ? 80 : -70), y: 520 + k * 60 + Math.sin(frame / 14 + k) * 14};
    const p = lesat(t * 1.2);
    const pos = campurTitik(awal, tancapKapsaisin(i), p);
    const pipih = t >= LAMA_TANCAP && t < LAMA_TANCAP + 6 ? 1 - 0.1 * Math.sin((Math.PI * (t - LAMA_TANCAP)) / 6) : 1;
    return {i, k, pos, pipih, putar: (1 - p) * (k % 2 ? 40 : -40), nyala: interpolate(t, [LAMA_TANCAP - 4, LAMA_TANCAP + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})};
  });
  const melayang = [0, 1].map((k) => ({x: 160 + k * 720 + Math.sin(frame / 25 + k * 2) * 30, y: 700 - k * 160 + Math.cos(frame / 30 + k) * 20}));
  return {
    belakangTokoh: (
      <g>
        {melayang.map((p, k) => (
          <Kapsaisin key={`l${k}`} x={p.x} y={p.y} skala={0.8} putar={frame * 0.8 + k * 70} opacity={0.75} goyang={frame * 2} />
        ))}
        {ligan.map(({k, pos, pipih, putar}) => (
          <g key={k} transform={`translate(${pos.x} ${pos.y}) scale(${2 - pipih} ${pipih}) translate(${-pos.x} ${-pos.y})`}>
            <Kapsaisin x={pos.x} y={pos.y} putar={putar} kaki goyang={frame * 2 + k * 40} />
          </g>
        ))}
      </g>
    ),
    tengah: ligan.map(({i, nyala}) => (
      <g key={i}>
        <NyalaSoket i={i} warna={MOLEKUL.nyalaKapsaisin} kuat={nyala} pekat={0.85} />
        <GelombangPanas i={i} kuat={nyala} frame={frame} />
      </g>
    )),
  };
};

const isiTancap = (a: AksiTancap, k: Konteks): IsiAksi => {
  if (a.ligan === 'kapsaisin') return isiTancapKapsaisin(a, k);
  const {frame} = k;
  const mulai = a.selesai ? -1e4 : (a.mulai ?? 10);
  const jeda = a.jeda ?? 18;
  const ligan = a.soket.map((i, k) => {
    const t = frame - (mulai + k * jeda);
    const awal = {x: SOKET_X[i] + (k % 2 ? 70 : -60), y: 560 + k * 50 + Math.sin(frame / 14 + k) * 14};
    const p = lesat(t * 1.2);
    const pos = campurTitik(awal, tancapDi(i), p);
    const pipih = t >= LAMA_TANCAP && t < LAMA_TANCAP + 6 ? 1 - 0.1 * Math.sin((Math.PI * (t - LAMA_TANCAP)) / 6) : 1;
    return {i, k, pos, pipih, nyala: interpolate(t, [LAMA_TANCAP - 4, LAMA_TANCAP + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})};
  });
  // Dua butir tambahan yang hanya melayang, supaya celah terasa berisi.
  const melayang = [0, 1].map((k) => ({x: 180 + k * 690 + Math.sin(frame / 25 + k * 2) * 30, y: 760 - k * 140 + Math.cos(frame / 30 + k) * 20}));
  return {
    belakangTokoh: (
      <g>
        {melayang.map((p, k) => (
          <Adenosin key={`l${k}`} x={p.x} y={p.y} skala={0.8} putar={frame * 0.6 + k * 50} opacity={0.75} />
        ))}
        {ligan.map(({k, pos, pipih}) => (
          <g key={k} transform={`translate(${pos.x} ${pos.y}) scale(${2 - pipih} ${pipih}) translate(${-pos.x} ${-pos.y})`}>
            <Adenosin x={pos.x} y={pos.y} />
          </g>
        ))}
      </g>
    ),
    tengah: ligan.map(({i, nyala}) => <NyalaSoket key={i} i={i} warna={MIKRO.nyalaAdenosin} kuat={nyala} />),
  };
};

const LAMA_TERBANG = 7;
const LAMA_PENTAL = 24;

const isiSerobot = (a: AksiSerobot, {frame}: Konteks): IsiAksi => {
  const mulai = a.mulai ?? 15;
  const jeda = a.jeda ?? 8;
  const isi = a.soket.map((i, k) => {
    const t = frame - (mulai + k * jeda);
    const arah = k % 2 === 0 ? -1 : 1;
    const dari = {x: SOKET_X[i] + arah * 760, y: puncakSoket(i) - 720};
    const tujuan = {x: SOKET_X[i], y: puncakSoket(i) - R_KAFEIN - 2};
    const kafein = campurTitik(dari, tujuan, lesat(t * 2.2));
    const tPental = t - LAMA_TERBANG;
    const pental = interpolate(tPental, [0, LAMA_PENTAL], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (x) => 1 - Math.pow(1 - x, 3)});
    const adenosin = {x: tancapDi(i).x - arah * 420 * pental, y: tancapDi(i).y - 640 * pental + 260 * pental * pental};
    const pipih = tPental >= 0 && tPental < 6 ? 1 - 0.14 * Math.sin((Math.PI * tPental) / 6) : 1;
    return {i, k, t, kafein, adenosin, pental, pipih, arah};
  });
  return {
    belakangTokoh: (
      <g>
        {isi.map(({k, adenosin, pental, arah}) => (pental >= 1 ? null : <Adenosin key={`a${k}`} x={adenosin.x} y={adenosin.y} putar={-arah * pental * 260} opacity={1 - Math.max(0, pental - 0.7) / 0.3} />))}
        {isi.map(({k, t, kafein, pipih}) =>
          t < 0 ? null : (
            <g key={`k${k}`} transform={`translate(${kafein.x} ${kafein.y}) scale(${2 - pipih} ${pipih}) translate(${-kafein.x} ${-kafein.y})`}>
              <Kafein x={kafein.x} y={kafein.y} />
            </g>
          ),
        )}
      </g>
    ),
    tengah: isi.map(({i, pental}) => (
      <g key={i}>
        <NyalaSoket i={i} warna={MIKRO.nyalaAdenosin} kuat={1 - Math.min(1, pental * 3)} />
        <NyalaSoket i={i} warna={MIKRO.nyalaKafein} kuat={Math.min(1, pental * 2)} pekat={0.92} />
      </g>
    )),
  };
};

// ---------------- Pabrik: ban berjalan dan mesin pemecah ----------------
const LAJU_BAN = 5;
const JARAK_ANTRE = 86;
const R_BUTIR = 36;
const PROSES_DASAR = 14;

const jadwalPecah = (selang: number, proses: number, tempuh: number) => {
  const daftar: {masuk: number; pecah: number}[] = [];
  let sebelum = -1e9;
  for (let k = -24; k <= 16; k++) {
    const masuk = k * selang;
    const pecah = Math.max(masuk + tempuh, sebelum + proses);
    daftar.push({masuk, pecah});
    sebelum = pecah;
  }
  return daftar;
};

const isiPecah = (a: AksiPecah, {frame}: Konteks): IsiAksi => {
  const mesinX = a.mesinX ?? 660;
  const selang = a.selang ?? 26;
  const proses = PROSES_DASAR / Math.max(0.05, a.laju);
  const x0 = -160;
  const tempuh = (mesinX - x0) / LAJU_BAN;
  const jadwal = jadwalPecah(selang, proses, tempuh);
  const y = a.y;
  const permukaan = y - 18;
  // Palu turun 4 frame di setiap pemecahan, lalu naik 8 frame.
  const terakhir = jadwal.filter((j) => j.pecah <= frame).at(-1);
  const tPalu = terakhir ? frame - terakhir.pecah : 99;
  const turun = tPalu < 4 ? tPalu / 4 : tPalu < 12 ? 1 - (tPalu - 4) / 8 : 0;
  const geserBan = (frame * LAJU_BAN) % 60;
  return {
    tengah: (
      <g>
        {/* Ban berjalan dan rodanya. */}
        <rect x={-300} y={y - 18} width={1700} height={44} rx={22} fill={PABRIK.ban} />
        <g stroke={PABRIK.banGaris} strokeWidth={6}>
          {Array.from({length: 30}, (_, i) => (
            <path key={i} d={`M${-300 + i * 60 + geserBan} ${y - 14} V${y + 22}`} />
          ))}
        </g>
        {Array.from({length: 12}, (_, i) => (
          <g key={i} transform={`translate(${-240 + i * 130} ${y + 42}) rotate(${frame * LAJU_BAN * 2})`}>
            <circle r={20} fill={PABRIK.roda} />
            <path d="M-14 0 H14 M0 -14 V14" stroke={PABRIK.banGaris} strokeWidth={5} />
          </g>
        ))}
        {/* Butir kafein di atas ban, mengantre di depan mesin. */}
        {jadwal.map(({masuk, pecah}, k) => {
          if (frame < masuk || frame >= pecah) return null;
          const antre = jadwal.filter((j, n) => n < k && j.pecah > frame).length;
          const x = Math.min(x0 + (frame - masuk) * LAJU_BAN, mesinX - antre * JARAK_ANTRE);
          return <SegiEnam key={k} x={x} y={permukaan - R_BUTIR} r={R_BUTIR} warna={MIKRO.kafein} dalam={MIKRO.kafeinDalam} putar={(x / 40) % 60} />;
        })}
        {/* Serpihan hasil pecah, lebih kecil dan pucat, terus berjalan ke kanan. */}
        {jadwal.map(({pecah}, k) => {
          const t = frame - pecah;
          if (t < 0) return null;
          const x = mesinX + 40 + t * LAJU_BAN;
          if (x > 1400) return null;
          const loncat = Math.max(0, 1 - t / 10);
          return (
            <g key={`s${k}`}>
              {[-1, 0, 1].map((s) => (
                <circle key={s} cx={x + s * 30 + s * loncat * 22} cy={permukaan - 14 - Math.sin(Math.min(1, t / 10) * Math.PI) * 30 * (s === 0 ? 1.4 : 1)} r={13} fill={PABRIK.serpih} />
              ))}
            </g>
          );
        })}
        {/* Mesin pemecah dengan palu. */}
        {/* Palu diam di atas butir (puncak butir 72 di atas ban), lalu turun 80 sampai hampir menyentuh ban. */}
        <g transform={`translate(${mesinX} ${permukaan})`}>
          <rect x={-16} y={-200} width={32} height={60 + turun * 80} fill={PABRIK.mesinGelap} />
          <rect x={-66} y={-150 + turun * 80} width={132} height={40} rx={12} fill={PABRIK.palu} />
          <rect x={-110} y={-310} width={220} height={120} rx={26} fill={PABRIK.mesin} />
          <rect x={-90} y={-290} width={180} height={20} rx={10} fill={PABRIK.mesinGelap} opacity={0.5} />
          <circle cx={62} cy={-232} r={13} fill={tPalu < 8 ? PABRIK.lampuNyala : PABRIK.mesinGelap} />
        </g>
      </g>
    ),
  };
};

// ---------------- Deret yang memanjang ----------------
// Jumlah benda deret. Dari data (`nilai` / `perBenda`, dibulatkan ke atas) atau dari grid.
export const jumlahDeret = (a: AksiDeret) => {
  if (a.nilai !== undefined) {
    if (!a.perBenda || a.perBenda <= 0) throw new Error('mundur-deret: `perBenda` wajib lebih dari 0 bila memakai `nilai`');
    return Math.ceil(a.nilai / a.perBenda);
  }
  return (a.kolom ?? 1) * (a.baris ?? 1);
};

// Letak grid berselang (baris ganjil bergeser setengah jarak), diurutkan dari yang terdekat ke pusat.
const letakDeret = (a: AksiDeret) => {
  const jumlah = jumlahDeret(a);
  const r = a.nilai !== undefined ? Math.ceil(Math.sqrt(jumlah)) + 1 : Math.max(Math.floor((a.kolom ?? 1) / 2), Math.floor((a.baris ?? 1) / 2));
  const calon: {i: number; j: number; dx: number; dy: number; cincin: number}[] = [];
  for (let j = -r; j <= r; j++) {
    for (let i = -r; i <= r; i++) {
      if (a.nilai === undefined && (Math.abs(i) > Math.floor((a.kolom ?? 1) / 2) || Math.abs(j) > Math.floor((a.baris ?? 1) / 2))) continue;
      const dx = i + (j % 2 === 0 ? 0 : 0.5);
      const dy = j * 0.92;
      calon.push({i, j, dx, dy, cincin: Math.max(Math.abs(i), Math.abs(j))});
    }
  }
  if (a.nilai === undefined) return calon;
  // Urutan tetap: jarak ke pusat, lalu sudut, supaya hasilnya sama di setiap frame.
  const urut = [...calon].sort((p, q) => Math.hypot(p.dx, p.dy) - Math.hypot(q.dx, q.dy) || Math.atan2(p.dy, p.dx) - Math.atan2(q.dy, q.dx));
  return urut.slice(0, jumlah);
};

const isiDeret = (a: AksiDeret, {frame, cariSlot}: Konteks): IsiAksi => {
  const pusat = cariSlot(a.pusat);
  const mulai = a.mulai ?? 6;
  const lag = a.lag ?? 5;
  const dariData = a.nilai !== undefined;
  const benda: ReactNode[] = [];
  letakDeret(a).forEach(({i, j, dx, dy, cincin}, urutan) => {
    const tengah = i === 0 && j === 0;
    // Deret dari data muncul satu per satu sesuai urutan. Deret grid muncul per cincin.
    const pop = tengah ? 1 : popSkala(frame - (mulai + (dariData ? urutan - 1 : cincin) * lag));
    if (pop <= 0) return;
    const kode = `${a.nama}-${i}-${j}`;
    const x = pusat.x + dx * a.jarak + (random(`${kode}-x`) - 0.5) * a.jarak * 0.18;
    const y = pusat.y + dy * a.jarak + (random(`${kode}-y`) - 0.5) * a.jarak * 0.18;
    benda.push(
      <Properti
        key={kode}
        nama={a.nama}
        tampak={a.tampak ?? 'atas'}
        x={x}
        y={y}
        skala={(a.skala ?? 1) * pop}
        putar={tengah ? 0 : random(`${kode}-putar`) * 360}
        // Deret dari data menghitung benda penuh, jadi semua terisi. Deret grid boleh setengah kosong.
        keadaan={{isi: tengah || dariData ? 0.9 : 0.15 + random(`${kode}-isi`) * 0.75, uap: tengah ? 0.7 : 0}}
      />,
    );
  });
  return {tengah: <g>{benda}</g>};
};

// ---------------- Muncul ----------------
const isiMuncul = (a: AksiMuncul, {frame, cariSlot}: Konteks): IsiAksi => {
  const titik = cariSlot(a.slot);
  const pop = popSkala(frame - a.mulai);
  if (pop <= 0) return {};
  return {
    tengah: (
      <g transform={`translate(${titik.x} ${titik.y}) scale(${pop})`}>
        <Properti nama={a.nama} tampak={a.tampak} keadaan={a.keadaan} skala={a.skala ?? titik.skala ?? 1} putar={a.putar} varian={a.varian} teks={a.teks} />
      </g>
    ),
  };
};

// ---------------- Debu ----------------
const isiDebu = (a: AksiDebu, {frame}: Konteks): IsiAksi => {
  const x = a.x ?? 400;
  const y = a.y ?? 760;
  const lebar = a.lebar ?? 290;
  const tinggi = a.tinggi ?? 380;
  return {
    belakangTokoh: (
      <g fill={WHITE}>
        {Array.from({length: 16}, (_, i) => (
          <circle key={i} cx={x + ((i * 97) % lebar) + Math.sin(frame / 40 + i) * 12} cy={y + ((i * 151) % tinggi) - ((frame * (0.3 + (i % 4) * 0.1)) % 60)} r={2 + (i % 3)} opacity={0.18 + (i % 4) * 0.06} />
        ))}
      </g>
    ),
  };
};

// ---------------- Label ----------------
const isiLabel = (a: AksiLabel, {frame, cariSlot, kamera}: Konteks): IsiAksi => {
  const titik = cariSlot(a.slot);
  const pop = a.muncul === undefined ? 1 : popSkala(frame - a.muncul);
  if (pop <= 0) return {};
  const x = titik.x + (a.geser?.x ?? 0);
  const y = titik.y + (a.geser?.y ?? 0);
  const ukuran = a.ukuran ?? 40;
  if (a.tetap) {
    // Label yang keluar area aman memudar dalam 24 piksel layar, jadi tidak pernah tampil terpotong di tepi.
    let tampak = 1;
    if (a.aman) {
      const lebar = a.teks.length * ukuran * 0.58 + ukuran * 0.7;
      const pusat = keLayar(kamera, {x, y});
      const lewat = Math.max(80 - (pusat.x - lebar / 2), pusat.x + lebar / 2 - 950);
      tampak = Math.min(1, Math.max(0, 1 - lewat / 24));
      if (tampak <= 0) return {};
    }
    // Skala 1/zoom membatalkan zoom lapisan tengah, jadi tinggi label di layar selalu `ukuran`.
    return {
      label: (
        <g transform={`translate(${x} ${y}) scale(${1 / kamera.zoom})`} opacity={tampak}>
          <LabelUkur x={0} y={-ukuran * 0.72 - 6} teks={a.teks} ukuran={ukuran} skala={pop} rata="tengah" />
        </g>
      ),
    };
  }
  return {label: <LabelUkur x={x} y={y} teks={a.teks} ukuran={ukuran} skala={pop} />};
};

// ---------------- Ikat: kasein melepas kapsaisin ----------------
const LAMA_TURUN_KASEIN = 16;
const LAMA_ANGKAT = 34;

const isiIkat = (a: AksiIkat, {frame}: Konteks): IsiAksi => {
  const mulai = a.mulai ?? 10;
  const jeda = a.jeda ?? 14;
  const isi = a.soket.map((i, k) => {
    const t = frame - (mulai + k * jeda);
    const sisi = k % 2 ? 1 : -1;
    const dok = tancapKapsaisin(i);
    const temu = {x: dok.x + sisi * 34, y: dok.y - 88};
    const dari = {x: dok.x + sisi * 260, y: dok.y - 760};
    const turun = lesat(t * 1.1);
    const angkat = pergi(t - LAMA_TURUN_KASEIN, LAMA_ANGKAT);
    const geser = {x: sisi * 220 * angkat, y: -820 * angkat};
    const kasein = t < LAMA_TURUN_KASEIN ? campurTitik(dari, temu, turun) : {x: temu.x + geser.x, y: temu.y + geser.y};
    const kapsaisin = {x: dok.x + geser.x, y: dok.y + geser.y};
    const lepas = interpolate(t, [LAMA_TURUN_KASEIN, LAMA_TURUN_KASEIN + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return {i, k, t, kasein, kapsaisin, lepas, angkat};
  });
  return {
    belakangTokoh: (
      <g>
        {isi.map(({k, kapsaisin, angkat}) => (angkat >= 1 ? null : <Kapsaisin key={`c${k}`} x={kapsaisin.x} y={kapsaisin.y} putar={angkat * 30} kaki goyang={frame * 2 + k * 40} />))}
        {isi.map(({k, t, kasein, angkat}) => (t < 0 || angkat >= 1 ? null : <Kasein key={`k${k}`} x={kasein.x} y={kasein.y} skala={1.05} putar={Math.sin(frame / 12 + k) * 6} />))}
      </g>
    ),
    tengah: isi.map(({i, lepas, angkat}) => (
      <g key={i}>
        <NyalaSoket i={i} warna={MOLEKUL.nyalaKapsaisin} kuat={1 - lepas} pekat={0.85} />
        <GelombangPanas i={i} kuat={1 - Math.min(1, lepas + angkat)} frame={frame} />
      </g>
    )),
  };
};

// ---------------- Sinyal saraf ----------------
const LAMA_KILAT = 16;

const isiSinyal = (a: AksiSinyal, {frame, cariSlot}: Konteks): IsiAksi => {
  const dari = cariSlot(a.dari);
  const ke = cariSlot(a.ke);
  const mulai = a.mulai ?? 8;
  const jumlah = a.jumlah ?? 3;
  const jeda = a.jeda ?? 10;
  const lama = a.lama ?? 20;
  const lengkung = a.lengkung ?? 0.25;
  const tebal = a.tebal ?? 12;
  const panjang = Math.hypot(ke.x - dari.x, ke.y - dari.y) || 1;
  const kendali = {x: (dari.x + ke.x) / 2 - ((ke.y - dari.y) / panjang) * panjang * lengkung, y: (dari.y + ke.y) / 2 + ((ke.x - dari.x) / panjang) * panjang * lengkung};
  const titik = (t: number) => ({
    x: (1 - t) * (1 - t) * dari.x + 2 * (1 - t) * t * kendali.x + t * t * ke.x,
    y: (1 - t) * (1 - t) * dari.y + 2 * (1 - t) * t * kendali.y + t * t * ke.y,
  });
  const jalur = interpolate(frame, [mulai - 10, mulai], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const denyut = Array.from({length: jumlah}, (_, k) => (frame - mulai - k * jeda) / lama);
  const kilat = Array.from({length: jumlah}, (_, k) => frame - (mulai + k * jeda + lama));
  return {
    tengah: (
      <g>
        <path d={`M${dari.x} ${dari.y} Q${kendali.x} ${kendali.y} ${ke.x} ${ke.y}`} stroke={SINYAL.jalur} strokeWidth={tebal} strokeLinecap="round" fill="none" opacity={jalur} />
        {kilat.map((t, k) =>
          t < 0 || t >= LAMA_KILAT ? null : (
            <circle key={`f${k}`} cx={ke.x} cy={ke.y} r={40 + (t / LAMA_KILAT) * 150} fill={SINYAL.kilat} opacity={0.55 * (1 - t / LAMA_KILAT)} />
          ),
        )}
        {denyut.map((t, k) => {
          if (t < 0 || t > 1) return null;
          const p = titik(Easing.inOut(Easing.quad)(t));
          return (
            <g key={k}>
              <circle cx={p.x} cy={p.y} r={tebal * 3} fill={SINYAL.denyut} opacity={0.35} />
              <circle cx={p.x} cy={p.y} r={tebal * 1.4} fill={SINYAL.denyut} />
            </g>
          );
        })}
      </g>
    ),
  };
};

// ---------------- Ubah keadaan properti ----------------
const campurKeadaan = (dari: KeadaanProperti, ke: KeadaanProperti, t: number): KeadaanProperti => {
  const hasil: KeadaanProperti = {};
  for (const nama of new Set([...Object.keys(dari), ...Object.keys(ke)]) as Set<keyof KeadaanProperti>) {
    const a = dari[nama] ?? ke[nama] ?? 0;
    const b = ke[nama] ?? a;
    hasil[nama] = campur(a, b, t);
  }
  return hasil;
};

const isiUbah = (a: AksiUbah, {frame, cariSlot}: Konteks): IsiAksi => {
  const titik = cariSlot(a.slot);
  const t = waktuUbah(frame, awalAksi(a), a.lama ?? 30, a.langkah);
  const benda =<Properti nama={a.nama} tampak={a.tampak} keadaan={campurKeadaan(a.dari, a.ke, t)} x={titik.x} y={titik.y} skala={a.skala ?? titik.skala ?? 1} putar={a.putar} varian={a.varian} teks={a.teks} bayang={a.bayang} />;
  const lapis = a.lapis ?? 'tengah';
  return lapis === 'belakang' ? {belakangTokoh: benda} : lapis === 'depan' ? {depan: benda} : {tengah: benda};
};

// ---------------- Meluncur di rel wahana ----------------
const posisiMeluncur = (a: AksiMeluncur, frame: number) => {
  const t = interpolate(frame, [a.mulai, a.mulai + a.lama], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  return {t, s: campur(a.dari, a.ke, t)};
};

const isiMeluncur = (a: AksiMeluncur, {frame, id}: Konteks): IsiAksi => {
  const {s} = posisiMeluncur(a, frame);
  const p = titikRel(s);
  const laju = Math.abs(posisiMeluncur(a, frame).s - posisiMeluncur(a, frame - 1).s) * 1000;
  const skala = a.skala ?? 0.5;
  const naskah = naskahRig({
    seed: `${id}-gerbong`,
    gestur: [{mulai: 0, pose: a.pose ?? 'kaget', potong: true}],
    mata: [{mulai: 0, bentuk: a.mata ?? 'kaget'}],
    mulut: a.mulut ? [{mulai: 0, bentuk: a.mulut}] : undefined,
    ekspresi: a.ekspresi,
    dongak: 0.1,
  });
  return {
    tengah: (
      <g transform={`translate(${p.x} ${p.y}) rotate(${p.sudut})`}>
        {/* Garis laju di belakang gerbong, makin terang saat makin cepat. */}
        <g stroke={WAHANA.garisLaju} strokeWidth={8} strokeLinecap="round" opacity={Math.min(1, laju / 4)}>
          {[-150, -100, -50].map((y, i) => (
            <path key={y} d={`M${-240 - i * 40} ${y} h${-120 - laju * 30}`} />
          ))}
        </g>
        <GerbongBagian bagian="belakang" />
        {/* Tokoh dipotong di dasar gerbong, jadi kaki tidak menembus ke bawah rel. */}
        <clipPath id={`${id}-kursi`} clipPathUnits="userSpaceOnUse">
          <rect x={-600} y={-1200} width={1200} height={1200 - 60} />
        </clipPath>
        <g clipPath={`url(#${id}-kursi)`}>
          <g transform={`translate(${-210 * skala} ${-104 - 320 * skala})`}>
            <TokohRig naskah={naskah} size={420 * skala} id={`${id}-penumpang`} variant={a.variant ?? 'raka'} />
          </g>
        </g>
        <GerbongBagian bagian="depan" frame={frame} />
      </g>
    ),
  };
};

// ---------------- Batang ukur ----------------
const WARNA_BATANG = {kemampuan: BATANG.kemampuan, kantuk: BATANG.kantuk, bahaya: BATANG.bahaya};

const isiBatang = (a: AksiBatang, {frame, cariSlot, kamera}: Konteks): IsiAksi => {
  const titik = cariSlot(a.slot);
  const tinggi = a.tinggi ?? 440;
  const lebar = a.lebar ?? 96;
  const sisi = a.sisi ?? 1;
  const t = waktuUbah(frame, awalAksi(a), a.lama ?? 40, a.langkah);
  const nilai = campur(a.dari, a.ke, t);
  // Tinggi isi dari dasar (nol). Mode turun membaca nilai sebagai penurunan dari penuh.
  const tinggiDari = (v: number) => (Math.min(a.maks, Math.max(0, a.turun ? a.maks - v : v)) / a.maks) * tinggi;
  const isi = tinggiDari(nilai);
  const awal = tinggiDari(a.dari);
  const kiri = titik.x - lebar / 2;
  const dasar = titik.y;
  const ukuran = a.ukuranLabel ?? 34;
  const alas = a.alas === 'terang' ? BATANG_TERANG : BATANG;
  return {
    tengah: (
      <g>
        <ellipse cx={titik.x} cy={dasar + 4} rx={lebar * 0.75} ry={lebar * 0.12} fill={BAYANG_KONTAK} />
        <rect x={kiri - 8} y={dasar - tinggi - 8} width={lebar + 16} height={tinggi + 16} rx={lebar / 2 + 8} fill={alas.jalur} />
        <rect x={kiri - 8} y={dasar - tinggi - 8} width={lebar + 16} height={tinggi + 16} rx={lebar / 2 + 8} fill="none" stroke={alas.tepi} strokeWidth={5} />
        {isi > 1 && <rect x={kiri} y={dasar - isi} width={lebar} height={isi} rx={Math.min(lebar * 0.2, isi / 2)} fill={WARNA_BATANG[a.warna ?? 'kemampuan']} />}
        {/* Bayangan batas isi awal. */}
        {Math.abs(awal - isi) > 2 && <rect x={kiri - 14} y={dasar - awal - 3} width={lebar + 28} height={6} rx={3} fill={BATANG.awal} />}
        {(a.garis ?? []).map((g) => {
          const pop = g.muncul === undefined ? 1 : popSkala(frame - g.muncul);
          if (pop <= 0) return null;
          const y = dasar - tinggiDari(g.nilai);
          return <rect key={g.nilai} x={kiri - 22} y={y - 4} width={(lebar + 44) * pop} height={8} rx={4} fill={alas.garis} />;
        })}
      </g>
    ),
    label: (
      <g>
        {(a.garis ?? []).map((g) => {
          const pop = g.muncul === undefined ? 1 : popSkala(frame - g.muncul);
          if (pop <= 0 || !g.label) return null;
          const y = dasar - tinggiDari(g.nilai);
          const lebarLabel = (g.label.length * ukuran * 0.58 + ukuran * 0.7) / kamera.zoom;
          const x = sisi > 0 ? titik.x + lebar / 2 + 30 + lebarLabel / 2 : titik.x - lebar / 2 - 30 - lebarLabel / 2;
          return (
            <g key={g.nilai} transform={`translate(${x} ${y}) scale(${1 / kamera.zoom})`}>
              <LabelUkur x={0} y={0} teks={g.label} ukuran={ukuran} skala={pop} rata="tengah" />
            </g>
          );
        })}
      </g>
    ),
  };
};

// ---------------- Jajar ----------------
export const jumlahJajar = (a: AksiJajar) => Math.ceil(a.nilai / (a.perBenda ?? 1));

const isiJajar = (a: AksiJajar, {frame, cariSlot}: Konteks): IsiAksi => {
  const pusat = cariSlot(a.pusat);
  const jumlah = jumlahJajar(a);
  const kolom = Math.max(1, a.kolom);
  const baris = Math.ceil(jumlah / kolom);
  const jarakBaris = a.jarakBaris ?? a.jarak;
  const perKelompok = a.kelompok ? Math.ceil(jumlah / a.kelompok) : jumlah;
  const barisPerKelompok = Math.ceil(perKelompok / kolom);
  const celah = a.celahKelompok ?? 0;
  const jumlahCelah = a.kelompok ? a.kelompok - 1 : 0;
  const tinggiTotal = (baris - 1) * jarakBaris + jumlahCelah * celah;
  const mulai = a.mulai ?? a.sejak ?? 6;
  const lag = a.lag ?? 2;
  const benda: ReactNode[] = [];
  for (let i = 0; i < jumlah; i++) {
    const pop = popSkala(frame - (mulai + i * lag));
    if (pop <= 0) continue;
    const r = Math.floor(i / kolom);
    const c = i % kolom;
    const diBaris = Math.min(kolom, jumlah - r * kolom);
    const kelompok = a.kelompok ? Math.floor(i / perKelompok) : undefined;
    const x = pusat.x + (c - (diBaris - 1) / 2) * a.jarak;
    const y = pusat.y - tinggiTotal / 2 + r * jarakBaris + (a.kelompok ? Math.floor(r / barisPerKelompok) * celah : 0);
    benda.push(
      <g key={i} transform={`translate(${x} ${y}) scale(${pop})`}>
        <Properti nama={a.nama} tampak={a.tampak} skala={a.skala ?? 1} varian={kelompok === undefined ? a.varian : String(kelompok)} bayang={false} />
      </g>,
    );
  }
  return {tengah: <g>{benda}</g>};
};

// ---------------- Coret ----------------
const isiCoret = (a: AksiCoret, {frame, cariSlot, kamera}: Konteks): IsiAksi => {
  const titik = cariSlot(a.slot);
  const awal = awalAksi(a);
  const t = interpolate(frame, [awal, awal + (a.lama ?? 10)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  if (t <= 0) return {};
  const skala = a.tetap ? 1 / kamera.zoom : 1;
  const miring = a.miring ?? -6;
  const setengah = a.lebar / 2;
  return {
    label: (
      <g transform={`translate(${titik.x} ${titik.y}) scale(${skala}) translate(${a.geser?.x ?? 0} ${a.geser?.y ?? 0}) rotate(${miring})`}>
        <path d={`M${-setengah} 0 L${-setengah + a.lebar * t} 0`} stroke={CORET} strokeWidth={14} strokeLinecap="round" />
      </g>
    ),
  };
};

// ---------------- Alir di celah sel otak ----------------
const LAJU_ALIR = 9;

const Limbah = ({x, y, r, putar}: {x: number; y: number; r: number; putar: number}) => (
  <g transform={`translate(${x} ${y}) rotate(${putar})`}>
    <circle cx={-r * 0.4} cy={0} r={r * 0.7} fill={OTAK.limbahGelap} />
    <circle cx={r * 0.35} cy={-r * 0.2} r={r * 0.65} fill={OTAK.limbah} />
    <circle cx={0} cy={r * 0.4} r={r * 0.5} fill={OTAK.limbah} />
  </g>
);

const isiAlir = (a: AksiAlir, {frame, cariSlot}: Konteks): IsiAksi => {
  const titik = cariSlot(a.slot);
  const s = a.skala ?? 1;
  const geo = geometriSelOtak(a.celah ?? 1);
  const laju = a.laju ?? 1;
  const mulai = a.selesai ? -1e4 : awalAksi(a);
  const jalan = Math.max(0, frame - mulai);
  const kiri = -SEL_OTAK.lebar / 2;
  const kanan = SEL_OTAK.lebar / 2;
  const jumlah = a.jumlah ?? 24;
  // Kanal di dalam petak saja, celah tepi atas dan bawah tidak dipakai.
  const kanal = geo.kanal.slice(1, -1);
  const r = Math.min(16, geo.g * 0.42) * (a.besar ?? 1);
  // Garis aliran muncul pelan saat aliran mulai.
  const kuatAlir = interpolate(frame - mulai, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {
    tengah: (
      <g transform={`translate(${titik.x} ${titik.y}) scale(${s})`}>
        <g stroke={OTAK.aliran} strokeWidth={Math.max(3, geo.g * 0.16)} strokeLinecap="round" fill="none" opacity={kuatAlir}>
          {kanal.map((y, i) =>
            [0, 1, 2].map((k) => {
              const panjang = 120;
              const x = kiri + ((((k * 420 + i * 150 + frame * LAJU_ALIR * laju * 1.4) % (SEL_OTAK.lebar + panjang)) + SEL_OTAK.lebar + panjang) % (SEL_OTAK.lebar + panjang)) - panjang;
              return <path key={`${i}-${k}`} d={`M${Math.max(kiri, x)} ${y} L${Math.min(kanan, x + panjang)} ${y}`} opacity={x + panjang < kiri || x > kanan ? 0 : 1} />;
            }),
          )}
        </g>
        {Array.from({length: jumlah}, (_, i) => {
          const y = kanal[i % kanal.length] + (random(`limbah-y-${i}`) - 0.5) * geo.g * 0.3;
          const x0 = kiri + 40 + random(`limbah-x-${i}`) * (SEL_OTAK.lebar - 80);
          const x = x0 + jalan * LAJU_ALIR * laju + Math.sin(frame / 9 + i) * 3;
          if (x > kanan + r) return null;
          const pudar = interpolate(x, [kanan - 60, kanan], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <g key={i} opacity={pudar}>
              <Limbah x={x} y={y} r={r} putar={i * 47 + frame * 2} />
            </g>
          );
        })}
      </g>
    ),
  };
};

export const isiAksi = (a: Aksi, k: Konteks): IsiAksi => {
  switch (a.aksi) {
    case 'taruh':
      return isiTaruh(a, k);
    case 'tuang':
      return isiTuang(a, k);
    case 'tancap':
      return isiTancap(a, k);
    case 'serobot':
      return isiSerobot(a, k);
    case 'pecah':
      return isiPecah(a, k);
    case 'mundur-deret':
      return isiDeret(a, k);
    case 'debu':
      return isiDebu(a, k);
    case 'label':
      return isiLabel(a, k);
    case 'muncul':
      return isiMuncul(a, k);
    case 'ikat':
      return isiIkat(a, k);
    case 'sinyal':
      return isiSinyal(a, k);
    case 'ubah':
      return isiUbah(a, k);
    case 'meluncur':
      return isiMeluncur(a, k);
    case 'batang':
      return isiBatang(a, k);
    case 'jajar':
      return isiJajar(a, k);
    case 'coret':
      return isiCoret(a, k);
    case 'alir':
      return isiAlir(a, k);
    default:
      return {};
  }
};
