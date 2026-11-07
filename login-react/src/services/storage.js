// Guarda a sessão no navegador.
// "Lembrar de mim" => localStorage (persiste). Caso contrário => sessionStorage (some ao fechar a aba).

const KEY = "auth_session";

export function saveSession(session, remember) {
  clearSession();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(KEY, JSON.stringify(session));
}

export function loadSession() {
  const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    if (!session?.accessToken) return null;
    if (session.expiresAt && session.expiresAt <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
}
