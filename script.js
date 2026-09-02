const year = document.querySelector("[data-year]");

if (year) year.textContent = String(new Date().getFullYear());

const COVERAGE = Object.freeze({
  national: {
    label: "Todo o Brasil",
    href: "/decoracao-de-festas-no-brasil/",
    description: "Projetos autorais de decoração podem ser contratados em todo o país, conforme disponibilidade e logística de cada evento.",
  },
  priorityCities: [
    {
      label: "Uberlândia",
      href: "/decoracao-de-festas-em-uberlandia/",
      description: "Uma das cidades com maior presença de projetos de Natanael Albino.",
    },
    {
      label: "São Paulo",
      href: "/decoracao-de-festas-em-sao-paulo/",
      description: "Atendimento para celebrações e projetos autorais na capital paulista.",
    },
    {
      label: "Rio de Janeiro",
      href: "/decoracao-de-festas-no-rio-de-janeiro/",
      description: "Atendimento para celebrações e projetos autorais na capital fluminense.",
    },
  ],
});

const footerMeta = document.querySelector(".footer-meta");

if (footerMeta && !footerMeta.querySelector(".footer-credit")) {
  const footerCredit = document.createElement("p");
  footerCredit.className = "footer-credit";
  footerCredit.innerHTML = 'Desenvolvido por <a href="https://zoqvera.com" target="_blank" rel="noopener noreferrer">Zoqvera</a>.';

  const footerCreditStyles = document.createElement("style");
  footerCreditStyles.textContent = `
    .footer-credit {
      margin: 0;
      color: rgba(245, 242, 233, 0.58);
      font-size: 0.68rem;
      line-height: 1.5;
    }

    .footer-credit a {
      color: rgba(245, 242, 233, 0.86);
      text-decoration: none;
      transition: color 180ms ease;
    }

    .footer-credit a:hover,
    .footer-credit a:focus-visible {
      color: var(--paper-light);
      text-decoration: underline;
      text-underline-offset: 0.3rem;
    }
  `;

  document.head.appendChild(footerCreditStyles);
  footerMeta.prepend(footerCredit);
}

function createCoverageCard({ index, title, description, href, linkLabel }) {
  const article = document.createElement("article");
  article.className = "intent-card";

  const indexElement = document.createElement("span");
  indexElement.className = "intent-index";
  indexElement.setAttribute("aria-hidden", "true");
  indexElement.textContent = index;

  const copy = document.createElement("div");
  const heading = document.createElement("h3");
  heading.textContent = title;

  const paragraph = document.createElement("p");
  paragraph.textContent = description;

  copy.append(heading, paragraph);

  const actions = document.createElement("div");
  actions.className = "intent-actions";

  const link = document.createElement("a");
  link.className = "intent-primary";
  link.href = href;
  link.textContent = linkLabel;
  actions.appendChild(link);

  article.append(indexElement, copy, actions);
  return article;
}

function installCoverageSection() {
  if (document.getElementById("atendimento")) return;

  const trustSection = document.getElementById("confianca");
  if (!trustSection) return;

  const section = document.createElement("section");
  section.className = "intent-paths";
  section.id = "atendimento";
  section.setAttribute("aria-labelledby", "coverage-title");

  const headingWrapper = document.createElement("div");
  headingWrapper.className = "intent-heading";

  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "Onde atendemos";

  const heading = document.createElement("h2");
  heading.id = "coverage-title";
  heading.textContent = "Atendimento em todo o Brasil";

  const introduction = document.createElement("p");
  introduction.textContent = "Natanael Albino desenvolve projetos de decoração em todo o país, com maior presença em Uberlândia, São Paulo e Rio de Janeiro.";

  headingWrapper.append(eyebrow, heading, introduction);

  const grid = document.createElement("div");
  grid.className = "intent-grid";

  grid.appendChild(
    createCoverageCard({
      index: "01",
      title: COVERAGE.national.label,
      description: COVERAGE.national.description,
      href: COVERAGE.national.href,
      linkLabel: "Ver atendimento nacional",
    }),
  );

  COVERAGE.priorityCities.forEach((city, cityIndex) => {
    grid.appendChild(
      createCoverageCard({
        index: String(cityIndex + 2).padStart(2, "0"),
        title: city.label,
        description: city.description,
        href: city.href,
        linkLabel: `Decoração em ${city.label}`,
      }),
    );
  });

  section.append(headingWrapper, grid);
  trustSection.before(section);
}

