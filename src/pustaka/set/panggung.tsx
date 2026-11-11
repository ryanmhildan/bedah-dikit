import {useMemo, type ReactNode} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Properti, type KeadaanProperti, type NamaProperti} from '../properti';
import {TokohRig, naskahRig, type Bawaan, type KeadaanRig, type NaskahRig} from '../tokoh-rig';
import type {LookName} from '../../Tokoh';
import {KEDALAMAN, Lapis, kameraDi, type Kamera} from './kamera';
import {popSkala} from './gerak';
import type {NamaBahan} from '../../tema';
import {geserTokohAksi, isiAksi, kameraAksi} from './aksi';
import {setInterior} from './interior';
import {setMejaAtas, setMejaSamping} from './meja';
import {setMikro} from './mikro';
import {setOrgan, setOrganPabrik} from './organ';
import {setTembus} from './tembus';
import {Cahaya, LatarRuang, Lensa, type Sorot, type SuasanaKini} from './ruang';
import type {HasilSet, PropertiShot, Shot, Slot, SuasanaShot, TokohShot} from './tipe';

// Blur kedalaman: belakang sedikit lembut, depan jelas buram.
export const BLUR_BELAKANG = 2.5;
export const BLUR_DEPAN = 16;

export type IsiPanggung = {
  // Di lapisan tengah, di belakang tokoh.
  belakangTokoh?: ReactNode;
  tokoh?: ReactNode;
  // Di lapisan tengah, di depan meja set.
  tengah?: ReactNode;
  depan?: ReactNode;
  // Di atas lensa, sekedalaman lapisan tengah: label angka yang menempel di benda tetapi tidak terwarnai suasana.
  label?: ReactNode;
};

// Menyusun satu set menjadi gambar berlapis: latar, belakang, tengah, cahaya, depan buram, lalu lensa.
export const Panggung = ({set, kamera, suasana, sorot, isi = {}, id}: {set: HasilSet; kamera: Kamera; suasana: SuasanaKini; sorot?: Sorot; isi?: IsiPanggung; id: string}) => {
  const cahaya = sorot ?? set.sorot;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {set.pakaiLatar && <LatarRuang suasana={suasana} kamera={kamera} sorot={cahaya} lantai={set.lantai} id={`${id}-latar`} />}
      {set.belakang && (
        <Lapis kamera={kamera} p={KEDALAMAN.belakang} blur={BLUR_BELAKANG}>
          {set.belakang}
        </Lapis>
      )}
      <Lapis kamera={kamera} p={KEDALAMAN.tengah}>
        {set.tengahBelakang}
        {isi.belakangTokoh}
        {isi.tokoh}
        {set.tengah}
        {isi.tengah}
      </Lapis>
      <Cahaya suasana={suasana} kamera={kamera} sorot={cahaya} id={`${id}-cahaya`} />
      {(set.depan || isi.depan) && (
        <Lapis kamera={kamera} p={KEDALAMAN.depan} blur={BLUR_DEPAN}>
          {set.depan}
          {isi.depan}
        </Lapis>
      )}
      <Lensa suasana={suasana} id={`${id}-lensa`} />
      {isi.label && (
        <Lapis kamera={kamera} p={KEDALAMAN.tengah}>
          {isi.label}
        </Lapis>
      )}
    </AbsoluteFill>
  );
};


// ---------------- Penyaji data shot ----------------

const bahanDari = (shot: Shot, awal: NamaBahan): NamaBahan => (shot.opsi?.bahan as NamaBahan | undefined) ?? awal;

export const buatSet = (shot: Shot, id = 'set'): HasilSet => {
  if (shot.set === 'meja' && shot.varian === 'samping') return setMejaSamping({bahan: bahanDari(shot, 'kayu')});
  if (shot.set === 'meja') return setMejaAtas({bahan: bahanDari(shot, 'kayu'), rapi: Boolean(shot.opsi?.rapi), luas: Boolean(shot.opsi?.luas)});
  if (shot.set === 'interior') return setInterior(shot.varian ?? 'kerja', {malam: Boolean(shot.opsi?.malam)});
  if (shot.set === 'organ' && shot.varian === 'pabrik') return setOrganPabrik('hati', {belah: shot.opsi?.belah === undefined ? undefined : Number(shot.opsi.belah)});
  if (shot.set === 'organ') return setOrgan(shot.varian === 'hati' ? 'hati' : 'jantung', {denyut: Number(shot.opsi?.denyut ?? 72), tidakTeratur: Boolean(shot.opsi?.tidakTeratur)});
  if (shot.set === 'mikro') return setMikro();
  if (shot.set === 'tembus') return setTembus({denyut: Number(shot.opsi?.denyut ?? 72), nyala: Number(shot.opsi?.nyala ?? 1), tidakTeratur: Boolean(shot.opsi?.tidakTeratur), id: `${id}-tembus`});
  // Ruang polos, dengan atau tanpa meja kecil di bawah sorot.
  if (shot.opsi?.meja) return setMejaSamping({bahan: bahanDari(shot, 'batu')});
  // Slot `tengah` berada di lantai ruang, tepat di genangan cahaya.
  return {slot: {tengah: {x: 540, y: 1360}}, pakaiLatar: true, lantai: 1320, sorot: {x: 540, y: 1360, lebar: 460, jenis: 'atas'}};
};

