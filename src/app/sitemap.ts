import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://fpl-player-grid.com",
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}