import "server-only";
import { geminiConfigurado, geminiJSON } from "@/lib/gemini";
import type { Entrada } from "@/lib/tipos";

type Cliente = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

/** Uma lição da Escola do nariz, gerada pela IA a partir da coleção (docs/DECISOES.md §20). */
export type Licao = { semana: string; titulo: string; txt: string; exercicio: string; perfumes: string[]; min: number; feita: boolean };

/** Semana do ano no fuso de Campo Grande, ex.: "2026-S40". Muda toda segunda. */
export function semanaAtual(d = new Date()): string {
  const local = new Date(d.getTime() - 4 * 36e5);
  const x = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
  const dia = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - dia);
  const ini = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return `${x.getUTCFullYear()}-S${String(Math.ceil(((x.getTime() - ini.getTime()) / 864e5 + 1) / 7)).padStart(2, "0")}`;
}

/** Lições guardadas. null = a coluna ainda não existe (falta rodar 0004_escola.sql). */
export async function lerEscola(sb: Cliente): Promise<Licao[] | null> {
  const { data, error } = await sb.from("configuracoes").select("escola").maybeSingle();
  if (error) return null;
  return Array.isArray(data?.escola) ? (data.escola as Licao[]) : [];
}

const SCHEMA = {
  type: "OBJECT",
  properties: { titulo: { type: "STRING" }, txt: { type: "STRING" }, exercicio: { type: "STRING" }, perfumes: { type: "ARRAY", items: { type: "STRING" } }, min: { type: "INTEGER" } },
  required: ["titulo", "txt", "exercicio", "perfumes"],
};

/** Gera a lição desta semana (sem pesquisa na web, modelo comum) e guarda junto das anteriores. */
export async function gerarLicao(sb: Cliente, colecao: Entrada[], antigas: Licao[]): Promise<Licao | null> {
  const semana = semanaAtual();
  if (!geminiConfigurado() || antigas.some((l) => l.semana === semana)) return null;
  const tenho = colecao.filter((e) => e.situacao === "tenho" || e.situacao === "assinatura");
  const tive = colecao.filter((e) => e.situacao === "tive");
  if (!tenho.length) return null;
  const linha = (e: Entrada) => `${e.perfume.nome} (${e.perfume.casa}; ${e.perfume.familia}; acordes: ${e.perfume.acordes.slice(0, 4).map((a) => a.nome).join(", ")}; notas: ${[...e.perfume.notas.saida.slice(0, 3), ...e.perfume.notas.coracao.slice(0, 3), ...e.perfume.notas.fundo.slice(0, 3)].join(", ")})`;
  const r = await geminiJSON<{ titulo: string; txt: string; exercicio: string; perfumes: string[]; min?: number }>([{ text: `Você é o professor da "Escola do nariz" de um colecionador de perfumes. Escreva a lição desta semana, em português do Brasil, partindo dos frascos que ele TEM (pode citar os que ele já teve como lembrança).

Frascos que ele tem:
${tenho.map(linha).join("\n")}
${tive.length ? `\nFrascos que ele já teve:\n${tive.map(linha).join("\n")}\n` : ""}
Lições que ele já recebeu (não repita o tema): ${antigas.map((l) => l.titulo).join("; ") || "nenhuma"}.

A lição ensina UM conceito de perfumaria (uma nota, um acorde, uma família, uma molécula, uma técnica de prova, a evolução na pele, a relação com o clima...) e usa 2 ou 3 frascos dele para ele sentir na prática.
- titulo: até 7 palavras, sem dois-pontos.
- txt: o conceito, em até 45 palavras, direto, sem clichê, com fato correto.
- exercicio: o que fazer com os frascos dele, em até 45 palavras (ex.: um em cada pulso, cheirar aos 5 min e depois de 2 h, prestar atenção em X).
- perfumes: os nomes exatos, como estão na lista, dos frascos usados no exercício.
- min: minutos de prática.` }], { schema: SCHEMA, temperatura: 0.8, tempo: 60000, tarefa: "escola" });
  const nomes = new Map(colecao.map((e) => [e.perfume.nome.toLowerCase(), e.perfume.nome]));
  const licao: Licao = {
    semana, titulo: String(r.titulo ?? "").trim(), txt: String(r.txt ?? "").trim(), exercicio: String(r.exercicio ?? "").trim(),
    perfumes: (r.perfumes ?? []).map((n) => nomes.get(String(n).toLowerCase().trim())).filter((n): n is string => Boolean(n)).slice(0, 3),
    min: Math.min(30, Math.max(3, Number(r.min) || 10)), feita: false,
  };
  if (!licao.titulo || !licao.txt) return null;
  // relê antes de gravar: outra aba pode ter gerado no meio-tempo
  const atuais = (await lerEscola(sb)) ?? antigas;
  if (atuais.some((l) => l.semana === semana)) return null;
  const { error } = await sb.from("configuracoes").upsert({ escola: [licao, ...atuais].slice(0, 60) }, { onConflict: "user_id" });
  return error ? null : licao;
}

/** Marca (ou desmarca) uma lição como feita. */
export async function marcarLicao(sb: Cliente, semana: string, feita: boolean): Promise<boolean> {
  const atuais = await lerEscola(sb);
  if (!atuais) return false;
  const { error } = await sb.from("configuracoes").upsert({ escola: atuais.map((l) => (l.semana === semana ? { ...l, feita } : l)) }, { onConflict: "user_id" });
  return !error;
}
