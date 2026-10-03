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
    original: { type: "OBJECT", properties: { nome: T, casa: T, link: T, pctMin: I, pctMax: I }, required: ["nome", "casa", "link", "pctMin", "pctMax"] },
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

export type Resultado = { mesmaCasa?: { nome: string; link: string }[]; original?: { nome: string; casa: string; link: string; pctMin?: number; pctMax?: number } | null; parentes: { nome: string; casa: string; paisCasa?: string; link: string; relacao: string; radar: boolean; pctMin: number; pctMax: number; relevancia?: number; semelhanca: string; diferenca: string }[] };

function pedido(p: Perfume) {
  const notas = [...p.notas.saida, ...p.notas.coracao, ...p.notas.fundo].slice(0, 12).join(", ");
  const orig = (p.parecidos ?? []).find((x) => x.tipo === "inspirou");
  const original = orig ? `${orig.nome} (${orig.casa})` : null;
  const ref = orig ? orig.nome : "<original>";
  return `Você é um especialista da COMUNIDADE BRASILEIRA de perfumaria (quem compra árabes e contratipos no Brasil).
Encontre os perfumes mais parecidos com "${p.nome}" da casa "${p.casa}"${notas ? ` (notas: ${notas})` : ""}.${original ? ` Ele é inspirado no ${original}: devolva esse perfume em "original".` : " Descubra se ele é inspirado num original famoso e devolva em \"original\"."}
TODAS as porcentagens (pctMin/pctMax), inclusive a do original, medem o quanto cada perfume cheira parecido com o "${p.nome}".

Como pesquisar (em português, nas fontes que o brasileiro usa):
1) Fragrantica Brasil (fragrantica.com.br): página do perfume, comentários e "Este perfume me lembra do".
2) YouTube e Instagram de perfumaria brasileiros, blogs brasileiros e lojas brasileiras de perfumes importados/árabes.
3) Buscas como: "contratipo ${ref}", "alternativa ao ${ref}", "árabe parecido com ${ref}", "${p.nome} parecido", "${p.nome} vs".
4) Só entram casas brasileiras, americanas ou árabes (o original pode ser de qualquer país).
5) Nunca use "quem gosta deste também gosta de" e nunca inclua um perfume só por ser da mesma família.

RELEVÂNCIA é o que a comunidade brasileira mais cita, recomenda e compra como alternativa. Os mais citados vêm primeiro; perfume quase desconhecido no Brasil só entra se o cheiro for muito próximo.

Devolva "parentes": os 10 melhores (sem o próprio perfume nem o original), cada um com:
- nome (sem a casa), casa, "paisCasa", "link" (página dele no Fragrantica, para a foto);
- relacao: "clone direto", "dupe", "mesmo DNA", "interpretação" ou "similar por acordes";
- pctMin e pctMax: faixa de parecença com o "${p.nome}";
- relevancia de 1 a 5 na comunidade brasileira;
- radar: true só para perfume pouco citado (relevancia 1 ou 2) mas com cheiro muito próximo;
- semelhanca e diferenca: no máximo 12 palavras cada, em português.
LINKS: copie o endereço do Fragrantica exatamente como apareceu na busca. Se não viu a página, deixe "link" vazio; nunca monte um endereço.`
}

function lerJson<T>(texto: string): T {
  const limpo = texto.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const ini = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");
  if (ini < 0 || fim <= ini) throw new Error("Gemini não devolveu JSON válido");
  return JSON.parse(limpo.slice(ini, fim + 1)) as T;
}

/**
 * Pesquisa gratuita/baixo custo diretamente no Gemini, sem passar pelo roteador que prioriza OpenAI.
 * Assim uma OPENAI_API_KEY esquecida na Vercel não transforma esta ação em uma chamada paga.
 */
