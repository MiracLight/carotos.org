// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://carotos.org",
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "tr",
        locales: { tr: "tr-TR", en: "en-US" },
      },
      // 404 sayfası site haritasına girmez
      filter: (sayfa) => !sayfa.includes("/404"),
    }),
  ],
});
