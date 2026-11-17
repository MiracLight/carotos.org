/* Ortak bileşen metinleri: es. */
import type { Metin } from "./en";

const es: Metin = {
  skip: "Saltar al contenido",
  nav: {
    menuAria: "Menú principal",
    approach: "Enfoque",
    apps: "Aplicaciones",
    changelog: "Registro de cambios",
    download: "Descargar",
    langLabel: "Idioma",
  },
  footer: {
    eyebrow: "Contacto",
    heading: "Contacto",
    lede: "Los informes de errores y las contribuciones van por GitHub; las preguntas y el debate, en Reddit. Todo lo demás, por correo electrónico.",
    made: "Creado por",
    team: [
      {
        name: "Yusuf Miraç Üzümcüler",
        title: "Fundador y arquitecto jefe del sistema",
        role: "Desarrollo del núcleo del sistema, arquitectura y diseño, gestión de la infraestructura.",
      },
      {
        name: "Metin Ege Boyar",
        title: "Cofundador, comunidad y crecimiento",
        role: "Gestión de la comunidad, estrategia de comunicación y coordinación del proyecto.",
      },
    ],
    licence: "Publicado bajo la licencia GPL-3.0. Basado en Debian 13 «trixie».",
    channels: [
      { key: "github", label: "GitHub", sub: "Código fuente, versiones, seguimiento de incidencias" },
      { key: "youtube", label: "YouTube", sub: "Vídeos guiados" },
      { key: "instagram", label: "Instagram", sub: "Anuncios" },
      { key: "reddit", label: "Reddit", sub: "Comunidad y debate" },
      { key: "mail", label: "Correo electrónico", sub: "Consultas generales" },
    ],
  },
  slayt: {
    onceki: "Imagen anterior",
    sonraki: "Imagen siguiente",
    git: "Ir a la imagen",
    bolge: "Capturas de pantalla",
    buyut: "Ver a tamaño completo",
    kapat: "Cerrar",
    ipucu: "Haz clic para ampliar",
  },
  minigame: {
    consoleMsg: "Aquí hay algo escondido. Pulsa 5 veces seguidas la tortuga grande de la página de inicio.",
    label: "Juego oculto: Llega al mar",
    close: "Cerrar",
    mute: "Activar o desactivar el sonido",
    level: "Nivel",
    hint: "← → o desliza",
    reached: "¡Has llegado al mar!",
    variants: ["Orilla", "Cala rocosa", "Playa de madera flotante", "Pozas de marea", "Costa de coral", "Playa a la luz de la luna", "Costa de tormenta", "Orilla con basura", "Dunas ventosas"],
    pu: { shield: "Escudo", shieldBreak: "¡El escudo te ha salvado!", magnet: "Imán", surf: "Ola impulsora", plastic: "Plástico: te frena" },
    egg: { l1: "Rompe el cascarón", l2: "y ayuda a la cría a llegar al mar", tap: "¡Toca o haz clic!" },
    introTitle: "Una cría quiere llegar al mar.",
    introText: "Primero rompe el cascarón. Después guía a la cría esquivando los obstáculos hasta el mar. Recoge las burbujas brillantes y evita los residuos de plástico dentro del círculo rojo de trazos. Cada nivel es más largo y más rápido que el anterior.",
    start: "Empezar",
    /** {n}: bölüm numarası */
    doneTitle: "Nivel {n} completado",
    doneLead: "¡Has llegado al mar!",
    tipLabel: "Consejo de seguridad",
    parts: "Trozos de cascarón recogidos",
    next: "Siguiente nivel",
    overTitle: "La cría no lo logró",
    overText: "Te has quedado sin vidas. Puedes intentar el mismo nivel otra vez.",
    retry: "Intentar de nuevo",
    best: "Mejor",
    stars: {
      aria: "{n} de 3 estrellas",
      next2: "Siguiente estrella: como máximo 1 golpe",
      next3: "Siguiente estrella: sin golpes y recogiendo la mitad de los trozos de cascarón",
      record: "¡Nuevo récord!",
      total: "Estrellas totales",
    },
  },
};

export default es;
