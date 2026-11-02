import { NextResponse } from "next/server";
import { getLocalConfig } from "@/lib/local-config";

export async function GET(request: Request) {
  const mes = new URL(request.url).searchParams.get("mes");
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) return NextResponse.json({ ok: false, error: "Missing or invalid mes parameter" }, { status: 400 });
  try {
    const { appsScriptUrl } = (await getLocalConfig()).integraciones;
    if (!appsScriptUrl) return NextResponse.json({ ok: false, error: "Este local no tiene ranking configurado" }, { status: 409 });
    const response = await fetch(`${appsScriptUrl}?action=ranking&mes=${encodeURIComponent(mes)}`, { cache: "no-store" });
    const text = await response.text();
    try { return NextResponse.json(JSON.parse(text), { status: response.ok ? 200 : 502 }); }
    catch { return NextResponse.json({ ok: false, error: "Apps Script did not return JSON" }, { status: 502 }); }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch ranking";
    return NextResponse.json({ ok: false, error: message === "UNAUTHORIZED" ? "Unauthorized" : message }, { status: message === "UNAUTHORIZED" ? 401 : 502 });
  }
}
