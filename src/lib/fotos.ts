import "server-only";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const chave = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Foto do frasco a partir do número da página do Fragrantica. */
export const fotoFragrantica = (url?: string | null) => {
  const id = url?.match(/fragrantica\.com(?:\.br)?\/perfume\/[^?#]*-(\d+)\.html/i)?.[1];
  return id ? `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg` : null;
};

/**
 * Confere se o link do Fragrantica é mesmo deste perfume antes de usar a foto.
 * A IA às vezes acerta o nome no endereço mas inventa o número (e o número é que define a foto).
 * Abre a página: se o título não tiver o nome, descarta. Se o site não deixar abrir, usa o nome no endereço.
 */
export async function fotoConferida(link: string | null | undefined, nome: string): Promise<string | null> {
  const foto = fotoFragrantica(link);
  if (!foto || !link) return null;
  if (!chave(decodeURIComponent(link)).includes(chave(nome))) return null;
  try {
    const r = await fetch(link, { headers: { "User-Agent": UA, Accept: "text/html" }, signal: AbortSignal.timeout(5000), redirect: "follow" });
    if (r.ok) {
      const html = (await r.text()).slice(0, 200_000);
      const titulo = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? html.match(/property=["']og:title["'][^>]*content=["']([^"']+)/i)?.[1] ?? "";
      if (titulo && !/just a moment|attention|captcha/i.test(titulo)) return chave(titulo).includes(chave(nome)) ? foto : null;
    }
  } catch { /* site bloqueou: fica com a conferência pelo endereço */ }
  return foto;
}

/** Confere várias de uma vez (em paralelo). */
export const fotosConferidas = <T extends { nome: string; link?: string | null }>(itens: T[]) =>
  Promise.all(itens.map(async (x) => ({ ...x, imagem: await fotoConferida(x.link, x.nome) })));
