import {useMemo} from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {FONT} from '../DataShort';
import {NARASI_LATAR, WHITE} from '../tema';
import {AliranTuang, GelasUkur, Properti, titikPegang} from './properti';
import {LenganLepas, naskahRig} from './tokoh-rig';
import {campur, campurTitik, lesat, mulus, pergi, popSkala} from './set/gerak';
import {kameraDi} from './set/kamera';
import {setInterior} from './set/interior';
import {setMejaAtas} from './set/meja';
import {AdeganSet, Panggung, TokohDiDunia, bawaanProperti} from './set/panggung';
import type {Shot} from './set/tipe';

// Klip uji tahap 1 set dan properti: tiga shot dari episode kafein, tanpa audio.
// Shot A memakai set meja tampak atas lalu interior kerja, B interior dapur, C ruang gelap.

const SHOT = {
  a1: {mulai: 0, lama: 56},
  a2: {mulai: 56, lama: 66},
  b: {mulai: 122, lama: 138},
  c: {mulai: 260, lama: 100},
};
export const UJI_SET_FRAMES = SHOT.c.mulai + SHOT.c.lama;

// Teks narasi gaya episode: putih di atas kotak gelap, di bawah area konten.
const Narasi = ({teks}: {teks: string}) => {
  const frame = useCurrentFrame();
  const muncul = interpolate(frame, [0, 5], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 1390, left: 80, width: 860, textAlign: 'center', opacity: muncul, fontFamily: FONT}}>
      <span style={{fontSize: 40, fontWeight: 500, lineHeight: 1.5, color: WHITE, backgroundColor: NARASI_LATAR, padding: '5px 14px', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>
        {teks}
      </span>
    </div>
  );
};

// ---------------- Shot A1: meja tampak atas, tangan menaruh cangkir ketiga ----------------
const A1 = {
  masuk: 4,
  taruh: 4 + 16,
  lepas: 26,
  pergi: 12,
  cincin: 29,
};
const CANGKIR_ATAS = {x: 585, y: 1015, skala: 1.2};
const NODA_LAMA = [
  {x: 330, y: 1120, varian: 'noda-1', skala: 1.35},
  {x: 800, y: 820, varian: 'noda-2', skala: 1.35},
];
// Cincin ketiga sedikit lebih besar dan bergeser, jadi terlihat sebagai bulan sabit di samping cangkir.
const NODA_BARU = {x: CANGKIR_ATAS.x + 16, y: CANGKIR_ATAS.y + 20, varian: 'noda-3', skala: 1.55};
const BAHU_A1 = {x: 1320, y: 1900};
const TEBAL_A1 = 96;

