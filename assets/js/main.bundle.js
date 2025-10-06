(function () {
  /*
   * ===================================================================
   * ## main.js
   * ===================================================================
   */
  /**
   * NOVA Business - JavaScript principal optimisé
   * Version de production sans debug
   */

  // ===== UTILITAIRES =====
  const Utils = {
    debounce: function (func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
  };

  // ===== GESTION DU MENU MOBILE =====
  const MobileMenu = {
    // Configuration centralisée
    config: {
      animationDuration: 300,
      desktopBreakpoint: 980,
      closeDelay: 10,
    },

    init: function () {
      this.state = { isOpen: false, isAnimating: false };
      this.elements = {
        toggle: document.querySelector(".mobile-toggle"),
        navigation: document.querySelector(".mobile-navigation"),
        header: document.querySelector(".site-header"),
        links: document.querySelectorAll(".mobile-nav-link"),
      };

      if (this.elements.toggle && this.elements.navigation) {
        this.setupInitialState();
        this.bindEvents();
      }
    },

    setupInitialState: function () {
      this.setState(false);
      this.elements.toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    },

    bindEvents: function () {
      // Toggle du menu
      this.elements.toggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!this.state.isAnimating) this.toggleMenu();
      });

      // Fermer sur clic de lien (sauf dropdowns)
      this.elements.links.forEach((link) => {
        link.addEventListener("click", () => {
          if (
            !link.classList.contains("mobile-nav-link--dropdown") &&
            this.state.isOpen
          ) {
            this.closeMenu();
          }
        });
      });

      // Variable pour tracker les vrais clics vs scroll events
      let isUserInteracting = false;
      let interactionTimeout;

      // Marquer les vraies interactions utilisateur
      ["mousedown", "touchstart"].forEach((eventType) => {
        document.addEventListener(
          eventType,
          () => {
            isUserInteracting = true;
            clearTimeout(interactionTimeout);
            interactionTimeout = setTimeout(() => {
              isUserInteracting = false;
            }, 100);
          },
          { passive: true }
        );
      });

      // Fermer sur clic extérieur (mais pas sur scroll/touch)
      document.addEventListener(
        "click",
        (e) => {
          // Ignorer les événements de scroll et touch
          if (e.isTrusted === false || e.detail === 0 || !isUserInteracting)
            return;

          if (
            this.state.isOpen &&
            !this.elements.toggle.contains(e.target) &&
            !this.elements.navigation.contains(e.target) &&
            !this.state.isAnimating &&
            e.type === "click" // S'assurer que c'est bien un vrai clic
          ) {
            setTimeout(() => this.closeMenu(), this.config.closeDelay);
          }
        },
        { passive: true }
      );

      // Fermer sur resize desktop
      window.addEventListener(
        "resize",
        Utils.debounce(() => {
          if (
            window.innerWidth >= this.config.desktopBreakpoint &&
            this.state.isOpen
          ) {
            this.closeMenu();
          }
        }, 100)
      );

      // Fermer avec Échap
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.state.isOpen) this.closeMenu();
      });
    },

    toggleMenu: function () {
      this.state.isOpen ? this.closeMenu() : this.openMenu();
    },

    // Méthode unifiée pour gérer l'état du menu
    setState: function (isOpen) {
      if (this.state.isAnimating) return;

      this.state.isAnimating = true;
      this.state.isOpen = isOpen;

      // Classes CSS
      const action = isOpen ? "add" : "remove";
      this.elements.toggle.classList[action]("active");
      this.elements.navigation.classList[action]("active");
      if (this.elements.header)
        this.elements.header.classList[action]("mobile-menu-open");
      document.body.classList[action]("mobile-menu-open");

      // Attributs ARIA
      this.elements.toggle.setAttribute("aria-expanded", isOpen.toString());

      // Fin d'animation
      setTimeout(() => {
        this.state.isAnimating = false;
      }, this.config.animationDuration);
    },

    openMenu: function () {
      if (!this.state.isOpen) this.setState(true);
    },

    closeMenu: function () {
      if (this.state.isOpen) this.setState(false);
    },

    // Méthode publique pour forcer la fermeture
    forceClose: function () {
      this.state.isAnimating = false;
      this.closeMenu();
    },
  };

  // Module pour gérer le header dynamique au scroll
  const HeaderScroll = {
    header: null,
    scrollThreshold: 50,
    isScrolled: false,
    lastScrollY: 0,
    ticking: false,

    init: function () {
      this.header = document.querySelector(".site-header");
      if (!this.header) return;

      // Bind des événements
      this.bindEvents();
    },

    bindEvents: function () {
      // Utiliser requestAnimationFrame pour optimiser les performances
      window.addEventListener("scroll", () => {
        this.lastScrollY = window.scrollY;
        this.requestTick();
      });

      // Écouter les changements de taille d'écran
      window.addEventListener("resize", () => {
        this.handleResize();
      });
    },

    requestTick: function () {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          this.updateHeader();
          this.ticking = false;
        });
        this.ticking = true;
      }
    },

    updateHeader: function () {
      const shouldBeScrolled = this.lastScrollY > this.scrollThreshold;

      if (shouldBeScrolled !== this.isScrolled) {
        this.isScrolled = shouldBeScrolled;

        if (this.isScrolled) {
          this.header.classList.add("is-scrolled");
        } else {
          this.header.classList.remove("is-scrolled");
        }
      }
    },

    handleResize: function () {
      // Réinitialiser l'état du header lors du redimensionnement
      this.updateHeader();
    },
  };

  // Initialisation du header scroll
  HeaderScroll.init();

  // ===== GESTION DU CARROUSEL DE TÉMOIGNAGES =====
  const TestimonialsCarousel = {
    init: function () {
      // Vérifier si jQuery est disponible dès le début
      if (typeof $ === "undefined") {
        return;
      }

      // Nettoyer les timers existants
      if (this.alternateTimer) {
        clearTimeout(this.alternateTimer);
      }
      if (this.resumeTimer) {
        clearTimeout(this.resumeTimer);
      }

      // Attendre que le DOM soit complètement chargé
      setTimeout(() => {
        this.firstCarousel = $(".testimonials-slider--first");
        this.secondCarousel = $(".testimonials-slider--second");
        this.isAlternating = false;
        this.currentActiveRow = 1;

        // Vérifier si la section testimonials existe
        const testimonialsSection = document.querySelector("#testimonials");
        if (testimonialsSection) {
          // Forcer la visibilité
          testimonialsSection.style.display = "block";
          testimonialsSection.style.visibility = "visible";
          testimonialsSection.style.opacity = "1";
        }
        if (this.firstCarousel.length) {
          // Détruire d'abord l'instance Slick existante du premier carrousel si elle existe
          if (this.firstCarousel.hasClass("slick-initialized")) {
            this.firstCarousel.slick("unslick");
          }

          // Initialiser le premier carrousel
          this.setupFirstCarousel();

          // Vérifier si le second carrousel existe aussi
          if (this.secondCarousel.length) {
            // Détruire l'instance Slick existante du second carrousel si elle existe
            if (this.secondCarousel.hasClass("slick-initialized")) {
              this.secondCarousel.slick("unslick");
            }

            // Initialiser le second carrousel
            this.setupSecondCarousel();

            // Activer le système d'alternance seulement si les deux carrousels existent
            this.startAlternatingSystem();
            this.bindEvents();
            this.handleScreenSize();
          }
        } else {
          // Fallback: afficher les testimonials sans carrousel
          this.fallbackDisplay();
        }
      }, 100);
    },
    fallbackDisplay: function () {
      const testimonialsSection = document.querySelector("#testimonials");
      if (testimonialsSection) {
        testimonialsSection.classList.add("js-disabled");
        // Afficher tous les témoignages en ligne
        const testimonialItems =
          testimonialsSection.querySelectorAll(".testimonial-item");
        testimonialItems.forEach((item) => {
          item.style.display = "inline-block";
          item.style.width = "300px";
          item.style.margin = "0 15px 40px";
          item.style.verticalAlign = "top";
        });
      }
    },
    setupFirstCarousel: function () {
      // Configuration pour le premier carrousel - PAS d'autoplay
      const firstConfig = {
        centerMode: false,
        centerPadding: "0",
        slidesToShow: 3,
        slidesToScroll: 1,
        dots: false,
        arrows: false,
        infinite: true,
        speed: 600,
        autoplay: false, // Désactivé pour contrôle manuel
        pauseOnHover: false,
        cssEase: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        responsive: [
          {
            breakpoint: 980, // Changé de 1200 à 980
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
            },
          },
        ],
      };

      try {
        this.firstCarousel.slick(firstConfig);
      } catch (error) {
        // Fallback silencieux si l'initialisation échoue
        this.fallbackDisplay();
      }
    },

    setupSecondCarousel: function () {
      // Configuration pour le second carrousel - PAS d'autoplay
      const secondConfig = {
        centerMode: false,
        centerPadding: "0",
        slidesToShow: 3,
        slidesToScroll: 1,
        dots: false,
        arrows: false,
        infinite: true,
        speed: 600,
        autoplay: false, // Désactivé pour contrôle manuel
        pauseOnHover: false,
        cssEase: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        responsive: [
          {
            breakpoint: 980, // Changé de 1200 à 980
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
            },
          },
        ],
      };

      try {
        this.secondCarousel.slick(secondConfig);
      } catch (error) {
        // Fallback silencieux si l'initialisation échoue
      }
    },

    setupCarousels: function () {
      // Configuration pour le premier carrousel - PAS d'autoplay
      const firstConfig = {
        centerMode: false,
        centerPadding: "0",
        slidesToShow: 3,
        slidesToScroll: 1,
        dots: false,
        arrows: false,
        infinite: true,
        speed: 600,
        autoplay: false, // Désactivé pour contrôle manuel
        pauseOnHover: false,
        cssEase: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        responsive: [
          {
            breakpoint: 980, // Changé de 1200 à 980
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
            },
          },
        ],
      };

      // Configuration pour le second carrousel - PAS d'autoplay
      const secondConfig = {
        centerMode: false,
        centerPadding: "0",
        slidesToShow: 3,
        slidesToScroll: 1,
        dots: false,
        arrows: false,
        infinite: true,
        speed: 600,
        autoplay: false, // Désactivé pour contrôle manuel
        pauseOnHover: false,
        cssEase: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        responsive: [
          {
            breakpoint: 980, // Changé de 1200 à 980
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
            },
          },
        ],
      };

      try {
        this.firstCarousel.slick(firstConfig);
      } catch (error) {
        // Fallback silencieux si l'initialisation échoue
      }

      try {
        this.secondCarousel.slick(secondConfig);
      } catch (error) {
        // Fallback silencieux si l'initialisation échoue
      }
      // Vérifier que les carrousels sont bien initialisés
      setTimeout(() => {
        const firstInitialized =
          this.firstCarousel.hasClass("slick-initialized");
        const secondInitialized =
          this.secondCarousel.hasClass("slick-initialized");

        if (!firstInitialized || !secondInitialized) {
          this.fallbackDisplay();
        } else {
          // Démarrer le système d'alternance
          this.startAlternatingSystem();
        }
      }, 500);
    },
    startAlternatingSystem: function () {
      this.isAlternating = true;
      this.currentActiveRow = 1;

      // Nettoyer tous les timers existants
      if (this.alternateTimer) {
        clearTimeout(this.alternateTimer);
      }

      // Démarrer immédiatement la première alternance
      this.alternateTimer = setTimeout(() => {
        this.alternateCarousels();
      }, 1000);
    },

    handleScreenSize: function () {
      if ($(window).width() < 768) {
        // Sur mobile et tablette, masquer le second carrousel et arrêter l'alternance
        this.secondCarousel.closest(".carousel-row").hide();
        this.isAlternating = false;
      } else {
        // Sur desktop, afficher les deux carrousels et reprendre l'alternance
        this.secondCarousel.closest(".carousel-row").show();
        if (!this.isAlternating) {
          this.isAlternating = true;
          this.startAlternatingSystem();
        }
      }
    },
    alternateCarousels: function () {
      if (!this.isAlternating) {
        return;
      }

      // Nettoyer le timer précédent
      if (this.alternateTimer) {
        clearTimeout(this.alternateTimer);
      }

      if (this.currentActiveRow === 1) {
        // Faire défiler le premier carrousel SEULEMENT
        this.firstCarousel.slick("slickNext");

        // Programmer le passage au second carrousel après 4 secondes
        this.alternateTimer = setTimeout(() => {
          if (this.isAlternating) {
            this.currentActiveRow = 2;
            this.alternateCarousels();
          }
        }, 4000);
      } else {
        // Faire défiler le second carrousel SEULEMENT
        this.secondCarousel.slick("slickNext");

        // Programmer le retour au premier carrousel après 4 secondes
        this.alternateTimer = setTimeout(() => {
          if (this.isAlternating) {
            this.currentActiveRow = 1;
            this.alternateCarousels();
          }
        }, 4000);
      }
    },
    bindEvents: function () {
      $(window).on(
        "resize",
        Utils.debounce(() => {
          this.handleScreenSize();
        }, 250)
      );
      // Gestion du hover pour mettre en pause l'alternance
      const carouselContainer = document.querySelector(
        ".testimonials-carousel"
      );
      if (carouselContainer) {
        carouselContainer.addEventListener("mouseenter", () => {
          if (this.alternateTimer) {
            clearTimeout(this.alternateTimer);
          }
        });

        carouselContainer.addEventListener("mouseleave", () => {
          // Reprendre l'alternance après un court délai
          if (this.isAlternating) {
            this.resumeTimer = setTimeout(() => {
              this.alternateCarousels();
            }, 2000);
          }
        });
      }
    },
  };

  // ===== GESTION DU SMOOTH SCROLL =====
  const SmoothScroll = {
    init: function () {
      // Sélectionner UNIQUEMENT les liens avec des ancres valides (plus de 1 caractère)
      this.links = Array.from(document.querySelectorAll('a[href^="#"]')).filter(
        (link) => {
          const href = link.getAttribute("href");
          return href && href.length > 1 && href !== "#";
        }
      );

      if (this.links.length) {
        this.bindEvents();
      }
    },

    bindEvents: function () {
      this.links.forEach((link) => {
        link.addEventListener("click", (e) => {
          const targetId = link.getAttribute("href");

          // Vérifier que le targetId est valide et non vide
          if (!targetId || targetId === "#" || targetId.length <= 1) {
            return; // Ignorer les liens avec des ancres vides ou invalides
          }

          const targetElement = document.querySelector(targetId);

          if (targetElement) {
            e.preventDefault();
            const headerOffset =
              document.querySelector(".site-header").offsetHeight;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition =
              elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        });
      });
    },
  };

  // ===== GESTION DU CTA BANNER =====
  const CTABanner = {
    init: function () {
      this.banner = document.getElementById("cta-banner");
      if (this.banner) {
        this.bindEvents();
      }
    },

    bindEvents: function () {
      const button = this.banner.querySelector(".btn-dark");
      if (button) {
        button.addEventListener("click", (e) => {
          const targetId = button.getAttribute("href");
          const targetElement = document.querySelector(targetId);

          if (targetElement) {
            e.preventDefault();
            const headerOffset =
              document.querySelector(".site-header").offsetHeight;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition =
              elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        });
      }
    },
  };

  // ===== SYSTÈME D'ANIMATION AU SCROLL =====
  const AnimationSystem = {
    init: function () {
      this.animatedElements = document.querySelectorAll("[data-animate]");
      if (
        this.animatedElements.length > 0 &&
        !document.documentElement.classList.contains("no-intersection-observer")
      ) {
        this.setupObserver();
      } else {
        this.fallback();
      }
    },

    setupObserver: function () {
      const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      };

      this.observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.triggerAnimation(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      this.animatedElements.forEach((el) => {
        this.observer.observe(el);
      });
    },

    triggerAnimation: function (element) {
      const animationType = element.getAttribute("data-animate");
      const delay = parseInt(element.getAttribute("data-delay"), 10) || 0;
      const duration =
        parseInt(element.getAttribute("data-duration"), 10) || 800;

      const configs = {
        "fade-up": { transform: "translateY(30px)", opacity: 0 },
        "fade-in": { opacity: 0 },
        "fade-left": { transform: "translateX(-30px)", opacity: 0 },
        "fade-right": { transform: "translateX(30px)", opacity: 0 },
        "zoom-in": { transform: "scale(0.9)", opacity: 0 },
      };

      const initialStyle = configs[animationType] || configs["fade-up"];

      // Appliquer les styles initiaux
      Object.assign(element.style, initialStyle);
      element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;

      // Déclencher l'animation après le délai
      setTimeout(() => {
        element.style.transform = "translate(0, 0) scale(1)";
        element.style.opacity = "1";
      }, delay);
    },

    fallback: function () {
      // Si IntersectionObserver n'est pas supporté, afficher simplement les éléments
      this.animatedElements.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    },
  };

  // ===== INITIALISATION AU CHARGEMENT DU DOM =====
  document.addEventListener("DOMContentLoaded", function () {
    MobileMenu.init();
    // Rendre MobileMenu accessible globalement pour les dropdowns
    window.MobileMenu = MobileMenu;
    TestimonialsCarousel.init();
    SmoothScroll.init();
    CTABanner.init();
    AnimationSystem.init();
  });
})();

