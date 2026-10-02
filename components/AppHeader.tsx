"use client";

import { useState } from "react";
import { SideMenu } from "./SideMenu";

const SHEETS_URL = "https://docs.google.com/spreadsheets/d/1JoJCl0i5Q3WHTc5jzhQM9Om4BPS9Wa_dYTdqU1RhOUw/edit?usp=sharing";

interface AppHeaderProps {
  dailyStats?: { ventas: number | null; objetivo: number | null; dif: number | null } | null;
  loadingDailyStats?: boolean;
}

export function AppHeader({ dailyStats, loadingDailyStats = false }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="topbar">
        <button type="button" className="menuBtn" onClick={() => setMenuOpen(true)} aria-label="Abrir menú" aria-expanded={menuOpen}>
          <span /><span /><span />
        </button>
        <div className="brand">
          <div className="logoBox">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="Logo KFC" className="logoImg" />
          </div>
          <strong className="brandTitle">KFC LINIERS VALM</strong>
        </div>
        {dailyStats !== undefined && <div className="dailyStatsChip">{loadingDailyStats ? <span className="statsLoading">...</span> : dailyStats && dailyStats.objetivo !== null ? <><span className="statsCount">{dailyStats.ventas ?? 0} / {dailyStats.objetivo}</span>{dailyStats.dif !== null && <span className={`statsDif ${dailyStats.dif >= 0 ? "positive" : "negative"}`}>{dailyStats.dif >= 0 ? "+" : ""}{dailyStats.dif}</span>}</> : <span className="statsNoData">Sin objetivo</span>}</div>}
        <a className="sheetBtn" href={SHEETS_URL} target="_blank" rel="noreferrer" aria-label="Abrir Google Sheets" title="Abrir Google Sheets">↗</a>
      </header>
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
