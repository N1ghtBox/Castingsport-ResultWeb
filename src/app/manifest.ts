import type { MetadataRoute } from "next";

// Lets browsers install the site as an app ("Add to Home screen" / "Install app")
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Castingsport Wyniki",
    short_name: "Castingsport",
    description: "Wyniki zawodów castingsport",
    lang: "pl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#030712", // gray-950, same as the page
    theme_color: "#030712",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
