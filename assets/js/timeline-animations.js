/**
 * Timeline Animations Controller
 * Gère les animations des lignes de connexion via Intersection Observer
 */

class TimelineAnimations {
  constructor() {
    this.observerOptions = {
      root: null,
      rootMargin: "0px 0px -20% 0px",
      threshold: 0.3,
    };

    this.observer = null;
    this.timelineEvents = [];

    this.init();
  }

  init() {
    this.timelineEvents = document.querySelectorAll(".timeline__event");

    if (this.timelineEvents.length === 0) {
      console.warn("Aucun élément timeline trouvé");
      return;
    }

    this.createObserver();
    this.observeElements();

    console.log(
      `Timeline Observer initialisé pour ${this.timelineEvents.length} éléments`
    );
  }

  createObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate");
          // Optionnel : arrêter l'observation après animation
          // this.observer.unobserve(entry.target);
        }
      });
    }, this.observerOptions);
  }

  observeElements() {
    this.timelineEvents.forEach((event) => {
      this.observer.observe(event);
    });
  }

  // Méthode publique pour nettoyer l'observer si nécessaire
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Initialisation automatique au chargement du DOM
document.addEventListener("DOMContentLoaded", () => {
  window.timelineAnimations = new TimelineAnimations();
});
