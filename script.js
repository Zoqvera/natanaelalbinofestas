const designSystemStylesheet = document.createElement("link");
designSystemStylesheet.rel = "stylesheet";
designSystemStylesheet.href = "design-system.css";
document.head.appendChild(designSystemStylesheet);

const headerHeroStylesheet = document.createElement("link");
headerHeroStylesheet.rel = "stylesheet";
headerHeroStylesheet.href = "header-hero.css";
document.head.appendChild(headerHeroStylesheet);

const trustFooterStylesheet = document.createElement("link");
trustFooterStylesheet.rel = "stylesheet";
trustFooterStylesheet.href = "trust-footer.css";
document.head.appendChild(trustFooterStylesheet);

const year = document.querySelector("[data-year]");

if (year) year.textContent = String(new Date().getFullYear());

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

  const floatingWhatsappStyles = document.createElement("style");
  floatingWhatsappStyles.id = "natanael-whatsapp-float-styles";
  floatingWhatsappStyles.textContent = `
    .whatsapp-float {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 999;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-height: 54px;
      padding: 0 18px 0 14px;
      border-radius: 999px;
      background: #25d366;
      color: #07140c;
      font-family: var(--sans, "Manrope", Arial, Helvetica, sans-serif);
      font-size: 14px;
      font-weight: 800;
      line-height: 1;
      text-decoration: none;
      box-shadow: 0 14px 35px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255,255,255,0.12) inset;
      transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
    }

    .whatsapp-float:hover {
      transform: translateY(-3px);
      background: #2ee06f;
      box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34), 0 0 0 1px rgba(255,255,255,0.16) inset;
    }

    .whatsapp-float:focus-visible {
      outline: 3px solid #ffffff;
      outline-offset: 3px;
    }

    .whatsapp-float-icon {
      width: 26px;
      height: 26px;
      flex: 0 0 auto;
    }

    @media (max-width: 640px) {
      .whatsapp-float {
        right: 16px;
        bottom: 16px;
        width: 56px;
        height: 56px;
        min-height: 56px;
        padding: 0;
        justify-content: center;
      }

      .whatsapp-float span {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .whatsapp-float-icon {
        width: 29px;
        height: 29px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .whatsapp-float {
        transition: none;
      }
    }
  `;

  document.head.appendChild(floatingWhatsappStyles);
  document.body.appendChild(floatingWhatsapp);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", installWhatsappFloat, { once: true });
} else {
  installWhatsappFloat();
}