(function () {
  /*
   * ===================================================================
   * ## faq-accordion.js
   * ===================================================================
   */
  // FAQ Accordéon pour la page tarification
  document.addEventListener("DOMContentLoaded", function () {
    const faqQuestions = document.querySelectorAll(".faq-question");

    faqQuestions.forEach((question) => {
      question.addEventListener("click", function () {
        const faqItem = this.parentElement;
        const faqAnswer = faqItem.querySelector(".faq-answer");
        const isActive = faqItem.classList.contains("active");

        // Fermer tous les autres items
        document.querySelectorAll(".faq-item").forEach((item) => {
          item.classList.remove("active");
          const itemQuestion = item.querySelector(".faq-question");
          const itemAnswer = item.querySelector(".faq-answer");
          itemQuestion.setAttribute("aria-expanded", "false");
          if (itemAnswer) {
            itemAnswer.setAttribute("hidden", "");
          }
        });

        // Toggle l'item actuel
        if (!isActive) {
          faqItem.classList.add("active");
          this.setAttribute("aria-expanded", "true");
          if (faqAnswer) {
            faqAnswer.removeAttribute("hidden");
          }
        }
      });
    });
  });
})();

(function () {
  /*
   * ===================================================================
   * ## contact-web3forms.js
   * ===================================================================
   */
  // ===== SCRIPT CONTACT PAGE AVEC WEB3FORMS =====

  document.addEventListener("DOMContentLoaded", function () {
    // ===== CONFIGURATION WEB3FORMS =====
    const form = document.getElementById("contact-form");
    if (!form) {
      return;
    }
    const result = document.getElementById("result");
    const submitButton = form.querySelector('button[type="submit"]');
    const characterCount = document.getElementById("char-limit-message");
    const messageTextarea = document.getElementById("contact-message");
    const MAX_MESSAGE_LENGTH = 400;
    const MIN_MESSAGE_LENGTH = 10;

    /**
     * Initialisation
     */
    function init() {
      setupCharacterCounter();
      setupFormValidation();
      setupFormSubmission();
      setupSecurityFeatures();
    }

    /**
     * Configuration du compteur de caractères
     */
    function setupCharacterCounter() {
      if (messageTextarea && characterCount) {
        messageTextarea.addEventListener("input", function () {
          const currentLength = this.value.length;
          const remaining = MAX_MESSAGE_LENGTH - currentLength;

          characterCount.textContent = `${remaining} caractères restants`;

          if (remaining < 50) {
            characterCount.style.color = "#dc3545";
          } else {
            characterCount.style.color = "#6c757d";
          }
        });
      }
    }
    /**
     * Configuration des fonctionnalités de sécurité
     */
    function setupSecurityFeatures() {
      // Protection contre l'auto-complétion des champs cachés
      const hiddenInputs = form.querySelectorAll('input[type="hidden"]');
      hiddenInputs.forEach((input) => {
        input.setAttribute("autocomplete", "off");
      });

      // Vérification de l'intégrité du formulaire
      const requiredHiddenFields = ["access_key", "subject", "from_name"];
      requiredHiddenFields.forEach((fieldName) => {
        const field = form.querySelector(`input[name="${fieldName}"]`);
        if (!field || !field.value) {
          console.error(`Champ de sécurité manquant: ${fieldName}`);
        }
      });

      // Protection contre les soumissions multiples rapides
      let lastSubmitTime = 0;
      form.addEventListener("submit", function (e) {
        const now = Date.now();
        if (now - lastSubmitTime < 3000) {
          // 3 secondes minimum entre les soumissions
          e.preventDefault();
          showResult(
            "Veuillez patienter avant de renvoyer le formulaire.",
            "error"
          );
          return false;
        }
        lastSubmitTime = now;
      });
    }
    function setupFormValidation() {
      const inputs = form.querySelectorAll("input, textarea");
      inputs.forEach((input) => {
        input.addEventListener("blur", function () {
          validateField(this);
        });

        input.addEventListener("input", function () {
          if (this.classList.contains("is-invalid")) {
            validateField(this);
          }
        });
      });

      // Gestion spéciale pour le champ URL avec auto-completion
      const websiteField = document.getElementById("contact-website");
      if (websiteField) {
        websiteField.addEventListener("blur", function () {
          const value = this.value.trim();
          if (value && !value.match(/^https?:\/\//)) {
            // Auto-complétion si ça ressemble à un domaine valide
            const domainPattern =
              /^([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
            if (domainPattern.test(value)) {
              this.value = "https://" + value;
            }
          }
        });
      }
    }
    /**
     * Validation d'un champ spécifique
     */
    function validateField(field) {
      let isValid = field.checkValidity();
      const isEmpty = field.value.trim() === "";

      // Validation spéciale pour le message (longueur minimum)
      if (field.id === "contact-message" && !isEmpty) {
        if (field.value.trim().length < MIN_MESSAGE_LENGTH) {
          isValid = false;
        }
      }

      // Validation spéciale pour le nom (caractères autorisés)
      if (field.id === "contact-name" && !isEmpty) {
        const namePattern = /^[A-Za-zÀ-ÿ\s\-']+$/;
        if (!namePattern.test(field.value)) {
          isValid = false;
        }
      }

      // Validation spéciale pour le téléphone français
      if (field.id === "contact-phone" && !isEmpty) {
        const phonePattern = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
        if (!phonePattern.test(field.value.replace(/\s/g, ""))) {
          isValid = false;
        }
      } // Validation spéciale pour le champ URL avec auto-completion intelligente
      if (field.id === "contact-website" && !isEmpty) {
        const urlValue = field.value.trim();

        // Auto-completion intelligente : ajouter https:// si manquant
        if (urlValue && !urlValue.match(/^https?:\/\//)) {
          // Si ça ressemble à un domaine valide, on ajoute https://
          const domainPattern =
            /^([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
          if (domainPattern.test(urlValue)) {
            const correctedUrl = "https://" + urlValue;
            field.value = correctedUrl;
            clearCustomError(field);
            isValid = true;
          } else {
            // Format invalide
            showCustomError(
              field,
              "Veuillez indiquer un nom de domaine valide (ex: exemple.com)"
            );
            isValid = false;
          }
        } else {
          // URL avec protocole, validation normale du navigateur
          clearCustomError(field);
          isValid = field.checkValidity();
        }
      } // Gestion des classes CSS pour distinguer vide vs invalide
      field.classList.remove("is-invalid", "empty");

      if (field.hasAttribute("required")) {
        if (isEmpty) {
          field.classList.add("is-invalid", "empty");
        } else if (!isValid) {
          field.classList.add("is-invalid");
        }
      } else if (!isEmpty && !isValid) {
        field.classList.add("is-invalid");
      }

      return isValid && (!field.hasAttribute("required") || !isEmpty);
    }

    /**
     * Configuration de la soumission du formulaire avec hCaptcha
     */
    function setupFormSubmission() {
      // Configuration de la fonction globale pour hCaptcha
      window.onFormSubmit = function (token) {
        console.log("hCaptcha validé, token reçu:", token);
        submitFormWithCaptcha(token);
      };

      // Gestionnaire de soumission traditionnel (fallback)
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        event.stopPropagation();

        // Si pas de hCaptcha, validation et soumission directe
        if (typeof hcaptcha === "undefined") {
          const isFormValid = validateForm();
          form.classList.add("was-validated");

          if (isFormValid) {
            submitForm();
          } else {
            const firstInvalidField = form.querySelector(".is-invalid");
            if (firstInvalidField) {
              firstInvalidField.focus();
            }
          }
        }
        // Sinon, hCaptcha gérera la soumission via onFormSubmit
      });
    }

    /**
     * Validation complète du formulaire
     */
    function validateForm() {
      let isValid = true;
      const requiredFields = form.querySelectorAll("[required]");

      requiredFields.forEach((field) => {
        if (field.type === "checkbox") {
          const group = field.closest(".form-group-checkbox");
          const errorContainer = group.nextElementSibling;
          if (!field.checked) {
            isValid = false;
            field.classList.add("is-invalid", "empty");
            if (
              errorContainer &&
              errorContainer.classList.contains("empty-feedback")
            ) {
              errorContainer.style.display = "block";
            }
          } else {
            field.classList.remove("is-invalid", "empty");
            if (
              errorContainer &&
              errorContainer.classList.contains("empty-feedback")
            ) {
              errorContainer.style.display = "none";
            }
          }
        } else {
          if (!validateField(field)) {
            isValid = false;
          }
        }
      });
      return isValid;
    }
    /**
     * Soumission du formulaire via Web3Forms
     */ async function submitForm() {
      // Vérification de sécurité que form est bien un élément de formulaire
      if (!form || form.tagName !== "FORM") {
        console.error("Erreur: élément de formulaire non trouvé");
        showResult("Erreur technique: formulaire non disponible.", "error");
        return;
      }

      try {
        const formData = new FormData(form);
        const object = Object.fromEntries(formData);
        const json = JSON.stringify(object);

        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: json,
        });

        const data = await response.json();
        if (response.status === 200) {
          // Remplacer le texte du bouton par un message avec icône verte
          submitButton.innerHTML =
            '<i class="fas fa-check" style="color: #28a745; margin-right: 8px;"></i>Message envoyé avec succès !';
          submitButton.disabled = true;
          submitButton.classList.add("success-state");

          form.reset();
          form.classList.remove("was-validated");
          clearValidationClasses();
          clearAllCustomErrors();

          // Remettre le bouton normal après 5 secondes
          setTimeout(() => {
            submitButton.innerHTML = "Envoyer ma demande";
            submitButton.disabled = false;
            submitButton.classList.remove("success-state");
          }, 5000);
        } else {
          console.error("Erreur API Web3Forms:", data);
          showResult(
            data.message || "Une erreur est survenue lors de l'envoi.",
            "error"
          );
        }
      } catch (error) {
        console.error("Erreur lors de l'envoi:", error);
        showResult(
          "Une erreur technique est survenue. Veuillez réessayer plus tard.",
          "error"
        );
      }
    }
    /**
     * Soumission du formulaire avec token hCaptcha
     */
    async function submitFormWithCaptcha(token) {
      // Validation du formulaire avant envoi
      if (!validateForm()) {
        // Reset hCaptcha en cas d'erreur de validation
        if (typeof hcaptcha !== "undefined") {
          hcaptcha.reset();
        }

        const firstInvalidField = form.querySelector(".is-invalid");
        if (firstInvalidField) {
          firstInvalidField.focus();
        }
        return;
      }

      try {
        const formData = new FormData(form);

        // Ajouter le token hCaptcha aux données
        formData.append("h-captcha-response", token);

        const object = Object.fromEntries(formData);
        const json = JSON.stringify(object);

        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: json,
        });

        const data = await response.json();

        if (response.status === 200) {
          // Remplacer le texte du bouton par un message avec icône verte
          submitButton.innerHTML =
            '<i class="fas fa-check" style="color: #28a745; margin-right: 8px;"></i>Message envoyé avec succès !';
          submitButton.disabled = true;
          submitButton.classList.add("success-state");

          form.reset();
          form.classList.remove("was-validated");
          clearValidationClasses();
          clearAllCustomErrors();

          // Reset du compteur de caractères
          if (characterCount) {
            characterCount.textContent = `${MAX_MESSAGE_LENGTH} caractères restants`;
            characterCount.style.color = "#6c757d";
          }

          // Remettre le bouton normal après 5 secondes
          setTimeout(() => {
            submitButton.innerHTML = "Envoyer ma demande";
            submitButton.disabled = false;
            submitButton.classList.remove("success-state");

            // Reset hCaptcha
            if (typeof hcaptcha !== "undefined") {
              hcaptcha.reset();
            }
          }, 5000);
        } else {
          console.error("Erreur API Web3Forms:", data);
          showResult(
            data.message || "Une erreur est survenue lors de l'envoi.",
            "error"
          );

          // Reset hCaptcha en cas d'erreur
          if (typeof hcaptcha !== "undefined") {
            hcaptcha.reset();
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'envoi:", error);
        showResult(
          "Une erreur technique est survenue. Veuillez réessayer plus tard.",
          "error"
        );

        // Reset hCaptcha en cas d'erreur
        if (typeof hcaptcha !== "undefined") {
          hcaptcha.reset();
        }
      }
    }

    /**
     * Affichage des messages de résultat
     */
    function showResult(message, type) {
      result.textContent = message;
      result.className = `form-result ${type} show`;
      result.style.display = "block";

      if (type === "success") {
        setTimeout(() => {
          hideResult();
        }, 5000);
      }
    }

    /**
     * Masquage du message de résultat
     */
    function hideResult() {
      result.classList.remove("show");
      setTimeout(() => {
        result.style.display = "none";
      }, 300);
    }
    /**
     * Nettoyage des classes de validation
     */
    function clearValidationClasses() {
      const fields = form.querySelectorAll("input, textarea");
      fields.forEach((field) => {
        field.classList.remove("is-invalid", "empty"); // Suppression de toutes les classes de validation
      });
    }

    /**
     * Affichage d'un message d'erreur personnalisé
     */
    function showCustomError(field, message) {
      field.classList.add("is-invalid");

      // Supprimer les anciens messages d'erreur personnalisés
      const existingError = field.parentNode.querySelector(".custom-error");
      if (existingError) {
        existingError.remove();
      }

      // Créer le nouveau message d'erreur
      const errorDiv = document.createElement("div");
      errorDiv.className = "invalid-feedback custom-error";
      errorDiv.textContent = message;
      errorDiv.style.display = "block";

      field.parentNode.appendChild(errorDiv);
    }
    /**
     * Suppression du message d'erreur personnalisé
     */
    function clearCustomError(field) {
      const customError = field.parentNode.querySelector(".custom-error");
      if (customError) {
        customError.remove();
      }
    }

    /**
     * Suppression de tous les messages d'erreur personnalisés
     */
    function clearAllCustomErrors() {
      const customErrors = form.querySelectorAll(".custom-error");
      customErrors.forEach((error) => error.remove());
    }

    // Initialisation
    if (form) {
      init();
    }
  });

  // ===== ANIMATION AU SCROLL POUR LES ÉLÉMENTS DE CONTACT =====
  document.addEventListener("DOMContentLoaded", function () {
    const contactItems = document.querySelectorAll(".contact-item");

    if (contactItems.length === 0) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const contactObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }, index * 100);
        }
      });
    }, observerOptions);

    contactItems.forEach((item) => {
      item.style.opacity = "0";
      item.style.transform = "translateY(20px)";
      item.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      contactObserver.observe(item);
    });
  });
})();

