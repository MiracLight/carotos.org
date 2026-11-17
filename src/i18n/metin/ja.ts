/* Ortak bileşen metinleri: 日本語. en.ts'den çevrildi (Metin türü). */
import type { Metin } from "./en";

const ja: Metin = {
  skip: "本文へスキップ",
  nav: {
    menuAria: "メインメニュー",
    approach: "方針",
    apps: "アプリケーション",
    changelog: "変更履歴",
    download: "ダウンロード",
    langLabel: "言語",
  },
  footer: {
    eyebrow: "お問い合わせ",
    heading: "お問い合わせ",
    lede: "不具合の報告と貢献は GitHub で、質問や議論は Reddit で受け付けています。そのほかはメールでご連絡ください。",
    made: "開発者",
    team: [
      {
        name: "Yusuf Miraç Üzümcüler",
        title: "創設者 兼 リードシステムアーキテクト",
        role: "システム本体の開発、アーキテクチャーと設計、インフラの管理。",
      },
      {
        name: "Metin Ege Boyar",
        title: "共同創設者、コミュニティ&グロース",
        role: "コミュニティの運営、広報戦略、プロジェクトの調整。",
      },
    ],
    licence: "GPL-3.0 ライセンスで公開しています。Debian 13 “trixie” をベースにしています。",
    channels: [
      { key: "github", label: "GitHub", sub: "ソース、リリース、課題トラッカー" },
      { key: "youtube", label: "YouTube", sub: "解説動画" },
      { key: "instagram", label: "Instagram", sub: "お知らせ" },
      { key: "tiktok", label: "TikTok", sub: "ショート動画" },
      { key: "reddit", label: "Reddit", sub: "コミュニティと議論" },
      { key: "mail", label: "メール", sub: "一般のお問い合わせ" },
    ],
  },
  slayt: {
    onceki: "前の画像",
    sonraki: "次の画像",
    git: "画像へ移動",
    bolge: "スクリーンショット",
    buyut: "原寸大で表示",
    kapat: "閉じる",
    ipucu: "クリックで拡大",
  },
  minigame: {
    consoleMsg: "ここには隠れたものがあります。ホームページの大きなカメを、続けて5回押してみてください。",
    label: "隠しゲーム: 海へたどり着こう",
    close: "閉じる",
    mute: "サウンドの切り替え",
    level: "レベル",
    hint: "← → またはスワイプ",
    reached: "海にたどり着きました!",
    variants: ["海岸線", "岩だらけの入り江", "流木の浜", "潮だまり", "サンゴの岸", "月夜の浜", "嵐の海岸", "ごみだらけの岸", "風の砂丘"],
    pu: { shield: "シールド", shieldBreak: "シールドが守ってくれました!", magnet: "マグネット", surf: "ウェーブダッシュ", plastic: "プラスチック: 動きが重くなる" },
    egg: { l1: "殻を割って", l2: "海へ向かう手助けをしよう", tap: "タップ / クリック!" },
    introTitle: "子ガメが海を目指しています。",
    introText: "まず卵の殻を割りましょう。そのあと、障害物をよけながら子ガメを海まで導きます。光るあぶくを集め、赤い破線の輪の中のプラスチックごみは避けてください。レベルが進むほど、コースは長く、速くなります。",
    start: "スタート",
    /** {n}: bölüm numarası */
    doneTitle: "レベル {n} クリア",
    doneLead: "海にたどり着きました!",
    tipLabel: "セキュリティのヒント",
    parts: "集めた殻のかけら",
    next: "次のレベル",
    overTitle: "子ガメは海にたどり着けませんでした",
    overText: "ライフがなくなりました。同じレベルにもう一度挑戦できます。",
    retry: "もう一度",
    best: "ベスト",
    stars: {
      aria: "3つ中 {n} つの星",
      next2: "次の星: 被弾1回まで",
      next3: "次の星: 被弾なしで、殻のかけらを半分集める",
      record: "新記録!",
      total: "星の合計",
    },
  },
};

export default ja;
