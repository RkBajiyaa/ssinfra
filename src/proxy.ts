import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic check only: bounce visitors without a session cookie away from
 * admin pages before rendering. The real authorisation (cookie verification
 * + admin claim) happens in lib/auth/session.ts on every page and action.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("__session");
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Everything under /admin except the login page and the offline fallback.
  matcher: ["/admin", "/admin/((?!login|offline).*)"],
};