(function () {
  /*
   * ===================================================================
   * ## website-page.js
   * ===================================================================
   */
  // ===== GESTION DE LA PAGE WEBSITE =====

  const WebsitePage = {
    init: function () {
      // Vérifier si on est sur la page website
      if (
        !document.body.classList.contains("page-website") &&
        !document.body.classList.contains("page-contenus") &&
        !window.location.pathname.includes("website") &&
        !window.location.pathname.includes("contenus")
      ) {
        return;
      }

      this.initTimelineAnimation();
    },

    // ===== TIMELINE ANIMATION =====
    initTimelineAnimation: function () {
      const timelineItems = document.querySelectorAll(".timeline-new li");
      if (!timelineItems.length) return;

      const observerOptions = {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px",
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = Array.from(timelineItems).indexOf(entry.target) * 150;
            setTimeout(() => {
              entry.target.classList.add("animate-in");
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      timelineItems.forEach((item) => {
        observer.observe(item);
      });
    },
  };

  // ===== INITIALISATION AUTOMATIQUE =====
  document.addEventListener("DOMContentLoaded", function () {
    WebsitePage.init();
  });
})();

function focusWidgetForm(event) {
  event.preventDefault(); // évite le scroll brutal

  const targetId = event.currentTarget.getAttribute("href").substring(1);
  const targetElement = document.getElementById(targetId);
  const input = document.querySelector("#so-domainso1751300534");
  const header = document.querySelector(".site-header");

  if (targetElement) {
    const targetRect = targetElement.getBoundingClientRect();
    const absoluteTargetTop = targetRect.top + window.pageYOffset;
    const headerHeight = header ? header.offsetHeight : 0;

    // Calculate the scroll position to bring the target element to the top of the viewport, below the header
    const scrollToPosition = absoluteTargetTop - headerHeight;

    window.scrollTo({
      top: scrollToPosition,
      behavior: "smooth",
    });
  }

  if (input) {
    setTimeout(() => {
      input.focus({ preventScroll: true });
    }, 800); // Using a slightly longer timeout for safety
  }
}

// ===== WIDGET SEO AUDIT FORM =====
/**
 * Fonctions pour la gestion du formulaire d'audit SEO
 * Intégrées depuis widget.js - Disponibles globalement
 */
function goToStep2() {
  const domain = document.getElementById("so-domainso1752003017");

  // Validate domain first
  if (0 == domain.value.length) {
    alert(domain.getAttribute("data-validation"));
    return false;
  }

  domain.value = domain.value.trim().replace(/\/$/, "");
  if (!domain.value.match(/^(https?:\/\/)?[a-z\d\-]{1,62}\..*/i)) {
    alert(domain.getAttribute("data-validation"));
    return false;
  }

  // Hide domain wrapper, show email wrapper
  document.getElementById("domain-wrapper").classList.add("hidden");
  document.getElementById("email-wrapper").classList.remove("hidden");

  // Focus on email field
  document.getElementById("so-emailso1752003017").focus();
}

function soSubmit(el) {
  if (!soFormValidate(el)) {
    //e.preventDefault();
    return false;
  }
  const behaviour = el.getAttribute("data-behaviour");
  soBody = document.getElementsByTagName("body")[0];
  soBodyOriginalStyleHeight = soBody.style.height;
  soBodyOriginalStyleOverflow = soBody.style.overflow;
  const element = document.createElement("input");
  element.setAttribute("type", "hidden");
  element.setAttribute("name", "referrer");
  element.setAttribute("value", window.location.href);
  el.appendChild(element);
  if (behaviour == "new_tab") return true;
  if (behaviour == "modal") return soSubmitModal(el);
  if (behaviour == "be_in_touch") return soSubmitBeInTouch(el);
  if (behaviour == "redirect") return soSubmitRedirect(el);
}

function soFormValidate(el) {
  const domain = el.querySelector('input[name="domain"]');
  const email = el.querySelector('input[name="email"]');
  const phone = el.querySelector('input[name="phone"]');
  const firstName = el.querySelector('input[name="first_name"]');
  const lastName = el.querySelector('input[name="last_name"]');
  const custom = el.querySelector('input[name="custom_field"]');
  const consent = el.querySelector('input[name="consent"]');

  // Domain validation (already done in step 1, but keep for safety)
  if (0 == domain.value.length)
    return alert(domain.getAttribute("data-validation")), !1;
  if (
    ((domain.value = domain.value.trim().replace(/\/$/, "")),
    !domain.value.match(/^(https?:\/\/)?[a-z\d\-]{1,62}\..*/i))
  )
    return alert(domain.getAttribute("data-validation")), !1;

  if (null != firstName && 0 == firstName.value.length)
    return alert(firstName.getAttribute("data-validation")), !1;
  if (null != lastName && 0 == lastName.value.length)
    return alert(lastName.getAttribute("data-validation")), !1;
  if (null != email) {
    if (0 == email.value.length)
      return alert(email.getAttribute("data-validation")), !1;
    //var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    const regex =
      /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    if (!regex.test(email.value))
      return alert(email.getAttribute("data-validation")), !1;
  }
  if (null != phone && 7 > phone.value.length)
    return alert(phone.getAttribute("data-validation")), !1;
  if (null != custom && 0 == custom.value.length)
    return alert(custom.getAttribute("data-validation")), !1;
  if (null != consent && false === consent.checked)
    return alert(consent.getAttribute("data-validation")), !1;

  setTimeout(function () {
    el.reset();
  }, 50);
  return true;
}

function soSubmitModal(el) {
  const modalWrapper = document.createElement("div");
  const button = el.querySelector('input[name="button"]');
  let html =
    '<style type="text/css">\n' +
    "    @media (max-width:500px) { #so-widget-modal-content { width:100% !important; height:100% !important; margin-top:50px !important; } }\n" +
    "    @media (max-width:500px) and (max-height:550px) { #so-widget-modal-content { height:100% !important;} }\n" +
    "    @media (min-height:601px) and (max-height:750px) and (min-width:501px) { #so-widget-modal-content { margin-top:100px !important; } }\n" +
    "    @media (max-height:600px) and (min-width:501px) { #so-widget-modal-content { margin-top:80px !important; } }\n" +
    "    #iframe-wrapper {width: 100%;height: 100%;-webkit-overflow-scrolling: touch !important}\n" +
    "    #iframe-wrapper iframe {height: 100%;width: 100%;}\n" +
    "</style> \n" +
    '<div id="so-widget-modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:none; opacity:0; transition:opacity 0.3s ease;">\n' +
    '\t\t\t<div id="so-widget-modal-content" style="position:relative; width:80%; max-width: 1250px; height:80%; margin:120px auto 0; background:#fff;">\n' +
    '\t\t\t\t<div style="width:100%; height:50px; position:absolute; top:-50px; background:white;">\n' +
    '\t\t\t\t\t<span id="so-widget-modal-title" style="position:absolute; left:15px; top:15px; font-size:16px; font-weight:bold;"></span>\n';
  if (null != button) {
    const styles = window.getComputedStyle(
      el.querySelector('input[type="submit"]')
    );
    html +=
      '\t\t\t\t\t<a href="' +
      button.value +
      '" id="so-widget-modal-button" style="display: inline-block;position: absolute;top: 3px;right: 0;margin-right: 50px;text-decoration: none;background-color: ' +
      styles.backgroundColor +
      ";border: 1px solid " +
      styles.backgroundColor +
      ";color: " +
      styles.color +
      ' !important;border-radius: 3px;font-size: 19px;padding: 8px 50px;height: 27px;box-sizing: content-box;">' +
      button.getAttribute("title") +
      "</a>\n";
  }
  html +=
    '\t\t\t\t\t<span onclick="closeSoModal();" style="display:inline-block; width:16px; height:16px; position:absolute; top:15px; right:15px; cursor:pointer; background-image:url(\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAowAAAKMB8MeazgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAB5SURBVDiNrZPRCcAwCEQfnUiySAZuF8kSWeH6Yz8KrQZMQAicJ+epAB0YwAmYJKIADLic0/GPPCbQAnLznCd/4NWUFfkgy1VjH8CryA95ApYltAiTRCZxpuoW+gz9WXE6NPeg+ra1UDIxGlWEObe4SGxY5fIxlc75Bkt9V4JS7KWJAAAAAElFTkSuQmCC59ef34356faa7edebc7ed5432ddb673d\'); opacity:0.6;"></span>\n' +
    "\t\t\t\t</div>\n" +
    '                <div id="iframe-wrapper">\n' +
    '\t\t\t\t    <iframe name="so-iframe" id="so-iframe" scrolling="yes" style="border:1px solid transparent; width:100%; height:100%; box-sizing:border-box;"></iframe>\n' +
    "\t\t\t    </div>\n" +
    "\t\t\t</div>\n" +
    "\t\t</div>";
  modalWrapper.setAttribute(
    "style",
    "position:absolute; top:0; left:0; width:100%; z-index:9999999"
  );
  modalWrapper.setAttribute("id", "so-modal-wrapper");
  modalWrapper.innerHTML = html;
  document.body.appendChild(modalWrapper);

  let isMobile = false;
  if (
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
      navigator.userAgent
    ) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
      navigator.userAgent.substr(0, 4)
    )
  )
    isMobile = true;
  if (isMobile) {
    el.querySelector('input[name="type"]').value = "web";
    if (null != button && 0 !== button.value.length)
      document.getElementById("so-widget-modal-title").style.display = "none";
  }

  const domain = el.querySelector('input[name="domain"]').value;
  const soOverlay = document.getElementById("so-widget-modal-overlay");
  soOverlay.style.display = "block";
  document.getElementById("so-widget-modal-title").innerText =
    el.getAttribute("data-title") + domain;
  soBody.style.height = "100%";
  soBody.style.overflow = "hidden";
  setTimeout(function () {
    soOverlay.style.opacity = 1;
  }, 50);
  return true;
}

function soSubmitBeInTouch(el) {
  const iframe = document.createElement("iframe");
  const element = document.createElement("input");
  element.setAttribute("type", "hidden");
  element.setAttribute("name", "be_in_touch");
  element.setAttribute("value", "1");
  el.appendChild(element);
  iframe.setAttribute("id", "so-iframe");
  iframe.setAttribute("name", "so-iframe");
  iframe.setAttribute(
    "style",
    "position:absolute; bottom:0; left:0; width:1px; height:1px; border:none"
  );
  document.body.appendChild(iframe);
  alert(el.getAttribute("data-touch"));
  return true;
}

function soSubmitRedirect(el) {
  el.removeAttribute("target");
  return true;
}

function closeSoModal() {
  const soOverlay = document.getElementById("so-widget-modal-overlay");
  soOverlay.style.opacity = 0;
  document.getElementById("so-modal-wrapper").remove();
  setTimeout(function () {
    soBody.style.height = soBodyOriginalStyleHeight;
    soBody.style.overflow = soBodyOriginalStyleOverflow;
    soOverlay.style.display = "none";
  }, 300);
}

(function () {
  /*
   * ===================================================================
   * ## pdf-modal.js
   * ===================================================================
   */
  /**
   * PDF Modal Manager - Version simplifiée
   * Ouverture directe du PDF pour compatibilité mobile/desktop
   */

  class PDFModal {
    constructor() {
      this.init();
    }

    /**
     * Initialise la modal PDF
     */
    init() {
      this.bindTriggerButton();
    }

    /**
     * Lie le bouton qui déclenche l'ouverture du PDF
     */
    bindTriggerButton() {
      // Recherche du bouton "Voir un audit" avec l'ID spécifique
      let triggerButton = document.getElementById("pdf-audit-trigger");

      if (triggerButton) {
        // Ajouter une classe pour le styling
        triggerButton.classList.add("pdf-trigger");

        // Empêcher la navigation normale et ouvrir le PDF
        triggerButton.addEventListener("click", (e) => {
          e.preventDefault();
          this.open();
        });
      }
    }
    open() {
      window.open("assets/pdf/Rapport-audit-exemple.pdf", "_blank");

      // Analytics/tracking (optionnel)
      this.trackEvent("pdf_opened_direct");
    }

    /**
     * Fonction de tracking des événements (optionnel)
     */
    trackEvent(eventName) {
      // Intégrer avec Google Analytics si disponible
      if (typeof gtag !== "undefined") {
        gtag("event", eventName, {
          event_category: "PDF Modal",
          event_label: "Audit Example",
        });
      }

      console.log(`PDF Modal Event: ${eventName}`);
    }
  }

  // Initialisation automatique quand le DOM est prêt
  document.addEventListener("DOMContentLoaded", () => {
    // Attendre un peu pour s'assurer que tous les éléments sont chargés
    setTimeout(() => {
      window.pdfModal = new PDFModal();
    }, 100);
  });

  // Export global
  window.PDFModal = PDFModal;

  /*
   * ===================================================================
   * ## Section Pricing Website avec Onglets
   * ===================================================================
   */

  class PricingWebsiteTabs {
    constructor() {
      this.initializeTabs();
    }

    initializeTabs() {
      const tabButtons = document.querySelectorAll(".pricing-tab-btn");
      const tabPanels = document.querySelectorAll(".pricing-tab-panel");

      if (!tabButtons.length || !tabPanels.length) return;

      // Gestionnaires d'événement pour les onglets
      tabButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
          const targetId = button.getAttribute("data-target");
          this.switchTab(targetId, tabButtons, tabPanels);
        });
      });

      // Gestion des touches clavier pour l'accessibilité
      tabButtons.forEach((button, index) => {
        button.addEventListener("keydown", (e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            const nextIndex = (index + 1) % tabButtons.length;
            tabButtons[nextIndex].focus();
            tabButtons[nextIndex].click();
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            const prevIndex = index === 0 ? tabButtons.length - 1 : index - 1;
            tabButtons[prevIndex].focus();
            tabButtons[prevIndex].click();
          }
        });
      });
    }

    switchTab(targetId, tabButtons, tabPanels) {
      // Retirer la classe active de tous les boutons
      tabButtons.forEach((btn) => {
        btn.classList.remove("active");
        btn.setAttribute("aria-selected", "false");
      });

      // Masquer tous les panneaux
      tabPanels.forEach((panel) => {
        panel.classList.remove("active");
      });

      // Activer le bouton cliqué
      const activeButton = document.querySelector(
        `[data-target="${targetId}"]`
      );
      const activePanel = document.getElementById(targetId);

      if (activeButton && activePanel) {
        activeButton.classList.add("active");
        activeButton.setAttribute("aria-selected", "true");
        activePanel.classList.add("active");

        // Analytics/tracking (optionnel)
        this.trackTabSwitch(targetId);
      }
    }

    trackTabSwitch(tabId) {
      // Intégrer avec Google Analytics si disponible
      if (typeof gtag !== "undefined") {
        gtag("event", "pricing_tab_switch", {
          event_category: "Pricing Website",
          event_label: tabId,
        });
      }

      console.log(`Pricing Website Tab: Switched to ${tabId}`);
    }
  }

  // Initialisation du composant PricingWebsiteTabs
  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector(".pricing-website-section")) {
      new PricingWebsiteTabs();
    }
  });

  /*
   * ===================================================================
   * ## Gestion des onglets de tarification
   * ===================================================================
   */

  // ===== GESTION DES ONGLETS DE LA PAGE TARIFICATION =====
  document.addEventListener("DOMContentLoaded", function () {
    // Vérifier spécifiquement si on est sur la page tarification
    const isPageTarification =
      document.body.classList.contains("page-tarification") ||
      window.location.pathname.includes("tarification") ||
      document.getElementById("services-web");

    if (!isPageTarification) {
      return;
    }

    // Vérifier si on est sur la page tarification et qu'il y a des onglets
    const navButtons = document.querySelectorAll(".tabs-nav-item");
    const sections = document.querySelectorAll(
      ".content-section, .content-pricing-section"
    );

    if (!navButtons.length || !sections.length) {
      return;
    }

    // Fonction pour afficher une section spécifique
    function showSection(targetId) {
      // Masquer toutes les sections
      sections.forEach((section) => {
        section.classList.remove("visible");
        section.setAttribute("hidden", "");
      });

      // Désactiver tous les boutons
      navButtons.forEach((btn) => {
        btn.classList.remove("active");
        btn.setAttribute("aria-selected", "false");
      });

      // Afficher la section cible
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add("visible");
        targetSection.removeAttribute("hidden");
      }

      // Activer le bouton correspondant
      const activeBtn = document.querySelector(`[aria-controls="${targetId}"]`);
      if (activeBtn) {
        activeBtn.classList.add("active");
        activeBtn.setAttribute("aria-selected", "true");
      }
    }

    // Attacher les événements de clic aux boutons de navigation
    navButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.getAttribute("aria-controls");
        if (targetId) {
          showSection(targetId);
        }
      });
    });

    // Initialiser la première section
    if (navButtons.length > 0) {
      const firstButton = navButtons[0];
      const firstTargetId = firstButton.getAttribute("aria-controls");
      if (firstTargetId) {
        showSection(firstTargetId);
      }
    }
  });
})();

