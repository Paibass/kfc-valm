export interface DailyStats {
  ok: boolean;
  dia: string;
  objetivo: number | null;
  ventas: number | null;
  dif: number | null;
  difAcumulada: number | null;
}

/**
 * Converts ISO date (yyyy-mm-dd) to Spanish short format (d/M/yyyy)
 * @param isoDate - Date in format "2026-06-01"
 * @returns Date in format "1/6/2026"
 */
function formatDateForQuery(isoDate: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const [yyyy, mm, dd] = parts;
  // Remove leading zeros for day and month
  const day = parseInt(dd, 10).toString();
  const month = parseInt(mm, 10).toString();
  return `${day}/${month}/${yyyy}`;
}

/**
 * Fetches daily stats from Google Sheets via the API endpoint
 * @param isoFecha - Date in ISO format (yyyy-mm-dd)
 */
export async function fetchDailyStats(isoFecha: string): Promise<DailyStats> {
  const queryDate = formatDateForQuery(isoFecha);
  
  const response = await fetch(`/api/daily-stats?fecha=${encodeURIComponent(queryDate)}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch daily stats");
  }
  
  return response.json();
}
