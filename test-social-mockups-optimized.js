/*
===============================================================================
  NOVA BUSINESS - ANIMATIONS SIMPLIFIÉES
  Version ultra-légère avec seulement les animations essentielles
===============================================================================
*/

// ===========================
// CONSTANTES D'ANIMATION UNIQUEMENT
// ===========================

/**
 * Configuration des animations essentielles
 */
const ANIMATION_CONFIG = {
  COUNTER_DURATION: 2500, // Durée de l'animation des compteurs (ms)
  HEARTBEAT_DURATION: 600, // Durée de l'animation heartbeat (ms)
  BUTTON_SCALE_DURATION: 150, // Durée de l'animation des boutons (ms)
  TYPING_SPEED: 100, // Vitesse de frappe (ms)
  ERASE_SPEED: 100, // Vitesse d'effacement (ms)
  NOTIFICATION_DURATION: 3000, // Durée d'affichage des notifications (ms)
};

/**
 * Sélecteurs CSS pour les métriques
 */
const METRIC_SELECTORS = [
  { key: "instagram-likes", selector: ".likes", type: "likes" },
  {
    key: "facebook-reactions",
    selector: ".reaction-count",
    type: "number",
  },
  { key: "facebook-comments", selector: ".comments-count-fb", type: "number" },
  { key: "pinterest-likes", selector: ".pin-like-btn span", type: "number" },
  {
    key: "pinterest-comments",
    selector: ".pin-comment-btn span",
    type: "number",
  },
  {
    key: "linkedin-likes",
    selector: ".linkedin-actions .like-btn",
    type: "linkedin-likes",
  },
  {
    key: "linkedin-comments",
    selector: ".linkedin-comments-count",
    type: "linkedin-comments",
  },
  {
    key: "linkedin-reposts",
    selector: ".linkedin-reposts-count",
    type: "linkedin-reposts",
  },
  { key: "reddit-votes", selector: ".vote-count", type: "k-number" },
  {
    key: "reddit-comments",
    selector: ".reddit-action-btn span",
    type: "number",
  },
];

/**
 * Types de métriques Twitter
 */
const TWITTER_METRIC_TYPES = ["comments", "retweets", "likes", "views"];

/**
 * Couleurs des plateformes sociales
 */
const PLATFORM_COLORS = {
  LINKEDIN: "#0077b5",
  INSTAGRAM: "#e4405f",
  FACEBOOK: "#1877f2",
  TWITTER: "#1da1f2",
  PINTEREST: "#e60023",
  REDDIT: "#ff4500",
};

// ===========================
// CLASSE PRINCIPALE - MÉTRIQUES VIVANTES
// ===========================

/**
 * Gestionnaire principal des mockups sociaux
 * Gère les interactions, animations et métriques vivantes
 */
class SocialMockupsManager {
  constructor() {
    this.metrics = new Map();
    this.isAnimating = false;
    this.observers = [];
    this.init();
  }

  // ===========================
  // INITIALISATION
  // ===========================

  /**
   * Initialisation principale du gestionnaire
   */
  init() {
    this.setupMetrics();
    this.setupEventListeners();
    this.setupScrollAnimations();

    // Démarrer l'activité discrète après le chargement
    setTimeout(() => this.startLiveActivity(), 3000);

    // Démarrer l'animation LinkedIn après un délai
    setTimeout(() => this.startLinkedInCommentAnimation(), 5000);

    console.log("🚀 NOVA Business - Mockups Sociaux initialisés");
  }

  // ===========================
  // GESTION DES MÉTRIQUES
  // ===========================

  /**
   * Configuration des métriques pour toutes les plateformes
   */
  setupMetrics() {
    METRIC_SELECTORS.forEach(({ key, selector, type }) => {
      const element = document.querySelector(selector);
      if (element) {
        let current = 0;

        if (type === "linkedin-likes") {
          // Pour LinkedIn, on commence avec une valeur par défaut si pas de compteur existant
          const existingText = element.textContent.trim();
          const hasNumber = /\d+/.test(existingText);
          current = hasNumber ? this.extractNumber(existingText, type) : 0;

          // Si pas de nombre, on en ajoute un par défaut
          if (!hasNumber && current === 0) {
            current = 12; // Valeur de départ réaliste pour LinkedIn
          }
        } else {
          current = this.extractNumber(element.textContent, type);
        }

        this.metrics.set(key, {
          element,
          value: current,
          original: current,
          type,
          isK: type === "k-number",
        });

        // Appliquer la valeur formatée initiale pour LinkedIn
        if (type === "linkedin-likes") {
          element.textContent = this.formatMetricValue(current, type, element);
        }
      }
    });

    this.setupTwitterMetrics();
  }

