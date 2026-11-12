import { getDbPool } from "@/lib/db";

export type PricedProduct = { codigo: string; nombre: string; categoria: string; tipo: string; precio: string };

export async function resolveLocalProductPrices(localId: number, productCodes?: string[]): Promise<PricedProduct[]> {
  const pool = getDbPool();
  const result = await pool.query<PricedProduct>(
    `SELECT p.codigo, p.nombre, p.categoria, p.tipo,
            COALESCE(pe.precio, pp.precio)::numeric(12,2)::text AS precio
       FROM productos p
       JOIN locales l ON l.id = $1 AND l.activo = TRUE
       LEFT JOIN precios_producto pp ON pp.producto_id = p.id
        AND pp.lista_precios_id = l.lista_precios_id AND pp.activo = TRUE
       LEFT JOIN precios_excepciones pe ON pe.local_id = l.id
        AND pe.producto_id = p.id AND pe.activo = TRUE
      WHERE p.activo = TRUE
        AND ($2::text[] IS NULL OR p.codigo = ANY($2::text[]))
        AND COALESCE(pe.precio, pp.precio) IS NOT NULL
      ORDER BY p.id ASC`,
    [localId, productCodes ?? null],
  );
  return result.rows;
}

export function priceToCents(value: string): bigint | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return null;
  return BigInt(match[1]) * BigInt(100) + BigInt((match[2] ?? "").padEnd(2, "0"));
}
