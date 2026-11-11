import type {CSSProperties, ReactNode} from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  interpolateColors,
  random,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import episode from '../data/ump-2026.json';
import narasi from '../data/narasi.json';
import waktu from '../data/narasi-waktu.json';
import provinces from '../data/indonesia-provinces.json';
import {FONT, decimal, rupiah} from './DataShort';
import {
  BAR,
  DATA_OVERLAY,
  FADE,
  MAP_RAMP,
  MAP_SEA,
  MAP_UNKNOWN,
  MONEY,
  MONEY_GLOW,
  MONEY_INK,
  MONEY_LIGHT,
  MONEY_SHADE,
  MONEY_SHEET,
  NAVY,
  ROSE,
  SHELF_COLORS,
  STRAP,
  WARM_SHELF,
  WARM_WALL,
  WHITE,
} from './tema';
import {Tokoh, type LookName} from './Tokoh';

const HOST = narasi.tokoh as LookName;

const FPS = 30;
const GAP = 9;
const EDGE = 14;

// Durasi adegan mengikuti panjang suara tiap baris narasi.
const SCRIPT = narasi.scenes.map((scene) => {
  let cursor = EDGE;
  const lines = scene.lines.map((line) => {
    const frames = Math.ceil((waktu as Record<string, number>)[line.id] * FPS);
    const item = {...line, start: cursor, frames};
    cursor += frames + GAP;
    return item;
  });
  return {id: scene.id, lines, duration: cursor + EDGE};
});

type SceneId = 'intro' | 'ranking' | 'stacks' | 'tabungan' | 'map' | 'outro';
const part = (id: SceneId) => SCRIPT.find((scene) => scene.id === id)!;
const lines = (id: SceneId) => part(id).lines;
const SCENES = Object.fromEntries(SCRIPT.map((scene) => [scene.id, scene.duration])) as Record<SceneId, number>;
export const SINEMATIK_FRAMES = SCRIPT.reduce((sum, scene) => sum + scene.duration, 0);

const W = 1080;
const H = 1920;

const items = [...episode.items].sort((a, b) => b.value - a.value);
const TOP = items[0];
const BOTTOM = items[items.length - 1];
const RATIO = TOP.value / BOTTOM.value;
const BILLS = [TOP, BOTTOM].map((item) => Math.round((item.value * 12) / 100000));

const smooth = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

export const Fade = ({duration}: {duration: number}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 14, duration - 14, duration], [1, 0, 0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{backgroundColor: FADE, opacity}} />;
};

const Captions = ({scene, top = 1390}: {scene: SceneId; top?: number}) => {
  const frame = useCurrentFrame();
  const line = lines(scene).find((item) => frame >= item.start - 2 && frame < item.start + item.frames + GAP - 2);
  if (!line) return null;
  const local = frame - line.start;
  const opacity = interpolate(local, [-2, 5, line.frames + 2, line.frames + GAP - 2], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{position: 'absolute', top, left: 80, width: 860, textAlign: 'center', opacity, fontFamily: FONT}}>
      <span
        style={{
          fontSize: 40,
          fontWeight: 500,
          lineHeight: 1.5,
          color: WHITE,
          backgroundColor: 'rgba(12,12,18,0.78)',
          padding: '5px 14px',
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
        }}
      >
        {line.teks}
      </span>
    </div>
  );
};

const Voice = ({scene}: {scene: SceneId}) => (
  <>
    {lines(scene).map((line) => (
      <Sequence key={line.id} from={line.start} durationInFrames={line.frames + GAP}>
        <Audio src={staticFile(`suara/${line.id}.mp3`)} />
      </Sequence>
    ))}
  </>
);

const Layer = ({children, style}: {children: ReactNode; style: CSSProperties}) => (
  <div style={{position: 'absolute', ...style}}>{children}</div>
);

