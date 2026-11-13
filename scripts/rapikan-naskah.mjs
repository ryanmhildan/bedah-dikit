// Menulis ulang episode.json dalam format ringkas: satu shot per baris, tanpa indentasi dalam.
// Isi data tidak berubah sama sekali (dicek dengan membandingkan hasil parse), hanya spasinya.
// Format ringkas memangkas ukuran file sekitar 60%, jadi lebih hemat dibaca dan ditulis agent.
// Waktu ubah file dipertahankan supaya props.json tidak dianggap basi.
// Pemakaian: node scripts/rapikan-naskah.mjs <slug> [<slug> ...]
import {isDeepStrictEqual} from 'node:util';
import fs from 'node:fs';

const slugs = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
if (!slugs.length) throw new Error('Pemakaian: node scripts/rapikan-naskah.mjs <slug> [<slug> ...]');

const j = (nilai) => JSON.stringify(nilai);
const tanpa = (obj, kunci) => Object.fromEntries(Object.entries(obj).filter(([k]) => !kunci.includes(k)));
// Kunci dicetak di satu baris, lalu `lepas` menambahkan kunci terakhir yang isinya daftar bertingkat.
const buka = (obj, kunciDaftar) => j(tanpa(obj, [kunciDaftar])).slice(0, -1) + (Object.keys(obj).length > 1 ? ',' : '');

export const rapikan = (ep) => {
  const out = ['{'];
  const atas = tanpa(ep, ['sumber', 'adegan']);
  for (const [k, v] of Object.entries(atas)) out.push(`  ${j(k)}: ${j(v)},`);
  out.push('  "sumber": [');
  ep.sumber.forEach((s, i) => out.push(`    ${j(s)}${i < ep.sumber.length - 1 ? ',' : ''}`));
  out.push('  ],');
  out.push('  "adegan": [');
  ep.adegan.forEach((adegan, ia) => {
    out.push(`    ${buka(adegan, 'baris')}`);
    out.push('      "baris": [');
    adegan.baris.forEach((line, ib) => {
      const akhirBaris = ib < adegan.baris.length - 1 ? ',' : '';
      if (!Array.isArray(line.shot)) {
        out.push(`        ${j(line)}${akhirBaris}`);
        return;
      }
      out.push(`        ${buka(line, 'shot')}`);
      out.push('          "shot": [');
      line.shot.forEach((shot, is) => out.push(`            ${j(shot)}${is < line.shot.length - 1 ? ',' : ''}`));
      out.push(`          ]}${akhirBaris}`);
    });
    out.push(`      ]}${ia < ep.adegan.length - 1 ? ',' : ''}`);
  });
  out.push('  ]');
  out.push('}');
  return `${out.join('\n')}\n`;
};

for (const slug of slugs) {
  const file = `episodes/${slug}/episode.json`;
  const lama = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(lama);
  const baru = rapikan(data);
  if (!isDeepStrictEqual(JSON.parse(baru), data)) throw new Error(`${slug}: hasil rapikan tidak identik, file tidak diubah`);
  if (baru === lama) {
    console.log(`${slug}: sudah ringkas`);
    continue;
  }
  const {atime, mtime} = fs.statSync(file);
  fs.writeFileSync(file, baru);
  fs.utimesSync(file, atime, mtime);
  console.log(`${slug}: ${lama.length} -> ${baru.length} karakter, isi identik`);
}
