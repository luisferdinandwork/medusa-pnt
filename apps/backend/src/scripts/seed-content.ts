import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CONTENT_MODULE } from "../modules/content"
import ContentModuleService from "../modules/content/service"
import {
  ArticleData,
  ProductStoryData,
} from "../modules/content/types"
import { createArticleWorkflow } from "../workflows/create-article"
import { createProductStoryWorkflow } from "../workflows/create-product-story"
import { updateArticleWorkflow } from "../workflows/update-article"
import { updateProductStoryWorkflow } from "../workflows/update-product-story"

// Demo editorial for the SPECS storefronts. The copy is written for this
// project; the `sources` point at the public specs.id pages the topics map to,
// which is what an answer engine cites when it quotes an article.
// Safe to re-run: handles that already exist are skipped. Pass `refresh`
// (`npm run seed:content:refresh`) to overwrite those records with the copy and
// images below instead - edits made to them in the admin are replaced.

const SPECS = "https://www.specs.id"
const day = (iso: string) => new Date(`${iso}T09:00:00.000Z`)

// Editorial photos from Unsplash, free to use under the Unsplash License
// (https://unsplash.com/license). They are referenced on the Unsplash CDN, the
// same way the demo products reference specs.id, and cropped by URL: article
// covers 3:2 (the card ratio), story covers 21:9, section images 16:9.
// Picked without visible third-party sportswear logos. Replace any of them
// from the admin with the upload field.
const PHOTO = {
  ballOnGrass: "photo-1574629810360-7efbbe195018", // Emilio Garcia
  lacingUpAtHome: "photo-1643935272030-0dbc34b8fd29", // Adiel Gavish
  shoeCleaningKit: "photo-1636262899511-dc5865c774dc", // Ervan M Wirawan
  courtFromAbove: "photo-1712325485668-6b6830ba814e", // Nish Gupta
  dirtPitchUnderTree: "photo-1718908722252-1507de62e94a", // Yada Pongsirirushakun
  wornBoots: "photo-1783434423796-0c5401ee02ef", // Olumide Adekunle
  parkRun: "photo-1781254620490-f8354c9be644", // Ben Kupke
  trackLaneOne: "photo-1645847631200-21e35ce9be61", // Ben Soyka
  longRoad: "photo-1585623031551-4e8e808eaca3", // Emma
  turfAtNight: "photo-1487466365202-1afdb86c764e", // Jonathan Petersson
  pitchFromAbove: "photo-1546717003-caee5f93a9db", // Victor
  stadiumAtNight: "photo-1706675780107-7c43cc487928", // Alex Simpson
  pitchLine: "photo-1459865264687-595d652de67e", // Sandro Schuh
  futsalGoal: "photo-1553627220-92f0446b6a5f", // Marino Bobetic
  outdoorCourt: "photo-1598026878267-1f22ae804eac", // Ian Lee
  coveredCourtSunset: "photo-1695950695168-f4038b55a9ca", // Bayu Syaits
  seafrontRun: "photo-1767268536524-24933566e213", // Pana K
  lakesideTrail: "photo-1731846959520-fa904bc6f3c3", // Ayush Bhoyar
  raceStart: "photo-1784572468902-94d41afc5e51", // Margo Evardson
  trackStrides: "photo-1526676537331-7747bf8278fc", // Nicolas Hoizey
  racePack: "photo-1667781838690-5f32ea0ccea6", // Tong Su
  battleRopes: "photo-1785781048640-1658f69eca1d", // Ken Mathiasen
  trackStretch: "photo-1562771379-eafdca7a02f8", // Alora Griffiths
  trackSprint: "photo-1780319679390-9a8600c1355f", // Bohdan Hyrovych
} as const

const unsplash = (id: string, width: number, height: number) =>
  `https://images.unsplash.com/${id}?w=${width}&h=${height}&fit=crop&q=80&auto=format`
const articleCover = (id: string) => unsplash(id, 1600, 1067)
const storyCover = (id: string) => unsplash(id, 2100, 900)
const sectionImage = (id: string) => unsplash(id, 1400, 788)

