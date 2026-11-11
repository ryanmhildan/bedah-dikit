import type {CSSProperties, ReactNode} from 'react';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  interpolateColors,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import episode from '../data/ump-2026.json';
import host from '../data/ilustrasi.json';
import provinces from '../data/indonesia-provinces.json';
import {ACCENT, FONT, Host, INK, Rise, Scene, decimal, progress, rupiah, type HostLine} from './DataShort';

const SCENES = {hook: 300, stacks: 330, map: 420};
export const ILUSTRASI_FRAMES = SCENES.hook + SCENES.stacks + SCENES.map;

const W = 1080;
const H = 1920;
const CARD = '#FFFDF7';
const SUN = '#FFD23F';
const RED = '#E63946';
const TEAL = '#1FA89A';

const sorted = [...episode.items].sort((a, b) => b.value - a.value);
const TOP = sorted[0];
const BOTTOM = sorted[sorted.length - 1];

const shade = (color: string, amount: number) => interpolateColors(amount, [0, 1], [color, INK]);

const Canvas = ({children}: {children: ReactNode}) => (
  <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{position: 'absolute', inset: 0}}>
    {children}
  </svg>
);

const Card = ({children, style}: {children: ReactNode; style?: CSSProperties}) => (
  <div
    style={{
      backgroundColor: CARD,
      color: INK,
      border: `6px solid ${INK}`,
      borderRadius: 28,
      boxShadow: `10px 10px 0 ${INK}`,
      padding: '26px 34px',
      ...style,
    }}
  >
    {children}
  </div>
);

const Sun = ({x, y, r}: {x: number; y: number; r: number}) => {
  const frame = useCurrentFrame();
  return (
    <g transform={`translate(${x} ${y}) rotate(${frame * 0.5})`}>
      {Array.from({length: 12}, (_, i) => (
        <rect key={i} x={-9} y={-r - 58} width={18} height={40} rx={9} fill={SUN} transform={`rotate(${i * 30})`} />
      ))}
      <circle r={r} fill={SUN} stroke={INK} strokeWidth={6} />
    </g>
  );
};

const Cloud = ({x, y, scale, speed}: {x: number; y: number; scale: number; speed: number}) => {
  const frame = useCurrentFrame();
  const span = W + 500;
  const left = ((x + frame * speed) % span) - 250;
  return (
    <g transform={`translate(${left} ${y}) scale(${scale})`}>
      <path
        d="M-110 34 a38 38 0 0 1 10 -74 a56 56 0 0 1 104 -18 a44 44 0 0 1 74 28 a33 33 0 0 1 -6 64 z"
        fill="#fff"
        stroke={INK}
        strokeWidth={6}
      />
    </g>
  );
};

const Bird = ({x, y, speed}: {x: number; y: number; speed: number}) => {
  const frame = useCurrentFrame();
  const flap = Math.sin(frame / 3 + x) * 12;
  const left = ((x + frame * speed) % (W + 200)) - 100;
  return (
    <path
      d={`M${left - 26} ${y - flap} Q${left - 12} ${y - 10} ${left} ${y} Q${left + 12} ${y - 10} ${left + 26} ${y - flap}`}
      fill="none"
      stroke={INK}
      strokeWidth={6}
      strokeLinecap="round"
    />
  );
};

const Tree = ({x, y, size, color = '#2E9E5B'}: {x: number; y: number; size: number; color?: string}) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame / 14 + x) * 3;
  return (
    <g transform={`translate(${x} ${y}) rotate(${sway})`}>
      <rect x={-size * 0.09} y={-size * 0.8} width={size * 0.18} height={size * 0.8} fill="#8A5A34" stroke={INK} strokeWidth={5} />
      <circle cy={-size} r={size * 0.52} fill={color} stroke={INK} strokeWidth={5} />
      <circle cx={-size * 0.16} cy={-size * 1.14} r={size * 0.14} fill={shade(color, 0) === color ? '#62C97F' : color} />
    </g>
  );
};

