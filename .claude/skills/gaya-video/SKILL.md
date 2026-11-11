---
name: gaya-video
description: Standar gaya wajib untuk setiap video motion-shorts. Gunakan setiap kali membuat, merevisi, atau merender video vertikal baru di project ini, termasuk saat mengganti topik, data, adegan, atau karakter.
---

# Gaya Video motion-shorts

Nama channel: **Bedah Dikit** (`@bedahdikit`), channel umum yang menjelaskan kenapa sesuatu terjadi. Topik tidak terbatas pada uang atau angka. Logo ada di `src/Logo.tsx`: tulisan kapital BEDAH DIKIT krem di atas koral, dengan huruf B teriris miring. Font logo Fredoka. Foto profil pilihan user: tulisan dua baris huruf kecil, `out/logo/bedah-dikit-avatar-huruf-kecil.png`. Teks profil ada di `profil-channel.md`.

Semua video harus punya tone dan gaya yang sama. Acuan hidupnya adalah sistem episode di `src/Episode.tsx` dan `src/pustaka/dunia.tsx`. `src/Sinematik.tsx` hanya dipakai video UMP lama. Referensi gaya user adalah channel YouTube Kok Bisa?, tetapi aset dan karakter harus tetap orisinal.

**Acuan tetap (keputusan user 2026-11-12):** `episodes/kebanyakan-kafein` versi final (`out/episode/kebanyakan-kafein/video.mp4`) adalah standar editan untuk **semua episode berikutnya**. Pertahankan: set dan properti spesifik topik untuk setiap ide, sekitar 3 detik per shot, tokoh yang memegang atau terkena properti, angka yang menempel pada benda, suasana yang berganti per ide, transisi `kartu`, `sapu`, `cair`, dan potong langsung, suara ElevenLabs Raka, musik Pizzicato Flow di bawah narasi, serta efek yang dibangkitkan dari aksi. Episode baru dibuat dengan menulis `shot` di `episode.json` dan memakai ulang pustaka set. Tambahkan set, properti, atau aksi baru ke pustaka jika topiknya membutuhkan.

Status: 2026-11-11 user menolak latar template (kota, gunung, hutan yang bergulir di belakang) dan menyetujui arah **set spesifik topik** lewat klip uji `out/uji-set/uji-set.mp4`. Episode baru wajib memakai set dan properti yang menggambarkan topik. Lima latar luar ruang di `src/pustaka/dunia.tsx` hanya dipakai jika topiknya memang terjadi di luar ruang, misalnya gempa atau langit.

## Sumber kebenaran

| Hal | File |
|---|---|
| Warna | `src/tema.ts`, jangan menulis warna baru di adegan |
| Karakter | Rig episode di `src/pustaka/tokoh-rig.tsx`, disetujui user dan jangan diubah rasa geraknya. Warna tokoh di `LOOKS` pada `src/Tokoh.tsx`. Tokoh diatur oleh `tokoh` di `episodes/<slug>/episode.json` |
| Suara | `data/suara.json`, suara mengikuti jenis kelamin tokoh |
| Adegan acuan | `src/Episode.tsx` |
| Set topik | `src/pustaka/set/`: `ruang` (gradasi, sorot, vinyet, bokeh), `meja` (tampak atas dan samping), `interior` (kerja, kamar, dapur, kafe, klinik), `organ` (jantung, hati, varian `pabrik` ban berjalan), `mikro` (celah saraf, soket reseptor, molekul), `tembus` (siluet tokoh tembus pandang dengan organ). Tipe shot di `src/pustaka/set/tipe.ts`, penyaji di `src/pustaka/set/panggung.tsx` |
| Aksi | `src/pustaka/set/aksi.tsx`: `taruh`, `tuang`, `tancap`, `serobot`, `pecah`, `mundur-deret`, `getar`, `hentak`, `debu`, `label`, `muncul`. `mundur-deret` menerima `{nilai, perBenda}` sehingga jumlah benda dihitung di kode. `label` dengan `tetap: true` menjaga ukuran terbaca saat kamera zoom. `selesai: true` menampilkan keadaan akhir tanpa bunyi. Baris sumber tampil otomatis di shot yang menampilkan angka, atau dipaksa lewat `sumber` di shot. Efek suara adegan set dibuat dari aksi yang punya `mulai`. Waktu shot di dalam baris memakai `pada` (frame) atau `porsi` (0..1). Transisi antar-adegan lewat `masuk` di shot pertama: `sapu`, `kartu`, `cair`, `potong` |
| Suasana | `SUASANA` di `src/tema.ts`: `hangat`, `gelap`, `tubuh`, `bahaya`, `klinik` |
| Properti | `src/pustaka/properti.tsx`, dengan titik pegang dan keadaan `uap`, `isi`, `getar`, `tumpah` |
| Latar luar ruang dan ikon | `src/pustaka/dunia.tsx`, `src/pustaka/ikon.tsx` |
| Naskah episode | `episodes/<slug>/episode.json` |

