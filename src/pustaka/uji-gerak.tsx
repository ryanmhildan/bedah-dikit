import type {ReactNode} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {FONT} from '../DataShort';
import {ANGKA_BAYANG, WHITE} from '../tema';
import {Depan, Dunia} from './dunia';
import {Ikon} from './ikon';
import {TokohRig, hitungRig, naskahRig, posisiTangan, type NaskahRig} from './tokoh-rig';

// Klip uji gerak tanpa narasi dan audio. Semua momen memakai satu naskah rig dan satu garis waktu.
const F = {
  tunjuk: 28,
  kaget: 84,
  potongSedang: 118,
  tadah: 120,
  pop: 136,
  whip: 172,
  menoleh: 179,
  dorong: 208,
  fokus: 250,
  panel: 322,
  angka: 352,
  total: 430,
};

export const UJI_GERAK_FRAMES = F.total;

const LAMA_WHIP = 7;
const POTONG_WHIP = F.whip + 3;
const LAMA_PANEL = 18;
const SELESAI_PANEL = F.panel + LAMA_PANEL;

const NASKAH = naskahRig({
  seed: 'uji-gerak',
  gestur: [
    {mulai: 0, pose: 'netral', potong: true},
    {mulai: F.tunjuk, pose: 'tunjuk'},
    {mulai: F.kaget, pose: 'kaget'},
    {mulai: F.tadah, pose: 'tadah'},
    {mulai: POTONG_WHIP, pose: 'netral', potong: true},
    {mulai: F.fokus + 22, pose: 'jelaskan'},
  ],
  toleh: [
    {mulai: F.kaget, ke: -1},
    {mulai: F.tadah + 8, ke: 1},
    {mulai: F.menoleh, ke: -1, lama: 'pelan', durasi: 28},
    {mulai: F.fokus + 22, ke: 0, lama: 'pelan', durasi: 24},
  ],
  mata: [
    {mulai: 0, bentuk: 'titik'},
    {mulai: F.kaget, bentuk: 'kaget'},
    {mulai: F.pop + 6, bentuk: 'senang'},
    {mulai: POTONG_WHIP, bentuk: 'titik'},
  ],
  bicara: [
    [6, 62],
    [F.fokus + 24, F.fokus + 62],
  ],
});

// Penutup punya naskah sendiri, karena Raka di dunia baru sudah terlihat saat panel masih berjalan.
const NASKAH_PENUTUP = naskahRig({
  seed: 'uji-gerak-penutup',
  gestur: [
    {mulai: 0, pose: 'netral', potong: true},
    {mulai: F.angka + 44, pose: 'jelaskan'},
  ],
  mata: [
    {mulai: 0, bentuk: 'titik'},
    {mulai: F.angka + 44, bentuk: 'senang'},
  ],
});

// Letak tokoh ditulis dari pusat kepala di layar. `s` adalah piksel per satuan rig.
const LEBAR_RIG = 420;
const Raka = ({x, y, s, closeup = false, naskah = NASKAH}: {x: number; y: number; s: number; closeup?: boolean; naskah?: NaskahRig}) => (
  <div style={{position: 'absolute', left: x - 210 * s, top: y - 130 * s}}>
    <TokohRig naskah={naskah} size={LEBAR_RIG * s} id="raka-uji" closeup={closeup} />
  </div>
);

// Whip: blur 0, 40, 90, puncak 140, 90, 40, 0. Tampilan dipotong ke dunia baru tepat di puncak.
const WHIP_BLUR = [0, 40, 90, 140, 90, 40, 0];
const WHIP_GESER = [0, -120, -380, 560, 240, 60, 0];
// Angka blur adalah panjang sapuan yang terlihat. Filter Gaussian menyebar sekitar 2,5 kali deviasinya.
const SAPUAN_PER_DEVIASI = 2.5;

