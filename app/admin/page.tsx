"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = { id: string; nombre: string; categoria: string; tipo: string; precio: number };
type Cashier = { id: number; nombre: string; usuarioPos: string | null; esReferente: boolean };

type Config = { id: number; codigo: string; nombre: string; listaPreciosId: number | null; referente: { id: number; nombre: string } | null };

async function save(payload: unknown) {
  const response = await fetch("/api/admin", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No se pudo guardar");
}

export default function AdminPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const [configResponse, cashierResponse, catalogResponse] = await Promise.all([
      fetch("/api/local-config", { cache: "no-store" }),
      fetch("/api/local-config/cashiers", { cache: "no-store" }),
      fetch("/api/local-config/catalog", { cache: "no-store" }),
    ]);
    if (!configResponse.ok || !cashierResponse.ok || !catalogResponse.ok) throw new Error("Sesión requerida");
    const configData = await configResponse.json();
    const cashierData = await cashierResponse.json();
    const catalogData = await catalogResponse.json();
    setConfig(configData);
    setCashiers(cashierData.cashiers);
    setProducts(catalogData.products);
  }

  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar el panel")); }, []);

  async function update(payload: unknown) {
    try { await save(payload); setMessage("Cambios guardados"); setTimeout(() => setMessage(""), 2200); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar"); }
  }

  return (
    <main className="container adminPage">
      <div className="adminTop"><div><p className="eyebrow">Administración</p><h1>Configuración del local</h1></div><Link href="/" className="secondary adminBack">Volver</Link></div>
      {error && <div className="toast error">{error}</div>}
      {message && <div className="toast success">{message}</div>}
      {config && <section className="adminCard"><h2>Local activo</h2><div className="adminGrid"><label>Nombre<input value={config.nombre} onChange={(e) => setConfig({ ...config, nombre: e.target.value })} /></label><label>Código<input value={config.codigo} disabled /></label></div><button className="primary" onClick={() => update({ type: "local", nombre: config.nombre, listaPreciosId: config.listaPreciosId })}>Guardar local</button></section>}
      <section className="adminCard"><h2>Cajeros</h2><div className="adminRows">{cashiers.map((cashier) => <div className="adminRow" key={cashier.id}><input value={cashier.nombre} onChange={(e) => setCashiers((items) => items.map((item) => item.id === cashier.id ? { ...item, nombre: e.target.value } : item))} /><input value={cashier.usuarioPos ?? ""} placeholder="Usuario POS" onChange={(e) => setCashiers((items) => items.map((item) => item.id === cashier.id ? { ...item, usuarioPos: e.target.value } : item))} /><label className="checkLabel"><input type="checkbox" checked={cashier.esReferente} onChange={(e) => setCashiers((items) => items.map((item) => item.id === cashier.id ? { ...item, esReferente: e.target.checked } : item))} /> Referente</label><button className="secondary" onClick={() => update({ type: "cashier", ...cashier })}>Guardar</button></div>)}</div></section>
      <section className="adminCard"><h2>Precios</h2><div className="adminRows">{products.map((product) => <div className="adminRow" key={product.id}><span className="adminProductName">{product.nombre}</span><input type="number" min="0" step="0.01" value={product.precio} onChange={(e) => setProducts((items) => items.map((item) => item.id === product.id ? { ...item, precio: Number(e.target.value) } : item))} /><button className="secondary" onClick={() => update({ type: "price", codigo: product.id, precio: product.precio })}>Guardar</button></div>)}</div></section>
    </main>
  );
}
