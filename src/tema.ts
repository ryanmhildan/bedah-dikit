// Sumber tunggal warna video. Ubah di sini agar semua video tetap seragam.
export const WHITE = '#FFFFFF';
export const NAVY = '#262B52';
export const ROSE = '#EF5F74';
export const BAR = '#FFD76A';

// Uang: hijau limau dengan garis lembaran terang.
export const MONEY = '#7ED04B';
export const MONEY_SHEET = 'rgba(232,255,150,0.55)';
export const MONEY_SHADE = '#0F3A2A';
export const MONEY_GLOW = 'rgba(126,208,75,0.2)';
export const MONEY_LIGHT = '#B7E88A';
export const MONEY_INK = '#2C6B2F';
export const STRAP = '#F4EEE2';

// Latar adegan.
export const WARM_WALL = 'linear-gradient(180deg, #FCE9CF 0%, #F6D3AE 60%, #DFAE85 100%)';
export const WARM_SHELF = '#B9835C';
export const SHELF_COLORS = ['#F2A65A', '#EF5F74', '#6FC3DF', '#FFD76A', '#7CC47F', '#B79CED', '#F4EEE2'];
export const DATA_OVERLAY = 'rgba(16,14,28,0.76)';
export const MAP_SEA = 'linear-gradient(170deg, #ECE8FB 0%, #D5DCF6 55%, #C4D8F2 100%)';
export const MAP_RAMP = ['#5F6FC0', '#A07CC6', ROSE];
export const MAP_UNKNOWN = '#B7BEDD';
export const FADE = '#FFF6E9';

// Pita sapuan antar-adegan, berulang dalam urutan ini.
export const PITA = ['#F4806D', '#FFF6EA', '#FFD76A'];

// Peta episode: laut toska dan daratan zaitun dengan garis pantai terang.
export const PETA_LAUT = '#7CCFC9';
export const PETA_PANTAI_LUAR = '#BFEBE4';
export const PETA_PANTAI = '#E6F7EF';
export const PETA_DARAT = '#B9B24C';

// Sisi perbandingan yang barisnya belum tiba.
export const REDUP = 'rgba(16,14,28,0.5)';

// Ikon senja: matahari di garis cakrawala dan pantulannya.
export const SENJA_SURYA = '#FF8A5B';
export const SENJA_INTI = '#FFC94D';
export const SENJA_CAKRAWALA = '#FFF6EA';

// Latar halus teks sumber, supaya terbaca di dunia apa pun.
export const SUMBER_LATAR = 'rgba(12,12,18,0.6)';

// Wajah rig.
export const RIG_MATA = '#17141A';
export const RIG_MULUT = '#8A4E3F';
export const RIG_SENYUM = '#A3604B';
// Kilau lembut di permukaan bulat, misalnya perut hamil.
export const RIG_KILAU = '#FFF6EA';

// Lipatan kain hijab di bawah dagu.
export const RIG_HIJAB_LIPAT = '#7A68AE';

// Angka besar di atas dunia.
export const ANGKA_BAYANG = 'rgba(10,8,40,0.35)';

// Kotak teks narasi di bawah layar.
export const NARASI_LATAR = 'rgba(12,12,18,0.78)';

// ---------------------------------------------------------------------------
// Set dan properti. Palet ini dipakai lintas video. Jangan menambah warna untuk satu episode saja.
// ---------------------------------------------------------------------------

// Suasana: palet per ide. `latar` untuk ruang polos, `sorot` warna sumber cahaya,
// `rona` diwarnakan tipis ke seluruh set supaya set apa pun ikut suasana, `vinyet` gelap di tepi.
export type Suasana = {
  latar: [string, string, string];
  sorot: string;
  sorotKuat: number;
  rona: string;
  ronaKuat: number;
  vinyet: string;
  vinyetKuat: number;
  bokeh: string;
  butir: number;
};

