import {random, useCurrentFrame} from 'remotion';
import {LIDAH, MIKRO, OTAK} from '../../tema';
import type {HasilSet, Slot} from './tipe';

// Celah saraf skala mikro: membran sel di bawah dengan soket reseptor berbentuk colokan,
// membran pengirim di atas, dan cairan celah berbokeh di antaranya (latar dari suasana `saraf`).
// Ligan (adenosin, kafein) digambar oleh aksi `tancap` dan `serobot` di belakang badan soket,
// jadi kaki colokannya tertutup soket saat menancap.

export const SOKET_X = [270, 540, 810];
const PERMUKAAN = 1180;
export const permukaanMembran = (x: number) => PERMUKAAN + Math.sin(x / 150) * 16;

// Ukuran soket. Puncak soket menonjol dari membran, dua lubang colokan di wajahnya.
export const SOKET = {lebar: 150, tinggi: 112, tonjol: 46, lubang: 40};
export const puncakSoket = (i: number) => permukaanMembran(SOKET_X[i]) - SOKET.tonjol;

const Membran = () => {
  const frame = useCurrentFrame();
  const titik = Array.from({length: 40}, (_, i) => {
    const x = -700 + i * 65;
    return `${i === 0 ? 'M' : 'L'}${x} ${(permukaanMembran(x) + Math.sin(frame / 30 + i * 0.7) * 3).toFixed(1)}`;
  }).join(' ');
  return (
    <g>
      <path d={`${titik} L1900 3200 L-700 3200 Z`} fill={MIKRO.membran} />
      {/* Lapisan ganda membran: pita terang tipis di bawah permukaan. */}
      <path d={titik} transform="translate(0 26)" fill="none" stroke={MIKRO.membranTerang} strokeWidth={14} opacity={0.55} />
      <path d={titik} transform="translate(0 62)" fill="none" stroke={MIKRO.membranGelap} strokeWidth={22} opacity={0.6} />
      {/* Isi sel di bawah membran: gelembung buram. */}
      {Array.from({length: 9}, (_, i) => (
        <circle key={i} cx={-200 + random(`mikro-sel-x-${i}`) * 1500} cy={PERMUKAAN + 180 + random(`mikro-sel-y-${i}`) * 700} r={50 + random(`mikro-sel-r-${i}`) * 90} fill={MIKRO.membranGelap} opacity={0.45} />
      ))}
    </g>
  );
};

// Membran pengirim di atas celah, dengan kantung kecil yang menempel.
const MembranAtas = () => {
  const frame = useCurrentFrame();
  const titik = Array.from({length: 40}, (_, i) => {
    const x = -700 + i * 65;
    return `${i === 0 ? 'M' : 'L'}${x} ${(330 + Math.cos(x / 170) * 40 + Math.sin(frame / 34 + i) * 3).toFixed(1)}`;
  }).join(' ');
  return (
    <g>
      <path d={`${titik} L1900 -1400 L-700 -1400 Z`} fill={MIKRO.membranAtas} />
      <path d={titik} transform="translate(0 -22)" fill="none" stroke={MIKRO.membranTerang} strokeWidth={12} opacity={0.35} />
      {[120, 420, 700, 960].map((x, i) => (
        <circle key={x} cx={x} cy={250 + Math.cos(x / 170) * 40 - 30} r={46 + (i % 2) * 14} fill={MIKRO.vesikel} opacity={0.7} />
      ))}
    </g>
  );
};

// Soket reseptor: badan membulat yang tertanam di membran, dengan dua lubang colokan.
export const Soket = ({x}: {x: number}) => {
  const atas = permukaanMembran(x) - SOKET.tonjol;
  const {lebar, tinggi, lubang} = SOKET;
  return (
    <g>
      <rect x={x - lebar / 2} y={atas} width={lebar} height={tinggi} rx={34} fill={MIKRO.soket} />
      <rect x={x - lebar / 2} y={atas} width={lebar} height={18} rx={9} fill={MIKRO.soketTerang} opacity={0.8} />
      {[-1, 1].map((s) => (
        <rect key={s} x={x + s * (lubang / 2) - 9} y={atas + 4} width={18} height={40} rx={9} fill={MIKRO.soketLubang} />
      ))}
    </g>
  );
};

