// Serviço de autenticação: faz a chamada de login e extrai o access_token da resposta.

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH ?? "/auth/login";
const LOGIN_FORMAT = import.meta.env.VITE_LOGIN_FORMAT ?? "json"; // "json" | "form"
const USER_FIELD = import.meta.env.VITE_USER_FIELD ?? "email";
const PASSWORD_FIELD = import.meta.env.VITE_PASSWORD_FIELD ?? "password";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const TIMEOUT_MS = 15000;

export const USER_FIELD_NAME = USER_FIELD;

export class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

function buildRequest(username, password) {
  const payload = { [USER_FIELD]: username, [PASSWORD_FIELD]: password };

  if (LOGIN_FORMAT === "form") {
    return {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(payload).toString(),
    };
  }

  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

// Aceita os formatos mais comuns de resposta: access_token, accessToken, token,
// ou qualquer um deles aninhado em "data".
function parseSession(data) {
  const source = data?.data && typeof data.data === "object" ? data.data : data;
  const accessToken =
    source?.access_token ?? source?.accessToken ?? source?.token ?? null;

  if (!accessToken) {
    throw new AuthError(
      "A API respondeu, mas não retornou um access_token."
    );
  }

  const expiresIn = Number(source.expires_in ?? source.expiresIn);

  return {
    accessToken,
    tokenType: source.token_type ?? source.tokenType ?? "Bearer",
    refreshToken: source.refresh_token ?? source.refreshToken ?? null,
    expiresAt: Number.isFinite(expiresIn) ? Date.now() + expiresIn * 1000 : null,
  };
}

function extractErrorMessage(data, status) {
  const detail = data?.detail;
  const candidate =
    data?.message ??
    data?.error_description ??
    (typeof data?.error === "string" ? data.error : data?.error?.message) ??
    (typeof detail === "string" ? detail : null);

  if (candidate) return candidate;
  if (status === 401 || status === 403) return "Usuário ou senha inválidos.";
  if (status === 422 || status === 400) return "Dados de login inválidos.";
  if (status >= 500) return "O servidor está com problemas. Tente novamente.";
  return `Falha ao entrar (erro ${status}).`;
}

async function mockLogin(username, password) {
  await new Promise((resolve) => setTimeout(resolve, 700));

  if (!username || password !== "123456") {
    throw new AuthError("Usuário ou senha inválidos.", 401);
  }

  return {
    accessToken: `mock.${btoa(username)}.${Math.random().toString(36).slice(2)}`,
    tokenType: "Bearer",
    refreshToken: null,
    expiresAt: Date.now() + 60 * 60 * 1000,
  };
}

export async function login(username, password) {
  if (USE_MOCK) return mockLogin(username, password);

  const { headers, body } = buildRequest(username, password);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_URL}${LOGIN_PATH}`, {
      method: "POST",
      headers: { Accept: "application/json", ...headers },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new AuthError("A API demorou demais para responder.");
    }
    throw new AuthError(
      "Não foi possível conectar à API. Verifique sua conexão ou a configuração de CORS."
    );
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // corpo vazio ou não-JSON
  }

  if (!response.ok) {
    throw new AuthError(extractErrorMessage(data, response.status), response.status);
  }

  return parseSession(data);
}
