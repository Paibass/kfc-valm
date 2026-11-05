import { NextResponse } from "next/server";
import { getLocalConfig } from "@/lib/local-config";

export async function GET() {
  try {
    return NextResponse.json(await getLocalConfig());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load local configuration";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Unauthorized" : message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
