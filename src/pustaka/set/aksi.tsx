import type {ReactNode} from 'react';
import {interpolate, random} from 'remotion';
import {MIKRO, PABRIK, WHITE} from '../../tema';
import {AliranTuang, GelasUkur, LabelUkur, Properti, getarGeser, titikPegang, type KeadaanProperti, type NamaProperti, type Tampak} from '../properti';
import {LenganLepas} from '../tokoh-rig';
import type {LookName} from '../../Tokoh';
import type {Kamera} from './kamera';
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

// Butir adenosin turun dan menancap ke soket satu per satu.
export type AksiTancap = {aksi: 'tancap'; soket: number[]; mulai?: number; jeda?: number; lepas?: number};
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
// Getar halus pada kamera atau tokoh.
export type AksiGetar = {aksi: 'getar'; sasaran: 'kamera' | 'tokoh'; kuat: number; mulai?: number; lama?: number};
// Benda muncul dengan pop 8 frame di frame `mulai`, dan bersuara pop. Untuk benda yang tidak bersuara, pakai `properti` dengan `muncul`.
export type AksiMuncul = {aksi: 'muncul'; nama: NamaProperti; slot: string | Slot; mulai: number; tampak?: Tampak; skala?: number; putar?: number; varian?: string; teks?: string; keadaan?: KeadaanProperti};
// Hentakan kamera singkat di momen benturan.
export type AksiHentak = {aksi: 'hentak'; mulai: number; kuat?: number};
// Debu halus di berkas cahaya.
export type AksiDebu = {aksi: 'debu'; x?: number; y?: number; lebar?: number; tinggi?: number};
// Label angka yang menempel di samping benda, dalam koordinat dunia. Ikut kamera, tidak terwarnai suasana.
// `tetap: true` menjaga ukuran label di layar walau kamera mundur: label berpusat di titik slot + `geser` (dunia)
// dan berdiri tepat di atas titik itu.
export type AksiLabel = {aksi: 'label'; teks: string; slot: string | Slot; geser?: Titik; ukuran?: number; muncul?: number; tetap?: boolean};

export type Aksi = AksiTaruh | AksiTuang | AksiTancap | AksiSerobot | AksiPecah | AksiDeret | AksiGetar | AksiHentak | AksiDebu | AksiLabel | AksiMuncul;
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

const aktif = (a: {mulai?: number; lama?: number}, frame: number) => frame >= (a.mulai ?? 0) && (a.lama === undefined || frame < (a.mulai ?? 0) + a.lama);

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
  const benda = <Properti nama={a.nama} tampak={tampak} keadaan={a.keadaan} skala={s * (1 + angkat * 0.06)} putar={putar} cermin={cermin} teks={a.teks} digenggam />;
  const bekas = a.bekas;
  const popBekas = bekas ? popSkala(frame - (bekas.muncul ?? (lepas ?? 1e9) + 3)) : 0;
  return {
    belakangTokoh: bekas && popBekas > 0 && (
      <Properti nama={bekas.nama ?? 'noda'} tampak="atas" x={titik.x + (bekas.geser?.x ?? 0)} y={titik.y + (bekas.geser?.y ?? 0)} skala={(bekas.skala ?? 1.3) * popBekas} varian={bekas.varian} />
    ),
    tengah: (
      <g>
        {!dipegang && <Properti nama={a.nama} tampak={tampak} keadaan={a.keadaan} x={titik.x} y={titik.y} skala={s} putar={putar} cermin={cermin} teks={a.teks} />}
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

const LAMA_TANCAP = 16;

const isiTancap = (a: AksiTancap, {frame}: Konteks): IsiAksi => {
  const mulai = a.mulai ?? 10;
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
    // Skala 1/zoom membatalkan zoom lapisan tengah, jadi tinggi label di layar selalu `ukuran`.
    return {
      label: (
        <g transform={`translate(${x} ${y}) scale(${1 / kamera.zoom})`}>
          <LabelUkur x={0} y={-ukuran * 0.72 - 6} teks={a.teks} ukuran={ukuran} skala={pop} rata="tengah" />
        </g>
      ),
    };
  }
  return {label: <LabelUkur x={x} y={y} teks={a.teks} ukuran={ukuran} skala={pop} />};
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
    default:
      return {};
  }
};
