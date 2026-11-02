import { NextResponse } from "next/server";
import { getLocalSession } from "@/lib/local-auth";

export async function GET() {
  const session = await getLocalSession();
  return NextResponse.json({ authenticated: Boolean(session), local: session });
}