const ARTICLES: ArticleData[] = [
  {
    handle: "panduan-memilih-sol-sepatu-bola-fg-ag-sg-tf",
    storefront_key: "specs-teamsport",
    title: "FG, AG, SG, atau TF? Panduan memilih sol sepatu bola",
    subtitle: "Empat huruf yang menentukan cengkeraman, kenyamanan, dan umur sepatumu",
    excerpt:
      "Salah sol bukan cuma bikin licin - itu cara tercepat merusak sepatu dan lutut. Ini cara membaca kode FG, AG, SG, dan TF, lalu mencocokkannya dengan lapangan yang paling sering kamu pakai.",
    category: "Panduan",
    tags: ["sepatu bola", "sol", "fg", "ag", "tf"],
    author_name: "Tim Editorial SPECS",
    author_role: "Teamsport",
    read_minutes: 7,
    status: "published",
    published_at: day("2026-08-04"),
    is_featured: true,
    rank: 1,
    cover_image_url: articleCover(PHOTO.ballOnGrass),
    cover_image_alt: "Pemain menggiring bola di atas rumput alami",
    seo_title: "FG, AG, SG, TF: Cara Memilih Sol Sepatu Bola yang Tepat",
    seo_description:
      "Panduan lengkap memilih sol sepatu bola: FG untuk rumput alami, AG untuk sintetis, SG untuk lapangan basah, TF untuk rumput karpet. Lengkap dengan tabel dan FAQ.",
    seo_keywords: [
      "sol sepatu bola",
      "perbedaan fg ag sg tf",
      "sepatu bola rumput sintetis",
      "sepatu bola specs",
    ],
    geo_locale: "id-ID",
    geo_target_area: "Indonesia",
    answer_summary:
      "Pilih FG untuk rumput alami yang terawat, AG untuk rumput sintetis, SG untuk lapangan basah dan berlumpur, dan TF untuk rumput karpet atau lapangan mini. Memakai FG di rumput sintetis adalah kesalahan paling umum: stud yang lebih panjang dan jarang tertahan di serat sintetis sehingga beban pindah ke lutut dan pelat sol lebih cepat retak.",
    key_takeaways: [
      "FG (Firm Ground): rumput alami terawat. Stud sedang, paling serbaguna di Indonesia.",
      "AG (Artificial Ground): rumput sintetis. Stud lebih pendek dan lebih banyak, meredam hentakan.",
      "SG (Soft Ground): lapangan basah dan gembur. Stud panjang, sering berbahan logam.",
      "TF (Turf): rumput karpet dan lapangan mini. Ratusan tonjolan kecil, paling awet di permukaan keras.",
      "Satu sepatu tidak bisa menutup semua permukaan. Kalau bermain di dua permukaan berbeda, dua pasang lebih murah daripada satu pasang yang rusak dalam tiga bulan.",
    ],
    faqs: [
      {
        question: "Apakah sepatu FG boleh dipakai di rumput sintetis?",
        answer:
          "Boleh sesekali, tapi tidak disarankan sebagai kebiasaan. Stud FG lebih panjang dan jumlahnya lebih sedikit, sehingga tekanan menumpuk di beberapa titik. Di rumput sintetis yang padat, stud tidak menembus permukaan dan gaya balik diteruskan ke lutut serta pelat sol.",
      },
      {
        question: "Sol apa yang paling cocok untuk lapangan di Indonesia?",
        answer:
          "FG untuk lapangan rumput alami yang dirawat, dan AG untuk lapangan sewaan berumput sintetis yang kini paling umum di kota besar. Kalau kamu bermain di keduanya, mulai dari AG karena lebih aman dipakai di rumput alami dibanding sebaliknya.",
      },
      {
        question: "Berapa lama umur sepatu bola dipakai rutin?",
        answer:
          "Dengan pemakaian dua sampai tiga kali seminggu, sepatu bola umumnya bertahan enam sampai dua belas bulan. Umur itu memendek drastis kalau sol dipakai di permukaan yang salah atau sepatu disimpan dalam keadaan lembap.",
      },
    ],
    sources: [
      { label: "SPECS Football Footwear", url: `${SPECS}/football/footwear.html` },
      { label: "SPECS Lightspeed Reborn", url: `${SPECS}/lightspeed-reborn.html` },
    ],
    related_product_handles: [
      "specs-accelerator-illuzion-4-elite-fg",
      "specs-lightspeed-reborn-meta-sl-fg",
      "specs-galactica-morph-nv-fg",
    ],
    related_category_handles: ["sepatu-bola"],
    content: `## Kenapa kode sol lebih penting daripada warna

Setiap sepatu bola punya dua huruf di belakang namanya. Huruf itu bukan varian warna atau nomor seri - itu keterangan permukaan. Sol dirancang untuk satu jenis lapangan, dan memakainya di lapangan lain mengubah cara gaya diteruskan dari tanah ke kaki.

Kesalahan yang paling sering kami lihat di toko: pemain membeli sepatu FG karena itu yang dipakai pemain profesional di televisi, lalu memakainya tiga kali seminggu di lapangan sewaan berumput sintetis. Dalam empat bulan pelat solnya retak dan pemainnya mengeluh lutut nyeri setelah bermain.

## Empat kode yang perlu kamu tahu

### FG - Firm Ground

Stud berukuran sedang, jumlahnya sekitar sebelas sampai tiga belas, dengan bentuk campuran bulat dan bilah. Dibuat untuk rumput alami yang dipotong dan dirawat. Ini sol paling serbaguna dan paling banyak tersedia.

Pilih FG kalau lapangan utamamu rumput alami, atau kalau kamu bermain di banyak tempat dan hanya ingin satu pasang.

### AG - Artificial Ground

Stud lebih pendek, lebih banyak, dan tersebar lebih rata. Serat rumput sintetis tidak memberi ruang bagi stud panjang, jadi AG memindahkan beban ke lebih banyak titik. Hasilnya: hentakan lebih teredam dan sol tidak memuntir kaki saat berbalik.

Kalau kamu menyewa lapangan mini berumput sintetis - yang sekarang jadi mayoritas di kota besar - ini sol yang kamu cari.

### SG - Soft Ground

Stud panjang, jumlahnya sedikit, sering berbahan logam dan bisa dilepas. Dibuat untuk lapangan basah dan gembur di musim hujan. Di lapangan kering, stud sepanjang ini justru menancap terlalu dalam dan menahan kaki saat badan sudah berputar.

Di Indonesia, SG masuk akal untuk lapangan tanah berumput yang becek setelah hujan deras - bukan untuk pemakaian harian.

### TF - Turf

Bukan stud, melainkan puluhan sampai ratusan tonjolan karet kecil. Dibuat untuk rumput karpet, lapangan mini beralas keras, dan sesi latihan di permukaan kasar. TF adalah sol paling awet karena tidak ada titik tekanan tunggal yang menahan seluruh beban.

## Cara memutuskan dalam satu menit

Jawab tiga pertanyaan:

1. **Di mana kamu bermain paling sering?** Bukan di mana kamu ingin bermain - di mana kamu benar-benar bermain minggu lalu.
2. **Permukaannya keras atau empuk saat kamu menekan dengan tumit?** Sintetis padat dan karpet terasa keras; rumput alami terawat terasa memberi.
3. **Berapa kali seminggu?** Di bawah sekali seminggu, satu pasang FG cukup. Tiga kali atau lebih, cocokkan sol dengan permukaannya.

> Kalau kamu bermain di dua permukaan yang berbeda setiap minggu, dua pasang sepatu menengah hampir selalu lebih murah daripada satu pasang mahal yang rusak dalam satu musim.

## Merawat sol supaya umurnya penuh

Bersihkan sisa rumput dan tanah dari sela stud setiap selesai bermain - sisa tanah yang mengering menahan kelembapan di pangkal stud. Jangan dijemur di bawah matahari langsung; lem antara sol dan upper adalah bagian yang paling cepat menyerah pada panas. Simpan dalam keadaan kering dan longgarkan talinya supaya bentuk upper tidak terpaksa.

Kalau tonjolan TF sudah rata atau ujung stud FG membulat, cengkeraman sudah hilang lebih dulu sebelum sepatunya kelihatan rusak. Itu waktunya ganti.`,
  },
  {
    handle: "panduan-ukuran-sepatu-specs",
    storefront_key: null,
    title: "Panduan ukuran sepatu SPECS: ukur kaki sendiri di rumah",
    subtitle: "Kertas, pensil, penggaris, lima menit",
    excerpt:
      "Nomor sepatu bukan angka universal. Ini cara mengukur panjang kaki di rumah, membaca tabel ukuran SPECS, dan menentukan kapan sebaiknya naik setengah nomor.",
    category: "Ukuran",
    tags: ["ukuran", "panduan", "fitting"],
    author_name: "Tim Editorial SPECS",
    author_role: "Customer Experience",
    read_minutes: 5,
    status: "published",
    published_at: day("2026-08-12"),
    rank: 2,
    cover_image_url: articleCover(PHOTO.lacingUpAtHome),
    cover_image_alt: "Pria duduk di sofa sambil mengikat tali sepatunya",
    seo_title: "Panduan Ukuran Sepatu SPECS - Cara Ukur Kaki di Rumah",
    seo_description:
      "Cara mengukur panjang kaki dengan kertas dan penggaris, membaca tabel ukuran SPECS, dan menentukan kapan perlu naik setengah nomor.",
    seo_keywords: [
      "ukuran sepatu specs",
      "cara mengukur kaki",
      "size chart sepatu bola",
    ],
    geo_locale: "id-ID",
    geo_target_area: "Indonesia",
    answer_summary:
      "Ukur panjang telapak kaki pada sore hari dengan berdiri di atas kertas, tandai tumit dan ujung jari terpanjang, lalu tambahkan 5-10 mm sebagai ruang gerak. Cocokkan hasilnya dengan tabel ukuran SPECS. Naik setengah nomor kalau kakimu lebar, kalau memakai kaos kaki tebal, atau kalau selisih ukuran ada di batas antara dua nomor.",
    key_takeaways: [
      "Ukur sore atau malam hari - kaki memuai sampai sekitar 4% setelah seharian beraktivitas.",
      "Ukur kedua kaki dan pakai yang lebih panjang sebagai acuan.",
      "Sisakan 5-10 mm antara jari terpanjang dan ujung sepatu.",
      "Sepatu bola dipakai lebih pas daripada sepatu lari; sepatu lari butuh ruang lebih karena kaki memuai saat lari jauh.",
      "Kalau hasil ukur jatuh di antara dua nomor, ambil nomor yang lebih besar.",
    ],
    faqs: [
      {
        question: "Bagaimana cara mengukur kaki untuk membeli sepatu online?",
        answer:
          "Tempelkan kertas ke dinding, berdiri dengan tumit menempel dinding di atas kertas, lalu tandai titik terdepan jari terpanjang. Ukur jarak dari tepi kertas ke tanda itu dalam milimeter, tambahkan 5-10 mm, dan cocokkan dengan tabel ukuran.",
      },
      {
        question: "Apakah ukuran sepatu bola sama dengan sepatu lari?",
        answer:
          "Tidak selalu. Sepatu bola dirancang membungkus kaki lebih rapat agar kontak dengan bola lebih terasa, sementara sepatu lari memberi ruang ekstra di bagian depan. Banyak pemain memakai sepatu lari setengah nomor lebih besar daripada sepatu bolanya.",
      },
      {
        question: "Kalau sepatunya terasa sempit, apakah akan melar?",
        answer:
          "Upper rajut dan sintetis akan menyesuaikan sedikit setelah beberapa kali pemakaian, tapi panjang sol tidak berubah. Kalau jari sudah menyentuh ujung sepatu saat berdiri, ukurannya memang terlalu kecil.",
      },
    ],
    sources: [
      { label: "SPECS Footwear", url: `${SPECS}/footwear-all.html` },
      { label: "SPECS Running Footwear", url: `${SPECS}/running/footwear.html` },
    ],
    related_category_handles: ["sepatu-bola", "sepatu-running"],
    content: `## Kenapa nomor sepatu tidak bisa dipercaya sendirian

Nomor 42 di satu merek bisa berarti 265 mm, di merek lain 270 mm. Yang tetap hanya satu: panjang kakimu dalam milimeter. Ukur sekali, catat angkanya, dan kamu bisa membeli sepatu apa pun secara online tanpa menebak.

## Lima menit dengan kertas dan penggaris

1. **Pilih waktunya.** Ukur sore atau malam. Kaki memuai setelah seharian berdiri dan berjalan - kalau kamu mengukur pagi hari, hasilnya bisa lebih pendek beberapa milimeter dari kaki yang sebenarnya akan memakai sepatu itu.
2. **Pakai kaos kaki yang akan kamu pakai bermain.** Kaos kaki bola yang tebal memakan ruang lebih banyak daripada kaos kaki harian.
3. **Tempel kertas ke dinding.** Letakkan selembar kertas di lantai dengan salah satu sisinya rapat ke dinding.
4. **Berdiri, jangan duduk.** Tumit menempel dinding, berat badan bertumpu normal di kedua kaki. Kaki yang menahan beban lebih panjang daripada kaki yang menggantung.
5. **Tandai dan ukur.** Minta bantuan orang lain menandai titik terdepan jari terpanjang - belum tentu jempol. Ukur dari tepi kertas ke tanda itu.
6. **Ulangi untuk kaki satunya.** Hampir semua orang punya dua kaki dengan panjang berbeda. Pakai yang lebih panjang.

## Menambahkan ruang gerak

Angka hasil ukur adalah panjang kaki, bukan panjang sepatu yang kamu butuhkan.

- **Sepatu bola dan futsal:** tambahkan 5 sampai 8 mm. Sepatu bola memang dipakai rapat supaya sentuhan bola terasa.
- **Sepatu lari:** tambahkan 8 sampai 12 mm. Kaki memuai saat lari jauh, dan jari yang menabrak ujung sepatu di kilometer kelima akan kehilangan kuku di kilometer kesepuluh.
- **Sepatu harian dan lifestyle:** tambahkan sekitar 10 mm.

## Kapan naik setengah nomor

Ambil nomor yang lebih besar kalau salah satu ini benar:

- Hasil ukurmu jatuh persis di antara dua nomor.
- Punggung kakimu tinggi atau telapakmu lebar.
- Kamu memakai kaos kaki kompresi atau kaos kaki tebal.
- Kamu membeli untuk anak yang masih tumbuh - tapi jangan lebih dari satu nomor, sepatu yang kebesaran membuat kaki bergeser dan menimbulkan lecet.

## Kalau ternyata tetap meleset

Ukuran yang salah bisa ditukar dalam 30 hari selama sepatu belum dipakai di luar ruangan dan label masih terpasang. Coba sepatu baru di rumah, berjalan di lantai bersih, dan rasakan tumitnya: tumit yang terangkat saat melangkah berarti sepatunya kebesaran, bukan kekecilan.`,
  },
  {
    handle: "merawat-sepatu-futsal-agar-awet",
    storefront_key: null,
    title: "Enam langkah merawat sepatu futsal supaya tahan dua kali lebih lama",
    subtitle: "Yang merusak sepatu bukan lapangan - tapi cara menyimpannya",
    excerpt:
      "Sebagian besar sepatu futsal mati bukan karena aus, tapi karena dijemur, disikat kasar, dan disimpan basah di dalam tas. Enam kebiasaan yang mengubah umur pakainya.",
    category: "Perawatan",
    tags: ["perawatan", "futsal", "tips"],
    author_name: "Tim Editorial SPECS",
    author_role: "Teamsport",
    read_minutes: 4,
    status: "published",
    published_at: day("2026-08-19"),
    rank: 3,
    cover_image_url: articleCover(PHOTO.shoeCleaningKit),
    cover_image_alt: "Sepasang sepatu putih di samping sikat dan cairan pembersih",
    seo_title: "Cara Merawat Sepatu Futsal Agar Awet - 6 Langkah",
    seo_description:
      "Cara membersihkan, mengeringkan, dan menyimpan sepatu futsal agar sol karet dan upper rajut tidak cepat rusak.",
    seo_keywords: [
      "merawat sepatu futsal",
      "cara mencuci sepatu futsal",
      "sepatu futsal awet",
    ],
    geo_locale: "id-ID",
    geo_target_area: "Indonesia",
    answer_summary:
      "Jangan pernah menjemur sepatu futsal di bawah matahari langsung atau mencucinya di mesin cuci - panas dan putaran drum melepaskan lem antara sol dan upper. Bersihkan dengan lap lembap dan sikat lembut, keringkan di tempat teduh berangin dengan kertas di dalamnya, dan keluarkan dari tas segera setelah bermain.",
    key_takeaways: [
      "Keluarkan sepatu dari tas dalam satu jam setelah bermain - kelembapan terkunci adalah penyebab bau dan lem terkelupas.",
      "Bersihkan dengan lap lembap dan sikat berbulu lembut, bukan sikat cuci baju.",
      "Keringkan di tempat teduh berangin, isi dengan kertas koran untuk menyerap lembap dan menjaga bentuk.",
      "Jangan dijemur, jangan pakai hair dryer, jangan masuk mesin cuci.",
      "Lepas tali sepatu setiap kali disimpan agar lidah sepatu tidak tertekuk permanen.",
    ],
    faqs: [
      {
        question: "Bolehkah sepatu futsal dicuci di mesin cuci?",
        answer:
          "Tidak. Putaran drum memukul sol terhadap dinding mesin dan air panas melunakkan lem yang menyatukan sol dengan upper. Sepatu bisa terlihat bersih setelah sekali dicuci lalu terkelupas pada pemakaian berikutnya.",
      },
      {
        question: "Bagaimana menghilangkan bau di sepatu futsal?",
        answer:
          "Keringkan sampai benar-benar kering - bau berasal dari bakteri yang hidup di kelembapan. Lepas insole setelah bermain, taburkan sedikit baking soda semalaman, lalu bersihkan. Memakai dua pasang bergantian memberi waktu setiap pasang benar-benar kering.",
      },
    ],
    sources: [
      { label: "SPECS Futsal Footwear", url: `${SPECS}/futsal/footwear.html` },
    ],
    related_product_handles: [
      "specs-metasala-nativ-re-black-gold",
      "specs-accelerator-illuzion-4-pro-in",
    ],
    related_category_handles: ["sepatu-futsal"],
    content: `## Yang sebenarnya membunuh sepatu futsal

Sol karet indoor dibuat untuk digesek di lantai vinyl - itu pekerjaannya, dan dia sanggup. Yang tidak sanggup dia lawan adalah panas, air yang tertinggal, dan tekanan bentuk yang salah selama berhari-hari di dalam tas.

## Enam langkah

### 1. Keluarkan dari tas dalam satu jam

Ini langkah yang paling sering dilewati dan paling menentukan. Sepatu basah keringat di dalam tas tertutup adalah ruang lembap hangat selama semalam. Bakteri tumbuh, lem melunak, dan lapisan dalam mulai lepas.

### 2. Bersihkan selagi kotorannya belum kering

Lap lembap untuk upper, sikat berbulu lembut untuk sela sol. Kotoran yang sudah mengering butuh tenaga lebih untuk dilepas, dan tenaga lebih itu yang merusak lapisan permukaan.

### 3. Lepas insole dan tali

Keduanya mengeringkan bagian yang paling lambat kering. Tali yang tetap terikat juga menahan lidah sepatu dalam posisi tertekuk sampai bentuknya permanen.

### 4. Keringkan di tempat teduh berangin

Isi bagian dalam dengan kertas koran atau kain kering. Ganti kertasnya setelah beberapa jam kalau sepatunya basah sekali. Angin lebih penting daripada panas.

### 5. Jangan pernah gunakan panas langsung

Matahari langsung, hair dryer, dan lantai dekat kompor sama-sama memberi efek yang sama: lem menyerah dan upper sintetis mengeras lalu retak di titik lipatan.

### 6. Simpan dengan bentuk yang benar

Berdirikan atau letakkan mendatar, jangan ditumpuk di bawah barang berat. Kalau punya kotak, beri lubang udara - sepatu yang disegel rapat di ruang lembap akan berjamur.

> Pemain yang bermain lebih dari dua kali seminggu sebaiknya punya dua pasang. Bukan soal gaya - itu memberi setiap pasang 48 jam untuk benar-benar kering, dan itu kira-kira menggandakan umur keduanya.`,
  },
  {
    handle: "memilih-sepatu-futsal-untuk-lapangan-vinyl",
    storefront_key: "specs-teamsport",
    title: "Lapangan vinyl, parket, atau semen? Begini memilih sepatu futsalnya",
    subtitle: "Sol IN bukan satu-satunya pilihan, dan bukan selalu yang benar",
    excerpt:
      "Lapangan futsal di Indonesia jarang seragam. Ini cara membaca permukaan lapangan langgananmu dan memilih sol yang tidak membuatmu tergelincir di menit kesepuluh.",
    category: "Panduan",
    tags: ["futsal", "sol", "panduan"],
    author_name: "Tim Editorial SPECS",
    author_role: "Teamsport",
    read_minutes: 5,
    status: "published",
    published_at: day("2026-08-26"),
    rank: 4,
    cover_image_url: articleCover(PHOTO.courtFromAbove),
    cover_image_alt: "Lapangan futsal berlantai sintetis merah dan biru dilihat dari atas",
    seo_title: "Memilih Sepatu Futsal untuk Lapangan Vinyl, Parket & Semen",
    seo_description:
      "Panduan memilih sol sepatu futsal sesuai permukaan lapangan: vinyl, parket kayu, semen, dan rumput sintetis indoor.",
    seo_keywords: [
      "sepatu futsal lapangan vinyl",
      "sol in futsal",
      "sepatu futsal terbaik",
    ],
    geo_locale: "id-ID",
    geo_target_area: "Indonesia",
    answer_summary:
      "Untuk lapangan vinyl dan parket kayu, pilih sol IN (indoor) berbahan karet non-marking dengan pola pivot di bawah telapak depan. Untuk lapangan semen kasar, pilih karet yang lebih tebal dan keras karena semen mengikis sol dua sampai tiga kali lebih cepat. Untuk rumput sintetis indoor, sol TF lebih aman daripada IN.",
    key_takeaways: [
      "Vinyl dan parket: sol IN karet non-marking, pola pivot melingkar di telapak depan.",
      "Semen: cari karet outsole yang lebih tebal - semen mengikis sol jauh lebih cepat.",
      "Rumput sintetis indoor: TF, bukan IN. Sol datar tidak menggigit serat sintetis.",
      "Sol non-marking wajib di banyak lapangan sewaan; cek sebelum datang.",
      "Sol yang sudah licin mengkilap tidak bisa dipulihkan - itu tanda karetnya sudah habis.",
    ],
    faqs: [
      {
        question: "Apa itu sol non-marking?",
        answer:
          "Karet yang tidak meninggalkan garis hitam di lantai. Sebagian besar lapangan futsal indoor mensyaratkannya karena bekas sol sulit dibersihkan dari vinyl dan parket.",
      },
      {
        question: "Bisakah sepatu futsal dipakai di lapangan semen?",
        answer:
          "Bisa, tapi umurnya jauh lebih pendek. Permukaan semen bersifat abrasif dan mengikis pola sol dalam hitungan minggu kalau dipakai rutin. Kalau lapangan utamamu semen, pilih model dengan outsole lebih tebal dan anggap solnya barang habis pakai.",
      },
      {
        question: "Apa bedanya sol IN dengan TF?",
        answer:
          "IN datar dengan pola gesek untuk lantai keras; TF punya banyak tonjolan karet kecil untuk menggigit rumput karpet. Di lantai vinyl, TF terasa mengganjal; di rumput sintetis, IN terasa licin.",
      },
    ],
    sources: [
      { label: "SPECS Futsal", url: `${SPECS}/futsal.html` },
      { label: "SPECS Street Soccer", url: `${SPECS}/street-soccer.html` },
    ],
    related_product_handles: [
      "specs-metasala-nativ-re-white-teal-silver",
      "specs-accelerator-alpha-fury-pro-in",
      "specs-accelerator-lightspeed-4-nitro-pro-in",
    ],
    related_category_handles: ["sepatu-futsal"],
    content: `## Tiga permukaan, tiga perilaku yang berbeda

Sewa lapangan futsal di Indonesia bisa berarti tiga hal yang sangat berbeda: vinyl yang dipasang di atas beton, parket kayu di gedung olahraga lama, atau semen yang dicat garis. Sol yang bekerja sempurna di salah satunya bisa berbahaya di yang lain.

### Vinyl

Permukaan paling umum di lapangan komersial. Halus, sedikit memberi, dan cepat licin kalau berdebu. Yang kamu butuhkan: karet non-marking dengan pola pivot melingkar di bawah telapak depan, supaya kaki bisa berputar tanpa menahan lutut.

### Parket kayu

Lebih menggigit daripada vinyl, terutama saat kering. Sol yang terlalu lengket di parket justru membuat kaki berhenti lebih cepat daripada badan. Karet dengan kekerasan sedang bekerja paling baik.

### Semen

Abrasif. Sol IN tipis bisa kehilangan pola dalam enam sampai delapan minggu pemakaian rutin. Kalau ini lapangan langgananmu, cari model dengan karet outsole lebih tebal, dan perlakukan sol sebagai komponen habis pakai.

### Rumput sintetis indoor

Bukan wilayah IN. Sol datar tidak menggigit serat sintetis, dan kamu akan merasa selip di setiap perubahan arah. Pakai TF.

## Membaca sol sebelum membeli

Balik sepatunya dan lihat tiga hal:

1. **Pola pivot.** Lingkaran atau spiral di bawah telapak depan berarti sepatu dirancang untuk berputar di tempat - gerakan paling sering dalam futsal.
2. **Ketebalan karet di tepi luar.** Bagian ini yang pertama habis pada pemain yang sering bergerak menyamping.
3. **Kelenturan di sepertiga depan.** Tekuk sepatunya dengan tangan. Kalau tidak mau menekuk di garis jari kaki, sol akan melawan setiap langkahmu.

## Tanda solmu sudah habis

Permukaan karet yang tadinya bertekstur berubah mengkilap dan halus. Tidak ada cara memulihkannya - mengamplas hanya menghabiskan sisa karetnya. Saat kamu mulai menahan langkah karena tidak percaya pada cengkeraman, kamu sudah bermain lebih pelan daripada kemampuanmu.`,
  },
  {
    handle: "dari-lapangan-kampung-ke-rumput-stadion",
    storefront_key: null,
    title: "Dari lapangan kampung ke rumput stadion",
    subtitle: "Rizky bermain tanpa sepatu sampai umur dua belas",
    excerpt:
      "Musim ini ia mencetak sembilan gol di liga provinsi. Sepatunya sama dengan yang dipakai anak-anak di lapangan belakang rumahnya - dan itu bukan kebetulan.",
    category: "Cerita",
    tags: ["cerita", "komunitas", "sepakbola"],
    author_name: "Tim Editorial SPECS",
    author_role: "Field Stories",
    read_minutes: 6,
    status: "published",
    published_at: day("2026-09-02"),
    is_featured: true,
    rank: 0,
    cover_image_url: articleCover(PHOTO.dirtPitchUnderTree),
    cover_image_alt: "Anak-anak bermain bola di lapangan tanah di bawah pohon rindang",
    seo_title: "Dari Lapangan Kampung ke Rumput Stadion - Cerita Lapangan SPECS",
    seo_description:
      "Cerita Rizky, pemain muda liga provinsi yang belajar bola tanpa sepatu di lapangan tanah, dan apa yang berubah saat ia punya sepasang pertama.",
    seo_keywords: ["cerita sepakbola indonesia", "pemain muda", "specs"],
    geo_locale: "id-ID",
    geo_target_area: "Indonesia",
    answer_summary:
      "Cerita lapangan tentang pemain muda Indonesia yang belajar sepak bola di lapangan tanah tanpa sepatu, dan bagaimana sepasang sepatu yang tepat mengubah bukan bakatnya, tapi berapa lama ia bisa berlatih tanpa cedera.",
    key_takeaways: [
      "Bakat tumbuh di lapangan mana pun; yang membatasi biasanya jam latihan, bukan fasilitas.",
      "Sepatu yang tepat memperpanjang waktu latihan karena mengurangi cedera kecil yang berulang.",
      "Ukuran yang benar lebih penting daripada model yang mahal untuk pemain yang sedang tumbuh.",
    ],
    faqs: [
      {
        question: "Sepatu apa yang cocok untuk pemain muda yang baru mulai?",
        answer:
          "Model FG dengan harga menengah dan ukuran yang benar. Untuk pemain yang sedang tumbuh, ukuran yang pas jauh lebih menentukan daripada teknologi sol, dan sepatu yang kebesaran menimbulkan lecet yang memotong jam latihan.",
      },
    ],
    sources: [
      { label: "SPECS Indonesia", url: `${SPECS}/` },
      { label: "SPECS Football", url: `${SPECS}/football.html` },
    ],
    related_category_handles: ["sepatu-bola"],
    content: `## Lapangan yang bukan lapangan

Tempat Rizky belajar bermain tidak punya garis. Batasnya dua sandal di satu sisi dan pagar seng di sisi lain, dan permukaannya tanah yang keras di musim kemarau lalu berubah jadi kubangan dalam satu sore di bulan November.

Ia bermain tanpa sepatu sampai umur dua belas. Bukan pilihan gaya - tidak ada sepatu yang muat, dan yang muat harganya sama dengan penghasilan ayahnya selama dua minggu.

## Yang berubah dan yang tidak

Sepasang pertama datang dari pelatih SSB di kecamatan sebelah: FG bekas, satu nomor kebesaran, diisi kaos kaki dobel supaya tidak bergeser.

Yang tidak berubah: caranya membaca permainan, yang sudah terbentuk dari ratusan sore di lapangan tanpa garis.

Yang berubah: berapa lama ia bisa berlatih. Tanpa sepatu, sesi berhenti saat telapak kakinya mulai perih. Dengan sepatu - meski kebesaran - ia bisa menambah empat puluh menit setiap sore. Dikalikan enam hari seminggu, dikalikan tiga tahun.

> "Orang kira sepatu bikin saya lebih cepat," katanya. "Sepatu bikin saya bisa latihan lebih lama. Yang bikin cepat ya latihannya."

## Musim ini

Sembilan gol di liga provinsi, dari sayap kiri. Yang ia pakai sekarang bukan model paling mahal di katalog - itu model menengah yang juga dipakai anak-anak di lapangan belakang rumah ibunya, karena itu yang stoknya selalu ada di toko kabupaten dan ukurannya benar.

Ia masih pulang ke lapangan itu setiap libur. Sandal penanda gawang sudah diganti dua batang bambu. Permukaannya masih tanah.

## Kalau kamu sedang membelikan sepatu pertama

Tiga hal, urut dari yang paling penting:

1. **Ukuran yang benar.** Bukan ukuran yang "nanti muat". Sepatu kebesaran membuat kaki bergeser, dan lecet memotong jam latihan lebih efektif daripada apa pun.
2. **Sol yang cocok dengan lapangannya.** Lapangan tanah keras dan rumput alami: FG. Lapangan sewaan sintetis: AG.
3. **Model apa pun setelah itu.** Pemain umur empat belas tidak akan merasakan bedanya pelat karbon. Ia akan merasakan bedanya sepatu yang muat.`,
  },
  {
    handle: "kapan-ganti-sepatu-bola",
    storefront_key: "specs-teamsport",
    title: "Kapan sepatu bola harus diganti? Lima tanda yang tidak kelihatan",
    subtitle: "Sepatu bisa terlihat utuh dan tetap sudah habis",
    excerpt:
      "Upper masih mulus bukan berarti sepatunya masih layak. Lima indikator yang dipakai pelatih untuk memutuskan, dan satu tes sederhana yang bisa kamu lakukan di rumah.",
    category: "Perawatan",
    tags: ["perawatan", "sepatu bola", "tips"],
    author_name: "Tim Editorial SPECS",
    author_role: "Teamsport",
    read_minutes: 4,
    status: "published",
    published_at: day("2026-09-09"),
    rank: 5,
    cover_image_url: articleCover(PHOTO.wornBoots),
    cover_image_alt: "Sepatu bola yang sudah aus menginjak bola kotor di atas rumput",
    seo_title: "Kapan Sepatu Bola Harus Diganti? 5 Tanda Penting",
    seo_description:
      "Lima tanda sepatu bola sudah waktunya diganti: stud membulat, midsole tidak kembali, upper melar, jahitan tumit lepas, dan nyeri berulang.",
    seo_keywords: ["kapan ganti sepatu bola", "sepatu bola aus", "umur sepatu bola"],
    geo_locale: "id-ID",
    geo_target_area: "Indonesia",
    answer_summary:
      "Ganti sepatu bola kalau ujung stud sudah membulat, midsole tidak kembali setelah ditekan, upper melar sampai kaki bergeser di dalam sepatu, jahitan di tumit mulai lepas, atau kamu merasakan nyeri berulang di telapak dan lutut setelah bermain. Dengan pemakaian dua sampai tiga kali seminggu, umur normalnya enam sampai dua belas bulan.",
    key_takeaways: [
      "Stud yang ujungnya membulat kehilangan cengkeraman jauh sebelum sepatunya terlihat rusak.",
      "Tekan midsole dengan ibu jari: kalau bekasnya lambat kembali, peredamannya sudah mati.",
      "Upper yang melar membuat kaki bergeser - itu penyebab lecet dan sentuhan bola yang meleset.",
      "Nyeri berulang di telapak atau lutut setelah bermain sering kali soal sepatu, bukan soal latihan.",
      "Catat tanggal beli di dalam lidah sepatu; tebakan soal umur sepatu hampir selalu meleset.",
    ],
    faqs: [
      {
        question: "Berapa lama umur sepatu bola?",
        answer:
          "Dengan pemakaian dua sampai tiga kali seminggu, umumnya enam sampai dua belas bulan. Angka ini turun jauh kalau sol dipakai di permukaan yang salah, atau kalau sepatu sering disimpan dalam keadaan lembap.",
      },
      {
        question: "Apakah sepatu bola yang jarang dipakai tetap perlu diganti?",
        answer:
          "Ya. Busa midsole dan lem mengeras seiring waktu meski sepatunya disimpan. Sepatu yang menganggur lima tahun di lemari biasanya sudah kehilangan sebagian besar peredamannya sebelum dipakai sekali pun.",
      },
    ],
    sources: [
      { label: "SPECS Football Footwear", url: `${SPECS}/football/footwear.html` },
    ],
    related_product_handles: [
      "specs-xlr-4-fg",
      "specs-galactica-morph-nv-fg",
    ],
    related_category_handles: ["sepatu-bola"],
    content: `## Sepatu tidak memberi tahu kapan dia habis

Yang aus lebih dulu selalu bagian yang tidak kamu lihat: ujung stud, busa midsole, dan struktur tumit. Upper - satu-satunya bagian yang kamu perhatikan - justru sering jadi yang terakhir menyerah.

## Lima tanda

### 1. Ujung stud membulat

Stud baru punya tepi yang jelas. Stud yang aus ujungnya membulat seperti kerikil sungai. Bentuk itu tidak lagi menggigit tanah, dan kamu akan menyesuaikan dengan melangkah lebih hati-hati tanpa sadar.

### 2. Midsole tidak kembali

Tekan busa di bawah tumit dengan ibu jari selama tiga detik lalu lepas. Busa yang sehat kembali segera. Busa yang habis meninggalkan cekungan yang pulih perlahan - atau tidak pulih sama sekali.

### 3. Upper melar

Berdiri dengan sepatu terikat normal dan geser kaki ke kiri-kanan. Kalau kaki bergerak di dalam sepatu tanpa sepatunya ikut bergerak, upper sudah kehilangan bentuk. Itu penyebab lecet, dan penyebab sentuhan bola yang tidak sesuai niat.

### 4. Jahitan tumit mulai lepas

Bagian dalam tumit - heel counter - yang mulai terbuka berarti struktur yang menahan tumit sudah tidak utuh. Ini yang paling sering diabaikan dan paling cepat menimbulkan cedera pergelangan.

### 5. Nyeri yang datang setelah bermain, bukan saat bermain

Nyeri telapak kaki, tumit, atau lutut yang muncul beberapa jam setelah pertandingan dan hilang dalam sehari adalah pola khas peredaman yang sudah mati. Kalau polanya berulang tiga pertandingan berturut-turut, periksa sepatunya sebelum memeriksa latihannya.

## Satu kebiasaan kecil

Tulis tanggal pembelian dengan spidol di bagian dalam lidah sepatu. Enam bulan kemudian kamu tidak perlu menebak - dan kamu akan terkejut betapa sering tebakan meleset setengah tahun.`,
  },
  {
    handle: "memilih-sepatu-lari-untuk-pemula",
    storefront_key: "specs-run",
    title: "Sepatu lari pertama: yang perlu dan yang tidak perlu kamu bayar",
    subtitle: "Pelat karbon tidak akan membuat 5K pertamamu lebih mudah",
    excerpt:
      "Pemula sering membeli sepatu balapan dan berlari lebih lambat karenanya. Ini cara memilih sepatu lari pertama berdasarkan jarak, berat badan, dan permukaan - bukan berdasarkan iklan.",
    category: "Panduan",
    tags: ["running", "pemula", "panduan"],
    author_name: "Tim Editorial SPECS",
    author_role: "Run",
    read_minutes: 6,
    status: "published",
    published_at: day("2026-08-15"),
    is_featured: true,
    rank: 1,
    cover_image_url: articleCover(PHOTO.parkRun),
    cover_image_alt: "Pelari menyusuri jalur taman yang rindang",
    seo_title: "Panduan Memilih Sepatu Lari untuk Pemula",
    seo_description:
      "Cara memilih sepatu lari pertama: bantalan, drop, ukuran, dan permukaan. Plus kenapa sepatu race belum tentu cocok untuk pemula.",
    seo_keywords: [
      "sepatu lari pemula",
      "memilih sepatu lari",
      "sepatu lari harian",
    ],
    geo_locale: "id-ID",
    geo_target_area: "Indonesia",
    answer_summary:
      "Untuk sepatu lari pertama, pilih model daily trainer dengan bantalan sedang hingga tebal, ukuran 8-12 mm lebih panjang dari kaki, dan bobot 250-300 gram. Hindari sepatu race berpelat karbon: sol yang sangat responsif menuntut teknik dan kekuatan betis yang belum terbentuk pada pelari baru, dan justru memperbesar risiko cedera.",
    key_takeaways: [
      "Mulai dari daily trainer, bukan sepatu race. Pelat karbon dibuat untuk pelari yang sudah punya basis latihan.",
      "Sisakan 8-12 mm di depan jari - kaki memuai saat lari jauh.",
      "Bantalan lebih tebal lebih memaafkan untuk pelari berat badan lebih atau yang baru mulai.",
      "Satu pasang cukup sampai sekitar 30 km per minggu; di atas itu, rotasi dua pasang mengurangi cedera berulang.",
      "Ganti setelah 500-800 km, atau saat sol luar sudah menampakkan busa di bawahnya.",
    ],
    faqs: [
      {
        question: "Apakah pemula butuh sepatu dengan pelat karbon?",
        answer:
          "Tidak. Pelat karbon dirancang untuk mempertahankan efisiensi pada kecepatan tinggi dan menuntut betis serta tendon yang sudah terlatih. Pelari baru mendapat manfaat jauh lebih besar dari bantalan yang stabil dan ukuran yang benar.",
      },
      {
        question: "Berapa kilometer umur sepatu lari?",
        answer:
          "Umumnya 500 sampai 800 kilometer. Pelari dengan berat badan lebih besar atau yang sering berlari di aspal panas berada di ujung bawah rentang itu.",
      },
      {
        question: "Apakah sepatu lari bisa dipakai untuk latihan gym?",
        answer:
          "Untuk treadmill dan latihan ringan, ya. Untuk angkat beban dan gerakan menyamping, tidak - sol lari yang tebal mengurangi stabilitas saat menumpu beban.",
      },
    ],
    sources: [
      { label: "SPECS Running", url: `${SPECS}/running.html` },
      { label: "SPECS Running Footwear", url: `${SPECS}/running/footwear.html` },
    ],
    related_product_handles: ["specs-airglide", "specs-speedvolt"],
    related_category_handles: ["sepatu-running"],
    content: `## Masalahnya bukan kurang teknologi

Pelari baru yang berhenti dalam tiga bulan hampir tidak pernah berhenti karena sepatunya kurang canggih. Mereka berhenti karena nyeri tulang kering, lecet, atau kuku yang lepas - tiga hal yang semuanya berhubungan dengan ukuran dan bantalan, bukan dengan pelat karbon.

## Tiga keputusan, berurutan

### 1. Jenis: daily trainer

Ada tiga kategori besar sepatu lari:

- **Daily trainer** - bantalan sedang sampai tebal, bobot 250-300 gram, tahan lama. Ini yang kamu cari.
- **Tempo / speed** - lebih ringan dan lebih responsif, untuk sesi cepat bagi pelari yang sudah punya basis.
- **Race / berpelat** - paling ringan dan paling mahal, umur pakai paling pendek, dan paling menuntut teknik.

Sembilan dari sepuluh pelari baru butuh yang pertama, dan hanya yang pertama.

### 2. Ukuran: lebih longgar daripada yang kamu kira

Kaki memuai saat berlari jauh. Sisakan 8 sampai 12 mm antara jari terpanjang dan ujung sepatu - kira-kira selebar ibu jari. Kuku hitam setelah lari 10K adalah tanda klasik sepatu yang setengah nomor terlalu kecil.

Ukur sore hari, dan ukur dengan kaos kaki lari yang akan kamu pakai.

### 3. Permukaan: aspal atau trail

Aspal dan trotoar: sol halus dengan karet di titik tumpuan. Jalur tanah, kerikil, atau perkebunan: sol bergerigi yang menggigit permukaan lepas. Sepatu jalanan di jalur tanah basah terasa seperti berjalan di es.

## Yang tidak perlu kamu bayar dulu

- **Pelat karbon.** Lihat di atas.
- **Bobot super ringan.** Di bawah 220 gram biasanya berarti umur pakai lebih pendek dan bantalan lebih tipis.
- **Sepatu stabilitas berat**, kecuali kamu memang pernah didiagnosis overpronasi. Sebagian besar pelari tidak perlu.

## Kapan menambah pasangan kedua

Sampai sekitar 30 kilometer per minggu, satu pasang cukup. Di atas itu, memutar dua pasang berbeda - misalnya satu bantalan tebal dan satu lebih ringan - memberi jeda pemulihan pada busa dan memvariasikan beban pada tendon. Itu salah satu cara paling sederhana menurunkan risiko cedera berulang.`,
  },
  {
    handle: "beda-sepatu-lari-harian-dan-race",
    storefront_key: "specs-run",
    title: "Daily trainer vs race day: kapan sepatu ringan justru merugikan",
    subtitle: "Dua sepatu, dua pekerjaan yang berbeda",
    excerpt:
      "Sepatu balapan membuatmu lebih cepat pada hari yang tepat dan lebih rentan cedera pada hari yang salah. Ini cara membagi tugas keduanya.",
    category: "Panduan",
    tags: ["running", "race", "panduan"],
    author_name: "Tim Editorial SPECS",
    author_role: "Run",
    read_minutes: 5,
    status: "published",
    published_at: day("2026-08-29"),
    rank: 2,
    cover_image_url: articleCover(PHOTO.trackLaneOne),
    cover_image_alt: "Lintasan atletik merah dengan angka satu di lajur pertama",
    seo_title: "Beda Sepatu Lari Harian dan Race Day - Kapan Memakai Apa",
    seo_description:
      "Perbedaan daily trainer dan sepatu race: bobot, bantalan, umur pakai, dan cara membagi keduanya dalam satu program latihan.",
    seo_keywords: [
      "sepatu lari race",
      "daily trainer",
      "rotasi sepatu lari",
    ],
    geo_locale: "id-ID",
    geo_target_area: "Indonesia",
    answer_summary:
      "Daily trainer dipakai untuk 80-90% total kilometer: bantalan tebal, bobot 250-300 gram, umur 500-800 km. Sepatu race dipakai untuk sesi cepat dan hari lomba: lebih ringan, lebih responsif, umur pakai sering di bawah 300 km. Memakai sepatu race untuk latihan harian menghabiskan umurnya dan menambah beban pada betis serta tendon Achilles.",
    key_takeaways: [
      "80-90% kilometer harus di sepatu harian.",
      "Sepatu race punya umur pakai jauh lebih pendek - hitung biayanya per kilometer, bukan per pasang.",
      "Rotasi dua pasang menurunkan risiko cedera berulang dengan memvariasikan beban.",
      "Coba sepatu race minimal dua kali sebelum hari lomba, jangan pertama kali di garis start.",
    ],
    faqs: [
      {
        question: "Apakah sepatu race benar-benar membuat lebih cepat?",
        answer:
          "Pada pelari yang sudah terlatih dan pada kecepatan lomba, selisihnya nyata tapi kecil - beberapa detik per kilometer. Pada pelari yang belum punya basis latihan, sepatu race sering tidak memberi keuntungan dan menambah beban pada betis.",
      },
      {
        question: "Berapa umur sepatu race?",
        answer:
          "Sering di bawah 300 kilometer. Busa yang sangat ringan dan responsif juga yang paling cepat kehilangan sifatnya.",
      },
    ],
    sources: [
      { label: "SPECS Running Footwear", url: `${SPECS}/running/footwear.html` },
      { label: "SPECS Hyperspeed", url: `${SPECS}/hyperspeed.html` },
    ],
    related_product_handles: [
      "specs-novaspeed-subsx",
      "specs-novaspeed-women-subsx",
      "specs-airglide",
    ],
    related_category_handles: ["sepatu-running"],
    content: `## Dua pekerjaan yang berbeda

Sepatu harian bertugas menyerap beban dan bertahan lama. Sepatu race bertugas mengembalikan energi secepat mungkin dan tidak perlu bertahan lama. Keduanya dibuat dari kompromi yang berlawanan, jadi tidak ada satu sepatu yang unggul di kedua pekerjaan itu.

| | Daily trainer | Race day |
|---|---|---|
| Bobot | 250-300 g | 180-230 g |
| Bantalan | Sedang-tebal, stabil | Tinggi tapi responsif |
| Umur pakai | 500-800 km | Sering di bawah 300 km |
| Porsi latihan | 80-90% | 10-20% |

## Cara membagi tugas

- **Lari mudah dan lari jauh:** sepatu harian. Ini bagian terbesar programmu, dan bagian yang paling perlu perlindungan.
- **Interval dan tempo:** boleh sepatu race kalau kamu punya, tapi sepatu harian tetap bekerja.
- **Hari lomba:** sepatu race.

## Dua kesalahan yang mahal

**Memakai sepatu race untuk latihan harian.** Busa responsif habis dalam hitungan minggu, dan kamu kehilangan keunggulannya tepat saat lomba datang.

**Memakai sepatu race pertama kali di garis start.** Sol yang lebih tinggi dan lebih tidak stabil mengubah cara kakimu mendarat. Itu bukan hal yang mau kamu pelajari di kilometer pertama dari 21.

## Kalau hanya mampu satu pasang

Ambil daily trainer yang agak ringan. Sepatu itu bisa mengerjakan semua yang ada di programmu, termasuk lomba, dengan selisih waktu yang jauh lebih kecil daripada selisih risiko cedera.`,
  },
  {
    handle: "rotasi-sepatu-lari-dan-jadwal-ganti",
    storefront_key: "specs-run",
    title: "Berapa kilometer sepatu larimu masih aman?",
    subtitle: "Cara menghitung umur sepatu tanpa menebak",
    excerpt:
      "Busa midsole kehilangan sifatnya jauh sebelum solnya bolong. Ini cara melacak kilometer, membaca tanda aus, dan menyusun rotasi dua pasang tanpa menggandakan biaya.",
    category: "Perawatan",
    tags: ["running", "perawatan", "rotasi"],
    author_name: "Tim Editorial SPECS",
    author_role: "Run",
    read_minutes: 4,
    status: "published",
    published_at: day("2026-09-05"),
    rank: 3,
    cover_image_url: articleCover(PHOTO.longRoad),
    cover_image_alt: "Pelari di jalan aspal panjang yang membelah hutan",
    seo_title: "Umur Sepatu Lari: Kapan Harus Ganti dan Cara Rotasi",
    seo_description:
      "Cara melacak kilometer sepatu lari, membaca tanda aus pada midsole dan outsole, dan menyusun rotasi dua pasang.",
    seo_keywords: [
      "umur sepatu lari",
      "kapan ganti sepatu lari",
      "rotasi sepatu lari",
    ],
    geo_locale: "id-ID",
    geo_target_area: "Indonesia",
    answer_summary:
      "Sepatu lari umumnya aman sampai 500-800 km. Ganti lebih cepat kalau busa midsole tidak lagi kembali setelah ditekan, kalau pola outsole sudah rata sampai busa terlihat, atau kalau nyeri tulang kering dan lutut muncul berulang tanpa perubahan program latihan.",
    key_takeaways: [
      "500-800 km adalah rentang umum; berat badan dan permukaan menggeser angkanya.",
      "Tanda paling andal: busa midsole yang tidak kembali setelah ditekan.",
      "Catat kilometer sejak hari pertama - ingatan selalu meleset ke bawah.",
      "Rotasi dua pasang tidak menggandakan biaya karena setiap pasang bertahan lebih lama.",
    ],
    faqs: [
      {
        question: "Apakah sepatu lari yang disimpan lama tetap aus?",
        answer:
          "Ya. Busa EVA dan lem mengeras seiring waktu meski sepatu tidak dipakai. Sepatu berumur lebih dari tiga tahun umumnya sudah kehilangan sebagian peredamannya walau tampak baru.",
      },
      {
        question: "Bagaimana cara melacak kilometer sepatu?",
        answer:
          "Sebagian besar aplikasi lari punya fitur gear yang menambahkan jarak setiap aktivitas ke sepatu yang kamu pilih. Kalau tidak memakai aplikasi, catat tanggal pembelian dan perkirakan dari rata-rata kilometer mingguanmu.",
      },
    ],
    sources: [
      { label: "SPECS Running", url: `${SPECS}/running.html` },
    ],
    related_product_handles: ["specs-speedvolt-women", "specs-airglide"],
    related_category_handles: ["sepatu-running"],
    content: `## Kenapa kilometer lebih berguna daripada bulan

Sepatu yang dipakai 60 km sebulan dan sepatu yang dipakai 200 km sebulan akan sama-sama berumur "satu tahun", tapi yang kedua sudah habis tiga kali lipat. Satu-satunya ukuran yang berarti adalah jarak.

## Rentang yang masuk akal

- **500-800 km** untuk daily trainer dengan busa EVA atau campuran modern.
- **Di bawah 300 km** untuk sepatu race berpelat dengan busa super ringan.
- **Ujung bawah rentang** kalau berat badanmu di atas 80 kg, atau kalau kamu berlari di aspal panas dan permukaan kasar.

## Tiga tes di rumah

### Tes tekan

Tekan midsole di bawah tumit dengan ibu jari. Busa sehat melawan dan kembali. Busa habis menerima tekanan dan pulih lambat.

### Tes meja

Letakkan sepatu di permukaan datar dan lihat dari belakang setinggi mata. Sepatu yang miring ke satu sisi berarti midsole sudah runtuh tidak merata - itu memaksa pergelangan kakimu bekerja mengoreksi setiap langkah.

### Tes outsole

Karet outsole yang sudah rata sampai busa di bawahnya terlihat berarti sepatunya sudah melewati umur pakainya, berapa pun angka di aplikasimu.

## Rotasi tanpa menggandakan biaya

Dua pasang yang dipakai bergantian tidak habis dua kali lebih cepat - keduanya justru bertahan lebih lama, karena busa butuh waktu untuk pulih dari kompresi dan 24 jam jeda mengembalikan sebagian sifatnya.

Kombinasi paling berguna untuk pelari menengah: satu pasang bantalan tebal untuk lari jauh dan hari pemulihan, satu pasang lebih ringan untuk sesi cepat. Variasi beban itu sendiri sudah menurunkan risiko cedera berulang.`,
  },
  {
    handle: "apa-itu-sepatu-turf-dan-kapan-dipakai",
    storefront_key: "specs-teamsport",
    title: "Sepatu turf: sol yang paling awet dan paling sering disalahpahami",
    subtitle: "Bukan versi murah dari FG",
    excerpt:
      "TF sering dianggap sepatu latihan kelas dua. Padahal untuk sebagian besar pemain di Indonesia, sol inilah yang paling cocok dengan lapangan yang benar-benar mereka pakai.",
    category: "Panduan",
    tags: ["turf", "sol", "panduan"],
    author_name: "Tim Editorial SPECS",
    author_role: "Teamsport",
    read_minutes: 5,
    status: "published",
    published_at: day("2026-09-16"),
    rank: 6,
    cover_image_url: articleCover(PHOTO.turfAtNight),
    cover_image_alt: "Lapangan rumput sintetis diterangi lampu sorot pada malam hari",
    seo_title: "Sepatu Turf (TF): Kapan Dipakai dan Kenapa Paling Awet",
    seo_description:
      "Penjelasan sol turf: konstruksi, permukaan yang cocok, dan kenapa TF sering jadi pilihan paling masuk akal untuk lapangan di Indonesia.",
    seo_keywords: ["sepatu turf", "sol tf", "sepatu bola karpet"],
    geo_locale: "id-ID",
    geo_target_area: "Indonesia",
    answer_summary:
      "Sol turf (TF) memakai puluhan tonjolan karet kecil yang menyebarkan beban ke banyak titik, sehingga paling awet di rumput karpet, lapangan mini, dan permukaan keras. TF bukan versi murah dari FG - keduanya dibuat untuk permukaan yang berbeda.",
    key_takeaways: [
      "TF dibuat untuk rumput karpet dan lapangan mini, bukan sebagai pengganti FG yang lebih murah.",
      "Beban tersebar ke banyak titik, jadi sol TF paling tahan lama di permukaan keras.",
      "Di rumput alami yang lunak, TF kehilangan cengkeraman.",
      "Untuk pemain yang bermain di lapangan sewaan dua sampai tiga kali seminggu, TF sering jadi pasangan kedua yang paling masuk akal di samping FG.",
    ],
    faqs: [
      {
        question: "Apakah sepatu turf bisa dipakai di rumput alami?",
        answer:
          "Bisa di rumput alami yang pendek dan padat, tapi cengkeramannya berkurang jelas di rumput tebal atau basah. Untuk rumput alami terawat, FG tetap pilihan yang benar.",
      },
      {
        question: "Apa bedanya sepatu turf dan sepatu futsal?",
        answer:
          "Sepatu futsal (IN) bersol karet datar untuk lantai vinyl dan parket, dengan pola pivot untuk berputar di tempat. Sepatu turf punya tonjolan karet kecil di seluruh sol supaya tetap mencengkeram serat rumput karpet. Di lantai indoor, tonjolan TF justru terasa goyah dan bisa meninggalkan bekas.",
      },
      {
        question: "Apakah sepatu turf boleh dipakai di rumput sintetis berisi butiran karet?",
        answer:
          "Boleh, terutama di rumput sintetis yang seratnya pendek. Di rumput sintetis generasi baru yang seratnya panjang dan berisi banyak butiran karet, sol AG biasanya mencengkeram lebih baik, tapi TF tetap aman untuk lutut.",
      },
    ],
    sources: [
      { label: "SPECS Football", url: `${SPECS}/football.html` },
      { label: "SPECS Football Footwear", url: `${SPECS}/football/footwear.html` },
    ],
    related_category_handles: ["sepatu-bola", "sepatu-futsal"],
    content: `## Kenapa TF sering diremehkan

Di rak toko, sepatu turf biasanya dipajang paling bawah dan dijual paling murah. Wajar kalau banyak orang menganggapnya versi latihan dari sepatu FG - sepatu untuk yang belum serius.

Anggapan itu terbalik. Sebagian besar pertandingan amatir di Indonesia tidak dimainkan di rumput alami yang terawat. Pertandingannya ada di lapangan sewaan berumput karpet, lapangan mini di kompleks perumahan, dan lapangan sekolah yang rumputnya sudah tipis. Untuk permukaan seperti itu, TF bukan kompromi - justru sol yang paling tepat.

## Apa yang membuat TF berbeda

Bukan stud, melainkan puluhan sampai ratusan tonjolan karet rendah yang menutupi hampir seluruh permukaan sol. Beban satu langkah dibagi ke banyak titik, bukan ke sebelas sampai tiga belas titik seperti pada FG.

Dua akibatnya langsung terasa:

1. **Tekanan di telapak kaki lebih rata.** Di permukaan keras, stud FG terasa seperti berdiri di atas paku pendek. Tonjolan TF tidak.
2. **Kaki tidak terkunci di permukaan.** Stud yang tidak bisa menembus permukaan keras membuat kaki tertahan saat berputar, dan beban itu pindah ke lutut dan pergelangan kaki. TF mencengkeram cukup untuk berlari dan berhenti, tapi tetap melepaskan kaki saat berputar.

## Permukaan yang cocok

| Permukaan | TF | FG |
| --- | --- | --- |
| Rumput karpet / lapangan mini | Paling cocok | Tidak disarankan |
| Rumput sintetis serat pendek | Cocok | Tidak disarankan |
| Rumput alami yang tipis dan keras | Cocok | Cocok |
| Rumput alami terawat | Kurang cengkeraman | Paling cocok |
| Lapangan basah dan berlumpur | Licin | Kurang - pilih SG |

## Kapan TF adalah pilihan yang salah

Di rumput alami yang tebal atau basah, tonjolan TF terlalu pendek untuk menembus permukaan. Kamu akan tergelincir saat mengubah arah, dan itu bukan soal kualitas sepatunya. Kalau liga atau latihan utamamu ada di lapangan seperti ini, FG tetap jawabannya.

TF juga bukan sepatu futsal. Di lantai vinyl dan parket, tonjolannya terasa goyah dan cengkeramannya kalah dari sol karet datar yang dibuat untuk berputar di tempat.

## Umur pakai dan cara merawatnya

Karena bebannya tersebar, sol TF biasanya tahan lebih lama dari FG di permukaan keras - sering satu setengah sampai dua kali lipat. Yang lebih cepat habis justru upper di area jari kaki, karena permukaan karpet mengikis ujung sepatu setiap kali kamu menendang atau mengerem.

Setelah bermain, ketuk sepatu untuk membuang butiran karet dari lapangan sintetis, lepas insole, dan keringkan di tempat teduh. Butiran karet yang tertinggal di dalam sepatu bekerja seperti amplas pada lapisan dalam.

> Kalau kamu hanya bisa membeli satu pasang, pilih sol untuk lapangan yang paling sering kamu pakai - bukan untuk lapangan yang paling kamu inginkan.`,
  },
]

