import { NextResponse } from "next/server";
import { changeLocalPassword } from "@/lib/local-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  const changed = await changeLocalPassword(currentPassword, newPassword);
  if (!changed) return NextResponse.json({ error: "No se pudo cambiar la contraseña" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