// Rak warung yang sengaja diburamkan sebagai latar.
export const Shelves = ({blur}: {blur: number}) => {
  return (
    <AbsoluteFill style={{filter: `blur(${blur}px)`, background: WARM_WALL}}>
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row}>
          <div style={{position: 'absolute', top: 330 + row * 300, left: -40, width: W + 80, height: 26, backgroundColor: WARM_SHELF}} />
          {Array.from({length: 7}, (_, i) => {
            const height = 130 + random(`h${row}${i}`) * 110;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: i * 165 - 20 + random(`x${row}${i}`) * 30,
                  top: 330 + row * 300 - height,
                  width: 120,
                  height,
                  borderRadius: 12,
                  backgroundColor: SHELF_COLORS[Math.floor(random(`c${row}${i}`) * SHELF_COLORS.length)],
                }}
              />
            );
          })}
        </div>
      ))}
    </AbsoluteFill>
  );
};

export const Sign = ({drop, swing, children}: {drop: number; swing: number; children: ReactNode}) => (
  <div
    style={{
      position: 'absolute',
      left: 130,
      top: 230 - (1 - drop) * 620,
      width: 820,
      transformOrigin: '50% -200px',
      transform: `rotate(${swing}deg)`,
    }}
  >
    <div style={{position: 'absolute', left: 150, top: -300, width: 8, height: 310, backgroundColor: '#7A5238'}} />
    <div style={{position: 'absolute', left: 662, top: -300, width: 8, height: 310, backgroundColor: '#7A5238'}} />
    <div
      style={{
        borderRadius: 26,
        padding: '26px 30px 34px',
        textAlign: 'center',
        color: WHITE,
        fontFamily: FONT,
        background: 'linear-gradient(135deg, #3B4066, #23264A)',
        border: '12px solid #C89A6B',
        boxShadow: '0 22px 36px rgba(90,50,20,0.28)',
      }}
    >
      {children}
    </div>
  </div>
);

