import "server-only";
import { clienteServico } from "@/lib/supabase/servico";
import { fichaDoAcervo, guardarNoAcervo, nivelEstimado, type LinhaAcervo } from "@/lib/acervo-global";
import { completarFicha } from "@/lib/ficha";
import { geminiConfigurado } from "@/lib/gemini";

/**
 * Completar o acervo com IA, em lotes pequenos (docs/DECISOES.md §27). Fila: primeiro quem não tem nota
 * nenhuma, depois quem tem fixação/projeção vazia ou só estimada. Cada perfume é uma pesquisa paga
 * (a mesma completação da ficha: até 3 buscas). Só preenche o que está vazio; nível estimado cede ao real.
 */

export type Situacao = {
  total: number; semNotas: number; piramideIncompleta: number; semNivel: number; nivelEstimado: number; nivelReal: number;
  tentadosSemSucesso: number; migracao: boolean;
};

type Sb = NonNullable<ReturnType<typeof clienteServico>>;

const conta = async (q: PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
  const { count, error } = await q;
  return error ? null : count ?? 0;
};

export async function situacaoDoAcervo(sb: Sb): Promise<Situacao> {
  const base = () => sb.from("acervo").select("chave", { count: "exact", head: true });
  const vazio = "{}";
  const [total, semNotas, saidaVazia, coracaoVazio, fundoVazio, semNivel, estimado] = await Promise.all([
    conta(base()),
    conta(base().eq("notas_saida", vazio).eq("notas_coracao", vazio).eq("notas_fundo", vazio)),
    conta(base().eq("notas_saida", vazio)), conta(base().eq("notas_coracao", vazio)), conta(base().eq("notas_fundo", vazio)),
    conta(base().or("fixacao_nivel.is.null,projecao_nivel.is.null")),
    conta(base().like("fonte_niveis", "estimativa%")),
  ]);
  const migracao = estimado !== null;
  const tentados = migracao ? await conta(base().not("tentado_em", "is", null).eq("notas_saida", vazio).eq("notas_coracao", vazio).eq("notas_fundo", vazio)) : 0;
  const incompleta = Math.max(0, Math.max(saidaVazia ?? 0, coracaoVazio ?? 0, fundoVazio ?? 0) - (semNotas ?? 0));
  return {
    total: total ?? 0, semNotas: semNotas ?? 0, piramideIncompleta: incompleta, semNivel: semNivel ?? 0,
    nivelEstimado: estimado ?? 0, nivelReal: Math.max(0, (total ?? 0) - (semNivel ?? 0) - (estimado ?? 0)),
    tentadosSemSucesso: tentados ?? 0, migracao,
  };
}

/** Próximos da fila. Quem a IA já tentou vai para o fim (não fica tentando o mesmo perfume sem fim). */
async function proximos(sb: Sb, quantos: number, alvo: "notas" | "niveis" | "tudo"): Promise<LinhaAcervo[]> {
  const vazio = "{}";
  const lista: LinhaAcervo[] = [];
  if (alvo !== "niveis") {
    const { data } = await sb.from("acervo").select("*").eq("notas_saida", vazio).eq("notas_coracao", vazio).eq("notas_fundo", vazio)
      .order("tentado_em", { ascending: true, nullsFirst: true }).order("casa").limit(quantos);
    lista.push(...((data ?? []) as LinhaAcervo[]));
  }
  if (lista.length < quantos && alvo !== "notas") {
    const { data } = await sb.from("acervo").select("*").or("fixacao_nivel.is.null,projecao_nivel.is.null,fonte_niveis.like.estimativa*")
      .order("tentado_em", { ascending: true, nullsFirst: true }).order("casa").limit(quantos * 2);
    for (const r of (data ?? []) as LinhaAcervo[]) if (lista.length < quantos && !lista.some((x) => x.chave === r.chave)) lista.push(r);
  }
  return lista;
}

export type Resultado = { nome: string; casa: string; notas: boolean; nivel: boolean; erro?: string };

async function completarUm(sb: Sb, r: LinhaAcervo): Promise<Resultado> {
  const antesNotas = r.notas_saida.length + r.notas_coracao.length + r.notas_fundo.length;
  const antesNivel = Boolean(r.fixacao_nivel && r.projecao_nivel && !nivelEstimado(r));
  const base = fichaDoAcervo(r, true);
  if (!base) return { nome: r.nome, casa: r.casa, notas: false, nivel: false, erro: "sem ficha-base" };
  try {
    const pronta = await completarFicha({ ...base, fonteFicha: "acervo" });
    await guardarNoAcervo(pronta);
    const { data } = await sb.from("acervo").select("*").eq("chave", r.chave).maybeSingle();
    const depois = (data ?? r) as LinhaAcervo;
    const notas = depois.notas_saida.length + depois.notas_coracao.length + depois.notas_fundo.length > antesNotas;
    const nivel = !antesNivel && Boolean(depois.fixacao_nivel && depois.projecao_nivel && !nivelEstimado(depois));
    const erro = (pronta as { erroComplemento?: string }).erroComplemento;
    return { nome: r.nome, casa: r.casa, notas, nivel, ...(erro ? { erro: String(erro).slice(0, 120) } : !notas && !nivel ? { erro: "a pesquisa não achou dados novos" } : {}) };
  } catch (e) {
    return { nome: r.nome, casa: r.casa, notas: false, nivel: false, erro: e instanceof Error ? e.message.slice(0, 120) : "falhou" };
  }
}

/** Completa até `quantos` perfumes da fila, 3 de cada vez. */
export async function completarAcervo(quantos: number, alvo: "notas" | "niveis" | "tudo" = "tudo"): Promise<{ feitos: Resultado[]; situacao: Situacao } | { erro: string }> {
  const sb = clienteServico();
  if (!sb) return { erro: "Falta SUPABASE_SERVICE_ROLE_KEY na Vercel." };
  if (!geminiConfigurado()) return { erro: "A IA não está ligada (falta a chave na Vercel)." };
  const fila = await proximos(sb, Math.max(1, Math.min(quantos, 6)), alvo);
  if (!fila.length) return { feitos: [], situacao: await situacaoDoAcervo(sb) };
  // marca antes de começar: duas abas abertas não pegam o mesmo perfume
  const marca = await sb.from("acervo").update({ tentado_em: new Date().toISOString() }).in("chave", fila.map((r) => r.chave));
  if (marca.error) return { erro: "Rode o SQL supabase/migrations/0005_acervo_busca.sql no Supabase antes de completar o acervo." };
  const feitos: Resultado[] = [];
  for (let i = 0; i < fila.length; i += 3) feitos.push(...(await Promise.all(fila.slice(i, i + 3).map((r) => completarUm(sb, r)))));
  return { feitos, situacao: await situacaoDoAcervo(sb) };
}