const Tower = ({x, ground, w, h, color, delay}: {x: number; ground: number; w: number; h: number; color: string; delay: number}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - delay, fps, config: {damping: 11}, durationInFrames: 32});
  const height = h * p;
  const top = ground - height;
  const side = w * 0.32;
  const columns = Math.floor((w - 22) / 34);
  const rows = Math.floor((height - 22) / 44);
  return (
    <g>
      <path d={`M${x + w} ${top} l${side} ${-side * 0.5} v${height} l${-side} ${side * 0.5} z`} fill={shade(color, 0.32)} stroke={INK} strokeWidth={5} />
      <path d={`M${x} ${top} l${side} ${-side * 0.5} h${w} l${-side} ${side * 0.5} z`} fill={shade(color, 0.12)} stroke={INK} strokeWidth={5} />
      <rect x={x} y={top} width={w} height={height} fill={color} stroke={INK} strokeWidth={5} />
      {Array.from({length: Math.max(0, rows)}, (_, row) =>
        Array.from({length: columns}, (_, column) => {
          const lit = random(`${x}-${row}-${column}-${Math.floor((frame + column * 7) / 45)}`) > 0.35;
          return (
            <rect
              key={`${row}-${column}`}
              x={x + 14 + column * 34}
              y={top + 16 + row * 44}
              width={22}
              height={28}
              rx={3}
              fill={lit ? SUN : shade(color, 0.45)}
            />
          );
        }),
      )}
    </g>
  );
};

const Car = ({y, color, speed, offset, flip}: {y: number; color: string; speed: number; offset: number; flip?: boolean}) => {
  const frame = useCurrentFrame();
  const span = W + 300;
  const travel = (offset + frame * speed) % span;
  const x = flip ? W + 150 - travel : travel - 150;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <path d="M-70 0 v-30 q0 -8 10 -8 h20 l22 -28 h52 l26 28 h22 q8 0 8 10 v28 z" fill={color} stroke={INK} strokeWidth={5} />
      <path d="M-30 -38 l16 -20 h26 v20 z M22 -38 v-20 h16 l18 20 z" fill="#CFF3FF" stroke={INK} strokeWidth={4} />
      <circle cx={-38} r={15} fill={INK} />
      <circle cx={46} r={15} fill={INK} />
    </g>
  );
};

const Road = ({y}: {y: number}) => {
  const frame = useCurrentFrame();
  return (
    <g>
      <rect y={y} width={W} height={190} fill="#4B4F6B" stroke={INK} strokeWidth={6} />
      {Array.from({length: 9}, (_, i) => (
        <rect key={i} x={((i * 150 - frame * 7) % 1350) + 150} y={y + 90} width={84} height={12} rx={6} fill={SUN} />
      ))}
    </g>
  );
};

