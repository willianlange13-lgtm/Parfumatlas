/**
 * Como o frasco oficial (foto do Fragrantica, fundo branco) aparece no Atlas (docs/DECISOES.md §27):
 * - `semFundo` (todo o sistema): o RÓTULO — a foto inteira sobre papel cor de rótulo, cantos arredondados.
 *   O branco da foto vira o papel (multiplicação feita no servidor), então nunca há recorte torto.
 * - `recorte` (só a aba Início): o frasco recortado, para a vitrine com luz e sombra.
 * As duas passam por /api/frasco (a CDN guarda por 1 ano). Funções puras: servidor e navegador.
 */
const idDe = (url?: string | null) =>
  url?.match(/fimgs\.net\/mdimg\/perfume\/(?:375x500|o)\.(\d+)\.jpg/i)?.[1] ?? url?.match(/^\/api\/frasco\?id=(\d+)/)?.[1] ?? null;

export function semFundo(url?: string | null): string | null {
  if (!url) return null;
  const id = idDe(url);
  return id ? `/api/frasco?id=${id}&modo=rotulo&v=1` : url; // v sobe quando o desenho do rótulo muda
}

/** Frasco recortado (sem fundo), só para a aba Início. */
export function recorte(url?: string | null): string | null {
  if (!url) return null;
  const id = idDe(url);
  return id ? `/api/frasco?id=${id}&v=5` : url;
}

/** É a foto oficial tratada (rótulo ou recorte)? Serve para não pôr fundo branco nem cortar o frasco. */
export const ehSemFundo = (url?: string | null) => Boolean(url?.startsWith("/api/frasco"));
