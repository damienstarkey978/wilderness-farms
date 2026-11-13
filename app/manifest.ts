import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wilderness Farms",
    short_name: "Wilderness Farms",
    start_url: "/",
    display: "standalone",
    background_color: "#f3ead8",
    theme_color: "#1c4a32",
    icons: [
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
