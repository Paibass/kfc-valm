import type { CatalogProduct, LocalCashier, LocalConfig } from "@/lib/local-config";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No se pudo cargar la configuración");
  return data as T;
}

export function fetchLocalConfig() { return getJson<LocalConfig>("/api/local-config"); }
export function fetchLocalCashiers() { return getJson<{ cashiers: LocalCashier[] }>("/api/local-config/cashiers"); }
export function fetchLocalCatalog() { return getJson<{ products: CatalogProduct[]; configured: boolean; error?: string }>("/api/local-config/catalog"); }
