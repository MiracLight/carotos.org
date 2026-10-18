/**
 * Mini oyunun bölüm sonunda gösterdiği güvenlik ipuçları.
 *
 * Oyun açılmadan indirilmez; bölüm bitince tembel yüklenir. Her bölümde
 * karıştırılmış bir desteden sıradaki ipucu çekilir: aynı ipucu, desteğin
 * tamamı bitmeden tekrar etmez. Deste tarayıcıda saklanır.
 */

export const TIPS = {
  tr: [
    // Parolalar
    "Her hesap için ayrı ve uzun bir parola kullanın.",
    "Uzun bir parola, kısa ama karmaşık görünen bir paroladan genellikle daha güçlüdür.",
    "Birkaç rastgele kelimeden oluşan bir parola cümlesi hem güçlü hem de hatırlaması kolaydır.",
    "Parolalarınızı güvenilir bir parola yöneticisinde saklayın.",
    "Parolanızı masanızdaki bir kâğıda ya da herkesin görebileceği bir nota yazmayın.",
    "Doğum tarihi ve evcil hayvan adı gibi tahmin edilebilir bilgileri parola olarak kullanmayın.",
    "Bir hesabınız sızdırıldıysa aynı parolayı kullandığınız her yerde değiştirin.",
    "Parolayı değiştirirken eskisinin sonuna bir sayı eklemek yerine tamamen yeni bir parola seçin.",
    "Parolanızı hangi gerekçeyle istenirse istensin kimseyle paylaşmayın; gerçek bir kurum bunu sormaz.",
    "Modem, yazıcı ve kamera gibi cihazların varsayılan parolalarını ilk kurulumda değiştirin.",

    // Hesap güvenliği
    "Mümkün olan her yerde iki adımlı doğrulamayı açın.",
    "SMS yerine doğrulama uygulaması ya da güvenlik anahtarı kullanmak daha güvenlidir.",
    "Yedek kurtarma kodlarını çevrimdışı ve güvenli bir yerde saklayın.",
    "Telefonunuza gelen doğrulama kodunu kimseyle paylaşmayın.",
    "Beklemediğiniz bir doğrulama kodu geldiyse hesabınız hedef alınıyor olabilir; parolanızı değiştirin.",
    "E-posta hesabınızı en iyi şekilde koruyun; diğer hesapların parola sıfırlaması buradan geçer.",
    "Kullanmadığınız eski hesapları kapatın.",
    "Hesabınıza hangi cihazların bağlı olduğunu zaman zaman kontrol edin.",
    "Hesap güvenliği bildirimlerini açık tutun.",
    "Tanımadığınız oturumları hesap ayarlarından sonlandırın.",

    // Oltalama ve dolandırıcılık
    "Şüpheli bağlantılara tıklamadan önce adresi kontrol edin.",
    "Acele ettiren ya da korkutan mesajlar karşısında bir an durun; saldırganlar telaştan yararlanır.",
    "Bankanız sizi bir bağlantı üzerinden giriş yapmaya yönlendirmez; uygulamayı ya da adresi kendiniz açın.",
    "Gönderen adresine dikkat edin: tek harflik bir fark sahte bir alan adını ele verebilir.",
    "Ekli dosyayı açmadan önce göndericiyi başka bir yoldan doğrulayın.",
    "Beklemediğiniz kargo ya da ödeme mesajlarındaki bağlantılara tıklamayın.",
    "Kısaltılmış bağlantıların nereye gittiğini açmadan önce önizleyin.",
    "“Hesabınız kapatılacak” gibi tehditkâr e-postalar çoğunlukla oltalama girişimidir.",
    "QR kodu okutmadan önce kaynağından emin olun; kodun üstüne sahte bir etiket yapıştırılmış olabilir.",
    "Sahte teknik destek aramalarında bilgisayarınıza uzaktan erişim yazılımı kurmayın.",
    "Kimlik bilgisi isteyen bir sayfaya girmeden önce adres çubuğundaki alan adını kontrol edin.",
    "Tanıdığınız birinden gelse bile alışılmadık bir mesaj, hesabının ele geçirildiğini gösterebilir.",

    // Yazılım ve güncellemeler
    "Yazılım güncellemelerini ertelemeyin.",
    "Yazılımı yalnızca resmî depolardan ya da geliştiricinin kendi sitesinden kurun.",
    "Kırılmış (crack) yazılımlar çoğu zaman zararlı yazılım taşır.",
    "Kullanmadığınız uygulamaları ve eklentileri kaldırın.",
    "Tarayıcı eklentilerini az tutun; her biri tarayıcıdaki verilerinize erişebilir.",
    "Güncelleme bildirimini kapatmak yerine otomatik güncellemeyi açın.",
    "İndirdiğiniz dosyanın SHA256 sağlama toplamını geliştiricinin yayımladığıyla karşılaştırın.",
    "Desteği sona ermiş bir işletim sistemini kullanmaya devam etmeyin.",
    "Uygulamalara yalnızca işlevleri için gereken izinleri verin.",
    "Ne yaptığını okumadan, internetten aldığınız bir betiği terminalde çalıştırmayın.",

    // Ağ ve Wi-Fi
    "Ortak Wi-Fi ağlarında önemli hesaplara giriş yapmaktan kaçının.",
    "Ortak bir ağa bağlanmak zorundaysanız güvenilir bir sağlayıcının VPN hizmetini kullanın.",
    "Modemin yönetim parolasını ve Wi-Fi şifresini değiştirin; WPA2 ya da WPA3 kullanın.",
    "Adresi “https” ile başlamayan sitelere parola ya da kart bilgisi girmeyin.",
    "Misafirleriniz için ev ağında ayrı bir misafir ağı açın.",
    "Kullanmadığınız zaman Bluetooth’u kapatın.",
    "Modemin uzaktan yönetim özelliğini gerekmedikçe kapalı tutun.",
    "Bilmediğiniz Wi-Fi ağlarına otomatik bağlanma özelliğini kapatın.",
    "Ağınıza bağlı cihazları zaman zaman kontrol edin; tanımadığınız biri varsa Wi-Fi şifresini değiştirin.",
    "Güvenlik duvarını (firewall) açık tutun.",

    // Yedekleme ve veri
    "Önemli dosyaların yedeğini farklı bir yerde tutun.",
    "3-2-1 kuralı: üç kopya, iki farklı ortam ve en az biri başka bir yerde.",
    "Yedeklerinizin gerçekten geri yüklenebildiğini ara sıra deneyin.",
    "Fidye yazılımına karşı en etkili önlemlerden biri, bağlantısı kesilebilen çevrimdışı bir yedektir.",
    "Hassas dosyaları ve taşınabilir diskleri şifreleyin.",
    "Bir cihazı satmadan ya da vermeden önce içindeki verileri güvenli biçimde silin.",
    "Diskin tamamını şifreleyin; cihazınız kaybolsa bile verileriniz okunamaz.",
    "Silinen dosyaların çoğu özel araçlarla geri getirilebilir; hassas veriler için disk şifreleme kullanın.",
    "Gereksiz kişisel veri isteyen formlara bilgi vermeden önce verinin neden gerektiğini sorgulayın.",
    "Belgelerinizi buluta yüklerken paylaşım bağlantılarının kimlere açık olduğunu kontrol edin.",

    // Cihazlar ve fiziksel güvenlik
    "Bilmediğiniz USB belleği bilgisayara takmayın.",
    "Bilgisayarınızdan ayrılırken ekranı kilitleyin.",
    "Telefonunuzda ekran kilidi olarak PIN, parmak izi ya da yüz tanıma kullanın.",
    "Halka açık şarj istasyonları yerine kendi adaptörünüzü kullanın.",
    "Kaybolan cihaz için uzaktan kilitleme ve silme özelliğini önceden açın.",
    "Kullanmadığınız zaman web kamerasının kapağını kapalı tutun.",
    "Parola yazarken ekranınızın omzunuzun üstünden görünmemesine dikkat edin.",
    "Cihazınızı başkasına verirken önce hesaplarınızdan çıkış yapın.",
    "Eski cihazları atmadan ya da vermeden önce fabrika ayarlarına döndürün.",
    "Akıllı ev cihazlarının (kamera, priz, ampul) yazılımını güncel tutun.",

    // Gizlilik ve sosyal medya
    "Sosyal medyada konum, adres ve tatil planı gibi bilgileri herkese açık paylaşmayın.",
    "Paylaştığınız fotoğrafların içindeki konum bilgisini (EXIF) silmeyi düşünün.",
    "Sosyal medya gizlilik ayarlarını düzenli olarak gözden geçirin.",
    "Kimlik, kart ya da bilet fotoğraflarını paylaşmayın.",
    "Tanımadığınız kişilerden gelen arkadaşlık isteklerini kabul etmeden önce düşünün.",
    "İnternette bir kez paylaşılan şeyi tamamen silmek zordur; paylaşmadan önce düşünün.",
    "Her siteye ayrı bir e-posta takma adı kullanmak, bir sızıntının nereden kaynaklandığını gösterir.",
    "Tarayıcıda üçüncü taraf çerezlerini engelleyin.",
    "Çocukların kullandığı hesaplarda ebeveyn denetimini ve gizlilik ayarlarını açın.",
    "Bir uygulama gereğinden fazla izin istiyorsa kurmadan önce alternatiflerine bakın.",

    // Alışveriş ve finans
    "Çevrimiçi alışverişte mümkünse tek kullanımlık ya da sanal kart kullanın.",
    "Fiyatı gerçek olamayacak kadar düşük bir ilan çoğu zaman dolandırıcılıktır.",
    "Banka hesabınızdaki işlemleri düzenli kontrol edin ve bildirimleri açık tutun.",
    "Kart bilgilerinizi yalnızca güvenilir sitelerde ve gerektiğinde girin.",
    "Tanımadığınız birinden gelen “yanlışlıkla para yatırdım” mesajlarına karşı dikkatli olun.",
    "“Garanti kazanç” vaat eden yatırım ve kripto teklifleri bir uyarı işaretidir.",
    "Alışverişte ödemeyi platformun güvenli ödeme sistemi dışında yapmayın.",
    "Kimlik ya da kart bilgilerinizi telefonla ya da mesajla gelen taleplere vermeyin.",
    "Bir kurumdan aradığını söyleyen kişiyle konuşmayı bırakıp resmî numarayı kendiniz arayın.",
    "Kart ekstrenizi ve kredi raporunuzu zaman zaman gözden geçirin.",

    // Genel ilkeler
    "Sosyal mühendislik, teknik açıklardan çok insanın güvenine ve acelesine dayanır.",
    "Güvenlik zinciri en zayıf halkası kadar güçlüdür; çoğu zaman bu halka alışkanlıklardır.",
    "“Bana bir şey olmaz” düşüncesi en sık yapılan güvenlik hatasıdır; herkes hedef olabilir.",
    "En az yetki ilkesi: bir kişiye ya da uygulamaya yalnızca ihtiyacı kadar erişim verin.",
    "Güvenlik bir kez yapılıp biten bir iş değil, sürekli bir alışkanlıktır.",
    "Şüphelendiğinizde durun, doğrulayın ve gerekirse ilgili kuruma bildirin.",
    "Bir olay yaşarsanız saklamayın; erken bildirmek zararı büyük ölçüde azaltır.",
    "Oltalama girişimlerini bildirmek, başkalarının da tuzağa düşmesini engeller.",
    "Bir sızıntıdan etkilenip etkilenmediğinizi güvenilir bir sızıntı denetim servisinden kontrol edebilirsiniz.",
    "Öğrendiklerinizi aileniz ve arkadaşlarınızla paylaşın; güvenlik paylaşıldıkça güçlenir.",
  ],
  en: [
    // Passwords
    "Use a separate, long password for every account.",
    "A long password is usually stronger than a short one that only looks complicated.",
    "A passphrase made of a few random words is both strong and easy to remember.",
    "Store your passwords in a reputable password manager.",
    "Do not write your password on a sticky note or any paper others can see.",
    "Do not use guessable details such as a birthday or a pet’s name as a password.",
    "If an account is leaked, change the password everywhere you reused it.",
    "When you change a password, pick a completely new one instead of adding a number to the old one.",
    "Never share your password, whatever the reason given; a real organization will not ask for it.",
    "Change the default passwords of devices such as routers, printers and cameras during setup.",

    // Account security
    "Turn on two-factor authentication wherever it is available.",
    "An authenticator app or a security key is safer than SMS codes.",
    "Keep your backup recovery codes offline in a safe place.",
    "Never share the verification code sent to your phone.",
    "An unexpected verification code may mean someone is targeting your account; change your password.",
    "Protect your email account best of all; password resets for your other accounts go through it.",
    "Close old accounts you no longer use.",
    "Review from time to time which devices are signed in to your account.",
    "Keep account security notifications turned on.",
    "End sessions you do not recognize from your account settings.",

    // Phishing and fraud
    "Check the address before you click a suspicious link.",
    "Pause when a message rushes or frightens you; attackers rely on panic.",
    "Your bank will not send you to a link to sign in; open the app or type the address yourself.",
    "Look closely at the sender address: a single changed letter can reveal a fake domain.",
    "Verify the sender through another channel before opening an attachment.",
    "Do not click links in unexpected parcel or payment messages.",
    "Preview where a shortened link leads before you open it.",
    "Threatening emails such as “your account will be closed” are most often phishing attempts.",
    "Be sure of the source before scanning a QR code; a fake sticker may cover the real one.",
    "Never install remote access software during a fake tech support call.",
    "Check the domain in the address bar before entering your credentials on a page.",
    "An unusual message from someone you know may mean their account has been taken over.",

    // Software and updates
    "Do not postpone software updates.",
    "Install software only from official repositories or the developer’s own website.",
    "Cracked software often carries malware.",
    "Remove apps and extensions you no longer use.",
    "Keep browser extensions to a minimum; each one can access your browsing data.",
    "Turn on automatic updates instead of dismissing update notices.",
    "Compare the SHA256 checksum of a download with the one the developer publishes.",
    "Do not keep using an operating system that no longer receives support.",
    "Give apps only the permissions they need for their function.",
    "Do not run a script from the internet in a terminal without reading what it does.",

    // Network and Wi-Fi
    "Avoid signing in to important accounts on public Wi-Fi.",
    "If you must use a public network, use a VPN from a trustworthy provider.",
    "Change your router’s admin password and Wi-Fi password; use WPA2 or WPA3.",
    "Do not enter passwords or card details on sites whose address does not start with “https”.",
    "Set up a separate guest network at home for visitors.",
    "Turn Bluetooth off when you are not using it.",
    "Keep your router’s remote management turned off unless you need it.",
    "Turn off automatic connection to Wi-Fi networks you do not know.",
    "Check the devices on your network now and then; if one is unfamiliar, change the Wi-Fi password.",
    "Keep your firewall turned on.",

    // Backups and data
    "Keep a backup of important files in a separate place.",
    "The 3-2-1 rule: three copies, on two different media, with at least one kept elsewhere.",
    "Test now and then that your backups can really be restored.",
    "An offline backup you can disconnect is one of the best defenses against ransomware.",
    "Encrypt sensitive files and portable drives.",
    "Securely erase your data before selling or giving away a device.",
    "Encrypt the whole disk; even if the device is lost, your data stays unreadable.",
    "Most deleted files can be recovered with special tools; use disk encryption for sensitive data.",
    "Before giving personal data to a form, ask why it is needed.",
    "When you upload documents to the cloud, check who your sharing links are open to.",

    // Devices and physical security
    "Do not plug in a USB drive you do not recognize.",
    "Lock your screen whenever you step away from your computer.",
    "Use a PIN, fingerprint or face unlock as your phone’s screen lock.",
    "Use your own adapter instead of public charging stations.",
    "Turn on remote lock and wipe for lost devices before you need them.",
    "Keep your webcam covered when you are not using it.",
    "Make sure no one can see your screen over your shoulder while you type a password.",
    "Sign out of your accounts before handing your device to someone else.",
    "Reset old devices to factory settings before you discard or give them away.",
    "Keep the software of smart home devices (cameras, plugs, bulbs) up to date.",

    // Privacy and social media
    "Do not post your location, address or holiday plans publicly on social media.",
    "Consider removing location data (EXIF) from the photos you share.",
    "Review your social media privacy settings regularly.",
    "Do not share photos of your ID, bank card or tickets.",
    "Think before accepting friend requests from people you do not know.",
    "Anything shared online is hard to delete completely; think before you post.",
    "Using a separate email alias for each site shows where a leak came from.",
    "Block third-party cookies in your browser.",
    "Turn on parental controls and privacy settings for accounts that children use.",
    "If an app asks for more permissions than it needs, look for an alternative before installing.",

    // Shopping and finance
    "When you shop online, use a single-use or virtual card if you can.",
    "A listing priced too low to be real is very often a scam.",
    "Check your bank transactions regularly and keep notifications on.",
    "Enter your card details only on trustworthy sites and only when needed.",
    "Be careful with messages from strangers saying “I sent you money by mistake”.",
    "Investment and crypto offers that promise “guaranteed profit” are a warning sign.",
    "Do not pay a seller outside the platform’s secure payment system.",
    "Never give ID or card details to requests that arrive by phone or message.",
    "If someone claims to call from an organization, hang up and call its official number yourself.",
    "Review your card statement and credit report now and then.",

    // General principles
    "Social engineering relies less on technical flaws than on trust and haste.",
    "A security chain is only as strong as its weakest link, and that is often habit.",
    "“It won’t happen to me” is the most common security mistake; anyone can be a target.",
    "Least privilege: give a person or an app only the access it needs.",
    "Security is not a one-time task; it is a continuing habit.",
    "When in doubt, stop, verify, and report to the right organization if needed.",
    "If something happens to you, do not hide it; reporting early greatly reduces the damage.",
    "Reporting a phishing attempt keeps others from falling for it too.",
    "You can check whether a data breach affected you with a trustworthy breach-checking service.",
    "Share what you learn with family and friends; security grows stronger when shared.",
  ],
};

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
  const list = TIPS[lang] || TIPS.tr;
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
