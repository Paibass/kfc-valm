"use client";

import Link from "next/link";
import { useEffect } from "react";

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
}

export function SideMenu({ open, onClose }: SideMenuProps) {
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
          <a href="https://docs.google.com/spreadsheets/d/1JoJCl0i5Q3WHTc5jzhQM9Om4BPS9Wa_dYTdqU1RhOUw/edit?usp=sharing" target="_blank" rel="noreferrer" onClick={onClose} className="sideMenuLink"><span aria-hidden="true">↗</span>Abrir planilla</a>
        </nav>
      </aside>
    </div>
  );
}
