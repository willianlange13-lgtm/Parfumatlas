import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Pinyon_Script } from "next/font/google";
import "./globals.css";
import { Navegacao } from "@/components/Navegacao";
import { iniciais, obterConfig } from "@/lib/config";

// Atlas Vivo (docs/DECISOES.md §28): Bricolage nos títulos, Geist no texto, Geist Mono nas etiquetas,
// Pinyon só na assinatura do colecionador.
const titulo = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-titulo", axes: ["opsz", "wdth"] });
const texto = Geist({ subsets: ["latin"], variable: "--f-texto" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--f-mono" });
const assinatura = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--f-assinatura" });

export const metadata: Metadata = {
  title: { default: "Parfum Atlas", template: "%s · Parfum Atlas" },
  description: "Arquivo pessoal de fragrâncias, histórias e experiências olfativas.",
  appleWebApp: { capable: true, title: "Parfum Atlas", statusBarStyle: "black-translucent" },
  icons: { icon: "/icones/icone-192.png", apple: "/icones/icone-180.png" },
};

export const viewport: Viewport = {
  themeColor: "#0B110F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cfg = await obterConfig().catch(() => null);
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${titulo.variable} ${texto.variable} ${mono.variable} ${assinatura.variable}`}>
      <head>
        {/* no computador, o desenho (1440 px) ocupa a largura toda da tela */}
        <script dangerouslySetInnerHTML={{ __html: "(function(){function f(){var w=document.documentElement.clientWidth;document.documentElement.style.setProperty('--zoom',w>900?Math.min(1.8,Math.max(0.62,w/1440)).toFixed(4):'1')}f();addEventListener('resize',f)})()" }} />
      </head>
      <body>
        <div className="brilho" aria-hidden="true" />
        <div className="grao" aria-hidden="true" />
        <Navegacao iniciais={cfg ? iniciais(cfg.nome) : undefined} />
        <main style={{ position: "relative", zIndex: 1 }}>{children}</main>
      </body>
    </html>
  );
}