const Intro = () => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, SCENES.intro], [1, 1.06]);
  const swing = Math.sin(frame / 26) * 2.6 * (1 - smooth(frame, 120, 220) * 0.6);
  const drop = smooth(frame, 16, 56);
  const lookUp = smooth(frame, 60, 100);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${push * 1.05})`}}>
        <Shelves blur={9} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(115deg, rgba(255,255,255,0.3) 0 36%, transparent 36% 100%)'}} />
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 70%'}}>
        <Sign drop={drop} swing={swing}>
          <div style={{fontSize: 190, fontWeight: 900, lineHeight: 1.05}}>{decimal(RATIO)}×</div>
          <div style={{fontSize: 38, fontWeight: 500}}>
            UMP {TOP.label} dibanding {BOTTOM.label}
          </div>
        </Sign>
        <Layer style={{left: 40, top: 640}}>
          <Tokoh size={1000} variant={HOST} look={-0.1} up={lookUp} id="intro" />
        </Layer>
      </AbsoluteFill>
      <Captions scene="intro" />
      <Voice scene="intro" />
      <Fade duration={SCENES.intro} />
    </AbsoluteFill>
  );
};

type Point = [number, number];
const pts = (points: Point[]) => points.map((point) => point.join(',')).join(' ');

const BILL_LONG = 240;
const BILL_SHORT = 120;
const SHEET_PX = 0.88;
const BUNDLE_SHEETS = 100;

// Satu lembar fiktif yang digambar datar, lalu dipetakan ke bidang isometrik.
const BillTop = ({x, y}: {x: number; y: number}) => (
  <g transform={`matrix(0.866 -0.5 0.866 0.5 ${x} ${y})`} fontFamily={FONT}>
    <rect width={BILL_LONG} height={BILL_SHORT} fill={MONEY_LIGHT} />
    <rect x={8} y={8} width={BILL_LONG - 16} height={BILL_SHORT - 16} rx={7} fill="none" stroke={MONEY_INK} strokeWidth={3} />
    <ellipse cx={BILL_LONG / 2} cy={BILL_SHORT / 2} rx={32} ry={38} fill={MONEY} stroke={MONEY_INK} strokeWidth={3} />
    <text x={18} y={46} fontSize={36} fontWeight={900} fill={MONEY_INK}>100</text>
    <text x={BILL_LONG - 18} y={BILL_SHORT - 16} fontSize={36} fontWeight={900} fill={MONEY_INK} textAnchor="end">100</text>
    <text x={BILL_LONG / 2} y={BILL_SHORT / 2 + 8} fontSize={24} fontWeight={900} fill={MONEY_INK} textAnchor="middle">100</text>
  </g>
);

// Tumpukan ikatan uang: tiap 100 lembar punya pita kertas dan sedikit bergeser.
const Stack = ({x, floor, sheets, tone, id}: {x: number; floor: number; sheets: number; tone: string; id: string}) => {
  const long: Point = [BILL_LONG * 0.866, -BILL_LONG * 0.5];
  const short: Point = [-BILL_SHORT * 0.866, -BILL_SHORT * 0.5];
  const side = interpolateColors(0.3, [0, 1], [tone, MONEY_SHADE]);
  const count = Math.ceil(sheets / BUNDLE_SHEETS);
  const bundles = Array.from({length: count}, (_, i) => {
    const amount = Math.min(BUNDLE_SHEETS, sheets - i * BUNDLE_SHEETS);
    const shift = i === 0 ? 0 : (random(`${id}s${i}`) - 0.5) * 12;
    return {shift, base: floor - i * BUNDLE_SHEETS * SHEET_PX, height: amount * SHEET_PX};
  });
  const last = bundles[bundles.length - 1];
  return (
    <g>
      <defs>
        <pattern id={`${id}p`} width={10} height={6} patternUnits="userSpaceOnUse">
          <rect width={10} height={2} fill={MONEY_SHEET} />
        </pattern>
      </defs>
      {bundles.map(({shift, base, height}, i) => {
        const front: Point = [x + shift, base];
        const left: Point = [front[0] + short[0], front[1] + short[1]];
        const right: Point = [front[0] + long[0], front[1] + long[1]];
        const lift = ([px, py]: Point): Point => [px, py - height];
        const along = (t: number): Point => [front[0] + long[0] * t, front[1] + long[1] * t];
        const strapA = along(0.44);
        const strapB = along(0.56);
        return (
          <g key={i}>
            <polygon points={pts([front, left, lift(left), lift(front)])} fill={side} />
            <polygon points={pts([front, right, lift(right), lift(front)])} fill={tone} />
            <polygon points={pts([front, left, lift(left), lift(front)])} fill={`url(#${id}p)`} />
            <polygon points={pts([front, right, lift(right), lift(front)])} fill={`url(#${id}p)`} />
            <polygon points={pts([strapA, strapB, lift(strapB), lift(strapA)])} fill={STRAP} />
            <polyline points={pts([left, front, right])} fill="none" stroke={MONEY_SHADE} strokeWidth={3} opacity={0.55} />
          </g>
        );
      })}
      {last && <BillTop x={x + last.shift + short[0]} y={last.base - last.height + short[1]} />}
    </g>
  );
};


