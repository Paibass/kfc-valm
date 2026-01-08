"use client";

import React, { useMemo, useState } from "react";
import { preprocessToBlob } from "@/lib/imagePreprocess";
import { runOcrOnBlob } from "@/lib/ocr";
import { parseTicketFromOcr, TicketData } from "@/lib/parseTicket";
import { submitToGoogleForm } from "@/lib/submitToGoogleForm";
import { CAJEROS } from "@/lib/cajeros";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [toast, setToast] = useState<string>("");
  const [ocrRaw, setOcrRaw] = useState<string>("");
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const cajeroLabel = ticket?.cajero
      ? (CAJEROS.find(c => c.user === ticket.cajero)?.label ?? "")
      : "";


  const canSave = useMemo(() => {
    if (!ticket) return false;
    return !!ticket.fecha && !!ticket.chk4 && !!ticket.cajero && !!ticket.detalle && !!ticket.total;
  }, [ticket]);

  function resetAll() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    setTicket(null);
    setToast("");
    setProgress(null);
    setOcrRaw("");
    setShowConsole(false);

  }

  function onPick(f: File | null) {
    setToast("");
    setTicket(null);
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
      setTicket(parsed);
      setToast("Listo. Revisá y guardá.");
    } catch (e: any) {
      setToast(`Error escaneando: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function onSave() {
    if (!ticket) return;
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

            <div className="row">
              <div className="col">
                <label>Fecha</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                      value={ticket?.fecha ?? ""}
                      onChange={(e) => ticket && setTicket({ ...ticket, fecha: e.target.value })}
                      placeholder="dd/mm/aaaa"
                      disabled={busy || !ticket}
                  />
                  <button
                      type="button"
                      className="secondary"
                      style={{ flex: "0 0 auto", minWidth: 90 }}
                      disabled={busy || !ticket}
                      onClick={() => {
                        if (!ticket) return;
                        const d = new Date();
                        const dd = String(d.getDate()).padStart(2, "0");
                        const mm = String(d.getMonth() + 1).padStart(2, "0");
                        const yyyy = d.getFullYear();
                        setTicket({ ...ticket, fecha: `${dd}/${mm}/${yyyy}` });
                      }}
                  >
                    Hoy
                  </button>
                </div>
              </div>

              <div className="col">
                <label>CHK (últimos 4)</label>
                <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={ticket?.chk4 ?? ""}
                    onChange={(e) => ticket && setTicket({ ...ticket, chk4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder="0000"
                    disabled={busy || !ticket}
                />

              </div>
            </div>

            <div className="row">
              <div className="col">
                <label>Cajero</label>
                <select
                    value={ticket?.cajero ?? ""}
                    onChange={(e) => ticket && setTicket({ ...ticket, cajero: e.target.value })}
                    disabled={busy || !ticket}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid rgba(0,0,0,.10)",
                      background: "#fff",
                      fontSize: 14,
                    }}
                >
                  <option value="">Seleccionar…</option>
                  {CAJEROS.map(c => (
                      <option key={c.label} value={c.label}>
                        {c.label}
                      </option>
                  ))}
                </select>
              </div>

              <div className="col">
                <label>Total</label>
                <input
                    inputMode="decimal"
                    value={ticket?.total ?? ""}
                    onChange={(e) => {
                      if (!ticket) return;
                      const v = e.target.value.replace(/[^0-9.,]/g, "");
                      setTicket({ ...ticket, total: v });
                    }}
                    placeholder="0,00"
                    disabled={busy || !ticket}
                />

              </div>
            </div>

            <div>
              <label>Detalle</label>
              <input
                  value={ticket?.detalle ?? ""}
                  onChange={(e) => ticket && setTicket({ ...ticket, detalle: e.target.value })}
                  placeholder="Ej: Lagrima med + tos"
                  disabled={busy || !ticket}
              />
            </div>

            <div className="actions">
              <button className="primary" onClick={onSave} disabled={!ticket || !canSave || busy}>
                Guardar
              </button>
              <button className="secondary" onClick={resetAll} disabled={busy}>
                Otro ticket
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
