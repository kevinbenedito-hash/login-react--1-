import { useState } from "react";
import LoginPage from "./components/LoginPage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { loadSession, saveSession, clearSession } from "./services/storage.js";

export default function App() {
  const [session, setSession] = useState(() => loadSession());

  function handleLogin(newSession, remember) {
    saveSession(newSession, remember);
    setSession(newSession);
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  return session ? (
    <Dashboard session={session} onLogout={handleLogout} />
  ) : (
    <LoginPage onSuccess={handleLogin} />
  );
}
