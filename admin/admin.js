(() => {
  "use strict";

  const SUPABASE_URL = "https://wnigzpvgsbpjdxvjzugt.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_AgO2eC8i01Fg2DS-WfV2bg_Py6g6ZuX";
  const TIME_ZONE = "America/Sao_Paulo";

  const byId = (id) => document.getElementById(id);
  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });

  const elements = {
    status: byId("pageStatus"),
    loginPanel: byId("loginPanel"),
    loginButton: byId("loginButton"),
    emailInput: byId("emailInput"),
    passwordInput: byId("passwordInput"),
    logoutButton: byId("logoutButton"),
    dashboard: byId("dashboard"),
    periodFilter: byId("periodFilter"),
    refreshButton: byId("refreshButton"),
  };

  const numberValue = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatNumber = (value) => numberValue(value).toLocaleString("pt-BR");
  const formatPercent = (value) =>
    `${numberValue(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(`${value}T12:00:00Z`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: TIME_ZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const sourceLabel = (value) => {
    const labels = {
      direct: "Acesso direto",
      google: "Google",
      bing: "Bing",
      instagram: "Instagram",
      facebook: "Facebook",
      chatgpt: "ChatGPT",
      perplexity: "Perplexity",
      gemini: "Gemini",
      claude: "Claude",
      copilot: "Microsoft Copilot",
    };
    const raw = String(value || "direct").toLowerCase();
    if (labels[raw]) return labels[raw];
    if (raw.includes("google.")) return "Google";
    if (raw.includes("instagram.")) return "Instagram";
    if (raw.includes("facebook.")) return "Facebook";
    return value || "Acesso direto";
  };

  const channelLabel = (value) =>
    ({
      ai_assistant: "Assistente de IA",
      organic_search: "Busca orgânica",
      paid_search: "Busca paga",
      social: "Rede social",
      referral: "Referência",
      campaign: "Campanha",
      direct: "Direto",
    })[value] || value || "Direto";

  const ctaLocationLabel = (value) =>
    ({
      header: "Cabeçalho",
      mobile_menu: "Menu mobile",
      hero: "Hero",
      intent_event: "Card de orçamento",
      festas_cta: "CTA de festas",
      footer: "Rodapé",
      whatsapp_float: "WhatsApp flutuante",
      course_intro_cta: "Curso — início",
      course_final_cta: "Curso — final",
    })[value] || value || "Não identificado";

  const eventLabel = (value) =>
    ({
      generate_lead: "WhatsApp",
      begin_checkout: "Checkout do curso",
    })[value] || value || "CTA";

  const setStatus = (message, isError = false) => {
    if (!elements.status) return;
    elements.status.textContent = message;
    elements.status.classList.toggle("error", isError);
  };

  const setText = (id, value) => {
    const node = byId(id);
    if (node) node.textContent = String(value);
  };

  const renderTable = ({ rows, bodyId, wrapId, emptyId, rowRenderer }) => {
    const body = byId(bodyId);
    const wrap = byId(wrapId);
    const empty = byId(emptyId);
    const data = Array.isArray(rows) ? rows : [];
    if (!body || !wrap || !empty) return;

    if (!data.length) {
      body.innerHTML = "";
      wrap.hidden = true;
      empty.hidden = false;
      return;
    }

    body.innerHTML = data.map(rowRenderer).join("");
    wrap.hidden = false;
    empty.hidden = true;
  };

  const renderDaily = (rows) => {
    const container = byId("dailyTrend");
    const empty = byId("dailyEmpty");
    const data = Array.isArray(rows) ? rows : [];
    if (!container || !empty) return;

    if (!data.length) {
      container.innerHTML = "";
      container.hidden = true;
      empty.hidden = false;
      return;
    }

    const maximum = data.reduce(
      (max, row) => Math.max(max, numberValue(row.visitors), numberValue(row.cta_clicks)),
      1,
    );

    container.innerHTML = data
      .map((row) => {
        const visitors = numberValue(row.visitors);
        const clicks = numberValue(row.cta_clicks);
        const visitorWidth = Math.max(visitors ? 2 : 0, Math.round((visitors / maximum) * 100));
        const clickWidth = Math.max(clicks ? 2 : 0, Math.round((clicks / maximum) * 100));

        return `<div class="daily-row">
          <span>${escapeHtml(formatDate(row.date))}</span>
          <span class="daily-track" aria-label="${visitors} visitantes e ${clicks} cliques">
            <span class="daily-visitors" style="width:${visitorWidth}%"></span>
            <span class="daily-clicks" style="width:${clickWidth}%"></span>
          </span>
          <span class="daily-value">${formatNumber(visitors)} vis. · ${formatNumber(clicks)} cliques</span>
        </div>`;
      })
      .join("");

    container.hidden = false;
    empty.hidden = true;
  };

  const renderDashboard = (data) => {
    const report = data || {};
    setText("metricVisitors", formatNumber(report.visitors));
    setText("metricPageViews", formatNumber(report.page_views));
    setText("metricCtaClicks", formatNumber(report.cta_clicks));
    setText("metricConversion", formatPercent(report.conversion_rate));
    setText("metricWhatsapp", formatNumber(report.whatsapp_clicks));
    setText("metricCheckout", formatNumber(report.checkout_clicks));
    setText("metricChatgptVisitors", formatNumber(report.chatgpt_visitors));
    setText("metricChatgptClicks", formatNumber(report.chatgpt_clicks));
    renderDaily(report.daily);

    renderTable({
      rows: report.cta_positions,
      bodyId: "ctaTableBody",
      wrapId: "ctaTableWrap",
      emptyId: "ctaEmpty",
      rowRenderer: (row) =>
        `<tr><td class="primary-cell">${escapeHtml(row.label)}</td><td>${escapeHtml(ctaLocationLabel(row.location))}</td><td>${escapeHtml(eventLabel(row.event_name))}</td><td>${escapeHtml(row.method || "website")}</td><td>${formatNumber(row.clicks)}</td><td>${formatNumber(row.visitors)}</td></tr>`,
    });

    renderTable({
      rows: report.channels,
      bodyId: "sourceTableBody",
      wrapId: "sourceTableWrap",
      emptyId: "sourceEmpty",
      rowRenderer: (row) =>
        `<tr><td class="primary-cell">${escapeHtml(sourceLabel(row.source))}</td><td>${escapeHtml(channelLabel(row.channel))}</td><td>${formatNumber(row.visitors)}</td><td>${formatNumber(row.clicks)}</td><td>${formatPercent(row.conversion_rate)}</td></tr>`,
    });

    renderTable({
      rows: report.ai_assistants,
      bodyId: "aiTableBody",
      wrapId: "aiTableWrap",
      emptyId: "aiEmpty",
      rowRenderer: (row) =>
        `<tr><td class="primary-cell">${escapeHtml(sourceLabel(row.assistant))}</td><td>${formatNumber(row.visitors)}</td><td>${formatNumber(row.clicks)}</td><td>${formatPercent(row.conversion_rate)}</td></tr>`,
    });

    renderTable({
      rows: report.recent_ctas,
      bodyId: "recentTableBody",
      wrapId: "recentTableWrap",
      emptyId: "recentEmpty",
      rowRenderer: (row) => {
        const source = row.ai_assistant ? sourceLabel(row.ai_assistant) : sourceLabel(row.source);
        return `<tr><td>${escapeHtml(formatDateTime(row.occurred_at))}</td><td class="primary-cell">${escapeHtml(source)}<span class="secondary-line">${escapeHtml(channelLabel(row.traffic_channel))}</span></td><td class="primary-cell">${escapeHtml(row.cta_label || "CTA sem rótulo")}</td><td>${escapeHtml(ctaLocationLabel(row.cta_location))}</td><td>${escapeHtml(eventLabel(row.event_name))}</td></tr>`;
      },
    });
  };

  const friendlyError = (error) => {
    const message = String(error?.message || error?.details || error || "Erro desconhecido");
    if (/Acesso negado|42501|permission/i.test(message)) {
      return "Esta conta não está autorizada a acessar o painel Natanael.";
    }
    if (/Invalid login credentials/i.test(message)) return "E-mail ou senha inválidos.";
    return message;
  };

  const showLogin = (message = "Entre para visualizar os dados de aquisição.") => {
    elements.loginPanel.hidden = false;
    elements.dashboard.hidden = true;
    elements.logoutButton.hidden = true;
    setStatus(message);
  };

  const showDashboard = () => {
    elements.loginPanel.hidden = true;
    elements.dashboard.hidden = false;
    elements.logoutButton.hidden = false;
  };

  const loadReport = async () => {
    const period = Math.min(365, Math.max(1, Number(elements.periodFilter?.value) || 30));
    elements.refreshButton.disabled = true;
    setStatus("Atualizando dados de aquisição...");

    try {
      const { data, error } = await client.rpc("get_natanael_acquisition_summary", {
        period_days: period,
      });
      if (error) throw error;
      renderDashboard(data);
      showDashboard();
      setStatus(`Dados dos últimos ${period} dias.`);
    } catch (error) {
      console.error("Falha ao carregar painel Natanael:", error);
      const message = friendlyError(error);
      setStatus(message, true);
      if (/não está autorizada|Acesso negado/i.test(message)) elements.dashboard.hidden = true;
    } finally {
      elements.refreshButton.disabled = false;
    }
  };

  const clearCredentials = () => {
    if (elements.emailInput) elements.emailInput.value = "";
    if (elements.passwordInput) elements.passwordInput.value = "";
  };

  const handleLogin = async () => {
    const email = elements.emailInput?.value.trim();
    const password = elements.passwordInput?.value;
    if (!email || !password) {
      setStatus("Informe e-mail e senha.", true);
      return;
    }

    elements.loginButton.disabled = true;
    setStatus("Validando acesso...");

    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await loadReport();
      clearCredentials();
    } catch (error) {
      showLogin(friendlyError(error));
      elements.status.classList.add("error");
    } finally {
      elements.loginButton.disabled = false;
    }
  };

  const handleCredentialKeydown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleLogin();
  };

  const handleLogout = async () => {
    elements.logoutButton.disabled = true;
    await client.auth.signOut();
    elements.logoutButton.disabled = false;
    showLogin("Sessão encerrada.");
  };

  const initialize = async () => {
    if (!client) {
      showLogin("Não foi possível inicializar o serviço de autenticação.");
      elements.status.classList.add("error");
      return;
    }

    elements.loginButton?.addEventListener("click", handleLogin);
    elements.emailInput?.addEventListener("keydown", handleCredentialKeydown);
    elements.passwordInput?.addEventListener("keydown", handleCredentialKeydown);
    elements.logoutButton?.addEventListener("click", handleLogout);
    elements.refreshButton?.addEventListener("click", loadReport);
    elements.periodFilter?.addEventListener("change", loadReport);

    const { data, error } = await client.auth.getSession();
    if (error || !data.session) {
      showLogin();
      return;
    }

    await loadReport();
  };

  initialize().catch((error) => {
    console.error("Falha ao iniciar área administrativa:", error);
    showLogin("Não foi possível iniciar o painel administrativo.");
    elements.status.classList.add("error");
  });
})();
