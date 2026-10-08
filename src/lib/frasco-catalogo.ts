import CATALOGO from "@/data/frascos-catalogo.json";

/**
 * Frascos recortados por IA a partir do catálogo de perfumes árabes (docs/DECISOES.md §32).
 * Cada foto já vem sem fundo e sem a caixa, em public/frascos/<código>.webp.
 * O casamento é estrito (mesma casa e mesmo nome) para nunca mostrar o frasco errado.
 */
type Item = { c: string; m: string; n: string; ml: number | null };

const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
const VAZIAS = new Set(["eau", "de", "du", "parfum", "parfums", "perfume", "perfumes", "edp", "edt", "exdp", "extrait", "spray"]);
const CASA_VAZIA = new Set(["perfumes", "perfume", "parfums", "parfum", "fragrances", "maison", "paris", "the"]);

const chaveNome = (s: string) => sem(s).split(" ").filter((t) => t && !VAZIAS.has(t)).join(" ");
const chaveCasa = (s: string) => sem(s).split(" ").filter((t) => t && !CASA_VAZIA.has(t)).join(" ");
const semParenteses = (s: string) => s.replace(/\([^)]*\)/g, " ");

const INDICE = new Map<string, Item>();
for (const it of CATALOGO as Item[]) {
  const casa = chaveCasa(it.m);
  for (const nome of new Set([chaveNome(it.n), chaveNome(semParenteses(it.n))])) {
    const k = `${casa}|${nome}`;
    const atual = INDICE.get(k);
    // mesmo perfume em vários tamanhos: fica o de 100 ml (a foto mais comum)
    if (!atual || (atual.ml !== 100 && it.ml === 100)) INDICE.set(k, it);
  }
}

/** Caminho do frasco recortado do catálogo, ou null se o perfume não estiver lá. */
export function frascoDoCatalogo(casa?: string | null, nome?: string | null): string | null {
  if (!casa || !nome) return null;
  const c = chaveCasa(casa), n = chaveNome(nome);
  const it = INDICE.get(`${c}|${n}`) ?? INDICE.get(`${c}|${chaveNome(semParenteses(nome))}`);
  return it ? `/frascos/${it.c}.webp` : null;
}
