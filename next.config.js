/** @type {import('next').NextConfig} */
const nextConfig = {
  //output: 'export',

  images: { unoptimized: true },

  // Don't advertise the framework via X-Powered-By.
  poweredByHeader: false,

  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      // Report-Only for now: this app relies on Next.js's inline bootstrap
      // scripts, so an enforcing CSP needs a nonce/hash strategy first.
      // Switch to "Content-Security-Policy" once verified against real
      // traffic (see Security Remediation Plan, Phase 3).
      {
        key: "Content-Security-Policy-Report-Only",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "connect-src 'self'",
          "frame-ancestors 'none'",
        ].join("; "),
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Prevent caching of API responses (auth/session-bearing data).
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
      {
        // Prevent caching of pages (dashboard/login/search/etc. all render
        // per-request/session-bearing content). Static build assets under
        // _next/static are intentionally excluded so their long-term
        // immutable caching is unaffected.
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

module.exports = nextConfig;