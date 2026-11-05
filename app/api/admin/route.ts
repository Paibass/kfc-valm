import { NextResponse } from "next/server";
import { getLocalSession } from "@/lib/local-auth";
import { getDbPool } from "@/lib/db";

async function requireLocal() {
  const session = await getLocalSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session.local_id;
}

function normalizedName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

async function hasDuplicate(pool: ReturnType<typeof getDbPool>, localId: number, name: string, exceptId?: number) {
  const result = await pool.query<{ id: number }>(
    `SELECT id FROM cajeros WHERE local_id = $1 AND activo = TRUE AND lower(nombre) = lower($2) ${exceptId ? "AND id <> $3" : ""} LIMIT 1`,
    exceptId ? [localId, name, exceptId] : [localId, name],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function GET() {
  try {
    const localId = await requireLocal();
    const result = await getDbPool().query(
      "SELECT id, nombre, es_referente FROM cajeros WHERE local_id = $1 AND activo = TRUE ORDER BY nombre",
      [localId],
    );
    return NextResponse.json({ cashiers: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Unauthorized" : message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const localId = await requireLocal();
    const body = await request.json();
    const nombre = normalizedName(body.nombre);
    if (!nombre) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    const pool = getDbPool();
    if (await hasDuplicate(pool, localId, nombre)) return NextResponse.json({ error: "Ya existe un cajero con ese nombre" }, { status: 409 });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (body.esReferente === true) await client.query("UPDATE cajeros SET es_referente = FALSE WHERE local_id = $1 AND activo = TRUE", [localId]);
      const result = await client.query("INSERT INTO cajeros (local_id, nombre, es_referente, activo) VALUES ($1, $2, $3, TRUE) RETURNING id, nombre, es_referente", [localId, nombre, body.esReferente === true]);
      await client.query("COMMIT");
      return NextResponse.json({ cashier: result.rows[0] }, { status: 201 });
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el cajero";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Unauthorized" : message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const localId = await requireLocal();
    const body = await request.json();
    const id = Number(body.id);
    const nombre = normalizedName(body.nombre);
    if (!Number.isInteger(id) || id <= 0 || !nombre) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const pool = getDbPool();
    if (await hasDuplicate(pool, localId, nombre, id)) return NextResponse.json({ error: "Ya existe un cajero con ese nombre" }, { status: 409 });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (body.esReferente === true) await client.query("UPDATE cajeros SET es_referente = FALSE WHERE local_id = $1 AND activo = TRUE AND id <> $2", [localId, id]);
      const result = await client.query("UPDATE cajeros SET nombre = $1, es_referente = $2 WHERE id = $3 AND local_id = $4 AND activo = TRUE RETURNING id, nombre, es_referente", [nombre, body.esReferente === true, id, localId]);
      if (result.rowCount === 0) { await client.query("ROLLBACK"); return NextResponse.json({ error: "Cajero no encontrado" }, { status: 404 }); }
      await client.query("COMMIT");
      return NextResponse.json({ cashier: result.rows[0] });
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el cajero";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Unauthorized" : message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const localId = await requireLocal();
    const { id } = await request.json();
    if (!Number.isInteger(Number(id))) return NextResponse.json({ error: "Cajero inválido" }, { status: 400 });
    const result = await getDbPool().query("UPDATE cajeros SET activo = FALSE, es_referente = FALSE WHERE id = $1 AND local_id = $2 AND activo = TRUE RETURNING id", [Number(id), localId]);
    if (result.rowCount === 0) return NextResponse.json({ error: "Cajero no encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar el cajero";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Unauthorized" : message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
