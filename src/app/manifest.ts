import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Parfum Atlas",
    short_name: "Atlas",
    description: "Arquivo pessoal de fragrâncias.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#050506",
    theme_color: "#050506",
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Adicionar perfume", url: "/adicionar" },
      { name: "Buscar", url: "/buscar" },
      { name: "Sommelier", url: "/sommelier" },
    ],
  };
}
