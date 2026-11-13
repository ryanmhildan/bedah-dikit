---
name: episode-baru
description: Alur otomatis membuat satu episode Bedah Dikit dari topik sampai video siap ditinjau user. Gunakan saat user meminta "buat episode", "episode baru", atau memberi topik video baru. Argumen adalah topik atau judul.
---

# Episode baru: alur otomatis

Argumen: topik atau judul episode. Jika kosong, ambil topik teratas dari `antrean.md` jika ada, atau usulkan 3 topik dan tunggu pilihan user.

Sesi utama berperan sebagai **sutradara**: memanggil agent, memeriksa setiap laporan, dan menjadi satu-satunya penghubung ke user. Baca dulu `.claude/skills/gaya-video/SKILL.md`. Standar visual tetap mengikuti episode final `kebanyakan-kafein`, `pedas-ketagihan`, dan `begadang-terus`.

## Aturan tetap

- **Tanpa musik latar** (keputusan user 2026-11-12). `musik.aktif` sudah `false` di `data/efek-suara.json`. Jangan menyalakannya. Jangan cantumkan kredit musik di caption.
- Tokoh utama Raka, suara ElevenLabs Raka. Suara dibuat dari `ucap` dan memakai kredit berbayar. Setelah suara dibuat, **jangan ubah `ucap`** kecuali ada klaim yang salah.
- Panggil semua agent dengan `model: "opus"`. Model lain bisa gagal di lingkungan ini.
- Hanya satu render boleh berjalan. Dua agent tidak boleh mengubah file yang sama bersamaan.
- Tidak ada upload, unduhan musik, atau pemakaian akun user tanpa persetujuan user.
- Target durasi 70 sampai 85 detik, maksimal 7 adegan dan 15 baris.
- Jika agent berhenti karena batas pemakaian, lanjutkan agent yang sama dengan `SendMessage` setelah reset, jangan membuat agent baru.

## Langkah

| # | Tahap | Pelaksana | Selesai jika |
|---|---|---|---|
| 1 | Slug | Sutradara | Slug pendek dengan tanda hubung, folder `episodes/<slug>/` belum ada |
| 2 | Riset | `peneliti-fakta` | Laporan berisi tabel klaim yang masing-masing didukung minimal 2 sumber yang dibaca penuh, sumber yang bertentangan, dan klaim yang dibuang |
| 3 | Cek riset | Sutradara | Laporan riset wajib berisi kutipan asli untuk setiap angka dan sebab-akibat. Sutradara membaca ulang sumber utama lewat `mcp__exa__web_fetch_exa` dan mencocokkan kutipannya, terutama angka, jumlah peserta (total atau per kelompok), dan kata "selalu", "menyebabkan", atau "pada tikus". Sumber pendukung tidak perlu dibaca ulang jika kutipannya jelas dan tidak bertentangan; baca ulang jika kutipan hilang, samar, atau angkanya berbeda dari sumber utama |
| 4 | Naskah | `penulis-naskah`, lalu sutradara menjalankan `node scripts/lint-episode.mjs <slug>` | `episode.json` (tanpa `shot`, dengan `data.latar` sementara) dan `caption.md` selesai, memakai hanya fakta yang lolos, lint tanpa `SALAH` |
| 5 | Cek naskah | `peneliti-fakta` atau sutradara, memakai keluaran `node scripts/ringkas-naskah.mjs <slug>` (bukan `episode.json` utuh) | Setiap `teks`, `ucap`, dan isi caption cocok dengan sumber. Perbaiki sebelum suara dibuat |
| 6 | Suara | Sutradara: `node scripts/episode.mjs <slug> --cek` | Exit 0, durasi 70 sampai 85 detik. Jika lebih, pangkas naskah sebelum lanjut, karena baris yang dibuang tetap memakan kredit |
| 7 | **Titik persetujuan 1** | User | Kirim ringkasan naskah dan durasi. Lanjut tanpa menunggu kecuali user pernah meminta untuk mendengar contoh suara dulu |
| 8 | Shot | `animator-adegan` | `episode.json` dalam format ringkas (`node scripts/rapikan-naskah.mjs <slug>`), setiap baris punya `shot`, set dan properti baru masuk pustaka, `tsc` lolos, `--cek` tanpa log "Suara", lint tanpa `SALAH`, still per shot diperiksa, regresi episode lain identik |
| 9 | Cek still | Sutradara | Jalankan lint, lalu lihat 1 sampai 2 lembar dari `node scripts/lembar-kontak.mjs <slug> --cek`. Peringatan lint "angka ... tidak ada di teks naskah" wajib dicocokkan dengan sumber. Cari benda yang terbaca sebagai wajah, label terpotong, dan grafik tanpa nol |
| 10 | Render | Sutradara: `node scripts/render-episode.mjs <slug>` di latar belakang. Panggil `operator-render` hanya jika render gagal lagi setelah `--lanjut` | Skrip mencetak LOLOS: `video.mp4` baru, durasi sesuai, ada audio AAC, dan tidak ada baris suara yang dibuat ulang (jika ada, cek kenapa sebelum lanjut) |
| 11 | QA | `pemeriksa-kualitas` | Keputusan LOLOS, LOLOS dengan catatan, atau REVISI, dari lembar kontak MP4 akhir. Prioritas: kejujuran data, lalu area aman, lalu ekspresi, lalu audio |
| 12 | Revisi | Agent terkait, lalu ulangi 10 dan 11 | Maksimal 2 putaran. Untuk revisi, lanjutkan agent yang sama dengan `SendMessage` (ia sudah tahu file dan konteksnya), bukan agent baru. Jika masih REVISI, laporkan ke user |
| 13 | **Titik persetujuan 2** | User | Kirim video dengan `SendUserFile`, beserta ringkasan isi, temuan QA, dan hal yang belum terverifikasi. User yang memutuskan |
| 14a | Antrean | Sutradara | Status topik di `antrean.md`: `proses` saat mulai, `menunggu review` saat video dikirim, `selesai` setelah user setuju |
| 14 | Catat | Sutradara | Perbarui memori `status-proyek` dan, jika ada set, aksi, atau properti baru, daftar di `gaya-video/visual.md`. Salin seluruh folder `.claude/skills/gaya-video/` ke `.agents/skills/gaya-video/` setelah setiap perubahan |