Varian tokoh: `nadiaHamil` (Nadia dengan perut hamil, rig sama).

Tokoh utama saat ini: **Raka** (`"tokoh": "raka"`). Jangan menggantinya kecuali user meminta. Karakter baru ditambahkan sebagai entri `LOOKS`, diberi gambar kepala di `src/pustaka/tokoh-rig.tsx` dengan rig yang sama, lalu didaftarkan di `tokoh` pada `data/suara.json`. Gestur, toleh, mata, dan mulut episode dibuat otomatis oleh `naskahAdegan`. `pose` di `episode.json` boleh menimpa gestur satu baris.

## Format

- 1080×1920, 30 fps, H.264.
- Area aman konten: y 230 sampai 1500, x 80 sampai 950.
- Teks narasi di bawah, putih di atas kotak hitam, satu kalimat per bagian.
- Font Archivo. Angka dan judul tebal, label sedang.

## Tata bahasa visual

Satu ide per shot. Teks di layar sedikit, karena narasi membawa ceritanya.

| Jenis adegan | Aturan |
|---|---|
| **Semua** | Gambar memenuhi layar sebagai set berlapis yang **menggambarkan topik**, dengan kamera yang bergerak dengan maksud. Jangan membuat tampilan seperti slide atau latar template |
| **Set** | Satu episode memakai beberapa set topik, sekitar satu set per ide. Set boleh dipakai ulang dengan sengaja, misalnya set pembuka muncul lagi di penutup. Sekitar sepertiga shot boleh berupa `ruang` polos bergradasi dengan sorot untuk benda penting |
| **Konsep abstrak** | Digambar sebagai benda yang bertindak dengan sebab-akibat yang terlihat, misalnya kafein menyerobot colokan reseptor atau gelas ukur terisi sampai garis. Jangan memakai ikon melayang berlabel sebagai penjelasan utama |
| **Tokoh dan properti** | Tokoh memegang, meminum, menaruh, atau terkena properti (pose `pegang`, `minum`), bukan hanya berdiri dan melambai |
| **Suasana** | Palet berganti per ide lewat `SUASANA`: interior hangat, bahaya merah gelap, tubuh merah muda, klinik toska. Cahaya punya sumber, ada vinyet, blur kedalaman, dan butiran halus |
| **Cerita** | Utamanya karakter close-up dari dada ke atas, di dalam adegan, dengan balon ucapan putih dan semak buram di depannya. Boleh diselingi shot lebar, seluruh badan, dan sisipan objek |
| **Data** | Angka **menempel pada benda topik**, misalnya label di gelas ukur, balon, atau grid piktogram yang jumlahnya dihitung di kode. Bar chart di atas latar hanya cadangan. Sumber kecil di bawah |
| **Rantai dan linimasa** | Kamera menyapu dari satu titik ke titik berikutnya, satu ide per layar, tanpa karakter |
| **Perbandingan** | Layar dibelah dua, dan masing-masing sisi punya dunia sendiri |
| **Uang** | Selalu hijau memakai `MONEY`. Tumpukan berupa ikatan 100 lembar berbentuk persegi panjang, dengan garis lembaran, pita kertas, dan lembar atas fiktif berangka 100. Jangan meniru uang rupiah asli |
| **Peta** | Laut toska berpetak, daratan zaitun dengan garis pantai terang, dan kamera mundur. Tanpa karakter |

