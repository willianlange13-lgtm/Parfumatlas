import "server-only";
import { iniciarPesquisaFundo } from "@/lib/gemini";
import { bonusCasa, casaPermitida, nivelCasa } from "@/data/casas";
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
          nome: T, casa: T, paisCasa: T, link: T,
          relacao: { type: "STRING", enum: ["clone direto", "dupe", "mesmo DNA", "interpretação", "similar por acordes"] },
          radar: { type: "BOOLEAN" }, pctMin: I, pctMax: I, relevancia: I, semelhanca: T, diferenca: T,
        },
        required: ["nome", "casa", "paisCasa", "link", "relacao", "radar", "pctMin", "pctMax", "relevancia", "semelhanca", "diferenca"],
      },
    },
  },
  required: ["parentes"],
};

export type Resultado = { original?: { nome: string; casa: string; link: string } | null; parentes: { nome: string; casa: string; paisCasa?: string; link: string; relacao: string; radar: boolean; pctMin: number; pctMax: number; relevancia?: number; semelhanca: string; diferenca: string }[] };

/** Método de parentesco olfativo, em versão curta (o texto de entrada também custa). */
function pedido(p: Perfume) {
  const notas = [...p.notas.saida, ...p.notas.coracao, ...p.notas.fundo].slice(0, 12).join(", ");
  const orig = (p.parecidos ?? []).find((x) => x.tipo === "inspirou");
  const original = orig ? `${orig.nome} (${orig.casa})` : null;
  const ref = orig ? orig.nome : "<original>";
  return `Você é um especialista da COMUNIDADE BRASILEIRA de perfumaria (quem compra árabes e contratipos no Brasil).
Encontre os perfumes mais parecidos com "${p.nome}" da casa "${p.casa}"${notas ? ` (notas: ${notas})` : ""}.${original ? ` Ele é inspirado no ${original}.` : " Descubra se ele é inspirado num original famoso e informe em \"original\"."}

Como pesquisar (em português, nas fontes que o brasileiro usa):
1) Fragrantica Brasil (fragrantica.com.br): página do perfume, comentários e "Este perfume me lembra do".
2) YouTube e Instagram de perfumaria brasileiros, blogs brasileiros e lojas brasileiras de perfumes importados/árabes.
3) Buscas como: "contratipo ${ref}", "alternativa ao ${ref}", "árabe parecido com ${ref}", "${p.nome} parecido", "${p.nome} vs".
4) Só entram casas brasileiras, americanas ou árabes (o original pode ser de qualquer país).
5) Nunca use "quem gosta deste também gosta de" e nunca inclua um perfume só por ser da mesma família.

RELEVÂNCIA é o que a comunidade brasileira mais cita, recomenda e compra como alternativa (os nomes que aparecem em vários vídeos, comentários e lojas brasileiras). Os mais citados vêm primeiro; perfume quase desconhecido no Brasil só entra se o cheiro for muito próximo.

Devolva "parentes": os 10 melhores (sem o próprio perfume nem o original), cada um com:
- nome (sem a casa), casa, "paisCasa", "link" (página dele no Fragrantica, para a foto);
- relacao: "clone direto", "dupe", "mesmo DNA", "interpretação" ou "similar por acordes";
- pctMin e pctMax: faixa de parentesco no cheiro (ex.: 88 e 92), sem inventar precisão;
- relevancia de 1 a 5 NA COMUNIDADE BRASILEIRA (5 = citado em quase todo vídeo/lista de contratipos; 1 = quase ninguém no Brasil cita);
- radar: true só para perfume pouco citado (relevancia 1 ou 2) mas com cheiro muito próximo;
- semelhanca e diferenca: no máximo 12 palavras cada, em português.`;
}

/** Começa a pesquisa em segundo plano na OpenAI (devolve o código para consultar depois). */
// mesmo modelo do ChatGPT (o mini errou a lista em todos os testes); OPENAI_MODEL_PESQUISA troca, se quiser
export const iniciarBuscaSemelhantes = (p: Perfume) =>
  iniciarPesquisaFundo(pedido(p), SCHEMA, "medium", 12, "gpt-5").catch((e) =>
    // conta sem acesso ao gpt-5: usa o mini
    /\b(404|403)\b|model/i.test(String(e)) ? iniciarPesquisaFundo(pedido(p), SCHEMA, "medium", 12, "gpt-5-mini") : Promise.reject(e));

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
  // parentesco manda; casa (até +5) e reconhecimento na comunidade (−5 a +5) desempatam
  const nota = (x: Parecido) => x.pct + bonusCasa(x.casa) + ((x.relevancia ?? 3) - 3) * 4;
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
    if (!x?.nome || !casaPermitida(x.casa, x.paisCasa)) continue; // trava: só casas brasileiras, americanas e árabes
    if (chave(x.nome) === eu || (orig && chave(x.nome) === chave(orig.nome)) || lista.some((y) => chave(y.nome) === chave(x.nome))) continue;
    const min = Math.max(40, Math.min(99, Math.round(Number(x.pctMin) || 70))), max = Math.max(min, Math.min(99, Math.round(Number(x.pctMax) || min)));
    lista.push({
      nome: x.nome, casa: x.casa, tipo: x.relacao === "clone direto" ? "clone" : "parecido", pct: Math.round((min + max) / 2),
      link: x.link, imagem: foto(x.link, x.nome), faixa: min === max ? `~${min}%` : `${min}–${max}%`, relacao: x.relacao,
      relevancia: Math.max(1, Math.min(5, Math.round(Number(x.relevancia) || 3))),
      radar: Boolean(x.radar) || (Number(x.relevancia) || 3) <= 2, semelhanca: x.semelhanca?.slice(0, 120) ?? null, diferenca: x.diferenca?.slice(0, 120) ?? null,
    });
  }
  const manuais = (p.parecidos ?? []).filter((x) => x.trecho === "adicionado por você" && !lista.some((y) => chave(y.nome) === chave(x.nome)));
  return { parecidos: ordenar([...lista, ...manuais]), dnaOriginal: orig ? chave(orig.nome) : null };
}

/** Lista reaproveitada de outro perfume com o mesmo original (sem nova pesquisa). */
export function reaproveitar(de: Perfume, para: Perfume): Parecido[] {
  const eu = chave(para.nome);
  const lista = (de.parecidos ?? []).filter((x) => chave(x.nome) !== eu && x.trecho !== "adicionado por você" && (x.tipo === "inspirou" || casaPermitida(x.casa)));
  // o perfume de onde veio a lista também é parente deste
  if (!lista.some((x) => chave(x.nome) === chave(de.nome))) lista.push({ nome: de.nome, casa: de.casa, tipo: "clone", pct: 88, imagem: de.imagem ?? null, faixa: "~88%", relacao: "mesmo DNA", radar: nivelCasa(de.casa) === 3, semelhanca: "clone do mesmo original", diferenca: null });
  const manuais = (para.parecidos ?? []).filter((x) => x.trecho === "adicionado por você");
  return ordenar([...lista, ...manuais]);
}
