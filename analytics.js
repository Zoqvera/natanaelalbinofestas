(() => {
  "use strict";

  const measurementId = document
    .querySelector('meta[name="google-analytics-id"]')
    ?.content.trim();

  if (!measurementId || !/^G-[A-Z0-9]+$/i.test(measurementId)) return;

  const consentKey = "na_analytics_consent";
  const visitorKey = "na_analytics_visitor_v1";
  const sessionKey = "na_analytics_session_v1";
  const firstTouchKey = "na_analytics_first_touch_v1";
  const acquisitionEndpoint =
    "https://wnigzpvgsbpjdxvjzugt.supabase.co/functions/v1/natanael-analytics-event";

  const courseItem = {
    item_id: "H101630859P",
    item_name: "Método Orgânico Natanael Albino",
    item_category: "Curso on-line",
    quantity: 1,
  };

  const aiSources = [
    { pattern: /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/, assistant: "chatgpt" },
    { pattern: /(^|\.)perplexity\.ai$/, assistant: "perplexity" },
    { pattern: /(^|\.)gemini\.google\.com$/, assistant: "gemini" },
    { pattern: /(^|\.)claude\.ai$/, assistant: "claude" },
    { pattern: /(^|\.)copilot\.microsoft\.com$|(^|\.)copilot\.cloud\.microsoft$/, assistant: "copilot" },
  ];

  const socialHosts = /(^|\.)(instagram\.com|facebook\.com|fb\.com|tiktok\.com|linkedin\.com|youtube\.com|youtu\.be)$/;
  const searchHosts = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.yahoo\.com)$/;

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

  const safeStorageGet = (storage, key) => {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  };

  const safeStorageSet = (storage, key, value) => {
    try {
      storage.setItem(key, value);
    } catch {
      // Analytics remains functional for the current page without persistence.
    }
  };

  const createUuid = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();

    const bytes = new Uint8Array(16);
    window.crypto?.getRandomValues?.(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };

  const getOrCreateId = (storage, key) => {
    const existing = safeStorageGet(storage, key);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;

    const created = createUuid();
    safeStorageSet(storage, key, created);
    return created;
  };

  const cleanText = (value, maxLength = 120) =>
    String(value ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);

  const referrerHost = () => {
    if (!document.referrer) return "";
    try {
      return new URL(document.referrer).hostname.toLowerCase();
    } catch {
      return "";
    }
  };

  const identifyAiAssistant = (source, host) => {
    const candidates = [source, host].filter(Boolean);
    for (const candidate of candidates) {
      const normalized = candidate.toLowerCase();
      const matched = aiSources.find(({ pattern }) => pattern.test(normalized));
      if (matched) return matched.assistant;
      if (/chatgpt|openai/.test(normalized)) return "chatgpt";
      if (/perplexity/.test(normalized)) return "perplexity";
      if (/gemini/.test(normalized)) return "gemini";
      if (/claude|anthropic/.test(normalized)) return "claude";
      if (/copilot/.test(normalized)) return "copilot";
    }
    return null;
  };

  const classifyTraffic = ({ source, medium, refHost, aiAssistant, hasUtm }) => {
    if (aiAssistant) return "ai_assistant";
    if (/cpc|ppc|paid|ads?/i.test(medium)) return "paid_search";
    if (hasUtm) return "campaign";
    if (socialHosts.test(refHost) || /instagram|facebook|tiktok|linkedin|youtube/i.test(source)) return "social";
    if (searchHosts.test(refHost) || /google|bing|duckduckgo|yahoo/i.test(source)) return "organic_search";
    if (source === "direct") return "direct";
    return "referral";
  };

  const captureAcquisition = () => {
    const params = new URLSearchParams(window.location.search || "");
    const refHost = referrerHost();
    const hasUtm = params.has("utm_source");
    let source = cleanText(params.get("utm_source"), 80).toLowerCase();
    let medium = cleanText(params.get("utm_medium"), 80).toLowerCase();

    if (!source) {
      if (refHost && refHost !== window.location.hostname.toLowerCase()) {
        source = refHost;
        medium = medium || "referral";
      } else {
        source = "direct";
        medium = medium || "none";
      }
    }

    const aiAssistant = identifyAiAssistant(source, refHost);
    const current = {
      source,
      medium: medium || "unknown",
      campaign: cleanText(params.get("utm_campaign"), 100) || "not_set",
      traffic_channel: classifyTraffic({ source, medium, refHost, aiAssistant, hasUtm }),
      ai_assistant: aiAssistant,
      landing_page: window.location.pathname || "/",
    };

    const savedFirstTouch = safeStorageGet(window.localStorage, firstTouchKey);
    if (savedFirstTouch) {
      try {
        return { ...current, first_touch: JSON.parse(savedFirstTouch) };
      } catch {
        // Replace malformed local state below.
      }
    }

    safeStorageSet(window.localStorage, firstTouchKey, JSON.stringify(current));
    return { ...current, first_touch: current };
  };

  const readStoredConsent = () => safeStorageGet(window.localStorage, consentKey);
  let currentConsent = readStoredConsent();
  let pageViewSent = false;

  const saveConsent = (value) => {
    currentConsent = value;
    safeStorageSet(window.localStorage, consentKey, value);
  };

  const sendAcquisitionEvent = (eventName, parameters = {}) => {
    if (currentConsent !== "granted") return;
    if (!["page_view", "generate_lead", "begin_checkout"].includes(eventName)) return;

    const acquisition = captureAcquisition();
    const visitorId = getOrCreateId(window.localStorage, visitorKey);
    const sessionId = getOrCreateId(window.sessionStorage, sessionKey);
    const eventId = createUuid();

    const payload = {
      event_id: eventId,
      event_name: eventName,
      visitor_id: visitorId,
      session_id: sessionId,
      source: acquisition.source,
      medium: acquisition.medium,
      campaign: acquisition.campaign,
      traffic_channel: acquisition.traffic_channel,
      ai_assistant: acquisition.ai_assistant,
      page_path: window.location.pathname || "/",
      landing_page: acquisition.first_touch?.landing_page || acquisition.landing_page || "/",
      cta_location: cleanText(parameters.cta_location, 80) || null,
      cta_label: cleanText(parameters.cta_label, 120) || null,
      cta_method: cleanText(parameters.method, 50) || null,
      occurred_at: new Date().toISOString(),
    };

    fetch(acquisitionEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: "omit",
      referrerPolicy: "strict-origin-when-cross-origin",
    }).catch(() => {
      // First-party reporting must never block navigation or user actions.
    });
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
    sendAcquisitionEvent(eventName, parameters);
  };

  const initializeConversionTracking = () => {
    if (trackingInitialized) return;
    trackingInitialized = true;

    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest("[data-analytics-event]");
      if (!link) return;

      const eventName = link.dataset.analyticsEvent;
      const commonParameters = {
        cta_location: link.dataset.analyticsLocation || "unknown",
        cta_label: cleanText(link.textContent, 120) || "CTA sem rótulo",
        link_url: link.href,
      };

      if (eventName === "generate_lead") {
        trackEvent("generate_lead", {
          ...commonParameters,
          method: link.dataset.analyticsMethod || "whatsapp",
        });
        return;
      }

      if (eventName === "begin_checkout") {
        trackEvent("begin_checkout", {
          ...commonParameters,
          method: "hotmart",
          items: [courseItem],
        });
      }
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
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
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
    googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
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

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
  };

  const loadAnalytics = () => {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    initializeConversionTracking();
    scheduleGoogleTag();

    if (!pageViewSent) {
      pageViewSent = true;
      sendAcquisitionEvent("page_view");
    }
  };

  const updateConsent = (value) => {
    saveConsent(value);
    window.gtag("consent", "update", {
      analytics_storage: value,
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });

    if (value === "granted") loadAnalytics();
    else deleteAnalyticsCookies();
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
  if (savedConsent === "granted") updateConsent("granted");
  else if (savedConsent === "denied") updateConsent("denied");
  else showConsentBanner();
})();