const Stacks = () => {
  const frame = useCurrentFrame();
  const L = lines('stacks');
  const p = smooth(frame, L[0].start + 6, L[0].start + L[0].frames + 20);
  const zoom = interpolate(smooth(frame, L[0].start, L[1].start + 30), [0, 1], [1.4, 1]);
  const lookUp = smooth(frame, L[0].start + 90, L[0].start + 150);
  const gapShow = smooth(frame, L[2].start - 6, L[2].start + 14);
  const sheets = BILLS.map((count) => count * p);
  const floor = 1160;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Shelves blur={16} />
      <AbsoluteFill style={{backgroundColor: DATA_OVERLAY}} />
      <div
        style={{
          position: 'absolute',
          top: 230,
          left: 80,
          width: 900,
          textAlign: 'center',
          color: WHITE,
          fontFamily: FONT,
          fontSize: 50,
          fontWeight: 900,
          lineHeight: 1.15,
        }}
      >
        {gapShow < 0.5 ? 'Upah minimum setahun dalam lembar Rp100.000' : `Selisih setahun ${rupiah((TOP.value - BOTTOM.value) * 12)}`}
      </div>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 72%'}}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <ellipse cx={540} cy={1140} rx={440} ry={90} fill={MONEY_GLOW} style={{filter: 'blur(36px)'}} />
          <Stack x={262} floor={floor} sheets={sheets[0]} tone={MONEY} id="a" />
          <Stack x={712} floor={floor} sheets={sheets[1]} tone={MONEY} id="b" />
        </svg>
        <Layer style={{left: 450, top: 950, transform: 'scaleX(-1)'}}>
          <Tokoh size={230} variant={HOST} look={0.8} up={lookUp} raise={smooth(frame, L[1].start, L[1].start + 30) * 0.6} id="stack" />
        </Layer>
        {[0, 1].map((i) => {
          const item = i === 0 ? TOP : BOTTOM;
          return (
            <div
              key={item.label}
              style={{
                position: 'absolute',
                top: 1200,
                left: i === 0 ? 30 : 650,
                width: 400,
                textAlign: 'center',
                color: WHITE,
                fontFamily: FONT,
                opacity: smooth(frame, L[1].start, L[1].start + 30),
              }}
            >
              <div style={{fontSize: 54, fontWeight: 900}}>±{BILLS[i]} lembar</div>
              <div style={{fontSize: 30, fontWeight: 500}}>{item.label}</div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Captions scene="stacks" top={1340} />
      <Voice scene="stacks" />
      <div style={{position: 'absolute', left: 80, top: 1500, color: WHITE, fontFamily: FONT, fontSize: 24, fontWeight: 500, opacity: 0.8}}>
        {episode.source}
      </div>
      <Fade duration={SCENES.stacks} />
    </AbsoluteFill>
  );
};

type Province = {name: string; value: number | null; rings: number[][][]};
const LIST = provinces as Province[];
const VALUES = LIST.flatMap((province) => (province.value === null ? [] : [province.value]));
const MAX = Math.max(...VALUES);
const MIN = Math.min(...VALUES);

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
      ? MAP_UNKNOWN
      : interpolateColors(Math.pow((province.value - MIN) / (MAX - MIN), 0.75), [0, 0.55, 1], MAP_RAMP);
  return {...province, lat, lon, path, color};
});

const JAKARTA = MAP.find((province) => province.name === 'Jakarta Raya')!;
const BARAT = MAP.find((province) => province.name === 'Jawa Barat')!;

const Tag = ({x, y, anchorX, anchorY, title, value, opacity}: {x: number; y: number; anchorX: number; anchorY: number; title: string; value: string; opacity: number}) => (
  <>
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity}}>
      <line x1={x} y1={y > anchorY ? y - 106 : y + 8} x2={anchorX} y2={anchorY} stroke={NAVY} strokeWidth={3} />
      <circle cx={anchorX} cy={anchorY} r={8} fill={WHITE} stroke={NAVY} strokeWidth={3} />
    </svg>
    <div style={{position: 'absolute', left: x - 200, top: y - 96, width: 400, textAlign: 'center', color: NAVY, fontFamily: FONT, opacity}}>
      <div style={{fontSize: 32, fontWeight: 500}}>{title}</div>
      <div style={{fontSize: 50, fontWeight: 900}}>{value}</div>
    </div>
  </>
);

const Mist = ({i}: {i: number}) => {
  const frame = useCurrentFrame();
  const x = ((random(`mx${i}`) * (W + 500) + frame * (0.5 + i * 0.2)) % (W + 500)) - 300;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: 160 + random(`my${i}`) * 1000,
        width: 420,
        height: 150,
        borderRadius: '50%',
        backgroundColor: '#FFFFFF',
        opacity: 0.55,
        filter: 'blur(34px)',
      }}
    />
  );
};