export const suasanaDi = (s: SuasanaShot, frame: number): SuasanaKini =>
  typeof s === 'string' ? s : {dari: s.dari, ke: s.ke, t: interpolate(frame, [s.mulai, s.mulai + s.lama], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})};

export const cariSlot = (set: HasilSet, slot: string | Slot): Slot => {
  if (typeof slot !== 'string') return slot;
  const ada = set.slot[slot];
  if (!ada) throw new Error(`Slot "${slot}" tidak ada. Pilihan: ${Object.keys(set.slot).join(', ')}`);
  return ada;
};

// Benda di slot, dengan pop 8 frame dari alasnya bila punya `muncul`.
export const PropertiDiSlot = ({set, item}: {set: HasilSet; item: PropertiShot}) => {
  const frame = useCurrentFrame();
  const titik = cariSlot(set, item.slot);
  const pop = item.muncul === undefined ? 1 : popSkala(frame - item.muncul);
  if (pop <= 0) return null;
  return (
    <g transform={`translate(${titik.x} ${titik.y}) scale(${pop})`}>
      <Properti nama={item.nama} tampak={item.tampak} keadaan={item.keadaan} skala={item.skala ?? titik.skala ?? 1} putar={item.putar} varian={item.varian} teks={item.teks} />
    </g>
  );
};

const MIRING_MINUM = 38;

