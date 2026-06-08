import { NextResponse } from "next/server";

const DAILY_STATS_URL = process.env.DAILY_STATS_SCRIPT_URL!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get("fecha");

  if (!fecha) {
    return NextResponse.json(
      { ok: false, error: "Missing fecha parameter" },
      { status: 400 }
    );
  }

  try {
    const url = `${DAILY_STATS_URL}?fecha=${encodeURIComponent(fecha)}`;

    const response = await fetch(url, {
      cache: "no-store"
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch daily stats" },
      { status: 500 }
    );
  }
}