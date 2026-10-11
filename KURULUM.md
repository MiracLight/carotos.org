# carotos.org — dosyaların yerleştirilmesi

Bu arşiv, `npm create astro` ile kurduğun projenin **üstüne** açılacak.
Mevcut `package.json`, `node_modules` ve `tsconfig.json` dosyalarına
dokunmuyor.

> **Bu sürümde `@astrojs/sitemap` eklendi.** Arşivi açtıktan sonra
> `npm install` çalıştırman gerekiyor, yoksa derleme hata verir.

## 1. Arşivi VM'e taşı

Arşivi Windows'ta `Downloads\Share` klasörüne indir. VM'de:

```
tar -xzf /media/sf_Share/carotos-web-kaynak.tar.gz -C ~/carotos-web
```

## 2. Bağımlılığı kur ve çalıştır

```
cd ~/carotos-web && npm install && npm run dev
```

Tarayıcıda `http://localhost:4321/` adresini aç.
İngilizce sayfa: `http://localhost:4321/en/`

Durdurmak için terminalde `q` yazıp Enter.

---

## Arşivin içinde ne var

```
public/
  carotos-logo-yatay.svg     yatay logo (üst menüde)
  carotos-amblem.svg         kaplumbağa amblemi (site simgesi)
  sosyal-kart.png            paylaşım görseli (1200x630)
  404-gorsel.png             404 sayfası görseli
  robots.txt                 arama motoru yönergesi
  ekranlar/                  17 ekran görüntüsü (webp, kırpılmamış)
  ekranlar/kucuk/            aynı görsellerin 200 piksellik önizlemeleri

src/
  styles/global.css          renkler, yazı tipleri, ortak stiller
  components/
    Turtle.astro             kaplumbağa (renkleri ayarlanabilir)
    Wave.astro               bölümler arası dalga geçişi
    Nav.astro                üst menü + dil değiştirici
    Footer.astro             iletişim kanalları + yapımcılar
    Slayt.astro              ekran görüntüsü slaytı (oklar, önizleme
                             şeridi, sayaç, tam boy görüntüleyici)
  layouts/
    Base.astro               ortak iskelet (head, meta, nav, footer)
  pages/
    index.astro              TÜRKÇE ana sayfa
    surum-notlari.astro      TÜRKÇE sürüm notları
    404.astro                bulunamadı sayfası
    en/index.astro           İNGİLİZCE ana sayfa
    en/changelog.astro       İNGİLİZCE sürüm notları
    de/                      Almanca için boş klasör

astro.config.mjs             site adresi + sitemap ayarı
```

---

## Sık yapacağın işler

### Yeni sürüm çıktığında

`src/pages/index.astro` dosyasının en üstündeki `surum` bloğunu güncelle:

```js
const surum = {
  etiket: "1.1",
  tarih: "5 Eylül 2026",
  dosya: "carotos-1.1-amd64.iso",
  boyut: "2,21 GB",
  sha256: "...",
  url: "https://download.carotos.org/carotos-1.1-amd64.iso",
  shaUrl: "https://download.carotos.org/carotos-1.1-amd64.iso.sha256",
};
```

Aynısını `src/pages/en/index.astro` içindeki `release` bloğunda yap.
Bu iki bloğun **eşleşmesi** gerekiyor.

### Yeni ekran görüntüsü eklemek

Görseller kırpılmaz ve dolgu eklenmez. Sahne 3:2 oranında sabittir,
görsel içine `object-fit: contain` ile sığar; oran farkı kenarlarda
lacivert çerçeve olarak görünür. Yani her oranda görsel eklenebilir.

1. Büyük görsel: en fazla 1600 piksel genişlik, `.webp`
   → `public/ekranlar/ad.webp`
2. Küçük önizleme: 200 piksel genişlik, `.webp`
   → `public/ekranlar/kucuk/ad.webp`
3. `index.astro` içindeki `slaytlar` dizisine ekle
4. Aynısını `en/index.astro` içindeki `slides` dizisine ekle

Her slaytın altı alanı var:

```js
{
  src: "/ekranlar/ad.webp",
  kucuk: "/ekranlar/kucuk/ad.webp",
  alt: "Görme engelli kullanıcı için görselin sözlü tarifi",
  grup: "Uygulama",            // üstte küçük etiket
  baslik: "Sistem Sağlığı",    // kalın başlık
  aciklama: "Tek satır açıklama.",
}
```

`grup` alanı aynı adı taşıyan slaytları ayırt etmek için var:
sihirbazın "Masaüstü" sayfası ile gerçek masaüstü ekran görüntüsü
aynı başlığı taşıyor, grup etiketi ikisini ayırıyor.

Dönüştürme komutu (VM'de, `pip install pillow` gerekiyorsa kur):

```
python3 -c "from PIL import Image; im=Image.open('kaynak.png').convert('RGB'); o=im.width/im.height; b=im.resize((1600,round(1600/o))) if im.width>1600 else im; b.save('public/ekranlar/ad.webp','WEBP',quality=88,method=6); im.resize((200,round(200/o))).save('public/ekranlar/kucuk/ad.webp','WEBP',quality=76,method=6)"
```

### Sürüm notu eklemek

`src/pages/surum-notlari.astro` içindeki `surumler` dizisinin **başına**
yeni bir nesne ekle. Aynısını `src/pages/en/changelog.astro` içine de ekle.

Etiket türleri: `eklendi`, `duzeltildi`, `degisti`, `kaldirildi`

### Yeni sayfa eklerken

`src/components/Nav.astro` içindeki `esler` nesnesine Türkçe ve İngilizce
karşılığını ekle, yoksa dil değiştirici o sayfada ana sayfaya atar.

### Renk değiştirmek

`src/styles/global.css` dosyasının en üstündeki `:root` bloğu.
Bütün renkler oradan geliyor, başka yeri elle değiştirmene gerek yok.

### Yeni mimari veya masaüstü sürümü eklemek

İndirme bölümündeki `dl__card` bloğunu kopyala, `dl` ızgarasına ekle.
"Yolda" kutusundaki `soon` bloğu da örnek olarak duruyor.

### Almanca eklemek

`src/pages/de/` klasörü hazır bekliyor. `en/index.astro` dosyasını
oraya kopyalayıp metinleri çevirmen ve `Base` bileşenine `lang="de"`
vermen yeterli. `Nav.astro` ve `Footer.astro` içindeki `t` nesnelerine
de `de` anahtarı eklemen gerekir.

---

## Bülten formu

Şu an bir e-posta servisine bağlı **değil**. Ziyaretçi "Katıl"a
bastığında kendi e-posta uygulaması hazır bir mesajla açılıyor, adresi
sana gönderiyor, sen listeye elle ekliyorsun.

İlk abonelerde bu yeterli. Buttondown veya Mailchimp gibi bir servise
geçmek istersen: sayfanın altındaki `<script>` bloğunu sil, forma
servisin verdiği `action` ve `method` değerlerini ekle.

GitHub izleme ve RSS beslemesi ise **şu anda çalışıyor**, hiçbir şey
yapman gerekmiyor.

---

## Sistem gereksinimleri nereden geliyor

İndirme bölümündeki tablo Debian 13 "trixie" amd64 kurulum kılavuzunun
Tablo 3.2 değerleridir (masaüstü kurulumu için önerilen asgari):
1 GHz 64-bit işlemci, en az 1 GB bellek (önerilen 2 GB), 10 GB disk.

Kaynak: https://www.debian.org/releases/trixie/amd64/ch03s04.en.html

---

## Metin üslubu

Sayfa metinleri Debian, Arch ve Alpine gibi dağıtım sitelerinin
üslubuyla yazıldı: ne olduğunu söyleyen, ikna etmeye çalışmayan düz
anlatım. Yeni bölüm eklerken aynı çizgiyi korumak için:

- İkinci tekil şahıs kullanma ("indirebilirsin" yerine "indirilebilir")
- Doğrulanamayan iddiada bulunma ("başka hiçbir yerde yok" gibi)
- Kullanıcıya adım adım ders anlatma; komutu ver, açıklamayı bırak
- Sıfat yerine sayı ve ölçü kullan