export const SUASANA = {
  // Interior sore: cahaya jendela jingga, bayangan cokelat hangat.
  hangat: {latar: ['#F7D2A6', '#E2A274', '#9C5E42'], sorot: '#FFE6B8', sorotKuat: 0.55, rona: '#FFB98A', ronaKuat: 0.14, vinyet: '#3A1D14', vinyetKuat: 0.5, bokeh: '#FFD9A3', butir: 0.07},
  // Ruang sorot untuk benda penting: biru tinta yang dingin, satu cahaya putih kebiruan.
  gelap: {latar: ['#2B3650', '#151C2C', '#080B13'], sorot: '#DCEBFF', sorotKuat: 0.6, rona: '#7F9CCF', ronaKuat: 0.22, vinyet: '#03050A', vinyetKuat: 0.82, bokeh: '#93B4E6', butir: 0.09},
  // Dalam tubuh: merah muda di tengah, merah tua di tepi.
  tubuh: {latar: ['#F9B3BE', '#E06A80', '#8E2340'], sorot: '#FFE3E8', sorotKuat: 0.5, rona: '#F59AAA', ronaKuat: 0.16, vinyet: '#46091C', vinyetKuat: 0.6, bokeh: '#FFC9D1', butir: 0.07},
  // Bahaya: merah gelap, cahaya oranye kemerahan.
  bahaya: {latar: ['#8E2A2C', '#4C1015', '#1C0507'], sorot: '#FFA07E', sorotKuat: 0.5, rona: '#A8323A', ronaKuat: 0.8, vinyet: '#120204', vinyetKuat: 0.8, bokeh: '#FF6E5C', butir: 0.09},
  // Klinik: toska kehijauan dan putih bersih.
  klinik: {latar: ['#F2FBF8', '#A9DDD3', '#5BA9A0'], sorot: '#FFFFFF', sorotKuat: 0.45, rona: '#A7E0D6', ronaKuat: 0.14, vinyet: '#0E3533', vinyetKuat: 0.38, bokeh: '#FFFFFF', butir: 0.05},
  // Skala mikro di dalam tubuh, misalnya celah saraf: ungu tua dengan bokeh lila.
  saraf: {latar: ['#5E3C8F', '#2F1B56', '#120A26'], sorot: '#E9DBFF', sorotKuat: 0.5, rona: '#9C7BD6', ronaKuat: 0.12, vinyet: '#07030F', vinyetKuat: 0.7, bokeh: '#C9A8FF', butir: 0.07},
  // Malam di dalam rumah: biru tua dengan cahaya bulan tipis dari jendela.
  malam: {latar: ['#3A4470', '#1D2342', '#0A0D1C'], sorot: '#C9D8FF', sorotKuat: 0.45, rona: '#5B6BA8', ronaKuat: 0.42, vinyet: '#03040C', vinyetKuat: 0.78, bokeh: '#8FA6E6', butir: 0.09},
} satisfies Record<string, Suasana>;

export type NamaSuasana = keyof typeof SUASANA;

// Bahan perabot: permukaan atas, sisi depan, bayangan, dan serat.
export type Bahan = {atas: string; sisi: string; gelap: string; serat: string};
export const BAHAN = {
  kayu: {atas: '#D49A62', sisi: '#A86F43', gelap: '#7A4C2E', serat: 'rgba(110,62,30,0.18)'},
  kayuTua: {atas: '#9A6644', sisi: '#74472F', gelap: '#4E2E1E', serat: 'rgba(40,20,10,0.22)'},
  dapur: {atas: '#E9E4DA', sisi: '#6E8F8A', gelap: '#4D6965', serat: 'rgba(120,110,95,0.12)'},
  batu: {atas: '#56627A', sisi: '#353E52', gelap: '#20263A', serat: 'rgba(255,255,255,0.05)'},
  putih: {atas: '#F4F7F6', sisi: '#CAD8D5', gelap: '#9BB2AE', serat: 'rgba(80,120,115,0.08)'},
} satisfies Record<string, Bahan>;

export type NamaBahan = keyof typeof BAHAN;

