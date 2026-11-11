import type {CSSProperties, ReactNode} from 'react';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Archivo';
import {Kalku, type Mood} from './Kalku';

const {fontFamily} = loadFont('normal', {
  weights: ['500', '700', '900'],
  subsets: ['latin'],
});

export const FONT = fontFamily;

export type HostLine = {text: string; mood: Mood};
type Item = {label: string; value: number};

export type Episode = {
  metric: string;
  unitLabel: string;
  highlightCaption: string;
  items: Item[];
  savingsTarget: number;
  caveat: string;
  question: string;
  source: string;
  host: Record<keyof typeof SCENES, HostLine[]>;
};

export const INK = '#14120F';
export const PAPER = '#F3EDE2';
export const ACCENT = '#FF4B1F';
export const MUTED = '#8C8476';

// Durasi tiap adegan dalam frame (30 fps).
const SCENES = {hook: 180, ranking: 480, compare: 270, year: 240, savings: 300, outro: 330};
export const TOTAL_FRAMES = Object.values(SCENES).reduce((a, b) => a + b, 0);

export const rupiah = (n: number) =>
  'Rp' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const decimal = (n: number, digits = 2) => n.toFixed(digits).replace('.', ',');

// Area aman: menghindari UI TikTok, Reels, dan Shorts di atas, kanan, dan bawah.
export const Scene = ({bg, color, children}: {bg: string; color: string; children: ReactNode}) => (
  <AbsoluteFill
    style={{
      backgroundColor: bg,
      color,
      fontFamily,
      padding: '230px 130px 420px 80px',
      fontVariantNumeric: 'tabular-nums',
    }}
  >
    {children}
  </AbsoluteFill>
);

export const Rise = ({delay = 0, children, style}: {delay?: number; children: ReactNode; style?: CSSProperties}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - delay, fps, config: {damping: 200}, durationInFrames: 22});
  return (
    <div style={{...style, opacity: p, transform: `translateY(${(1 - p) * 46}px)`}}>{children}</div>
  );
};