function appendNavigationLink(container, href, label) {
  if (!container || container.querySelector(`a[href="${href}"]`)) return;

  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  container.appendChild(link);
}

function installCoverageNavigation() {
  appendNavigationLink(document.querySelector(".primary-nav"), "#atendimento", "Atendimento");
  appendNavigationLink(document.querySelector(".mobile-nav nav"), "#atendimento", "Atendimento");

  const footerList = document.querySelector(".footer-nav ul");
  if (footerList && !footerList.querySelector(`a[href="${COVERAGE.national.href}"]`)) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = COVERAGE.national.href;
    link.textContent = "Atendimento no Brasil";
    item.appendChild(link);
    footerList.appendChild(item);
  }
}

function installCoverageStructuredData() {
  const schemaId = "national-coverage-schema";
  if (document.getElementById(schemaId)) return;

  const schema = document.createElement("script");
  schema.id = schemaId;
  schema.type = "application/ld+json";
  schema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://natanaelalbinofestas.com/#decoracao-no-brasil",
    name: "Decoração autoral de festas no Brasil",
    serviceType: "Decoração de festas, cenografia e composições com balões",
    url: "https://natanaelalbinofestas.com/decoracao-de-festas-no-brasil/",
    provider: {
      "@id": "https://natanaelalbinofestas.com/#organization",
    },
    areaServed: {
      "@type": "Country",
      name: "Brasil",
    },
  });

  document.head.appendChild(schema);
}

installCoverageSection();
installCoverageNavigation();
installCoverageStructuredData();

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 },
  );

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const courseTitle = document.querySelector(".course-title-main");
const courseBalloon = document.querySelector(".course-floating-balloon");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (courseTitle && courseBalloon && !prefersReducedMotion) {
  let hasBalloonStarted = false;

  const startBalloonAnimation = () => {
    if (hasBalloonStarted) return;

    hasBalloonStarted = true;
    courseBalloon.classList.add("is-rising");
    courseBalloon.addEventListener("animationend", () => courseBalloon.remove(), {
      once: true,
    });
  };

  if ("IntersectionObserver" in window) {
    const balloonObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        balloonObserver.disconnect();
        startBalloonAnimation();
      },
      {
        rootMargin: "0px 0px -88% 0px",
        threshold: 0,
      },
    );

    balloonObserver.observe(courseTitle);
  } else {
    const checkCourseTitlePosition = () => {
      const titlePosition = courseTitle.getBoundingClientRect();
      const topTriggerZone = window.innerHeight * 0.12;

      if (titlePosition.top > topTriggerZone || titlePosition.bottom <= 0) return;

      window.removeEventListener("scroll", checkCourseTitlePosition);
      window.removeEventListener("resize", checkCourseTitlePosition);
      startBalloonAnimation();
    };

    window.addEventListener("scroll", checkCourseTitlePosition, { passive: true });
    window.addEventListener("resize", checkCourseTitlePosition);
    checkCourseTitlePosition();
  }
}

