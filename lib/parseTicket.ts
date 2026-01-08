import { parseDetalleItems } from "./parseDetalleBlock";
import { buildDetalleFromItems } from "./detalle";
import { detectCajeroLabelFromOcr } from "./cajeros";




export type TicketData = {
    fecha: string;
    chk4: string;
    cajero: string;
    detalle: string;
    total: string;
    raw: string;
};

function normalizeOcr(s: string) {
    return s
        .replace(/(\d)\s+(\d)/g, "$1$2")
        .replace(/[—–]/g, "-")
        .replace(/\t/g, " ")
        .replace(/[ ]{2,}/g, " ")
        .trim();
}

function findNear(text: string, anchorRe: RegExp, window = 220) {
    const m = text.match(anchorRe);
    if (!m || m.index == null) return "";
    const start = Math.max(0, m.index - Math.floor(window / 2));
    const end = Math.min(text.length, m.index + window);
    return text.slice(start, end);
}

function pickFirst(text: string, re: RegExp, group = 1) {
    const m = text.match(re);
    return m ? (m[group] ?? "").trim() : "";
}

function extractFecha(raw: string) {
    const near = findNear(raw, /\bFECHA\b/i, 170);
    return pickFirst(near, /(\d{2}\/\d{2}\/\d{4})/) || pickFirst(raw, /(\d{2}\/\d{2}\/\d{4})/);
}

function stripAccentsUpper(s: string) {
    return s
        .toUpperCase()
        .replace(/[ÁÀÄ]/g, "A")
        .replace(/[ÉÈË]/g, "E")
        .replace(/[ÍÌÏ]/g, "I")
        .replace(/[ÓÒÖ]/g, "O")
        .replace(/[ÚÙÜ]/g, "U");
}


function extractTotal(raw: string) {
    // Encuentra montos tipo 3.940,00 / 3940,00 / 3940.00 / 3.940 00
    const re = /([0-9]{1,3}(?:[.\s][0-9]{3})*(?:[,\.\s][0-9]{2}))/g;
    const hits: { text: string; idx: number; value: number }[] = [];

    const toNumber = (t: string) => {
        let s = t.trim();
        if (s.includes(",")) {
            s = s.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
            return Number(s);
        }
        s = s.replace(/\s+/g, " ").trim();
        if (/\b\d+\s\d{2}$/.test(s)) s = s.replace(" ", ".");
        // 3.940.00 => 3940.00
        const dotCount = (s.match(/\./g) || []).length;
        if (dotCount >= 2) {
            const parts = s.split(".");
            const dec = parts.pop()!;
            s = parts.join("") + "." + dec;
        }
        s = s.replace(/\s/g, "");
        return Number(s);
    };

    let m: RegExpExecArray | null;
    while ((m = re.exec(raw)) !== null) {
        const text = m[1];
        const value = toNumber(text);
        if (Number.isFinite(value)) hits.push({ text, idx: m.index, value });
    }
    if (!hits.length) return "";

    // Preferir montos "grandes" (evita IVA, 500,00, etc.)
    const big = hits.filter(h => h.value >= 1500);
    const pool = big.length ? big : hits;

    // Elegir el que aparece más al final del ticket
    pool.sort((a, b) => b.idx - a.idx);
    return pool[0].text.trim().replace(/\s(\d{2})$/, ",$1"); // normaliza 3940 00 => 3940,00
}
function extractChk4(raw: string) {
    // Busca K143F000072394 (o variantes) en todo el texto
    const m =
        raw.match(/\bK\d{2,4}[A-Z]\d{6,}\b/i) ||  // K143F000072394
        raw.match(/\bK\d{2,4}\d{6,}\b/i);        // K143000072394 (si se come la letra)

    const token = m?.[0] ?? "";
    const digits = token.replace(/[^0-9]/g, "");
    return digits ? digits.slice(-4) : "";
}



export function parseTicketFromOcr(ocrText: string): TicketData {
    const raw = normalizeOcr(ocrText);

    const fecha = extractFecha(raw);
    const chk4 = extractChk4(raw);

    const total = extractTotal(raw);
    const cajero = detectCajeroLabelFromOcr(raw);
    const items = parseDetalleItems(raw);
    const detalle = items.length ? buildDetalleFromItems(items) : "";

    return { fecha, chk4, cajero, detalle, total, raw };
}
