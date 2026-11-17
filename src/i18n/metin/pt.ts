/* Ortak bileşen metinleri: pt (português do Brasil). Yapı en.ts ile aynı (Metin türü). */
import type { Metin } from "./en";

const pt: Metin = {
  skip: "Ir para o conteúdo",
  nav: {
    menuAria: "Menu principal",
    approach: "Abordagem",
    apps: "Aplicativos",
    changelog: "Histórico de versões",
    download: "Baixar",
    langLabel: "Idioma",
  },
  footer: {
    eyebrow: "Contato",
    heading: "Contato",
    lede: "Relatos de erros e contribuições vão pelo GitHub; dúvidas e conversas, pelo Reddit. Qualquer outro assunto, por e-mail.",
    made: "Criado por",
    team: [
      {
        name: "Yusuf Miraç Üzümcüler",
        title: "Fundador e Arquiteto-Chefe do Sistema",
        role: "Desenvolvimento do núcleo do sistema, arquitetura e design, gerenciamento da infraestrutura.",
      },
      {
        name: "Metin Ege Boyar",
        title: "Cofundador, Comunidade e Crescimento",
        role: "Gestão da comunidade, estratégia de comunicação e coordenação do projeto.",
      },
    ],
    licence: "Distribuído sob a licença GPL-3.0. Baseado no Debian 13 “trixie”.",
    channels: [
      { key: "github", label: "GitHub", sub: "Código-fonte, versões e rastreador de problemas" },
      { key: "youtube", label: "YouTube", sub: "Vídeos de demonstração" },
      { key: "instagram", label: "Instagram", sub: "Anúncios" },
      { key: "reddit", label: "Reddit", sub: "Comunidade e discussão" },
      { key: "mail", label: "E-mail", sub: "Contato geral" },
    ],
  },
  slayt: {
    onceki: "Imagem anterior",
    sonraki: "Próxima imagem",
    git: "Ir para a imagem",
    bolge: "Capturas de tela",
    buyut: "Ver em tamanho real",
    kapat: "Fechar",
    ipucu: "Clique para ampliar",
  },
  minigame: {
    consoleMsg: "Há algo escondido aqui. Clique 5 vezes seguidas na tartaruga grande da página inicial.",
    label: "Jogo escondido: Chegue ao mar",
    close: "Fechar",
    mute: "Ativar ou desativar o som",
    level: "Fase",
    hint: "← → ou deslize",
    reached: "Você chegou ao mar!",
    variants: ["Orla", "Enseada Rochosa", "Praia de Troncos", "Poças de Maré", "Costa de Corais", "Praia ao Luar", "Costa da Tempestade", "Orla com Lixo", "Dunas ao Vento"],
    pu: { shield: "Escudo", shieldBreak: "O escudo salvou você!", magnet: "Ímã", surf: "Onda veloz", plastic: "Plástico: peso extra" },
    egg: { l1: "Quebre a casca", l2: "e ajude o filhote a chegar ao mar", tap: "Toque / clique!" },
    introTitle: "Um filhote quer chegar ao mar.",
    introText: "Primeiro quebre a casca do ovo. Depois guie o filhote pelos obstáculos até o mar. Colete as bolhas brilhantes e evite o lixo plástico dentro do círculo tracejado vermelho. Cada fase é mais longa e mais rápida que a anterior.",
    start: "Começar",
    /** {n}: bölüm numarası */
    doneTitle: "Fase {n} concluída",
    doneLead: "Você chegou ao mar!",
    tipLabel: "Dica de segurança",
    parts: "Pedaços de casca coletados",
    next: "Próxima fase",
    overTitle: "O filhote não conseguiu",
    overText: "Acabaram as vidas. Você pode tentar a mesma fase de novo.",
    retry: "Tentar de novo",
    best: "Recorde",
    stars: {
      aria: "{n} de 3 estrelas",
      next2: "Próxima estrela: no máximo 1 batida",
      next3: "Próxima estrela: nenhuma batida e metade dos pedaços de casca coletados",
      record: "Novo recorde!",
      total: "Total de estrelas",
    },
  },
};

export default pt;
