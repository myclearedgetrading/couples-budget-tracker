import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/budget",
        "/bills",
        "/income",
        "/spending",
        "/savings",
        "/calendar",
        "/reports",
        "/settings",
        "/onboarding",
        "/api/",
      ],
    },
  };
}
