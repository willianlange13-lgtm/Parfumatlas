import { NextResponse, type NextRequest } from "next/server";
import { WIKI_NOTA } from "@/data/referencia";

/** Redireciona para a foto da nota (imagem principal do artigo da Wikipédia). Guarda por 30 dias. */
export async function GET(request: NextRequest) {
  const nome = request.nextUrl.searchParams.get("n") ?? "";
  const titulo = WIKI_NOTA[nome];
  if (!titulo) return new NextResponse(null, { status: 404 });
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo)}`, {
      headers: { "User-Agent": "ParfumAtlas/1.0 (arquivo pessoal de perfumes)" },
      next: { revalidate: 60 * 60 * 24 * 30 },
      signal: AbortSignal.timeout(6000),
    });
    const j = await r.json();
    const src: string | undefined = j.thumbnail?.source ?? j.originalimage?.source;
    if (!src) return new NextResponse(null, { status: 404 });
    // pede uma miniatura de 240 px (a Wikipédia gera qualquer largura)
    const foto = src.replace(/\/(\d+)px-/, "/240px-");
    return NextResponse.redirect(foto, { status: 302, headers: { "Cache-Control": "public, max-age=2592000, immutable" } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
