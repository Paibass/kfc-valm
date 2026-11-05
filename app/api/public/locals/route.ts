import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export async function GET() {
  const result = await getDbPool().query<{ codigo: string; nombre: string }>(
    "SELECT codigo, nombre FROM locales WHERE activo = TRUE ORDER BY nombre ASC",
  );
  return NextResponse.json({ locals: result.rows });
}
