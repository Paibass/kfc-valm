import { NextResponse } from "next/server"

const DAILY_STATS_URL = process.env.DAILY_STATS_SCRIPT_URL

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fecha = searchParams.get("fecha")

  if (!fecha) {
    return NextResponse.json({ ok: false, error: "Missing fecha parameter" }, { status: 400 })
  }

  if (!DAILY_STATS_URL) {
    return NextResponse.json({
      ok: false,
      error: "Missing DAILY_STATS_SCRIPT_URL env var",
    }, { status: 500 })
  }

  try {
    const url = `${DAILY_STATS_URL}?fecha=${encodeURIComponent(fecha)}`
    const response = await fetch(url, { cache: "no-store" })

    const text = await response.text()

    try {
      const data = JSON.parse(text)
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({
        ok: false,
        error: "Apps Script did not return JSON",
        status: response.status,
        bodyPreview: text.slice(0, 300),
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: "Failed to fetch daily stats",
      detail: error?.message ?? String(error),
    }, { status: 500 })
  }
}