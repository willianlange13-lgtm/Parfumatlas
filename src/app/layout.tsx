import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navegacao } from "@/components/Navegacao";

export const metadata: Metadata = {
  title: { default: "Parfum Atlas", template: "%s · Parfum Atlas" },
  description: "Arquivo pessoal de fragrâncias, histórias e experiências olfativas.",
  appleWebApp: { capable: true, title: "Parfum Atlas", statusBarStyle: "black-translucent" },
  icons: { icon: "/icones/icone-192.png", apple: "/icones/icone-180.png" },
};

export const viewport: Viewport = {
  themeColor: "#050506",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Montserrat:wght@400&family=JetBrains+Mono:wght@400;500&family=Pinyon+Script&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="brilho" />
        <Navegacao />
        <main style={{ position: "relative", zIndex: 1 }}>{children}</main>
      </body>
    </html>
  );
}