/*
 * ===================================================================
 * // Section  contenus-social-media-section -  contenus-social-icons-floating -Page audit-seo et contenus
 * ===================================================================
 */
// Animation fluide infinie des icônes sociales - Version optimisée avec fondu
document.addEventListener("DOMContentLoaded", function () {
  const BREAKPOINT = 1200;
  const container = document.querySelector(".contenus-social-icons-container");
  const track = document.querySelector(".contenus-social-icons-track");

  if (!container || !track) return;

  // Variables d'état
  let isInitialized = false;
  let resizeTimeout;

  // Vérification des préférences d'accessibilité
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function initializeMarquee() {
    if (
      isInitialized ||
      window.innerWidth >= BREAKPOINT ||
      prefersReducedMotion
    )
      return;

    // Créer 3 copies pour un défilement vraiment infini
    const originalIcons = Array.from(track.children);

    // Ajouter 2 copies supplémentaires (total = 3x les icônes)
    for (let i = 0; i < 2; i++) {
      originalIcons.forEach((icon) => {
        const clone = icon.cloneNode(true);
        track.appendChild(clone);
      });
    }

    // Calculer la durée pour une vitesse de 15px/s (plus lente et fluide)
    setTimeout(() => {
      const singleSetWidth = track.scrollWidth / 3;
      const duration = singleSetWidth / 50; // Vitesse réduite à 15px/s

      // Appliquer l'animation CSS infinie
      track.style.animationDuration = `${duration}s`;
      track.classList.add("marquee-active");
    }, 100);

    isInitialized = true;
  }

  function resetMarquee() {
    if (!isInitialized) return;

    // Stopper l'animation
    track.classList.remove("marquee-active");
    track.style.animationDuration = "";
    track.style.transform = "translateX(0)";

    // Supprimer les clones (garder seulement les originaux)
    const allIcons = Array.from(track.children);
    const originalCount = allIcons.length / 3;
    allIcons.slice(originalCount).forEach((clone) => clone.remove());

    isInitialized = false;
  }

  function handleResize() {
    const isDesktop = window.innerWidth >= BREAKPOINT;

    if (isDesktop) {
      resetMarquee();
    } else if (!isInitialized && !prefersReducedMotion) {
      // Délai pour permettre au CSS de se stabiliser
      setTimeout(initializeMarquee, 200);
    }
  }

  // Gestion du resize avec debounce
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 150);
  });

  // Pause sur visibilité de l'onglet (économie de ressources)
  document.addEventListener("visibilitychange", function () {
    if (!track.classList.contains("marquee-active")) return;

    if (document.hidden) {
      track.style.animationPlayState = "paused";
    } else {
      track.style.animationPlayState = "running";
    }
  });

  // Nettoyage au déchargement
  window.addEventListener("beforeunload", resetMarquee);

  // Initialisation
  handleResize();
});

