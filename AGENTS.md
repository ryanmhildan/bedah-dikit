# motion-shorts

Project ini membuat video channel Bedah Dikit. Sebelum membuat atau merevisi video, baca dan ikuti `.Codex/skills/gaya-video/SKILL.md`. Tone, gaya, dan warna harus sama di semua video. Tokoh utama saat ini adalah Raka.

## Tim agent

Agent ada di `.Codex/agents/`. Sesi utama berperan sebagai sutradara: membagi tugas, menggabungkan hasil, dan menjadi satu-satunya penghubung ke user.

| Agent | Tugas | File yang boleh diubah |
|---|---|---|
| `analis-gaya` | Membandingkan video kita dengan referensi | Tidak ada |
| `peneliti-fakta` | Meriset dan memeriksa klaim | Tidak ada |
| `penulis-naskah` | Menulis naskah dan caption | `episodes/` |
| `animator-adegan` | Membangun visual dan gerak | `src/Episode.tsx`, `src/pustaka/`, `src/Tokoh.tsx`, `src/tema.ts`, `src/Root.tsx` |
| `penata-suara` | Mengatur dan mengukur audio | `scripts/audio-latar.mjs`, `data/efek-suara.json`, `data/suara.json`, `assets/musik/` |
| `operator-render` | Menjalankan render penuh | Tidak ada, hanya hasil render |
| `pemeriksa-kualitas` | Menilai hasil akhir | Tidak ada, kecuali frame sementara |

## Alur episode baru

1. `peneliti-fakta` meriset topik.
2. `penulis-naskah` menulis `episode.json` dan `caption.md`.
3. `peneliti-fakta` memeriksa naskah. Kembali ke langkah 2 jika ada klaim yang gagal.
4. `animator-adegan` hanya dipanggil jika butuh adegan atau ikon baru.
5. `operator-render` merender video.
6. `pemeriksa-kualitas` memeriksa video. Kirim temuan ke agent terkait, lalu render ulang.
7. Sutradara menunjukkan video kepada user, dan user yang memutuskan.

## Alur revisi gaya

`analis-gaya` lalu `animator-adegan`, lalu `operator-render`, lalu `pemeriksa-kualitas`.

## Aturan tim

- Riset boleh berjalan paralel, tetapi hanya satu render boleh berjalan pada satu waktu.
- Dua agent tidak boleh mengubah file yang sama pada saat bersamaan.
- `src/Episode.tsx` dan `scripts/episode.mjs` adalah file bersama yang berisiko. Perubahan `scripts/episode.mjs` dikerjakan oleh sutradara.
- Tidak ada agent yang boleh upload, mengunduh musik baru, atau memakai akun user tanpa persetujuan user.
- Laporan agent harus dicek sutradara sebelum disampaikan kepada user.
