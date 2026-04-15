import type { TicketData } from "./parseTicket";

const FORM_ACTION = process.env.NEXT_PUBLIC_GOOGLE_FORM_ACTION!;

/**
 * Converts ISO date (yyyy-mm-dd) to Spanish format (dd/mm/yyyy)
 * Returns clean string without any leading characters
 * @param isoDate - Date in format "2026-04-13"
 * @returns Date in format "13/04/2026"
 */
function formatDateToSpanish(isoDate: string): string {
  if (!isoDate) return "";
  // Clean input: trim and remove any unexpected characters
  const cleanInput = isoDate.trim();
  const parts = cleanInput.split("-");
  if (parts.length !== 3) return cleanInput;
  const [yyyy, mm, dd] = parts;
  // Return clean formatted date without any prefix
  return [dd, mm, yyyy].join("/");
}

const ENTRY = {
    fecha:   "entry.133549451",
    chk4:    "entry.978360335",
    cajero:  "entry.237002527",
    detalle: "entry.529180955",
    total:   "entry.718068187",
};

export async function submitToGoogleForm(t: TicketData) {
    if (!FORM_ACTION) throw new Error("Falta NEXT_PUBLIC_GOOGLE_FORM_ACTION en .env.local");

    const data = new URLSearchParams();
    data.append(ENTRY.fecha, formatDateToSpanish(t.fecha || ""));
    data.append(ENTRY.chk4, t.chk4 || "");
    data.append(ENTRY.cajero, t.cajero || "");
    data.append(ENTRY.detalle, t.detalle || "");
    data.append(ENTRY.total, t.total || "");

    // Forms no devuelve CORS => no-cors (se guarda igual)
    await fetch(FORM_ACTION, { method: "POST", mode: "no-cors", body: data });
}
