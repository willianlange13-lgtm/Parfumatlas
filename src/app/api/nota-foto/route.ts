import { NextResponse, type NextRequest } from "next/server";
import { WIKI_NOTA } from "@/data/referencia";

const UA = "ParfumAtlas/1.0 (https://atlas-system-three.vercel.app)";

/** Busca a foto principal de um artigo da Wikipédia. Tenta de novo se falhar. */
async function fotoDaWiki(lingua: "en" | "pt", titulo: string) {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      // sem cache do servidor: uma falha antiga não pode ficar guardada
      const r = await fetch(`https://${lingua}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo)}`, {
        headers: { "User-Agent": UA, "Api-User-Agent": UA, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      return (j.thumbnail?.source ?? j.originalimage?.source ?? null) as string | null;
    } catch {
      await new Promise((ok) => setTimeout(ok, 300 * (tentativa + 1)));
    }
  }
  return null;
}

/** Redireciona para a foto da nota. Só guarda (30 dias) quando dá certo. */
export async function GET(request: NextRequest) {
  const nome = request.nextUrl.searchParams.get("n") ?? "";
  const titulo = WIKI_NOTA[nome];
  const falhou = () => new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!titulo) return falhou();
  const foto = (await fotoDaWiki("en", titulo)) ?? (await fotoDaWiki("pt", nome));
  if (!foto) return falhou();
  return NextResponse.redirect(foto, { status: 302, headers: { "Cache-Control": "public, max-age=2592000, s-maxage=2592000" } });
}
