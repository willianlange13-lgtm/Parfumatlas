/**
 * Foto oficial do Fragrantica (frasco em fundo branco) → versão sem fundo, servida pelo próprio Atlas
 * em /api/frasco (docs/DECISOES.md §17). Função pura: pode ser usada no servidor e no navegador.
 * Aceita o endereço do fimgs.net e também um que já passou por aqui (não embrulha duas vezes).
 */
export function semFundo(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/api/frasco")) return url;
  const id = url.match(/fimgs\.net\/mdimg\/perfume\/(?:375x500|o)\.(\d+)\.jpg/i)?.[1];
  return id ? `/api/frasco?id=${id}&v=1` : url;
}

/** É a foto oficial tratada (sem fundo)? Serve para não pôr fundo branco nem cortar o frasco. */
export const ehSemFundo = (url?: string | null) => Boolean(url?.startsWith("/api/frasco"));
