// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  // No aplicar middleware a login ni a rutas de API de autenticación
  if (isLoginPage || isApiRoute) {
    return NextResponse.next();
  }

  // Verificar si hay una sesión activa mediante la cookie
  const sessionToken = req.cookies.get("authjs.session-token") || req.cookies.get("__Secure-authjs.session-token");

  if (!sessionToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Opcional: define rutas protegidas
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
