import "server-only";
import { iniciarPesquisaFundo } from "@/lib/gemini";
import { bonusCasa, nivelCasa } from "@/data/casas";
import type { Perfume } from "@/lib/tipos";

type Parecido = NonNullable<Perfume["parecidos"]>[number];

export const chave = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

const T = { type: "STRING" }, I = { type: "INTEGER" };
const SCHEMA = {
  type: "OBJECT",
  properties: {
    original: { type: "OBJECT", properties: { nome: T, casa: T, link: T }, required: ["nome", "casa", "link"] },
    parentes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          nome: T, casa: T, link: T,
          relacao: { type: "STRING", enum: ["clone direto", "dupe", "mesmo DNA", "interpretação", "similar por acordes"] },
          radar: { type: "BOOLEAN" }, pctMin: I, pctMax: I, semelhanca: T, diferenca: T,
        },
        required: ["nome", "casa", "link", "relacao", "radar", "pctMin", "pctMax", "semelhanca", "diferenca"],
      },
    },
  },
  required: ["parentes"],
};

export type Resultado = { original?: { nome: string; casa: string; link: string } | null; parentes: { nome: string; casa: string; link: string; relacao: string; radar: boolean; pctMin: number; pctMax: number; semelhanca: string; diferenca: string }[] };

/** Método de parentesco olfativo, em versão curta (o texto de entrada também custa). */
function pedido(p: Perfume) {
  const notas = [...p.notas.saida, ...p.notas.coracao, ...p.notas.fundo].slice(0, 12).join(", ");
  return `Encontre os parentes olfativos do perfume "${p.nome}" da casa "${p.casa}"${notas ? ` (notas: ${notas})` : ""}.

Método (faça as rotas, com poucas buscas bem escolhidas):
A) Se ele for inspirado num original, identifique o original ("original") e pesquise também os clones/dupes/alternativas DESSE original.
B) Busque em inglês: "<perfume> clone", "<perfume> dupe", "<perfume> vs", "<original> clone", "<original> alternative"; e comparações lado a lado (Reddit, Fragrantica, Parfumo, YouTube).
C) Procure lançamentos dos últimos 2–3 anos de casas árabes (Al Haramain, Afnan, Lattafa, French Avenue/Fragrance World, Maison Alhambra, Armaf, Rasasi, Paris Corner, Zimaya, Maison Asrar, Bidaya, Atralia, Al Absar…) com a mesma combinação de notas.
D) Popularidade não é parentesco: um perfume pouco citado pode ser mais próximo. Dê peso maior a quem testou os dois lado a lado.
E) NUNCA use listas "quem gosta deste também gosta de" e nunca inclua um perfume só por ser da mesma família.

Devolva "parentes": os 9 melhores (sem repetir o próprio perfume nem o original), cada um com:
- nome (sem a casa), casa, "link" (página dele no Fragrantica, para a foto);
- relacao: "clone direto", "dupe", "mesmo DNA", "interpretação" ou "similar por acordes";
- radar: true se for um achado fora do radar (marca menor ou lançamento pouco citado);
- pctMin e pctMax: faixa estimada de parentesco (ex.: 88 e 92). Não invente precisão;
- semelhanca e diferenca: no máximo 12 palavras cada (ex.: "mesma abertura cítrica e mentolada" / "drydown mais amadeirado").
Se não houver original, "original" fica null.`;
}

/** Começa a pesquisa em segundo plano na OpenAI (devolve o código para consultar depois). */
export const iniciarBuscaSemelhantes = (p: Perfume) => iniciarPesquisaFundo(pedido(p), SCHEMA, "low", 8);

