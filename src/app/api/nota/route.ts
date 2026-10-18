import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
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

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const EN_SLUG: Record<string, string> = Object.fromEntries(Object.entries(NOTA_EN).map(([pt, en]) => [slug(pt), en]));

/** Termo de busca EN: nota exata, por slug, e por nota-base (tira o qualificador, ex. "Limão Italiano" -> "Limão"). */
function termo(nome: string): string {
  if (MATERIA[nome]) return MATERIA[nome];
  if (NOTA_EN[nome]) return NOTA_EN[nome];
  const s = slug(nome);
  if (EN_SLUG[s]) return EN_SLUG[s];
  const toks = s.split(" ");
  for (let i = toks.length - 1; i >= 1; i--) {
    const base = toks.slice(0, i).join(" ");
    if (EN_SLUG[base]) return EN_SLUG[base];
  }
  if (EN_SLUG[toks[0]]) return EN_SLUG[toks[0]];
  return nome;
}

type OV = { results?: { url?: string; thumbnail?: string; license?: string; creator?: string }[] };

export async function GET(request: NextRequest) {
  const nome = (request.nextUrl.searchParams.get("n") ?? "").trim();
  // sem foto de domínio público: 404 e o chip mostra o glifo dourado (mais limpo que a colagem do banco antigo).
  // cache curto no CDN: evita martelar o Openverse em nota sem foto, mas permite nova tentativa no dia seguinte.
  const semFoto = () => new NextResponse(null, { status: 404, headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } });
  if (!nome) return semFoto();

  try {
    const q = encodeURIComponent(`${termo(nome)} ingredient`);
    const api = `https://api.openverse.org/v1/images/?q=${q}&license=cc0,pdm&page_size=12&mature=false&extension=jpg,png`;
    const r = await fetch(api, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(9000) });
    if (!r.ok) return semFoto();
    const dados = (await r.json()) as OV;
    const alvo = dados.results?.find((it) => it.thumbnail || it.url);
    const fonte = alvo?.thumbnail || alvo?.url;
    if (!fonte) return semFoto();

    const img = await fetch(fonte, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(9000) });
    if (!img.ok) return semFoto();
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
    return semFoto();
  }
}
