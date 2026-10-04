import "server-only";
import { semFundo } from "@/lib/sem-fundo";
import { cache } from "react";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { COLECAO, LANCAMENTOS, PERFUMES } from "@/data/catalogo";
import type { Entrada, ItemColecao, Lancamento, Perfume } from "@/lib/tipos";
import { familiaAtlas } from "@/lib/normalizar";

type Linha = Record<string, unknown>;

export function perfumeDaLinha(r: Linha): Perfume {
  return {
    id: r.id as string,
    nome: r.nome as string,
    casa: r.casa as string,
    ano: (r.ano as number) ?? undefined,
    concentracao: (r.concentracao as string) ?? undefined,
    perfumistas: (r.perfumistas as string[]) ?? [],
    familia: familiaAtlas(r.familia as string, (r.acordes as { nome: string }[] | null)?.[0]?.nome),
    acorde: (r.acorde as string) ?? "",
    genero: (r.genero as string) ?? undefined,
    pais: (r.pais as string) ?? undefined,
    descricao: (r.descricao as string) ?? undefined,
    notas: { saida: (r.notas_saida as string[]) ?? [], coracao: (r.notas_coracao as string[]) ?? [], fundo: (r.notas_fundo as string[]) ?? [] },
    acordes: (r.acordes as Perfume["acordes"]) ?? [],
    fixacaoH: r.fixacao_h != null ? Number(r.fixacao_h) : undefined,
    projecaoM: r.projecao_m != null ? Number(r.projecao_m) : undefined,
    votos: (r.votos as Perfume["votos"]) && Object.keys(r.votos as object).length ? (r.votos as Perfume["votos"]) : undefined,
    clima: (r.clima as Perfume["clima"]) && Object.keys(r.clima as object).length ? (r.clima as Perfume["clima"]) : undefined,
    forma: ((r.votos as Linha)?.forma as Perfume["forma"]) ?? "ret",
    tampa: ((r.votos as Linha)?.tampa as string) ?? "#141417",
    inspiradoEm: (r.inspirado_em as string) ?? undefined,
    parecidos: ((r.votos as Linha)?.parecidos as Perfume["parecidos"]) ?? undefined,
    mesmaCasa: ((r.votos as Linha)?.mesmaCasa as Perfume["mesmaCasa"]) ?? undefined,
    buscaParecidos: ((r.votos as Linha)?.buscaParecidos as Perfume["buscaParecidos"]) ?? null,
    dnaOriginal: ((r.votos as Linha)?.dnaOriginal as string) ?? null,
    fonteFicha: ((r.votos as Linha)?.fonteFicha as Perfume["fonteFicha"]) ?? null,
    // foto oficial do Fragrantica vira a versão sem fundo branco (/api/frasco)
    imagem: semFundo(r.imagem_url as string | null),
    fontes: (r.fontes as Perfume["fontes"]) ?? [],
    revisar: (r.campos_revisar as string[]) ?? [],
  };
}

export function linhaDoPerfume(p: Perfume): Linha {
  return {
    nome: p.nome, casa: p.casa, ano: p.ano ?? null, concentracao: p.concentracao ?? null, perfumistas: p.perfumistas,
    familia: p.familia, acorde: p.acorde, genero: p.genero ?? null, pais: p.pais ?? null, descricao: p.descricao ?? null,
    notas_saida: p.notas.saida, notas_coracao: p.notas.coracao, notas_fundo: p.notas.fundo, acordes: p.acordes,
    fixacao_h: p.fixacaoH ?? null, projecao_m: p.projecaoM ?? null,
    votos: { ...(p.votos ?? {}), forma: p.forma, tampa: p.tampa, parecidos: p.parecidos ?? [], mesmaCasa: p.mesmaCasa ?? [], buscaParecidos: p.buscaParecidos ?? null, dnaOriginal: p.dnaOriginal ?? null, fonteFicha: p.fonteFicha ?? null }, clima: p.clima ?? {},
    imagem_url: p.imagem ?? null, fontes: p.fontes ?? [], campos_revisar: p.revisar ?? [],
  };
}

export type Acervo = {
  demo: boolean;
  perfumes: Map<string, Perfume>;
  colecao: Entrada[];
  lancamentos: (Lancamento & { perfume: Perfume })[];
};

