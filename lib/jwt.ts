import { SignJWT, jwtVerify, JWTPayload } from "jose";

// Conditionally import TextEncoder and TextDecoder
const TextEncoder =
  typeof globalThis.TextEncoder !== "undefined"
    ? globalThis.TextEncoder
    : require("util").TextEncoder;
const TextDecoder =
  typeof globalThis.TextDecoder !== "undefined"
    ? globalThis.TextDecoder
    : require("util").TextDecoder;

// Get JWT secret from environment variables
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const JWT_EXPIRY = process.env.JWT_EXPIRY || "24h";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export interface JwtPayload extends JWTPayload {
  userId: number;
  name: string;
  email: string;
  role: string;
  // Include standard JWT fields
  iat?: number; // issued at
  exp?: number; // expiration time
  iss?: string; // issuer
  sub?: string; // subject
  aud?: string | string[]; // audience
  [key: string]: any; // Index signature for additional properties
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JwtPayload;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

/**
 * Parse the token from the Authorization header
 */
export function parseAuthHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Extract and verify the caller's identity directly from the "token" cookie
 * or Authorization header on the request.
 *
 * This never trusts client-supplied x-user-id/x-user-role headers: those are
 * not rewritten onto the incoming request by middleware, so a caller can set
 * them to anything. Every route that needs the current user must call this
 * instead of reading x-user-id off the request.
 */
export async function getAuthenticatedUser(request: {
  cookies: { get(name: string): { value: string } | undefined };
  headers: { get(name: string): string | null };
}): Promise<JwtPayload | null> {
  const token =
    request.cookies.get("token")?.value ||
    parseAuthHeader(request.headers.get("authorization") || undefined);

  if (!token) return null;

  return verifyToken(token);
}
