import { NextResponse } from "next/server";

// Google Sheets API endpoint for reading the daily stats sheet
// The sheet should be published to web as CSV or use Google Sheets API
const SHEET_ID = "1JoJCl0i5Q3WHTc5jzhQM9Om4BPS9Wa_dYTdqU1RhOUw";
const SHEET_GID = process.env.DAILY_STATS_SHEET_GID || "0"; // GID for the daily stats tab

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get("fecha"); // Format: d/M/yyyy

  if (!fecha) {
    return NextResponse.json({ ok: false, error: "Missing fecha parameter" }, { status: 400 });
  }

  try {
    // Fetch the sheet as CSV (requires the sheet to be published)
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
    
    const response = await fetch(csvUrl, {
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      throw new Error("Failed to fetch sheet data");
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    // Find the row matching the date
    // Expected columns: DIA, OBJETIVO, VENTAS, DIF, DIF ACUMULADA
    const headerRow = rows[0];
    const diaIndex = headerRow.findIndex((col) => col.toLowerCase().includes("dia"));
    const objetivoIndex = headerRow.findIndex((col) => col.toLowerCase().includes("objetivo"));
    const ventasIndex = headerRow.findIndex((col) => col.toLowerCase().includes("ventas"));
    const difIndex = headerRow.findIndex((col) => col.toLowerCase() === "dif");
    const difAcumIndex = headerRow.findIndex((col) => col.toLowerCase().includes("acum"));

    // Search for matching date
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowDate = row[diaIndex]?.trim();
      
      if (rowDate === fecha) {
        return NextResponse.json({
          ok: true,
          dia: rowDate,
          objetivo: parseNumber(row[objetivoIndex]),
          ventas: parseNumber(row[ventasIndex]),
          dif: parseNumber(row[difIndex]),
          difAcumulada: parseNumber(row[difAcumIndex]),
        });
      }
    }

    // No data found for this date
    return NextResponse.json({
      ok: true,
      dia: fecha,
      objetivo: null,
      ventas: null,
      dif: null,
      difAcumulada: null,
    });
  } catch (error) {
    console.error("Error fetching daily stats:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch daily stats" },
      { status: 500 }
    );
  }
}

function parseCSV(text: string): string[][] {
  const lines = text.split("\n");
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
