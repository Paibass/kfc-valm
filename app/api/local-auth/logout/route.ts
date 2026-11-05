import { NextResponse } from "next/server";
import { logoutLocal } from "@/lib/local-auth";

export async function POST() {
  await logoutLocal();
  return NextResponse.json({ ok: true });
}