// Pergantian adegan: lingkaran kuning menutup lalu membuka.
const Wipe = ({duration}: {duration: number}) => {
  const frame = useCurrentFrame();
  const radius = interpolate(frame, [0, 16, duration - 16, duration], [1200, 0, 0, 1200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  return (
    <Canvas>
      <circle cx={W / 2} cy={H / 2} r={radius} fill={SUN} />
    </Canvas>
  );
};

const HookScene = () => {
  const ratio = TOP.value / BOTTOM.value;
  const ground = 1150;
  return (
    <AbsoluteFill>
      <Canvas>
        <rect width={W} height={H} fill="#8FE0FF" />
        <rect y={520} width={W} height={300} fill="#B5ECFF" />
        <rect y={820} width={W} height={340} fill="#D8F6FF" />
        <Sun x={900} y={700} r={78} />
        <Cloud x={120} y={150} scale={1} speed={1.1} />
        <Cloud x={820} y={110} scale={0.8} speed={0.8} />
        <Cloud x={1250} y={760} scale={0.75} speed={1.5} />
        <Bird x={300} y={760} speed={2} />
        <Bird x={420} y={810} speed={2} />
        <path d={`M430 ${ground} Q620 800 800 980 Q930 830 1080 960 V${ground} Z`} fill="#3DB26E" stroke={INK} strokeWidth={6} />
        <path d={`M500 ${ground} Q700 930 860 1030 Q980 950 1080 1020 V${ground} Z`} fill="#7ED957" stroke={INK} strokeWidth={6} />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${560 + i * 30} ${ground - 18 - i * 28} Q${780} ${ground - 66 - i * 30} 1080 ${ground - 26 - i * 30}`} fill="none" stroke="#3DB26E" strokeWidth={6} />
        ))}
        <Tower x={40} ground={ground} w={120} h={380} color="#4361EE" delay={4} />
        <Tower x={200} ground={ground} w={132} h={480} color={RED} delay={10} />
        <Tower x={370} ground={ground} w={110} h={300} color="#F4A261" delay={16} />
        <rect y={ground} width={W} height={H - ground} fill="#57C84D" stroke={INK} strokeWidth={6} />
        <Tree x={640} y={ground + 8} size={90} />
        <Tree x={760} y={ground + 12} size={120} color="#46B66A" />
        <Tree x={960} y={ground + 8} size={100} />
        <Road y={1530} />
        <Car y={1600} color={RED} speed={7} offset={100} />
        <Car y={1600} color={SUN} speed={7} offset={760} />
        <Car y={1695} color="#4361EE" speed={10} offset={320} flip />
        <Flowers top={1800} bottom={1890} count={12} seed="hook-a" />
        <Flowers top={1200} bottom={1510} count={6} seed="hook-b" />
      </Canvas>
      <Scene bg="transparent" color={INK}>
        <Rise>
          <Card>
            <div style={{fontSize: 46, fontWeight: 700, lineHeight: 1.18}}>Gaji minimum 1 bulan di {TOP.label} setara</div>
            <div style={{fontSize: 150, fontWeight: 900, color: RED, lineHeight: 1.05}}>{decimal(ratio)}</div>
            <div style={{fontSize: 46, fontWeight: 700}}>bulan di {BOTTOM.label}</div>
          </Card>
        </Rise>
        <Host lines={host.hook as HostLine[]} duration={SCENES.hook} bg={ACCENT} />
      </Scene>
    </AbsoluteFill>
  );
};

type Point = [number, number];
const poly = (points: Point[]) => points.map((point) => point.join(',')).join(' ');

// Balok isometrik yang digambar 2D: x dan y adalah sudut depan di tanah.
const Block = ({x, y, size, height, color, bands = 0, line = 6, sheets = 0}: {x: number; y: number; size: number; height: number; color: string; bands?: number; line?: number; sheets?: number}) => {
  const dx = size * 0.866;
  const dy = size * 0.5;
  const left: Point = [x - dx, y - dy];
  const right: Point = [x + dx, y - dy];
  const up = (point: Point, amount = height): Point => [point[0], point[1] - amount];
  const front: Point = [x, y];
  const back: Point = [x, y - size];
  return (
    <g stroke={INK} strokeWidth={line} strokeLinejoin="round">
      <polygon points={poly([front, left, up(left), up(front)])} fill={shade(color, 0.1)} />
      <polygon points={poly([front, right, up(right), up(front)])} fill={shade(color, 0.3)} />
      <polygon points={poly([up(front), up(left), up(back), up(right)])} fill={interpolateColors(0.35, [0, 1], [color, '#fff'])} />
      {Array.from({length: sheets}, (_, i) => {
        const level = i * 11 + 6;
        return (
          <polyline
            key={`sheet${i}`}
            points={poly([up(left, level), up(front, level), up(right, level)])}
            fill="none"
            stroke={shade(color, 0.42)}
            strokeWidth={2}
          />
        );
      })}
      {Array.from({length: bands}, (_, i) => {
        const level = (height * (i + 1)) / (bands + 1);
        return (
          <polyline
            key={i}
            points={poly([up(left, level), up(front, level), up(right, level)])}
            fill="none"
            stroke={CARD}
            strokeWidth={10}
          />
        );
      })}
    </g>
  );
};

const FallingBill = ({seed, x, land, active}: {seed: number; x: number; land: number; active: boolean}) => {
  const frame = useCurrentFrame();
  if (!active) return null;
  const cycle = 70 + random(`c${seed}`) * 40;
  const t = ((frame + random(`o${seed}`) * cycle) % cycle) / cycle;
  const y = -40 + t * (land + 40);
  const drift = Math.sin(t * 9 + seed) * 46;
  return (
    <g transform={`translate(${x + drift} ${y}) rotate(${Math.sin(t * 7 + seed) * 50}) skewX(${Math.cos(t * 6) * 18})`}>
      <rect x={-32} y={-16} width={64} height={32} rx={4} fill="#7ED957" stroke={INK} strokeWidth={4} />
      <circle r={9} fill={CARD} stroke={INK} strokeWidth={3} />
    </g>
  );
};

const PX_PER_BILL = 0.75;

const StacksScene = () => {
  const frame = useCurrentFrame();
  const bills = [TOP, BOTTOM].map((item) => Math.round((item.value * 12) / 100000));
  const p = progress(frame, 24, 170);
  const growing = p < 0.995;
  const heights = bills.map((count) => count * PX_PER_BILL * p);
  return (
    <AbsoluteFill>
      <Canvas>
        <rect width={W} height={H} fill="#7B5CD6" />
        <rect y={380} width={W} height={220} fill="#C65BCF" />
        <rect y={600} width={W} height={220} fill="#FF7E8B" />
        <rect y={820} width={W} height={220} fill="#FFB26B" />
        <circle cx={760} cy={720} r={120} fill={SUN} stroke={INK} strokeWidth={6} />
        <Cloud x={200} y={560} scale={0.9} speed={1.2} />
        <Cloud x={900} y={140} scale={0.8} speed={0.7} />
        <path d="M0 830 L180 640 L360 820 L520 700 L720 860 L900 700 L1080 820 V1000 H0 Z" fill="#5A3FA8" stroke={INK} strokeWidth={6} />
        <path d="M0 900 Q260 780 520 900 T1080 880 V1040 H0 Z" fill="#2E9E5B" stroke={INK} strokeWidth={6} />
        <rect y={960} width={W} height={H - 960} fill="#57C84D" stroke={INK} strokeWidth={6} />
        <Tree x={70} y={990} size={110} />
        <Tree x={1000} y={1000} size={130} color="#46B66A" />
        <Tree x={530} y={985} size={80} />
        <Block x={310} y={1150} size={190} height={16} color="#F3D9A4" />
        <Block x={770} y={1150} size={190} height={16} color="#F3D9A4" />
        <Block x={310} y={1120} size={140} height={heights[0]} color={RED} bands={Math.floor(bills[0] * p / 100)} sheets={Math.floor(heights[0] / 11)} />
        <Block x={770} y={1120} size={140} height={heights[1]} color={TEAL} bands={Math.floor(bills[1] * p / 100)} sheets={Math.floor(heights[1] / 11)} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <FallingBill key={i} seed={i} x={i % 2 ? 770 : 310} land={1000 - heights[i % 2]} active={growing} />
        ))}
        <path d="M-20 1760 Q280 1600 560 1720 T1100 1640 V1800 Q820 1700 560 1810 T-20 1880 Z" fill="#F3D9A4" stroke={INK} strokeWidth={6} />
        <Flowers top={1540} bottom={1660} count={8} seed="stack-a" />
        <Flowers top={1830} bottom={1900} count={9} seed="stack-b" />
        <Tree x={940} y={1620} size={120} />
        <Tree x={110} y={1660} size={100} color="#46B66A" />
      </Canvas>
      <Scene bg="transparent" color={INK}>
        <Rise>
          <Card style={{padding: '20px 30px'}}>
            <div style={{fontSize: 34, fontWeight: 700}}>Gaji minimum setahun, dalam lembar Rp100.000</div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 6}}>
              {[TOP, BOTTOM].map((item, i) => (
                <div key={item.label}>
                  <div style={{fontSize: 30, fontWeight: 500}}>{item.label}</div>
                  <div style={{fontSize: 62, fontWeight: 900, color: i === 0 ? RED : TEAL}}>±{Math.round(bills[i] * p)}</div>
                </div>
              ))}
            </div>
          </Card>
        </Rise>
        <Host lines={host.stacks as HostLine[]} duration={SCENES.stacks} bg={ACCENT} />
      </Scene>
    </AbsoluteFill>
  );
};

type Province = {name: string; value: number | null; rings: number[][][]};
const LIST = provinces as Province[];
const VALUES = LIST.flatMap((province) => (province.value === null ? [] : [province.value]));
const MAX = Math.max(...VALUES);
const MIN = Math.min(...VALUES);
const MAX_RISE = 56;

const mapX = (lon: number) => (lon - 118) * 10;
const mapY = (lat: number) => -(lat + 2) * 10;

const MAP = LIST.map((province) => {
  const points = province.rings.flat();
  const lat = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  const lon = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const path = province.rings
    .map((ring) => `M${ring.map(([x, y]) => `${mapX(x).toFixed(1)} ${mapY(y).toFixed(1)}`).join('L')}Z`)
    .join('');
  const color =
    province.value === null
      ? '#C9CCD1'
      : interpolateColors(Math.pow((province.value - MIN) / (MAX - MIN), 0.55), [0, 0.5, 1], [SUN, '#FF8C42', RED]);
  const rise = province.value === null ? 0 : (province.value / MAX) * MAX_RISE;
  return {...province, lat, lon, path, color, rise};
}).sort((a, b) => b.lat - a.lat);

const JAKARTA = MAP.find((province) => province.name === 'Jakarta Raya')!;
const BARAT = MAP.find((province) => province.name === 'Jawa Barat')!;

const Flowers = ({top, bottom, count, seed}: {top: number; bottom: number; count: number; seed: string}) => {
  const frame = useCurrentFrame();
  const colors = ['#FF6B9D', SUN, CARD, '#B388EB'];
  return (
    <g>
      {Array.from({length: count}, (_, i) => {
        const x = 30 + random(`${seed}x${i}`) * (W - 60);
        const y = top + random(`${seed}y${i}`) * (bottom - top);
        const sway = Math.sin(frame / 12 + i) * 8;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${sway})`}>
            <path d="M0 0 V-34" stroke="#2E9E5B" strokeWidth={6} strokeLinecap="round" />
            {[0, 72, 144, 216, 288].map((angle) => (
              <circle key={angle} cx={0} cy={-13} r={9} fill={colors[i % colors.length]} stroke={INK} strokeWidth={3} transform={`translate(0 -36) rotate(${angle})`} />
            ))}
            <circle cy={-36} r={7} fill="#FF9F1C" stroke={INK} strokeWidth={3} />
          </g>
        );
      })}
    </g>
  );
};