const ShotA1 = () => {
  const frame = useCurrentFrame();
  const set = useMemo(() => setMejaAtas(), []);
  const kamera = kameraDi({dari: {x: 560, y: 1010, zoom: 1.06}, ke: {x: 585, y: 1020, zoom: 1.16}, lama: SHOT.a1.lama, kurva: 'dorong'}, frame);

  // Gagang menghadap ke lengan, jadi cangkir diputar searah garis bahu ke cangkir.
  const arah = Math.atan2(BAHU_A1.y - CANGKIR_ATAS.y, BAHU_A1.x - CANGKIR_ATAS.x);
  const putar = (arah * 180) / Math.PI;
  const pegang = titikPegang('cangkir', 'atas');
  const genggamTaruh = {
    x: CANGKIR_ATAS.x + Math.cos(arah) * pegang.x * CANGKIR_ATAS.skala,
    y: CANGKIR_ATAS.y + Math.sin(arah) * pegang.x * CANGKIR_ATAS.skala,
  };
  // Titik genggam berada 18 satuan rig di depan pergelangan, searah lengan.
  const s = TEBAL_A1 / 26;
  const jarak = Math.hypot(genggamTaruh.x - BAHU_A1.x, genggamTaruh.y - BAHU_A1.y);
  const satuan = {x: (genggamTaruh.x - BAHU_A1.x) / jarak, y: (genggamTaruh.y - BAHU_A1.y) / jarak};
  const pergelanganTaruh = {x: genggamTaruh.x - satuan.x * 18 * s, y: genggamTaruh.y - satuan.y * 18 * s};
  const luar = {x: 1250, y: 1780};

  const tMasuk = lesat(frame - A1.masuk);
  const tPergi = pergi(frame - A1.lepas, A1.pergi);
  const pergelangan = frame < A1.lepas ? campurTitik(luar, pergelanganTaruh, tMasuk) : campurTitik(pergelanganTaruh, {x: 1300, y: 1900}, tPergi);
  const dipegang = frame < A1.lepas;
  // Cangkir sedikit terangkat saat dibawa: bayangan bergeser dan ukuran sedikit lebih besar, lalu turun di meja.
  const angkat = dipegang ? 1 - lesat(frame - A1.masuk - 6) : 0;
  const skalaBawa = CANGKIR_ATAS.skala * (1 + angkat * 0.06);
  const cangkir = <Properti nama="cangkir" tampak="atas" keadaan={{uap: 0.7}} skala={skalaBawa} putar={putar} digenggam />;
  const cincin = popSkala(frame - A1.cincin);

  return (
    <AbsoluteFill>
      <Panggung
        set={set}
        kamera={kamera}
        suasana="hangat"
        id="a1"
        isi={{
          belakangTokoh: (
            <g>
              {NODA_LAMA.map((n) => (
                <Properti key={n.varian} nama="noda" tampak="atas" x={n.x} y={n.y} skala={n.skala} varian={n.varian} />
              ))}
              {cincin > 0 && <Properti nama="noda" tampak="atas" x={NODA_BARU.x} y={NODA_BARU.y} skala={NODA_BARU.skala * cincin} varian={NODA_BARU.varian} />}
            </g>
          ),
          tengah: (
            <g>
              {!dipegang && <Properti nama="cangkir" tampak="atas" keadaan={{uap: 0.7}} x={CANGKIR_ATAS.x} y={CANGKIR_ATAS.y} skala={CANGKIR_ATAS.skala} putar={putar} />}
              {frame >= A1.masuk && tPergi < 1 && <LenganLepas dari={BAHU_A1} ke={pergelangan} tebal={TEBAL_A1} tekuk={-0.06} bawaan={dipegang ? cangkir : undefined} />}
            </g>
          ),
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------- Shot A2: Raka di meja kerja memegang cangkir ----------------
const SKALA_RAKA_A2 = 2.1;
// Bibir meja kerja di 1150. Pinggang rig 30 satuan di bawah bibir, jadi meja menutupi perut ke bawah.
const PINGGANG_A2 = {x: 520, y: 1150 + 30 * SKALA_RAKA_A2};
const MINUM_A2 = 30;

const SHOT_A2: Shot = {
  set: 'interior',
  varian: 'kerja',
  suasana: 'hangat',
  kamera: {dari: {x: 540, y: 980, zoom: 1.02}, ke: {x: 545, y: 930, zoom: 1.09}, lama: SHOT.a2.lama, kurva: 'dorong'},
  properti: [
    {nama: 'laptop', slot: {x: 880, y: 1172}, tampak: 'belakang', skala: 0.95},
    {nama: 'cangkir', slot: {x: 600, y: 1186}, keadaan: {isi: 0}, skala: 1.05},
    {nama: 'cangkir', slot: {x: 684, y: 1172}, keadaan: {isi: 0}, skala: 1.05},
  ],
};

const ShotA2 = () => {
  const naskah = useMemo(
    () =>
      naskahRig({
        seed: 'uji-set-a2',
        // Tangan utama di kiri layar, di sisi meja yang kosong, supaya cangkir tidak tertutup laptop.
        arah: -1,
        gestur: [
          {mulai: 0, pose: 'pegang', potong: true},
          {mulai: MINUM_A2, pose: 'minum'},
        ],
        toleh: [{mulai: 0, ke: -0.15, potong: true}],
        mata: [
          {mulai: 0, bentuk: 'datar'},
          {mulai: MINUM_A2 + 6, bentuk: 'titik'},
        ],
      }),
    [],
  );
  return (
    <AdeganSet
      shot={SHOT_A2}
      id="a2"
      tambahan={{
        tokoh: <TokohDiDunia x={PINGGANG_A2.x} y={PINGGANG_A2.y} skala={SKALA_RAKA_A2} naskah={naskah} id="a2-raka" potong={1196} bawaan={bawaanProperti({nama: 'cangkir', keadaan: {uap: 0.35}, skala: 0.62})} />,
      }}
    />
  );
};

// ---------------- Shot B: empat cangkir dituang ke gelas ukur ----------------
// Garis dihitung dari nilai dengan dasar gelas sebagai nol.
const BATAS_AMAN = 400;
const EFEK_TOKSIK = 1200;
const JUMLAH_CANGKIR = 4;
const PER_CANGKIR = BATAS_AMAN / JUMLAH_CANGKIR;
const PX_PER_MG = 0.7;
const RUANG_ATAS = 120;
const TINGGI_AWAL = (BATAS_AMAN + RUANG_ATAS) * PX_PER_MG;
const TINGGI_AKHIR = (EFEK_TOKSIK + RUANG_ATAS - 20) * PX_PER_MG;

// Pemisah ribuan titik, seperti penulisan angka di episode.
const formatMg = (nilai: number) => `${String(nilai).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} mg`;

// Meja dapur: bibir 1250, kedalaman 60. Benda berdiri di tengah permukaan atas.
const ALAS_B = 1250 + 60 * 0.55;
const GELAS_B = {x: 650, y: ALAS_B};
const CANGKIR_B = {skala: 0.8, jarak: 76, kiri: 215};
const TUANG = {mulai: 8, jeda: 17, angkat: 8, miring: 7, alir: 8, kembali: 8};
const SOROT_B = {mulai: 96, lama: 30};

// Posisi tuang: di atas sisi kiri gelas, cukup tinggi supaya bibir cangkir di atas bibir gelas.
const POSISI_TUANG = {x: GELAS_B.x - 120, y: GELAS_B.y - TINGGI_AWAL - 90};
const MIRING_TUANG = 112;

const putarTitik = (p: {x: number; y: number}, derajat: number) => {
  const r = (derajat * Math.PI) / 180;
  return {x: p.x * Math.cos(r) - p.y * Math.sin(r), y: p.x * Math.sin(r) + p.y * Math.cos(r)};
};

const keadaanCangkir = (i: number, frame: number) => {
  const mulai = TUANG.mulai + i * TUANG.jeda;
  const t = frame - mulai;
  const diam = {x: CANGKIR_B.kiri + i * CANGKIR_B.jarak, y: ALAS_B};
  const selesaiAlir = TUANG.angkat + TUANG.alir;
  const p = t < selesaiAlir ? lesat(t * 2) : 1 - lesat((t - selesaiAlir) * 2);
  const lengkung = Math.sin(Math.PI * p) * -70;
  const pos = {x: campur(diam.x, POSISI_TUANG.x, p), y: campur(diam.y, POSISI_TUANG.y, p) + lengkung};
  const miring = t < selesaiAlir ? lesat((t - TUANG.angkat + TUANG.miring) * 2) * MIRING_TUANG : (1 - lesat((t - selesaiAlir) * 2)) * MIRING_TUANG;
  const isi = interpolate(t, [TUANG.angkat, selesaiAlir], [0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const mengalir = t >= TUANG.angkat && t < selesaiAlir;
  return {pos, miring, isi, mengalir, mulai};
};

// Isi gelas naik 100 mg tiap cangkir, mengikuti aliran.
const isiGelas = (frame: number) =>
  Array.from({length: JUMLAH_CANGKIR}, (_, i) => {
    const mulai = TUANG.mulai + i * TUANG.jeda + TUANG.angkat;
    return PER_CANGKIR * mulus(frame, mulai, TUANG.alir);
  }).reduce((a, b) => a + b, 0);

const ShotB = () => {
  const frame = useCurrentFrame();
  const set = useMemo(() => setInterior('dapur'), []);
  const kamera = kameraDi({dari: {x: 560, y: 1060, zoom: 1.05}, ke: {x: 590, y: 860, zoom: 0.97}, mulai: SOROT_B.mulai, lama: SOROT_B.lama, kurva: 'sorot'}, frame);
  const naik = mulus(frame, SOROT_B.mulai, SOROT_B.lama);
  const tinggi = campur(TINGGI_AWAL, TINGGI_AKHIR, naik);
  const isi = isiGelas(frame);
  const selesaiTuang = TUANG.mulai + (JUMLAH_CANGKIR - 1) * TUANG.jeda + TUANG.angkat + TUANG.alir;
  // Label 1.200 mg muncul tepat saat bibir gelas sudah melewati garisnya.
  const munculToksik = Array.from({length: SHOT.b.lama}, (_, f) => f).find((f) => campur(TINGGI_AWAL, TINGGI_AKHIR, mulus(f, SOROT_B.mulai, SOROT_B.lama)) >= EFEK_TOKSIK * PX_PER_MG + 30) ?? SHOT.b.lama;
  // Saat isi mencapai 400 mg, labelnya berdenyut sekali dengan kurva pop.
  const tPenuh = frame - selesaiTuang;
  const denyut400 = tPenuh >= 0 && tPenuh < 10 ? 1 + 0.22 * Math.sin((Math.PI * tPenuh) / 10) : 1;
  const suasana = {dari: 'hangat' as const, ke: 'bahaya' as const, t: naik};

  const cangkir = Array.from({length: JUMLAH_CANGKIR}, (_, i) => keadaanCangkir(i, frame));
  // Cangkir yang sedang bergerak digambar terakhir, supaya lewat di depan cangkir lain.
  const urutan = cangkir.map((c, i) => ({...c, i})).sort((a, b) => Number(a.pos.y !== ALAS_B) - Number(b.pos.y !== ALAS_B));
  const tinggiCangkir = 76 * CANGKIR_B.skala;
  const garis = [
    {nilai: BATAS_AMAN, label: formatMg(BATAS_AMAN), skala: denyut400},
    {nilai: EFEK_TOKSIK, label: formatMg(EFEK_TOKSIK), skala: popSkala(frame - munculToksik)},
  ];
  const gelas = (
    <g transform={`translate(${GELAS_B.x} ${GELAS_B.y})`}>
      <GelasUkur tinggi={tinggi} perSatuan={PX_PER_MG} isi={isi} langkah={PER_CANGKIR} garis={garis} bagian="gelas" />
    </g>
  );

  return (
    <AbsoluteFill>
      <Panggung
        set={set}
        kamera={kamera}
        suasana={suasana}
        id="b"
        isi={{
          tengah: (
            <g>
              {/* Aliran digambar sebelum gelas, jadi masuk ke balik dinding depan gelas. */}
              {urutan.map(({pos, miring, mengalir, i}) => {
                if (!mengalir) return null;
                // Cangkir berputar di sekitar pusat badannya. Bibir kanan atas menjadi mulut tuang.
                const pusat = {x: pos.x, y: pos.y - tinggiCangkir / 2};
                const bibir = putarTitik({x: 42 * CANGKIR_B.skala, y: -tinggiCangkir / 2}, miring);
                const mulut = {x: pusat.x + bibir.x, y: pusat.y + bibir.y};
                const permukaan = GELAS_B.y - 16 - isi * PX_PER_MG;
                return <AliranTuang key={i} dari={mulut} ke={{x: mulut.x + 26, y: permukaan}} frame={frame} lebar={13} />;
              })}
              {gelas}
              {urutan.map(({pos, miring, isi: isiCangkir, i}) => (
                <g key={i} transform={`translate(${pos.x} ${pos.y - tinggiCangkir / 2}) rotate(${miring}) translate(0 ${tinggiCangkir / 2})`}>
                  <Properti nama="cangkir" skala={CANGKIR_B.skala} cermin keadaan={{isi: isiCangkir}} bayang={pos.y >= ALAS_B - 1} />
                </g>
              ))}
            </g>
          ),
          label: (
            <g transform={`translate(${GELAS_B.x} ${GELAS_B.y})`}>
              <GelasUkur tinggi={tinggi} perSatuan={PX_PER_MG} garis={garis} bagian="label" />
            </g>
          ),
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------- Shot C: kafein pekat dan pil di ruang gelap ----------------
const SHOT_C: Shot = {
  set: 'ruang',
  suasana: 'gelap',
  opsi: {meja: true, bahan: 'batu'},
  kamera: {dari: {x: 540, y: 1080, zoom: 1.22}, kurva: 'diam'},
  sorot: {x: 540, y: 1180, lebar: 380, jenis: 'atas'},
  properti: [
    {nama: 'sendok', slot: {x: 470, y: 1200}, skala: 1.45, muncul: 6},
    {nama: 'pil', slot: {x: 640, y: 1193}, skala: 1.2, muncul: 16},
    {nama: 'pil', slot: {x: 705, y: 1214}, skala: 1.2, muncul: 20},
    {nama: 'pil', slot: {x: 600, y: 1218}, varian: 'kapsul', skala: 1.2, putar: -14, muncul: 24},
    {nama: 'pil', slot: {x: 760, y: 1198}, varian: 'kapsul', skala: 1.2, putar: 10, muncul: 28},
  ],
};

// Debu halus yang melayang di berkas cahaya. Posisi dari indeks, gerak dari frame.
const Debu = () => {
  const frame = useCurrentFrame();
  return (
    <g fill={WHITE}>
      {Array.from({length: 16}, (_, i) => {
        const x = 400 + ((i * 97) % 290) + Math.sin(frame / 40 + i) * 12;
        const y = 760 + ((i * 151) % 380) - ((frame * (0.3 + (i % 4) * 0.1)) % 60);
        return <circle key={i} cx={x} cy={y} r={2 + (i % 3)} opacity={0.18 + (i % 4) * 0.06} />;
      })}
    </g>
  );
};

const ShotC = () => (
  <AdeganSet
    shot={SHOT_C}
    id="c"
    tambahan={{belakangTokoh: <Debu />}}
  />
);

// Penanda supaya penyaji data shot juga diuji di shot C dan A2.
export const SHOT_UJI: Shot[] = [SHOT_A2, SHOT_C];

export const UjiSet = () => (
  <AbsoluteFill>
    <Sequence from={SHOT.a1.mulai} durationInFrames={SHOT.a1.lama}>
      <ShotA1 />
    </Sequence>
    <Sequence from={SHOT.a2.mulai} durationInFrames={SHOT.a2.lama}>
      <ShotA2 />
    </Sequence>
    <Sequence from={SHOT.a1.mulai} durationInFrames={SHOT.a1.lama + SHOT.a2.lama}>
      <Narasi teks="Ini kopi ketiga hari ini." />
    </Sequence>
    <Sequence from={SHOT.b.mulai} durationInFrames={SHOT.b.lama}>
      <ShotB />
    </Sequence>
    <Sequence from={SHOT.b.mulai} durationInFrames={SOROT_B.mulai}>
      <Narasi teks="Dewasa sehat umumnya aman 400 mg sehari, sekitar 4 cangkir kopi seduh 200–240 ml." />
    </Sequence>
    <Sequence from={SHOT.b.mulai + SOROT_B.mulai} durationInFrames={SHOT.b.lama - SOROT_B.mulai}>
      <Narasi teks="Sekitar 1.200 mg yang masuk cepat bisa memicu efek toksik seperti kejang." />
    </Sequence>
    <Sequence from={SHOT.c.mulai} durationInFrames={SHOT.c.lama}>
      <ShotC />
      <Narasi teks="Bahaya lebih sering datang dari kafein murni atau pekat dan pil kafein." />
    </Sequence>
  </AbsoluteFill>
);

// Katalog sementara: satu frame per set yang tidak dipakai klip, untuk memeriksa gambar dan slot.
const KATALOG: Shot[] = [
  {set: 'interior', varian: 'kamar', suasana: 'hangat', kamera: {dari: {x: 540, y: 1000, zoom: 1}}, properti: [{nama: 'jam', slot: 'meja.atas', keadaan: {getar: 1}}]},
  {set: 'interior', varian: 'dapur', suasana: 'hangat', kamera: {dari: {x: 540, y: 960, zoom: 1}}, properti: [{nama: 'piring', slot: 'meja.kiri'}, {nama: 'botol', slot: 'meja.kanan'}]},
  {set: 'interior', varian: 'kafe', suasana: 'hangat', kamera: {dari: {x: 540, y: 1000, zoom: 1}}, properti: [{nama: 'cangkir', slot: 'meja.atas', keadaan: {uap: 1}}]},
  {set: 'interior', varian: 'klinik', suasana: 'klinik', kamera: {dari: {x: 540, y: 960, zoom: 1}}},
  {set: 'organ', varian: 'jantung', suasana: 'tubuh', kamera: {dari: {x: 540, y: 960, zoom: 1}}, opsi: {denyut: 120}},
  {set: 'organ', varian: 'hati', suasana: 'tubuh', kamera: {dari: {x: 540, y: 960, zoom: 1}}},
  {set: 'ruang', suasana: 'klinik', opsi: {meja: true, bahan: 'putih'}, kamera: {dari: {x: 540, y: 1000, zoom: 1}}, properti: [{nama: 'laptop', slot: 'meja.atas', tampak: 'depan'}]},
  {set: 'ruang', suasana: 'bahaya', kamera: {dari: {x: 540, y: 960, zoom: 1}}, properti: [{nama: 'cangkir', slot: 'tengah', skala: 2.4, keadaan: {tumpah: 0.6}}]},
];
export const KATALOG_FRAMES = KATALOG.length;

export const KatalogSet = () => {
  const frame = useCurrentFrame();
  return <AdeganSet shot={KATALOG[Math.min(frame, KATALOG.length - 1)]} id={`katalog-${frame}`} />;
};
