/* Ortak bileşen metinleri: Türkçe. */
import type { Metin } from "./en";

const tr: Metin = {
  skip: "İçeriğe geç",
  nav: {
    menuAria: "Ana menü",
    approach: "Yaklaşım",
    apps: "Uygulamalar",
    changelog: "Sürüm notları",
    download: "İndir",
    langLabel: "Dil",
  },
  footer: {
    eyebrow: "İletişim",
    heading: "İletişim",
    lede: "Hata bildirimleri ve katkılar GitHub üzerinden, sorular ve tartışma Reddit'te. Diğer konular için e-posta.",
    made: "Yapımcılar",
    team: [
      {
        name: "Yusuf Miraç Üzümcüler",
        title: "Kurucu ve Baş Sistem Mimarı",
        role: "Çekirdek sistem geliştirme, mimari ve tasarım, altyapı yönetimi.",
      },
      {
        name: "Metin Ege Boyar",
        title: "Kurucu Ortak, Topluluk ve Büyüme",
        role: "Topluluk yönetimi, iletişim stratejisi ve proje koordinasyonu.",
      },
    ],
    licence: "GPL-3.0 lisansı altında yayımlanır. Debian 13 “trixie” tabanlıdır.",
    channels: [
      { key: "github", label: "GitHub", sub: "Kaynak kod, sürümler, hata kaydı" },
      { key: "youtube", label: "YouTube", sub: "Anlatım videoları" },
      { key: "instagram", label: "Instagram", sub: "Duyurular" },
      { key: "reddit", label: "Reddit", sub: "Topluluk ve tartışma" },
      { key: "mail", label: "E-posta", sub: "Genel iletişim" },
    ],
  },
  slayt: {
    onceki: "Önceki görsel",
    sonraki: "Sonraki görsel",
    git: "Şu görsele git",
    bolge: "Ekran görüntüleri",
    buyut: "Tam boy görüntüle",
    kapat: "Kapat",
    ipucu: "Büyütmek için tıkla",
  },
  minigame: {
    consoleMsg: "Burada saklı bir şey var. Ana sayfadaki büyük kaplumbağaya art arda 5 kez bas.",
    label: "Gizli oyun: Denize ulaş",
    close: "Kapat",
    mute: "Sesi aç/kapat",
    level: "Bölüm",
    hint: "← → veya kaydır",
    reached: "Denize ulaşıldı!",
    variants: ["Kumsal", "Kayalık", "Sürüntü", "Gelgit Havuzu", "Mercan Kıyısı", "Gece Kumsalı", "Fırtına Kıyısı", "Atık Kıyısı", "Kumul Rüzgârı"],
    pu: { shield: "Kalkan", shieldBreak: "Kalkan korudu!", magnet: "Mıknatıs", surf: "Dalga ritmi", plastic: "Plastik: ağırlaştın" },
    egg: { l1: "Kabuğu kır", l2: "ve denize ulaşmasını sağla", tap: "Dokun / tıkla!" },
    introTitle: "Yumurtadaki yavru denize gitmek istiyor.",
    introText: "Önce yumurtanın kabuğunu kır. Sonra yavru kaplumbağayı engellerden kaçırarak denize ulaştır. Parlayan baloncukları topla, kırmızı kesikli halkalı plastik atıklardan kaçın. Her bölüm bir öncekinden daha uzun ve hızlı.",
    start: "Başla",
    doneTitle: "Bölüm {n} tamamlandı",
    doneLead: "Denize ulaşıldı!",
    tipLabel: "Güvenlik ipucu",
    parts: "Toplanan kabuk parçası",
    next: "Sonraki bölüm",
    overTitle: "Yavru denize ulaşamadı",
    overText: "Bütün canlar tükendi. Aynı bölümü yeniden deneyebilirsin.",
    retry: "Tekrar dene",
    best: "En iyi",
    stars: {
      aria: "3 yıldızdan {n} tanesi",
      next2: "2. yıldız için: en fazla 1 çarpma",
      next3: "3. yıldız için: hiç çarpmadan, parçaların yarısını topla",
      record: "Yeni rekor!",
      total: "Toplam yıldız",
    },
  },
};

export default tr;
