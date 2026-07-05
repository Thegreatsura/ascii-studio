import type { MetadataRoute } from "next";

const SITE_URL = "https://asciistudio.space";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/showcase`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
