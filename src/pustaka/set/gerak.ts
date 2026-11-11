import {Easing, interpolate} from 'remotion';
import {KURVA_GESTUR} from '../tokoh-rig';

// Resep gerak bersama dari studi referensi. Semua dihitung per frame dari frame lokal.

// Pop objek 8 frame, lalu 1,00.
export const POP_SKALA = [0, 0.22, 0.41, 0.52, 0.78, 0.89, 1.04, 1.07];
export const LAMA_POP = POP_SKALA.length;
export const popSkala = (t: number) => (t < 0 ? 0 : t < POP_SKALA.length ? POP_SKALA[t] : 1);

// Gestur: melesat sekitar 5 frame, lalu melambat. Sama dengan kurva lengan rig.
export const LAMA_LESAT = KURVA_GESTUR.length;
export const lesat = (t: number) => (t <= 0 ? 0 : t >= KURVA_GESTUR.length ? 1 : KURVA_GESTUR[Math.floor(t)]);

// Berangkat pelan lalu cepat, untuk benda yang pergi dari bingkai.
export const pergi = (t: number, lama: number) => interpolate(t, [0, lama], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});

// Mulus di dua ujung, untuk isi yang naik atau suasana yang bergeser.
export const mulus = (frame: number, mulai: number, lama: number) =>
  interpolate(frame, [mulai, mulai + lama], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});

export const campur = (a: number, b: number, t: number) => a + (b - a) * t;
export const campurTitik = (a: {x: number; y: number}, b: {x: number; y: number}, t: number) => ({x: campur(a.x, b.x, t), y: campur(a.y, b.y, t)});