// Interior: dinding atas, dinding bawah, lantai, list lantai, dan warna aksen perabot.
export type WarnaInterior = {dinding: string; dindingBawah: string; lantai: string; lantaiGaris: string; list: string; aksen: [string, string, string]};
export const INTERIOR = {
  kerja: {dinding: '#E9C9A2', dindingBawah: '#D9AF86', lantai: '#8E5F41', lantaiGaris: 'rgba(40,20,10,0.18)', list: '#C69A70', aksen: ['#5E7F8F', '#E8734F', '#F2D59B']},
  kamar: {dinding: '#B9B6DA', dindingBawah: '#A29FCB', lantai: '#7B6A86', lantaiGaris: 'rgba(30,20,40,0.18)', list: '#9490BF', aksen: ['#F2D59B', '#6F8FB8', '#E8A0A8']},
  dapur: {dinding: '#EFE3CC', dindingBawah: '#E2D2B4', lantai: '#B58E6A', lantaiGaris: 'rgba(60,40,20,0.16)', list: '#D4C1A0', aksen: ['#6E8F8A', '#E8734F', '#F4EEE2']},
  kafe: {dinding: '#6B4A3C', dindingBawah: '#563A2F', lantai: '#3E2A22', lantaiGaris: 'rgba(0,0,0,0.2)', list: '#4A3128', aksen: ['#E9B36A', '#2F4A45', '#F4EEE2']},
  klinik: {dinding: '#E6F3F0', dindingBawah: '#BFE0DA', lantai: '#9CC9C1', lantaiGaris: 'rgba(30,90,85,0.16)', list: '#7DB9AF', aksen: ['#2E8C84', '#FFFFFF', '#F2B84B']},
  // Warung makan: dinding kuning hangat, lambri hijau, aksen merah.
  warung: {dinding: '#F2C46B', dindingBawah: '#5E9F8E', lantai: '#9A6A48', lantaiGaris: 'rgba(40,20,10,0.18)', list: '#4E8577', aksen: ['#2E6E66', '#E5483D', '#FFF6EA']},
} satisfies Record<string, WarnaInterior>;

// Kaca jendela: langit luar sore dan bingkai.
export const JENDELA = {langit: ['#FFD9A3', '#F2A578'], langitMalam: ['#1B2448', '#34407A'], bulan: '#F4EEE2', bingkai: '#F4EEE2', kilap: 'rgba(255,255,255,0.35)'};
// Punggung buku di rak, berulang dalam urutan ini.
export const BUKU = ['#5E7F8F', '#E8734F', '#F2D59B', '#7E9C6B', '#B57A9C', '#3E4E6E'];
// Daun tanaman: gelap dan terang.
export const DAUN = ['#4E7D4E', '#6F9F5E'];
// Bayangan kontak di bawah benda.
export const BAYANG_KONTAK = 'rgba(30,14,8,0.32)';

// Properti.
export const PROPERTI = {
  keramik: '#F4EEE2',
  keramikBayang: '#D8CBB6',
  cangkirAksen: '#E8734F',
  kopi: '#5A3424',
  kopiTerang: '#8A5A3C',
  busa: '#C99A6E',
  noda: 'rgba(110,62,32,0.42)',
  uap: 'rgba(255,255,255,0.55)',
  kaca: 'rgba(225,244,250,0.28)',
  kacaTepi: 'rgba(240,252,255,0.85)',
  kacaKilap: 'rgba(255,255,255,0.55)',
  garis: 'rgba(255,255,255,0.92)',
  labelLatar: '#FFFFFF',
  labelTeks: '#262B52',
  bubuk: '#F7F7F4',
  bubukBayang: '#D4D8DE',
  logam: '#C7CED8',
  logamGelap: '#8E98A8',
  pil: ['#F7F7F4', '#E6EAF0', '#BFD6EA'],
  pilGaris: 'rgba(90,100,120,0.35)',
  jam: '#E8734F',
  jamMuka: '#FFF6EA',
  // Juring jam yang sudah dilewati jarum jam (varian `sapu`), dan garis pemisah per jam.
  jamSapu: '#F7B99C',
  jamSapuGaris: '#FFF6EA',
  jarum: '#262B52',
  laptop: '#B7BFCB',
  laptopGelap: '#7D8796',
  layar: '#1D2738',
  cahayaLayar: '#BFE3FF',
  tuts: '#5F6878',
  piring: '#F4F7F6',
  piringBayang: '#CAD8D5',
  botol: 'rgba(120,190,170,0.75)',
  botolTutup: '#2E8C84',
  botolLabel: '#F4EEE2',
  ranjang: '#E9EEF2',
  ranjangRangka: '#8E98A8',
  selimut: '#7DB9AF',
  bantal: '#FFFFFF',
  papan: '#2E8C84',
  papanTeks: '#FFFFFF',
  kertas: '#FBF6EC',
  kertasGaris: 'rgba(90,110,150,0.25)',
  pena: '#3E4E6E',
  ponsel: '#262B35',
  lampu: '#3E4E6E',
  lampuCahaya: '#FFE6B0',
  ketel: '#E06A50',
  pintu: '#E9E1D2',
  pintuBayang: '#C9BEAA',
  cahayaPintu: '#FFF3CF',
  tanda: '#6FA8C8',
  tali: '#C9BEAA',
};

