"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

type Cashier = { id: number; nombre: string; es_referente: boolean };

async function requestCashiers() {
  const response = await fetch("/api/admin", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No se pudo cargar la lista");
  return data.cashiers as Cashier[];
}

export default function AdminPage() {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [referente, setReferente] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setCashiers(await requestCashiers()); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo cargar la lista"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function openCreate() { setEditing(null); setName(""); setReferente(false); setFormOpen(true); setError(""); }
  function openEdit(cashier: Cashier) { setEditing(cashier.id); setName(cashier.nombre); setReferente(cashier.es_referente); setFormOpen(true); setError(""); }
  function closeForm() { setFormOpen(false); setEditing(null); setName(""); setReferente(false); }

  async function save() {
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (!trimmed) { setError("El nombre es obligatorio"); return; }
    if (editing && cashiers.find((cashier) => cashier.id === editing)?.nombre !== trimmed && !window.confirm("Cambiar el nombre puede dividir sus registros históricos en el ranking. ¿Continuar?")) return;
    try {
      const response = await fetch("/api/admin", { method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: editing, nombre: trimmed, esReferente: referente }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar");
      closeForm(); await load(); setMessage(editing ? "Cajero actualizado" : "Cajero agregado"); window.setTimeout(() => setMessage(""), 2200);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar"); }
  }

  async function remove(cashier: Cashier) {
    if (!window.confirm(`¿Eliminar a ${cashier.nombre}? Se conservará su historial.`)) return;
    try {
      const response = await fetch("/api/admin", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: cashier.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar");
      await load(); setMessage("Cajero eliminado"); window.setTimeout(() => setMessage(""), 2200);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo eliminar"); }
  }

  return (
    <main className="container adminPage">
      <AppHeader />
      <div className="adminTop"><div><p className="eyebrow">Administración</p><h1>Gestión de cajeros</h1></div><Link href="/" className="secondary adminBack">Volver</Link></div>
      {error && <div className="toast error" role="alert">{error}</div>}
      {message && <div className="toast success" role="status">{message}</div>}
      <section className="adminCard cashierAdminCard">
        <div className="adminSectionHeader"><div><h2>Cajeros</h2><p className="adminHint">Solo se muestran los cajeros activos de este local.</p></div><button className="primary addCashierButton" onClick={openCreate}>+ Agregar cajero</button></div>
        {formOpen && <div className="cashierForm"><label>Nombre<input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></label><label className="checkLabel"><input type="checkbox" checked={referente} onChange={(e) => setReferente(e.target.checked)} /> Es referente</label><div className="formActions"><button className="secondary" onClick={closeForm}>Cancelar</button><button className="primary" onClick={save}>Guardar</button></div></div>}
        {loading ? <p className="adminHint">Cargando cajeros...</p> : cashiers.length === 0 ? <p className="adminHint">No hay cajeros activos.</p> : <div className="cashierRows">{cashiers.map((cashier) => <div className="cashierRow" key={cashier.id}><div className="cashierName">{cashier.nombre}{cashier.es_referente && <span className="referentBadge">Referente</span>}</div><div className="cashierActions"><button className="secondary" onClick={() => openEdit(cashier)}>Editar</button><button className="dangerButton" onClick={() => remove(cashier)}>Eliminar</button></div></div>)}</div>}
      </section>
    </main>
  );
}
