"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/local-auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ codigo, password }) });
    if (!response.ok) {
      setError((await response.json().catch(() => ({}))).error ?? "No se pudo iniciar sesión");
      setBusy(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return <main className="loginPage"><form className="loginCard" onSubmit={submit}>
    <div className="loginLogo">KFC</div>
    <h1>Acceso al local</h1>
    <p>Ingresá para cargar tickets y consultar el ranking.</p>
    <label htmlFor="local">Local</label>
    <input id="local" value={codigo} onChange={(event) => setCodigo(event.target.value)} placeholder="LINIERS" autoComplete="organization" required />
    <label htmlFor="password">Contraseña</label>
    <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" autoComplete="current-password" required />
    {error && <div className="loginError" role="alert">{error}</div>}
    <button className="primary loginSubmit" disabled={busy}>{busy ? "Ingresando..." : "Ingresar"}</button>
    <small>Contraseña inicial: 1234</small>
  </form></main>;
}