const Palm = ({x, y}: {x: number; y: number}) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame / 16) * 4;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-16 0 Q-8 -130 34 -250 L58 -244 Q18 -130 22 0 Z" fill="#A9713F" stroke={INK} strokeWidth={6} />
      <g transform={`translate(46 -250) rotate(${sway})`}>
        {[-160, -115, -65, -20, 25, 200].map((angle) => (
          <path key={angle} d="M0 0 Q70 -44 150 12 Q70 -6 0 0 Z" fill="#2E9E5B" stroke={INK} strokeWidth={5} transform={`rotate(${angle})`} />
        ))}
      </g>
    </g>
  );
};

const Crab = ({y}: {y: number}) => {
  const frame = useCurrentFrame();
  const x = 540 + Math.sin(frame / 45) * 380;
  const step = Math.sin(frame / 2.5) * 7;
  return (
    <g transform={`translate(${x} ${y})`} stroke={INK} strokeWidth={5}>
      <path d={`M-34 8 l-24 ${12 + step} M34 8 l24 ${12 - step}`} strokeLinecap="round" />
      <path d="M-40 -6 q-34 -8 -30 -36 M40 -6 q34 -8 30 -36" fill="none" strokeLinecap="round" />
      <ellipse rx={46} ry={28} fill={RED} />
      <circle cx={-16} cy={-30} r={8} fill={CARD} />
      <circle cx={16} cy={-30} r={8} fill={CARD} />
    </g>
  );
};

