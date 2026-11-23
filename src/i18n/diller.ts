/* ------------------------------------------------------------------
   Sitenin dilleri. CarotOS arayüzüyle aynı 11 dil.
   Yeni dil: buraya bir satır, src/i18n/metin/<kod>.ts ve
   src/pages/<kod>/{index,changelog}.astro, src/scripts/ipuclari/<kod>.js.
   ------------------------------------------------------------------ */

export const DILLER = ["tr", "en", "de", "fr", "es", "pt", "ru", "ja", "zh", "ar", "hi"] as const;
export type Dil = (typeof DILLER)[number];

/** Sayfa türleri: her dilde aynı sayfanın karşılığı vardır. */
export type Sayfa = "ana" | "notlar";

interface DilBilgisi {
  /** Dil seçicide görünen ad (dilin kendi adıyla) */
  ad: string;
  /** <html lang> ve hreflang değeri */
  hreflang: string;
  /** og:locale */
  og: string;
  /** Ana sayfa yolu */
  ana: string;
  /** Sürüm notları yolu */
  notlar: string;
  /** İndirme bölümünün çapası (ana sayfadaki id) */
  indir: string;
  /** Yaklaşım ve uygulamalar bölümlerinin çapaları */
  felsefe: string;
  icinde: string;
}

export const DIL_BILGI: Record<Dil, DilBilgisi> = {
  tr: { ad: "Türkçe", hreflang: "tr", og: "tr_TR", ana: "/", notlar: "/surum-notlari", indir: "indir", felsefe: "felsefe", icinde: "icinde" },
  en: { ad: "English", hreflang: "en", og: "en_US", ana: "/en", notlar: "/en/changelog", indir: "download", felsefe: "philosophy", icinde: "inside" },
  de: { ad: "Deutsch", hreflang: "de", og: "de_DE", ana: "/de", notlar: "/de/changelog", indir: "download", felsefe: "philosophy", icinde: "inside" },
  fr: { ad: "Français", hreflang: "fr", og: "fr_FR", ana: "/fr", notlar: "/fr/changelog", indir: "download", felsefe: "philosophy", icinde: "inside" },
  es: { ad: "Español", hreflang: "es", og: "es_ES", ana: "/es", notlar: "/es/changelog", indir: "download", felsefe: "philosophy", icinde: "inside" },
  pt: { ad: "Português", hreflang: "pt-BR", og: "pt_BR", ana: "/pt", notlar: "/pt/changelog", indir: "download", felsefe: "philosophy", icinde: "inside" },
  ru: { ad: "Русский", hreflang: "ru", og: "ru_RU", ana: "/ru", notlar: "/ru/changelog", indir: "download", felsefe: "philosophy", icinde: "inside" },
  ja: { ad: "日本語", hreflang: "ja", og: "ja_JP", ana: "/ja", notlar: "/ja/changelog", indir: "download", felsefe: "philosophy", icinde: "inside" },
  zh: { ad: "简体中文", hreflang: "zh-Hans", og: "zh_CN", ana: "/zh", notlar: "/zh/changelog", indir: "download", felsefe: "philosophy", icinde: "inside" },
  ar: { ad: "العربية", hreflang: "ar", og: "ar_EG", ana: "/ar", notlar: "/ar/changelog", indir: "download", felsefe: "philosophy", icinde: "inside" },
  hi: { ad: "हिन्दी", hreflang: "hi", og: "hi_IN", ana: "/hi", notlar: "/hi/changelog", indir: "download", felsefe: "philosophy", icinde: "inside" },
};

/** Bir dildeki sayfanın yolu. */
export function sayfaYolu(dil: Dil, sayfa: Sayfa): string {
  return sayfa === "ana" ? DIL_BILGI[dil].ana : DIL_BILGI[dil].notlar;
}

/** Ana sayfadaki bir bölüme bağlantı ("/#indir", "/de#download"). */
export function bolumYolu(dil: Dil, bolum: "indir" | "felsefe" | "icinde"): string {
  const b = DIL_BILGI[dil];
  return `${b.ana === "/" ? "/" : b.ana}#${b[bolum]}`;
}

/** Yoldan sayfa türünü bulur (dil seçici için). Bilinmeyen yol: ana sayfa. */
export function yoldanSayfa(yol: string): Sayfa {
  const temiz = yol.replace(/\/+$/, "") || "/";
  for (const d of DILLER) {
    if (DIL_BILGI[d].notlar === temiz) return "notlar";
  }
  return "ana";
}
