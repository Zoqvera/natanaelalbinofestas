(() => {
  "use strict";

  const measurementId = document
    .querySelector('meta[name="google-analytics-id"]')
    ?.content.trim();

  if (!measurementId || !/^G-[A-Z0-9]+$/i.test(measurementId)) return;

  const CONSENT_KEY = "na_analytics_consent";
  const VISITOR_KEY = "na_analytics_visitor_v1";
  const SESSION_KEY = "na_analytics_session_v1";
  const FIRST_TOUCH_KEY = "na_analytics_first_touch_v1";
  const ACQUISITION_ENDPOINT =
    "https://wnigzpvgsbpjdxvjzugt.supabase.co/functions/v1/natanael-analytics-event";
  const WHATSAPP_HOSTS = new Set(["wa.me", "api.whatsapp.com", "web.whatsapp.com"]);
  const HOTMART_HOSTS = new Set(["pay.hotmart.com"]);
  const SCROLL_MILESTONES = Object.freeze([25, 50, 75, 90]);
  const COURSE_ITEM = Object.freeze({
    item_id: "H101630859P",
    item_name: "Método Orgânico Natanael Albino",
    item_category: "Curso on-line",
    quantity: 1,
  });
  const FIRST_PARTY_EVENTS = new Set(["page_view", "generate_lead", "begin_checkout"]);
  const AI_SOURCE_PATTERNS = Object.freeze([
    { pattern: /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/, assistant: "chatgpt" },
    { pattern: /(^|\.)perplexity\.ai$/, assistant: "perplexity" },
    { pattern: /(^|\.)gemini\.google\.com$/, assistant: "gemini" },
    { pattern: /(^|\.)claude\.ai$/, assistant: "claude" },
    { pattern: /(^|\.)copilot\.microsoft\.com$|(^|\.)copilot\.cloud\.microsoft$/, assistant: "copilot" },
  ]);
  const SOCIAL_HOST_PATTERN = /(^|\.)(instagram\.com|facebook\.com|fb\.com|tiktok\.com|linkedin\.com|youtube\.com|youtu\.be)$/;
  const SEARCH_HOST_PATTERN = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.yahoo\.com)$/;

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

  function readStorage(key) {
    return readFromStorage(window.localStorage, key);
  }

  function writeStorage(key, value) {
    writeToStorage(window.localStorage, key, value);
  }

  function readFromStorage(storage, key) {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeToStorage(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch {
      // Analytics remains functional for the current page if storage is blocked.
    }
  }

  function createUuid() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();

    const bytes = new Uint8Array(16);
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function getOrCreateId(storage, key) {
    const existing = readFromStorage(storage, key);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;

    const created = createUuid();
    writeToStorage(storage, key, created);
    return created;
  }

  function cleanText(value, maxLength = 120) {
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  }

  function getReferrerHost() {
    if (!document.referrer) return "";

    try {
      return new URL(document.referrer).hostname.toLowerCase();
    } catch {
      return "";
    }
  }

  function identifyAiAssistant(source, referrerHost) {
    const candidates = [source, referrerHost].filter(Boolean);

    for (const candidate of candidates) {
      const normalized = candidate.toLowerCase();
      const matched = AI_SOURCE_PATTERNS.find(({ pattern }) => pattern.test(normalized));
      if (matched) return matched.assistant;
      if (/chatgpt|openai/.test(normalized)) return "chatgpt";
      if (/perplexity/.test(normalized)) return "perplexity";
      if (/gemini/.test(normalized)) return "gemini";
      if (/claude|anthropic/.test(normalized)) return "claude";
      if (/copilot/.test(normalized)) return "copilot";
    }

    return null;
  }

  function classifyTraffic({ source, medium, referrerHost, aiAssistant, hasUtm }) {
    if (aiAssistant) return "ai_assistant";
    if (/cpc|ppc|paid|ads?/i.test(medium)) return "paid_search";
    if (hasUtm) return "campaign";
    if (SOCIAL_HOST_PATTERN.test(referrerHost) || /instagram|facebook|tiktok|linkedin|youtube/i.test(source)) {
      return "social";
    }
    if (SEARCH_HOST_PATTERN.test(referrerHost) || /google|bing|duckduckgo|yahoo/i.test(source)) {
      return "organic_search";
    }
    if (source === "direct") return "direct";
    return "referral";
  }

  function buildCurrentAcquisition() {
    const params = new URLSearchParams(window.location.search || "");
    const referrerHost = getReferrerHost();
    const hasUtm = params.has("utm_source");
    let source = cleanText(params.get("utm_source"), 80).toLowerCase();
    let medium = cleanText(params.get("utm_medium"), 80).toLowerCase();

    if (!source) {
      if (referrerHost && referrerHost !== window.location.hostname.toLowerCase()) {
        source = referrerHost;
        medium = medium || "referral";
      } else {
        source = "direct";
        medium = medium || "none";
      }
    }

    const aiAssistant = identifyAiAssistant(source, referrerHost);

    return {
      source,
      medium: medium || "unknown",
      campaign: cleanText(params.get("utm_campaign"), 100) || "not_set",
      traffic_channel: classifyTraffic({ source, medium, referrerHost, aiAssistant, hasUtm }),
      ai_assistant: aiAssistant,
      landing_page: window.location.pathname || "/",
    };
  }

  function getAcquisitionContext() {
    const current = buildCurrentAcquisition();
    const stored = readStorage(FIRST_TOUCH_KEY);

    if (stored) {
      try {
        const firstTouch = JSON.parse(stored);
        if (firstTouch && typeof firstTouch === "object") {
          return { current, firstTouch };
        }
      } catch {
        // Invalid local state is replaced below.
      }
    }

    writeStorage(FIRST_TOUCH_KEY, JSON.stringify(current));
    return { current, firstTouch: current };
  }

  function sendFirstPartyEvent(eventName, parameters = {}) {
    if (currentConsent !== "granted" || !FIRST_PARTY_EVENTS.has(eventName)) return;

    const { current, firstTouch } = getAcquisitionContext();
    const payload = {
      event_id: createUuid(),
      event_name: eventName,
      visitor_id: getOrCreateId(window.localStorage, VISITOR_KEY),
      session_id: getOrCreateId(window.sessionStorage, SESSION_KEY),
      source: current.source,
      medium: current.medium,
      campaign: current.campaign,
      traffic_channel: current.traffic_channel,
      ai_assistant: current.ai_assistant,
      page_path: window.location.pathname || "/",
      landing_page: firstTouch?.landing_page || current.landing_page || "/",
      cta_location: cleanText(parameters.cta_location, 80) || null,
      cta_label: cleanText(parameters.link_text || parameters.cta_label, 120) || null,
      cta_method:
        cleanText(parameters.method, 50) ||
        (eventName === "begin_checkout" ? "hotmart" : eventName === "generate_lead" ? "whatsapp" : null),
      occurred_at: new Date().toISOString(),
    };

    fetch(ACQUISITION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: "omit",
      referrerPolicy: "strict-origin-when-cross-origin",
    }).catch(() => {
      // First-party reporting must never block navigation or user actions.
    });
  }

  let currentConsent = readStorage(CONSENT_KEY);
  let analyticsLoaded = false;
  let googleTagRequested = false;
  let trackingInitialized = false;
  let firstPartyPageViewSent = false;

  function setConsent(value) {
    currentConsent = value;
    writeStorage(CONSENT_KEY, value);
  }

  function deleteAnalyticsCookies() {
    const hostname = window.location.hostname;
    const cookieDomain = hostname.split(".").length > 1 ? `.${hostname}` : hostname;

    document.cookie.split(";").forEach((cookie) => {
      const cookieName = cookie.split("=")[0].trim();
      if (!cookieName.startsWith("_ga")) return;

      document.cookie = `${cookieName}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${cookieName}=; Max-Age=0; path=/; domain=${cookieDomain}; SameSite=Lax`;
    });
  }

  function trackEvent(eventName, parameters = {}) {
    if (!analyticsLoaded || currentConsent !== "granted") return;
    window.gtag("event", eventName, parameters);
    sendFirstPartyEvent(eventName, parameters);
  }

  function getPageContext() {
    return {
      page_path: window.location.pathname,
      page_title: document.title,
    };
  }

  function getLinkLocation(link) {
    if (link.dataset.analyticsLocation) return link.dataset.analyticsLocation;

    const semanticContainer = link.closest("header, main, section, article, footer, nav");
    if (!semanticContainer) return "unknown";

    if (semanticContainer.id) return semanticContainer.id;
    if (semanticContainer.matches("header")) return "header";
    if (semanticContainer.matches("footer")) return "footer";
    if (semanticContainer.matches("nav")) return "navigation";

    return semanticContainer.classList[0] || "content";
  }

  function getLinkParameters(link) {
    const url = new URL(link.href, window.location.href);

    return {
      ...getPageContext(),
      cta_location: getLinkLocation(link),
      link_domain: url.hostname,
      link_url: url.href,
      link_text: link.textContent.trim().slice(0, 100),
    };
  }

  function trackWhatsappClick(link) {
    const parameters = {
      ...getLinkParameters(link),
      method: "whatsapp",
    };

    trackEvent("whatsapp_click", parameters);
    trackEvent("generate_lead", parameters);
  }

  function trackCheckoutStart(link) {
    trackEvent("begin_checkout", {
      ...getLinkParameters(link),
      method: "hotmart",
      currency: "BRL",
      items: [COURSE_ITEM],
    });
  }

  function handleTrackedLinkClick(event) {
    const target = event.target instanceof Element ? event.target : null;
    const link = target?.closest("a[href]");
    if (!(link instanceof HTMLAnchorElement)) return;

    const url = new URL(link.href, window.location.href);
    const explicitEvent = link.dataset.analyticsEvent;

    if (explicitEvent === "generate_lead" || WHATSAPP_HOSTS.has(url.hostname)) {
      trackWhatsappClick(link);
      return;
    }

    if (explicitEvent === "begin_checkout" || HOTMART_HOSTS.has(url.hostname)) {
      trackCheckoutStart(link);
      return;
    }

    if (!explicitEvent) return;

    trackEvent(explicitEvent, {
      ...getLinkParameters(link),
      method: link.dataset.analyticsMethod || "website",
    });
  }

  function installCourseTracking() {
    const courseSection = document.querySelector("#curso");
    if (!courseSection || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        trackEvent("view_item", {
          ...getPageContext(),
          item_list_name: "Landing page",
          items: [COURSE_ITEM],
        });
        observer.disconnect();
      },
      { threshold: 0.3 },
    );

    observer.observe(courseSection);
  }

  function installScrollTracking() {
    const reachedDepths = new Set();

    function measureScrollDepth() {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const currentDepth = Math.round((window.scrollY / scrollableHeight) * 100);

      SCROLL_MILESTONES.forEach((milestone) => {
        if (currentDepth < milestone || reachedDepths.has(milestone)) return;

        reachedDepths.add(milestone);
        trackEvent("scroll_depth", {
          ...getPageContext(),
          percent_scrolled: milestone,
        });
      });
    }

    window.addEventListener("scroll", measureScrollDepth, { passive: true });
    measureScrollDepth();
  }

  function getFormParameters(form) {
    return {
      ...getPageContext(),
      form_id: form.id || "not_set",
      form_name: form.getAttribute("name") || form.dataset.analyticsForm || "not_set",
      form_destination: form.action || window.location.href,
      form_type: form.dataset.analyticsForm || "generic",
    };
  }

  function installFormTracking() {
    const forms = Array.from(document.querySelectorAll("form[data-analytics-form]"));
    if (forms.length === 0) return;

    const formStates = new Map();

    forms.forEach((form) => {
      const state = { started: false, submitted: false };
      formStates.set(form, state);

      const markStarted = () => {
        if (state.started) return;
        state.started = true;
        trackEvent("form_start", getFormParameters(form));
      };

      form.addEventListener("focusin", markStarted, { once: true });
      form.addEventListener("input", markStarted, { once: true });
      form.addEventListener("submit", () => {
        markStarted();
        state.submitted = true;
        trackEvent("form_submit", getFormParameters(form));
      });
    });

    window.addEventListener("pagehide", () => {
      formStates.forEach((state, form) => {
        if (!state.started || state.submitted) return;
        trackEvent("form_abandonment", getFormParameters(form));
      });
    });
  }

  function installConversionTracking() {
    if (trackingInitialized) return;
    trackingInitialized = true;

    document.addEventListener("click", handleTrackedLinkClick);
    installCourseTracking();
    installScrollTracking();
    installFormTracking();
  }

  function appendGoogleTag() {
    if (googleTagRequested || currentConsent !== "granted") return;
    googleTagRequested = true;

    const googleTag = document.createElement("script");
    googleTag.async = true;
    googleTag.fetchPriority = "low";
    googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(googleTag);
  }

  function scheduleGoogleTag() {
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
  }

  function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    installConversionTracking();
    scheduleGoogleTag();

    if (!firstPartyPageViewSent) {
      firstPartyPageViewSent = true;
      sendFirstPartyEvent("page_view", getPageContext());
    }
  }

  function updateConsent(value) {
    setConsent(value);
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
  }

  function removeConsentBanner() {
    const banner = document.querySelector("[data-consent-banner]");
    if (!banner) return;

    banner.classList.remove("is-visible");
    window.setTimeout(() => banner.remove(), 220);
  }

  function showConsentBanner() {
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
          Podemos usar cookies de análise para entender visitas e cliques e melhorar este site.
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
      <p class="consent-disclosure">
        Com o seu consentimento, também registramos de forma anônima a origem da visita e quais CTAs foram acionados para medir o desempenho do site.
      </p>
    `;

    banner.querySelectorAll("[data-consent-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        updateConsent(button.dataset.consentChoice);
        removeConsentBanner();
      });
    });

    document.body.appendChild(banner);
    window.requestAnimationFrame(() => banner.classList.add("is-visible"));
  }

  function installPrivacySettingsControl() {
    let privacySettings = document.querySelector("[data-analytics-settings]");

    if (!privacySettings) {
      const footer = document.querySelector("footer");
      if (!footer) return;

      privacySettings = document.createElement("button");
      privacySettings.type = "button";
      privacySettings.className = "analytics-settings-link";
      privacySettings.dataset.analyticsSettings = "";
      privacySettings.textContent = "Preferências de privacidade";
      footer.appendChild(privacySettings);
    }

    privacySettings.hidden = false;
    privacySettings.addEventListener("click", showConsentBanner);
  }

  function trackConfirmedSignup(method = "website") {
    trackEvent("sign_up", {
      ...getPageContext(),
      method,
    });
  }

  function trackConfirmedPurchase({ transactionId, value, currency = "BRL", items = [COURSE_ITEM] } = {}) {
    const numericValue = Number(value);
    if (!transactionId || !Number.isFinite(numericValue) || numericValue < 0) return false;

    trackEvent("purchase", {
      ...getPageContext(),
      transaction_id: String(transactionId),
      value: numericValue,
      currency,
      items,
    });

    return true;
  }

  window.NatanaelAnalytics = Object.freeze({
    trackConfirmedSignup,
    trackConfirmedPurchase,
  });

  installPrivacySettingsControl();

  if (currentConsent === "granted") {
    updateConsent("granted");
  } else if (currentConsent === "denied") {
    updateConsent("denied");
  } else {
    showConsentBanner();
  }
})();
