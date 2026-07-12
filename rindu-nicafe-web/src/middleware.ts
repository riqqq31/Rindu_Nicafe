import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "rindu-nicafe-secret-key-2026"
);

const COOKIE_NAME = "rindu-nicafe-session";

// Routes that require authentication
const protectedRoutes = ["/owner", "/karyawan"];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ["/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let session: { role?: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      session = payload as { role?: string };
    } catch {
      // Invalid token - clear cookie and continue
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // If user is on login page but already authenticated, redirect to their dashboard
  if (authRoutes.includes(pathname) && session) {
    if (session.role === "owner") {
      return NextResponse.redirect(new URL("/owner", request.url));
    } else {
      return NextResponse.redirect(new URL("/karyawan", request.url));
    }
  }

  // If user tries to access a protected route without being authenticated
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Role-based access control
  if (pathname.startsWith("/owner") && session?.role !== "owner") {
    return NextResponse.redirect(new URL("/karyawan", request.url));
  }

  // Allow owner to access karyawan routes (like POS)
  if (pathname.startsWith("/karyawan") && session?.role !== "karyawan" && session?.role !== "owner") {
    return NextResponse.redirect(new URL("/owner", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/owner/:path*", "/karyawan/:path*"],
};
