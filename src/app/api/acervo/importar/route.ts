import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { clienteServico } from "@/lib/supabase/servico";
import { lerImport, linhaDoImport, mesclar, notasSemTraducao, type LinhaAcervo } from "@/lib/acervo-global";

/** Importa o lote do ChatGPT para o acervo global. Sem IA nenhuma (docs/DECISOES.md §16). */
export const maxDuration = 60;

const json = (x: unknown, status = 200) => NextResponse.json(x, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  if (!supabaseConfigurado()) return json({ total: 0 });
  const sb = await createClient();
  const { count, error } = await sb.from("acervo").select("chave", { count: "exact", head: true });
  return json(error ? { total: 0, falta: "Rode o SQL supabase/migrations/0002_acervo.sql no Supabase." } : { total: count ?? 0 });
}

export async function POST(request: NextRequest) {
  if (!supabaseConfigurado()) return json({ erro: "Banco não configurado." }, 400);
  const sessao = await createClient();
  const { data: u } = await sessao.auth.getUser();
  if (!u.user) return json({ erro: "Entre no Atlas para importar." }, 401);
  const sb = clienteServico();
  if (!sb) return json({ erro: "Falta SUPABASE_SERVICE_ROLE_KEY na Vercel." }, 400);

  const { texto } = (await request.json()) as { texto?: string };
  if (!texto?.trim()) return json({ erro: "Nada para importar." }, 400);
  const { itens, erros } = lerImport(texto);
  const rejeitados = erros.map((e) => ({ linha: e.linha, nome: "", motivo: e.motivo }));

  // converte e junta repetidos dentro do próprio lote
  const lote = new Map<string, LinhaAcervo>();
  for (const { linha, obj } of itens) {
    const r = obj && typeof obj === "object" ? linhaDoImport(obj) : { erro: "linha não é um objeto" };
    if ("erro" in r) { rejeitados.push({ linha, nome: String((obj as Record<string, unknown>)?.n ?? (obj as Record<string, unknown>)?.nome ?? ""), motivo: r.erro }); continue; }
    lote.set(r.chave, lote.has(r.chave) ? mesclar(lote.get(r.chave)!, r) : r);
  }

  // compara com o que já está no acervo
  const chaves = [...lote.keys()];
  const existentes = new Map<string, LinhaAcervo>();
  for (let i = 0; i < chaves.length; i += 200) {
    const { data, error } = await sb.from("acervo").select("*").in("chave", chaves.slice(i, i + 200));
    if (error) return json({ erro: /relation|does not exist/i.test(error.message) ? "A tabela do acervo ainda não existe: rode o SQL supabase/migrations/0002_acervo.sql no Supabase." : error.message }, 500);
    (data as LinhaAcervo[]).forEach((r) => existentes.set(r.chave, r));
  }
  let novos = 0, atualizados = 0, iguais = 0;
  const gravar: LinhaAcervo[] = [];
  for (const r of lote.values()) {
    const velha = existentes.get(r.chave);
    if (!velha) { novos++; gravar.push(r); continue; }
    const junta = mesclar(velha, r);
    const mudou = (["fragrantica", "notas_saida", "notas_coracao", "notas_fundo", "acordes", "fixacao_nivel", "projecao_nivel"] as const).some((k) => JSON.stringify(junta[k]) !== JSON.stringify(velha[k]));
    if (!mudou) { iguais++; continue; }
    atualizados++;
    gravar.push(junta);
  }
  for (let i = 0; i < gravar.length; i += 500) {
    const parte = gravar.slice(i, i + 500).map((r) => ({
      chave: r.chave, nome: r.nome, casa: r.casa, fragrantica: r.fragrantica,
      notas_saida: r.notas_saida, notas_coracao: r.notas_coracao, notas_fundo: r.notas_fundo, acordes: r.acordes,
      fixacao_nivel: r.fixacao_nivel, projecao_nivel: r.projecao_nivel, atualizado_em: new Date().toISOString(),
    }));
    const { error } = await sb.from("acervo").upsert(parte, { onConflict: "chave" });
    if (error) return json({ erro: error.message, novos, atualizados }, 500);
  }

  const semTraducao = [...new Set([...lote.values()].flatMap(notasSemTraducao))].sort();
  const semLink = [...lote.values()].filter((r) => !r.fragrantica).map((r) => `${r.nome} (${r.casa})`);
  const semNivel = [...lote.values()].filter((r) => !r.fixacao_nivel || !r.projecao_nivel).map((r) => `${r.nome} (${r.casa})`);
  const { count } = await sb.from("acervo").select("chave", { count: "exact", head: true });
  return json({ lidos: itens.length + erros.length, novos, atualizados, iguais, rejeitados, semTraducao, semLink, semNivel, total: count ?? 0 });
}
