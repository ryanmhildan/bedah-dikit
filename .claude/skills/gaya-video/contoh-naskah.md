# Contoh naskah final: begadang-terus

Dibuat dari `node scripts/ringkas-naskah.mjs begadang-terus`. Detik di depan baris adalah waktu mulai di video.

```text
# Apa Jadinya Kalau Kita Begadang Terus?
tokoh: raka | musik: mati | durasi 77.1 detik, 21 efek
sumber: CDC <https://www.cdc.gov/sleep/about/index.html> ; NHLBI (NIH) <https://www.nhlbi.nih.gov/health/sleep-deprivation> ; Van Dongen dkk. (2003) <https://academic.oup.com/sleep/article/26/2/117/2709164> ; Williamson & Feyer (2000) <https://oem.bmj.com/content/57/10/649> ; Xie dkk. (2013) <https://pmc.ncbi.nlm.nih.gov/articles/PMC3880190/> ; NIH <https://www.nih.gov/news-events/news-releases/brain-may-flush-out-toxins-during-sleep>

## buka (pembuka)
- [0.5s] buka-1: Jam 2 pagi, masih main HP. "Cuma kurang tidur dikit, aman kan?"
  ucap: Jam dua pagi, masih main hape. Cuma kurang tidur dikit, aman kan?
- [5.0s] buka-2: Tapi kalau tiap malam begitu, apa jadinya?

## butuh (penjelasan)
- [8.4s] butuh-1: Orang dewasa (18–60 tahun) dianjurkan tidur 7 jam atau lebih tiap malam.
  ucap: Orang dewasa dianjurkan tidur tujuh jam atau lebih tiap malam.

## eksperimen (grafik)
- [13.6s] eksperimen-1: Eksperimen 14 hari: orang dewasa sehat dibatasi tidur 8, 6, atau 4 jam semalam.
  ucap: Dalam eksperimen empat belas hari, orang dewasa sehat dibatasi tidur delapan, enam, atau empat jam semalam.
- [21.7s] eksperimen-2: Kemampuan berpikir kelompok 6 jam turun tiap hari, sampai setara tak tidur semalam.
  ucap: Kemampuan berpikir kelompok enam jam terus turun hari demi hari, sampai setara tidak tidur semalaman.
- [28.1s] eksperimen-3: Kelompok 4 jam? Setara dua malam tanpa tidur.
  ucap: Kelompok empat jam? Setara dua malam tanpa tidur.

## sadar (rantai)
- [32.9s] sadar-1: Seramnya, mereka hampir tidak sadar performanya terus turun.
- [36.5s] sadar-2: Kantuk yang mereka laporkan hampir tak bertambah setelah beberapa hari pertama.
  ucap: Kantuk yang mereka laporkan hampir tidak bertambah setelah beberapa hari pertama.
- [41.6s] sadar-3: Jadi, "tubuh bisa terbiasa kurang tidur"? Menurut NHLBI, itu keliru.
  ucap: Jadi, tubuh bisa terbiasa kurang tidur? Itu keliru.

## alkohol (perbandingan)
- [46.6s] alkohol-1: Terjaga 17 jam, performa kita setara orang berkadar alkohol darah 0,05%.
  ucap: Terjaga tujuh belas jam, performa kita setara kadar alkohol darah nol koma nol lima persen.

## otak (penjelasan)
- [53.6s] otak-1: Pada tikus, saat tidur, ruang di antara sel otak membesar sekitar 60%.
  ucap: Pada tikus, saat tidur, ruang di antara sel otak membesar sekitar enam puluh persen.
- [59.2s] otak-2: Saat tidur, beta-amiloid (terkait Alzheimer) dibersihkan 2x lebih cepat.
  ucap: Saat tidur, beta amiloid, protein yang dikaitkan dengan Alzheimer, dibersihkan dua kali lebih cepat.

## tutup (penutup)
- [66.9s] tutup-1: Dikaitkan dengan: penyakit jantung, darah tinggi, diabetes, obesitas, depresi.
  ucap: Kurang tidur juga dikaitkan dengan sakit jantung, darah tinggi, diabetes, obesitas, dan depresi.
- [73.1s] tutup-2: Semalam kamu tidur berapa jam? Tulis di komentar.
```

## Bentuk JSON sebelum animator menambahkan `shot`

Kerangka file (adegan dipotong):

```json
{
  "judul": "Apa Jadinya Kalau Kita Begadang Terus?",
  "tokoh": "raka",
  "musik": false,
  "sumber": [
    {
      "nama": "CDC",
      "url": "https://www.cdc.gov/sleep/about/index.html"
    },
    {
      "nama": "NHLBI (NIH)",
      "url": "https://www.nhlbi.nih.gov/health/sleep-deprivation"
    }
  ],
  "adegan": [
    {
      "id": "buka",
      "jenis": "pembuka",
      "data": {
        "latar": "malam",
        "judul": "Apa jadinya kalau begadang terus?",
        "sub": "Cuma kurang tidur dikit, aman kan?"
      },
      "baris": [
        {
          "id": "buka-1",
          "teks": "Jam 2 pagi, masih main HP. \"Cuma kurang tidur dikit, aman kan?\"",
          "ucap": "Jam dua pagi, masih main hape. Cuma kurang tidur dikit, aman kan?"
        },
        {
          "id": "buka-2",
          "teks": "Tapi kalau tiap malam begitu, apa jadinya?",
          "ucap": "Tapi kalau tiap malam begitu, apa jadinya?"
        }
      ]
    }
  ]
}
```

Bentuk `data` per jenis adegan, dari episode final (`latar` sementara wajib ditambahkan selama belum ada `shot`):

```text
pembuka: {"latar":"malam","judul":"Apa jadinya kalau begadang terus?","sub":"Cuma kurang tidur dikit, aman kan?"}
penjelasan: {"latar":"malam","gambar":[{"ikon":"jam","label":"Dewasa: 7 jam atau lebih"}]}
grafik: {"latar":"malam","judul":"Setelah 14 hari, setara berapa malam tanpa tidur?","satuan":" malam","sorot":["Tidur 6 jam"],"item":[{"label":"Tidur 6 jam","nilai":1},{"label":"Tidur 4 jam","nilai":2}]}
rantai: {"latar":"malam","judul":"Tidak terasa, tapi terus turun","langkah":[{"ikon":"otak","teks":"Performa terus turun"},{"ikon":"mata","teks":"Kantuk nyaris tidak bertambah"},{"ikon":"getar","teks":"Tubuh tidak benar-benar terbiasa"}]}
perbandingan: {"latar":"malam","latarKiri":"malam","judul":"Terjaga lama vs alkohol","kiri":{"ikon":"jam","label":"Terjaga 17 jam","nilai":"Performa turun"},"kanan":{"ikon":"tabung","label":"Alkohol darah","nilai":"0,05%"}}
penutup: {"latar":"malam","pertanyaan":"Semalam kamu tidur berapa jam?"}
```
