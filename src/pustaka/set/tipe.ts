import type {ReactNode} from 'react';
import type {NamaSuasana} from '../../tema';
import type {KeadaanProperti, NamaProperti, Tampak} from '../properti';
import type {BentukMata, BentukMulutRig, NamaPoseRig} from '../tokoh-rig';
import type {LookName} from '../../Tokoh';
import type {Aksi} from './aksi';
import type {Kamera, KurvaKamera} from './kamera';
import type {Sorot} from './ruang';

// Titik slot dalam koordinat dunia, tempat properti atau tokoh ditaruh. `skala` saran ukuran benda di slot itu.
export type Slot = {x: number; y: number; skala?: number};

// Hasil sebuah set: isi tiap lapisan, daftar slot, dan cahaya bawaan.
// `tengahBelakang` di belakang tokoh (kursi, lantai), `tengah` di depan tokoh (meja yang menutupi kaki).
export type HasilSet = {
  belakang?: ReactNode;
  tengahBelakang?: ReactNode;
  tengah?: ReactNode;
  depan?: ReactNode;
  slot: Record<string, Slot>;
  sorot?: Sorot;
  // Ruang dan organ memakai latar gradasi. Interior dan meja menutupi seluruh layar sendiri.
  pakaiLatar: boolean;
  lantai?: number;
};

// ---------------------------------------------------------------------------
// Bentuk data per shot di episode.json, dibaca dari `baris[].shot`.
// Semua frame di dalam shot lokal terhadap awal shot. Durasi shot dihitung dari suara:
// shot berlangsung sampai shot berikutnya mulai, atau sampai baris berikutnya.
// ---------------------------------------------------------------------------

// Set yang dikenal. Nama baru juga harus ditambahkan ke `SET` di scripts/episode.mjs.
export type NamaSet = 'ruang' | 'meja' | 'interior' | 'organ' | 'mikro' | 'tembus';

// Varian per set: meja `atas` | `samping`, interior `kerja` | `kamar` | `dapur` | `kafe` | `klinik`,
// organ `jantung` | `hati` | `pabrik` (hati sebagai pabrik, organ jadi dinding buram).
export type VarianSet = {
  ruang: undefined;
  meja: 'atas' | 'samping';
  interior: 'kerja' | 'kamar' | 'dapur' | 'kafe' | 'klinik';
  organ: 'jantung' | 'hati' | 'pabrik';
  mikro: undefined;
  tembus: undefined;
};

export type KameraShot = {
  dari: Kamera;
  ke?: Kamera;
  // Frame lokal mulai bergerak dan lamanya. Tanpa `lama`, kamera bergerak sepanjang shot.
  mulai?: number;
  lama?: number;
  kurva?: KurvaKamera;
};

export type PropertiShot = {
  nama: NamaProperti;
  // Nama slot set, misalnya `meja.atas`, atau titik dunia langsung.
  slot: string | Slot;
  tampak?: Tampak;
  keadaan?: KeadaanProperti;
  skala?: number;
  putar?: number;
  varian?: string;
  teks?: string;
  // Frame lokal saat benda muncul dengan pop 8 frame. Tanpa nilai ini benda sudah ada sejak awal.
  muncul?: number;
  // Lapisan tempat benda digambar. Bawaan `tengah`. `belakang` berada di belakang tokoh dan benda lain, misalnya noda di meja.
  lapis?: 'belakang' | 'tengah' | 'depan';
};

export type TokohShot = {
  // Slot tempat titik pinggang tokoh (titik asal rig) berdiri atau duduk.
  slot: string | Slot;
  // Piksel dunia per satuan rig.
  skala: number;
  pose: NamaPoseRig;
  // Pose berikutnya, misalnya dari `pegang` ke `minum`. Frame lokal shot.
  gestur?: {mulai: number; pose: NamaPoseRig}[];
  pegang?: {nama: NamaProperti; keadaan?: KeadaanProperti; bagian?: 'utama' | 'bantu'; skala?: number; teks?: string};
  arah?: 1 | -1;
  // Arah wajah awal, atau daftar toleh berwaktu.
  toleh?: number | {mulai: number; ke: number; lama?: 'cepat' | 'pelan'}[];
  dongak?: number;
  mata?: {mulai: number; bentuk: BentukMata}[];
  mulut?: {mulai: number; bentuk: BentukMulutRig}[];
  // Mulut bergerak selama baris narasi, hanya bila tokoh memang berbicara di layar.
  bicara?: boolean;
  // Tanpa nilai ini dipakai tokoh episode.
  variant?: LookName;
  // Garis dunia tempat tokoh dipotong, misalnya bibir depan meja saat tokoh duduk.
  potong?: number;
  // `depan` menggambar tokoh di depan meja set, misalnya tokoh berdiri di depan meja dapur.
  lapis?: 'belakang' | 'depan';
};

export type SuasanaShot = NamaSuasana | {dari: NamaSuasana; ke: NamaSuasana; mulai: number; lama: number};

// Cara masuk shot pertama sebuah adegan. Di dalam adegan, pergantian shot selalu potong langsung.
// `sapu` pita miring, `kartu` kartu warna polos bergaris miring (pemisah bab), `cair` lewat cairan, `potong` tanpa transisi.
export type MasukShot = 'sapu' | 'kartu' | 'cair' | 'potong';

export type BalonShot = {teks: string; mulai: number};

export type Shot = {
  [S in NamaSet]: {
    set: S;
    varian?: VarianSet[S];
    suasana: SuasanaShot;
    kamera: KameraShot;
    sorot?: Sorot;
    properti?: PropertiShot[];
    tokoh?: TokohShot;
    aksi?: Aksi[];
    // Pilihan set, misalnya bahan meja, denyut jantung, atau layar belah.
    opsi?: Record<string, string | number | boolean>;
    // Waktu mulai relatif terhadap awal baris: `pada` dalam frame, atau `porsi` 0..1 dari durasi baris.
    // Shot pertama sebuah baris selalu mulai di awal baris dan tidak perlu keduanya.
    pada?: number;
    porsi?: number;
    masuk?: MasukShot;
    // Balon ucapan putih di atas, misalnya pertanyaan penutup.
    balon?: BalonShot;
    // Baris sumber kecil di bawah. Tanpa nilai ini sumber tampil otomatis bila shot menampilkan angka
    // (label gelas ukur, label aksi, teks properti atau benda di tangan yang berangka).
    sumber?: boolean;
  };
}[NamaSet];
