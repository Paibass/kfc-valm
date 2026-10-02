import { NextResponse } from "next/server";

const SCRIPT_URL = process.env.DAILY_STATS_SCRIPT_URL;

export async function GET(request: Request) {
  const mes = new URL(request.url).searchParams.get("mes");
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return NextResponse.json({ ok: false, error: "Missing or invalid mes parameter" }, { status: 400 });
  }
  if (!SCRIPT_URL) {
    return NextResponse.json({ ok: false, error: "Missing DAILY_STATS_SCRIPT_URL env var" }, { status: 500 });
  }
  try {
    const response = await fetch(`${SCRIPT_URL}?action=ranking&mes=${encodeURIComponent(mes)}`, { cache: "no-store" });
    const text = await response.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: response.ok ? 200 : response.status });
    } catch {
      return NextResponse.json({ ok: false, error: "Apps Script did not return JSON" }, { status: 502 });
    }
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to fetch ranking" }, { status: 502 });
  }
}
