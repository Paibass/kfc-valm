import { NextResponse } from "next/server";
import { getLocalSession } from "@/lib/local-auth";
import { getDbPool } from "@/lib/db";

async function requireLocal() {
  const session = await getLocalSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session.local_id;
}

export async function PATCH(request: Request) {
  try {
    const localId = await requireLocal();
    const body = await request.json();
    const pool = getDbPool();
    if (body.type === "local") {
      await pool.query("UPDATE locales SET nombre = COALESCE($1, nombre), lista_precios_id = $2 WHERE id = $3", [typeof body.nombre === "string" ? body.nombre.trim() : null, body.listaPreciosId || null, localId]);
    } else if (body.type === "cashier") {
      if (!Number.isInteger(body.id)) throw new Error("Invalid cashier");
      await pool.query("UPDATE cajeros SET nombre = $1, usuario_pos = $2, es_referente = $3 WHERE id = $4 AND local_id = $5", [body.nombre, body.usuarioPos || null, Boolean(body.esReferente), body.id, localId]);
    } else if (body.type === "price") {
      const result = await pool.query<{ lista_precios_id: number | null }>("SELECT lista_precios_id FROM locales WHERE id = $1", [localId]);
      const listId = result.rows[0]?.lista_precios_id;
      if (!listId || !Number.isFinite(Number(body.precio)) || Number(body.precio) < 0) throw new Error("Precio inválido");
      await pool.query("UPDATE precios_producto SET precio = $1 WHERE producto_id = (SELECT id FROM productos WHERE codigo = $2) AND lista_precios_id = $3 AND activo = TRUE", [Number(body.precio), body.codigo, listId]);
    } else if (body.type === "integration") {
      await pool.query(`INSERT INTO integraciones_local (local_id, google_form_action, apps_script_url, spreadsheet_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (local_id) DO UPDATE SET google_form_action = EXCLUDED.google_form_action, apps_script_url = EXCLUDED.apps_script_url, spreadsheet_url = EXCLUDED.spreadsheet_url`, [localId, body.googleFormAction || null, body.appsScriptUrl || null, body.spreadsheetUrl || null]);
    } else {
      throw new Error("Tipo de actualización inválido");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Unauthorized" : message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