const Starfish = ({x, y, color}: {x: number; y: number; color: string}) => (
  <path
    transform={`translate(${x} ${y})`}
    d="M0 -38 L11 -12 L38 -12 L17 6 L25 33 L0 18 L-25 33 L-17 6 L-38 -12 L-11 -12 Z"
    fill={color}
    stroke={INK}
    strokeWidth={5}
    strokeLinejoin="round"
  />
);

const Waves = () => {
  const frame = useCurrentFrame();
  return (
    <g fill="none" stroke="#8BE3FF" strokeWidth={6} strokeLinecap="round">
      {Array.from({length: 40}, (_, i) => {
        const x = random(`wx${i}`) * W;
        const y = 80 + random(`wy${i}`) * 1100;
        const shift = Math.sin(frame / 18 + i) * 22;
        return <path key={i} d={`M${x + shift} ${y} q24 -18 48 0 q24 18 48 0`} />;
      })}
    </g>
  );
};

const Boat = ({y, speed, offset}: {y: number; speed: number; offset: number}) => {
  const frame = useCurrentFrame();
  const x = ((offset + frame * speed) % (W + 240)) - 120;
  return (
    <g transform={`translate(${x} ${y + Math.sin(frame / 10) * 6}) rotate(${Math.sin(frame / 13) * 4})`}>
      <path d="M-50 0 h100 l-18 28 h-64 z" fill={RED} stroke={INK} strokeWidth={5} />
      <path d="M0 -6 v-66 l44 60 z" fill={CARD} stroke={INK} strokeWidth={5} />
    </g>
  );
};

