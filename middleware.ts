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


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check configuration state first
  if (!configValidationResult.valid) {
    // Don't block public assets or Next.js internals
    if (pathname.startsWith('/_next') || 
        pathname.startsWith('/static') || 
        pathname === '/favicon.ico' || 
        pathname === '/robots.txt') {
      return NextResponse.next();
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
    const response = NextResponse.next();
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

  return NextResponse.next();
}

// Keep your existing matcher configuration
export const config = {
  matcher: [
    "/((?!api/auth/login|api/auth/register|api/auth/refresh|_next|static|favicon.ico|robots.txt).*)",
  ],
};