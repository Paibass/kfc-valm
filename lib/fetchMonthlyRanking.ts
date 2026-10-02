export interface RankingItem {
  puesto: number;
  cajero: string;
  tickets: number;
  porcentaje: number;
}

export interface MonthlyRanking {
  ok: boolean;
  mes: string;
  totalTickets: number;
  cantidadCajeros: number;
  ranking: RankingItem[];
}

export async function fetchMonthlyRanking(mes: string): Promise<MonthlyRanking> {
  const response = await fetch(`/api/ranking?mes=${encodeURIComponent(mes)}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo cargar el ranking");
  return data as MonthlyRanking;
}
