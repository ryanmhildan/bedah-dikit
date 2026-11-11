import {useLayoutEffect, useMemo, useRef} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import * as THREE from 'three';
import episode from '../data/ump-2026.json';
import host from '../data/contoh-3d.json';
import provinces from '../data/indonesia-provinces.json';
import {ACCENT, Host, INK, PAPER, Rise, Scene, progress, rupiah, type HostLine} from './DataShort';

const STACKS_FRAMES = 330;
const MAP_FRAMES = 390;
export const CONTOH_FRAMES = STACKS_FRAMES + MAP_FRAMES;

const BILL_VALUE = 100000;
const BILL_THICKNESS = 0.008;
const SKY = '#0F1E22';
const GREY = '#4A4F4E';

const ease = (frame: number, range: [number, number]) =>
  interpolate(frame, range, [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

const mix = (a: number[], b: number[], t: number) => a.map((value, i) => value + (b[i] - value) * t);

const Camera = ({position, target}: {position: number[]; target: number[]}) => {
  const {camera} = useThree();
  useLayoutEffect(() => {
    camera.position.set(position[0], position[1], position[2]);
    camera.lookAt(target[0], target[1], target[2]);
  }, [camera, position, target]);
  return null;
};

const Fade = ({duration}: {duration: number}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12, duration - 12, duration], [1, 0, 0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{backgroundColor: INK, opacity}} />;
};

// Satu tumpukan = satu InstancedMesh; tiap 100 lembar diberi pita agar mudah dihitung.
const Stack = ({bills, x, color, band, p, seed}: {bills: number; x: number; color: string; band: string; p: number; seed: string}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current!;
    const matrix = new THREE.Matrix4();
    const rotation = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const base = new THREE.Color(color);
    const strap = new THREE.Color(band);
    for (let i = 0; i < bills; i++) {
      rotation.setFromAxisAngle(up, (random(`${seed}r${i}`) - 0.5) * 0.05);
      matrix.compose(
        new THREE.Vector3(
          x + (random(`${seed}x${i}`) - 0.5) * 0.06,
          (i + 0.5) * BILL_THICKNESS,
          (random(`${seed}z${i}`) - 0.5) * 0.06,
        ),
        rotation,
        new THREE.Vector3(1, 1, 1),
      );
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, i % 100 < 4 ? strap : base);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [band, bills, color, seed, x]);
  useLayoutEffect(() => {
    ref.current!.count = Math.max(1, Math.round(bills * p));
  }, [bills, p]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, bills]} castShadow frustumCulled={false}>
      <boxGeometry args={[3, BILL_THICKNESS, 1.4]} />
      <meshStandardMaterial roughness={0.7} />
    </instancedMesh>
  );
};

const StacksScene = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const items = [...episode.items].sort((a, b) => b.value - a.value);
  const top = items[0];
  const bottom = items[items.length - 1];
  const bills = [top, bottom].map((item) => Math.round((item.value * 12) / BILL_VALUE));
  const p = progress(frame, 30, 170);
  const angle = interpolate(frame, [0, STACKS_FRAMES], [0.15, 0.75]);
  const radius = interpolate(frame, [0, STACKS_FRAMES], [29, 26]);
  const position = [Math.sin(angle) * radius, 6.5, Math.cos(angle) * radius];
  return (
    <AbsoluteFill style={{backgroundColor: SKY}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 35, near: 0.1, far: 200}}>
        <color attach="background" args={[SKY]} />
        <Camera position={position} target={[0, 1.3, 0]} />
        <ambientLight intensity={1.1} />
        <directionalLight
          position={[8, 14, 6]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[40, 64]} />
          <meshStandardMaterial color="#1B3136" />
        </mesh>
        <Stack bills={bills[0]} x={-2.1} color={ACCENT} band={PAPER} p={p} seed="a" />
        <Stack bills={bills[1]} x={2.1} color={PAPER} band={INK} p={p} seed="b" />
      </ThreeCanvas>
      <Scene bg="transparent" color={PAPER}>
        <Rise style={{fontSize: 40, fontWeight: 500}}>Gaji minimum setahun, dalam lembar Rp100.000</Rise>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 16}}>
          {[top, bottom].map((item, i) => (
            <Rise key={item.label} delay={12}>
              <div style={{fontSize: 34, fontWeight: 500}}>{item.label}</div>
              <div style={{fontSize: 72, fontWeight: 900, color: i === 0 ? ACCENT : PAPER}}>
                ±{Math.round(bills[i] * p)}
              </div>
            </Rise>
          ))}
        </div>
        <Host lines={host.stacks as HostLine[]} duration={STACKS_FRAMES} bg={INK} />
      </Scene>
      <Fade duration={STACKS_FRAMES} />
    </AbsoluteFill>
  );
};

