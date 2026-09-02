(() => {
  const measurementId = document
    .querySelector('meta[name="google-analytics-id"]')
    ?.content.trim();

  if (!measurementId || !/^G-[A-Z0-9]+$/i.test(measurementId)) return;

  const consentKey = "na_analytics_consent";
  const courseItem = {
    item_id: "H101630859P",
    item_name: "Método Orgânico Natanael Albino",
    item_category: "Curso on-line",
    quantity: 1,
  };

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });

  const readStoredConsent = () => {
    try {
      return window.localStorage.getItem(consentKey);
    } catch {
      return null;
    }
  };

  let currentConsent = readStoredConsent();

  const saveConsent = (value) => {
    currentConsent = value;

    try {
      window.localStorage.setItem(consentKey, value);
    } catch {
      // A escolha continua válida durante a página atual.
    }
  };

  const deleteAnalyticsCookies = () => {
    const hostname = window.location.hostname;
    const cookieDomain = hostname.split(".").length > 1 ? `.${hostname}` : hostname;

    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (!name.startsWith("_ga")) return;

      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${cookieDomain}; SameSite=Lax`;
    });
  };

  let analyticsLoaded = false;
  let googleTagRequested = false;
  let trackingInitialized = false;

  const trackEvent = (eventName, parameters = {}) => {
    if (!analyticsLoaded || currentConsent !== "granted") return;
    window.gtag("event", eventName, parameters);
  };

  const initializeConversionTracking = () => {
    if (trackingInitialized) return;
    trackingInitialized = true;

    document.querySelectorAll("[data-analytics-event]").forEach((link) => {
      link.addEventListener("click", () => {
        const eventName = link.dataset.analyticsEvent;
        const commonParameters = {
          cta_location: link.dataset.analyticsLocation || "unknown",
          link_url: link.href,
        };

        if (eventName === "generate_lead") {
          trackEvent("generate_lead", {
            ...commonParameters,
            method: link.dataset.analyticsMethod || "website",
          });
          return;
        }

        if (eventName === "begin_checkout") {
          trackEvent("begin_checkout", {
            ...commonParameters,
            items: [courseItem],
          });
        }
      });
    });

    const courseSection = document.querySelector("#curso");

    if (courseSection && "IntersectionObserver" in window) {
      const courseObserver = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;

          trackEvent("view_item", {
            item_list_name: "Landing page",
            items: [courseItem],
          });
          courseObserver.disconnect();
        },
        { threshold: 0.3 },
      );

      courseObserver.observe(courseSection);
    }

    const reachedDepths = new Set();
    const depthMilestones = [25, 50, 75, 90];

    const measureScrollDepth = () => {
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const currentDepth = Math.round((window.scrollY / scrollableHeight) * 100);

      depthMilestones.forEach((milestone) => {
        if (currentDepth < milestone || reachedDepths.has(milestone)) return;

        reachedDepths.add(milestone);
        trackEvent("scroll_depth", { percent_scrolled: milestone });
      });
    };

    window.addEventListener("scroll", measureScrollDepth, { passive: true });
    measureScrollDepth();
  };

  const appendGoogleTag = () => {
    if (googleTagRequested || currentConsent !== "granted") return;

    googleTagRequested = true;

    const googleTag = document.createElement("script");
    googleTag.async = true;
    googleTag.fetchPriority = "low";
    googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      measurementId,
    )}`;
    document.head.appendChild(googleTag);
  };

  const scheduleGoogleTag = () => {
    const schedule = () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(appendGoogleTag, { timeout: 3000 });
        return;
      }

      window.setTimeout(appendGoogleTag, 0);
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }
  };

  const loadAnalytics = () => {
    if (analyticsLoaded) return;

    analyticsLoaded = true;

    // Os comandos entram na fila imediatamente, mas o script de terceiros só é
    // baixado após o carregamento crítico da página.
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    initializeConversionTracking();
    scheduleGoogleTag();
  };

  const updateConsent = (value) => {
    saveConsent(value);
    window.gtag("consent", "update", {
      analytics_storage: value,
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });

    if (value === "granted") {
      loadAnalytics();
    } else {
      deleteAnalyticsCookies();
    }
  };

  const removeConsentBanner = () => {
    const banner = document.querySelector("[data-consent-banner]");
    if (!banner) return;

    banner.classList.remove("is-visible");
    window.setTimeout(() => banner.remove(), 220);
  };

  const showConsentBanner = () => {
    removeConsentBanner();

    const banner = document.createElement("aside");
    banner.className = "consent-banner";
    banner.dataset.consentBanner = "";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-labelledby", "consent-title");
    banner.setAttribute("aria-describedby", "consent-description");
    banner.innerHTML = `
      <div class="consent-copy">
        <strong id="consent-title">Medição e privacidade</strong>
        <p id="consent-description">
          Podemos usar cookies de análise para entender visitas e cliques e melhorar esta página.
          Dados para publicidade permanecem desativados.
        </p>
      </div>
      <div class="consent-actions">
        <button type="button" class="consent-button consent-button-secondary" data-consent-choice="denied">
          Agora não
        </button>
        <button type="button" class="consent-button consent-button-primary" data-consent-choice="granted">
          Aceitar cookies
        </button>
      </div>
    `;

    banner.querySelectorAll("[data-consent-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        updateConsent(button.dataset.consentChoice);
        removeConsentBanner();
      });
    });

    document.body.appendChild(banner);
    window.requestAnimationFrame(() => banner.classList.add("is-visible"));
  };

  const privacySettings = document.querySelector("[data-analytics-settings]");

  if (privacySettings) {
    privacySettings.hidden = false;
    privacySettings.addEventListener("click", showConsentBanner);
  }

  const savedConsent = currentConsent;

  if (savedConsent === "granted") {
    updateConsent("granted");
  } else if (savedConsent === "denied") {
    updateConsent("denied");
  } else {
    showConsentBanner();
  }
})();
