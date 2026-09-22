(() => {
  "use strict";

  const SUPABASE_URL = "https://wnigzpvgsbpjdxvjzugt.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_AgO2eC8i01Fg2DS-WfV2bg_Py6g6ZuX";

  const byId = (id) => document.getElementById(id);
  const client = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  const elements = {
    status: byId("pageStatus"),
    loginPanel: byId("loginPanel"),
    loginButton: byId("loginButton"),
    emailInput: byId("emailInput"),
    passwordInput: byId("passwordInput"),
    logoutButton: byId("logoutButton"),
    adminMenu: byId("adminMenu"),
  };

  const setStatus = (message, isError = false) => {
    if (!elements.status) return;
    elements.status.textContent = message;
    elements.status.classList.toggle("error", isError);
  };

  const friendlyError = (error) => {
    const message = String(error?.message || error?.details || error || "Erro desconhecido");
    if (/Invalid login credentials/i.test(message)) return "E-mail ou senha inválidos.";
    if (/Acesso negado|42501|permission/i.test(message)) {
      return "Esta conta não está autorizada a acessar a área administrativa.";
    }
    return message;
  };

  const clearCredentials = () => {
    if (elements.emailInput) elements.emailInput.value = "";
    if (elements.passwordInput) elements.passwordInput.value = "";
  };

  const showLogin = (message = "Entre para acessar a área administrativa.", isError = false) => {
    elements.loginPanel.hidden = false;
    elements.adminMenu.hidden = true;
    elements.logoutButton.hidden = true;
    setStatus(message, isError);
  };

  const showAdminMenu = (email) => {
    elements.loginPanel.hidden = true;
    elements.adminMenu.hidden = false;
    elements.logoutButton.hidden = false;
    setStatus(email ? `Administrador autenticado: ${email}.` : "Administrador autenticado.");
  };

  const getAuthorizedSession = async () => {
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;

    const session = sessionData.session;
    if (!session?.user) return null;

    const { data: admin, error: adminError } = await client
      .from("natanael_admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (adminError) throw adminError;
    if (!admin) {
      await client.auth.signOut();
      throw new Error("Acesso negado ao painel Natanael.");
    }

    return session;
  };

  const loadAuthorizedArea = async () => {
    try {
      const session = await getAuthorizedSession();
      if (!session) {
        showLogin();
        return;
      }
      showAdminMenu(session.user.email || "");
    } catch (error) {
      console.error("Falha ao validar acesso administrativo:", error);
      showLogin(friendlyError(error), true);
    }
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
      clearCredentials();
      await loadAuthorizedArea();
    } catch (error) {
      console.error("Falha no login administrativo:", error);
      showLogin(friendlyError(error), true);
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
    try {
      await client.auth.signOut();
      showLogin("Sessão encerrada.");
    } finally {
      elements.logoutButton.disabled = false;
    }
  };

  const initialize = async () => {
    if (!client) {
      showLogin("Não foi possível inicializar o serviço de autenticação.", true);
      return;
    }

    elements.loginButton?.addEventListener("click", handleLogin);
    elements.emailInput?.addEventListener("keydown", handleCredentialKeydown);
    elements.passwordInput?.addEventListener("keydown", handleCredentialKeydown);
    elements.logoutButton?.addEventListener("click", handleLogout);

    await loadAuthorizedArea();
  };

  initialize().catch((error) => {
    console.error("Falha ao iniciar área administrativa:", error);
    showLogin("Não foi possível iniciar a área administrativa.", true);
  });
})();
