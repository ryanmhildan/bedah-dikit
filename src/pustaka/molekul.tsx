import {MIKRO, MOLEKUL, WHITE} from '../tema';

// Molekul yang dipakai lintas set: di celah reseptor (mikro), di dalam gelas, atau melayang.
// Semua digambar dengan titik asal di pusat kepala molekul.

// Kapsaisin: kepala bulat lonjong merah dengan ekor rantai tiga butir yang mengecil.
// Bentuknya sengaja beda dari segi enam kafein dan bola adenosin. `kaki` menambah colokan di bawah kepala,
// supaya molekul bisa menancap ke soket reseptor.
export const R_KAPSAISIN = 40;

export const Kapsaisin = ({x, y, skala = 1, putar = 0, opacity = 1, kaki = false, goyang = 0}: {x: number; y: number; skala?: number; putar?: number; opacity?: number; kaki?: boolean; goyang?: number}) => {
  const r = R_KAPSAISIN;
  // Ekor naik dari atas kepala dan bergoyang pelan. `goyang` sudut tambahan dari frame pemanggil.
  const butir = [0, 1, 2].map((i) => {
    const jarak = r + 18 + i * 30;
    const sudut = ((-90 + Math.sin((goyang + i * 40) / 30) * 14 + (i - 1) * 10) * Math.PI) / 180;
    return {x: Math.cos(sudut) * jarak + (i % 2 ? 10 : -10), y: Math.sin(sudut) * jarak, r: 17 - i * 4};
  });
  return (
    <g transform={`translate(${x} ${y}) rotate(${putar}) scale(${skala})`} opacity={opacity}>
      {kaki && (
        <g fill={MIKRO.kaki}>
          {[-1, 1].map((s) => (
            <rect key={s} x={s * 20 - 7} y={r * 0.8 - 8} width={14} height={40} rx={7} />
          ))}
        </g>
      )}
      {/* Rantai ekor: batang penghubung lalu butir. */}
      <path d={`M0 ${-r * 0.6} ${butir.map((b) => `L${b.x.toFixed(1)} ${b.y.toFixed(1)}`).join(' ')}`} stroke={MOLEKUL.kapsaisinEkor} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {butir.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={MOLEKUL.kapsaisinEkor} />
      ))}
      <ellipse rx={r * 1.15} ry={r * 0.88} fill={MOLEKUL.kapsaisin} />
      <ellipse cx={8} cy={8} rx={r * 0.62} ry={r * 0.45} fill={MOLEKUL.kapsaisinDalam} opacity={0.55} />
      <circle cx={-r * 0.5} cy={-r * 0.35} r={8} fill={WHITE} opacity={0.55} />
    </g>
  );
};

// Kasein: gumpalan putih dari beberapa bulatan, seperti butir protein susu.
export const Kasein = ({x, y, skala = 1, putar = 0, opacity = 1}: {x: number; y: number; skala?: number; putar?: number; opacity?: number}) => (
  <g transform={`translate(${x} ${y}) rotate(${putar}) scale(${skala})`} opacity={opacity}>
    {[
      [0, 0, 44],
      [-46, 14, 30],
      [44, 16, 32],
      [-20, -38, 28],
      [28, -34, 26],
    ].map(([cx, cy, r], i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill={MOLEKUL.kasein} />
    ))}
    <ellipse cx={10} cy={26} rx={58} ry={18} fill={MOLEKUL.kaseinBayang} opacity={0.6} />
    <circle cx={-16} cy={-14} r={10} fill={WHITE} />
  </g>
);
