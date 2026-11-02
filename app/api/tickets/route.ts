import { NextResponse } from "next/server";
import { getLocalSession } from "@/lib/local-auth";
import { getLocalConfig } from "@/lib/local-config";
import type { TicketData } from "@/lib/parseTicket";

function formatDate(value: string) {
  const parts = value.trim().split("-");
  return parts.length === 3 ? [parts[2], parts[1], parts[0]].join("/") : value;
}

export async function POST(request: Request) {
  const session = await getLocalSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const config = await getLocalConfig();
  const body = await request.json().catch(() => null) as Partial<TicketData> | null;
  if (!body?.fecha || !body.cajero || !body.detalle || !body.total) return NextResponse.json({ ok: false, error: "Datos de ticket incompletos" }, { status: 400 });
  const { googleFormAction, formFields } = config.integraciones;
  const fields = Object.values(formFields);
  if (!googleFormAction || fields.some((field) => !field)) return NextResponse.json({ ok: false, error: "Este local no tiene una integración de Google Forms completa" }, { status: 409 });
  const data = new URLSearchParams();
  data.set(formFields.fecha, formatDate(body.fecha));
  data.set(formFields.chk4, body.chk4 ?? "");
  data.set(formFields.cajero, body.cajero);
  data.set(formFields.detalle, body.detalle);
  data.set(formFields.total, body.total);
  try {
    const response = await fetch(googleFormAction, { method: "POST", body: data, redirect: "manual", cache: "no-store" });
    if (response.status < 200 || response.status >= 400) return NextResponse.json({ ok: false, error: "Google Forms rechazó el ticket" }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo enviar el ticket" }, { status: 502 });
  }
}
