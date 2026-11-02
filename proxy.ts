import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login" || pathname.startsWith("/api/local-auth") || pathname.startsWith("/_next") || pathname.includes(".")) return NextResponse.next();
  if (!request.cookies.get("kfc_local_session")) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api/db-health).*)"] };