// Permukaan lidah: daging merah muda dengan papila bulat di antara soket, tanpa membran pengirim di atas.
const PermukaanLidah = () => {
  const frame = useCurrentFrame();
  const titik = Array.from({length: 40}, (_, i) => {
    const x = -700 + i * 65;
    return `${i === 0 ? 'M' : 'L'}${x} ${(permukaanMembran(x) + Math.sin(frame / 30 + i * 0.7) * 3).toFixed(1)}`;
  }).join(' ');
  // Papila di antara soket, tidak menutupi soket.
  const papila = Array.from({length: 22}, (_, i) => -560 + i * 100).filter((x) => SOKET_X.every((sx) => Math.abs(sx - x) > 110));
  return (
    <g>
      {papila.map((x, i) => (
        <ellipse key={x} cx={x} cy={permukaanMembran(x) + 6} rx={40 + (i % 3) * 6} ry={52 + (i % 2) * 14} fill={LIDAH.papila} />
      ))}
      <path d={`${titik} L1900 3200 L-700 3200 Z`} fill={LIDAH.permukaan} />
      <path d={titik} transform="translate(0 22)" fill="none" stroke={LIDAH.terang} strokeWidth={12} opacity={0.5} />
      {Array.from({length: 9}, (_, i) => (
        <circle key={i} cx={-200 + random(`lidah-x-${i}`) * 1500} cy={PERMUKAAN + 180 + random(`lidah-y-${i}`) * 700} r={50 + random(`lidah-r-${i}`) * 90} fill={LIDAH.gelap} opacity={0.35} />
      ))}
    </g>
  );
};

// Partikel kecil yang melayang di depan, buram oleh lapisan depan.
const Serpih = () => {
  const frame = useCurrentFrame();
  return (
    <g fill={MIKRO.serpih}>
      {Array.from({length: 10}, (_, i) => (
        <circle key={i} cx={-100 + random(`mikro-d-x-${i}`) * 1300 + Math.sin(frame / 40 + i) * 20} cy={200 + random(`mikro-d-y-${i}`) * 1500 - frame * 0.4} r={14 + random(`mikro-d-r-${i}`) * 26} opacity={0.35} />
      ))}
    </g>
  );
};

// Jaringan otak di kejauhan: gumpalan sel besar yang samar di sekeliling petak sel utama (properti `selOtak` di slot `sel`).
const JaringanOtak = () => {
  const frame = useCurrentFrame();
  return (
    <g>
      {Array.from({length: 16}, (_, i) => {
        const x = -300 + random(`otak-j-x-${i}`) * 1700;
        const y = 80 + random(`otak-j-y-${i}`) * 1600;
        const r = 90 + random(`otak-j-r-${i}`) * 120;
        return <ellipse key={i} cx={x + Math.sin(frame / 50 + i) * 8} cy={y} rx={r * 1.3} ry={r} fill={i % 3 ? OTAK.jaringan : OTAK.selGelap} opacity={0.35} />;
      })}
    </g>
  );
};

const SLOT_MIKRO: Record<string, Slot> = {
  ...Object.fromEntries(SOKET_X.map((x, i) => [`soket.${i}`, {x, y: permukaanMembran(x) - SOKET.tonjol}])),
  celah: {x: 540, y: 760},
  // Pusat petak sel otak pada varian `otak`.
  sel: {x: 540, y: 800},
};

// `otak` mengganti celah saraf dengan jaringan otak samar tanpa soket. Petak sel digambar oleh properti `selOtak` di slot `sel`,
// supaya celahnya bisa diubah lewat aksi `ubah` dan disapu aksi `alir`.
const setMikroOtak = (): HasilSet => ({
  belakang: <JaringanOtak />,
  depan: <Serpih />,
  slot: SLOT_MIKRO,
  sorot: {x: 540, y: 800, lebar: 600, jenis: 'titik'},
  pakaiLatar: true,
});

// `lidah` mengganti celah saraf dengan permukaan lidah: soket yang sama menjadi reseptor di lidah.
export const setMikro = ({lidah = false, otak = false}: {lidah?: boolean; otak?: boolean} = {}): HasilSet => (otak ? setMikroOtak() : {
  tengahBelakang: lidah ? (
    <PermukaanLidah />
  ) : (
    <g>
      <MembranAtas />
      <Membran />
    </g>
  ),
  tengah: (
    <g>
      {SOKET_X.map((x) => (
        <Soket key={x} x={x} />
      ))}
    </g>
  ),
  depan: <Serpih />,
  slot: SLOT_MIKRO,
  sorot: {x: 540, y: 820, lebar: 560, jenis: 'titik'},
  pakaiLatar: true,
});