const MapShot = () => {
  const frame = useCurrentFrame();
  const t = smooth(frame, SCENES.map * 0.3, SCENES.map * 0.72);
  const scale = Math.exp(interpolate(t, [0, 1], [Math.log(5.6), Math.log(2.2)]));
  const centerX = interpolate(t, [0, 1], [mapX(JAKARTA.lon) + 6, 0]);
  const centerY = interpolate(t, [0, 1], [mapY(JAKARTA.lat) + 8, 20]);
  const originY = 720;
  const screen = (lon: number, lat: number) => [
    W / 2 + (mapX(lon) - centerX) * scale,
    originY + (mapY(lat) - centerY) * scale,
  ];
  const [jx, jy] = screen(JAKARTA.lon, JAKARTA.lat);
  const [bx, by] = screen(BARAT.lon, BARAT.lat);
  const pulse = 1 + Math.sin(frame / 16) * 0.12;
  const reveal = smooth(frame, 24, 62);
  const figure = smooth(frame, SCENES.map * 0.7, SCENES.map * 0.84);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{background: MAP_SEA}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="hot">
            <stop offset="0%" stopColor={ROSE} stopOpacity={0.95} />
            <stop offset="55%" stopColor={ROSE} stopOpacity={0.5} />
            <stop offset="100%" stopColor={ROSE} stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={`translate(${W / 2} ${originY}) scale(${scale}) translate(${-centerX} ${-centerY})`}>
          <g style={{filter: 'blur(4px)'}} transform="translate(1.5 4)" opacity={0.28}>
            {MAP.map((province) => (
              <path key={province.name} d={province.path} fill="#2C3270" />
            ))}
          </g>
          {MAP.map((province) => (
            <path
              key={province.name}
              d={province.path}
              fill={province.color}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={1.5}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        <circle cx={jx} cy={jy} r={64 * pulse * (0.5 + scale / 8)} fill="url(#hot)" opacity={reveal} />
      </svg>
      {[0, 1, 2].map((i) => (
        <Mist key={i} i={i} />
      ))}
      <Tag x={Math.max(240, jx - 90)} y={Math.max(420, jy - 190)} anchorX={jx} anchorY={jy} title={TOP.label} value={rupiah(TOP.value)} opacity={reveal} />
      <Tag x={Math.min(830, bx + 200)} y={Math.min(1160, by + 280)} anchorX={bx} anchorY={by} title={BOTTOM.label} value={rupiah(BOTTOM.value)} opacity={smooth(frame, 70, 104)} />
      <Layer style={{left: -30, top: 1660 - figure * 310, filter: `blur(${1.5 * figure}px)`, opacity: figure}}>
        <Tokoh size={480} variant={HOST} look={0.6} up={0.8} id="map" />
      </Layer>
      <Captions scene="map" top={1240} />
      <Voice scene="map" />
      <Fade duration={SCENES.map} />
    </AbsoluteFill>
  );
};

const Ranking = () => {
  const frame = useCurrentFrame();
  const L = lines('ranking');
  const focus = smooth(frame, L[2].start - 6, L[2].start + 14);
  return (
    <AbsoluteFill style={{overflow: 'hidden', fontFamily: FONT, color: WHITE}}>
      <Shelves blur={16} />
      <AbsoluteFill style={{backgroundColor: DATA_OVERLAY}} />
      <div style={{position: 'absolute', top: 230, left: 80, width: 900, textAlign: 'center', fontSize: 50, fontWeight: 900}}>
        UMP 2026, 8 provinsi pilihan
      </div>
      {items.map((item, i) => {
        const p = smooth(frame, 16 + i * 13, 54 + i * 13);
        const edge = item === TOP || item === BOTTOM;
        return (
          <div key={item.label} style={{position: 'absolute', top: 330 + i * 102, left: 80, width: 880, opacity: Math.min(1, p * 3) * (edge ? 1 : 1 - focus * 0.6)}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 34, fontWeight: edge ? 900 : 500}}>
              <span>{item.label}</span>
              <span>{rupiah(item.value * p)}</span>
            </div>
            <div style={{height: 30, marginTop: 6, borderRadius: 6, width: `${(item.value / TOP.value) * 100 * p}%`, backgroundColor: edge ? ROSE : BAR}} />
          </div>
        );
      })}
      <div style={{position: 'absolute', top: 1160, left: 80, width: 900, textAlign: 'center', fontSize: 56, fontWeight: 900, opacity: focus}}>
        Selisih {rupiah(TOP.value - BOTTOM.value)} per bulan
      </div>
      <Captions scene="ranking" top={1340} />
      <Voice scene="ranking" />
      <div style={{position: 'absolute', left: 80, top: 1500, fontSize: 24, fontWeight: 500, opacity: 0.8}}>{episode.source}</div>
      <Fade duration={SCENES.ranking} />
    </AbsoluteFill>
  );
};

const Tabungan = () => {
  const frame = useCurrentFrame();
  const L = lines('tabungan');
  const longest = episode.savingsTarget / BOTTOM.value;
  return (
    <AbsoluteFill style={{overflow: 'hidden', fontFamily: FONT, color: WHITE}}>
      <Shelves blur={16} />
      <AbsoluteFill style={{backgroundColor: DATA_OVERLAY}} />
      <div style={{position: 'absolute', top: 230, left: 80, width: 900, textAlign: 'center'}}>
        <div style={{fontSize: 50, fontWeight: 900, lineHeight: 1.15}}>Waktu mengumpulkan {rupiah(episode.savingsTarget)}</div>
        <div style={{fontSize: 34, fontWeight: 500, marginTop: 10}}>kalau seluruh UMP ditabung</div>
      </div>
      {[TOP, BOTTOM].map((item, i) => {
        const months = episode.savingsTarget / item.value;
        const p = smooth(frame, L[1].start + i * 70, L[1].start + 60 + i * 70);
        return (
          <div key={item.label} style={{position: 'absolute', top: 470 + i * 220, left: 80, width: 880, opacity: Math.min(1, p * 4)}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
              <span style={{fontSize: 36, fontWeight: 500}}>{item.label}</span>
              <span style={{fontSize: 68, fontWeight: 900}}>{decimal(months * p, 1)} bulan</span>
            </div>
            <div style={{height: 44, marginTop: 8, borderRadius: 8, width: `${(months / longest) * 100 * p}%`, backgroundColor: BAR}} />
          </div>
        );
      })}
      <Layer style={{left: 425, top: 925}}>
        <Tokoh size={230} variant={HOST} look={0.2} up={smooth(frame, L[1].start, L[1].start + 40) * 0.8} id="tabungan" />
      </Layer>
      <Captions scene="tabungan" top={1340} />
      <Voice scene="tabungan" />
      <Fade duration={SCENES.tabungan} />
    </AbsoluteFill>
  );
};

const Outro = () => {
  const frame = useCurrentFrame();
  const L = lines('outro');
  const push = interpolate(frame, [0, SCENES.outro], [1, 1.05]);
  const drop = smooth(frame, L[1].start - 10, L[1].start + 26);
  const swing = Math.sin(frame / 26) * 2.2;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${push * 1.05})`}}>
        <Shelves blur={9} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(115deg, rgba(255,255,255,0.3) 0 36%, transparent 36% 100%)'}} />
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 70%'}}>
        <Sign drop={drop} swing={swing}>
          <div style={{fontSize: 84, fontWeight: 900, lineHeight: 1.12}}>Provinsimu di angka berapa?</div>
        </Sign>
        <Layer style={{left: 40, top: 640}}>
          <Tokoh size={1000} variant={HOST} look={0.15} up={drop * 0.7} id="outro" />
        </Layer>
      </AbsoluteFill>
      <Captions scene="outro" />
      <Voice scene="outro" />
      <Fade duration={SCENES.outro} />
    </AbsoluteFill>
  );
};

const VIEWS: Record<SceneId, () => ReactNode> = {
  intro: Intro,
  ranking: Ranking,
  stacks: Stacks,
  tabungan: Tabungan,
  map: MapShot,
  outro: Outro,
};

export const Sinematik = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{backgroundColor: FADE}}>
      {SCRIPT.map((scene) => {
        const View = VIEWS[scene.id as SceneId];
        const start = from;
        from += scene.duration;
        return (
          <Sequence key={scene.id} from={start} durationInFrames={scene.duration}>
            <View />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
