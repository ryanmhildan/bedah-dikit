---
name: gaya-video
description: Standar gaya wajib untuk setiap video motion-shorts. Gunakan setiap kali membuat, merevisi, atau merender video vertikal baru di project ini, termasuk saat mengganti topik, data, adegan, atau karakter.
---

# Gaya Video motion-shorts

Nama channel: **Bedah Dikit** (`@bedahdikit`), channel umum yang menjelaskan kenapa sesuatu terjadi. Topik tidak terbatas pada uang atau angka. Logo ada di `src/Logo.tsx`: tulisan kapital BEDAH DIKIT krem di atas koral, dengan huruf B teriris miring. Font logo Fredoka. Foto profil pilihan user: tulisan dua baris huruf kecil, `out/logo/bedah-dikit-avatar-huruf-kecil.png`. Teks profil ada di `profil-channel.md`.

Semua video harus punya tone dan gaya yang sama. Acuan hidupnya adalah sistem episode di `src/Episode.tsx` dan `src/pustaka/dunia.tsx`. `src/Sinematik.tsx` hanya dipakai video UMP lama. Referensi gaya user adalah channel YouTube Kok Bisa?, tetapi aset dan karakter harus tetap orisinal.

Alur otomatis episode baru ada di skill `episode-baru`.

**Acuan tetap (keputusan user 2026-11-12):** `episodes/kebanyakan-kafein` versi final (`out/episode/kebanyakan-kafein/video.mp4`) adalah standar editan untuk **semua episode berikutnya**. Pertahankan: set dan properti spesifik topik untuk setiap ide, sekitar 3 detik per shot, tokoh yang memegang atau terkena properti, angka yang menempel pada benda, suasana yang berganti per ide, transisi `kartu`, `sapu`, `cair`, dan potong langsung, suara ElevenLabs Raka, tanpa musik latar, serta efek yang dibangkitkan dari aksi. Episode baru dibuat dengan menulis `shot` di `episode.json` dan memakai ulang pustaka set. Tambahkan set, properti, atau aksi baru ke pustaka jika topiknya membutuhkan.

Status: 2026-11-11 user menolak latar template (kota, gunung, hutan yang bergulir di belakang) dan menyetujui arah **set spesifik topik** lewat klip uji `out/uji-set/uji-set.mp4`. Episode baru wajib memakai set dan properti yang menggambarkan topik. Lima latar luar ruang di `src/pustaka/dunia.tsx` hanya dipakai jika topiknya memang terjadi di luar ruang, misalnya gempa atau langit.

## Lampiran sesuai peran

File ini adalah inti yang berlaku untuk semua orang. Detail ada di lampiran dalam folder yang sama. Baca lampiran yang sesuai peranmu. Jika ragu, baca semuanya.

| Peran | Baca juga |
|---|---|
| Animator, analis gaya, dan siapa pun yang mengubah atau menilai gambar | `visual.md` |
| Penulis naskah dan pemeriksa naskah | `naskah.md`, ditambah `contoh-naskah.md` untuk penulis |
| Penata suara, dan siapa pun yang menyentuh musik atau efek | `audio.md` |
| Render dan pemeriksa kualitas | `periksa.md`, ditambah `visual.md` untuk pemeriksa kualitas |

Alat hemat baca (lihat `periksa.md`): `node scripts/ringkas-naskah.mjs <slug> [--shot]`, `node scripts/lint-episode.mjs <slug>`, dan `node scripts/lembar-kontak.mjs <slug>`.

## Sumber kebenaran

| Hal | File |
|---|---|
| Warna | `src/tema.ts`, jangan menulis warna baru di adegan |
| Karakter | Rig episode di `src/pustaka/tokoh-rig.tsx`, disetujui user dan jangan diubah rasa geraknya. Warna tokoh di `LOOKS` pada `src/Tokoh.tsx`. Tokoh diatur oleh `tokoh` di `episodes/<slug>/episode.json` |
| Suara | `data/suara.json`, suara mengikuti tokoh (Raka memakai ElevenLabs) |
| Adegan acuan | `src/Episode.tsx` |
| Set topik, aksi, properti, suasana | `src/pustaka/set/`, `src/pustaka/properti.tsx`, `SUASANA` di `src/tema.ts`. Daftar lengkap dan aturannya ada di `visual.md` |
| Latar luar ruang dan ikon | `src/pustaka/dunia.tsx`, `src/pustaka/ikon.tsx` |
| Naskah episode | `episodes/<slug>/episode.json` |
| Musik dan efek | `data/efek-suara.json`, `scripts/audio-latar.mjs`. Lihat `audio.md` |

Tokoh utama saat ini: **Raka** (`"tokoh": "raka"`). Jangan menggantinya kecuali user meminta.

## Format

- 1080×1920, 30 fps, H.264.
- Area aman konten: y 230 sampai 1500, x 80 sampai 950.
- Teks narasi di bawah, putih di atas kotak hitam, satu kalimat per bagian.
- Font Archivo. Angka dan judul tebal, label sedang.
- Satu ide per shot. Teks di layar sedikit, karena narasi membawa ceritanya.

## Karakter

- Tinggi sekitar 2,7 kepala, kepala lebar, tubuh kecil dan ramping.
- Warna datar tanpa garis tepi, dengan bayangan lembut seperlunya.
- Mata titik yang rendah dan berjauhan, mulut kecil, tanpa alis, hidung, dan pipi merah. Untuk reaksi, mata boleh berganti ke bentuk lain yang orisinal, misalnya lengkung. Jangan memakai mata spiral khas Kok Bisa?.
- Tokoh bernapas, berkedip, dan menoleh. Mulut bergerak hanya saat tokoh benar-benar bicara di layar. Wajah tidak boleh tertutup teks narasi, jadi kepala harus berakhir di atas y 1330 kecuali pada close-up besar.
- Ekspresi harus cocok dengan narasi; senyum hanya di bagian yang memang menyenangkan.

## Dilarang

- Garis tepi tebal, kartu bergaya stiker, dan warna penuh yang ramai. Balon ucapan hanya boleh putih polos, seperti di adegan pembuka. User menolak gaya ini karena kekanak-kanakan dan kaku.
- Latar template yang sama di setiap video, seperti kota, gunung, dan hutan yang bergulir di belakang dengan ikon melayang. User menolaknya 2026-11-11.
- Karakter kalkulator Kalku dan ilustrasi di `src/Illustrated.tsx`, `src/Kalku.tsx`, serta `src/Scene3D.tsx`. Itu arsip gaya yang ditolak.
- Menyalin karakter, logo, atau aset Kok Bisa?, termasuk tokoh berambut hitam runcing berkaos teal dan bola bendera mereka.

## Data

- Angka harus dari sumber nyata, dicek dengan minimal dua sumber, dan sumbernya tampil di video.
- Jika sumber berbeda, jangan pakai angkanya atau tandai sebagai belum pasti.
- Rasio, selisih, dan jumlah dihitung di kode, bukan diketik manual.
- Grafik harus proporsional dan mulai dari nol.
- Jangan tampilkan jumlah peserta per kelompok kalau sumber tidak menyebutnya.
- Peta episode menggambar seluruh daratan dengan satu warna dari Natural Earth. Data 33 provinsi tidak boleh dipakai untuk menampilkan batas atau data per provinsi yang sudah berubah.

Upload ke platform apa pun harus mendapat persetujuan user.