export const progress = (frame: number, start: number, length: number) =>
  interpolate(frame, [start, start + length], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

// Kalku dan gelembung dialognya. Durasi adegan dibagi rata ke semua baris.
export const Host = ({lines, duration, bg}: {lines: HostLine[]; duration: number; bg: string}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const slot = duration / lines.length;
  const index = Math.min(lines.length - 1, Math.floor(frame / slot));
  const local = frame - index * slot;
  const line = lines[index];
  const typed = Math.min(line.text.length, Math.floor(local * 1.3));
  const enter = spring({frame, fps, config: {damping: 14}, durationInFrames: 24});
  const pop = spring({frame: local, fps, config: {damping: 16}, durationInFrames: 14});
  const light = bg === PAPER;
  const bubbleBg = light ? INK : PAPER;
  const bubbleText = light ? PAPER : INK;
  return (
    <div style={{position: 'absolute', left: 60, top: 1180, width: 890, display: 'flex', alignItems: 'center'}}>
      <div style={{transform: `scale(${enter})`, transformOrigin: 'bottom center'}}>
        <Kalku size={320} mood={line.mood} talking={typed < line.text.length} limb={bg === INK ? PAPER : INK} />
      </div>
      <div
        style={{
          position: 'relative',
          flex: 1,
          marginLeft: 26,
          padding: '26px 30px',
          borderRadius: 28,
          backgroundColor: bubbleBg,
          color: bubbleText,
          fontSize: 40,
          fontWeight: 700,
          lineHeight: 1.2,
          transform: `scale(${pop})`,
          transformOrigin: 'left center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: -22,
            top: '50%',
            marginTop: -18,
            borderTop: '18px solid transparent',
            borderBottom: '18px solid transparent',
            borderRight: `24px solid ${bubbleBg}`,
          }}
        />
        {line.text.slice(0, typed)}
        <span style={{opacity: 0}}>{line.text.slice(typed)}</span>
      </div>
    </div>
  );
};

const Hook = ({top, bottom, ratio, episode}: {top: string; bottom: string; ratio: number; episode: Episode}) => (
  <Scene bg={INK} color={PAPER}>
    <Rise style={{fontSize: 62, fontWeight: 500, lineHeight: 1.2}}>
      Gaji minimum 1 bulan
      <br />
      di {top}
    </Rise>
    <Rise delay={14} style={{fontSize: 62, fontWeight: 500, marginTop: 40}}>setara</Rise>
    <Rise delay={24} style={{fontSize: 230, fontWeight: 900, color: ACCENT, lineHeight: 1.1}}>
      {decimal(ratio)}
    </Rise>
    <Rise delay={34} style={{fontSize: 62, fontWeight: 500, lineHeight: 1.2}}>
      bulan di {bottom}
    </Rise>
    <Host lines={episode.host.hook} duration={SCENES.hook} bg={INK} />
  </Scene>
);

const Ranking = ({episode, sorted}: {episode: Episode; sorted: Item[]}) => {
  const frame = useCurrentFrame();
  const max = sorted[0].value;
  return (
    <Scene bg={PAPER} color={INK}>
      <Rise style={{fontSize: 62, fontWeight: 900}}>{episode.metric}</Rise>
      <Rise delay={6} style={{fontSize: 34, fontWeight: 500, color: MUTED, marginBottom: 26}}>
        {episode.unitLabel}, {episode.highlightCaption}
      </Rise>
      {sorted.map((item, i) => {
        const p = progress(frame, 24 + i * 34, 40);
        const edge = i === 0 || i === sorted.length - 1;
        return (
          <div key={item.label} style={{marginBottom: 20, opacity: Math.min(1, p * 3)}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 36, fontWeight: edge ? 900 : 500}}>
              <span>{item.label}</span>
              <span>{rupiah(item.value * p)}</span>
            </div>
            <div
              style={{
                height: 22,
                marginTop: 6,
                width: `${(item.value / max) * 100 * p}%`,
                backgroundColor: edge ? ACCENT : INK,
              }}
            />
          </div>
        );
      })}
      <Host lines={episode.host.ranking} duration={SCENES.ranking} bg={PAPER} />
    </Scene>
  );
};

const Compare = ({top, bottom, episode}: {top: Item; bottom: Item; episode: Episode}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, 30, 50);
  const maxHeight = 520;
  const columns = [
    {item: top, color: ACCENT},
    {item: bottom, color: PAPER},
  ];
  return (
    <Scene bg={INK} color={PAPER}>
      <Rise style={{fontSize: 44, fontWeight: 500}}>Selisih per bulan</Rise>
      <Rise delay={8} style={{fontSize: 118, fontWeight: 900, color: ACCENT}}>
        {rupiah(top.value - bottom.value)}
      </Rise>
      <div style={{display: 'flex', gap: 40, alignItems: 'flex-end', height: maxHeight, marginTop: 30}}>
        {columns.map(({item, color}) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              height: (item.value / top.value) * maxHeight * p,
              backgroundColor: color,
            }}
          />
        ))}
      </div>
      <div style={{display: 'flex', gap: 40, marginTop: 20}}>
        {columns.map(({item}) => (
          <Rise key={item.label} delay={60} style={{flex: 1}}>
            <div style={{fontSize: 34, fontWeight: 500}}>{item.label}</div>
            <div style={{fontSize: 52, fontWeight: 900}}>{rupiah(item.value)}</div>
          </Rise>
        ))}
      </div>
      <Host lines={episode.host.compare} duration={SCENES.compare} bg={INK} />
    </Scene>
  );
};

