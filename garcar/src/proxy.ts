import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Decode JWT payload without verifying signature (routing use only). */
function decodeJwt(token: string): { userId?: string; isVerified?: boolean } | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// Routes that require a verified + approved account
const VERIFIED_ROUTES = [
  '/my-trips',
  '/messages',
  '/reviews',
  '/profile',
  '/host',
  '/settings',
];

// Routes that require login but show content even while pending verification
const AUTH_ROUTES = ['/browse', '/cars', '/verify', '/dashboard'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsVerified = VERIFIED_ROUTES.some((p) => pathname.startsWith(p));
  const needsAuth = needsVerified || AUTH_ROUTES.some((p) => pathname.startsWith(p));

  if (!needsAuth) return NextResponse.next();

  const raw = request.cookies.get('garkar_token')?.value;
  const token = raw ? decodeURIComponent(raw) : null;

  // Not logged in → send to login, preserving intended destination
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const payload = decodeJwt(token);

  // Logged in but not verified → send to residency verification
  if (needsVerified && !payload?.isVerified) {
    const url = request.nextUrl.clone();
    url.pathname = '/verify/residency';
    if (payload?.userId) url.searchParams.set('userId', payload.userId);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/browse/:path*',
    '/cars/:path*',
    '/dashboard/:path*',
    '/my-trips/:path*',
    '/messages/:path*',
    '/reviews/:path*',
    '/profile/:path*',
    '/host/:path*',
    '/settings/:path*',
    '/verify/:path*',
  ],
};
