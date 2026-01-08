import { BEBIDAS, EXTRAS, TAMANIOS, normalize } from "./catalog";
import type { ParsedItem } from "./parseDetalleBlock";

const has = (text: string, pattern: string) => new RegExp(pattern, "i").test(text);

function matchFirst(catalog: { key: string; patterns: string[] }[], blob: string) {
    for (const item of catalog) {
        for (const p of item.patterns) if (has(blob, p)) return item.key;
    }
    return "";
}

function detectShop(blob: string) {
    const isShop = has(blob, "\\bSHOP\\b") || has(blob, "\\bSHO\\b");
    const ozMatch = blob.match(/\b(8|12)\b/);
    const oz = ozMatch ? ozMatch[1] : "";
    return { isShop, oz };
}

export function buildDetalleKFC(baseDesc: string, modsDescs: string[]) {
    const blob = normalize([baseDesc, ...modsDescs].join(" "));
    const { isShop, oz } = detectShop(blob);

    const bebida = matchFirst(BEBIDAS, blob) || "Cafe";
    const size = matchFirst(TAMANIOS, blob);

    const extras: string[] = [];
    for (const exKey of ["tostado", "2 medialunas", "3 medialunas", "+ tos"]) {
        const ex = EXTRAS.find(e => e.key === exKey)!;
        if (ex.patterns.some(p => has(blob, p))) extras.push(ex.key);
    }

    if (isShop && !extras.includes("tostado")) extras.unshift("tostado");

    const core = [bebida, size].filter(Boolean).join(" ").trim();
    const tail = extras.length ? " " + extras.join(" ") : "";

    if (isShop) {
        const prefix = oz ? `SHOP ${oz}: ` : "SHOP: ";
        return (prefix + core + tail).trim();
    }
    return (core + tail).trim();
}

export function buildDetalleFromItems(items: ParsedItem[]) {
    if (!items.length) return "";

    const nonZero = items.filter(i => i.amount > 0);

    const base = nonZero.length
        ? [...nonZero].sort((a, b) => b.amount - a.amount)[0]
        : items[0];

    const upgrades = nonZero
        .filter(i => i !== base && i.amount > 0 && i.amount <= 1000)
        .sort((a, b) => b.amount - a.amount);

    let baseDesc = base.desc;

    for (const up of upgrades) {
        const upBlob = normalize(up.desc);
        const upBebida = matchFirst(BEBIDAS, upBlob);
        if (upBebida) {
            baseDesc = `${up.desc} ${baseDesc}`;
            break;
        }
    }

    const allDescs = items.map(i => i.desc);
    return buildDetalleKFC(baseDesc, allDescs);
}
