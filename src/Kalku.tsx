import {useCurrentFrame} from 'remotion';

export type Mood = 'happy' | 'shock' | 'think' | 'wink' | 'wave';

const BODY = '#19C2B0';
const SCREEN = '#E4F5DC';
const INK = '#14120F';
const ACCENT = '#FF4B1F';

const Mouth = ({mood, open}: {mood: Mood; open: number}) => {
  if (open > 0) return <ellipse cx={120} cy={103} rx={13} ry={open} fill={INK} />;
  if (mood === 'shock') return <ellipse cx={120} cy={104} rx={10} ry={12} fill={INK} />;
  if (mood === 'think') return <path d="M106 105 L134 101" stroke={INK} strokeWidth={6} strokeLinecap="round" />;
  if (mood === 'wink') return <path d="M104 100 Q124 118 138 96" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />;
  return <path d="M102 98 Q120 118 138 98" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />;
};

// Maskot channel: kalkulator berjalan, ekspresinya tampil di layar.
export const Kalku = ({
  size,
  mood,
  talking,
  limb,
}: {
  size: number;
  mood: Mood;
  talking: boolean;
  limb: string;
}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 9) * 5;
  const blink = frame % 96 < 4;
  const open = talking ? 4 + Math.abs(Math.sin(frame / 2.6)) * 9 : 0;
  const eyeRadius = mood === 'shock' ? 12 : 9;
  const eyeY = mood === 'think' ? 70 : 76;
  const rightArm =
    mood === 'wave' ? -135 + Math.sin(frame / 4) * 22 : talking ? -40 + Math.sin(frame / 7) * 12 : -14;
  const leftArm = mood === 'shock' ? 125 : 16;

  return (
    <svg width={size} height={size} viewBox="-40 0 320 320" style={{overflow: 'visible'}}>
      <g stroke={limb} strokeWidth={10} strokeLinecap="round">
        <line x1={90} y1={240} x2={90} y2={294} />
        <line x1={150} y1={240} x2={150} y2={294} />
      </g>
      <ellipse cx={84} cy={298} rx={22} ry={10} fill={limb} />
      <ellipse cx={156} cy={298} rx={22} ry={10} fill={limb} />
      <g transform={`translate(0 ${bob})`}>
        <g transform={`rotate(${leftArm} 40 135)`}>
          <line x1={40} y1={135} x2={40} y2={205} stroke={limb} strokeWidth={10} strokeLinecap="round" />
          <circle cx={40} cy={212} r={13} fill={limb} />
        </g>
        <g transform={`rotate(${rightArm} 200 135)`}>
          <line x1={200} y1={135} x2={200} y2={205} stroke={limb} strokeWidth={10} strokeLinecap="round" />
          <circle cx={200} cy={212} r={13} fill={limb} />
        </g>
        <rect x={40} y={20} width={160} height={222} rx={28} fill={BODY} stroke={INK} strokeWidth={7} />
        <rect x={58} y={40} width={124} height={86} rx={12} fill={SCREEN} stroke={INK} strokeWidth={6} />
        {blink ? (
          <path d="M84 76 H106 M134 76 H156" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        ) : (
          <>
            <ellipse cx={95} cy={eyeY} rx={eyeRadius} ry={eyeRadius} fill={INK} />
            {mood === 'wink' ? (
              <path d="M134 76 H156" stroke={INK} strokeWidth={6} strokeLinecap="round" />
            ) : (
              <ellipse cx={145} cy={eyeY} rx={eyeRadius} ry={eyeRadius} fill={INK} />
            )}
          </>
        )}
        <Mouth mood={mood} open={open} />
        {[0, 1, 2].flatMap((col) =>
          [0, 1].map((row) => (
            <rect
              key={`${col}-${row}`}
              x={62 + col * 42}
              y={146 + row * 42}
              width={32}
              height={30}
              rx={7}
              fill={col === 2 && row === 1 ? ACCENT : INK}
            />
          )),
        )}
      </g>
    </svg>
  );
};
