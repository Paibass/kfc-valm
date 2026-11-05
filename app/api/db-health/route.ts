import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export async function GET() {
  try {
    const result = await getDbPool().query<{ ok: boolean }>("SELECT TRUE AS ok");
    return NextResponse.json({ ok: result.rows[0]?.ok === true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
