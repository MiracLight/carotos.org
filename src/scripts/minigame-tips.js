/**
 * Mini oyunun bölüm sonunda gösterdiği güvenlik ipuçları.
 *
 * Oyun açılmadan indirilmez; bölüm bitince tembel yüklenir. Her bölümde
 * karıştırılmış bir desteden sıradaki ipucu çekilir: aynı ipucu, desteğin
 * tamamı bitmeden tekrar etmez. Deste tarayıcıda saklanır.
 */

import tr from "./ipuclari/tr.js";
import en from "./ipuclari/en.js";
import de from "./ipuclari/de.js";
import fr from "./ipuclari/fr.js";
import es from "./ipuclari/es.js";
import pt from "./ipuclari/pt.js";
import ru from "./ipuclari/ru.js";
import ja from "./ipuclari/ja.js";
import zh from "./ipuclari/zh.js";

/** Dil koduna göre ipucu listeleri (her dil src/scripts/ipuclari/<kod>.js). */
export const TIPS = { tr, en, de, fr, es, pt, ru, ja, zh };

/** Diziyi karıştırır (Fisher–Yates). */
function shuffle(a, rand) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/**
 * Karıştırılmış desteden bir sonraki ipucunu verir. Deste bitince yeniden
 * karıştırılır; yeni destenin ilk ipucu, bir önceki destenin sonuncusu olmaz.
 * `storage` verilmezse localStorage kullanılır; ulaşılamazsa rastgele seçilir.
 */
export function pickTip(lang, storage, rand = Math.random) {
  const list = TIPS[lang] || TIPS.en;
  const key = `carotos-oyun-ipucu-${lang}`;
  let st = storage;
  if (st === undefined) {
    try {
      st = window.localStorage;
    } catch {
      st = null;
    }
  }
  let deck = [];
  let last = -1;
  try {
    const raw = st && JSON.parse(st.getItem(key) || "null");
    if (raw && Array.isArray(raw.deck)) {
      deck = raw.deck.filter((i) => Number.isInteger(i) && i >= 0 && i < list.length);
      last = Number.isInteger(raw.last) ? raw.last : -1;
    }
  } catch {
    deck = [];
  }
  if (!deck.length) {
    deck = shuffle(
      list.map((_, i) => i),
      rand,
    );
    if (deck.length > 1 && deck[deck.length - 1] === last) {
      [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]];
    }
  }
  const idx = deck.pop();
  try {
    st && st.setItem(key, JSON.stringify({ deck, last: idx }));
  } catch {
    /* depolama kapalı olabilir */
  }
  return list[idx];
}
