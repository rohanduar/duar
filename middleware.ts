import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getDashboardPathByRole } from "@/lib/role";

const roleAccessMap: Record<string, string> = {
  "/super-admin": "super_admin",
  "/admin": "admin",
  "/teacher": "teacher",
  "/student": "student",
};

function isRoleAllowed(pathname: string, role?: string): boolean {
  if (!role) {
    return false;
  }

  const matchedPrefix = Object.keys(roleAccessMap).find((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!matchedPrefix) {
    return true;
  }

  return roleAccessMap[matchedPrefix] === role;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = Boolean(token);
  const isLoginRoute = pathname === "/login";

  if (!isLoggedIn && !isLoginRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginRoute) {
    const dashboardPath = getDashboardPathByRole(token?.role);
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  if (isLoggedIn && !isRoleAllowed(pathname, token?.role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
