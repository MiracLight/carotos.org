/* Ortak bileşen metinleri: zh (Basitleştirilmiş Çince). İngilizceden çevrildi. */
import type { Metin } from "./en";

const zh: Metin = {
  skip: "跳到正文",
  nav: {
    menuAria: "主菜单",
    approach: "理念",
    apps: "应用",
    changelog: "更新日志",
    download: "下载",
    langLabel: "语言",
  },
  footer: {
    eyebrow: "联系",
    heading: "联系我们",
    lede: "错误报告和代码贡献请通过 GitHub 提交，提问和讨论请到 Reddit。其他事宜请发邮件。",
    made: "开发者",
    team: [
      {
        name: "Yusuf Miraç Üzümcüler",
        title: "创始人兼首席系统架构师",
        role: "负责核心系统开发、架构与设计以及基础设施管理。",
      },
      {
        name: "Metin Ege Boyar",
        title: "联合创始人，社区与增长",
        role: "负责社区管理、传播策略和项目协调。",
      },
    ],
    licence: "以 GPL-3.0 许可证发布。基于 Debian 13 “trixie”。",
    channels: [
      { key: "github", label: "GitHub", sub: "源代码、发布、问题追踪" },
      { key: "youtube", label: "YouTube", sub: "演示视频" },
      { key: "instagram", label: "Instagram", sub: "公告" },
      { key: "reddit", label: "Reddit", sub: "社区与讨论" },
      { key: "mail", label: "电子邮件", sub: "一般咨询" },
    ],
  },
  slayt: {
    onceki: "上一张图片",
    sonraki: "下一张图片",
    git: "转到图片",
    bolge: "截图",
    buyut: "查看原图",
    kapat: "关闭",
    ipucu: "点击放大",
  },
  minigame: {
    consoleMsg: "这里藏着一样东西。请在首页连续点击大海龟 5 次。",
    label: "隐藏小游戏：到达大海",
    close: "关闭",
    mute: "切换声音",
    level: "关卡",
    hint: "← → 或滑动",
    reached: "你到达了大海！",
    variants: ["海岸线", "岩石海湾", "漂流木海滩", "潮池", "珊瑚海岸", "月光海滩", "风暴海岸", "垃圾海岸", "多风沙丘"],
    pu: { shield: "护盾", shieldBreak: "护盾救了你！", magnet: "磁铁", surf: "浪潮冲刺", plastic: "塑料：被拖慢了" },
    egg: { l1: "敲开蛋壳", l2: "帮小海龟到达大海", tap: "点击 / 单击！" },
    introTitle: "一只小海龟想到达大海。",
    introText: "先敲开蛋壳，然后引导小海龟避开障碍，游向大海。收集发光的气泡，避开红色虚线圈中的塑料垃圾。每一关都比上一关更长、更快。",
    start: "开始",
    /** {n}: bölüm numarası */
    doneTitle: "第 {n} 关完成",
    doneLead: "你到达了大海！",
    tipLabel: "安全提示",
    parts: "已收集的蛋壳碎片",
    next: "下一关",
    overTitle: "小海龟没能成功",
    overText: "生命已用完。你可以重新挑战同一关。",
    retry: "再试一次",
    best: "最佳",
    stars: {
      aria: "3 颗星中的 {n} 颗",
      next2: "下一颗星：最多被撞 1 次",
      next3: "下一颗星：不被撞，并收集一半的蛋壳碎片",
      record: "新纪录！",
      total: "星星总数",
    },
  },
};

export default zh;
