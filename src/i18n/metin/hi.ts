import type { Metin } from "./en";
/* Ortak bileşen metinleri: English. Diğer diller bu dosyanın yapısını izler (Metin türü). */
const hi: Metin = {
  skip: "कंटेंट पर जाएं",
  nav: {
    menuAria: "मुख्य मेनू",
    approach: "दृष्टिकोण",
    apps: "एप्लिकेशन",
    changelog: "परिवर्तन सूची",
    download: "डाउनलोड करें",
    langLabel: "भाषा",
  },
  footer: {
    eyebrow: "संपर्क",
    heading: "संपर्क",
    lede: "Bug reports और contributions GitHub के माध्यम से, सवाल और चर्चा Reddit पर। बाकी सब ईमेल द्वारा।",
    made: "बनाया गया",
    team: [
      {
        name: "Yusuf Miraç Üzümcüler",
        title: "संस्थापक और मुख्य सिस्टम आर्किटेक्ट",
        role: "Core system development, architecture और design, infrastructure management.",
      },
      {
        name: "Metin Ege Boyar",
        title: "सह-संस्थापक, समुदाय और विकास",
        role: "Community management, communications strategy और project coordination.",
      },
    ],
    licence: "GPL-3.0 licence के तहत रिलीज़ किया गया। Debian 13 “trixie” पर आधारित।",
    channels: [
      { key: "github", label: "GitHub", sub: "सोर्स, रिलीज़, समस्या ट्रैकर" },
      { key: "youtube", label: "YouTube", sub: "मार्गदर्शक वीडियो" },
      { key: "instagram", label: "Instagram", sub: "घोषणाएँ" },
      { key: "tiktok", label: "TikTok", sub: "छोटे वीडियो" },
      { key: "reddit", label: "Reddit", sub: "Community और discussion" },
      { key: "mail", label: "ईमेल", sub: "सामान्य पूछताछ" },
    ],
  },
  slayt: {
    onceki: "पिछली इमेज",
    sonraki: "अगली इमेज",
    git: "इमेज पर जाएं",
    bolge: "स्क्रीनशॉट्स",
    buyut: "फुल साइज देखें",
    kapat: "बंद करें",
    ipucu: "बड़ा करने के लिए क्लिक करें",
  },
  minigame: {
    consoleMsg: "यहाँ कुछ छिपा हुआ है। होम पेज पर बड़े कछुए को लगातार 5 बार दबाएं।",
    label: "छिपा हुआ खेल: समुद्र तक पहुँचें",
    close: "बंद करें",
    mute: "आवाज़ चालू/बंद करें",
    level: "स्तर",
    hint: "← → या स्वाइप करें",
    reached: "आप समुद्र तक पहुँच गए!",
    variants: ["समुद्र तट", "पथरीली खाड़ी", "लकड़ियों वाला तट", "ज्वार के कुंड", "मूंगा तट", "चाँदनी तट", "तूफ़ानी तट", "कचरे वाला तट", "हवादार टीले"],
    pu: { shield: "ढाल", shieldBreak: "Shield ने आपको बचा लिया!", magnet: "चुंबक", surf: "लहर की रफ़्तार", plastic: "प्लास्टिक: भार बढ़ गया" },
    egg: { l1: "शेल को तोड़ें", l2: "और इसे समुद्र तक पहुँचने में मदद करें", tap: "टैप / क्लिक करें!" },
    introTitle: "एक हैचलिंग समुद्र तक पहुँचना चाहता है।",
    introText: "पहले अंडे का शेल तोड़ें। फिर हैचलिंग को बाधाओं को पार करते हुए समुद्र तक ले जाएँ। चमकते हुए बुलबुलों को इकट्ठा करें और लाल डैश्ड रिंग में प्लास्टिक कचरे से बचें। हर लेवल पिछले वाले से लंबा और तेज़ होता है।",
    start: "शुरू करें",
    /** {n}: bölüm numarası */
    doneTitle: "लेवल {n} पूरा हुआ",
    doneLead: "आप समुद्र तक पहुँच गए!",
    tipLabel: "सुरक्षा टिप",
    parts: "शेल के टुकड़े इकट्ठा किए गए",
    next: "अगला लेवल",
    overTitle: "हैचलिंग नहीं पहुँच पाया",
    overText: "सभी लाइफ खत्म हो गई हैं। आप फिर से वही लेवल खेल सकते हैं।",
    retry: "फिर से कोशिश करें",
    best: "सर्वश्रेष्ठ",
    stars: {
      aria: "3 में से {n} स्टार",
      next2: "अगला स्टार: अधिकतम 1 हिट",
      next3: "अगला स्टार: कोई हिट नहीं और आधे शेल के टुकड़े इकट्ठा करें",
      record: "नया सर्वश्रेष्ठ!",
      total: "कुल स्टार",
    },
  },
};

export default hi;