/**
 * Timeline Animations Controller
 * Gère les animations des lignes de connexion, compteurs et étapes via Intersection Observer
 * Optimisé pour les performances et l'accessibilité
 */

class TimelineAnimations {
  constructor() {
    // Options pour l'Intersection Observer : déclenche quand 30% de l'élément est visible, avec une marge de -20% en bas
    this.observerOptions = {
      root: null, // Utilise la fenêtre comme root
      rootMargin: "0px 0px -20% 0px", // Déclenche 20% avant que l'élément entre complètement dans la vue
      threshold: 0.3, // 30% de l'élément doit être visible
    };

    this.observer = null; // L'observer sera créé plus tard
    this.timelineEvents = []; // Liste des éléments de timeline
    this.counters = []; // Liste des compteurs de statistiques
    this.steps = []; // Liste des étapes de processus

    // Vérifie si l'utilisateur préfère réduire les animations (accessibilité)
    this.prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    this.init(); // Lance l'initialisation
  }

  init() {
    this.timelineEvents = document.querySelectorAll(".timeline-new li");
    this.counters = document.querySelectorAll(".stat-banner-number");
    this.steps = document.querySelectorAll(".process-step");

    // Si aucun élément trouvé, arrête et log un avertissement
    if (
      this.timelineEvents.length === 0 &&
      this.counters.length === 0 &&
      this.steps.length === 0
    ) {
      console.warn("Aucun élément d'animation trouvé");
      return;
    }

    this.createObserver(); // Crée l'observer
    this.observeElements(); // Observe les éléments

    console.log(
      `Timeline Observer initialisé pour ${this.timelineEvents.length} timelines, ${this.counters.length} compteurs, ${this.steps.length} étapes`
    );
  }

