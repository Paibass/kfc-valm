"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { fetchDailyStats, type DailyStats } from "@/lib/fetchDailyStats";
import { fetchLocalCashiers, fetchLocalCatalog, fetchLocalConfig } from "@/lib/fetchLocalConfig";
import type { LocalCashier, LocalConfig } from "@/lib/local-config";
import { AppHeader } from "@/components/AppHeader";

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
  // Products, local configuration, and cashiers come from Neon
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [localConfig, setLocalConfig] = useState<LocalConfig | null>(null);
  const [cashiers, setCashiers] = useState<LocalCashier[]>([]);
  const [catalogError, setCatalogError] = useState("");
  
  // Session state (persisted)
  const [sessionCajero, setSessionCajero] = useState<string>("");
  const [sessionFecha, setSessionFecha] = useState<string>("");
  const sessionLoaded = Boolean(localConfig);

  // Ticket state (reset per ticket)
  const [chk4, setChk4] = useState<string>("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [categoria, setCategoria] = useState<string>("desayuno_merienda");

  // UI state
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string>("");

  // Daily stats state
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loadingDailyStats, setLoadingDailyStats] = useState(false);

  // Load the authenticated local, its cashiers, and its assigned price list.
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchLocalConfig(), fetchLocalCashiers(), fetchLocalCatalog()])
      .then(([config, cashierData, catalog]) => {
        if (cancelled) return;
        setLocalConfig(config);
        setCashiers(cashierData.cashiers);
        setProducts(catalog.products);
        setCatalogError(catalog.configured ? "" : catalog.error || "La configuración de productos está incompleta.");
        setProductsLoading(false);
        const key = `kfc-local-${config.id}`;
        const storedCajero = getStoredValue(`${key}-cajero`, "");
        const storedFecha = getStoredValue(`${key}-fecha`, "") || getTodayFormatted();
        const cashierName = cashierData.cashiers.some((cashier) => cashier.nombre === storedCajero) ? storedCajero : "";
        setSessionCajero(cashierName);
        setSessionFecha(storedFecha);
      })
      .catch((error) => {
        if (cancelled) return;
        setCatalogError(error instanceof Error ? error.message : "No se pudo cargar la configuración del local.");
        setProductsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Load daily stats function
  const loadDailyStats = useCallback(async (fecha: string) => {
    if (!fecha) return;
    setLoadingDailyStats(true);
    try {
      const stats = await fetchDailyStats(fecha);
      setDailyStats(stats);
    } catch (error) {
      console.error("Error fetching daily stats:", error);
      setDailyStats(null);
    } finally {
      setLoadingDailyStats(false);
    }
  }, []);

  // Fetch daily stats when session fecha changes
  useEffect(() => {
    if (!sessionLoaded || !sessionFecha) return;
    const timer = window.setTimeout(() => { void loadDailyStats(sessionFecha); }, 0);
    return () => window.clearTimeout(timer);
  }, [sessionLoaded, sessionFecha, loadDailyStats]);



  // Session handlers
  const updateSessionCajero = useCallback((value: string) => {
    setSessionCajero(value);
    if (localConfig) setStoredValue(`kfc-local-${localConfig.id}-cajero`, value);
  }, [localConfig]);
  
  const updateSessionFecha = useCallback((value: string) => {
    setSessionFecha(value);
    if (localConfig) setStoredValue(`kfc-local-${localConfig.id}-fecha`, value);
  }, [localConfig]);

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
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fecha: sessionFecha, chk4, cajero: sessionCajero, detalle, total: total.toString(), raw: "" }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo guardar el ticket");
      setToast("Guardado");
      // Refresh daily stats after successful save
      loadDailyStats(sessionFecha);
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
      <AppHeader dailyStats={dailyStats} loadingDailyStats={loadingDailyStats} />

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
              {cashiers.map((cashier) => (
                <option key={cashier.id} value={cashier.nombre}>
                  {cashier.nombre}
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
  {catalogError && <div className="toast error">{catalogError}</div>}
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