// Organ: daging, bayangan, kilau, dan pembuluh.
export const ORGAN = {
  jantung: {daging: '#D9475C', bayang: '#A82A44', kilau: 'rgba(255,220,225,0.5)', arteri: '#E8636F', vena: '#7A5FA8', lemak: '#F2C46B'},
  hati: {daging: '#A8443A', bayang: '#7E2C28', kilau: 'rgba(255,210,200,0.4)', empedu: '#7FA65A', pembuluh: '#C95A4E'},
  sel: 'rgba(255,190,200,0.5)',
};

// Celah saraf: membran sel, soket reseptor, dan ligan. Adenosin krem, kafein segi enam oranye.
export const MIKRO = {
  membran: '#C987B8',
  membranTerang: '#F2C4E2',
  membranGelap: '#8E4C86',
  membranAtas: '#7D4FA6',
  vesikel: '#B794E0',
  soket: '#4FB6B0',
  soketTerang: '#9EE3DA',
  soketLubang: '#1F3F4A',
  kaki: '#D9C3A0',
  adenosin: '#F3E3C3',
  adenosinBayang: '#D8BE92',
  kafein: '#F28C38',
  kafeinDalam: '#FFC27A',
  nyalaAdenosin: '#B7A6FF',
  nyalaKafein: '#FF8A2A',
  serpih: '#E9D2FF',
};

// Siluet tokoh tembus pandang: badan kebiruan samar, organ, dan pulsa jantung merah.
export const TEMBUS = {
  badan: 'rgba(170,205,255,0.16)',
  tepi: 'rgba(205,228,255,0.9)',
  rambut: 'rgba(170,205,255,0.1)',
  paru: '#F29BB0',
  rusuk: '#E6F0FF',
  otak: '#F7B8CF',
  lambung: '#F2C46B',
  pulsa: '#FF4A5E',
};

// Hati sebagai pabrik: ban berjalan, roda, mesin pemecah, dan serpih hasil pecah.
export const PABRIK = {
  ban: '#3E3550',
  banGaris: '#5E5373',
  roda: '#7A6E8E',
  mesin: '#F4EEE2',
  mesinGelap: '#8E98A8',
  palu: '#C7CED8',
  lampuNyala: '#7CE0A3',
  serpih: '#FFE2B8',
  pemisah: '#FFF6EA',
};

// Kartu pemisah bab: warna polos dengan garis miring.
export const KARTU = {latar: '#F4806D', garis: '#FFF6EA', tepi: '#262B52'};

// Sapuan pita yang lebih tenang untuk adegan set, supaya tidak mencolok setelah suasana gelap.
export const PITA_TENANG = ['#262B52', '#343C6E', '#4A5288'];

// Transisi cair: kilau, gelembung, dan buih di permukaan kopi.
export const CAIR = {kilau: 'rgba(255,236,214,0.32)', gelembung: 'rgba(255,226,196,0.5)', buih: '#C99A6E'};

// ---------------------------------------------------------------------------
// Tambahan pustaka untuk topik makanan dan rasa (dipakai pertama di episode pedas).
// ---------------------------------------------------------------------------

// Ekspresi rig: wajah memerah, keringat, air mata, dan lidah saat mulut megap.
export const RIG_MERAH = '#E5484D';
export const RIG_KERINGAT = '#BFE6FF';
export const RIG_KERINGAT_KILAU = '#FFFFFF';
export const RIG_LIDAH = '#E8707A';

