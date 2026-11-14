import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/staff", "/demo", "/api"],
    },
    sitemap: "https://wildernesseggs.com/sitemap.xml",
  };
}
