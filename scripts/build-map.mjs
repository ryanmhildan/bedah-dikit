// Membuat data/indonesia-provinces.json dari GeoJSON admin-1 Natural Earth (domain publik).
// Pemakaian: node scripts/build-map.mjs <path ne_10m_admin_1_states_provinces.geojson>
import fs from 'node:fs';

// UMP 2026 yang sama di rekap Pajakku dan Dealls. Provinsi yang tidak ada di sini
// tampil abu-abu: angkanya berbeda antar sumber, belum pasti, atau batasnya sudah berubah.
const UMP = {
  'Sumatera Barat': 3182955,
  Riau: 3780495,
  Jambi: 3471497,
  'Sumatera Selatan': 3942963,
  Bengkulu: 2827250,
  Lampung: 3047734,
  'Bangka-Belitung': 4035000,
  'Kepulauan Riau': 3879520,
  'Jakarta Raya': 5729876,
  'Jawa Barat': 2317601,
  'Jawa Tengah': 2327386,
  Yogyakarta: 2417495,
  'Jawa Timur': 2446880,
  Banten: 3100881,
  Bali: 3207459,
  'Nusa Tenggara Barat': 2673861,
  'Nusa Tenggara Timur': 2455898,
  'Kalimantan Barat': 3054552,
  'Kalimantan Tengah': 3686138,
  'Kalimantan Selatan': 3725000,
  'Sulawesi Utara': 4002630,
  'Sulawesi Tengah': 3179565,
  'Sulawesi Selatan': 3921088,
  'Sulawesi Tenggara': 3306496,
  Gorontalo: 3405144,
  'Sulawesi Barat': 3315934,
  Maluku: 3334490,
};

const area = (ring) =>
  Math.abs(ring.reduce((sum, [x, y], i) => {
    const [nx, ny] = ring[(i + 1) % ring.length];
    return sum + x * ny - nx * y;
  }, 0)) / 2;

const simplify = (points, tolerance) => {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const length = Math.hypot(bx - ax, by - ay) || 1;
  let worst = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const distance = Math.abs((bx - ax) * (ay - y) - (ax - x) * (by - ay)) / length;
    if (distance > worst) {
      worst = distance;
      index = i;
    }
  }
  if (worst <= tolerance) return [points[0], points[points.length - 1]];
  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ];
};

const source = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const provinces = source.features
  .filter((feature) => feature.properties.adm0_a3 === 'IDN')
  .map(({properties, geometry}) => {
    const name = properties.name;
    const small = name === 'Jakarta Raya';
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    const rings = polygons
      .map((polygon) => polygon[0])
      .filter((ring) => small || area(ring) > 0.01)
      .map((ring) => {
        // Pecah cincin jadi dua agar titik awal dan akhir yang sama tidak mengacaukan simplifikasi.
        const half = Math.floor(ring.length / 2);
        const tolerance = small ? 0.002 : 0.012;
        return [
          ...simplify(ring.slice(0, half + 1), tolerance).slice(0, -1),
          ...simplify(ring.slice(half), tolerance).slice(0, -1),
        ].map(([x, y]) => [Number(x.toFixed(3)), Number(y.toFixed(3))]);
      })
      .filter((ring) => ring.length >= 3);
    return {name, value: UMP[name] ?? null, rings};
  });

fs.writeFileSync('data/indonesia-provinces.json', JSON.stringify(provinces));
const unmatched = Object.keys(UMP).filter((name) => !provinces.some((p) => p.name === name));
console.log(`${provinces.length} provinsi, tak cocok: ${unmatched.join(', ') || '-'}`);
console.log(`Abu-abu: ${provinces.filter((p) => p.value === null).map((p) => p.name).join(', ')}`);