## Isi brief agent

Setiap brief harus berdiri sendiri. Agent tidak melihat percakapan ini. Brief cukup memuat hal khusus episode ini; aturan umum sudah ada di file agent dan lampiran `gaya-video`, jadi jangan menyalinnya ke brief.

Hemat token: sutradara juga memakai `ringkas-naskah`, `lint-episode`, dan `lembar-kontak` alih-alih membaca `episode.json` utuh atau melihat banyak frame satu per satu.

- **peneliti-fakta**: topik, sudut cerita, 6 sampai 8 klaim yang ingin diuji, dan permintaan untuk menyebut klaim yang harus dibuang. Untuk cek naskah (langkah 5), tempelkan keluaran `ringkas-naskah` dan angka label dari peringatan lint.
- **penulis-naskah**: daftar fakta lolos beserta sumbernya, daftar klaim terlarang, daftar `sumber`, arah cerita per adegan, aturan `teks` paling panjang 84 karakter, angka di `ucap` ditulis sebagai kata, dan caption tanpa kredit musik.
- **animator-adegan**: arahan visual per adegan, angka yang boleh tampil, dan aturan dari `gaya-video/visual.md` (`label` dengan `tetap` dan `aman`, `sejak` untuk aksi yang mengecil, 2 sampai 3 hentak dengan total sekitar 20 efek, grafik dari nol dalam satuan sumber, ekspresi sesuai narasi). Ingatkan: jangan ubah `teks` dan `ucap`, dan jangan render penuh.
- **pemeriksa-kualitas**: path video, stempel waktu, durasi, daftar perbaikan yang harus diverifikasi (pada putaran revisi), dan permintaan keputusan beserta detik dan agent penanggung jawab untuk setiap temuan.

## Pelajaran dari episode sebelumnya

- Klaim "48 orang" ternyata total dua eksperimen. Selalu cek apakah jumlah peserta itu total atau per kelompok.
- Meter yang turun dari wadah penuh dengan nilai maksimum bebas terbaca sebagai persen. Gunakan batang yang tumbuh dari nol dalam satuan sumber.
- Api di atas gelas terbaca seperti lilin, dan sel bulat dengan inti gelap terbaca seperti wajah. Periksa simbol yang ambigu.
- Mata ">  <" dengan mulut terbuka lebar terbaca seperti tertawa. Gunakan mulut `kepanasan` atau `cemas` untuk rasa sakit.
- Efek terlalu padat (lebih dari 30) dan hentak yang berulang terasa ramai. Targetkan sekitar 20.