const PRODUCT_STORIES: ProductStoryData[] = [
  {
    handle: "sepatu-bola-fg",
    storefront_key: "specs-teamsport",
    title: "Sepatu Bola FG",
    subtitle: "Rumput alami, stud cetak, satu keluarga produk",
    product_name: "Sepatu Bola FG",
    category_handle: "sepatu-bola",
    excerpt:
      "Sepatu bola sol FG: dari Lightspeed Reborn yang dibuat untuk kecepatan sampai Accelerator Illuzion yang dibuat untuk pengatur tempo. Semuanya berbagi satu permukaan - rumput alami terawat.",
    intro:
      "Semua model di sini memakai sol FG (Firm Ground): stud cetak berukuran sedang yang menggigit rumput alami tanpa menancap terlalu dalam. Perbedaannya ada pada upper dan pelat - dan itulah yang menentukan model mana yang cocok dengan cara kamu bermain.",
    sections: [
      {
        heading: "Untuk siapa produk ini",
        body: "Pemain yang lapangan utamanya rumput alami terawat - lapangan klub, stadion daerah, dan lapangan sekolah yang dipotong rutin. Kalau kamu lebih sering bermain di lapangan sewaan berumput sintetis, lihat sepatu bola AG.",
        image_url: sectionImage(PHOTO.stadiumAtNight),
        image_alt: "Pertandingan malam di stadion berumput alami",
      },
      {
        heading: "Tiga pilihan model",
        body: "**Kecepatan** - Lightspeed Reborn Meta SL dan XR: upper tipis, bobot rendah, dibuat untuk pemain sayap yang hidup dari akselerasi.\n\n**Kontrol** - Accelerator Illuzion 4 Elite: tekstur upper yang lebih tebal di area sentuh, untuk gelandang yang mengatur tempo.\n\n**Nilai harian** - Galactica Morph NV dan XLR 4: konstruksi lebih tahan lama untuk pemain yang berlatih lebih sering daripada bertanding.",
      },
      {
        heading: "Cara memilih dalam dua menit",
        body: "Mulai dari posisi bermain, bukan dari harga. Sayap dan penyerang mendapat manfaat paling besar dari bobot rendah. Gelandang dan bek tengah mendapat manfaat lebih besar dari upper yang lebih tebal dan tumit yang lebih terkunci. Setelah itu, cocokkan dengan anggaran - selisih performa antar tingkat harga jauh lebih kecil daripada selisih antara ukuran yang benar dan yang salah.",
        image_url: sectionImage(PHOTO.pitchLine),
        image_alt: "Garis putih di atas rumput alami yang dipotong rapi",
      },
    ],
    highlights: [
      { label: "Sol", value: "FG - Firm Ground" },
      { label: "Permukaan", value: "Rumput alami terawat" },
      { label: "Stud", value: "Cetak, 11-13 titik" },
      { label: "Umur pakai", value: "6-12 bulan (2-3x seminggu)" },
    ],
    faqs: [
      {
        question: "Apa bedanya Lightspeed Reborn Meta SL dan Meta XR?",
        answer:
          "Keduanya berbagi sol dan filosofi yang sama. SL memakai upper yang lebih tipis untuk bobot terendah; XR menambahkan struktur di midfoot untuk pemain yang butuh kuncian lebih kuat saat berubah arah.",
      },
      {
        question: "Apakah sepatu FG cocok untuk lapangan sintetis?",
        answer:
          "Tidak untuk pemakaian rutin. Stud FG tidak menembus serat sintetis dan tekanan berpindah ke lutut. Untuk rumput sintetis, sol AG atau TF adalah pilihan yang benar.",
      },
    ],
    product_handles: [
      "specs-lightspeed-reborn-meta-sl-fg",
      "specs-lightspeed-reborn-meta-xr-fg",
      "specs-galactica-morph-nv-fg",
      "specs-xlr-4-fg",
      "specs-accelerator-illuzion-4-elite-fg",
      "specs-accelerator-illuzion-4-elite-fg-brook-green",
    ],
    cta_label: "Lihat semua sepatu bola",
    cta_href: "/categories/sepatu-bola",
    cover_image_url: storyCover(PHOTO.pitchFromAbove),
    cover_image_alt: "Lapangan sepak bola rumput alami dilihat dari udara",
    status: "published",
    published_at: day("2026-08-01"),
    rank: 1,
    seo_title: "Sepatu Bola FG SPECS - Panduan Produk",
    seo_description:
      "Semua sepatu bola sol FG SPECS dalam satu halaman: Lightspeed Reborn, Accelerator Illuzion, Galactica Morph, dan XLR.",
    seo_keywords: ["sepatu bola fg", "sepatu bola specs", "sepatu rumput alami"],
  },
  {
    handle: "sepatu-futsal-indoor",
    storefront_key: "specs-teamsport",
    title: "Sepatu Futsal Indoor",
    subtitle: "Sol karet non-marking untuk lantai vinyl dan parket",
    product_name: "Sepatu Futsal IN",
    category_handle: "sepatu-futsal",
    excerpt:
      "Sepatu futsal sol IN: Metasala untuk pemain yang bertumpu pada sentuhan, Accelerator untuk pemain yang bertumpu pada kecepatan. Semuanya non-marking.",
    intro:
      "Sol IN (indoor) adalah karet datar non-marking dengan pola pivot di bawah telapak depan. Dibuat untuk berputar di tempat di atas lantai keras - gerakan yang paling sering terjadi dalam futsal dan yang paling cepat merusak sepatu yang salah.",
    sections: [
      {
        heading: "Untuk siapa produk ini",
        body: "Pemain futsal di lapangan indoor berlantai vinyl atau parket. Untuk lapangan semen, model-model ini tetap bekerja tapi umur solnya jauh lebih pendek. Untuk rumput sintetis indoor, pakai sol TF.",
        image_url: sectionImage(PHOTO.outdoorCourt),
        image_alt: "Lapangan futsal berlantai semen dilihat dari atas",
      },
      {
        heading: "Dua pilihan model",
        body: "**Sentuhan** - Metasala Nativ RE: upper yang lebih lembut dan profil lebih rendah, untuk pemain yang menahan dan mengarahkan bola di ruang sempit.\n\n**Kecepatan** - Accelerator Alpha Fury Pro, Lightspeed 4 Nitro Pro, dan Illuzion 4 Pro: bobot lebih ringan dan sol yang lebih responsif untuk pemain yang menyerang ruang.",
        image_url: sectionImage(PHOTO.coveredCourtSunset),
        image_alt: "Lapangan futsal beratap saat matahari terbenam",
      },
      {
        heading: "Yang perlu diperiksa sebelum membeli",
        body: "Balik sepatunya. Cari pola pivot melingkar di bawah telapak depan, karet yang lebih tebal di tepi luar, dan sol yang mau menekuk di garis jari kaki saat ditekuk dengan tangan. Tiga hal itu lebih menentukan kenyamanan sembilan puluh menit daripada nama teknologinya.",
      },
    ],
    highlights: [
      { label: "Sol", value: "IN - Indoor, non-marking" },
      { label: "Permukaan", value: "Vinyl, parket, semen halus" },
      { label: "Pola", value: "Pivot melingkar di telapak depan" },
      { label: "Umur pakai", value: "4-10 bulan tergantung permukaan" },
    ],
    faqs: [
      {
        question: "Apa arti non-marking?",
        answer:
          "Karet yang tidak meninggalkan garis hitam di lantai. Sebagian besar lapangan futsal indoor mewajibkannya.",
      },
      {
        question: "Bisakah sepatu futsal dipakai di luar ruangan?",
        answer:
          "Bisa, tapi permukaan aspal dan semen mengikis sol indoor jauh lebih cepat daripada lantai vinyl. Kalau kamu sering bermain di luar, perlakukan solnya sebagai komponen habis pakai.",
      },
    ],
    product_handles: [
      "specs-metasala-nativ-re-black-gold",
      "specs-metasala-nativ-re-white-teal-silver",
      "specs-accelerator-alpha-fury-pro-in",
      "specs-accelerator-lightspeed-4-nitro-pro-in",
      "specs-accelerator-illuzion-4-pro-in",
    ],
    cta_label: "Lihat semua sepatu futsal",
    cta_href: "/categories/sepatu-futsal",
    cover_image_url: storyCover(PHOTO.futsalGoal),
    cover_image_alt: "Gawang futsal di atas lantai parket",
    status: "published",
    published_at: day("2026-08-01"),
    rank: 2,
    seo_title: "Sepatu Futsal Indoor SPECS - Panduan Produk",
    seo_description:
      "Semua sepatu futsal sol IN SPECS: Metasala Nativ RE, Accelerator Alpha Fury, Lightspeed 4 Nitro, dan Illuzion 4 Pro.",
    seo_keywords: ["sepatu futsal", "sepatu futsal indoor", "sol non marking"],
  },
  {
    handle: "sepatu-lari-harian",
    storefront_key: "specs-run",
    title: "Sepatu Lari Harian",
    subtitle: "Bantalan yang memaafkan, umur pakai yang panjang",
    product_name: "Daily Trainer",
    category_handle: "sepatu-running",
    excerpt:
      "Daily trainer: sepatu yang mengerjakan 80-90% kilometermu. Bantalan sedang sampai tebal, bobot menengah, dan busa yang dirancang bertahan ratusan kilometer.",
    intro:
      "Daily trainer bukan kategori kompromi - ini kategori yang menanggung hampir seluruh beban latihanmu. Yang dicari di sini bukan bobot terendah, melainkan bantalan yang stabil dan busa yang tidak mati dalam dua bulan.",
    sections: [
      {
        heading: "Untuk siapa produk ini",
        body: "Pelari pemula sampai menengah, dan pelari berpengalaman untuk lari mudah serta hari pemulihan. Kalau kamu baru mulai berlari, produk ini adalah tempat yang benar untuk sepatu pertamamu.",
        image_url: sectionImage(PHOTO.lakesideTrail),
        image_alt: "Pelari di jalan tanah di tepi danau",
      },
      {
        heading: "Dua pilihan model",
        body: "**Bantalan maksimal** - Airglide: tumpukan busa lebih tinggi untuk lari jauh dan pemulihan, paling memaafkan untuk pelari berbadan lebih besar.\n\n**Serbaguna** - Speedvolt dan Speedvolt Women: profil lebih rendah dan sedikit lebih responsif, nyaman untuk lari harian sekaligus sesi tempo ringan.",
      },
      {
        heading: "Memilih ukuran",
        body: "Sisakan 8 sampai 12 milimeter antara jari terpanjang dan ujung sepatu - kira-kira selebar ibu jari. Kaki memuai saat berlari jauh, dan kuku hitam setelah 10K hampir selalu berarti setengah nomor terlalu kecil.",
      },
    ],
    highlights: [
      { label: "Kategori", value: "Daily trainer" },
      { label: "Bobot", value: "250-300 gram" },
      { label: "Umur pakai", value: "500-800 km" },
      { label: "Porsi latihan", value: "80-90% total kilometer" },
    ],
    faqs: [
      {
        question: "Apakah daily trainer bisa dipakai lomba?",
        answer:
          "Bisa. Selisih waktunya dibanding sepatu race jauh lebih kecil daripada yang dibayangkan sebagian pelari, dan risikonya lebih rendah - terutama kalau kamu belum pernah berlatih dengan sol race yang lebih tinggi.",
      },
      {
        question: "Kapan sepatu lari harus diganti?",
        answer:
          "Umumnya setelah 500-800 km, atau lebih cepat kalau busa midsole tidak lagi kembali setelah ditekan dan pola outsole sudah rata sampai busa di bawahnya terlihat.",
      },
    ],
    product_handles: [
      "specs-airglide",
      "specs-speedvolt",
      "specs-speedvolt-women",
    ],
    cta_label: "Lihat semua sepatu lari",
    cta_href: "/categories/sepatu-running",
    cover_image_url: storyCover(PHOTO.seafrontRun),
    cover_image_alt: "Pelari menyusuri jalan tepi laut pada pagi yang cerah",
    status: "published",
    published_at: day("2026-08-05"),
    rank: 3,
    seo_title: "Sepatu Lari Harian SPECS - Panduan Produk",
    seo_description:
      "Daily trainer SPECS: Airglide, Speedvolt, dan Speedvolt Women. Bantalan, bobot, umur pakai, dan panduan ukuran.",
    seo_keywords: ["sepatu lari harian", "daily trainer", "sepatu lari specs"],
  },
  {
    handle: "sepatu-lari-race-day",
    storefront_key: "specs-run",
    title: "Sepatu Lari Race Day",
    subtitle: "Ringan, responsif, dan dibuat untuk hari yang tepat",
    product_name: "Race Day",
    category_handle: "sepatu-running",
    excerpt:
      "Race day: busa super ringan dan sol responsif untuk sesi cepat dan hari lomba. Umur pakai pendek, dan itu memang bagian dari desainnya.",
    intro:
      "Sepatu race dibuat dari kompromi yang berlawanan dengan sepatu harian: mengembalikan energi secepat mungkin, dengan konsekuensi umur pakai yang jauh lebih pendek. Dipakai di hari yang tepat, selisihnya terasa. Dipakai setiap hari, keunggulannya habis sebelum lomba datang.",
    sections: [
      {
        heading: "Untuk siapa produk ini",
        body: "Pelari yang sudah punya basis latihan rutin dan ingin menambah sepatu kedua untuk sesi interval, tempo, dan hari lomba. Bukan untuk sepatu pertama.",
        image_url: sectionImage(PHOTO.trackStrides),
        image_alt: "Kaki para pelari di lintasan atletik",
      },
      {
        heading: "Cara memakainya",
        body: "Batasi ke 10-20% total kilometer mingguan. Coba minimal dua kali sebelum hari lomba - sol yang lebih tinggi mengubah cara kaki mendarat, dan itu bukan hal yang ingin kamu pelajari di kilometer pertama dari 21.",
        image_url: sectionImage(PHOTO.racePack),
        image_alt: "Rombongan pelari di jalan raya saat lomba",
      },
      {
        heading: "Menghitung biayanya",
        body: "Hitung per kilometer, bukan per pasang. Sepatu race yang bertahan 300 km punya biaya per kilometer yang jauh lebih tinggi daripada daily trainer yang bertahan 700 km - dan itu wajar, karena pekerjaannya memang berbeda.",
      },
    ],
    highlights: [
      { label: "Kategori", value: "Race / tempo" },
      { label: "Bobot", value: "180-230 gram" },
      { label: "Umur pakai", value: "Sering di bawah 300 km" },
      { label: "Porsi latihan", value: "10-20% total kilometer" },
    ],
    faqs: [
      {
        question: "Apakah pemula boleh memakai sepatu race?",
        answer:
          "Sebaiknya tidak sebagai sepatu utama. Sol yang tinggi dan responsif menuntut kekuatan betis serta tendon yang terbentuk dari latihan rutin, dan pada pelari baru justru memperbesar risiko cedera.",
      },
    ],
    product_handles: ["specs-novaspeed-subsx", "specs-novaspeed-women-subsx"],
    cta_label: "Lihat koleksi race",
    cta_href: "/categories/sepatu-running",
    cover_image_url: storyCover(PHOTO.raceStart),
    cover_image_alt: "Pelari melewati gerbang start sebuah lomba lari",
    status: "published",
    published_at: day("2026-08-05"),
    rank: 4,
    seo_title: "Sepatu Lari Race Day SPECS - Panduan Produk",
    seo_description:
      "Sepatu race SPECS Novaspeed SubsX: bobot, umur pakai, dan cara membaginya dengan sepatu harian.",
    seo_keywords: ["sepatu race", "novaspeed", "sepatu lomba lari"],
  },
  {
    handle: "apparel-latihan",
    storefront_key: null,
    title: "Apparel Latihan",
    subtitle: "Kaos, tight, dan kaos kaki untuk sesi harian",
    product_name: "Apparel Latihan",
    category_handle: "apparel",
    excerpt:
      "Apparel latihan: bahan yang memindahkan keringat keluar, potongan yang tidak menahan gerakan, dan kaos kaki yang tidak melorot di menit ketiga puluh.",
    intro:
      "Apparel latihan jarang jadi keputusan besar, tapi pengaruhnya harian. Yang dicari sederhana: bahan yang cepat kering, jahitan yang tidak bergesekan di titik yang sama berulang kali, dan potongan yang sesuai dengan gerakan olahragamu.",
    sections: [
      {
        heading: "Untuk siapa produk ini",
        body: "Siapa pun yang berlatih lebih dari dua kali seminggu. Kaos katun menyerap keringat dan menahannya; bahan performa memindahkannya ke permukaan supaya menguap.",
        image_url: sectionImage(PHOTO.trackStretch),
        image_alt: "Pria berkaos putih meregangkan otot di lintasan",
      },
      {
        heading: "Yang perlu diperhatikan",
        body: "**Kaos** - cari jahitan datar di bahu dan sisi badan, area yang paling sering bergesekan dengan tali tas atau lengan.\n\n**Tight dan legging** - pinggang yang tidak melorot saat berlari dan bahan yang tidak menerawang saat menunduk.\n\n**Kaos kaki** - bagian yang paling sering diabaikan dan paling sering menyebabkan lecet. Kaos kaki olahraga dengan bantalan di tumit dan telapak depan mengurangi gesekan langsung ke kulit.",
        image_url: sectionImage(PHOTO.trackSprint),
        image_alt: "Pelari berlatih di lintasan atletik merah",
      },
    ],
    highlights: [
      { label: "Bahan", value: "Performa, cepat kering" },
      { label: "Cocok untuk", value: "Latihan harian, gym, lari" },
      { label: "Perawatan", value: "Cuci dingin, jangan pakai pelembut" },
    ],
    faqs: [
      {
        question: "Kenapa tidak boleh memakai pelembut pakaian untuk apparel olahraga?",
        answer:
          "Pelembut meninggalkan lapisan yang menutup pori serat dan mengurangi kemampuan bahan memindahkan keringat. Setelah beberapa kali pencucian, kaos performa bisa terasa seperti katun biasa.",
      },
    ],
    product_handles: [
      "specs-move-mens-training-tee-white",
      "specs-move-mens-training-tee-black",
      "specs-full-length-legging",
      "specs-move-womens-7-8-tight",
      "specs-run-lite-quarter-socks-white",
    ],
    cta_label: "Lihat semua apparel",
    cta_href: "/categories/apparel",
    cover_image_url: storyCover(PHOTO.battleRopes),
    cover_image_alt: "Pria berkaos hitam berlatih dengan tali tambang",
    status: "published",
    published_at: day("2026-08-08"),
    rank: 5,
    seo_title: "Apparel Latihan SPECS - Panduan Produk",
    seo_description:
      "Kaos latihan, legging, tight, dan kaos kaki SPECS: bahan, potongan, dan cara merawatnya.",
    seo_keywords: ["apparel latihan", "kaos olahraga specs", "legging olahraga"],
  },
]