const fotoFragrantica = (url?: string | null) => {
  const id = url?.match(/fragrantica\.com(?:\.br)?\/perfume\/[^?#]*-(\d+)\.html/i)?.[1];
  return id ? `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg` : null;
};
/** Só usa a foto se o nome do perfume estiver no endereço (evita frasco de outro perfume). */
const foto = (url: string | null | undefined, nome: string) => {
  const u = chave(decodeURIComponent(url ?? ""));
  return url && u.includes(chave(nome)) ? fotoFragrantica(url) : null;
};

/** Ordem final: parentesco manda; a casa desempata (até ~5 pontos). Fica com 7, idealmente 2 ⭐. */
export function ordenar(lista: Parecido[]): Parecido[] {
  const nota = (x: Parecido) => x.pct + bonusCasa(x.casa);
  const ord = [...lista].filter((x) => x.tipo !== "inspirou").sort((a, b) => nota(b) - nota(a));
  const original = lista.filter((x) => x.tipo === "inspirou");
  const manuais = ord.filter((x) => x.trecho === "adicionado por você");
  const auto = ord.filter((x) => x.trecho !== "adicionado por você");
  // 7 automáticos: os 5 melhores e, se houver, garante até 2 ⭐ entre os 7 (sem empurrá-los para o fim)
  const top = auto.slice(0, 7);
  const estrelasFora = auto.slice(7).filter((x) => x.radar);
  for (const e of estrelasFora) {
    if (top.filter((x) => x.radar).length >= 2) break;
    const sai = [...top].reverse().find((x) => !x.radar);
    if (!sai) break;
    top.splice(top.indexOf(sai), 1);
    top.push(e);
  }
  top.sort((a, b) => nota(b) - nota(a));
  // no máximo 2 ⭐ (os dois mais parecidos entre os fora do radar)
  let estrelas = 0;
  const final = top.map((x) => (x.radar && ++estrelas > 2 ? { ...x, radar: false } : x));
  return [...original, ...final, ...manuais];
}

/** Converte o resultado da IA nos semelhantes da ficha (mantém os que a pessoa adicionou). */
export function converter(r: Resultado, p: Perfume): { parecidos: Parecido[]; dnaOriginal: string | null } {
  const eu = chave(p.nome);
  const orig = r.original?.nome ? r.original : null;
  const lista: Parecido[] = [];
  if (orig && chave(orig.nome) !== eu) lista.push({ nome: orig.nome, casa: orig.casa, tipo: "inspirou", pct: 99, link: orig.link, imagem: foto(orig.link, orig.nome), faixa: "o original", relacao: "original" });
  for (const x of r.parentes ?? []) {
    if (!x?.nome || chave(x.nome) === eu || (orig && chave(x.nome) === chave(orig.nome)) || lista.some((y) => chave(y.nome) === chave(x.nome))) continue;
    const min = Math.max(40, Math.min(99, Math.round(Number(x.pctMin) || 70))), max = Math.max(min, Math.min(99, Math.round(Number(x.pctMax) || min)));
    lista.push({
      nome: x.nome, casa: x.casa, tipo: x.relacao === "clone direto" ? "clone" : "parecido", pct: Math.round((min + max) / 2),
      link: x.link, imagem: foto(x.link, x.nome), faixa: min === max ? `~${min}%` : `${min}–${max}%`, relacao: x.relacao,
      radar: Boolean(x.radar) || nivelCasa(x.casa) === 3, semelhanca: x.semelhanca?.slice(0, 120) ?? null, diferenca: x.diferenca?.slice(0, 120) ?? null,
    });
  }
  const manuais = (p.parecidos ?? []).filter((x) => x.trecho === "adicionado por você" && !lista.some((y) => chave(y.nome) === chave(x.nome)));
  return { parecidos: ordenar([...lista, ...manuais]), dnaOriginal: orig ? chave(orig.nome) : null };
}

/** Lista reaproveitada de outro perfume com o mesmo original (sem nova pesquisa). */
export function reaproveitar(de: Perfume, para: Perfume): Parecido[] {
  const eu = chave(para.nome);
  const lista = (de.parecidos ?? []).filter((x) => chave(x.nome) !== eu && x.trecho !== "adicionado por você");
  // o perfume de onde veio a lista também é parente deste
  if (!lista.some((x) => chave(x.nome) === chave(de.nome))) lista.push({ nome: de.nome, casa: de.casa, tipo: "clone", pct: 88, imagem: de.imagem ?? null, faixa: "~88%", relacao: "mesmo DNA", radar: nivelCasa(de.casa) === 3, semelhanca: "clone do mesmo original", diferenca: null });
  const manuais = (para.parecidos ?? []).filter((x) => x.trecho === "adicionado por você");
  return ordenar([...lista, ...manuais]);
}
