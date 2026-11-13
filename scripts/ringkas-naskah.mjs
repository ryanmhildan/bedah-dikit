// Ringkasan naskah episode yang hemat dibaca, sebagai pengganti membaca episode.json utuh.
// Pemakaian: node scripts/ringkas-naskah.mjs <slug> [--shot]
//   tanpa flag  judul, sumber, dan per baris: teks layar dan ucap (ucap hanya jika berbeda)
//   --shot      ditambah ringkasan tiap shot: set, suasana, transisi, tokoh, properti, aksi, label, balon
// Jika props.json masih baru, setiap baris dan shot diberi detik mulai di video.
import {daftarShot, detik, muatEpisode, muatProps} from './naskah-util.mjs';

const slug = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
if (!slug) throw new Error('Pemakaian: node scripts/ringkas-naskah.mjs <slug> [--shot]');
const denganShot = process.argv.includes('--shot');

const ep = muatEpisode(slug);
const {props, alasan} = muatProps(slug);
const waktuShot = new Map((props ? daftarShot(props) : []).map((s) => [`${s.baris}#${s.ke}`, s]));
const waktuBaris = new Map();
for (const adegan of props?.adegan ?? []) for (const line of adegan.baris) waktuBaris.set(line.id, adegan.start + line.start);

const keluar = [];
keluar.push(`# ${ep.judul}`);
keluar.push(`tokoh: ${ep.tokoh} | musik: ${ep.musik === false ? 'mati' : 'ikut data/efek-suara.json'} | ${props ? `durasi ${detik(props.total)} detik, ${props.efek.length} efek` : alasan}`);
keluar.push(`sumber: ${(ep.sumber ?? []).map((s) => `${s.nama} <${s.url}>`).join(' ; ')}`);

const ringkasShot = (shot) => {
  const bagian = [shot.set + (shot.varian ? `/${shot.varian}` : '')];
  const suasana = typeof shot.suasana === 'string' ? shot.suasana : shot.suasana ? `${shot.suasana.dari}>${shot.suasana.ke}` : '';
  if (suasana) bagian.push(suasana);
  if (shot.masuk) bagian.push(`masuk:${shot.masuk}${shot.cair ? `(${shot.cair})` : ''}`);
  if (shot.tokoh) {
    const t = shot.tokoh;
    const gestur = (t.gestur ?? []).map((g) => g.pose).join('>');
    const ekspresi = (t.ekspresi ?? []).map((e) => Object.keys(e).filter((k) => k !== 'mulai').join('+')).join(',');
    const mulut = (t.mulut ?? []).map((m) => m.bentuk).join('>');
    const mata = (t.mata ?? []).map((m) => m.bentuk).join('>');
    bagian.push(`tokoh:${t.variant ?? ''}${t.pose}${gestur ? `>${gestur}` : ''}${t.pegang ? ` pegang ${t.pegang.nama}` : ''}${mata ? ` mata ${mata}` : ''}${mulut ? ` mulut ${mulut}` : ''}${ekspresi ? ` ekspresi ${ekspresi}` : ''}${t.bicara ? ' bicara' : ''}`);
  }
  const properti = (shot.properti ?? []).map((p) => p.nama + (p.teks ? `"${p.teks}"` : ''));
  if (properti.length) bagian.push(`properti:${properti.join(',')}`);
  const aksi = (shot.aksi ?? []).map((a) => {
    const teks = a.teks ? `"${a.teks}"` : '';
    const nama = a.nama ? `(${a.nama})` : '';
    const waktu = a.selesai ? ' selesai' : typeof a.mulai === 'number' ? `@${a.mulai}` : typeof a.muncul === 'number' ? `@${a.muncul}` : '';
    return `${a.aksi}${nama}${teks}${waktu}${a.sejak ? ' sejak' : ''}`;
  });
  if (aksi.length) bagian.push(`aksi:${aksi.join(',')}`);
  if (shot.balon) bagian.push(`balon:"${shot.balon.teks}"`);
  if (shot.sumber) bagian.push('sumber');
  return bagian.join(' | ');
};

for (const adegan of ep.adegan) {
  keluar.push('');
  keluar.push(`## ${adegan.id} (${adegan.jenis})`);
  for (const line of adegan.baris) {
    const t = waktuBaris.has(line.id) ? `[${detik(waktuBaris.get(line.id))}s] ` : '';
    keluar.push(`- ${t}${line.id}: ${line.teks}`);
    if (line.ucap && line.ucap !== line.teks) keluar.push(`  ucap: ${line.ucap}`);
    if (line.pose) keluar.push(`  pose: ${line.pose}`);
    if (denganShot) {
      (line.shot ?? []).forEach((shot, k) => {
        const w = waktuShot.get(`${line.id}#${k + 1}`);
        keluar.push(`  shot ${k + 1}${w ? ` [${detik(w.mulai)}-${detik(w.akhir)}s]` : ''}: ${ringkasShot(shot)}`);
      });
    }
  }
}

console.log(keluar.join('\n'));
