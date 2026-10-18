import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { fotoLocalNota } from "@/data/referencia";
import { NOTA_EN } from "@/data/notas-en";

/**
 * Foto real da nota/ingrediente, de domínio público (Openverse: licenças cc0 e pdm).
 * Só licenças sem exigência de atribuição, para uso decorativo no chip da nota.
 * Busca no Openverse, baixa a melhor imagem, recorta quadrado em webp e o CDN da Vercel
 * guarda por 1 ano (immutable). Se não achar, cai para o banco local; se também não houver, 404
 * e o app mostra o glifo dourado.
 */
export const runtime = "nodejs";
export const maxDuration = 20;

const CACHE = "public, max-age=31536000, s-maxage=31536000, immutable";
const UA = "ParfumAtlas/1.0 (catálogo pessoal; contato via app)";

// termos concretos para notas abstratas (buscam melhor que o nome da nota)
const MATERIA: Record<string, string> = {
  "Almíscar": "musk deer", "Âmbar": "amber resin", "Âmbar cinzento": "ambergris",
  "Ambroxan": "ambroxan crystal", "Ambrofix": "ambroxan crystal", "Couro": "tanned leather",
  "Tabaco": "tobacco leaf", "Incenso": "frankincense resin", "Oud": "agarwood",
  "Notas marinhas": "sea water splash", "Cashmeran": "cashmere wool", "Benjoim": "benzoin resin",
};

const termo = (nome: string) => MATERIA[nome] ?? NOTA_EN[nome] ?? nome;

type OV = { results?: { url?: string; thumbnail?: string; license?: string; creator?: string }[] };

export async function GET(request: NextRequest) {
  const nome = (request.nextUrl.searchParams.get("n") ?? "").trim();
  const local = () => {
    const c = fotoLocalNota(nome);
    return c ? NextResponse.redirect(new URL(c, request.url), { status: 302, headers: { "Cache-Control": "no-store" } }) : new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  };
  if (!nome) return new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store" } });

  try {
    const q = encodeURIComponent(`${termo(nome)} ingredient`);
    const api = `https://api.openverse.org/v1/images/?q=${q}&license=cc0,pdm&page_size=12&mature=false&extension=jpg,png`;
    const r = await fetch(api, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(9000) });
    if (!r.ok) return local();
    const dados = (await r.json()) as OV;
    const alvo = dados.results?.find((it) => it.thumbnail || it.url);
    const fonte = alvo?.thumbnail || alvo?.url;
    if (!fonte) return local();

    const img = await fetch(fonte, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(9000) });
    if (!img.ok) return local();
    const bruto = Buffer.from(await img.arrayBuffer());
    const webp = await sharp(bruto).resize(240, 240, { fit: "cover", position: "centre" }).webp({ quality: 80 }).toBuffer();

    return new NextResponse(new Uint8Array(webp), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": CACHE,
        // domínio público (cc0/pdm): atribuição não exigida; registrada por cortesia
        "X-Atlas-Fonte": "openverse",
        "X-Atlas-Licenca": alvo?.license ?? "",
        "X-Atlas-Autor": encodeURIComponent(alvo?.creator ?? ""),
      },
    });
  } catch (e) {
    console.error("[atlas:nota]", nome, e instanceof Error ? e.message : e);
    return local();
  }
}
