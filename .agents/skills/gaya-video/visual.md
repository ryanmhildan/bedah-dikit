# Lampiran visual: set, aksi, tokoh, gerak

Lampiran `SKILL.md` untuk animator, analis gaya, dan pemeriksa kualitas. Aturan di `SKILL.md` tetap berlaku.

## Pustaka

| Hal | Isi |
|---|---|
| Set topik | `src/pustaka/set/`: `ruang` (gradasi, sorot, vinyet, bokeh), `meja` (tampak atas dan samping), `interior` (kerja, kamar, dapur, kafe, klinik), `organ` (jantung, hati, varian `pabrik` ban berjalan), `mikro` (celah saraf, soket reseptor, molekul), `tembus` (siluet tokoh tembus pandang dengan organ). Ditambah 2026-11-12 dari episode pedas: `wahana` (roller coaster), `belah` (layar belah dua suasana), interior varian `warung`, opsi `plafon` (dapur) dan `lidah` (mikro). Ditambah dari episode begadang: `lab` (tiga bilik dengan meter dan penghitung hari), opsi `otak` di `mikro` (sel glia bercabang), opsi `giliran` di `tembus`. Tipe shot di `src/pustaka/set/tipe.ts`, penyaji di `src/pustaka/set/panggung.tsx` |
| Aksi | `src/pustaka/set/aksi.tsx`: `taruh`, `tuang`, `tancap`, `serobot`, `pecah`, `mundur-deret`, `getar`, `hentak`, `debu`, `label`, `muncul`, `ikat`, `sinyal`, `ubah`, `meluncur`, `batang` (meter vertikal mulai dari nol), `jajar` (grid benda dengan jumlah dihitung dari data), `coret`, `alir`, `oleng`. Aturan pakainya ada di bagian Aturan aksi |
| Suasana | `SUASANA` di `src/tema.ts`: `hangat`, `gelap`, `tubuh`, `bahaya`, `klinik` |
| Properti | `src/pustaka/properti.tsx`, dengan titik pegang dan keadaan `uap`, `isi`, `getar`, `tumpah`. Properti tambahan: jam varian `sapu` (juring jam yang terisi), `selOtak` varian `penuh` dan `tanda` |
| Latar luar ruang dan ikon | `src/pustaka/dunia.tsx`, `src/pustaka/ikon.tsx` |

Untuk melihat contoh pemakaian tanpa membaca `episode.json` utuh: `node scripts/ringkas-naskah.mjs kebanyakan-kafein --shot`. Buka `episode.json` contoh hanya untuk melihat bentuk lengkap satu shot.

## Aturan aksi

- Meter perbandingan tanpa skala data (misalnya "setara N malam") wajib tumbuh dari nol dalam satuan sumber, dengan sumbu 0/1/2 dan tanpa kesan persen (`batang` dengan `maks` = nilai terbesar dan `alas: 'terang'`). Meter yang turun dari wadah penuh dengan nilai maksimum bebas terbaca sebagai persen.
- Label yang menempel di set saat kamera zoom memakai `tetap: true, aman: true` agar tidak terpotong di tepi layar. `label` dengan `tetap: true` menjaga ukuran terbaca saat kamera zoom.
- Aksi yang mengecilkan atau menurunkan sesuatu memakai `sejak` (tanpa bunyi).
- Hentak cukup 2-3 per episode, total efek sekitar 20 (`tancap` punya opsi `ligan`). Efek lebih dari 30 dan hentak yang berulang terasa ramai.
- Transisi `cair` bisa diberi bahan lewat field `cair` (`kopi`, `sambal`, `susu`).
- `mundur-deret` menerima `{nilai, perBenda}` sehingga jumlah benda dihitung di kode.
- `selesai: true` menampilkan keadaan akhir tanpa bunyi.
- Baris sumber tampil otomatis di shot yang menampilkan angka, atau dipaksa lewat `sumber` di shot.
- Efek suara adegan set dibuat dari aksi yang punya `mulai`.
- Waktu shot di dalam baris memakai `pada` (frame) atau `porsi` (0..1).
- Transisi antar-adegan lewat `masuk` di shot pertama: `sapu`, `kartu`, `cair`, `potong`.

## Tokoh

