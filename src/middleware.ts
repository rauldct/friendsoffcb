import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "admin_token";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ===== i18n: Handle /es/* routes =====
  if (pathname.startsWith("/es/") || pathname === "/es") {
    // Strip /es prefix and rewrite to base path
    const basePath = pathname === "/es" ? "/" : pathname.slice(3);
    const url = request.nextUrl.clone();
    url.pathname = basePath;

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", "es");

    // Also set locale cookie so client-side LanguageContext picks up Spanish
    const response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    response.cookies.set("locale", "es", { path: "/", maxAge: 365 * 24 * 60 * 60, sameSite: "lax" });
    return response;
  }

  // ===== Admin auth =====
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // Allow login page and login API without auth
    if (pathname === "/admin/login" || pathname === "/api/admin/auth/login") {
      return NextResponse.next();
    }

    // Allow cron jobs via X-Cron-Secret header
    const cronSecret = request.headers.get("x-cron-secret");
    if (cronSecret && cronSecret === process.env.CRON_SECRET) {
      return NextResponse.next();
    }

    // Check JWT cookie
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (token) {
      try {
        const secret = getJwtSecret();
        if (secret.length > 0) {
          await jwtVerify(token, secret);
          return NextResponse.next();
        }
      } catch {
        // Token invalid or expired - fall through to redirect
      }
    }

    // API routes get 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Page routes redirect to login
    const loginUrl = new URL("/admin/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return response;
  }

  // ===== i18n: Set locale header for public routes =====
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", "en");
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    // Match all routes except static assets
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|apple-touch-icon|images/|manifest\\.json|sw\\.js|workbox-).*)",
  ],
};
