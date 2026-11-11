# Rancangan Alur Otomatis Bedah Dikit

Status: tahap 4 sampai 6 sudah dibangun lewat `scripts/episode.mjs`. Tahap lain belum.

## Alur

| No | Tahap | Hasil | Status sekarang |
|---|---|---|---|
| 1 | Pilih topik dari antrean | Satu pertanyaan "kenapa" | Belum ada |
| 2 | Riset dari minimal dua sumber | Fakta dan tautan sumber | Belum ada |
| 3 | Tulis naskah | `teks`, `ucap`, dan daftar adegan | Format naskah sudah ada, penulisan masih manual |
| 4 | Pilih adegan dari pustaka | File episode | Sudah ada: tujuh jenis adegan dan pustaka ikon |
| 5 | Buat suara | MP3 narasi | Sudah ada |
| 6 | Render video | MP4 dengan musik dan efek | Sudah ada |
| 7 | Cek otomatis | Laporan audio, durasi, teks, dan frame | Sebagian masih manual |
| 8 | Buat judul dan caption | Teks tiap platform | Belum ada |
| 9 | Review user | Setuju, revisi, atau tolak | Belum ada |
| 10 | Upload terjadwal | Video tayang | Belum ada |
| 11 | Catat performa | Bahan memilih topik berikutnya | Belum ada |

Tahap 9 wajib. Tidak ada video yang tayang tanpa persetujuan user.

## Tantangan terbesar

Video UMP dibuat khusus untuk topik uang. Channel ini umum, jadi perlu pustaka adegan yang bisa dipakai ulang:

- Pembuka karakter
- Perbandingan dua hal
- Grafik dan angka
- Peta
- Urutan sebab dan akibat
- Proses langkah demi langkah
- Linimasa
- Penutup dan ajakan berkomentar

Pustaka ikon juga perlu dibuat supaya topik seperti gempa, tidur, atau harga cabai punya gambar yang cocok.

## Urutan pembangunan

1. Selesai: isi video dipisahkan dari kode lewat file episode.
2. Selesai: pustaka adegan dan ikon diuji dengan topik langit biru dan gempa.
3. Buat alat riset dan naskah, lengkap dengan daftar sumber.
4. Buat cek otomatis dan folder review.
5. Buat caption tiap platform.
6. Sambungkan upload setelah tes manual selesai.

## Keputusan user

- Frekuensi upload.
- Cara upload: layanan perantara atau API resmi.
- Tempat menjalankan: PC atau VPS.
- Layanan suara untuk monetisasi.
- Musik: tetap Travel Piano atau pindah jika kena klaim.
