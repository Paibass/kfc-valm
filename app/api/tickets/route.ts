import { NextResponse } from "next/server";
import { getLocalSession } from "@/lib/local-auth";
import { getLocalConfig } from "@/lib/local-config";
import { priceToCents, resolveLocalProductPrices } from "@/lib/local-pricing";
import type { TicketData } from "@/lib/parseTicket";

function formatDate(value: string) {
  const parts = value.trim().split("-");
  return parts.length === 3 ? [parts[2], parts[1], parts[0]].join("/") : value;
}

type RequestedItem = { codigo: string; cantidad: number };

export async function POST(request: Request) {
  const session = await getLocalSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const config = await getLocalConfig();
  const body = await request.json().catch(() => null) as (Partial<TicketData> & { items?: RequestedItem[] }) | null;
  if (!body?.fecha || !body.cajero || !body.chk4 || !Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
    return NextResponse.json({ ok: false, error: "Datos de ticket incompletos" }, { status: 400 });
  }
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(body.fecha) && !/^\d{4}-\d{2}-\d{2}$/.test(body.fecha)) {
    return NextResponse.json({ ok: false, error: "La fecha del ticket no es válida" }, { status: 400 });
  }
  const aggregated = new Map<string, number>();
  for (const item of body.items) {
    if (!item || typeof item.codigo !== "string" || !item.codigo.trim() || !Number.isSafeInteger(item.cantidad) || item.cantidad <= 0) {
      return NextResponse.json({ ok: false, error: "Los productos o cantidades del ticket no son válidos" }, { status: 400 });
    }
    const quantity = (aggregated.get(item.codigo) ?? 0) + item.cantidad;
    if (quantity > 100) return NextResponse.json({ ok: false, error: "La cantidad supera el máximo permitido" }, { status: 400 });
    aggregated.set(item.codigo, quantity);
  }

  const products = await resolveLocalProductPrices(session.local_id, [...aggregated.keys()]);
  if (products.length !== aggregated.size) {
    return NextResponse.json({ ok: false, error: "Uno o más productos no están disponibles o no tienen un precio válido para este local" }, { status: 400 });
  }
  const productsByCode = new Map(products.map((product) => [product.codigo, product]));
  let totalCents = BigInt(0);
  const detail = [...aggregated].map(([codigo, cantidad]) => {
    const product = productsByCode.get(codigo)!;
    const cents = priceToCents(product.precio);
    if (cents === null) throw new Error("INVALID_PRODUCT_PRICE");
    totalCents += cents * BigInt(cantidad);
    return `${cantidad > 1 ? `${cantidad}x ` : ""}${product.nombre}`;
  }).join(" + ");
  const total = `${totalCents / BigInt(100)}.${String(totalCents % BigInt(100)).padStart(2, "0")}`;

  const { googleFormAction, formFields } = config.integraciones;
  const fields = Object.values(formFields);
  const validFieldId = (field: string) => /^entry\.\d+$/.test(field);
  if (!googleFormAction || fields.length !== 5 || fields.some((field) => !validFieldId(field))) return NextResponse.json({ ok: false, error: "Este local no tiene una integración de Google Forms completa" }, { status: 409 });
  const data = new URLSearchParams();
  data.set(formFields.fecha, formatDate(body.fecha));
  data.set(formFields.chk4, body.chk4);
  data.set(formFields.cajero, body.cajero);
  data.set(formFields.detalle, detail);
  data.set(formFields.total, total);
  try {
    const response = await fetch(googleFormAction, { method: "POST", body: data, redirect: "manual", cache: "no-store" });
    if (response.status < 200 || response.status >= 400) return NextResponse.json({ ok: false, error: "Google Forms rechazó el ticket" }, { status: 502 });
    return NextResponse.json({ ok: true, total });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo enviar el ticket" }, { status: 502 });
  }
}