## Karakter

- Tinggi sekitar 2,7 kepala, kepala lebar, tubuh kecil dan ramping.
- Warna datar tanpa garis tepi, dengan bayangan lembut seperlunya.
- Mata titik yang rendah dan berjauhan, mulut kecil, tanpa alis, hidung, dan pipi merah. Untuk reaksi, mata boleh berganti ke bentuk lain yang orisinal, misalnya lengkung. Jangan memakai mata spiral khas Kok Bisa?.
- Tokoh bernapas, berkedip, dan menoleh. Mulut bergerak hanya saat tokoh benar-benar bicara di layar. Wajah tidak boleh tertutup teks narasi, jadi kepala harus berakhir di atas y 1330 kecuali pada close-up besar.

## Gerak

- Ritme: satu shot sekitar 3-4 detik. Adegan panjang dipecah menjadi beberapa shot, dan satu shot tetap satu ide.
- Kamera bergerak dengan maksud: lapisan dunia bergeser dengan kecepatan berbeda, adegan mendekat pelan, dan rantai serta linimasa menyapu antar-ide. Kamera boleh diam 0,5-1 detik untuk kontras dengan ledakan gerak. Di momen penting kamera boleh bergerak cepat sekitar 1 detik.
- Karakter, balon, dan judul boleh masuk dengan sedikit pantulan halus. Hindari banyak objek utama bergerak bersamaan, kecuali partikel untuk momen khusus, misalnya debu atau retakan saat gempa.
- Antar-adegan boleh memakai sapuan pita miring dari `Sapuan` di `src/Episode.tsx`, whip dengan blur arah, panel lembut, atau transisi lewat objek. Di dalam adegan boleh potong langsung.

## Suara dan durasi

- Naskah ada di `episodes/<slug>/episode.json`: `teks` untuk layar, `ucap` untuk suara. Tulis angka di `ucap` sebagai kata.
- Teks layar maksimal sekitar 84 karakter agar muat dua baris.
- Suara pilihan user: karakter **pria** memakai `en-US-BrianMultilingualNeural`, karakter **wanita** memakai `en-US-EmmaMultilingualNeural`, keduanya kecepatan `+0%`. Jangan menggantinya kecuali user meminta.
- `node scripts/episode.mjs <slug>` membuat suara lewat `edge-tts`, memilih suara dari `data/suara.json`, menyimpan MP3 dan durasinya ke `episodes/<slug>/suara/`, dan hanya membuat ulang baris yang berubah.
- Saat memeriksa audio, ukur dari MP4 akhir, bukan dari file sementara.

## Musik dan efek suara

- Musik pilihan user (2026-11-12): **Pizzicato Flow** oleh VitMatNotes dari Pixabay, file `assets/musik/vitmatnotes-pizzicato-flow-558613.mp3`, 88 detik, diatur di `musik` pada `data/efek-suara.json`. Halamannya dicek tanpa label Content ID Registered. Jangan menggantinya kecuali user meminta. Musik bisa dimatikan lewat `"aktif": false`. Jangan memakai audio dari Kok Bisa?.
- Musik mengecil saat narasi bicara (`musikSaatBicara` 0,2, `musikSaatJeda` 0,4) dan diulang otomatis jika video lebih panjang dari lagu.
- Setiap musik baru wajib dicek label Content ID di halamannya. Travel Piano oleh leberch (masih ada di `assets/musik/`) ditolak karena Content ID Registered.
- Cantumkan kredit musik di caption: "Musik: <judul> oleh <pembuat> (Pixabay)" beserta tautannya.
- Efek suara disintesis oleh `scripts/audio-latar.mjs`.
- Efek episode dibuat otomatis oleh `scripts/episode.mjs`: `whoosh` di pergantian adegan, `pop` saat elemen muncul, `hentak` di pembuka dan penutup, dan `ting` di sorotan grafik.
- Volume efek (termasuk `efekPerJenis`, misalnya `hentak` 0,5) diatur di `data/efek-suara.json`. Daftar `efek` di file itu hanya dipakai video UMP lama.
- Efek harus tetap lembut dan tidak menutupi narasi.
- Jika hanya audio atau efek yang berubah, jalankan `node scripts/episode.mjs <slug> --audio-saja` tanpa merender ulang gambar. Jangan memakainya jika naskah atau durasi berubah.
- Durasi adegan dihitung dari suara, jadi jangan menulis durasi adegan manual.
- Animasi penting ditautkan ke awal baris narasi yang membahasnya.

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
- Peta episode menggambar seluruh daratan dengan satu warna dari Natural Earth. Data 33 provinsi tidak boleh dipakai untuk menampilkan batas atau data per provinsi yang sudah berubah.