  createObserver() {
    // Crée un seul Intersection Observer pour tous les éléments (optimisation)
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Si l'élément entre dans la vue
          const element = entry.target;
          const delay = parseInt(element.getAttribute("data-delay")) || 0; // Récupère le délai personnalisé (par défaut 0)

          if (this.prefersReducedMotion) {
            // Applique directement sans animation pour l'accessibilité
            this.applyAnimation(element);
          } else {
            // Applique avec délai pour un effet progressif
            setTimeout(() => {
              this.applyAnimation(element);
            }, delay);
          }

          this.observer.unobserve(element); // Arrête d'observer cet élément (animation unique)
        }
      });
    }, this.observerOptions);
  }

  applyAnimation(element) {
    // Applique l'animation appropriée selon le type d'élément
    if (element.classList.contains("stat-banner-number")) {
      this.animateCounter(element); // Animation de compteur
    } else {
      element.classList.add("animate"); // Animation CSS standard (ex. fade-in)
    }
  }

  animateCounter(counter) {
    // Anime un compteur de 0 à la valeur cible
    const target = parseInt(counter.getAttribute("data-target"), 10);
    if (isNaN(target)) return; // Si pas de cible valide, arrête

    const duration = 2000; // Durée de 2 secondes
    const startTime = performance.now(); // Temps de départ précis
    const startValue = 0; // Commence à 0

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime; // Temps écoulé
      const progress = Math.min(elapsed / duration, 1); // Progression (0 à 1)
      const currentValue = Math.floor(
        startValue + (target - startValue) * progress
      ); // Valeur actuelle

      counter.textContent = currentValue; // Met à jour le texte

      if (progress < 1) {
        requestAnimationFrame(updateCounter); // Continue l'animation
      } else {
        counter.textContent = target; // Fin à la valeur exacte
      }
    };

    requestAnimationFrame(updateCounter); // Lance l'animation
  }

  observeElements() {
    // Observe tous les éléments sélectionnés
    [...this.timelineEvents, ...this.counters, ...this.steps].forEach(
      (element) => {
        this.observer.observe(element);
      }
    );
  }

  // Méthode publique pour nettoyer l'observer si nécessaire (ex. lors de la navigation)
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Initialisation automatique au chargement du DOM
document.addEventListener("DOMContentLoaded", () => {
  window.timelineAnimations = new TimelineAnimations(); // Crée une instance globale pour accès facile
});