const Whip = ({blur, children}: {blur: number; children: ReactNode}) => {
  if (blur <= 0) return <>{children}</>;
  return (
    <>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id="whip-arah" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${blur / SAPUAN_PER_DEVIASI} 0`} />
          {/* Blur memudar di tepi bingkai. Alfa dikembalikan penuh, jadi tepi tetap berisi warna gambar. */}
          <feComponentTransfer>
            <feFuncA type="linear" slope={40} />
          </feComponentTransfer>
        </filter>
      </svg>
      <AbsoluteFill style={{filter: 'url(#whip-arah)'}}>{children}</AbsoluteFill>
    </>
  );
};

const whipDi = (frame: number) => {
  const w = frame - F.whip;
  if (w < 0 || w >= LAMA_WHIP) return {blur: 0, geser: 0};
  return {blur: WHIP_BLUR[w], geser: WHIP_GESER[w]};
};

// Pop objek: 8 frame dari tangan, lalu 1,00. Rotasi -10 ke -4 derajat.
const POP_SKALA = [0, 0.22, 0.41, 0.52, 0.78, 0.89, 1.04, 1.07];
const POP_MIRING_AWAL = -10;
const POP_MIRING_AKHIR = -4;
const UKURAN_OBJEK = 300;
// Ikon punya ruang kosong di bawah gambarnya. Nilai ini menurunkan alas objek sampai menyentuh tangan.
const ALAS_OBJEK = 30;

const ObjekPop = ({asalX, asalY}: {asalX: number; asalY: number}) => {
  const frame = useCurrentFrame();
  const t = frame - F.pop;
  if (t < 0) return null;
  const skala = t < POP_SKALA.length ? POP_SKALA[t] : 1;
  const miring = interpolate(t, [0, POP_SKALA.length - 1], [POP_MIRING_AWAL, POP_MIRING_AKHIR], {extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        left: asalX - UKURAN_OBJEK / 2,
        top: asalY - UKURAN_OBJEK,
        transformOrigin: '50% 100%',
        transform: `scale(${skala}) rotate(${miring}deg)`,
      }}
    >
      <Ikon nama="bohlam" size={UKURAN_OBJEK} />
    </div>
  );
};

const POSISI_DEKAT = {x: 380, y: 660, s: 2.4};
// Saat kaget kamera menyusul tokoh. Awalnya lambat, karena tangan yang menunjuk harus mundur dulu dari tepi kanan.
const IKUT_KAGET = [0, 8, 24, 48, 105, 142, 158, 160];
const POSISI_SEDANG = {x: 390, y: 760, s: 2};

const batasIkut = (t: number) => Math.min(IKUT_KAGET.length - 1, Math.max(0, t));

const AdeganKota = ({geser}: {geser: number}) => {
  const frame = useCurrentFrame();
  const dekat = frame < F.potongSedang;
  const posisi = dekat ? POSISI_DEKAT : POSISI_SEDANG;
  const tangan = posisiTangan(hitungRig(NASKAH, F.pop));
  const ikut = dekat ? IKUT_KAGET[batasIkut(frame - F.kaget)] : 0;
  return (
    <AbsoluteFill>
      <Dunia nama="kota" geser={300 - geser - ikut * 0.6} zoom={dekat ? 1.3 : 1.12} />
      <Raka x={posisi.x + geser + ikut} y={posisi.y} s={posisi.s} closeup={dekat} />
      {!dekat && (
        <div style={{position: 'absolute', inset: 0, transform: `translateX(${geser}px)`}}>
          <ObjekPop asalX={posisi.x + tangan.x * posisi.s} asalY={posisi.y + (tangan.y + 190) * posisi.s + ALAS_OBJEK} />
        </div>
      )}
      <Depan nama="kota" geser={300 - geser - ikut} turun={dekat ? -240 : -100} />
    </AbsoluteFill>
  );
};

// Dorong kamera: cepat di awal, ekor panjang.
const LAMA_DORONG = 56;
const DORONG = (t: number) => 1 - Math.pow(1 - t, 4);
const LAMA_FOKUS = 24;
const BLUR_LATAR = 16;

const AdeganSenja = ({geser}: {geser: number}) => {
  const frame = useCurrentFrame();
  const dorong = DORONG(interpolate(frame, [F.dorong, F.dorong + LAMA_DORONG], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const fokus = interpolate(frame, [F.fokus, F.fokus + LAMA_FOKUS], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
  const s = interpolate(dorong, [0, 1], [1.55, 2.25]);
  const y = interpolate(dorong, [0, 1], [869, 760]);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: fokus > 0 ? `blur(${fokus * BLUR_LATAR}px)` : undefined}}>
        <Dunia nama="senja" geser={900 - geser} zoom={1 + dorong * 0.32} />
      </AbsoluteFill>
      <Raka x={540 + geser} y={y} s={s} closeup={dorong > 0.5} />
      <Depan nama="senja" geser={900 - geser} turun={interpolate(dorong, [0, 1], [150, 0])} />
    </AbsoluteFill>
  );
};

// Angka: hanya digit yang berbeda dari tahap sebelumnya yang berputar.
const TAHAP_ANGKA = [
  {mulai: 0, nilai: '2847'},
  {mulai: F.angka, nilai: '2853'},
  {mulai: F.angka + 20, nilai: '2861'},
  {mulai: F.angka + 40, nilai: '2906'},
];
const LAMA_PUTAR = 14;
const TINGGI_DIGIT = 250;
const LEBAR_DIGIT = 150;

const Digit = ({kolom}: {kolom: number}) => {
  const frame = useCurrentFrame();
  // Posisi strip naik terus, jadi digit berputar ke depan saat nilainya berubah.
  const posisi = TAHAP_ANGKA.reduce((jumlah, tahap, i) => {
    if (i === 0) return Number(tahap.nilai[kolom]);
    const langkah = (Number(tahap.nilai[kolom]) - Number(TAHAP_ANGKA[i - 1].nilai[kolom]) + 10) % 10;
    const p = interpolate(frame, [tahap.mulai, tahap.mulai + LAMA_PUTAR], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.2, 0.7, 0.2, 1),
    });
    return jumlah + langkah * p;
  }, 0);
  const dasar = Math.floor(posisi);
  const sisa = posisi - dasar;
  return (
    <div style={{position: 'relative', width: LEBAR_DIGIT, height: TINGGI_DIGIT, overflow: 'hidden'}}>
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{position: 'absolute', left: 0, width: LEBAR_DIGIT, height: TINGGI_DIGIT, lineHeight: `${TINGGI_DIGIT}px`, textAlign: 'center', top: (i - sisa) * TINGGI_DIGIT}}
        >
          {(dasar + i) % 10}
        </div>
      ))}
    </div>
  );
};

const AdeganMalam = () => (
  <AbsoluteFill>
    <Dunia nama="malam" geser={1500} />
    <div
      style={{
        position: 'absolute',
        top: 360,
        left: 0,
        width: 1080,
        display: 'flex',
        justifyContent: 'center',
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 230,
        color: WHITE,
        textShadow: `0 6px 0 ${ANGKA_BAYANG}`,
      }}
    >
      <Digit kolom={0} />
      <div style={{lineHeight: `${TINGGI_DIGIT}px`, width: 64, textAlign: 'center'}}>.</div>
      <Digit kolom={1} />
      <Digit kolom={2} />
      <Digit kolom={3} />
    </div>
    <Raka x={540} y={960} s={1.35} naskah={NASKAH_PENUTUP} />
    <Depan nama="malam" geser={1500} turun={150} />
  </AbsoluteFill>
);

// Panel lembut: dunia berikutnya masuk dari kiri dengan tepi lunak.
const TEPI_PANEL = 160;
const Panel = ({children}: {children: ReactNode}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [F.panel, SELESAI_PANEL], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  if (p >= 1) return <>{children}</>;
  const tepi = -TEPI_PANEL + p * (1080 + TEPI_PANEL * 2);
  const masker = `linear-gradient(90deg, #000 ${tepi - TEPI_PANEL}px, transparent ${tepi}px)`;
  return <AbsoluteFill style={{maskImage: masker, WebkitMaskImage: masker}}>{children}</AbsoluteFill>;
};

export const UjiGerak = () => {
  const frame = useCurrentFrame();
  const {blur, geser} = whipDi(frame);
  return (
    <AbsoluteFill style={{backgroundColor: WHITE}}>
      <Whip blur={blur}>
        {frame < POTONG_WHIP && <AdeganKota geser={geser} />}
        {frame >= POTONG_WHIP && frame < SELESAI_PANEL && <AdeganSenja geser={geser} />}
      </Whip>
      {frame >= F.panel && (
        <Panel>
          <AdeganMalam />
        </Panel>
      )}
    </AbsoluteFill>
  );
};
