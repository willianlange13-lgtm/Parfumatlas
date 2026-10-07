import { NextResponse, type NextRequest } from "next/server";
import { recortar, rotulo } from "@/lib/recortar";

/**
 * Foto oficial do frasco sem o fundo branco (docs/DECISOES.md §17).
 * Baixa a foto do Fragrantica, apaga o branco LIGADO À BORDA (flood fill) e devolve PNG transparente,
 * recortado no frasco. Branco dentro do frasco (rótulo, reflexo) fica, porque não encosta na borda.
 * Sem IA. A CDN da Vercel guarda o resultado por 1 ano: cada foto é tratada uma vez só.
 * Se não der para baixar, redireciona para a foto original (com fundo branco).
 */
export const maxDuration = 20;

const CACHE = "public, max-age=31536000, s-maxage=31536000, immutable";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!/^\d{1,9}$/.test(id)) return NextResponse.json({ erro: "id inválido" }, { status: 400 });
  const original = `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg`;
  try {
    const r = await fetch(original, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15", Referer: "https://www.fragrantica.com.br/" }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`fimgs ${r.status}`);
    const bruto = Buffer.from(await r.arrayBuffer());
    // ?modo=rotulo: foto inteira sobre papel (todo o sistema); sem modo: recorte (só a aba Início)
    const png = request.nextUrl.searchParams.get("modo") === "rotulo" ? await rotulo(bruto) : await recortar(bruto);
    return new NextResponse(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": CACHE } });
  } catch (e) {
    console.error("[atlas:frasco]", id, e instanceof Error ? e.message : e);
    // não guarda a falha em cache: na próxima visita tenta tratar de novo
    return NextResponse.redirect(original, { status: 302, headers: { "Cache-Control": "no-store" } });
  }
}
