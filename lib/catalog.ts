export const normalize = (s: string) =>
    s
        .toUpperCase()
        .replace(/[ÁÀÄ]/g, "A")
        .replace(/[ÉÈË]/g, "E")
        .replace(/[ÍÌÏ]/g, "I")
        .replace(/[ÓÒÖ]/g, "O")
        .replace(/[ÚÙÜ]/g, "U")
        .replace(/\s+/g, " ")
        .trim();

export const BEBIDAS = [
    { key: "Cafe con leche", patterns: ["CAFE CON LECHE", "CAFE C/LECHE", "CAFE C LECHE", "CON LECHE"] },
    { key: "Iced latte vainilla", patterns: ["ICED LATTE VAINILLA", "ICE LATTE VAINILLA", "ICED VAINILLA LATT"] },
    { key: "Iced latte avellana", patterns: ["ICED LATTE AVELLANA", "ICE LATTE AVELLANA", "ICED AVELLANA LATT"] },
    { key: "Vainilla latte", patterns: ["VAINILLA LATTE", "VAINILLA LATT"] },
    { key: "Avellana latte", patterns: ["AVELLANA LATTE", "AVELLANA LATT"] },
    { key: "Capuchino", patterns: ["CAPPUCHINO", "CAPPUCCINO", "CAPUCHINO"] },
    { key: "Lagrima", patterns: ["LAGRIMA"] },
    { key: "Cortado", patterns: ["CORTADO"] },
    { key: "Chocolate", patterns: ["CHOCOLATE"] },
    { key: "Te", patterns: ["\\bTE\\b"] },
    { key: "Cafe", patterns: ["\\BCAFE\\b"] },
];

export const TAMANIOS = [
    { key: "ch", patterns: ["CHIC", "\\b8\\b"] },
    { key: "med", patterns: ["MEDIAN", "\\b12\\b"] },
];

export const EXTRAS = [
    { key: "+ tos", patterns: ["\\+\\s*TOS", "\\bTOS\\b"] },
    { key: "tostado", patterns: ["TOST"] },
    { key: "2 medialunas", patterns: ["\\b2\\s*MEDIALUN"] },
    { key: "3 medialunas", patterns: ["\\b3\\s*MEDIALUN"] },
];