const JAKARTA = [106.85, -6.2];
const MAX_HEIGHT = 1.8;

type Province = {name: string; value: number | null; rings: number[][][]};

const Province3D = ({province, max, min}: {province: Province; max: number; min: number}) => {
  const frame = useCurrentFrame();
  const geometry = useMemo(() => {
    const shapes = province.rings.map(
      (ring) => new THREE.Shape(ring.map(([lon, lat]) => new THREE.Vector2(lon - 118, lat + 2))),
    );
    return new THREE.ExtrudeGeometry(shapes, {depth: 1, bevelEnabled: false});
  }, [province]);
  const [lon, lat] = province.rings[0][0];
  const start = 16 + Math.hypot(lon - JAKARTA[0], lat - JAKARTA[1]) * 5;
  const p = progress(frame, start, 45);
  const value = province.value;
  const height = value === null ? 0.1 : (value / max) * MAX_HEIGHT;
  const color = useMemo(() => {
    if (value === null) return new THREE.Color(GREY);
    return new THREE.Color(PAPER).lerp(new THREE.Color(ACCENT), Math.pow((value - min) / (max - min), 0.45));
  }, [max, min, value]);
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, Math.max(0.02, height * p)]} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
};

const MapScene = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const list = provinces as Province[];
  const values = list.flatMap((province) => (province.value === null ? [] : [province.value]));
  const max = Math.max(...values);
  const min = Math.min(...values);
  const t = ease(frame, [190, 350]);
  const position = mix([-12.4, 5.2, 12.2], [-48, 36, 16], t);
  const target = mix([-11, 0.8, 4.1], [-8, 0, 3.4], t);
  return (
    <AbsoluteFill style={{backgroundColor: SKY}}>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 35, near: 0.1, far: 300}}>
        <color attach="background" args={[SKY]} />
        <fog attach="fog" args={[SKY, 40, 110]} />
        <Camera position={position} target={target} />
        <ambientLight intensity={1.2} />
        <directionalLight
          position={[-14, 22, 12]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-34}
          shadow-camera-right={34}
          shadow-camera-top={24}
          shadow-camera-bottom={-24}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color="#1B3136" />
        </mesh>
        {list.map((province) => (
          <Province3D key={province.name} province={province} max={max} min={min} />
        ))}
      </ThreeCanvas>
      <AbsoluteFill
        style={{
          background: `linear-gradient(${SKY} 0, ${SKY} 400px, transparent 500px, transparent 1120px, ${SKY} 1220px)`,
        }}
      />
      <Scene bg="transparent" color={PAPER}>
        <Rise style={{fontSize: 62, fontWeight: 900}}>UMP 2026 per provinsi</Rise>
        <Rise delay={8} style={{fontSize: 34, fontWeight: 500, marginTop: 6}}>
          DKI Jakarta {rupiah(max)} · Jawa Barat {rupiah(min)}
        </Rise>
        <Rise delay={200} style={{fontSize: 27, fontWeight: 500, color: '#B8B1A4', marginTop: 14, lineHeight: 1.25}}>
          Abu-abu: angka belum pasti atau batas wilayah sudah berubah. Peta: Natural Earth.
        </Rise>
        <Host lines={host.map as HostLine[]} duration={MAP_FRAMES} bg={INK} />
      </Scene>
      <Fade duration={MAP_FRAMES} />
    </AbsoluteFill>
  );
};

export const Contoh3D = () => (
  <AbsoluteFill style={{backgroundColor: INK}}>
    <Sequence durationInFrames={STACKS_FRAMES}>
      <StacksScene />
    </Sequence>
    <Sequence from={STACKS_FRAMES} durationInFrames={MAP_FRAMES}>
      <MapScene />
    </Sequence>
  </AbsoluteFill>
);

