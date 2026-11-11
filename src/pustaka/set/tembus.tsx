import {useCurrentFrame} from 'remotion';
import {TEMBUS} from '../../tema';
import {SILUET_RIG} from '../tokoh-rig';
import {OrganTengah, detak, ketukanDi} from './organ';
import type {HasilSet, Slot} from './tipe';

// Siluet dada tokoh yang tembus pandang: badan bercahaya samar, organ di dalamnya, dan jantung yang berdenyut.
// Siluet memakai bentuk rig yang sama dengan tokoh, jadi tetap terbaca sebagai tokoh utama.

// Titik asal rig di dunia dan skalanya. Dada berada di tengah layar.
const ASAL = {x: 540, y: 1250};
const SKALA = 4.2;
const dunia = (x: number, y: number) => ({x: ASAL.x + x * SKALA, y: ASAL.y + y * SKALA});

// Jantung sedikit di kiri tubuh tokoh, yaitu kanan layar.
export const TITIK_JANTUNG = dunia(16, -40);

const Paru = () => (
  <g fill={TEMBUS.paru} opacity={0.5}>
    <path d="M-10 -86 C-40 -88 -48 -50 -46 -10 C-44 18 -22 22 -12 6 C-6 -20 -6 -60 -10 -86 Z" />
    <path d="M10 -86 C40 -88 48 -50 46 -10 C44 18 22 22 12 6 C6 -20 6 -60 10 -86 Z" />
  </g>
);

const Rusuk = () => (
  <g fill="none" stroke={TEMBUS.rusuk} strokeWidth={3.2} strokeLinecap="round" opacity={0.35}>
    {[-70, -56, -42, -28, -14].map((y, i) => (
      <path key={y} d={`M-6 ${y} Q-${30 + i * 3} ${y - 4} -${44 - i} ${y + 14} M6 ${y} Q${30 + i * 3} ${y - 4} ${44 - i} ${y + 14}`} />
    ))}
    <path d="M0 -90 V0" strokeWidth={5} />
  </g>
);

const Otak = () => (
  <g fill={TEMBUS.otak} opacity={0.4}>
    <ellipse cx={-34} cy={-218} rx={58} ry={44} />
    <ellipse cx={34} cy={-218} rx={58} ry={44} />
    <ellipse cx={0} cy={-176} rx={46} ry={22} />
  </g>
);

const Lambung = () => <path d="M-30 14 C-44 40 -14 58 14 46 C34 38 30 18 18 10 Z" fill={TEMBUS.lambung} opacity={0.4} />;

// Siluet, organ, dan cahaya denyut. `denyut` dalam denyut per menit, `nyala` 0..1 kekuatan organ.
const Siluet = ({denyut, nyala, tidakTeratur, id}: {denyut: number; nyala: number; tidakTeratur: boolean; id: string}) => {
  const frame = useCurrentFrame();
  const d = detak(frame, denyut, tidakTeratur);
  // Gelombang cahaya merah yang menyebar dari jantung di setiap ketukan, mengikuti ketukan yang tidak beraturan.
  const ketukan = ketukanDi(frame, Math.max(1, denyut), tidakTeratur);
  const fase = (frame - ketukan.awal) / ketukan.panjang;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-pulsa`}>
          <stop offset="0%" stopColor={TEMBUS.pulsa} stopOpacity={0.75} />
          <stop offset="100%" stopColor={TEMBUS.pulsa} stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}-pendar`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={18} />
        </filter>
      </defs>
      <g transform={`translate(${ASAL.x} ${ASAL.y}) scale(${SKALA})`}>
        {/* Tepi bercahaya lembut dari salinan siluet yang dikaburkan, bukan garis tepi. */}
        <g filter={`url(#${id}-pendar)`} opacity={0.75}>
          <path d={SILUET_RIG.badan} fill="none" stroke={TEMBUS.tepi} strokeWidth={5} />
          <path d={SILUET_RIG.kepala} fill="none" stroke={TEMBUS.tepi} strokeWidth={5} />
        </g>
        <path d={SILUET_RIG.badan} fill={TEMBUS.badan} />
        <path d={SILUET_RIG.kepala} fill={TEMBUS.badan} />
        <path d={SILUET_RIG.rambut} fill={TEMBUS.rambut} />
        <g opacity={0.4 + nyala * 0.6}>
          <Otak />
          <Rusuk />
          <Paru />
          <Lambung />
        </g>
      </g>
      {/* Pulsa merah: pendar di jantung dan gelombang yang meluas. */}
      <circle cx={TITIK_JANTUNG.x} cy={TITIK_JANTUNG.y} r={200 + d * 60} fill={`url(#${id}-pulsa)`} opacity={(0.25 + d * 0.75) * nyala} />
      <circle cx={TITIK_JANTUNG.x} cy={TITIK_JANTUNG.y} r={90 + fase * 420} fill="none" stroke={TEMBUS.pulsa} strokeWidth={14 * (1 - fase)} opacity={(1 - fase) * 0.5 * nyala} />
      <OrganTengah nama="jantung" keadaan={{denyut, tidakTeratur}} x={TITIK_JANTUNG.x} y={TITIK_JANTUNG.y} skala={0.36} />
    </g>
  );
};

const SLOT_TEMBUS: Record<string, Slot> = {
  jantung: TITIK_JANTUNG,
  otak: dunia(0, -210),
  dada: dunia(0, -40),
};

// `denyut` denyut per menit, `nyala` 0..1 seberapa terang organ samar, `tidakTeratur` jarak ketukan acak.
export const setTembus = ({denyut = 72, nyala = 1, tidakTeratur = false, id = 'tembus'}: {denyut?: number; nyala?: number; tidakTeratur?: boolean; id?: string} = {}): HasilSet => ({
  tengah: <Siluet denyut={denyut} nyala={nyala} tidakTeratur={tidakTeratur} id={id} />,
  slot: SLOT_TEMBUS,
  sorot: {x: TITIK_JANTUNG.x, y: TITIK_JANTUNG.y, lebar: 520, jenis: 'titik'},
  pakaiLatar: true,
});
