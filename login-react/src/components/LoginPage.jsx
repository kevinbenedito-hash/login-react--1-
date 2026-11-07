import { useState } from "react";
import { login, USER_FIELD_NAME } from "../services/auth.js";

const isEmailField = USER_FIELD_NAME === "email";
const userLabel = isEmailField ? "E-mail" : "Usuário";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(username, password) {
  const errors = {};
  if (!username.trim()) {
    errors.username = `Informe seu ${userLabel.toLowerCase()}.`;
  } else if (isEmailField && !EMAIL_REGEX.test(username.trim())) {
    errors.username = "Informe um e-mail válido.";
  }
  if (!password) errors.password = "Informe sua senha.";
  return errors;
}

export default function LoginPage({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    const errors = validate(username, password);
    setFieldErrors(errors);
    setApiError("");
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const session = await login(username.trim(), password);
      onSuccess(session, remember);
    } catch (err) {
      setApiError(err.message || "Erro inesperado ao entrar.");
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <form className="card" onSubmit={handleSubmit} noValidate>
        <div className="brand" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
        <h1>Entrar</h1>
        <p className="subtitle">Acesse sua conta para continuar.</p>

        {apiError && (
          <div className="alert" role="alert">
            {apiError}
          </div>
        )}

        <div className="field">
          <label htmlFor="username">{userLabel}</label>
          <input
            id="username"
            name="username"
            type={isEmailField ? "email" : "text"}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-invalid={Boolean(fieldErrors.username)}
            aria-describedby={fieldErrors.username ? "username-error" : undefined}
            disabled={loading}
            autoFocus
          />
          {fieldErrors.username && (
            <span id="username-error" className="field-error">
              {fieldErrors.username}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="password">Senha</label>
          <div className="password-wrap">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              disabled={loading}
            />
            <button
              type="button"
              className="toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          {fieldErrors.password && (
            <span id="password-error" className="field-error">
              {fieldErrors.password}
            </span>
          )}
        </div>

        <label className="remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            disabled={loading}
          />
          Lembrar de mim
        </label>

        <button type="submit" className="primary" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