Varian tokoh: `nadiaHamil` (Nadia dengan perut hamil, rig sama). Ekspresi tambahan: `ekspresi` (`merah`, `keringat`, `airMata`), mata `pejam`, `sayu`, mulut `megap`, `kepanasan`, pose `kibas`, `jempol`, ekspresi `layar`. Ekspresi harus cocok dengan narasi; senyum hanya di bagian yang memang menyenangkan. Mata ">  <" dengan mulut terbuka lebar terbaca seperti tertawa, jadi gunakan mulut `kepanasan` atau `cemas` untuk rasa sakit. Mulut `tutup` bisa terbaca senyum, jadi cek di still.

Karakter baru ditambahkan sebagai entri `LOOKS`, diberi gambar kepala di `src/pustaka/tokoh-rig.tsx` dengan rig yang sama, lalu didaftarkan di `tokoh` pada `data/suara.json`. Gestur, toleh, mata, dan mulut episode dibuat otomatis oleh `naskahAdegan`. `pose` di `episode.json` boleh menimpa gestur satu baris.

## Simbol yang ambigu

Sel atau benda bulat dengan satu inti gelap berkilau mudah terbaca sebagai wajah, jadi hindari. Api di atas gelas terbaca seperti lilin. Periksa setiap simbol baru: apakah orang awam membacanya seperti yang dimaksud?

## Tata bahasa visual

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

## Gerak

- Ritme: satu shot sekitar 3-4 detik. Adegan panjang dipecah menjadi beberapa shot, dan satu shot tetap satu ide.
- Kamera bergerak dengan maksud: lapisan dunia bergeser dengan kecepatan berbeda, adegan mendekat pelan, dan rantai serta linimasa menyapu antar-ide. Kamera boleh diam 0,5-1 detik untuk kontras dengan ledakan gerak. Di momen penting kamera boleh bergerak cepat sekitar 1 detik.
- Karakter, balon, dan judul boleh masuk dengan sedikit pantulan halus. Hindari banyak objek utama bergerak bersamaan, kecuali partikel untuk momen khusus, misalnya debu atau retakan saat gempa.
- Antar-adegan boleh memakai sapuan pita miring dari `Sapuan` di `src/Episode.tsx`, whip dengan blur arah, panel lembut, atau transisi lewat objek. Di dalam adegan boleh potong langsung.
- Animasi penting ditautkan ke awal baris narasi yang membahasnya.

## Shot di episode.json

- `episode.json` disimpan dalam format ringkas, satu shot per baris tanpa indentasi dalam, sekitar sepertiga ukuran format biasa. Setelah mengubah, jalankan `node scripts/rapikan-naskah.mjs <slug>`. Isi data dicek identik sebelum file ditulis.
- Adegan bisa memakai set: setiap baris diberi `shot` (lihat tipe `Shot` di `src/pustaka/set/tipe.ts`). Jika satu baris di adegan punya `shot`, semua baris di adegan itu wajib punya `shot`. Nama set yang dikenal skrip ada di `SET` pada `scripts/episode.mjs`.
- Latar luar ruang lama ada di `src/pustaka/dunia.tsx`: `kota`, `malam`, `senja`, `langit`, `alam`. Pakai hanya jika topiknya memang di luar ruang.
- Ikon ada di `src/pustaka/ikon.tsx`. Tambahkan ikon baru di sana jika belum ada yang cocok.
- Episode contoh berbasis set: `episodes/kebanyakan-kafein` (29 shot, 9 set), `episodes/pedas-ketagihan`, dan `episodes/begadang-terus`. Episode lama dengan latar luar ruang ada di `episodes/lama/` (`langit-biru`, `gempa-indonesia`). Gaya animasi mengikuti video Kok Bisa? "Seberapa Sulit Nyalain Lampu Seluruh Penduduk Bumi?" dan "Gimana Kalau Reformasi 1998 Gak Pernah Kejadian?".

## Alur kerja animator

1. Jangan mengubah `src/tema.ts` untuk satu video saja.
2. Tambah adegan, set, atau ikon di pustaka jika perlu, dan buat agar bisa dipakai topik lain.
3. Jalankan `npx tsc --noEmit`.
4. Jalankan `node scripts/episode.mjs <slug> --cek`, lalu `node scripts/lint-episode.mjs <slug>`. Periksa gambar tiap adegan lewat `node scripts/lembar-kontak.mjs <slug> --cek`. Ambil still penuh hanya untuk shot yang meragukan.
5. Jangan render penuh; itu tugas render.