// ===== GESTION DES MENUS DÉROULANTS - VERSION CORRIGÉE =====
const DropdownMenu = {
  init: function () {
    this.dropdownItems = document.querySelectorAll(".nav-item--dropdown");
    this.mobileDropdownItems = document.querySelectorAll(
      ".mobile-nav-item--dropdown"
    );
    this.isInitialized = false;

    if (this.dropdownItems.length > 0 || this.mobileDropdownItems.length > 0) {
      // Forcer la fermeture de tous les dropdowns au démarrage
      this.forceCloseAll();
      this.bindEvents();
      this.isInitialized = true;
    }
  },

  // Nouvelle méthode pour forcer la fermeture au démarrage
  forceCloseAll: function () {
    // Fermer tous les dropdowns desktop
    this.dropdownItems.forEach((item) => {
      item.classList.remove("active");
      const link = item.querySelector(".nav-link--dropdown");
      if (link) {
        link.setAttribute("aria-expanded", "false");
      }
    });

    // Fermer tous les dropdowns mobiles
    this.mobileDropdownItems.forEach((item) => {
      item.classList.remove("active");
      const link = item.querySelector(".mobile-nav-link--dropdown");
      if (link) {
        link.setAttribute("aria-expanded", "false");
      }
    });

    // NOUVEAU: Nettoyage supplémentaire pour s'assurer qu'aucun état persistant ne reste
    document.querySelectorAll(".nav-item--dropdown").forEach((item) => {
      item.classList.remove("active");
    });
    document.querySelectorAll(".mobile-nav-item--dropdown").forEach((item) => {
      item.classList.remove("active");
    });
    document.querySelectorAll(".dropdown-menu").forEach((menu) => {
      menu.style.display = "";
      menu.style.visibility = "";
      menu.style.opacity = "";
    });
  },

  bindEvents: function () {
    this.dropdownItems.forEach((item) => {
      const link = item.querySelector(".nav-link--dropdown");

      if (link) {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleDropdown(item);
        });
      }

      const dropdownLinks = item.querySelectorAll(".dropdown-link");
      dropdownLinks.forEach((dropdownLink) => {
        dropdownLink.addEventListener("click", () => {
          this.closeAllDropdowns();
        });
      });
    });

    // Gestion mobile
    this.mobileDropdownItems.forEach((item) => {
      const link = item.querySelector(".mobile-nav-link--dropdown");

      if (link) {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleMobileDropdown(item);
        });
      }

      // Fermer le menu mobile quand on clique sur un lien du dropdown
      const dropdownLinks = item.querySelectorAll(".mobile-dropdown-link");
      dropdownLinks.forEach((dropdownLink) => {
        dropdownLink.addEventListener("click", () => {
          // Fermer TOUS les dropdowns puis fermer le menu mobile
          this.closeAllDropdowns();
          if (window.MobileMenu && window.MobileMenu.state.isOpen) {
            window.MobileMenu.closeMenu();
          }
        });
      });
    });

    // Fermer au clic externe - VERSION SIMPLIFIÉE
    document.addEventListener("click", (e) => {
      if (!e.isTrusted) return;

      if (
        !e.target.closest(".nav-item--dropdown") &&
        !e.target.closest(".mobile-nav-item--dropdown")
      ) {
        this.closeAllDropdowns();
      }
    });

    // Fermer au redimensionnement
    window.addEventListener("resize", () => {
      this.closeAllDropdowns();
    });

    // NOUVEAU: Fermer au chargement de nouvelle page
    window.addEventListener("beforeunload", () => {
      this.closeAllDropdowns();
    });

    // NOUVEAU: S'assurer que tout est fermé au chargement de page
    window.addEventListener("load", () => {
      this.forceCloseAll();
    });

    // NOUVEAU: Fermer avec la touche Échap
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllDropdowns();
      }
    });
  },

  toggleDropdown: function (item) {
    const isActive = item.classList.contains("active");

    // TOUJOURS fermer TOUS les autres dropdowns d'abord
    this.closeAllDropdowns();

    // Si l'item n'était pas actif, l'ouvrir
    if (!isActive) {
      item.classList.add("active");
      const link = item.querySelector(".nav-link--dropdown");
      if (link) {
        link.setAttribute("aria-expanded", "true");
      }
    }
    // Si il était actif, il reste fermé (déjà fermé par closeAllDropdowns)
  },

  toggleMobileDropdown: function (item) {
    const isActive = item.classList.contains("active");

    // TOUJOURS fermer TOUS les autres dropdowns d'abord
    this.closeAllDropdowns();

    // Si l'item n'était pas actif, l'ouvrir
    if (!isActive) {
      item.classList.add("active");
      const link = item.querySelector(".mobile-nav-link--dropdown");
      if (link) {
        link.setAttribute("aria-expanded", "true");
      }
    }
  },

  closeAllDropdowns: function () {
    // Fermer tous les dropdowns desktop
    this.dropdownItems.forEach((item) => {
      item.classList.remove("active");
      const link = item.querySelector(".nav-link--dropdown");
      if (link) {
        link.setAttribute("aria-expanded", "false");
      }
    });

    // Fermer tous les dropdowns mobiles
    this.mobileDropdownItems.forEach((item) => {
      item.classList.remove("active");
      const link = item.querySelector(".mobile-nav-link--dropdown");
      if (link) {
        link.setAttribute("aria-expanded", "false");
      }
    });
  },
};