  /**
   * Configuration spécifique des métriques Twitter
   */
  setupTwitterMetrics() {
    const twitterSpans = document.querySelectorAll(".action-btn-twitter span");

    twitterSpans.forEach((span, index) => {
      if (span.textContent && TWITTER_METRIC_TYPES[index]) {
        const current = this.extractNumber(span.textContent, "k-number");
        this.metrics.set(`twitter-${TWITTER_METRIC_TYPES[index]}`, {
          element: span,
          value: current,
          original: current,
          type: "k-number",
          isK: span.textContent.includes("K"),
        });
      }
    });
  }

  /**
   * Extraction et conversion des nombres depuis le texte
   * @param {string} text - Texte contenant le nombre
   * @param {string} type - Type de métrique
   * @returns {number} Valeur numérique extraite
   */
  extractNumber(text, type) {
    // Gérer les espaces dans les milliers (ex: "1 488" -> 1488)
    const cleanText = text.replace(/\s+/g, "");

    // Extraire le nombre avec regex améliorée
    const match = cleanText.match(/\d+(?:\.\d+)?/);
    if (!match) return 0;

    const number = parseFloat(match[0]);

    switch (type) {
      case "likes":
        return parseInt(cleanText.match(/\d+/)?.[0] || 0);
      case "linkedin-likes":
        // Pour LinkedIn, on cherche le nombre dans le texte du bouton
        const likeMatch = cleanText.match(/(\d+)/);
        return likeMatch ? parseInt(likeMatch[1]) : 0;
      case "linkedin-comments":
        // Pour les commentaires LinkedIn, extraire le nombre avant "commentaires"
        const commentMatch = text.match(/(\d+(?:\s\d+)*)\s+commentaires/);
        return commentMatch ? parseInt(commentMatch[1].replace(/\s+/g, "")) : 0;
      case "linkedin-reposts":
        // Pour les republications LinkedIn, extraire le nombre avant "republications"
        const repostMatch = text.match(/(\d+(?:\s\d+)*)\s+republications/);
        return repostMatch ? parseInt(repostMatch[1].replace(/\s+/g, "")) : 0;
      case "k-number":
        return cleanText.includes("K") ? number * 1000 : number;
      default:
        return number;
    }
  }

  // ===========================
  // ACTIVITÉ VIVANTE
  // ===========================

  /**
   * Démarrage de l'activité discrète en arrière-plan
   */
  startLiveActivity() {
    let interval = 2000;

    const updateMetrics = () => {
      if (!this.isAnimating) {
        this.updateRandomMetric();
      }

      interval = interval === 2000 ? 1000 : 2000;
      setTimeout(updateMetrics, interval);
    };

    setTimeout(updateMetrics, 3000);
  }

  /**
   * Mise à jour aléatoire d'une métrique
   */
  updateRandomMetric() {
    const metricKeys = Array.from(this.metrics.keys());
    if (metricKeys.length === 0) return;

    const randomKey = metricKeys[Math.floor(Math.random() * metricKeys.length)];
    const metric = this.metrics.get(randomKey);

    if (metric?.element) {
      const increase = Math.floor(Math.random() * 3) + 1;
      metric.value += increase;
      this.animateMetricUpdate(metric);
    }
  }

  /**
   * Animation de mise à jour d'une métrique
   * @param {Object} metric - Objet métrique à animer
   */
  animateMetricUpdate(metric) {
    const { element, value, type } = metric;

    this.isAnimating = true;
    element.style.transition = "all 0.5s ease";

    if (!element.classList.contains("likes")) {
      element.style.transform = "scale(1.05)";
    }
    element.style.color = "#4caf50";

    setTimeout(() => {
      element.textContent = this.formatMetricValue(value, type, element);

      setTimeout(() => {
        if (!element.classList.contains("likes")) {
          element.style.transform = "scale(1)";
        }
        element.style.color = "";
        this.isAnimating = false;
      }, 300);
    }, 200);
  }

  /**
   * Formatage de la valeur d'une métrique selon son type
   * @param {number} value - Valeur à formater
   * @param {string} type - Type de métrique
   * @param {HTMLElement} element - Élément DOM
   * @returns {string} Valeur formatée
   */
  formatMetricValue(value, type, element) {
    switch (type) {
      case "k-number":
        return value >= 1000
          ? `${(value / 1000).toFixed(1)}K`
          : value.toString();
      case "likes":
        return `${value} mentions J'aime`;
      case "linkedin-likes":
        // Pour LinkedIn, on met à jour le texte du bouton avec le compteur
        const baseText = element.textContent.replace(/\s*\d+\s*/, "").trim();
        return value > 0 ? `${baseText} ${value}` : baseText;
      case "linkedin-comments":
        return `${value} commentaires`;
      case "linkedin-reposts":
        return `${value} republications`;
      default:
        if (element.classList.contains("comments-count-fb")) {
          return `${value} commentaires`;
        }
        if (element.classList.contains("comments-count")) {
          return `${value} commentaires`;
        }
        if (element.parentElement?.classList.contains("reactions")) {
          return element.textContent.replace(/\d+/, value);
        }
        return value.toString();
    }
  }

