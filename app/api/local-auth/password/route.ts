import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Esta operación solo puede realizarla el administrador del sistema" }, { status: 403 });
}
