import type {ReactNode} from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Fredoka';

const {fontFamily} = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const RAMAH = fontFamily;
export const KORAL = '#F4806D';
export const KREM = '#FFF6EA';

// Huruf diiris miring. kiri dan kanan: y garis iris di x=0 dan x=lebar.
export const HurufIris = ({id, lebar, tinggi, kiri, kanan, skala = 1, children}: {id: string; lebar: number; tinggi: number; kiri: number; kanan: number; skala?: number; children: ReactNode}) => {
  const celah = 5 * skala;
  return (
    <g>
      <clipPath id={`${id}a`}>
        <polygon points={`0,0 ${lebar},0 ${lebar},${kanan - celah} 0,${kiri - celah}`} />
      </clipPath>
      <clipPath id={`${id}b`}>
        <polygon points={`0,${kiri + celah} ${lebar},${kanan + celah} ${lebar},${tinggi} 0,${tinggi}`} />
      </clipPath>
      <g transform={`translate(${-7 * skala} ${-2 * skala})`}>
        <g clipPath={`url(#${id}a)`}>{children}</g>
      </g>
      <g transform={`translate(${4 * skala} ${2 * skala})`}>
        <g clipPath={`url(#${id}b)`}>{children}</g>
      </g>
    </g>
  );
};

const Kanvas = ({size, round, children}: {size: number; round?: boolean; children: ReactNode}) => (
  <svg width={size} height={size} viewBox="0 0 1024 1024" style={{borderRadius: round ? '50%' : 0, display: 'block'}}>
    <rect width={1024} height={1024} fill={KORAL} />
    <g fontFamily={RAMAH} fontWeight={700} fill={KREM}>
      {children}
    </g>
  </svg>
);

const Kapital = ({id}: {id: string}) => (
  <g fontSize={228}>
    <HurufIris id={id} lebar={1024} tinggi={1024} kiri={454} kanan={256}>
      <text x={282} y={492} textAnchor="end">B</text>
    </HurufIris>
    <text x={296} y={492}>EDAH</text>
    <text x={512} y={728} textAnchor="middle">DIKIT</text>
  </g>
);

const Kecil = ({id}: {id: string}) => (
  <g fontSize={270}>
    <HurufIris id={id} lebar={1024} tinggi={1024} kiri={413} kanan={209}>
      <text x={286} y={490} textAnchor="end">b</text>
    </HurufIris>
    <text x={314} y={490}>edah</text>
    <text x={512} y={738} textAnchor="middle">dikit</text>
  </g>
);

const HurufB = ({id}: {id: string}) => (
  <HurufIris id={id} lebar={1024} tinggi={1024} kiri={606} kanan={410} skala={2.6}>
    <text x={512} y={740} textAnchor="middle" fontSize={650}>B</text>
  </HurufIris>
);

const Hurufb = ({id}: {id: string}) => (
  <HurufIris id={id} lebar={1024} tinggi={1024} kiri={592} kanan={396} skala={2.6}>
    <text x={512} y={770} textAnchor="middle" fontSize={760}>b</text>
  </HurufIris>
);

const Persegi = ({children}: {children: ReactNode}) => (
  <AbsoluteFill>
    <Kanvas size={1024}>{children}</Kanvas>
  </AbsoluteFill>
);

export const LogoAvatar = () => <Persegi><Kapital id="kapital" /></Persegi>;
export const LogoAvatarKecil = () => <Persegi><Kecil id="kecil" /></Persegi>;
export const LogoB = () => <Persegi><HurufB id="hurufB" /></Persegi>;
export const Logob = () => <Persegi><Hurufb id="hurufb" /></Persegi>;

export const LogoTeks = () => (
  <AbsoluteFill style={{backgroundColor: KORAL}}>
    <svg width={1600} height={480} viewBox="0 0 1600 480">
      <g fontFamily={RAMAH} fontWeight={700} fill={KREM} fontSize={208}>
        <HurufIris id="teks" lebar={1600} tinggi={480} kiri={287} kanan={-15}>
          <text x={316} y={312} textAnchor="end">B</text>
        </HurufIris>
        <text x={329} y={312}>EDAH DIKIT</text>
      </g>
    </svg>
  </AbsoluteFill>
);

export const LogoTeksKecil = () => (
  <AbsoluteFill style={{backgroundColor: KORAL}}>
    <svg width={1600} height={480} viewBox="0 0 1600 480">
      <g fontFamily={RAMAH} fontWeight={700} fill={KREM} fontSize={236}>
        <HurufIris id="tekskecil" lebar={1600} tinggi={480} kiri={302} kanan={-18}>
          <text x={334} y={322} textAnchor="end">b</text>
        </HurufIris>
        <text x={362} y={322}>edah dikit</text>
      </g>
    </svg>
  </AbsoluteFill>
);

export const LogoTes = () => (
  <AbsoluteFill style={{justifyContent: 'space-evenly', backgroundColor: '#F1F1F1'}}>
    {[Kapital, Kecil, HurufB, Hurufb].map((Isi, baris) => (
      <div key={baris} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-evenly'}}>
        {[190, 110, 64, 44].map((size) => (
          <Kanvas key={size} size={size} round>
            <Isi id={`t${baris}${size}`} />
          </Kanvas>
        ))}
      </div>
    ))}
  </AbsoluteFill>
);