## Episode baru

Video baru dibuat dari `episodes/<slug>/episode.json`, tanpa menulis kode adegan. Jalankan `node scripts/episode.mjs <slug> --cek` untuk suara, jadwal, dan satu gambar per adegan, lalu `node scripts/episode.mjs <slug>` untuk video di `out/episode/<slug>/video.mp4`.

- Adegan bisa memakai set: setiap baris diberi `shot` (lihat tipe `Shot` di `src/pustaka/set/tipe.ts`). Jika satu baris di adegan punya `shot`, semua baris di adegan itu wajib punya `shot`. Nama set yang dikenal skrip ada di `SET` pada `scripts/episode.mjs`.
- Jenis adegan: `pembuka`, `penjelasan`, `perbandingan`, `grafik`, `rantai`, `linimasa`, `peta`, `penutup`. Kodenya ada di `src/Episode.tsx`.
- Latar luar ruang lama ada di `src/pustaka/dunia.tsx`: `kota`, `malam`, `senja`, `langit`, `alam`. Pakai hanya jika topiknya memang di luar ruang.
- Ikon ada di `src/pustaka/ikon.tsx`. Tambahkan ikon baru di sana jika belum ada yang cocok.
- Tiap episode wajib punya minimal dua `sumber`, dan semua klaim penting harus didukung sumber itu.
- Skrip menolak episode dengan tokoh, jenis, latar, atau ikon yang tidak dikenal, serta teks layar lebih dari 84 karakter.
- Suara dipakai ulang jika teks tidak berubah. Efek suara otomatis mengikuti elemen yang muncul.
- Episode contoh berbasis set: `episodes/kebanyakan-kafein` (29 shot, 9 set). Episode lama dengan latar luar ruang: `episodes/langit-biru` dan `episodes/gempa-indonesia`. Gaya animasi mengikuti video Kok Bisa? "Seberapa Sulit Nyalain Lampu Seluruh Penduduk Bumi?" dan "Gimana Kalau Reformasi 1998 Gak Pernah Kejadian?".

## Alur kerja

1. Tulis `episodes/<slug>/episode.json`. Jangan mengubah `src/tema.ts` untuk satu video saja.
2. Tambah adegan atau ikon di pustaka jika perlu, dan buat agar bisa dipakai topik lain.
3. Jalankan `npx tsc --noEmit`.
4. Jalankan `node scripts/episode.mjs <slug> --cek`, lalu periksa gambar tiap adegan.
5. Render penuh dengan `node scripts/episode.mjs <slug>`. Skrip ini merender per 450 frame, mengulang bagian yang gagal, lalu menyusun audio dari MP3 tanpa Chrome. Jangan kembali ke render sekali jalan: Chrome pernah berhenti diam-diam saat memori kosong sekitar 400 MB.
6. Cek exit code, stempel waktu, durasi, dan aliran audio MP4. Jika gagal di tengah, lanjutkan dengan `node scripts/episode.mjs <slug> --lanjut`, tetapi hanya jika kode belum berubah. Jangan memeriksa frame dari file lama.
7. Ambil frame dari MP4 dengan `npx remotion ffmpeg -ss <detik> -i <file> -frames:v 1 <png>`, lalu periksa tiap adegan setelah animasinya selesai.
8. Laporkan apa yang belum diverifikasi, termasuk jika gerakan belum ditonton utuh.

Upload ke platform apa pun harus mendapat persetujuan user.
