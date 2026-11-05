import { NextResponse } from "next/server";
import { getLocalCashiers } from "@/lib/local-config";

export async function GET() {
  try {
    return NextResponse.json({ cashiers: await getLocalCashiers() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load cashiers";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Unauthorized" : message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
