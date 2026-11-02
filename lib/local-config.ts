import { getDbPool } from "@/lib/db";
import { getLocalSession } from "@/lib/local-auth";

export interface LocalConfig {
  id: number;
  codigo: string;
  nombre: string;
  listaPreciosId: number | null;
  referente: { id: number; nombre: string } | null;
}

export interface LocalCashier {
  id: number;
  nombre: string;
  usuarioPos: string | null;
  esReferente: boolean;
}

export interface CatalogProduct {
  id: string;
  categoria: string;
  nombre: string;
  precio: number;
  tipo: string;
}

async function getAuthenticatedLocalId() {
  const session = await getLocalSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session.local_id;
}

export async function getLocalConfig(): Promise<LocalConfig> {
  const localId = await getAuthenticatedLocalId();
  const pool = getDbPool();
  const result = await pool.query<{
    id: number;
    codigo: string;
    nombre: string;
    lista_precios_id: number | null;
    referente_id: number | null;
    referente_nombre: string | null;
  }>(
    `SELECT l.id, l.codigo, l.nombre, l.lista_precios_id,
            r.id AS referente_id, r.nombre AS referente_nombre
       FROM locales l
       LEFT JOIN cajeros r ON r.local_id = l.id AND r.activo = TRUE AND r.es_referente = TRUE
      WHERE l.id = $1 AND l.activo = TRUE`,
    [localId],
  );
  const row = result.rows[0];
  if (!row) throw new Error("LOCAL_NOT_FOUND");
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    listaPreciosId: row.lista_precios_id,
    referente: row.referente_id ? { id: row.referente_id, nombre: row.referente_nombre ?? "" } : null,
  };
}

export async function getLocalCashiers(): Promise<LocalCashier[]> {
  const localId = await getAuthenticatedLocalId();
  const result = await getDbPool().query<{
    id: number;
    nombre: string;
    usuario_pos: string | null;
    es_referente: boolean;
  }>(
    `SELECT id, nombre, usuario_pos, es_referente
       FROM cajeros
      WHERE local_id = $1 AND activo = TRUE
      ORDER BY nombre ASC`,
    [localId],
  );
  return result.rows.map((row) => ({ id: row.id, nombre: row.nombre, usuarioPos: row.usuario_pos, esReferente: row.es_referente }));
}

export async function getLocalCatalog(): Promise<{ products: CatalogProduct[]; configured: boolean; error?: string }> {
  const config = await getLocalConfig();
  if (!config.listaPreciosId) return { products: [], configured: false, error: "El local no tiene una lista de precios asignada." };
  const result = await getDbPool().query<{
    codigo: string;
    nombre: string;
    categoria: string;
    tipo: string;
    precio: string;
  }>(
    `SELECT p.codigo, p.nombre, p.categoria, p.tipo, pp.precio::text AS precio
       FROM productos p
       JOIN precios_producto pp ON pp.producto_id = p.id
        AND pp.lista_precios_id = $1 AND pp.activo = TRUE
      WHERE p.activo = TRUE
      ORDER BY p.id ASC`,
    [config.listaPreciosId],
  );
  const products = result.rows.map((row) => ({ id: row.codigo, nombre: row.nombre, categoria: row.categoria, tipo: row.tipo, precio: Number(row.precio) }));
  const count = await getDbPool().query<{ count: string }>("SELECT count(*)::text AS count FROM productos WHERE activo = TRUE", []);
  if (products.length !== Number(count.rows[0]?.count ?? 0)) return { products, configured: false, error: "La lista de precios no está completa para todos los productos activos." };
  return { products, configured: true };
}
