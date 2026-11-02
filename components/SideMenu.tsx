"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
}

export function SideMenu({ open, onClose }: SideMenuProps) {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");

  useEffect(() => {
    if (open) fetch("/api/local-config", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => setSpreadsheetUrl(data?.integraciones?.spreadsheetUrl ?? "")).catch(() => setSpreadsheetUrl(""));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawerLayer" role="presentation" onMouseDown={onClose}>
      <aside className="sideMenu" role="dialog" aria-modal="true" aria-label="Navegación" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sideMenuHeader">
          <strong>Menú</strong>
          <button type="button" className="drawerClose" onClick={onClose} aria-label="Cerrar menú">×</button>
        </div>
        <nav className="sideMenuNav">
          <Link href="/" onClick={onClose} className="sideMenuLink"><span aria-hidden="true">▣</span>Cargar tickets</Link>
          <Link href="/ranking" onClick={onClose} className="sideMenuLink"><span aria-hidden="true">★</span>Ranking mensual</Link>
          {spreadsheetUrl && <a href={spreadsheetUrl} target="_blank" rel="noreferrer" onClick={onClose} className="sideMenuLink"><span aria-hidden="true">↗</span>Abrir planilla</a>}
          <Link href="/admin" onClick={onClose} className="sideMenuLink"><span aria-hidden="true">⚙</span>Gestionar cajeros</Link>
          <button type="button" className="sideMenuLink sideMenuAction" onClick={async () => { await fetch("/api/local-auth/logout", { method: "POST" }); window.location.href = "/login"; }}><span aria-hidden="true">↪</span>Cerrar sesión</button>
        </nav>
      </aside>
    </div>
  );
}
