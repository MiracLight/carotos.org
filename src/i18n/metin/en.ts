/* Ortak bileşen metinleri: English. Diğer diller bu dosyanın yapısını izler (Metin türü). */
const en = {
  skip: "Skip to content",
  nav: {
    menuAria: "Main menu",
    approach: "Approach",
    apps: "Applications",
    changelog: "Changelog",
    download: "Download",
    langLabel: "Language",
  },
  footer: {
    eyebrow: "Contact",
    heading: "Contact",
    lede: "Bug reports and contributions go through GitHub, questions and discussion on Reddit. Everything else by email.",
    made: "Built by",
    team: [
      {
        name: "Yusuf Miraç Üzümcüler",
        title: "Founder & Lead System Architect",
        role: "Core system development, architecture and design, infrastructure management.",
      },
      {
        name: "Metin Ege Boyar",
        title: "Co-Founder, Community & Growth",
        role: "Community management, communications strategy and project coordination.",
      },
    ],
    licence: "Released under the GPL-3.0 licence. Based on Debian 13 “trixie”.",
    channels: [
      { key: "github", label: "GitHub", sub: "Source, releases, issue tracker" },
      { key: "youtube", label: "YouTube", sub: "Walkthrough videos" },
      { key: "instagram", label: "Instagram", sub: "Announcements" },
      { key: "tiktok", label: "TikTok", sub: "Short videos" },
      { key: "reddit", label: "Reddit", sub: "Community and discussion" },
      { key: "mail", label: "Email", sub: "General enquiries" },
    ],
  },
  slayt: {
    onceki: "Previous image",
    sonraki: "Next image",
    git: "Go to image",
    bolge: "Screenshots",
    buyut: "View full size",
    kapat: "Close",
    ipucu: "Click to enlarge",
  },
  minigame: {
    consoleMsg: "There is something hidden here. Press the big turtle on the home page 5 times in a row.",
    label: "Hidden game: Reach the sea",
    close: "Close",
    mute: "Toggle sound",
    level: "Level",
    hint: "← → or swipe",
    reached: "You reached the sea!",
    variants: ["Shoreline", "Rocky Cove", "Driftwood Beach", "Tide Pools", "Coral Shore", "Moonlit Beach", "Storm Coast", "Litter Shore", "Windy Dunes"],
    pu: { shield: "Shield", shieldBreak: "Shield saved you!", magnet: "Magnet", surf: "Wave rush", plastic: "Plastic: weighed down" },
    egg: { l1: "Crack the shell", l2: "and help it reach the sea", tap: "Tap / click!" },
    introTitle: "A hatchling wants to reach the sea.",
    introText: "First crack the eggshell. Then guide the hatchling past the obstacles to the sea. Collect the glowing bubbles and avoid plastic waste in the red dashed ring. Each level is longer and faster than the last.",
    start: "Start",
    /** {n}: bölüm numarası */
    doneTitle: "Level {n} complete",
    doneLead: "You reached the sea!",
    tipLabel: "Security tip",
    parts: "Shell pieces collected",
    next: "Next level",
    overTitle: "The hatchling didn't make it",
    overText: "All lives are gone. You can try the same level again.",
    retry: "Try again",
    best: "Best",
    stars: {
      aria: "{n} of 3 stars",
      next2: "Next star: at most 1 hit",
      next3: "Next star: no hits and collect half the shell pieces",
      record: "New best!",
      total: "Total stars",
    },
  },
};

export type Metin = typeof en;
export default en;
