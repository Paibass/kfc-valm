"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { submitToGoogleForm } from "@/lib/submitToGoogleForm";
import { CAJEROS } from "@/lib/cajeros";

// Types
interface Product {
  id: string;
  categoria: string;
  nombre: string;
  precio: number;
  tipo: string;
}

interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

// localStorage helpers
const STORAGE_KEYS = {
  cajero: "kfc-session-cajero",
  fecha: "kfc-session-fecha",
};

function getStoredValue(key: string, fallback: string = ""): string {
  if (typeof window === "undefined") return fallback;
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function setStoredValue(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function getTodayFormatted(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function Page() {
  // Products from JSON
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Session state (persisted)
  const [sessionCajero, setSessionCajero] = useState<string>("");
  const [sessionFecha, setSessionFecha] = useState<string>("");
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // Ticket state (reset per ticket)
  const [chk4, setChk4] = useState<string>("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [categoria, setCategoria] = useState<string>("desayuno_merienda");

  // UI state
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string>("");

  // Load products from JSON
  useEffect(() => {
    fetch("/products.json")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setProductsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading products:", err);
        setProductsLoading(false);
      });
  }, []);

  // Load session from localStorage on mount
  useEffect(() => {
    const storedCajero = getStoredValue(STORAGE_KEYS.cajero, "");
    const storedFecha = getStoredValue(STORAGE_KEYS.fecha, "");
    const fecha = storedFecha || getTodayFormatted();

    setSessionCajero(storedCajero);
    setSessionFecha(fecha);
    setSessionLoaded(true);
  }, []);

  // Auto-update date when day changes
  useEffect(() => {
    if (!sessionLoaded) return;

    const checkDateChange = () => {
      const today = getTodayFormatted();
      const storedFecha = getStoredValue(STORAGE_KEYS.fecha, "");

      if (storedFecha && storedFecha !== today) {
        setSessionFecha(today);
        setStoredValue(STORAGE_KEYS.fecha, today);
      }
    };

    const interval = setInterval(checkDateChange, 60000);
    return () => clearInterval(interval);
  }, [sessionLoaded]);

  // Session handlers
  const updateSessionCajero = useCallback((value: string) => {
    setSessionCajero(value);
    setStoredValue(STORAGE_KEYS.cajero, value);
  }, []);

  const updateSessionFecha = useCallback((value: string) => {
    setSessionFecha(value);
    setStoredValue(STORAGE_KEYS.fecha, value);
  }, []);

  // Calculated total
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  }, [items]);

  // Generate detalle string from items
  const detalle = useMemo(() => {
    return items
      .map((item) => (item.cantidad > 1 ? `${item.cantidad}x ${item.nombre}` : item.nombre))
      .join(" + ");
  }, [items]);

  // Validation
  const canSave = useMemo(() => {
    return !!sessionFecha && !!sessionCajero && !!chk4 && items.length > 0;
  }, [sessionFecha, sessionCajero, chk4, items]);

  // Add product to cart
  const addProduct = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          nombre: product.nombre,
          precio: product.precio,
          cantidad: 1,
        },
      ];
    });
  }, []);

  // Remove item from cart
  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Decrease quantity
  const decreaseItem = useCallback((id: string) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item
        )
        .filter((item) => item.cantidad > 0)
    );
  }, []);

  // Reset for new ticket (keep session)
  function resetForNewTicket() {
    setChk4("");
    setItems([]);
    setToast("");
  }

  // Save ticket
  async function onSave() {
    if (!canSave) return;
    setBusy(true);
    setToast("");

    try {
      await submitToGoogleForm({
        fecha: sessionFecha,
        chk4,
        cajero: sessionCajero,
        detalle,
        total: total.toString(),
        raw: "",
      });
      setToast("Guardado");
      // Auto reset for next ticket
      setTimeout(() => {
        resetForNewTicket();
      }, 800);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setToast(`Error: ${message}`);
    } finally {
      setBusy(false);
    }
  }

  // Filter products by category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => p.categoria === categoria);
  }, [products, categoria]);

  return (
    <div className="container">
      {/* Header */}
      <header className="topbar">
        <div className="brand">
          <div className="logoBox">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="Logo" className="logoImg" />
          </div>
          <strong className="brandTitle">KFC LINIERS VALM</strong>
        </div>

        <a
          className="sheetBtn"
          href="https://docs.google.com/spreadsheets/d/1JoJCl0i5Q3WHTc5jzhQM9Om4BPS9Wa_dYTdqU1RhOUw/edit?usp=sharing"
          target="_blank"
          rel="noreferrer"
          aria-label="Abrir Google Sheets"
          title="Abrir Google Sheets"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1v5h5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M7 12h10M7 16h10M10 10v10M14 10v10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </a>
      </header>

      <main className="section">
        {/* Session Block */}
        <div className="sessionBlock">
          <div className="sessionRow">
            <div className="sessionField">
              <label>Fecha</label>
              <input
                type="date"
                value={sessionFecha}
                onChange={(e) => updateSessionFecha(e.target.value)}
                disabled={busy}
              />
            </div>

            <div className="sessionField">
              <label>Cajero</label>
              <select
                value={sessionCajero}
                onChange={(e) => updateSessionCajero(e.target.value)}
                disabled={busy}
              >
                <option value="">Seleccionar...</option>
                {CAJEROS.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sessionField">
            <label>CHK (ultimos 4)</label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={chk4}
              onChange={(e) => setChk4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="0000"
              disabled={busy}
              style={{ fontSize: 18, fontWeight: 600, letterSpacing: 4 }}
            />
          </div>
        </div>

        {/* Category Selector */}
        <div className="categorySelector">
          <button
            type="button"
            className={`categoryBtn ${categoria === "desayuno_merienda" ? "active" : ""}`}
            onClick={() => setCategoria("desayuno_merienda")}
          >
            Desayuno / Merienda
          </button>
          <button
            type="button"
            className={`categoryBtn ${categoria === "postres" ? "active" : ""}`}
            onClick={() => setCategoria("postres")}
          >
            Postres
          </button>
        </div>

        {/* Products Grid */}
        <div className="productsGrid">
          {productsLoading ? (
            <div className="loadingMessage">Cargando productos...</div>
          ) : (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                className="productBtn"
                onClick={() => addProduct(product)}
                disabled={busy}
              >
                <span className="productName">{product.nombre}</span>
                <span className="productPrice">{formatCurrency(product.precio)}</span>
              </button>
            ))
          )}
        </div>

        {/* Current Sale (Cart) */}
        {items.length > 0 && (
          <div className="cartCard">
            <div className="cartHeader">Venta actual</div>
            <div className="cartItems">
              {items.map((item) => (
                <div key={item.id} className="cartItem">
                  <div className="cartItemInfo">
                    <span className="cartItemQty">
                      {item.cantidad > 1 ? `${item.cantidad}x ` : ""}
                    </span>
                    <span className="cartItemName">{item.nombre}</span>
                  </div>
                  <div className="cartItemActions">
                    <span className="cartItemSubtotal">
                      {formatCurrency(item.precio * item.cantidad)}
                    </span>
                    <button
                      type="button"
                      className="cartItemBtn decrease"
                      onClick={() => decreaseItem(item.id)}
                      aria-label="Reducir cantidad"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      className="cartItemBtn remove"
                      onClick={() => removeItem(item.id)}
                      aria-label="Eliminar"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cartDivider" />
            <div className="cartTotal">
              <span>TOTAL</span>
              <span className="cartTotalValue">{formatCurrency(total)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="actions">
          <button
            className="primary"
            onClick={onSave}
            disabled={!canSave || busy}
          >
            {busy ? "Guardando..." : "Guardar"}
          </button>
          <button
            className="secondary"
            onClick={resetForNewTicket}
            disabled={busy}
          >
            Nuevo ticket
          </button>
        </div>

        {toast && (
          <div className={`toast ${toast.startsWith("Error") ? "error" : "success"}`}>
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}