export default async function seedContent({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const service: ContentModuleService = container.resolve(CONTENT_MODULE)
  const refresh = (args ?? []).includes("refresh")

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["handle"],
  })
  const productHandles = new Set(products.map((p) => p.handle))

  const warnMissingProducts = (label: string, handles?: string[] | null) => {
    const missing = (handles ?? []).filter((handle) => !productHandles.has(handle))
    if (missing.length) {
      logger.warn(
        `${label} references products that are not seeded: ${missing.join(", ")}`
      )
    }
  }

  const existingArticles = await service.listArticles(
    {},
    { select: ["id", "handle"] }
  )
  const articleIds = new Map(existingArticles.map((a) => [a.handle, a.id]))

  let createdArticles = 0
  let refreshedArticles = 0
  for (const article of ARTICLES) {
    warnMissingProducts(
      `Article "${article.handle}"`,
      article.related_product_handles
    )

    const id = articleIds.get(article.handle)
    if (!id) {
      await createArticleWorkflow(container).run({ input: article })
      createdArticles++
    } else if (refresh) {
      const { handle: _handle, ...data } = article
      await updateArticleWorkflow(container).run({ input: { id, data } })
      refreshedArticles++
    } else {
      logger.info(`Article "${article.handle}" already exists, skipping.`)
    }
  }

  const existingStories = await service.listProductStories(
    {},
    { select: ["id", "handle"] }
  )
  const storyIds = new Map(existingStories.map((s) => [s.handle, s.id]))

  let createdStories = 0
  let refreshedStories = 0
  for (const story of PRODUCT_STORIES) {
    warnMissingProducts(`Product story "${story.handle}"`, story.product_handles)

    const id = storyIds.get(story.handle)
    if (!id) {
      await createProductStoryWorkflow(container).run({ input: story })
      createdStories++
    } else if (refresh) {
      const { handle: _handle, ...data } = story
      await updateProductStoryWorkflow(container).run({ input: { id, data } })
      refreshedStories++
    } else {
      logger.info(`Product story "${story.handle}" already exists, skipping.`)
    }
  }

  logger.info(
    `Content seed done: ${createdArticles} article(s) and ${createdStories} product story(ies) created` +
      (refresh
        ? `, ${refreshedArticles} article(s) and ${refreshedStories} product story(ies) refreshed.`
        : ".")
  )
}
