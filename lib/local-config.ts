import { getDbPool } from "@/lib/db";
import { getLocalSession } from "@/lib/local-auth";
import { resolveLocalProductPrices } from "@/lib/local-pricing";

export interface LocalConfig {
  id: number;
  codigo: string;
  nombre: string;
  listaPreciosId: number | null;
  referente: { id: number; nombre: string } | null;
  integraciones: {
    googleFormAction: string;
    appsScriptUrl: string;
    spreadsheetUrl: string;
    formFields: {
      fecha: string;
      chk4: string;
      cajero: string;
      detalle: string;
      total: string;
    };
  };
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
    google_form_action: string | null;
    apps_script_url: string | null;
    spreadsheet_url: string | null;
    google_form_fields: unknown;
  }>(
    `SELECT l.id, l.codigo, l.nombre, l.lista_precios_id,
            r.id AS referente_id, r.nombre AS referente_nombre,
            i.google_form_action, i.apps_script_url, i.spreadsheet_url, i.google_form_fields
       FROM locales l
       LEFT JOIN cajeros r ON r.local_id = l.id AND r.activo = TRUE AND r.es_referente = TRUE
       LEFT JOIN integraciones_local i ON i.local_id = l.id
      WHERE l.id = $1 AND l.activo = TRUE`,
    [localId],
  );
  const row = result.rows[0];
  if (!row) throw new Error("LOCAL_NOT_FOUND");
  const rawFields = row.google_form_fields && typeof row.google_form_fields === "object" ? row.google_form_fields as Record<string, unknown> : {};
  const formFields = {
    fecha: typeof rawFields.fecha === "string" ? rawFields.fecha : "",
    chk4: typeof rawFields.chk4 === "string" ? rawFields.chk4 : "",
    cajero: typeof rawFields.cajero === "string" ? rawFields.cajero : "",
    detalle: typeof rawFields.detalle === "string" ? rawFields.detalle : "",
    total: typeof rawFields.total === "string" ? rawFields.total : "",
  };
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    listaPreciosId: row.lista_precios_id,
    referente: row.referente_id ? { id: row.referente_id, nombre: row.referente_nombre ?? "" } : null,
    integraciones: {
      googleFormAction: row.google_form_action ?? "",
      appsScriptUrl: row.apps_script_url ?? "",
      spreadsheetUrl: row.spreadsheet_url ?? "",
      formFields,
    },
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
  const rows = await resolveLocalProductPrices(config.id);
  const products = rows.map((row) => ({ id: row.codigo, nombre: row.nombre, categoria: row.categoria, tipo: row.tipo, precio: Number(row.precio) }));
  const missing = await getDbPool().query<{ count: string }>(
    `SELECT count(*)::text AS count FROM productos p
      LEFT JOIN locales l ON l.id = $1 AND l.activo = TRUE
      LEFT JOIN precios_producto pp ON pp.producto_id = p.id AND pp.lista_precios_id = l.lista_precios_id AND pp.activo = TRUE
      LEFT JOIN precios_excepciones pe ON pe.producto_id = p.id AND pe.local_id = l.id AND pe.activo = TRUE
     WHERE p.activo = TRUE AND COALESCE(pe.precio, pp.precio) IS NULL`,
    [config.id],
  );
  const configured = Number(missing.rows[0]?.count ?? 0) === 0;
  return { products, configured, ...(configured ? {} : { error: "Algunos productos activos no tienen un precio válido y no están disponibles para la venta." }) };
}
