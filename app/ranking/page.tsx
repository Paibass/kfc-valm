"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { fetchMonthlyRanking, type MonthlyRanking, type RankingItem } from "@/lib/fetchMonthlyRanking";

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(`${value}-01T12:00:00`));
}

function RankingRow({ item, position }: { item: RankingItem; position: number }) {
  const medal = ["🥇", "🥈", "🥉"][position - 1];
  return <li className="rankingRow"><span className="rankingPosition">{medal || `${position}`}</span><span className="rankingName">{item.cajero}</span><strong className="rankingTickets">{item.tickets} TK</strong></li>;
}

export default function RankingPage() {
  const [mes, setMes] = useState(currentMonth);
  const [data, setData] = useState<MonthlyRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { setData(await fetchMonthlyRanking(mes)); } catch { setData(null); setError(true); } finally { setLoading(false); }
  }, [mes]);

  useEffect(() => { load(); }, [load]);

  const { paiva, competitors } = useMemo(() => {
    const items = data?.ranking ?? [];
    const referente = items.find((item) => item.cajero === "Paiva") ?? { puesto: 0, cajero: "Paiva", tickets: 0, porcentaje: 0 };
    return { paiva: referente, competitors: items.filter((item) => item.cajero !== "Paiva").sort((a, b) => b.tickets - a.tickets) };
  }, [data]);

  return <div className="container rankingPage">
    <AppHeader />
    <main className="section">
      <div className="rankingIntro">
        <p className="eyebrow">Equipo VALM</p>
        <h1>Ranking mensual</h1>
        <label className="monthLabel" htmlFor="ranking-month">Mes</label>
        <input id="ranking-month" className="monthInput" type="month" value={mes} onChange={(event) => setMes(event.target.value)} />
        {data && <p className="rankingSummary">Ranking · {formatMonth(mes)}<span>Total mensual: {data.totalTickets} TK</span></p>}
      </div>

      {loading ? <ul className="rankingList rankingSkeleton" aria-label="Cargando ranking">{[1, 2, 3, 4, 5].map((item) => <li key={item}><span /><span /><span /></li>)}</ul> : error ? <div className="rankingState"><p>No se pudo cargar el ranking.</p><button className="primary retryButton" onClick={load}>Reintentar</button></div> : competitors.length === 0 ? <div className="rankingState"><p>No hay tickets registrados para este mes.</p></div> : <ul className="rankingList">{competitors.map((item, index) => <RankingRow key={item.cajero} item={item} position={index + 1} />)}</ul>}

      <section className="referenteSection" aria-labelledby="referente-title">
        <p className="eyebrow" id="referente-title">Referente</p>
        <div className="referenteRow"><span>{paiva.cajero}</span><strong>{paiva.tickets} TK</strong></div>
      </section>
    </main>
  </div>;
}
