import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = process.env.JWT_ACCESS_SECRET ?? "";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  let role: string | null = null;

  if (token && secret) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
      role = typeof payload.role === "string" ? payload.role : null;
    } catch {
      role = null;
    }
  }

  const { pathname } = request.nextUrl;

  if (!role) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
