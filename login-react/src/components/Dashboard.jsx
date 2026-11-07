import { useState } from "react";

function maskToken(token) {
  if (token.length <= 16) return token;
  return `${token.slice(0, 8)}…${token.slice(-6)}`;
}

function formatExpiry(expiresAt) {
  if (!expiresAt) return "Não informado pela API";
  return new Date(expiresAt).toLocaleString("pt-BR");
}

export default function Dashboard({ session, onLogout }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(session.accessToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setRevealed(true);
    }
  }

  return (
    <main className="page">
      <section className="card wide">
        <div className="brand success" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1>Login realizado</h1>
        <p className="subtitle">
          A API retornou um <code>access_token</code> válido.
        </p>

        <dl className="details">
          <div>
            <dt>Tipo</dt>
            <dd>{session.tokenType}</dd>
          </div>
          <div>
            <dt>Expira em</dt>
            <dd>{formatExpiry(session.expiresAt)}</dd>
          </div>
          <div>
            <dt>Refresh token</dt>
            <dd>{session.refreshToken ? "Recebido" : "Não enviado"}</dd>
          </div>
        </dl>

        <label className="token-label" htmlFor="token">
          access_token
        </label>
        <textarea
          id="token"
          className="token-box"
          readOnly
          rows={3}
          value={revealed ? session.accessToken : maskToken(session.accessToken)}
        />

        <div className="actions">
          <button type="button" className="secondary" onClick={() => setRevealed((v) => !v)}>
            {revealed ? "Ocultar token" : "Mostrar token"}
          </button>
          <button type="button" className="secondary" onClick={copyToken}>
            {copied ? "Copiado!" : "Copiar token"}
          </button>
          <button type="button" className="primary" onClick={onLogout}>
            Sair
          </button>
        </div>
      </section>
    </main>
  );
}
