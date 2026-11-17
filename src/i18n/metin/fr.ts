/* Ortak bileşen metinleri: fr. */
import type { Metin } from "./en";

const fr: Metin = {
  skip: "Aller au contenu",
  nav: {
    menuAria: "Menu principal",
    approach: "Démarche",
    apps: "Applications",
    changelog: "Journal des modifications",
    download: "Télécharger",
    langLabel: "Langue",
  },
  footer: {
    eyebrow: "Contact",
    heading: "Contact",
    lede: "Les rapports de bogues et les contributions passent par GitHub, les questions et les discussions par Reddit. Tout le reste par e-mail.",
    made: "Conçu par",
    team: [
      {
        name: "Yusuf Miraç Üzümcüler",
        title: "Fondateur et architecte système en chef",
        role: "Développement du cœur du système, architecture et conception, gestion de l’infrastructure.",
      },
      {
        name: "Metin Ege Boyar",
        title: "Cofondateur, communauté et croissance",
        role: "Animation de la communauté, stratégie de communication et coordination du projet.",
      },
    ],
    licence: "Publié sous licence GPL-3.0. Basé sur Debian 13 « trixie ».",
    channels: [
      { key: "github", label: "GitHub", sub: "Code source, versions, suivi des tickets" },
      { key: "youtube", label: "YouTube", sub: "Vidéos de présentation" },
      { key: "instagram", label: "Instagram", sub: "Annonces" },
      { key: "tiktok", label: "TikTok", sub: "Vidéos courtes" },
      { key: "reddit", label: "Reddit", sub: "Communauté et discussions" },
      { key: "mail", label: "E-mail", sub: "Demandes générales" },
    ],
  },
  slayt: {
    onceki: "Image précédente",
    sonraki: "Image suivante",
    git: "Aller à l’image",
    bolge: "Captures d’écran",
    buyut: "Afficher en taille réelle",
    kapat: "Fermer",
    ipucu: "Cliquer pour agrandir",
  },
  minigame: {
    consoleMsg: "Il y a quelque chose de caché ici. Appuyez 5 fois de suite sur la grande tortue de la page d’accueil.",
    label: "Jeu caché : atteindre la mer",
    close: "Fermer",
    mute: "Activer/couper le son",
    level: "Niveau",
    hint: "← → ou balayez",
    reached: "Vous avez atteint la mer !",
    variants: ["Bord de mer", "Crique rocheuse", "Plage de bois flotté", "Mares de marée", "Rivage de corail", "Plage au clair de lune", "Côte de tempête", "Rivage pollué", "Dunes ventées"],
    pu: { shield: "Bouclier", shieldBreak: "Le bouclier vous a sauvé !", magnet: "Aimant", surf: "Ruée de vague", plastic: "Plastique : alourdi" },
    egg: { l1: "Brisez la coquille", l2: "et aidez-le à atteindre la mer", tap: "Touchez / cliquez !" },
    introTitle: "Un bébé tortue veut atteindre la mer.",
    introText: "Brisez d’abord la coquille de l’œuf. Guidez ensuite le bébé tortue entre les obstacles jusqu’à la mer. Récupérez les bulles lumineuses et évitez les déchets en plastique dans le cercle rouge en pointillés. Chaque niveau est plus long et plus rapide que le précédent.",
    start: "Commencer",
    /** {n}: bölüm numarası */
    doneTitle: "Niveau {n} terminé",
    doneLead: "Vous avez atteint la mer !",
    tipLabel: "Conseil de sécurité",
    parts: "Morceaux de coquille ramassés",
    next: "Niveau suivant",
    overTitle: "Le bébé tortue n’y est pas arrivé",
    overText: "Toutes les vies sont perdues. Vous pouvez réessayer le même niveau.",
    retry: "Réessayer",
    best: "Meilleur",
    stars: {
      aria: "{n} étoiles sur 3",
      next2: "Étoile suivante : 1 coup au maximum",
      next3: "Étoile suivante : aucun coup et la moitié des morceaux de coquille",
      record: "Nouveau record !",
      total: "Total d’étoiles",
    },
  },
};

export default fr;
