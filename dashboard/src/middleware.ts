import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Protect every page under /dashboard.
 * Unauthenticated requests get redirected to /login with a `next` param,
 * so we can bounce back after sign-in.
 *
 * /api/* routes stay public — they have their own auth (Supabase JWT
 * for /api/chat, ai-core for /api/v1/*).
 */
export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  const callbackUrl = url.pathname + url.search;
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(callbackUrl)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
