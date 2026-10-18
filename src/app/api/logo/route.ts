import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";

/**
 * Logo da marca, de fonte pública (Clearbit Logo API), tratado e guardado na CDN por 1 ano.
 * Resolve o domínio da marca (mapa das casas conhecidas, senão tenta <slug>.com), baixa o logo
 * e devolve webp. Se não achar, 404 e o app mostra o selo tipográfico.
 * O bloqueio de rede é só no sandbox; na Vercel a rede é aberta (mesmo padrão do /api/frasco).
 */
export const runtime = "nodejs";
export const maxDuration = 15;

const CACHE = "public, max-age=31536000, s-maxage=31536000, immutable";
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// domínios das casas mais comuns (quando o palpite <slug>.com não acerta)
const DOMINIO: Record<string, string> = {
  "lattafa": "lattafa.com", "maison-alhambra": "maisonalhambra.com", "afnan": "afnanperfumes.com",
  "armaf": "armaf.com", "rasasi": "rasasi.com", "rayhaan": "rasasi.com", "al-haramain": "alharamainperfumes.com",
  "swiss-arabian": "swissarabian.com", "ajmal": "ajmalperfume.com", "french-avenue": "frenchavenue.com",
  "maison-francis-kurkdjian": "franciskurkdjian.com", "yves-saint-laurent": "ysl.com", "ysl": "ysl.com",
  "jean-paul-gaultier": "jeanpaulgaultier.com", "giorgio-armani": "armani.com", "armani": "armani.com",
  "paco-rabanne": "pacorabanne.com", "carolina-herrera": "carolinaherrera.com", "dolce-gabbana": "dolcegabbana.com",
  "viktor-rolf": "viktor-rolf.com", "maison-margiela": "maisonmargiela.com", "tom-ford": "tomford.com",
  "le-labo": "lelabofragrances.com", "creed": "creedboutique.com", "parfums-de-marly": "parfums-de-marly.com",
  "xerjoff": "xerjoff.com", "amouage": "amouage.com", "initio": "initioparfums.com", "nishane": "nishane.com",
  "montblanc": "montblanc.com", "mont-blanc": "montblanc.com", "versace": "versace.com", "prada": "prada.com",
  "givenchy": "givenchy.com", "guerlain": "guerlain.com", "hermes": "hermes.com", "chanel": "chanel.com",
  "dior": "dior.com", "lancome": "lancome.com", "mugler": "mugler.com", "azzaro": "azzaro.com",
  "valentino": "valentino.com", "bvlgari": "bulgari.com", "burberry": "burberry.com", "calvin-klein": "calvinklein.com",
};

const dominioDe = (casa: string) => {
  const s = slug(casa);
  return DOMINIO[s] ?? `${s.replace(/-/g, "")}.com`;
};

export async function GET(request: NextRequest) {
  const casa = (request.nextUrl.searchParams.get("n") ?? "").trim();
  const semLogo = () => new NextResponse(null, { status: 404, headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } });
  if (!casa) return semLogo();

  try {
    const url = `https://logo.clearbit.com/${dominioDe(casa)}?size=160&format=png`;
    const r = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!r.ok) return semLogo();
    const bruto = Buffer.from(await r.arrayBuffer());
    // recorta a sobra e encaixa em 160x160 transparente (logo costuma ter fundo branco ou transparente)
    const webp = await sharp(bruto).trim({ threshold: 12 }).resize(160, 160, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } }).webp({ quality: 85 }).toBuffer();
    return new NextResponse(new Uint8Array(webp), { headers: { "Content-Type": "image/webp", "Cache-Control": CACHE } });
  } catch (e) {
    console.error("[atlas:logo]", casa, e instanceof Error ? e.message : e);
    return semLogo();
  }
}
