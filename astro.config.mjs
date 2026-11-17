// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://carotos.org",
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "tr",
        // src/i18n/diller.ts ile aynı 9 dil
        locales: {
          tr: "tr-TR", en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES",
          pt: "pt-BR", ru: "ru-RU", ja: "ja-JP", zh: "zh-Hans",
        },
      },
      // 404 sayfası site haritasına girmez
      filter: (sayfa) => !sayfa.includes("/404"),
    }),
  ],
});
