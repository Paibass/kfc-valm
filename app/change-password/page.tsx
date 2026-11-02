"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage(""); setError("");
    const response = await fetch("/api/local-auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
    if (!response.ok) { setError((await response.json().catch(() => ({}))).error ?? "No se pudo cambiar"); return; }
    setMessage("Contraseña actualizada"); setCurrentPassword(""); setNewPassword("");
  }
  return <main className="loginPage"><form className="loginCard" onSubmit={submit}>
    <h1>Cambiar contraseña</h1>
    <label htmlFor="current">Contraseña actual</label><input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
    <label htmlFor="next">Nueva contraseña</label><input id="next" type="password" minLength={4} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
    {error && <div className="loginError" role="alert">{error}</div>}{message && <div className="loginSuccess">{message}</div>}
    <button className="primary loginSubmit">Guardar</button><button type="button" className="secondary" onClick={() => router.push("/")}>Volver</button>
  </form></main>;
}