// Makanan dan dapur.
export const MAKANAN = {
  cabai: '#D93A2F',
  cabaiGelap: '#A8261F',
  cabaiKilau: 'rgba(255,220,210,0.55)',
  cabaiHijau: '#5E9F3E',
  tangkai: '#4E7D3A',
  biji: '#F6D77A',
  daging: '#F4E3C8',
  sambal: '#C8321F',
  sambalTerang: '#E5583A',
  sambalBiji: '#F2C46B',
  cobek: '#5B5552',
  cobekGelap: '#3E3936',
  cobekTerang: '#7A726D',
  mangkok: '#F4EEE2',
  mangkokBayang: '#D8CBB6',
  mangkokAksen: '#4F86A8',
  kuah: '#E9A04A',
  kuahGelap: '#C97E30',
  mi: '#F5D27A',
  miGelap: '#DDB253',
  nasi: '#FBF8F0',
  nasiBayang: '#E6DFCF',
  sayur: '#6F9F5E',
  air: 'rgba(160,215,240,0.5)',
  airPermukaan: 'rgba(220,245,255,0.8)',
  susu: '#FBF7EE',
  susuBayang: '#E6DCC8',
  roti: '#E9B36A',
  rotiKerak: '#B07A3E',
  rotiGosong: '#4A2E22',
  rotiGosongKerak: '#2E1C15',
  asap: 'rgba(110,108,116,0.5)',
  logamTerang: '#E3E8EE',
  pemanggang: '#6FAFA8',
  pemanggangGelap: '#4E8C86',
  alarm: '#F4F7F6',
  alarmBayang: '#C9D2D6',
  alarmLampu: '#FF3B30',
  alarmLampuMati: '#8A4A46',
  alarmGelombang: '#FF6A5C',
  termoIsi: '#E5484D',
  termoSkala: 'rgba(38,43,82,0.55)',
  termoAman: 'rgba(124,224,163,0.55)',
  tv: '#262B35',
  tvRangka: '#3E4E6E',
  tvLayar: ['#3A5488', '#1C2848'],
  tvCahaya: '#9EC3FF',
  tvHujan: 'rgba(200,220,255,0.55)',
  tvSosok: '#0F1730',
  api: '#FF8A2A',
  apiInti: '#FFD45A',
  apiLuar: '#E5432C',
  batas: '#FF3B30',
  meter: '#F4EEE2',
  meterJalur: '#C9D2D6',
  meterIsi: '#E5583A',
  meterJarum: '#262B52',
  meterBayang: 'rgba(38,43,82,0.28)',
};

// Molekul rasa di skala mikro: kapsaisin merah dengan ekor, kasein susu putih bergumpal.
export const MOLEKUL = {
  kapsaisin: '#E8453C',
  kapsaisinDalam: '#FF9A6A',
  kapsaisinEkor: '#F28C38',
  nyalaKapsaisin: '#FF3B2F',
  panas: 'rgba(255,140,90,0.7)',
  kasein: '#FFF6EA',
  kaseinBayang: '#E6DCC8',
};

// Lidah di skala mikro: permukaan merah muda dengan papila.
export const LIDAH = {permukaan: '#E98A9A', terang: '#FFC2CC', gelap: '#B9566C', papila: '#F2A3B0'};

// Sinyal saraf: jalur samar, denyut terang, dan kilat di tujuan.
export const SINYAL = {jalur: 'rgba(255,214,190,0.4)', denyut: '#FFE08A', kilat: '#FF6A3D'};

// Wahana roller coaster di luar ruang: langit siang, awan, rel, tiang, dan gerbong.
export const WAHANA = {
  langit: ['#7FC8EC', '#CDEBF5'],
  awan: '#FFFFFF',
  bukit: ['#8CC77E', '#6FAE68'],
  rel: '#E5483D',
  relGelap: '#A8302A',
  bantalan: '#5E6878',
  tiang: '#F4EEE2',
  tiangBayang: '#C9CED6',
  gerbong: '#2E8C84',
  gerbongGelap: '#1F6660',
  gerbongAksen: '#FFD76A',
  garisLaju: 'rgba(255,255,255,0.7)',
};

// Layar belah: dua dunia berdampingan, kiri bahaya dan kanan aman.
export const BELAH = {kiri: ['#8E2A2C', '#4C1015'], kanan: ['#A9DDD3', '#5BA9A0'], garis: '#FFF6EA'};

// Warna transisi cair per bahan. `kopi` sama dengan transisi lama.
export const CAIR_BAHAN = {
  kopi: {isi: PROPERTI.kopi, terang: PROPERTI.kopiTerang, buih: CAIR.buih, kilau: CAIR.kilau, gelembung: CAIR.gelembung},
  sambal: {isi: '#C8321F', terang: '#E5583A', buih: '#F2C46B', kilau: 'rgba(255,220,200,0.3)', gelembung: 'rgba(255,200,170,0.5)'},
  susu: {isi: '#FBF7EE', terang: '#E6DCC8', buih: '#FFFFFF', kilau: 'rgba(255,255,255,0.5)', gelembung: 'rgba(200,190,170,0.5)'},
  // Cairan otak: bening kebiruan, untuk transisi ke skala sel otak.
  otak: {isi: '#5FA9CC', terang: '#9AD3EA', buih: '#DDF4FC', kilau: 'rgba(235,250,255,0.4)', gelembung: 'rgba(225,248,255,0.55)'},
};
export type NamaCair = keyof typeof CAIR_BAHAN;

// ---------------------------------------------------------------------------
// Tambahan pustaka untuk topik tidur dan otak (dipakai pertama di episode begadang).
// ---------------------------------------------------------------------------

