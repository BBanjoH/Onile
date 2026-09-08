/** @type {import('next').NextConfig} */

// Security headers applied to every response. These are the low-cost,
// high-value ones that don't need per-route tuning.
const securityHeaders = [
  // Don't let the site be framed by anyone else (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Don't let browsers second-guess declared content types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the origin, not the full path, to other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // We never use these, so switch them off for any embedded content too.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // Tell browsers to stay on HTTPS for this domain in future. Only takes
  // effect over HTTPS, so it's inert during local development.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
