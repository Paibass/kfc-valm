import { NextResponse } from "next/server";
import { getLocalCatalog } from "@/lib/local-config";

export async function GET() {
  try {
    return NextResponse.json(await getLocalCatalog());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load catalog";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Unauthorized" : message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
