/* Dil koduna göre ortak bileşen metinleri. */
import type { Dil } from "../diller";
import type { Metin } from "./en";
import tr from "./tr";
import en from "./en";
import de from "./de";
import fr from "./fr";
import es from "./es";
import pt from "./pt";
import ru from "./ru";
import ja from "./ja";
import zh from "./zh";
import ar from "./ar";
import hi from "./hi";

const METINLER: Record<Dil, Metin> = { tr, en, de, fr, es, pt, ru, ja, zh, ar, hi };

export function metin(dil: Dil): Metin {
  return METINLER[dil] ?? en;
}