// Wajah rig: cahaya layar ponsel dari bawah, dan kantung mata untuk mata sayu.
export const RIG_LAYAR = '#9FD4FF';
export const RIG_KANTUNG = 'rgba(120,70,90,0.35)';

// Barang kamar dan tidur.
export const TIDUR = {
  ponsel: '#262B35',
  ponselTepi: '#3E4E6E',
  layar: '#2B4C7E',
  layarTerang: '#9FD4FF',
  cahaya: '#BFE3FF',
  bantal: '#F4F7FB',
  bantalBayang: '#C9D3E3',
  selimut: '#6F8FB8',
  selimutTerang: '#8FAAD0',
  selimutGelap: '#4E6E98',
  kalender: '#FBF6EC',
  kalenderKepala: '#E5483D',
  kalenderCincin: '#8E98A8',
  kalenderBayang: '#D8CBB6',
  bulan: '#F2D59B',
  bulanBayang: '#D9B670',
  tikus: '#B8B0C2',
  tikusGelap: '#8F869C',
  tikusTelinga: '#F2A3B0',
  tikusEkor: '#E8A0A8',
};

// Papan penghitung: papan gelap, angka terang, dan kata satuan.
export const PENGHITUNG = {papan: '#1F2438', bingkai: '#3E4E6E', angka: '#FFF6EA', satuan: '#9FD4FF', segmen: 'rgba(159,212,255,0.25)', segmenNyala: '#9FD4FF'};

// Laboratorium tidur: dinding toska pucat, bilik bertirai, monitor gelombang tidur.
export const LAB = {
  dinding: '#DCEFEC',
  dindingBawah: '#B7DCD5',
  panel: '#EEF7F5',
  panelGaris: 'rgba(46,140,132,0.18)',
  tirai: '#7DB9AF',
  tiraiGelap: '#5BA9A0',
  rel: '#8E98A8',
  lantai: '#9CC9C1',
  lantaiGaris: 'rgba(30,90,85,0.16)',
  list: '#7DB9AF',
  monitor: '#262B35',
  monitorLayar: '#1D3B44',
  gelombang: '#7CE0A3',
  lampu: '#FFFFFF',
};

// Batang ukur vertikal: jalur kosong, isi per jenis ukuran, garis acuan, dan bayangan isi awal.
export const BATANG = {jalur: 'rgba(225,244,250,0.28)', tepi: 'rgba(240,252,255,0.85)', kemampuan: '#4FC3A1', kantuk: '#A98BE0', bahaya: '#E5583A', awal: 'rgba(255,255,255,0.55)', garis: '#FFFFFF'};
// Jalur batang di set yang terang (dinding lab), supaya batang kosong tetap terbaca sebagai nol. Garis acuan ikut gelap.
export const BATANG_TERANG = {jalur: 'rgba(38,43,82,0.08)', tepi: 'rgba(38,43,82,0.32)', garis: 'rgba(38,43,82,0.45)'};

// Pikotogram orang dalam grid, warna per kelompok.
export const ORANG = {kelompok: ['#7CE0A3', '#F2C46B', '#F28C6A'], polos: '#E6F0FF'};

// Coretan merah di atas label yang keliru.
export const CORET = '#E5483D';

// Tabung sampel darah di rak, tanpa botol minuman.
export const TABUNG = {kaca: 'rgba(225,244,250,0.35)', kacaTepi: 'rgba(240,252,255,0.9)', darah: '#B8323F', darahTerang: '#D9475C', tutup: '#6F8FB8', rak: '#C9D2D6', rakGelap: '#8E98A8'};

// Sel otak skala mikro: sel glia bercabang lila dengan satu inti, cairan di celah, dan limbah beta-amiloid yang disapu aliran.
export const OTAK = {
  sel: '#C3B1EC',
  selTerang: '#EDE6FF',
  selGelap: '#7C62B8',
  inti: '#4E3A86',
  cairan: '#6FB7D6',
  cairanTerang: '#B4E2F2',
  aliran: 'rgba(220,246,255,0.7)',
  limbah: '#F2B84B',
  limbahGelap: '#C98A2A',
  jaringan: '#7A3F75',
  // Garis ukur kecil di celah antar sel.
  ukur: '#FFFFFF',
};

// Organ yang menyala bergiliran di siluet tembus pandang.
export const TEMBUS_GILIRAN = {nyala: '#FFD27A', pembuluh: '#FF6A7A', pankreas: '#F2B84B', perut: '#F7C08A'};
