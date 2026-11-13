# Lampiran audio: musik dan efek suara

Lampiran `SKILL.md` untuk penata suara. Aturan di `SKILL.md` tetap berlaku. Pilihan suara narasi ada di `naskah.md`.

## Musik

- **Tanpa musik untuk episode baru** (keputusan user 2026-11-12, setelah upload YouTube gagal dengan musik). `musik.aktif` sekarang `false` di `data/efek-suara.json`. Episode `kebanyakan-kafein` tetap punya versi bermusik dan versi tanpa musik (`video-tanpa-musik.mp4`). Jangan menyalakan musik lagi kecuali user meminta, dan jangan cantumkan kredit musik di caption.
- Musik pilihan user (2026-11-12), saat ini dimatikan: **Pizzicato Flow** oleh VitMatNotes dari Pixabay, file `assets/musik/vitmatnotes-pizzicato-flow-558613.mp3`, 88 detik, diatur di `musik` pada `data/efek-suara.json`. Halamannya dicek tanpa label Content ID Registered. Jangan menggantinya kecuali user meminta. Jangan memakai audio dari Kok Bisa?.
- Jika musik dinyalakan lagi atas permintaan user: musik mengecil saat narasi bicara (`musikSaatBicara` 0,2, `musikSaatJeda` 0,4) dan diulang otomatis jika video lebih panjang dari lagu. Cantumkan kredit musik di caption: "Musik: <judul> oleh <pembuat> (Pixabay)" beserta tautannya. Narasi sekitar 12 dB di atas musik.
- Setiap musik baru wajib dicek label Content ID di halamannya. Travel Piano oleh leberch (masih ada di `assets/musik/`) ditolak karena Content ID Registered.

## Efek suara

- Efek suara disintesis oleh `scripts/audio-latar.mjs`.
- Efek episode dibuat otomatis oleh `scripts/episode.mjs`: `whoosh` di pergantian adegan, `pop` saat elemen muncul, `hentak` di pembuka dan penutup, dan `ting` di sorotan grafik. Di adegan set, efek dibuat dari aksi yang punya `mulai`.
- Volume efek (termasuk `efekPerJenis`, misalnya `hentak` 0,5) diatur di `data/efek-suara.json`. Daftar `efek` di file itu hanya dipakai video UMP lama.
- Efek harus tetap lembut dan tidak menutupi narasi. Target sekitar 20 efek dan 2-3 hentak per episode.
- Jika hanya audio atau efek yang berubah, jalankan `node scripts/episode.mjs <slug> --audio-saja` tanpa merender ulang gambar. Jangan memakainya jika naskah atau durasi berubah.
- Saat memeriksa audio, ukur dari MP4 akhir, bukan dari file sementara.
