import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("verichain_session")?.value;

  const isAdminRoute = pathname.startsWith("/admin");
  const isInstitutionRoute = pathname.startsWith("/institucion");

  // Si no es ruta protegida, continuar
  if (!isAdminRoute && !isInstitutionRoute) {
    return NextResponse.next();
  }

  // Si no hay cookie de sesión, redirigir al login
  if (!sessionCookie) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set("role", isAdminRoute ? "admin" : "institucion");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const [headerPart] = sessionCookie.split(".");
    if (!headerPart) {
      throw new Error("Invalid session token format");
    }

    const decodedHeader = JSON.parse(
      Buffer.from(headerPart, "base64url").toString("utf-8")
    );

    // Validación de rol para Administrador
    if (isAdminRoute && decodedHeader.role !== "ADMIN") {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized_role");
      loginUrl.searchParams.set("role", "admin");
      return NextResponse.redirect(loginUrl);
    }

    // Validación de rol para Institución Emisora
    if (isInstitutionRoute && decodedHeader.role !== "INSTITUTION") {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized_role");
      loginUrl.searchParams.set("role", "institucion");
      return NextResponse.redirect(loginUrl);
    }
  } catch (err) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/institucion/:path*"],
};