// Initialisation IMMÉDIATE pour éviter le flash
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    DropdownMenu.init();
  });
} else {
  // Si le DOM est déjà chargé, initialiser immédiatement
  DropdownMenu.init();
}

/*
 * ===================================================================
 * ## Timeline Icons Pop-up Animation
 * ===================================================================
 */

/**
 * Timeline Icons Pop-up Animation
 * Animation simple et élégante pour les icônes de timeline
 */

class TimelineIconsAnimation {
  constructor() {
    this.icons = [];
    this.observer = null;
    this.observerOptions = {
      root: null,
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.3,
    };

    this.init();
  }

  init() {
    this.icons = document.querySelectorAll(".timeline-new li .date, .timeline-new li .title");

    if (this.icons.length === 0) {
      console.warn("Timeline Icons Animation: Aucune icône trouvée");
      return;
    }

    // Créer l'observer
    this.createObserver();

    // Observer chaque icône
    this.icons.forEach((icon) => {
      this.observer.observe(icon); // Observer directement l'icône elle-même
    });

    console.log(
      `Timeline Icons Animation: ${this.icons.length} icônes initialisées`
    );
  }

  createObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // L'icône est l'élément observé lui-même (pas un enfant <i>)
        const icon = entry.target;

        if (entry.isIntersecting) {
          // Ajouter un délai progressif basé sur l'index
          const icons = Array.from(this.icons);
          const iconIndex = icons.indexOf(icon);
          const delay = iconIndex * 150; // 150ms entre chaque icône

          setTimeout(() => {
            this.animateIcon(icon);
          }, delay);

          // Ne plus observer cette icône après animation
          this.observer.unobserve(entry.target);
        }
      });
    }, this.observerOptions);
  }

  animateIcon(icon) {
    // Vérification de sécurité
    if (!icon || !icon.classList) {
      console.warn("Timeline Icons Animation: Élément invalide pour l'animation");
      return;
    }

    // Ajouter la classe d'animation
    icon.classList.add("animate-pop-in");

    // Ajouter un effet de rebond après l'animation initiale
    setTimeout(() => {
      if (icon.classList) {
        icon.classList.add("animate-bounce");
      }
    }, 400);

    // Nettoyer les classes après animation
    setTimeout(() => {
      if (icon.classList) {
        icon.classList.remove("animate-bounce");
      }
    }, 800);
  }

  // Méthode pour réinitialiser les animations (pour debug)
  reset() {
    this.icons.forEach((icon) => {
      if (icon && icon.classList) {
        icon.classList.remove("animate-pop-in", "animate-bounce");
      }
    });

    // Réobserver toutes les icônes
    this.icons.forEach((icon) => {
      if (icon) {
        this.observer.observe(icon); // Observer directement l'icône
      }
    });
  }

  // Nettoyage
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.icons = [];
  }
}

// Initialisation automatique
document.addEventListener("DOMContentLoaded", () => {
  // Attendre que tous les styles soient chargés
  setTimeout(() => {
    window.timelineIconsAnimation = new TimelineIconsAnimation();
  }, 100);
});

// Nettoyage lors du déchargement
window.addEventListener("beforeunload", () => {
  if (
    window.timelineIconsAnimation &&
    typeof window.timelineIconsAnimation.destroy === "function"
  ) {
    window.timelineIconsAnimation.destroy();
  }
});