// Benda di tangan rig. Gagang di genggaman, badan benda mengarah ke dalam badan tokoh.
// Saat tangan naik ke mulut (pose `minum`), benda dimiringkan ke arah wajah mengikuti sudut tangan.
export const bawaanProperti = ({nama, keadaan, bagian = 'utama', skala = 0.5, teks}: {nama: NamaProperti; keadaan?: KeadaanProperti; bagian?: 'utama' | 'bantu'; skala?: number; teks?: string}): Bawaan => ({
  bagian,
  isi: (k: KeadaanRig) => {
    const side = bagian === 'utama' ? k.arah : -k.arah;
    const miring = interpolate(k[bagian].tangan, [135, 210], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    // Uap mereda saat benda dimiringkan ke wajah, supaya garis uap tidak melintasi muka.
    const kini = keadaan?.uap === undefined ? keadaan : {...keadaan, uap: keadaan.uap * (1 - miring)};
    return <Properti nama={nama} keadaan={kini} skala={skala} digenggam cermin={side < 0} putar={-side * miring * MIRING_MINUM} teks={teks} />;
  },
});

// Titik asal rig ada di (210, 320) pada viewBox selebar 420. `skala` piksel dunia per satuan rig.
// `potong` memotong tokoh di bawah garis dunia itu, untuk tokoh yang duduk di balik meja.
export const TokohDiDunia = ({x, y, skala, naskah, id, variant = 'raka', bawaan, potong}: {x: number; y: number; skala: number; naskah: NaskahRig; id: string; variant?: LookName; bawaan?: Bawaan; potong?: number}) => (
  <g clipPath={potong === undefined ? undefined : `url(#${id}-potong)`}>
    {potong !== undefined && (
      <clipPath id={`${id}-potong`} clipPathUnits="userSpaceOnUse">
        <rect x={x - 2000} y={y - 4000} width={4000} height={potong - (y - 4000)} />
      </clipPath>
    )}
    <g transform={`translate(${x - 210 * skala} ${y - 320 * skala})`}>
      <TokohRig naskah={naskah} size={420 * skala} id={id} variant={variant} bawaan={bawaan} closeup={false} />
    </g>
  </g>
);

// Naskah rig dari data shot. `bicara` memakai rentang baris narasi, dalam frame lokal shot.
const naskahTokoh = (tokoh: TokohShot, id: string, baris?: [number, number]) => {
  const toleh = tokoh.toleh;
  return naskahRig({
    seed: id,
    arah: tokoh.arah ?? 1,
    dongak: tokoh.dongak,
    gestur: [{mulai: 0, pose: tokoh.pose, potong: true}, ...(tokoh.gestur ?? [])],
    toleh:
      toleh === undefined
        ? undefined
        : typeof toleh === 'number'
          ? [{mulai: 0, ke: toleh, potong: true}]
          : toleh.map((k, i) => ({...k, potong: i === 0 && k.mulai <= 0 ? true : undefined})),
    mata: tokoh.mata,
    mulut: tokoh.mulut,
    bicara: tokoh.bicara && baris ? [baris] : undefined,
  });
};

// Lapisan kosong tidak digambar, supaya tidak ada SVG buram yang sia-sia.
const gabungLapis = (daftar: (ReactNode | undefined)[]) => {
  const ada = daftar.filter((isi) => isi !== undefined && isi !== null && isi !== false && !(Array.isArray(isi) && isi.length === 0));
  return ada.length ? <>{ada.map((isi, i) => <g key={i}>{isi}</g>)}</> : undefined;
};

// Satu shot dari data. `durasi` panjang shot, untuk kamera tanpa `lama`. `baris` rentang narasi [mulai, akhir) dalam frame lokal shot.
// Koreografi khusus yang belum punya aksi bernama boleh ditambahkan lewat `tambahan`.
export const AdeganSet = ({
  shot,
  id,
  tambahan = {},
  durasi,
  baris,
  tokohUtama = 'raka',
}: {
  shot: Shot;
  id: string;
  tambahan?: IsiPanggung;
  durasi?: number;
  baris?: [number, number];
  tokohUtama?: LookName;
}) => {
  const frame = useCurrentFrame();
  const set = useMemo(() => buatSet(shot, id), [shot, id]);
  const naskah = useMemo(() => (shot.tokoh ? naskahTokoh(shot.tokoh, id, baris) : undefined), [shot.tokoh, id, baris]);
  const aksi = shot.aksi ?? [];
  const kamera = kameraAksi(aksi, kameraDi({...shot.kamera, lama: shot.kamera.lama ?? durasi}, frame), frame);
  const suasana = suasanaDi(shot.suasana, frame);
  const properti = shot.properti ?? [];
  const konteks = {set, frame, id, kamera, cariSlot: (slot: string | Slot) => cariSlot(set, slot)};
  const hasilAksi = aksi.map((a) => isiAksi(a, konteks));
  const tokoh =
    shot.tokoh &&
    naskah &&
    (() => {
      const titik = cariSlot(set, shot.tokoh.slot);
      const getar = geserTokohAksi(aksi, frame);
      return (
        <g transform={`translate(${getar.x} ${getar.y})`}>
          <TokohDiDunia
            x={titik.x}
            y={titik.y}
            skala={shot.tokoh.skala}
            naskah={naskah}
            id={`${id}-tokoh`}
            variant={shot.tokoh.variant ?? tokohUtama}
            potong={shot.tokoh.potong}
            bawaan={shot.tokoh.pegang && bawaanProperti(shot.tokoh.pegang)}
          />
        </g>
      );
    })();
  const depanMeja = shot.tokoh?.lapis === 'depan';
  const diLapis = (lapis: 'belakang' | 'tengah' | 'depan') =>
    properti.filter((p) => (p.lapis ?? 'tengah') === lapis).map((p, i) => <PropertiDiSlot key={`${lapis}-${i}`} set={set} item={p} />);
  const isi: IsiPanggung = {
    belakangTokoh: gabungLapis([diLapis('belakang'), ...hasilAksi.map((h) => h.belakangTokoh), tambahan.belakangTokoh]),
    tokoh: gabungLapis([depanMeja ? undefined : tokoh, tambahan.tokoh]),
    tengah: gabungLapis([diLapis('tengah'), ...hasilAksi.map((h) => h.tengah), depanMeja ? tokoh : undefined, tambahan.tengah]),
    depan: gabungLapis([diLapis('depan'), ...hasilAksi.map((h) => h.depan), tambahan.depan]),
    label: gabungLapis([...hasilAksi.map((h) => h.label), tambahan.label]),
  };
  return <Panggung set={set} kamera={kamera} suasana={suasana} sorot={shot.sorot} isi={isi} id={id} />;
};
