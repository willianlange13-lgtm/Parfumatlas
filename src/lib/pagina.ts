import "server-only";

export type Pagina = { url: string; texto: string; imagem: string | null; titulo: string };

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

const meta = (html: string, prop: string) =>
  html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1] ??
  html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"))?.[1] ?? null;

function paraTexto(html: string) {
  return html
    .replace(/<(script|style|noscript|svg|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<img[^>]*alt=["']([^"']+)["'][^>]*>/gi, " [$1] ")
    // a força dos acordes no Fragrantica vem na largura da barra
    .replace(/<div[^>]*accord-bar[^>]*width:\s*([\d.]+)%[^>]*>([^<]*)</gi, " $2 ($1%) <")
    .replace(/<(br|\/p|\/div|\/li|\/h\d)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

/** Baixa a página do perfume e devolve o texto, a foto oficial e o título. Null se o site bloquear. */
export async function lerPagina(url: string): Promise<Pagina | null> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8", Accept: "text/html" }, signal: AbortSignal.timeout(12000), redirect: "follow" });
    if (!r.ok) return null;
    const html = await r.text();
    if (html.length < 2000 || /cf-challenge|Just a moment|captcha/i.test(html.slice(0, 5000))) return null;
    const texto = paraTexto(html);
    // pula o menu do site: começa perto da pirâmide ou dos acordes, se achar
    const i = texto.search(/acordes principais|main accords|pirâmide|pyramid|notas de topo|top notes/i);
    const recorte = (i > 3000 ? texto.slice(i - 3000) : texto).slice(0, 30000);
    const imagem = meta(html, "og:image") ?? html.match(/https:\/\/fimgs\.net\/mdimg\/perfume[^"' )]+\.jpg/)?.[0] ?? null;
    return { url, texto: recorte, imagem: imagem?.startsWith("http") ? imagem : null, titulo: meta(html, "og:title") ?? "" };
  } catch {
    return null;
  }
}

/** Primeiro link de página de perfume (Fragrantica ou Parfumo) encontrado num texto. */
export const linkDePerfume = (t: string) => t.match(/https?:\/\/(?:www\.)?(?:fragrantica\.com(?:\.br)?\/perfume|parfumo\.(?:com|net|de)\/Perfumes)\/[^\s)"'\]]+/i)?.[0] ?? null;
