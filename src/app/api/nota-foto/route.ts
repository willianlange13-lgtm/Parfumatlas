import { NextResponse, type NextRequest } from "next/server";
import { WIKI_NOTA } from "@/data/referencia";

const UA = "ParfumAtlas/1.0 (https://atlas-system-three.vercel.app)";
const H = { "User-Agent": UA, "Api-User-Agent": UA };

/** A Wikimedia só entrega sem limite os tamanhos padrão de miniatura: troca a largura para 330 px. */
const tamanhoPadrao = (u: string) => u.replace(/\/(\d+)px-([^/]+)$/, "/330px-$2");

async function pegar(url: string, ms = 5000) {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      const r = await fetch(url, { headers: H, cache: "no-store", signal: AbortSignal.timeout(ms) });
      if (r.status === 404) return null;
      if (r.ok) return r;
    } catch { /* tenta de novo */ }
    await new Promise((ok) => setTimeout(ok, 400 * (tentativa + 1)));
  }
  return null;
}

/** Endereço da miniatura do artigo: primeiro pela API de resumo, depois pela API clássica. */
async function miniatura(lingua: "en" | "pt", titulo: string): Promise<string | null> {
  const a = await pegar(`https://${lingua}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo)}`);
  const j = a ? await a.json().catch(() => null) : null;
  const src: string | undefined = j?.thumbnail?.source ?? j?.originalimage?.source;
  if (src) return tamanhoPadrao(src);
  const b = await pegar(`https://${lingua}.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=330&titles=${encodeURIComponent(titulo)}`);
  const k = b ? await b.json().catch(() => null) : null;
  const pag = k?.query?.pages ? (Object.values(k.query.pages)[0] as { thumbnail?: { source?: string } }) : null;
  return pag?.thumbnail?.source ?? null;
}

/**
 * Entrega a foto da nota pelo próprio site (a CDN da Vercel guarda por 30 dias).
 * Assim o celular não depende da Wikipédia aceitar o pedido dele.
 */
export async function GET(request: NextRequest) {
  const nome = request.nextUrl.searchParams.get("n") ?? "";
  const titulo = WIKI_NOTA[nome];
  const falhou = () => new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!titulo) return falhou();
  const fontes = [() => miniatura("en", titulo), () => miniatura("pt", nome)];
  for (const fonte of fontes) {
    const src = await fonte();
    if (!src) continue;
    const img = (await pegar(src, 8000)) ?? (src.includes("/330px-") ? null : await pegar(tamanhoPadrao(src), 8000));
    if (!img) continue;
    const bytes = await img.arrayBuffer();
    return new NextResponse(bytes, {
      headers: { "Content-Type": img.headers.get("content-type") ?? "image/jpeg", "Cache-Control": "public, max-age=2592000, s-maxage=2592000, immutable" },
    });
  }
  return falhou();
}