const Year = ({monthlyGap, episode}: {monthlyGap: number; episode: Episode}) => {
  const frame = useCurrentFrame();
  const months = Math.max(0, Math.min(12, Math.floor((frame - 14) / 12) + 1));
  return (
    <Scene bg={ACCENT} color={INK}>
      <Rise style={{fontSize: 44, fontWeight: 700}}>Selisih dalam setahun</Rise>
      <div style={{fontSize: 116, fontWeight: 900, marginTop: 8}}>{rupiah(monthlyGap * months)}</div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginTop: 44}}>
        {Array.from({length: 12}, (_, i) => (
          <div
            key={i}
            style={{
              height: 140,
              backgroundColor: i < months ? INK : 'transparent',
              border: `5px solid ${INK}`,
              color: ACCENT,
              fontSize: 44,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {i < months ? i + 1 : ''}
          </div>
        ))}
      </div>
      <Rise delay={150} style={{fontSize: 38, fontWeight: 700, marginTop: 40}}>
        12 × selisih bulanan, belum termasuk THR
      </Rise>
      <Host lines={episode.host.year} duration={SCENES.year} bg={ACCENT} />
    </Scene>
  );
};

const Savings = ({top, bottom, episode}: {top: Item; bottom: Item; episode: Episode}) => {
  const frame = useCurrentFrame();
  const longest = episode.savingsTarget / bottom.value;
  return (
    <Scene bg={INK} color={PAPER}>
      <Rise style={{fontSize: 44, fontWeight: 500}}>Waktu mengumpulkan</Rise>
      <Rise delay={8} style={{fontSize: 106, fontWeight: 900, color: ACCENT}}>
        {rupiah(episode.savingsTarget)}
      </Rise>
      <Rise delay={16} style={{fontSize: 36, fontWeight: 500, color: MUTED, marginBottom: 56}}>
        kalau seluruh UMP ditabung
      </Rise>
      {[top, bottom].map((item, i) => {
        const months = episode.savingsTarget / item.value;
        const p = progress(frame, 40 + i * 70, 80);
        return (
          <div key={item.label} style={{marginBottom: 56}}>
            <div style={{fontSize: 40, fontWeight: 500}}>{item.label}</div>
            <div style={{fontSize: 92, fontWeight: 900, lineHeight: 1.15}}>{decimal(months * p, 1)} bulan</div>
            <div
              style={{
                height: 44,
                marginTop: 12,
                width: `${(months / longest) * 100 * p}%`,
                backgroundColor: i === 0 ? ACCENT : PAPER,
              }}
            />
          </div>
        );
      })}
      <Host lines={episode.host.savings} duration={SCENES.savings} bg={INK} />
    </Scene>
  );
};

const Outro = ({episode}: {episode: Episode}) => (
  <Scene bg={PAPER} color={INK}>
    <Rise style={{fontSize: 48, fontWeight: 500, lineHeight: 1.3}}>{episode.caveat}</Rise>
    <Rise delay={30} style={{fontSize: 104, fontWeight: 900, color: ACCENT, lineHeight: 1.08, marginTop: 70}}>
      {episode.question}
    </Rise>
    <Rise delay={46} style={{fontSize: 30, fontWeight: 500, color: MUTED, marginTop: 70}}>
      {episode.source}
    </Rise>
    <Host lines={episode.host.outro} duration={SCENES.outro} bg={PAPER} />
  </Scene>
);

export const DataShort = (episode: Episode) => {
  const sorted = [...episode.items].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  let from = 0;
  const at = (duration: number) => {
    const props = {from, durationInFrames: duration};
    from += duration;
    return props;
  };

  return (
    <AbsoluteFill>
      <Sequence {...at(SCENES.hook)}>
        <Hook top={top.label} bottom={bottom.label} ratio={top.value / bottom.value} episode={episode} />
      </Sequence>
      <Sequence {...at(SCENES.ranking)}>
        <Ranking episode={episode} sorted={sorted} />
      </Sequence>
      <Sequence {...at(SCENES.compare)}>
        <Compare top={top} bottom={bottom} episode={episode} />
      </Sequence>
      <Sequence {...at(SCENES.year)}>
        <Year monthlyGap={top.value - bottom.value} episode={episode} />
      </Sequence>
      <Sequence {...at(SCENES.savings)}>
        <Savings top={top} bottom={bottom} episode={episode} />
      </Sequence>
      <Sequence {...at(SCENES.outro)}>
        <Outro episode={episode} />
      </Sequence>
    </AbsoluteFill>
  );
};
