"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LocalOption = { codigo: string; nombre: string };

export default function LoginPage() {
  const router = useRouter();
  const [locals, setLocals] = useState<LocalOption[]>([]);
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/public/locals")
      .then((response) => response.json())
      .then((data) => setLocals(Array.isArray(data.locals) ? data.locals : []))
      .catch(() => setError("No se pudieron cargar los locales"));
  }, []);

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

  return <main className="loginPage"><div className="loginShell"><form className="loginCard" onSubmit={submit}>
    <div className="loginBrand" aria-hidden="true"><span className="loginLogo">KFC</span><span className="loginBrandLine" /></div>
    <h1>KFC VALM</h1>
    <p className="loginWelcome">Bienvenido/a al sistema de carga de tickets VALM</p>
    <p className="loginHint">Ingresá con tu local y contraseña para comenzar.</p>
    <label htmlFor="local">Local</label>
    <select id="local" value={codigo} onChange={(event) => setCodigo(event.target.value)} autoComplete="organization" required>
      <option value="">Seleccionar local</option>
      {locals.map((local) => <option key={local.codigo} value={local.codigo}>{local.nombre}</option>)}
    </select>
    <label htmlFor="password">Contraseña</label>
    <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" autoComplete="current-password" required />
    {error && <div className="loginError" role="alert">{error}</div>}
    <button className="primary loginSubmit" disabled={busy} aria-busy={busy}>{busy ? "Ingresando..." : "Iniciar sesión"}</button>
  </form><footer className="loginSignature">Joaquín Paiva</footer></div></main>;
}
