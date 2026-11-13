# Lampiran naskah: episode.json, suara, durasi

Lampiran `SKILL.md` untuk penulis naskah dan pemeriksa naskah. Aturan di `SKILL.md` tetap berlaku.

## Bentuk episode.json

Video baru dibuat dari `episodes/<slug>/episode.json`, tanpa menulis kode adegan.

- Kunci utama: `judul`, `tokoh` (`"raka"`), `musik` (`false`), `sumber` (daftar `{nama, url}`), dan `adegan`.
- Setiap adegan: `id`, `jenis`, `data`, dan `baris`. Setiap baris: `id` (misalnya `buka-1`), `teks`, `ucap`, dan opsional `pose`. `shot` diisi animator, bukan penulis.
- Jenis adegan: `pembuka`, `penjelasan`, `perbandingan`, `grafik`, `rantai`, `linimasa`, `peta`, `penutup`. Kodenya ada di `src/Episode.tsx`. Variasikan jenis adegan, dan jangan memakai jenis yang sama lebih dari dua kali berturut-turut.
- Selama belum ada `shot`, setiap adegan wajib punya `data.latar` dari `kota`, `malam`, `senja`, `langit`, `alam` (sementara, akan diganti set oleh animator).
- Ikon ada di `src/pustaka/ikon.tsx`. Jika butuh set, properti, atau ikon baru, tulis permintaannya di laporan untuk animator.
- Tiap episode wajib punya minimal dua `sumber`, dan semua klaim penting harus didukung sumber itu.
- Skrip menolak episode dengan tokoh, jenis, latar, atau ikon yang tidak dikenal, serta teks layar lebih dari 84 karakter.
- Contoh naskah final beserta bentuk JSON dan `data` per jenis adegan ada di `contoh-naskah.md` di folder ini. Jangan membaca `episode.json` episode lain secara utuh, karena sebagian besar isinya data shot. Untuk episode lain, jalankan `node scripts/ringkas-naskah.mjs <slug>`.

## Teks, ucap, dan durasi

- `teks` untuk layar, `ucap` untuk suara. Tulis angka dan singkatan di `ucap` sebagai kata.
- Teks layar maksimal 84 karakter agar muat dua baris.
- Target durasi 70 sampai 85 detik, maksimal 7 adegan dan 15 baris.
- Pembuka harus menimbulkan pertanyaan dalam 5 detik pertama. Setiap adegan membawa satu ide, dan penutup mengajak berkomentar.
- Durasi adegan dihitung dari suara, jadi jangan menulis durasi adegan manual.
- Untuk jumlah peserta studi, cek apakah angka itu total semua eksperimen atau per kelompok.

## Suara

- Suara mengikuti `tokoh` lewat `data/suara.json`. Raka memakai ElevenLabs (`raka-elevenlabs`). Nadia memakai `en-US-EmmaMultilingualNeural` dan Bima memakai `en-US-BrianMultilingualNeural` lewat `edge-tts`, keduanya kecepatan `+0%`. Jangan menggantinya kecuali user meminta.
- `node scripts/episode.mjs <slug> --cek` membuat suara, menyimpan MP3 dan durasinya ke `episodes/<slug>/suara/`, dan hanya membuat ulang baris yang `ucap`-nya berubah.
- Suara ElevenLabs memakai kredit berbayar. Setelah suara dibuat, jangan ubah `ucap` kecuali ada klaim yang salah.

## Caption

`caption.md` berisi judul dan deskripsi YouTube, caption Instagram, dan caption TikTok, dengan format seperti `episodes/begadang-terus/caption.md`. Cantumkan semua url sumber. Tambahkan "Video ini edukasi umum, bukan nasihat medis." untuk topik kesehatan. Jangan cantumkan kredit musik selama musik mati (lihat `audio.md`).

Setelah menulis, jalankan `node scripts/lint-episode.mjs <slug>`.