const Label = ({x, y, anchorX, anchorY, title, value, color, delay}: {x: number; y: number; anchorX: number; anchorY: number; title: string; value: string; color: string; delay: number}) => (
  <>
    <Canvas>
      <line x1={x} y1={y} x2={anchorX} y2={anchorY} stroke={INK} strokeWidth={5} />
      <circle cx={anchorX} cy={anchorY} r={9} fill={CARD} stroke={INK} strokeWidth={5} />
    </Canvas>
    <Rise delay={delay} style={{position: 'absolute', left: x - 170, top: y - 54, width: 340}}>
      <Card style={{padding: '10px 16px', borderRadius: 18, boxShadow: `6px 6px 0 ${INK}`, textAlign: 'center'}}>
        <div style={{fontSize: 26, fontWeight: 500}}>{title}</div>
        <div style={{fontSize: 38, fontWeight: 900, color}}>{value}</div>
      </Card>
    </Rise>
  </>
);

const MapScene = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [170, 300], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const scale = Math.exp(interpolate(t, [0, 1], [Math.log(5.5), Math.log(2.2)]));
  const centerX = interpolate(t, [0, 1], [mapX(JAKARTA.lon), 0]);
  const centerY = interpolate(t, [0, 1], [mapY(JAKARTA.lat) - 16, 20]);
  const originY = 800;
  const screen = (lon: number, lat: number, lift: number) => [
    W / 2 + (mapX(lon) - centerX) * scale,
    originY + (mapY(lat) - lift - centerY) * scale,
  ];
  const growth = (province: (typeof MAP)[number]) =>
    progress(frame, 14 + Math.hypot(province.lon - JAKARTA.lon, province.lat - JAKARTA.lat) * 5, 40);
  const [jakartaX, jakartaY] = screen(JAKARTA.lon, JAKARTA.lat, JAKARTA.rise * growth(JAKARTA));
  const [baratX, baratY] = screen(BARAT.lon, BARAT.lat, BARAT.rise * growth(BARAT));
  return (
    <AbsoluteFill>
      <Canvas>
        <rect width={W} height={H} fill="#27B7E8" />
        <Waves />
        <Boat y={1010} speed={1.6} offset={200} />
        <g transform={`translate(${W / 2} ${originY}) scale(${scale}) translate(${-centerX} ${-centerY})`}>
          {MAP.map((province) => (
            <path key={`s${province.name}`} d={province.path} fill="#12708F" stroke="#12708F" strokeWidth={2} transform="translate(0 3.5)" />
          ))}
          {MAP.map((province) => (
            <path
              key={province.name}
              d={province.path}
              fill={province.color}
              stroke={INK}
              strokeWidth={3}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        {MAP.filter((province) => province.value !== null).map((province) => {
          const [x, y] = screen(province.lon, province.lat, 0);
          return (
            <Block
              key={province.name}
              x={x}
              y={y + 2.4 * scale}
              size={2.8 * scale}
              height={province.rise * scale * growth(province)}
              color={province.color}
              line={3}
            />
          );
        })}
        <Cloud x={300} y={560} scale={0.6} speed={1.3} />
        <Cloud x={1100} y={1060} scale={0.55} speed={1} />
        <path d="M0 1170 Q200 1120 420 1170 T820 1160 T1080 1150 V1920 H0 Z" fill="#FFE3A3" stroke={INK} strokeWidth={6} />
        <Palm x={980} y={1500} />
        <Starfish x={160} y={1620} color="#FF6B9D" />
        <Starfish x={880} y={1700} color="#FF9F1C" />
        <Crab y={1590} />
        <Boat y={1100} speed={2.2} offset={900} />
      </Canvas>
      <AbsoluteFill style={{fontFamily: FONT}}>
        <Label x={Math.max(190, jakartaX - 60)} y={Math.max(500, jakartaY - 130)} anchorX={jakartaX} anchorY={jakartaY} title={TOP.label} value={rupiah(TOP.value)} color={RED} delay={40} />
        <Label x={Math.min(880, baratX + 220)} y={Math.min(1060, baratY + 170)} anchorX={baratX} anchorY={baratY} title={BOTTOM.label} value={rupiah(BOTTOM.value)} color="#C97A00" delay={70} />
      </AbsoluteFill>
      <Scene bg="transparent" color={INK}>
        <Rise>
          <Card style={{padding: '18px 30px'}}>
            <div style={{fontSize: 52, fontWeight: 900}}>UMP 2026 per provinsi</div>
            <div style={{fontSize: 27, fontWeight: 500, marginTop: 4, lineHeight: 1.2}}>
              Makin tinggi dan merah, makin besar UMP. Abu-abu: belum pasti atau batas wilayah berubah.
            </div>
          </Card>
        </Rise>
        <Host lines={host.map as HostLine[]} duration={SCENES.map} bg={ACCENT} />
      </Scene>
    </AbsoluteFill>
  );
};

export const Ilustrasi = () => {
  const stacksStart = SCENES.hook;
  const mapStart = stacksStart + SCENES.stacks;
  return (
    <AbsoluteFill style={{backgroundColor: INK}}>
      <Sequence durationInFrames={SCENES.hook}>
        <HookScene />
        <Wipe duration={SCENES.hook} />
      </Sequence>
      <Sequence from={stacksStart} durationInFrames={SCENES.stacks}>
        <StacksScene />
        <Wipe duration={SCENES.stacks} />
      </Sequence>
      <Sequence from={mapStart} durationInFrames={SCENES.map}>
        <MapScene />
        <Wipe duration={SCENES.map} />
      </Sequence>
    </AbsoluteFill>
  );
};
