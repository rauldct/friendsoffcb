import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "admin_token";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  // Clear invalid cookie
  response.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
