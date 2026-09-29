import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { verifyToken, parseAuthHeader } from "./lib/jwt";
import { validateConfig } from "./lib/config/config";

// Define paths that require authentication
const protectedPaths = ["/dashboard", "/api/documents", "/upload"];

// Define paths that are only for unauthenticated users
const authPaths = ["/login", "/register","/uploaded_files"];

// Run configuration validation once and store the result
let configValidationResult: { valid: boolean; error?: string } = { valid: true };

try {
  validateConfig();
} catch (error) {
  configValidationResult = { 
    valid: false, 
    error: error instanceof Error ? error.message : "Unknown configuration error" 
  };
  console.error("Configuration error:", 
    error instanceof Error ? error.message : "Unknown configuration error"
  );
}


// Origin (scheme://host[:port]) of a configured URL, or null if unset/invalid.
function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// Enforced, nonce-based CSP. Next.js reads the nonce from the request's
// Content-Security-Policy header during SSR and applies it to its own
// framework/bootstrap scripts, so no 'unsafe-inline' is needed for scripts.
// This requires dynamic rendering — see app/layout.tsx.
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  // Client components call the backend API / uploads host directly
  // (chat, FAQ chat, summaries), so those origins must be reachable.
  const apiOrigins = [
    originOf(process.env.NEXT_PUBLIC_API_BASE_URL),
    originOf(process.env.NEXT_PUBLIC_API_UPLOADS_URL),
  ].filter(Boolean);
  // The help page embeds an optional help video.
  const frameOrigins = [originOf(process.env.NEXT_PUBLIC_HELP_VIDEO_URL)].filter(Boolean);

  return [
    "default-src 'self'",
    // 'unsafe-eval' only in dev: React uses eval for dev-time error stacks,
    // never in a production build.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Styles stay 'unsafe-inline': React style props and the inline <style>
    // blocks can't carry a nonce, and adding one would disable 'unsafe-inline'.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    ["connect-src 'self'", ...apiOrigins].join(" "),
    ["frame-src 'self'", ...frameOrigins].join(" "),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  // Forward the CSP on the request so Next.js can pick up the nonce during
  // rendering, and send it on the response so the browser enforces it.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const next = () => {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy", csp);
    // Trusted Types are reported, not enforced, until verified: React's
    // dangerouslySetInnerHTML and some libraries assign innerHTML directly.
    response.headers.set(
      "Content-Security-Policy-Report-Only",
      "require-trusted-types-for 'script'"
    );
    return response;
  };

  // Check configuration state first
  if (!configValidationResult.valid) {
    // Don't block public assets or Next.js internals
    if (pathname.startsWith('/_next') || 
        pathname.startsWith('/static') || 
        pathname === '/favicon.ico' || 
        pathname === '/robots.txt') {
      return next();
    }
    
    // Either return error for API routes or redirect to an error page
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    } else {
      // Redirect to an error page for browser requests
      return NextResponse.redirect(new URL('/server-error', request.url));
    }
  }

  // Continue with your existing authentication middleware logic
  const token =
    request.cookies.get("token")?.value ||
    parseAuthHeader(request.headers.get("authorization") || undefined);

  const user = token ? await verifyToken(token) : null;
  const isAuthenticated = !!user;

  // Rest of your existing middleware logic
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  const isAuthPath = authPaths.some((path) => pathname === path);

  if (isProtectedPath && !isAuthenticated) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Note: x-user-id/x-user-role are intentionally NOT set here. Setting them
  // via response.headers.set() only adds them to the response sent back to
  // the client — it does not forward them to the route handler's request,
  // and a client can freely send its own x-user-id header on the original
  // request. Every route that needs the caller's identity verifies the JWT
  // itself via lib/jwt.ts's getAuthenticatedUser().

  // Attach user data to the request headers for client components
  if (isAuthenticated && user) {
    const response = next();
    // Set the header as you're doing
    response.headers.set("x-user-data", JSON.stringify(user));
    
    // Also set the cookie
    response.cookies.set("x-user-data", JSON.stringify(user), {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    
    return response;
  }

  return next();
}

// Keep your existing matcher configuration
export const config = {
  matcher: [
    "/((?!api/auth/login|api/auth/register|api/auth/refresh|_next|static|favicon.ico|robots.txt).*)",
  ],
};