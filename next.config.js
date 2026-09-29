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
      // Content-Security-Policy is set per request in middleware.ts, since
      // it carries a fresh nonce for every page render.
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