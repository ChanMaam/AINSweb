import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_SMS_API;
const API_KEY = process.env.NEXT_PUBLIC_SMS_API_KEY;

async function checkSession(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("ains_session=")) return null;
  if (!API_BASE || !API_KEY) return null;

  const res = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    headers: {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
      cookie: cookieHeader, // forward cookie to backend
    },
  });

  if (!res.ok) return null;
  return res.json(); // { ok, email, role }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return NextResponse.next();
  }

  // Protect these routes
  const protectedPaths = ["/dashboard", "/contacts", "/messaging", "/reports", "/settings", "/admin"];
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) return NextResponse.next();

  const me = await checkSession(req);

  if (!me) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Admin page requires admin role
  if (pathname.startsWith("/admin") && me.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/contacts/:path*", "/messaging/:path*", "/reports/:path*", "/settings/:path*", "/admin/:path*"],
};
