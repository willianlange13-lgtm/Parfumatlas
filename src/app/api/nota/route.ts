import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { NOTA_EN } from "@/data/notas-en";

/**
 * Foto real da nota/ingrediente, de domínio público (Openverse: licenças cc0 e pdm, só fotografia).
 * Só licenças sem exigência de atribuição, para uso decorativo no chip da nota.
 * Busca no Openverse, baixa a melhor imagem, recorta quadrado em webp e o CDN da Vercel
 * guarda por 1 ano (immutable). Se não achar, 404 e o app mostra o glifo dourado
 * (o banco local era colagem com costuras — ficava "torto" no círculo, por isso saiu).
 */
export const runtime = "nodejs";
export const maxDuration = 20;

const CACHE = "public, max-age=31536000, s-maxage=31536000, immutable";
const UA = "ParfumAtlas/1.0 (catálogo pessoal; contato via app)";

// termos concretos para notas abstratas/materiais (buscam foto melhor que o nome da nota)
const MATERIA: Record<string, string> = {
  "Almíscar": "white musk powder", "Almíscar branco": "white musk powder", "Âmbar": "amber resin stone",
  "Âmbar cinzento": "ambergris", "Ambroxan": "ambroxan crystal", "Ambrofix": "ambroxan crystal",
  "Ambrette": "ambrette seeds", "Couro": "tanned brown leather", "Camurça": "suede leather",
  "Tabaco": "dried tobacco leaf", "Incenso": "frankincense resin", "Olíbano": "frankincense resin",
  "Mirra": "myrrh resin", "Oud": "agarwood oud", "Agarwood": "agarwood oud",
  "Notas marinhas": "sea water splash", "Notas aquáticas": "clear water drops", "Sal": "sea salt crystals",
  "Cashmeran": "folded cashmere wool", "Benjoim": "benzoin resin", "Labdano": "labdanum resin",
  "Musgo": "oakmoss", "Musgo de carvalho": "oakmoss", "Musgo-de-carvalho": "oakmoss",
  "Madeira flutuante": "driftwood", "Madeira flutuante seca": "driftwood",
  "Âmbar branco": "white amber resin", "Baunilha": "vanilla pods", "Fava tonka": "tonka bean",
  "Tonka": "tonka bean", "Patchouli": "patchouli leaves", "Vetiver": "vetiver roots",
  "Sândalo": "sandalwood", "Cedro": "cedar wood", "Pinho": "pine wood",
  "Breu": "amber resin stone", "Castóreo": "castoreum", "Civeta": "civet musk",
  "Aldeídos": "champagne bubbles", "Ozônicos": "clear blue sky clouds", "Pólvora": "gunpowder smoke",
  "Fumaça": "wood smoke", "Alcatrão": "birch tar", "Bétula": "birch bark",
  "Mel": "honey jar", "Cera de abelha": "beeswax", "Leite": "glass of milk",
  "Caramelo": "caramel", "Chocolate": "dark chocolate", "Café": "coffee beans",
  "Terra molhada": "wet soil", "Petricor": "wet earth rain", "Pedra": "grey stone",
  "Metal": "polished metal", "Tinta": "black ink", "Borracha": "black rubber",
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
  // sem foto de domínio público: cai para o banco local (bom nas notas abstratas); se não houver, 404 e o chip mostra o glifo.
  // cache curto no 404: evita martelar o Openverse em nota sem foto, mas permite nova tentativa no dia seguinte.
  // sem foto de domínio público: 404 e o chip mostra o glifo dourado (limpo). Cache curto para permitir nova tentativa.
  const semFoto = () => new NextResponse(null, { status: 404, headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } });
  if (!nome) return semFoto();

  try {
    const q = encodeURIComponent(`${termo(nome)} ingredient`);
    // category=photograph: evita ilustração/infográfico/escaneado com texto (ex.: a nota "Coentro" vinha com texto)
    const api = `https://api.openverse.org/v1/images/?q=${q}&license=cc0,pdm&category=photograph&page_size=12&mature=false&extension=jpg,png`;
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
