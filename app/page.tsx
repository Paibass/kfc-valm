"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { preprocessToBlob } from "@/lib/imagePreprocess";
import { runOcrOnBlob } from "@/lib/ocr";
import { parseTicketFromOcr, TicketData } from "@/lib/parseTicket";
import { submitToGoogleForm } from "@/lib/submitToGoogleForm";
import { CAJEROS } from "@/lib/cajeros";

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

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  
  // Session state (persisted)
  const [sessionCajero, setSessionCajero] = useState<string>("");
  const [sessionFecha, setSessionFecha] = useState<string>("");
  const [sessionLoaded, setSessionLoaded] = useState(false);
  
  // Ticket state (reset per ticket)
  const [ticket, setTicket] = useState<TicketData>({
    fecha: "",
    chk4: "",
    cajero: "",
    detalle: "",
    total: "",
    raw: "",
  });
  const [toast, setToast] = useState<string>("");
  const [ocrRaw, setOcrRaw] = useState<string>("");
  const [showConsole, setShowConsole] = useState<boolean>(false);

  // Load session from localStorage on mount
  useEffect(() => {
    const storedCajero = getStoredValue(STORAGE_KEYS.cajero, "");
    const storedFecha = getStoredValue(STORAGE_KEYS.fecha, "");
    
    // Use stored fecha or default to today
    const fecha = storedFecha || getTodayFormatted();
    
    setSessionCajero(storedCajero);
    setSessionFecha(fecha);
    setTicket(prev => ({
      ...prev,
      cajero: storedCajero,
      fecha: fecha,
    }));
    setSessionLoaded(true);
  }, []);

  // Auto-update date when day changes
  useEffect(() => {
    if (!sessionLoaded) return;
    
    const checkDateChange = () => {
      const today = getTodayFormatted();
      const storedFecha = getStoredValue(STORAGE_KEYS.fecha, "");
      
      // If stored date is different from today, update to today
      if (storedFecha && storedFecha !== today) {
        setSessionFecha(today);
        setStoredValue(STORAGE_KEYS.fecha, today);
        setTicket(prev => ({ ...prev, fecha: today }));
      }
    };
    
    // Check every minute
    const interval = setInterval(checkDateChange, 60000);
    return () => clearInterval(interval);
  }, [sessionLoaded]);

  // Update session handlers
  const updateSessionCajero = useCallback((value: string) => {
    setSessionCajero(value);
    setStoredValue(STORAGE_KEYS.cajero, value);
    setTicket(prev => ({ ...prev, cajero: value }));
  }, []);

  const updateSessionFecha = useCallback((value: string) => {
    setSessionFecha(value);
    setStoredValue(STORAGE_KEYS.fecha, value);
    setTicket(prev => ({ ...prev, fecha: value }));
  }, []);


  const canSave = useMemo(() => {
    return !!ticket.fecha && !!ticket.chk4 && !!ticket.cajero && !!ticket.detalle && !!ticket.total;
  }, [ticket]);

  // Reset only ticket-specific fields, keep session (cajero/fecha)
  function resetForNewTicket() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    setTicket({
      fecha: sessionFecha,
      chk4: "",
      cajero: sessionCajero,
      detalle: "",
      total: "",
      raw: "",
    });
    setToast("");
    setProgress(null);
    setOcrRaw("");
    setShowConsole(false);
  }
  
  // Full reset including session
  function resetAll() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    setTicket({
      fecha: sessionFecha,
      chk4: "",
      cajero: sessionCajero,
      detalle: "",
      total: "",
      raw: "",
    });
    setToast("");
    setProgress(null);
    setOcrRaw("");
    setShowConsole(false);
  }

  function onPick(f: File | null) {
    setToast("");
    setProgress(null);
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : "");
  }

  async function onScan() {
    if (!file) return;
    setBusy(true);
    setToast("");
    setProgress(0);

    try {
      const blob = await preprocessToBlob(file);
      const text = await runOcrOnBlob(blob, (p) => {
        if (typeof p.progress === "number") setProgress(p.progress);
      });
      setOcrRaw(text);

      const parsed = parseTicketFromOcr(text);
      // Preserve session fields (fecha, cajero), only use OCR for ticket-specific data
      setTicket({
        ...parsed,
        fecha: sessionFecha,
        cajero: sessionCajero,
      });
      setToast("Listo. Revisá y guardá.");
    } catch (e: any) {
      setToast(`Error escaneando: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function onSave() {
    if (!canSave) return;
    setBusy(true);
    setToast("");

    try {
      await submitToGoogleForm(ticket);
      setToast("✅ Guardado.");
    } catch (e: any) {
      setToast(`Error guardando: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <div className="logoBox">
            {/* espacio listo para imagen local */}
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
          {/* ícono tipo spreadsheets (simple SVG) */}
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
          <span>Abrir planilla</span>
        </a>
      </div>


      <div className="section">
        <div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            disabled={busy}
          />
        </div>

        {previewUrl && (
          <div className="preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="ticket preview" />
          </div>
        )}

        <div className="actions">
          <button className="primary" onClick={onScan} disabled={!file || busy}>
            {busy ? "Procesando..." : "Escanear"}
          </button>
          <button className="secondary" onClick={resetAll} disabled={busy}>
            Limpiar
          </button>
        </div>

        {progress != null && (
          <div className="toast">OCR: {Math.round(progress * 100)}%</div>
        )}

        <div className="divider" />

        {/* Session fields - persistent */}
        <div className="sessionCard">
          <div className="sessionHeader">
            <span className="sessionBadge">Sesion activa</span>
          </div>
          <div className="row">
            <div className="col">
              <label>Fecha</label>
              <input
                type="date"
                value={ticket.fecha}
                onChange={(e) => updateSessionFecha(e.target.value)}
                disabled={busy}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,.10)",
                  background: "#fff",
                  fontSize: 14,
                }}
              />
            </div>

            <div className="col">
              <label>Cajero</label>
              <select
                value={ticket.cajero}
                onChange={(e) => updateSessionCajero(e.target.value)}
                disabled={busy}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,.10)",
                  background: "#fff",
                  fontSize: 14,
                }}
              >
                <option value="">Seleccionar...</option>
                {CAJEROS.map(c => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* Ticket fields - reset per ticket */}
        <div className="row">
          <div className="col">
            <label>CHK (ultimos 4)</label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={ticket.chk4}
              onChange={(e) => setTicket({ ...ticket, chk4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              placeholder="0000"
              disabled={busy}
            />
          </div>

          <div className="col">
            <label>Total</label>
            <input
              inputMode="decimal"
              value={ticket.total}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.,]/g, "");
                setTicket({ ...ticket, total: v });
              }}
              placeholder="0,00"
              disabled={busy}
            />
          </div>
        </div>

        <div>
          <label>Detalle</label>
          <input
            value={ticket.detalle}
            onChange={(e) => setTicket({ ...ticket, detalle: e.target.value })}
            placeholder="Ej: Lagrima med + tos"
            disabled={busy}
          />
        </div>

        <div className="actions">
          <button className="primary" onClick={onSave} disabled={!canSave || busy}>
            Guardar
          </button>
          <button className="secondary" onClick={resetForNewTicket} disabled={busy}>
            Nuevo ticket
          </button>
        </div>

        {toast && <div className="toast">{toast}</div>}
        {ocrRaw && (
          <div className="divider" />
        )}

        {ocrRaw && (
          <div className="card" style={{ padding: 12 }}>
            <div className="row" style={{ alignItems: "center" }}>
              <strong style={{ fontSize: 13 }}>🧠 Consola OCR</strong>
              <div style={{ flex: 1 }} />
              <button
                className="secondary"
                style={{ padding: "6px 10px", fontSize: 12 }}
                onClick={() => setShowConsole(s => !s)}
              >
                {showConsole ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            {showConsole && (
              <>
                <div style={{ marginTop: 8 }}>
                  <textarea
                    value={ocrRaw}
                    readOnly
                    style={{
                      width: "100%",
                      minHeight: 180,
                      resize: "vertical",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                      fontSize: 12,
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,.15)",
                      background: "#0f0f0f",
                      color: "#eaeaea",
                    }}
                  />
                </div>

                <div className="actions" style={{ marginTop: 8 }}>
                  <button
                    className="secondary"
                    onClick={() => navigator.clipboard.writeText(ocrRaw)}
                  >
                    Copiar OCR
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
