import { NextResponse } from "next/server";
import { loginLocal } from "@/lib/local-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const codigo = typeof body.codigo === "string" ? body.codigo : "";
  const password = typeof body.password === "string" ? body.password : "";
  const local = await loginLocal(codigo, password);
  if (!local) return NextResponse.json({ error: "Local o contraseña incorrectos" }, { status: 401 });
  return NextResponse.json({ local: { codigo: local.codigo, nombre: local.nombre } });
}