function installWhatsappFloat() {
  if (document.getElementById("natanael-whatsapp-float")) return;

  const whatsappNumber = "5534998669757";
  const whatsappMessage = "Olá! Vim pelo site Natanael Albino Festas e gostaria de conversar sobre uma festa.";
  const whatsappUrl =
    "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(whatsappMessage);

  const floatingWhatsapp = document.createElement("a");
  floatingWhatsapp.id = "natanael-whatsapp-float";
  floatingWhatsapp.className = "whatsapp-float";
  floatingWhatsapp.href = whatsappUrl;
  floatingWhatsapp.target = "_blank";
  floatingWhatsapp.rel = "noopener noreferrer";
  floatingWhatsapp.setAttribute("aria-label", "Falar com Natanael Albino Festas pelo WhatsApp");
  floatingWhatsapp.dataset.analyticsEvent = "generate_lead";
  floatingWhatsapp.dataset.analyticsMethod = "whatsapp";
  floatingWhatsapp.dataset.analyticsLocation = "whatsapp_float";
  floatingWhatsapp.innerHTML = `
    <svg class="whatsapp-float-icon" viewBox="0 0 32 32" aria-hidden="true">
      <path fill="currentColor" d="M16.04 3C9.42 3 4.05 8.25 4.05 14.73c0 2.28.67 4.51 1.94 6.41L4 28.2l7.32-1.91a12.13 12.13 0 0 0 4.71.94h.01c6.61 0 12-5.26 12-11.73C28.04 9 22.65 3 16.04 3Zm0 21.91h-.01a9.86 9.86 0 0 1-4.99-1.35l-.36-.21-4.34 1.13 1.16-4.13-.24-.38a9.38 9.38 0 0 1-1.5-5.24c0-5.21 4.6-9.45 10.27-9.45 5.66 0 10.27 4.24 10.27 9.45 0 5.22-4.61 10.18-10.26 10.18Zm5.63-7.08c-.31-.15-1.82-.88-2.1-.98-.28-.1-.49-.15-.69.15-.2.3-.8.98-.98 1.18-.18.2-.36.22-.67.07-.31-.15-1.3-.47-2.48-1.49-.92-.8-1.53-1.79-1.71-2.09-.18-.3-.02-.46.13-.61.14-.13.31-.35.46-.53.15-.18.2-.3.31-.5.1-.2.05-.38-.03-.53-.08-.15-.69-1.63-.95-2.23-.25-.6-.5-.52-.69-.53h-.59c-.2 0-.54.08-.82.38-.28.3-1.08 1.03-1.08 2.51 0 1.48 1.1 2.91 1.25 3.11.15.2 2.16 3.24 5.23 4.54.73.31 1.3.49 1.75.63.73.23 1.4.2 1.93.12.59-.09 1.82-.73 2.08-1.43.26-.7.26-1.3.18-1.43-.08-.13-.28-.2-.59-.35Z"/>
    </svg>
    <span>Fale no WhatsApp</span>
  `;

  document.body.appendChild(floatingWhatsapp);
}

function scheduleAfterLoad(callback, timeout = 1500) {
  const schedule = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(callback, { timeout });
      return;
    }

    window.setTimeout(callback, 0);
  };

  if (document.readyState === "complete") {
    schedule();
  } else {
    window.addEventListener("load", schedule, { once: true });
  }
}

// O CTA flutuante é redundante no primeiro viewport: cabeçalho e hero já oferecem WhatsApp.
// Adiá-lo evita injeção de CSS/DOM durante o caminho crítico de renderização.
scheduleAfterLoad(installWhatsappFloat, 1200);

if ("serviceWorker" in navigator && window.isSecureContext) {
  scheduleAfterLoad(() => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Cache progressivo é uma melhoria opcional; falhas não podem afetar a navegação.
    });
  }, 2500);
}

const PROJECT_CASES = Object.freeze([
  { href: "/projetos/festa-patinhos/", label: "Ver case completo" },
  { href: "/projetos/festa-construcao/", label: "Ver case completo" },
  { href: "/projetos/festa-arco-iris/", label: "Ver case completo" },
]);

function installProjectCaseLinks() {
  const projectStories = document.querySelectorAll("#projetos .essence-story");

  PROJECT_CASES.forEach((projectCase, index) => {
    const story = projectStories[index];
    if (!story) return;

    const captionCopy = story.querySelector("figcaption > div");
    if (!captionCopy || captionCopy.querySelector(`a[href="${projectCase.href}"]`)) return;

    const actions = document.createElement("div");
    actions.className = "intent-actions";

    const link = document.createElement("a");
    link.className = "intent-primary";
    link.href = projectCase.href;
    link.textContent = projectCase.label;

    actions.appendChild(link);
    captionCopy.appendChild(actions);
  });

  const footerList = document.querySelector(".footer-nav ul");
  if (footerList && !footerList.querySelector('a[href="/projetos/"]')) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = "/projetos/";
    link.textContent = "Cases de projetos";
    item.appendChild(link);
    footerList.appendChild(item);
  }
}

installProjectCaseLinks();