export async function buscarSemelhantesGratis(p: Perfume): Promise<Resultado> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");
  const modelo = process.env.GEMINI_MODEL_FREE || process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  const texto = `${pedido(p)}\n\nDevolva SOMENTE um objeto JSON válido compatível com este esquema: ${JSON.stringify(SCHEMA)}.`;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: texto }] }],
      generationConfig: { temperature: 0.25 },
      tools: [{ google_search: {} }, { url_context: {} }],
    }),
    signal: AbortSignal.timeout(55000),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 240)}`);
  const j = await r.json();
  const resposta: string = (j.candidates?.[0]?.content?.parts ?? []).map((x: { text?: string }) => x.text ?? "").join("");
  if (!resposta) throw new Error("Gemini respondeu vazio");
  return lerJson<Resultado>(resposta);
}

/** Pesquisa premium opcional em segundo plano na OpenAI. */
export const iniciarBuscaSemelhantes = (p: Perfume) =>
  iniciarPesquisaFundo(pedido(p), SCHEMA, "low", 6, "gpt-5-mini");

const fotoFragrantica = (url?: string | null) => {
  const id = url?.match(/fragrantica\.com(?:\.br)?\/perfume\/[^?#]*-(\d+)\.html/i)?.[1];
  return id ? `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg` : null;
};
const foto = (url: string | null | undefined, nome: string) => {
  const u = chave(decodeURIComponent(url ?? ""));
  return url && u.includes(chave(nome)) ? fotoFragrantica(url) : null;
};

export function ordenar(lista: Parecido[]): Parecido[] {
  const nota = (x: Parecido) => x.pct + bonusCasa(x.casa) + ((x.relevancia ?? 3) - 3) * 4;
  const ord = [...lista].filter((x) => x.tipo !== "inspirou").sort((a, b) => nota(b) - nota(a));
  const original = lista.filter((x) => x.tipo === "inspirou");
  const manuais = ord.filter((x) => x.trecho === "adicionado por você");
  const auto = ord.filter((x) => x.trecho !== "adicionado por você");
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
  let estrelas = 0;
  const final = top.map((x) => (x.radar && ++estrelas > 2 ? { ...x, radar: false } : x));
  return [...original, ...final, ...manuais];
}

export function converter(r: Resultado, p: Perfume): { parecidos: Parecido[]; dnaOriginal: string | null } {
  const eu = chave(p.nome);
  const anterior = (p.parecidos ?? []).find((x) => x.tipo === "inspirou");
  const orig = r.original?.nome ? r.original : anterior ? { nome: anterior.nome, casa: anterior.casa, link: anterior.link ?? "", pctMin: undefined, pctMax: undefined } : null;
  const lista: Parecido[] = [];
  if (orig && chave(orig.nome) !== eu) {
    const oMin = Number(orig.pctMin) || 0, oMax = Number(orig.pctMax) || oMin;
    const faixa = oMin ? (oMin === oMax ? `~${oMin}%` : `${oMin}–${oMax}%`) : anterior?.faixa && anterior.faixa !== "o original" ? anterior.faixa : null;
    lista.push({ nome: orig.nome, casa: orig.casa, tipo: "inspirou", pct: oMin ? Math.round((oMin + oMax) / 2) : (anterior?.pct ?? 95), link: orig.link || anterior?.link || null, imagem: foto(orig.link, orig.nome) ?? anterior?.imagem ?? null, faixa, relacao: "original" });
  }
  for (const x of r.parentes ?? []) {
    if (!x?.nome || !casaPermitida(x.casa, x.paisCasa)) continue;
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

export function reaproveitar(de: Perfume, para: Perfume): Parecido[] {
  const eu = chave(para.nome);
  const lista = (de.parecidos ?? []).filter((x) => chave(x.nome) !== eu && x.trecho !== "adicionado por você" && (x.tipo === "inspirou" || casaPermitida(x.casa)));
  if (!lista.some((x) => chave(x.nome) === chave(de.nome))) lista.push({ nome: de.nome, casa: de.casa, tipo: "clone", pct: 88, imagem: de.imagem ?? null, faixa: "~88%", relacao: "mesmo DNA", radar: nivelCasa(de.casa) === 3, semelhanca: "clone do mesmo original", diferenca: null });
  const manuais = (para.parecidos ?? []).filter((x) => x.trecho === "adicionado por você");
  return ordenar([...lista, ...manuais]);
}