function acervoDemo(): Acervo {
  const perfumes = new Map(PERFUMES.map((p) => [p.id, p]));
  return {
    demo: true,
    perfumes,
    colecao: COLECAO.map((c) => ({ ...c, perfume: perfumes.get(c.perfumeId)! })),
    lancamentos: LANCAMENTOS.map((l) => ({ ...l, perfume: perfumes.get(l.perfumeId)! })),
  };
}

/** Lê tudo do Supabase. Enquanto a coleção estiver vazia (ou sem banco), usa a coleção de exemplo. */
export const carregarAcervo = cache(async (): Promise<Acervo> => {
  if (!supabaseConfigurado()) return acervoDemo();
  return lerAcervo(await createClient());
});

type Cliente = Awaited<ReturnType<typeof createClient>>;

/** Lê o acervo com um cliente qualquer. Com `userId` (chave de serviço), filtra pelo dono. */
export async function lerAcervo(supabase: Cliente, userId?: string): Promise<Acervo> {
  let qc = supabase.from("colecao").select("*, perfume:perfumes(*)").order("numero");
  if (userId) qc = qc.eq("user_id", userId);
  const { data: itens } = await qc;
  if (!itens || itens.length === 0) return acervoDemo();

  const demo = acervoDemo();
  const perfumes = new Map(demo.perfumes);
  const colecao: Entrada[] = itens.map((r: Linha) => {
    const perfume = perfumeDaLinha(r.perfume as Linha);
    perfumes.set(perfume.id, perfume);
    const item: ItemColecao = {
      id: r.id as string, perfumeId: perfume.id, numero: r.numero as number, situacao: r.situacao as ItemColecao["situacao"],
      adicionadoEm: r.adicionado_em as string, anotacao: r.anotacao as string, foto: r.foto_url as string,
      minhaFixacao: r.minha_fixacao as number, minhaProjecao: r.minha_projecao as number, minhaNota: r.minha_nota as number,
    };
    return { ...item, perfume };
  });

  let qu = supabase.from("usos").select("colecao_id, dia").order("dia", { ascending: false });
  if (userId) qu = qu.eq("user_id", userId);
  const { data: usos } = await qu;
  const ultimo = new Map<string, string>();
  (usos ?? []).forEach((u: Linha) => { if (!ultimo.has(u.colecao_id as string)) ultimo.set(u.colecao_id as string, u.dia as string); });
  colecao.forEach((c) => (c.ultimoUso = ultimo.get(c.id) ?? c.adicionadoEm));

  const { data: lanc } = await supabase.from("lancamentos").select("*, perfume:perfumes(*)").order("lancado_em", { ascending: false });
  const lancamentos = (lanc ?? []).map((l: Linha) => {
    const perfume = perfumeDaLinha(l.perfume as Linha);
    perfumes.set(perfume.id, perfume);
    return { perfumeId: perfume.id, tipo: (l.tipo as Lancamento["tipo"]) ?? "PARECIDO", ligacao: "", porque: perfume.descricao ?? "", perfume };
  });

  // sem lançamentos no banco ainda: usa a lista do catálogo (lançamentos reais, com a análise pronta)
  return { demo: false, perfumes, colecao, lancamentos: lancamentos.length ? lancamentos : demo.lancamentos };
}

/** Garante que o perfume exista no banco: ids do catálogo local viram uma linha em "perfumes". Devolve o id do banco. */
export async function garantirPerfume(supabase: Awaited<ReturnType<typeof createClient>>, id: string): Promise<string | null> {
  if (/^[0-9a-f-]{36}$/.test(id)) return id;
  const p = PERFUMES.find((x) => x.id === id);
  if (!p) return null;
  const { data } = await supabase.from("perfumes").upsert(linhaDoPerfume(p), { onConflict: "casa,nome,concentracao" }).select("id").single();
  return (data?.id as string) ?? null;
}

export async function buscarEntrada(id: string) {
  const a = await carregarAcervo();
  const e = a.colecao.find((c) => c.id === id || c.perfumeId === id);
  if (e) return { acervo: a, entrada: e, perfume: e.perfume };
  const perfume = a.perfumes.get(id);
  return { acervo: a, entrada: null, perfume: perfume ?? null };
}
