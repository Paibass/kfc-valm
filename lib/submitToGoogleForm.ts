import type { TicketData } from "./parseTicket";

const FORM_ACTION = process.env.NEXT_PUBLIC_GOOGLE_FORM_ACTION!;

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
    data.append(ENTRY.fecha, t.fecha || "");
    data.append(ENTRY.chk4, t.chk4 || "");
    data.append(ENTRY.cajero, t.cajero || "");
    data.append(ENTRY.detalle, t.detalle || "");
    data.append(ENTRY.total, t.total || "");

    // Forms no devuelve CORS => no-cors (se guarda igual)
    await fetch(FORM_ACTION, { method: "POST", mode: "no-cors", body: data });
}
