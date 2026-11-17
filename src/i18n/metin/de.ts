/* Ortak bileşen metinleri: de. */
import type { Metin } from "./en";

const de: Metin = {
  skip: "Zum Inhalt springen",
  nav: {
    menuAria: "Hauptmenü",
    approach: "Ansatz",
    apps: "Anwendungen",
    changelog: "Änderungsprotokoll",
    download: "Herunterladen",
    langLabel: "Sprache",
  },
  footer: {
    eyebrow: "Kontakt",
    heading: "Kontakt",
    lede: "Fehlerberichte und Beiträge laufen über GitHub, Fragen und Diskussionen über Reddit. Alles andere per E-Mail.",
    made: "Entwickelt von",
    team: [
      {
        name: "Yusuf Miraç Üzümcüler",
        title: "Gründer und leitender Systemarchitekt",
        role: "Entwicklung des Kernsystems, Architektur und Gestaltung, Verwaltung der Infrastruktur.",
      },
      {
        name: "Metin Ege Boyar",
        title: "Mitgründer, Community und Wachstum",
        role: "Community-Management, Kommunikationsstrategie und Projektkoordination.",
      },
    ],
    licence: "Veröffentlicht unter der Lizenz GPL-3.0. Basiert auf Debian 13 „trixie“.",
    channels: [
      { key: "github", label: "GitHub", sub: "Quellcode, Releases, Issue-Tracker" },
      { key: "youtube", label: "YouTube", sub: "Videoanleitungen" },
      { key: "instagram", label: "Instagram", sub: "Ankündigungen" },
      { key: "reddit", label: "Reddit", sub: "Community und Diskussion" },
      { key: "mail", label: "E-Mail", sub: "Allgemeine Anfragen" },
    ],
  },
  slayt: {
    onceki: "Vorheriges Bild",
    sonraki: "Nächstes Bild",
    git: "Zu Bild springen",
    bolge: "Screenshots",
    buyut: "In voller Größe ansehen",
    kapat: "Schließen",
    ipucu: "Zum Vergrößern klicken",
  },
  minigame: {
    consoleMsg: "Hier ist etwas versteckt. Klicke auf der Startseite fünfmal hintereinander auf die große Schildkröte.",
    label: "Verstecktes Spiel: Erreiche das Meer",
    close: "Schließen",
    mute: "Ton umschalten",
    level: "Level",
    hint: "← → oder wischen",
    reached: "Du hast das Meer erreicht!",
    variants: ["Küstenlinie", "Felsbucht", "Treibholzstrand", "Gezeitentümpel", "Korallenufer", "Mondscheinstrand", "Sturmküste", "Müllstrand", "Windige Dünen"],
    pu: { shield: "Schild", shieldBreak: "Der Schild hat dich gerettet!", magnet: "Magnet", surf: "Wellenschub", plastic: "Plastik: beschwert" },
    egg: { l1: "Knacke die Schale", l2: "und hilf dem Jungtier zum Meer", tap: "Tippen / klicken!" },
    introTitle: "Ein Jungtier will zum Meer.",
    introText: "Knacke zuerst die Eierschale. Führe dann das Jungtier an den Hindernissen vorbei zum Meer. Sammle die leuchtenden Blasen und meide Plastikmüll im roten gestrichelten Ring. Jedes Level ist länger und schneller als das vorige.",
    start: "Starten",
    /** {n}: bölüm numarası */
    doneTitle: "Level {n} geschafft",
    doneLead: "Du hast das Meer erreicht!",
    tipLabel: "Sicherheitstipp",
    parts: "Gesammelte Schalenstücke",
    next: "Nächstes Level",
    overTitle: "Das Jungtier hat es nicht geschafft",
    overText: "Alle Leben sind verbraucht. Du kannst dasselbe Level noch einmal versuchen.",
    retry: "Noch einmal",
    best: "Bestwert",
    stars: {
      aria: "{n} von 3 Sternen",
      next2: "Nächster Stern: höchstens 1 Treffer",
      next3: "Nächster Stern: keine Treffer und die Hälfte der Schalenstücke gesammelt",
      record: "Neuer Bestwert!",
      total: "Sterne insgesamt",
    },
  },
};

export default de;
