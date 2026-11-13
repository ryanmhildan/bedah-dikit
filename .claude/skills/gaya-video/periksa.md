# Lampiran render dan pemeriksaan

Lampiran `SKILL.md` untuk render dan pemeriksa kualitas. Pemeriksa kualitas juga membaca `visual.md`.

## Alat hemat baca

| Perintah | Gunanya |
|---|---|
| `node scripts/ringkas-naskah.mjs <slug>` | Teks dan ucap per baris dengan detik mulai, sekitar sepersepuluh ukuran `episode.json`. Pakai ini, bukan membaca `episode.json` utuh |
| `node scripts/ringkas-naskah.mjs <slug> --shot` | Ditambah ringkasan tiap shot: set, suasana, tokoh, properti, aksi, label, dan detik mulai sampai akhir |
| `node scripts/lint-episode.mjs <slug>` | Aturan yang bisa dihitung: panjang teks, angka di `ucap`, sumber, set, label tanpa `tetap`, angka label yang tidak ada di naskah, caption, durasi, jumlah efek dan hentak. `SALAH` wajib diperbaiki, `AWAS` dinilai |
| `node scripts/lembar-kontak.mjs <slug>` | Satu frame per shot dan satu frame tiap transisi dari `video.mp4`, disusun 8 per lembar di `out/frames/<slug>/`. Setiap sel bernomor dan berdetik |
| `... --rapat` | Tiga frame per shot (awal, tengah, akhir) |
| `... --detik 12.5,30 --kolom 1 --baris 1 --lebar 1080` | Frame penuh untuk memeriksa teks kecil atau cacat yang dicurigai |
| `... --cek` | Menyusun gambar hasil `episode.mjs --cek` |

Lint tidak menggantikan mata. Ekspresi, simbol yang ambigu, keterbacaan, dan kecocokan gambar dengan narasi tetap dinilai dari lembar kontak.

## Render

1. Render penuh dengan `node scripts/episode.mjs <slug>`, hasilnya `out/episode/<slug>/video.mp4`. Skrip ini merender per 450 frame, mengulang bagian yang gagal, lalu menyusun audio dari MP3 tanpa Chrome. Jangan kembali ke render sekali jalan: Chrome pernah berhenti diam-diam saat memori kosong sekitar 400 MB.
2. Cek exit code, stempel waktu, durasi, dan aliran audio MP4. Jika gagal di tengah, lanjutkan dengan `node scripts/episode.mjs <slug> --lanjut`, tetapi hanya jika kode belum berubah. Jangan memeriksa frame dari file lama.

## Pemeriksaan kualitas

1. Jalankan lint dan `ringkas-naskah --shot`.
2. Buat lembar kontak dari MP4 akhir. Periksa setiap sel setelah animasinya selesai, karena frame di awal shot bisa terlihat kosong walau tidak ada bug. Pakai `--rapat` untuk adegan yang meragukan, dan frame penuh lewat `--detik` untuk teks kecil.
3. Cek teks terpotong atau bertabrakan, wajah tertutup, area aman, sisa kaki, salah ketik, keterbacaan sumber, kecocokan teks layar dengan gambar, ekspresi sesuai narasi, simbol yang terbaca keliru, dan grafik yang tidak mulai dari nol.
4. Cek audio dari MP4: ada aliran audio, tanpa clipping, durasi cocok, dan tidak ada blok sunyi yang lama.
5. Laporkan apa yang belum diverifikasi, termasuk bahwa gerakan belum ditonton utuh dan audio belum didengar.
6. Hapus `out/frames/<slug>/` setelah selesai.
