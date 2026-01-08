export const CAJEROS = [
    { label: "Franco", user: "d.amato.franco" },
    { label: "Vanina", user: "retuerto.vainina" },
    { label: "Paiva", user: "paiva.joaquin" },
    { label: "Mia Q", user: "quiroz.mia" },
    { label: "Mia M", user: "machado.mia" },
    { label: "Santi", user: "crinigan.santiago" },
    { label: "Kiara", user: "isasi.kiara" },
    { label: "Lara", user: "mazza.lara" },
];

function norm(s: string) {
    return (s || "")
        .toLowerCase()
        .replace(/[áàä]/g, "a")
        .replace(/[éèë]/g, "e")
        .replace(/[íìï]/g, "i")
        .replace(/[óòö]/g, "o")
        .replace(/[úùü]/g, "u")
        .replace(/[^a-z0-9.]+/g, "") // deja letras, números y puntos
        .replace(/\.+/g, ".")
        .replace(/^\.|\.$/g, "");
}

// Devuelve el label (Franco, Santi...) si encuentra coincidencia
export function detectCajeroLabelFromOcr(ocrText: string): string | "" {
    const haystack = norm(ocrText);

    // 1) match fuerte por user completo
    for (const c of CAJEROS) {
        const u = norm(c.user);
        if (haystack.includes(u)) return c.label;
    }

    // 2) match por tokens (apellido + nombre) aunque OCR ponga espacios/puntos raros
    for (const c of CAJEROS) {
        const tokens = norm(c.user).split(".").filter(Boolean); // ej: ["d","amato","franco"]
        // pedimos al menos 2 tokens relevantes (amato + franco)
        const hits = tokens.filter(t => t.length >= 3 && haystack.includes(t)).length;
        if (hits >= 2) return c.label;
    }

    return "";
}
