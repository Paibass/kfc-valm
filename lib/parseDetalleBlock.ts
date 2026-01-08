export type ParsedItem = { desc: string; amount: number };

function stripAccentsUpper(s: string) {
    return s
        .toUpperCase()
        .replace(/[ÁÀÄ]/g, "A")
        .replace(/[ÉÈË]/g, "E")
        .replace(/[ÍÌÏ]/g, "I")
        .replace(/[ÓÒÖ]/g, "O")
        .replace(/[ÚÙÜ]/g, "U");
}

function parseMoneyLoose(line: string): number | null {
    const m = line.match(/([0-9]{1,3}(?:[.\s][0-9]{3})*(?:[,\.\s][0-9]{2}))\s*\.?\s*$/);
    if (!m) return null;

    let raw = m[1].trim();

    // Con coma: coma decimal
    if (raw.includes(",")) {
        raw = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }

    // Caso "500 00"
    raw = raw.replace(/\s+/g, " ").trim();
    if (/\b\d+\s\d{2}$/.test(raw)) {
        raw = raw.replace(" ", ".");
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }

    // Caso "3.940.00" => miles + decimal
    const dotCount = (raw.match(/\./g) || []).length;
    if (dotCount >= 2) {
        const parts = raw.split(".");
        const dec = parts.pop()!;
        const int = parts.join("");
        raw = `${int}.${dec}`;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }

    raw = raw.replace(/\s/g, "");
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

function cleanDesc(line: string) {
    return line
        .replace(/\([^)]+\)/g, " ") // saca (21,00)
        .replace(/\s+/g, " ")
        .trim();
}

export function parseDetalleItems(ocrText: string): ParsedItem[] {
    const lines = ocrText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const upper = lines.map(stripAccentsUpper);

    const idxDetalle = upper.findIndex((l) => l.startsWith("DETALLE"));
    const idxTotal = upper.findIndex((l) => l.startsWith("TOTAL"));

    // --- Caso A: hay DETALLE y TOTAL
    if (idxDetalle !== -1 && idxTotal !== -1 && idxTotal > idxDetalle) {
        return sliceToItems(lines.slice(idxDetalle + 1, idxTotal));
    }

    // --- Caso B: NO hay DETALLE -> heurística:
    // arrancar cerca de CAJERO / N° DE TURNO y cortar cuando aparece TOTAL / PAGOS / IVA / CAE
    let start = upper.findIndex((l) => l.includes("N° DE TURNO") || l.includes("N DE TURNO"));
    if (start === -1) start = upper.findIndex((l) => l.includes("CAJERO"));
    if (start === -1) start = 0;

    const stopKeywords = ["TOTAL", "PAGOS", "IVA", "CAE"];
    let stop = upper.findIndex((l, i) => i > start && stopKeywords.some((k) => l.startsWith(k)));
    if (stop === -1) stop = Math.min(lines.length, start + 18);

    const candidate = lines.slice(start + 1, stop);
    const items = sliceToItems(candidate);

    // filtro: quedate con líneas que parecen productos (tienen dinero y alguna palabra)
    return items.filter((it) => /[A-ZÁÉÍÓÚ]/i.test(it.desc));
}

function sliceToItems(lines: string[]): ParsedItem[] {
    const items: ParsedItem[] = [];

    for (const l of lines) {
        const amount = parseMoneyLoose(l);
        if (amount == null) continue;

        const descNoMoney = l.replace(/([0-9]{1,3}(?:[.\s][0-9]{3})*(?:[,\.\s][0-9]{2}))\s*\.?\s*$/, "").trim();

        let desc = cleanDesc(descNoMoney);

        // saca el "1" al inicio si viene: "1 CAFE ..."
        desc = desc.replace(/^\d+\s+/, "").trim();

        if (!desc) continue;
        items.push({ desc, amount });
    }

    return items;
}
