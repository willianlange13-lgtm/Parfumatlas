/**
 * Selo de origem da ficha e da busca, para o Willian validar o custo sem abrir a Vercel.
 * "sem custo" = acervo, ficha já salva ou busca local; "IA" = pesquisa paga.
 */
export type Selo = { txt: string; pago: boolean };

export function seloFicha(f?: { fonteFicha?: "acervo" | "ia" | null; reaproveitada?: boolean } | null): Selo | null {
  if (!f) return null;
  if (f.reaproveitada) return { txt: `Reaproveitada${f.fonteFicha === "acervo" ? " do acervo" : ""} · sem custo`, pago: false };
  if (f.fonteFicha === "acervo") return { txt: "Do acervo · sem custo", pago: false };
  if (f.fonteFicha === "ia") return { txt: "Pesquisada com IA · paga", pago: true };
  return null;
}

export const seloBusca = (buscaIA?: boolean | null): Selo | null => (buscaIA == null ? null : buscaIA ? { txt: "Busca com IA · paga", pago: true } : { txt: "Busca sem IA · sem custo", pago: false });
