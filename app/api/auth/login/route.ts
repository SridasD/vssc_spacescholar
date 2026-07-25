import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { generateToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger/logger"; // Import the logger
import {
  rateLimit,
  isLoginLocked,
  recordLoginFailure,
  clearLoginFailures,
  getClientIp,
} from "@/lib/rateLimit";

// .strict() rejects unexpected fields (e.g. is_admin/role) instead of
// silently ignoring them, and the type/format checks reject malformed input
// (e.g. null bytes) before it ever reaches the database.
const loginSchema = z
  .object({
    email: z.string().trim().email().max(255),
    password: z.string().min(1).max(256),
  })
  .strict();

// Same-origin check: defense in depth against CSRF alongside sameSite:strict
// cookies. Browsers always send Origin (or, failing that, Referer) on
// cross-origin fetch/XHR/form submissions; if either is present and doesn't
// match this app's own origin, reject the request.
function isSameOriginRequest(req: Request): boolean {
  const selfOrigin = new URL(req.url).origin;
  const origin = req.headers.get("origin");
  if (origin) return origin === selfOrigin;

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === selfOrigin;
    } catch {
      return false;
    }
  }

  // Neither header present — allow (e.g. some non-browser API clients).
  return true;
}

export async function POST(req: Request) {
  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    const ip = getClientIp(req.headers);
    const ipLimit = rateLimit(`login:${ip}`, { windowMs: 60_000, max: 10 });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Parse request body
    const rawBody = await req.json();
    const parsed = loginSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    const { email, password } = parsed.data;

    const lockoutKey = `${email.toLowerCase()}:${ip}`;
    const lockStatus = isLoginLocked(lockoutKey);
    if (lockStatus.locked) {
      return NextResponse.json(
        { error: "Account temporarily locked due to repeated failed login attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Call the validate_user stored procedure
    const result = await query(
      "SELECT * FROM usrmngmnt.validate_user($1, $2)",
      [email, password]
    );

    // Check if user was found
    if (result.rows.length === 0) {
      recordLoginFailure(lockoutKey);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    clearLoginFailures(lockoutKey);

    // User is valid, extract data
    const user = result.rows[0];

    // Generate JWT token
    const token = await generateToken({
      userId: user.user_id,
      name: user.user_name,
      email: user.user_email,
      role: user.user_role,
    });

    // Set JWT in a secure, HTTP-only cookie
    (await cookies()).set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 86400, // 24 hours
    });

    // Return user data without sensitive information
    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.user_id,
        name: user.user_name,
        email: user.user_email,
        role: user.user_role,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
