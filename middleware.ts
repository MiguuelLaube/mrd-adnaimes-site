import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, tokenEsperado } from "./lib/auth";

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin/login")) return NextResponse.next();
  const esperado = await tokenEsperado();
  if (esperado && req.cookies.get(COOKIE)?.value === esperado) return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/login", req.url));
}

export const config = { matcher: ["/admin/:path*"] };