  /**
   * Incrémentation d'une métrique
   * @param {string} key - Clé de la métrique
   * @param {number} amount - Montant à ajouter
   */
  incrementMetric(key, amount = 1) {
    const metric = this.metrics.get(key);
    if (metric) {
      metric.value += amount;
      this.animateMetricUpdate(metric);
    }
  }

  // ===========================
  // GESTION DES ÉVÉNEMENTS
  // ===========================

  /**
   * Configuration de tous les écouteurs d'événements
   */
  setupEventListeners() {
    this.setupLinkedInInteractions();
    this.setupInstagramInteractions();
    this.setupFacebookInteractions();
    this.setupTwitterInteractions();
    this.setupPinterestInteractions();
    this.setupRedditInteractions();
    this.setupHoverEffects();
  }

  // ===========================
  // LINKEDIN
  // ===========================

  /**
   * Configuration des interactions LinkedIn
   */
  setupLinkedInInteractions() {
    // Boutons de la nouvelle barre d'actions
    document.querySelectorAll(".linkedin-action-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleLinkedInAction(btn);
      });
    });

    // Anciens boutons (pour compatibilité)
    document.querySelectorAll(".linkedin-actions .like-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleLinkedInLike(btn);
      });

      // Gestion des réactions
      btn.querySelectorAll(".reaction").forEach((reaction) => {
        reaction.addEventListener("click", (e) => {
          e.stopPropagation();
          this.handleLinkedInReaction(btn, reaction);
        });
      });
    });

    // Autres boutons LinkedIn (ancienne structure)
    document
      .querySelectorAll(".linkedin-actions .action-btn:not(.like-btn)")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          this.animateButton(btn, PLATFORM_COLORS.LINKEDIN);
        });
      });
  }

  /**
   * Gestion des actions LinkedIn (nouvelle structure)
   * @param {HTMLElement} btn - Bouton cliqué
   */
  handleLinkedInAction(btn) {
    // Retirer la classe active de tous les boutons
    document.querySelectorAll(".linkedin-action-btn").forEach((b) => {
      b.classList.remove("active");
    });

    // Ajouter la classe active au bouton cliqué
    btn.classList.add("active");

    const icon = btn.querySelector("i");

    if (btn.classList.contains("like-action")) {
      this.handleLinkedInLikeAction(btn, icon);
    } else if (btn.classList.contains("comment-action")) {
      this.handleLinkedInCommentAction(btn, icon);
    } else if (btn.classList.contains("repost-action")) {
      this.handleLinkedInRepostAction(btn, icon);
    } else if (btn.classList.contains("send-action")) {
      this.handleLinkedInSendAction(btn, icon);
    }

    this.animateButton(btn);
  }

  /**
   * Gestion du bouton J'aime LinkedIn (nouvelle structure)
   * @param {HTMLElement} btn - Bouton parent
   * @param {HTMLElement} icon - Icône du bouton
   */
  handleLinkedInLikeAction(btn, icon) {
    icon.classList.toggle("fas");
    icon.classList.toggle("far");

    if (icon.classList.contains("fas")) {
      btn.style.color = PLATFORM_COLORS.LINKEDIN;
      icon.style.color = PLATFORM_COLORS.LINKEDIN;
      this.incrementMetric("linkedin-likes");
    } else {
      btn.style.color = "#65676b";
      icon.style.color = "#65676b";
      const metric = this.metrics.get("linkedin-likes");
      if (metric && metric.value > metric.original) {
        this.incrementMetric("linkedin-likes", -1);
      }
    }
  }

  /**
   * Gestion du bouton Commenter LinkedIn
   * @param {HTMLElement} btn - Bouton parent
   * @param {HTMLElement} icon - Icône du bouton
   */
  handleLinkedInCommentAction(btn, icon) {
    btn.style.color = PLATFORM_COLORS.LINKEDIN;
    icon.style.color = PLATFORM_COLORS.LINKEDIN;
    this.incrementMetric("linkedin-comments");

    // Simuler l'ouverture d'un champ de commentaire
    setTimeout(() => {
      btn.classList.remove("active");
      btn.style.color = "#65676b";
      icon.style.color = "#65676b";
    }, 2000);
  }

  /**
   * Gestion du bouton Republier LinkedIn
   * @param {HTMLElement} btn - Bouton parent
   * @param {HTMLElement} icon - Icône du bouton
   */
  handleLinkedInRepostAction(btn, icon) {
    btn.style.color = "#00ba7c";
    icon.style.color = "#00ba7c";
    icon.style.transform = "rotate(180deg)";
    this.incrementMetric("linkedin-reposts");

    setTimeout(() => {
      icon.style.transform = "rotate(0deg)";
      btn.classList.remove("active");
      btn.style.color = "#65676b";
      icon.style.color = "#65676b";
    }, 1000);
  }

  /**
   * Gestion du bouton Envoyer LinkedIn
   * @param {HTMLElement} btn - Bouton parent
   * @param {HTMLElement} icon - Icône du bouton
   */
  handleLinkedInSendAction(btn, icon) {
    btn.style.color = PLATFORM_COLORS.LINKEDIN;
    icon.style.color = PLATFORM_COLORS.LINKEDIN;

    // Simuler l'ouverture d'une fenêtre d'envoi
    setTimeout(() => {
      btn.classList.remove("active");
      btn.style.color = "#65676b";
      icon.style.color = "#65676b";
    }, 1500);
  }

  /**
   * Gestion des réactions LinkedIn
   * @param {HTMLElement} btn - Bouton parent
   * @param {HTMLElement} reaction - Réaction cliquée
   */
  handleLinkedInReaction(btn, reaction) {
    btn.style.color = PLATFORM_COLORS.LINKEDIN;
    const icon = btn.querySelector("i");
    icon.classList.add("fas");
    icon.classList.remove("far");
    this.animateButton(btn);
  }

  // ===========================
  // ANIMATION LINKEDIN COMMENT BAR
  // ===========================

  /**
   * Démarrage de l'animation de frappe LinkedIn
   */
  startLinkedInCommentAnimation() {
    const commentInput = document.querySelector(
      ".linkedin-comment-bar .comment-input"
    );
    if (!commentInput) return;

    // Désactiver l'input pendant l'animation
    commentInput.disabled = true;
    commentInput.style.cursor = "default";
    commentInput.classList.add("typing-animation");

    // Séquence d'animation
    const sequence = [
      {
        text: "Soyez les prochain à dominer le monde !",
        delay: ANIMATION_CONFIG.TYPING_SPEED,
      },
      { action: "erase", chars: 9 }, // Effacer "le monde !"
      { text: "linkedIn !", delay: ANIMATION_CONFIG.TYPING_SPEED },
    ];

    this.animateLinkedInSequence(commentInput, sequence, 0);
  }

  /**
   * Animation séquentielle LinkedIn
   * @param {HTMLElement} input - Input à animer
   * @param {Array} sequence - Séquence d'animation
   * @param {number} index - Index actuel dans la séquence
   */
  animateLinkedInSequence(input, sequence, index) {
    if (index >= sequence.length) {
      // Fin de l'animation, réactiver l'input SANS focus automatique
      setTimeout(() => {
        input.disabled = false;
        input.style.cursor = "text";
        input.classList.remove("typing-animation");
        // Supprimé: input.focus() pour éviter les rechargements de page
      }, 2000);
      return;
    }

    const step = sequence[index];

    if (step.action === "erase") {
      this.eraseText(input, step.chars, () => {
        this.animateLinkedInSequence(input, sequence, index + 1);
      });
    } else {
      this.typeText(input, step.text, step.delay, () => {
        this.animateLinkedInSequence(input, sequence, index + 1);
      });
    }
  }

  /**
   * Animation d'écriture de texte
   * @param {HTMLElement} element - Élément à animer
   * @param {string} text - Texte à écrire
   * @param {number} speed - Vitesse d'écriture
   * @param {Function} callback - Fonction de rappel
   */
  typeText(element, text, speed = ANIMATION_CONFIG.TYPING_SPEED, callback) {
    let i = 0;
    const startText = element.value;

    const type = () => {
      if (i < text.length) {
        element.value = startText + text.substring(0, i + 1);
        i++;
        setTimeout(type, speed);
      } else if (callback) {
        callback();
      }
    };

    type();
  }

  /**
   * Animation d'effacement de texte
   * @param {HTMLElement} element - Élément à animer
   * @param {number} charsToErase - Nombre de caractères à effacer
   * @param {Function} callback - Fonction de rappel
   */
  eraseText(element, charsToErase, callback) {
    let charsErased = 0;

    const erase = () => {
      if (charsErased < charsToErase && element.value.length > 0) {
        element.value = element.value.substring(0, element.value.length - 1);
        charsErased++;
        setTimeout(erase, ANIMATION_CONFIG.ERASE_SPEED);
      } else if (callback) {
        callback();
      }
    };

    erase();
  }

  // ===========================
  // INSTAGRAM
  // ===========================

  /**
   * Configuration des interactions Instagram
   */
  setupInstagramInteractions() {
    // Animation cœur
    document
      .querySelectorAll(".instagram-actions .fa-heart")
      .forEach((heart) => {
        heart.addEventListener("click", (e) => {
          e.preventDefault();
          this.handleInstagramHeart(heart);
        });
      });

    // Animation bookmark
    document
      .querySelectorAll(".instagram-actions .fa-bookmark")
      .forEach((bookmark) => {
        bookmark.addEventListener("click", (e) => {
          e.preventDefault();
          this.handleInstagramBookmark(bookmark);
        });
      });
  }

  /**
   * Gestion du cœur Instagram
   * @param {HTMLElement} heart - Icône cœur
   */
  handleInstagramHeart(heart) {
    heart.classList.toggle("fas");
    heart.classList.toggle("far");

    if (heart.classList.contains("fas")) {
      heart.style.color = PLATFORM_COLORS.INSTAGRAM;
      heart.style.animation = "heartBeat 0.6s ease-in-out";
      this.incrementMetric("instagram-likes");

      setTimeout(
        () => (heart.style.animation = ""),
        ANIMATION_CONFIG.HEARTBEAT_DURATION
      );
    } else {
      heart.style.color = "#262626";
      const metric = this.metrics.get("instagram-likes");
      if (metric && metric.value > metric.original) {
        this.incrementMetric("instagram-likes", -1);
      }
    }
  }

  /**
   * Gestion du bookmark Instagram
   * @param {HTMLElement} bookmark - Icône bookmark
   */
  handleInstagramBookmark(bookmark) {
    bookmark.classList.toggle("fas");
    bookmark.classList.toggle("far");

    if (bookmark.classList.contains("fas")) {
      bookmark.style.color = "#262626";
      bookmark.style.transform = "scale(1.2)";
      setTimeout(() => (bookmark.style.transform = "scale(1)"), 200);
    } else {
      bookmark.style.color = "#262626";
    }
  }

  // ===========================
  // FACEBOOK
  // ===========================

  /**
   * Configuration des interactions Facebook
   */
  setupFacebookInteractions() {
    document.querySelectorAll(".action-btn-fb").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (btn.textContent.trim().includes("J'aime")) {
          this.handleFacebookLike(btn);
        }
      });
    });
  }

  /**
   * Gestion du bouton J'aime Facebook
   * @param {HTMLElement} btn - Bouton cliqué
   */
  handleFacebookLike(btn) {
    btn.style.color = PLATFORM_COLORS.FACEBOOK;
    const icon = btn.querySelector("i");
    icon.classList.add("fas");
    icon.classList.remove("far");
    this.animateButton(btn);
    this.incrementMetric("facebook-reactions");

    // Parfois ajouter aussi un commentaire automatiquement
    if (Math.random() > 0.7) {
      // 30% de chance
      this.incrementMetric("facebook-comments");
    }
  }

  // ===========================
  // TWITTER
  // ===========================

  /**
   * Configuration des interactions Twitter
   */
  setupTwitterInteractions() {
    document.querySelectorAll(".action-btn-twitter").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleTwitterAction(btn);
      });
    });
  }

  /**
   * Gestion des actions Twitter
   * @param {HTMLElement} btn - Bouton cliqué
   */
  handleTwitterAction(btn) {
    const icon = btn.querySelector("i");

    if (icon.classList.contains("fa-heart")) {
      this.handleTwitterHeart(btn, icon);
    } else if (icon.classList.contains("fa-retweet")) {
      this.handleTwitterRetweet(btn, icon);
    } else if (icon.classList.contains("fa-comment")) {
      btn.style.color = PLATFORM_COLORS.TWITTER;
      this.incrementMetric("twitter-comments");
    } else if (icon.classList.contains("fa-chart-simple")) {
      btn.style.color = PLATFORM_COLORS.TWITTER;
      this.incrementMetric("twitter-views", Math.floor(Math.random() * 5) + 1);
    }

    this.animateButton(btn);
  }

  /**
   * Gestion du cœur Twitter
   * @param {HTMLElement} btn - Bouton parent
   * @param {HTMLElement} icon - Icône cœur
   */
  handleTwitterHeart(btn, icon) {
    icon.classList.toggle("fas");
    icon.classList.toggle("far");

    if (icon.classList.contains("fas")) {
      btn.style.color = "#f91880";
      icon.style.animation = "heartBeat 0.5s ease-in-out";
      this.incrementMetric("twitter-likes");
      setTimeout(() => (icon.style.animation = ""), 500);
    } else {
      btn.style.color = "#71767b";
      const metric = this.metrics.get("twitter-likes");
      if (metric && metric.value > metric.original) {
        this.incrementMetric("twitter-likes", -1);
      }
    }
  }

  /**
   * Gestion du retweet Twitter
   * @param {HTMLElement} btn - Bouton parent
   * @param {HTMLElement} icon - Icône retweet
   */
  handleTwitterRetweet(btn, icon) {
    btn.style.color = "#00ba7c";
    icon.style.transform = "rotate(180deg)";
    this.incrementMetric("twitter-retweets");
    setTimeout(() => (icon.style.transform = "rotate(0deg)"), 300);
  }

  // ===========================
  // PINTEREST
  // ===========================

  /**
   * Configuration des interactions Pinterest
   */
  setupPinterestInteractions() {
    // Bouton Enregistrer
    document.querySelectorAll(".pin-save-button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handlePinterestSave(btn);
      });
    });

    // Likes Pinterest
    document.querySelectorAll(".pin-like-btn").forEach((likeBtn) => {
      likeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handlePinterestLike(likeBtn);
      });
    });

    // Commentaires Pinterest
    document.querySelectorAll(".pin-comment-btn").forEach((commentBtn) => {
      commentBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.animateButton(commentBtn, PLATFORM_COLORS.PINTEREST);
      });
    });

    // Partage Pinterest
    document.querySelectorAll(".pin-share-btn").forEach((shareBtn) => {
      shareBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.animateButton(shareBtn, PLATFORM_COLORS.PINTEREST);
      });
    });

    // Bouton "Visiter le site"
    document.querySelectorAll(".visiter-site-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.animateButton(btn, "#666");
      });
    });
  }

  /**
   * Gestion du bouton Enregistrer Pinterest
   * @param {HTMLElement} btn - Bouton Enregistrer
   */
  handlePinterestSave(btn) {
    btn.textContent = "Enregistré";
    btn.style.backgroundColor = "#111";
    setTimeout(() => {
      btn.textContent = "Enregistrer";
      btn.style.backgroundColor = PLATFORM_COLORS.PINTEREST;
    }, 2000);
  }

  /**
   * Gestion du like Pinterest
   * @param {HTMLElement} likeBtn - Bouton like
   */
  handlePinterestLike(likeBtn) {
    const icon = likeBtn.querySelector("i");
    const countSpan = likeBtn.querySelector("span");

    icon.classList.toggle("fas");
    icon.classList.toggle("far");

    if (icon.classList.contains("fas")) {
      icon.style.color = PLATFORM_COLORS.PINTEREST;
      likeBtn.style.color = PLATFORM_COLORS.PINTEREST;

      // Incrémenter les likes Pinterest
      this.incrementMetric("pinterest-likes");

      // Parfois ajouter aussi un commentaire automatiquement
      if (Math.random() > 0.8) {
        // 20% de chance
        this.incrementMetric("pinterest-comments");
      }

      // Augmenter le compteur affiché
      if (countSpan) {
        const currentCount = parseInt(countSpan.textContent.trim());
        if (!isNaN(currentCount)) {
          countSpan.textContent = currentCount + 1;
        }
      }
    } else {
      icon.style.color = "white";
      likeBtn.style.color = "white";

      // Décrémenter les likes Pinterest
      const metric = this.metrics.get("pinterest-likes");
      if (metric && metric.value > metric.original) {
        this.incrementMetric("pinterest-likes", -1);
      }

      // Diminuer le compteur affiché
      if (countSpan) {
        const currentCount = parseInt(countSpan.textContent.trim());
        if (!isNaN(currentCount) && currentCount > 0) {
          countSpan.textContent = currentCount - 1;
        }
      }
    }

    this.animateButton(likeBtn);
  }

  // ===========================
  // REDDIT
  // ===========================

  /**
   * Configuration des interactions Reddit
   */
  setupRedditInteractions() {
    // Votes Reddit
    document.querySelectorAll(".reddit-vote i").forEach((arrow) => {
      arrow.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleRedditVote(arrow);
      });
    });

    // Actions Reddit
    document.querySelectorAll(".reddit-action-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleRedditAction(btn);
      });
    });
  }

  /**
   * Gestion des votes Reddit
   * @param {HTMLElement} arrow - Flèche de vote
   */
  handleRedditVote(arrow) {
    const voteContainer = arrow.closest(".reddit-vote");

    if (arrow.classList.contains("fa-arrow-up")) {
      arrow.style.color = PLATFORM_COLORS.REDDIT;
      voteContainer.querySelector(".fa-arrow-down").style.color = "#818384";
      arrow.style.animation = "voteUp 0.4s ease-out";
      this.incrementMetric("reddit-votes", Math.floor(Math.random() * 10) + 5);
    } else if (arrow.classList.contains("fa-arrow-down")) {
      arrow.style.color = "#7193ff";
      voteContainer.querySelector(".fa-arrow-up").style.color = "#818384";
      arrow.style.animation = "voteDown 0.4s ease-out";
      const metric = this.metrics.get("reddit-votes");
      if (metric && metric.value > metric.original) {
        this.incrementMetric(
          "reddit-votes",
          -(Math.floor(Math.random() * 5) + 2)
        );
      }
    }

    setTimeout(() => (arrow.style.animation = ""), 400);
  }

  /**
   * Gestion des actions Reddit
   * @param {HTMLElement} btn - Bouton d'action
   */
  handleRedditAction(btn) {
    btn.style.backgroundColor = "#272729";
    btn.style.color = "#d7dadc";

    if (btn.querySelector(".fa-comment")) {
      this.incrementMetric("reddit-comments");
    }

    setTimeout(() => {
      btn.style.backgroundColor = "transparent";
      btn.style.color = "#818384";
    }, 200);
  }

  // ===========================
  // ANIMATIONS ET EFFETS
  // ===========================

  /**
   * Configuration des animations au scroll
   */
  setupScrollAnimations() {
    // Animation d'entrée des cartes
    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animateCardEntry(entry.target);
            cardObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".contenu-card").forEach((card) => {
      cardObserver.observe(card);
    });

    // Animation des compteurs pour toutes les plateformes
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const metricKey = this.getMetricKeyFromElement(element);
          const metric = this.metrics.get(metricKey);

          if (metric) {
            this.animateCounter(
              element,
              metric.original,
              ANIMATION_CONFIG.COUNTER_DURATION
            );
          }
          counterObserver.unobserve(entry.target);
        }
      });
    });

    // Observer tous les éléments de métriques définis dans METRIC_SELECTORS
    METRIC_SELECTORS.forEach(({ selector }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        counterObserver.observe(element);
      });
    });

    // Observer aussi les compteurs Twitter spécifiques (non inclus dans METRIC_SELECTORS)
    document.querySelectorAll(".action-btn-twitter span").forEach((counter) => {
      if (counter.textContent && !counter.closest("[data-metric-key]")) {
        counterObserver.observe(counter);
      }
    });

    this.observers.push(cardObserver, counterObserver);
  }

  /**
   * Animation d'entrée d'une carte
   * @param {HTMLElement} card - Carte à animer
   */
  animateCardEntry(card) {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = "all 0.6s ease";

    setTimeout(() => {
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 100);
  }

  /**
   * Animation de compteur numérique
   * @param {HTMLElement} element - Élément à animer
   * @param {number} target - Valeur cible
   * @param {number} duration - Durée de l'animation
   */
  animateCounter(
    element,
    target,
    duration = ANIMATION_CONFIG.COUNTER_DURATION
  ) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    // Déterminer le type d'élément et son formatage
    const elementType = this.getElementType(element);
    const originalText = element.textContent;

    // Initialiser l'élément à 0 selon son type
    element.textContent = this.formatCounterValue(
      0,
      target,
      elementType,
      originalText
    );

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }

      element.textContent = this.formatCounterValue(
        Math.floor(current),
        target,
        elementType,
        originalText
      );
    }, 16);
  }

  /**
   * Détermine le type d'élément pour le formatage
   * @param {HTMLElement} element - Élément à analyser
   * @returns {string} Type de l'élément
   */
  getElementType(element) {
    if (element.classList.contains("likes")) return "instagram-likes";
    if (element.classList.contains("comments-count-fb"))
      return "facebook-comments";
    if (element.classList.contains("reaction-count"))
      return "facebook-reactions";
    if (element.classList.contains("linkedin-comments-count"))
      return "linkedin-comments";
    if (element.classList.contains("linkedin-reposts-count"))
      return "linkedin-reposts";
    if (element.classList.contains("vote-count")) return "reddit-votes";
    if (
      element.classList.contains("pin-like-btn") ||
      element.classList.contains("pin-comment-btn")
    )
      return "pinterest";
    if (element.closest(".action-btn-twitter")) return "twitter";
    return "default";
  }

  /**
   * Formate la valeur du compteur selon son type
   * @param {number} value - Valeur à formater
   * @param {number} target - Valeur cible finale
   * @param {string} type - Type d'élément
   * @param {string} originalText - Texte original
   * @returns {string} Valeur formatée
   */
  formatCounterValue(value, target, type, originalText) {
    // Déterminer le format original (espaces ou K)
    const hasSpaces = originalText.includes(" ");
    const hasK = originalText.includes("K");

    switch (type) {
      case "instagram-likes":
        if (hasSpaces && target >= 1000) {
          // Format avec espaces pour les milliers
          return `${value.toLocaleString("fr-FR")} mentions J'aime`;
        } else {
          return `${value} mentions J'aime`;
        }

      case "facebook-comments":
        if (hasSpaces && target >= 1000) {
          return `${value.toLocaleString("fr-FR")} commentaires`;
        } else {
          return `${value} commentaires`;
        }

      case "facebook-reactions":
        if (hasSpaces && target >= 1000) {
          return value.toLocaleString("fr-FR");
        } else {
          return value.toString();
        }

      case "linkedin-comments":
        if (hasSpaces && target >= 1000) {
          return `${value.toLocaleString("fr-FR")} commentaires`;
        } else {
          return `${value} commentaires`;
        }

      case "linkedin-reposts":
        if (hasSpaces && target >= 1000) {
          return `${value.toLocaleString("fr-FR")} republications`;
        } else {
          return `${value} republications`;
        }

      case "reddit-votes":
        if (hasK && target >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        } else if (hasSpaces && target >= 1000) {
          return value.toLocaleString("fr-FR");
        } else {
          return value.toString();
        }

      case "pinterest":
        if (hasSpaces && target >= 1000) {
          return value.toLocaleString("fr-FR");
        } else {
          return value.toString();
        }

      case "twitter":
        if (hasK && target >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        } else if (hasSpaces && target >= 1000) {
          return value.toLocaleString("fr-FR");
        } else {
          return value.toString();
        }

      default:
        if (hasK && target >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        } else if (hasSpaces && target >= 1000) {
          return value.toLocaleString("fr-FR");
        } else {
          return value.toString();
        }
    }
  }

  /**
   * Récupère la clé de métrique associée à un élément DOM
   * @param {HTMLElement} element - Élément DOM
   * @returns {string|null} Clé de la métrique ou null si non trouvée
   */
  getMetricKeyFromElement(element) {
    for (const { key, selector } of METRIC_SELECTORS) {
      if (element.matches(selector)) {
        return key;
      }
    }
    return null;
  }

  /**
   * Animation générique de bouton
   * @param {HTMLElement} btn - Bouton à animer
   * @param {string} color - Couleur optionnelle
   */
  animateButton(btn, color = null) {
    if (color) btn.style.color = color;
    btn.style.transform = "scale(0.95)";
    setTimeout(
      () => (btn.style.transform = "scale(1)"),
      ANIMATION_CONFIG.BUTTON_SCALE_DURATION
    );
  }

  /**
   * Configuration des effets hover
   */
  setupHoverEffects() {
    // Effets hover sur les cartes
    document.querySelectorAll(".contenu-card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-4px) scale(1)";
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0) scale(1)";
      });
    });

    // Effets hover sur les mockups
    document.querySelectorAll(".social-mockup").forEach((mockup) => {
      mockup.addEventListener("mouseenter", () => {
        const avatars = mockup.querySelectorAll('[class*="avatar"]');
        avatars.forEach((avatar) => {
          avatar.style.transform = "scale(1.1)";
          avatar.style.transition = "transform 0.3s ease";
        });
      });

      mockup.addEventListener("mouseleave", () => {
        const avatars = mockup.querySelectorAll('[class*="avatar"]');
        avatars.forEach((avatar) => {
          avatar.style.transform = "scale(1)";
        });
      });
    });

    // Animation de frappe au clic sur les paragraphes
    document.querySelectorAll(".mockup-content p").forEach((p) => {
      const originalText = p.textContent;
      p.addEventListener("click", () => {
        this.typeWriter(p, originalText, 30);
      });
    });
  }

  // ===========================
  // UTILITAIRES
  // ===========================

  /**
   * Animation machine à écrire
   * @param {HTMLElement} element - Élément à animer
   * @param {string} text - Texte à écrire
   * @param {number} speed - Vitesse d'écriture
   */
  typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = "";

    const type = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    };

    type();
  }

  /**
   * Affichage d'une notification
   * @param {string} message - Message à afficher
   * @param {string} type - Type de notification (success/error)
   */
  showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === "success" ? "#4CAF50" : "#f44336"};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => (notification.style.transform = "translateX(0)"), 100);
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => document.body.removeChild(notification), 300);
    }, ANIMATION_CONFIG.NOTIFICATION_DURATION);
  }

  /**
   * Nettoyage des ressources
   */
  destroy() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// ===========================
// INITIALISATION ET API PUBLIQUE
// ===========================

/**
 * Instance globale du gestionnaire
 */
let socialMockupsManager;

/**
 * Initialisation au chargement du DOM
 */
document.addEventListener("DOMContentLoaded", () => {
  socialMockupsManager = new SocialMockupsManager();

  // Log de développement (désactivé en production)
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    console.log("🚀 NOVA Business - Mockups Sociaux: ✅ Initialisés");
  }
});

/**
 * Nettoyage automatique avant déchargement
 */
window.addEventListener("beforeunload", () => {
  socialMockupsManager?.destroy();
});
