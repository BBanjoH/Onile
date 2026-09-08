import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing behind a login is useful to a search engine, and these
      // paths contain personal information.
      disallow: ["/api/", "/admin", "/dashboard", "/my-rentals"],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
