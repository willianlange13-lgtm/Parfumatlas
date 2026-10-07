import "server-only";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { paisDaCasa } from "@/data/casas";
import { concentracaoPT, generoPT, acordePT, acordePrincipal, familiaAtlas, NIVEIS_FIXACAO, NIVEIS_PROJECAO, notaConhecida, notasPT } from "@/lib/normalizar";
import type { FichaIA } from "@/lib/ficha";

/**
 * Acervo global (tabela `acervo`, docs/DECISOES.md §16): perfumes lidos do Fragrantica pelo Willian no ChatGPT
 * e importados sem IA. Serve para achar e montar a ficha sem pagar pesquisa.
 * (Não confundir com `carregarAcervo()` de dados.ts, que é a coleção do usuário.)
 */

export type LinhaAcervo = {
  chave: string; nome: string; casa: string; fragrantica: string | null;
  notas_saida: string[]; notas_coracao: string[]; notas_fundo: string[]; acordes: string[];
  fixacao_nivel: string | null; projecao_nivel: string | null;
  concentracao: string | null; ano: number | null; genero: string | null;
  /** de onde vieram (migração 0005): "fragrantica", "acervo", "pesquisa", "estimativa (modelo)" */
  fonte_notas?: string | null; fonte_niveis?: string | null; tentado_em?: string | null;
};

/** Nível de fixação/projeção calculado (não votado): pode ser trocado quando chegar o dado real. */
export const nivelEstimado = (r: Pick<LinhaAcervo, "fonte_niveis">) => /^estimativa/i.test(r.fonte_niveis ?? "");

export const chaveAcervo = (nome: string, casa: string) => `${nome} ${casa}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const tira = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();

// aceita o português do Fragrantica no masculino ("Duradouro", "Muito duradouro", "Moderado", "Íntimo"), o inglês e os nomes do Atlas
const FIX: [RegExp, string][] = [[/muito frac|very weak|poor/, "Muito fraca"], [/muito duradour|eterna|eterno|eternal|very long/, "Eterna"], [/frac|weak/, "Fraca"], [/moderad|moderate/, "Moderada"], [/duradour|longa|longo|long/, "Longa"]];
const PROJ: [RegExp, string][] = [[/intim|intimate|suave|soft|fraca|fraco|weak/, "Íntima"], [/moderad|moderate/, "Moderada"], [/enorme|enormous|huge/, "Enorme"], [/forte|strong|heavy/, "Forte"]];
const nivel = (v: unknown, tabela: [RegExp, string][]) => { const t = tira(String(v ?? "")); return t ? (tabela.find(([r]) => r.test(t))?.[1] ?? null) : null; };

/** Link só vale se for do Fragrantica e tiver o nome do perfume no endereço (senão a foto pode ser de outro). */
function linkValido(url: unknown, nome: string) {
  const u = String(url ?? "").trim();
  if (!/^https?:\/\/(www\.)?fragrantica\.com(\.br)?\/perfume\//i.test(u)) return null;
  const alvo = tira(decodeURIComponent(u).replace(/[-_/]+/g, " "));
  return alvo.includes(tira(nome)) ? u : null;
}

const temVotosL = (l: number[]) => l.some((x) => x > 0);
const anoValido = (x: unknown) => { const n = parseInt(String(x ?? ""), 10); return n >= 1700 && n <= new Date().getFullYear() + 1 ? n : null; };
const lista = (x: unknown) => (Array.isArray(x) ? x.map((y) => String(y ?? "").trim()).filter(Boolean) : typeof x === "string" && x.trim() ? x.split(/\s*,\s*/).filter(Boolean) : []);

/** Converte uma linha do ChatGPT (chaves curtas ou por extenso). Devolve o motivo quando não dá. */
export function linhaDoImport(o: Record<string, unknown>): LinhaAcervo | { erro: string } {
  const notas = (o.notas ?? {}) as Record<string, unknown>;
  const nome = String(o.n ?? o.nome ?? "").trim(), casa = String(o.c ?? o.casa ?? "").trim();
  if (!nome) return { erro: "sem nome" };
  if (!casa) return { erro: "sem casa" };
  return {
    chave: chaveAcervo(nome, casa), nome, casa,
    fragrantica: linkValido(o.u ?? o.fragrantica ?? o.link, nome),
    notas_saida: notasPT(lista(o.s ?? notas.saida)), notas_coracao: notasPT(lista(o.m ?? notas.coracao)), notas_fundo: notasPT(lista(o.f ?? notas.fundo)),
    acordes: [...new Set(lista(o.a ?? o.acordes).map(acordePT))],
    // o nível pode vir com outros nomes de campo (com acento, em inglês ou como os rótulos do Fragrantica)
    fixacao_nivel: nivel(o.fx ?? o.fixacao ?? o["fixação"] ?? o.longevidade ?? o.longevity ?? o.duracao ?? o["duração"] ?? o.fixacao_nivel, FIX),
    projecao_nivel: nivel(o.pj ?? o.projecao ?? o["projeção"] ?? o.rastro ?? o.sillage ?? o.projection ?? o.projecao_nivel, PROJ),
    concentracao: concentracaoPT(String(o.k ?? o.concentracao ?? o["concentração"] ?? "")) || null,
    ano: anoValido(o.y ?? o.ano ?? o.lancamento),
    genero: generoPT(String(o.g ?? o.genero ?? o["gênero"] ?? "")) || null,
  };
}

/**
 * Junta com o que já existe. Lista nova com pelo menos o mesmo tamanho substitui (é assim que um lote
 * corrigido entra por cima); lista menor ou vazia nunca apaga a que estava. Link e níveis só preenchem o vazio.
 */
export function mesclar(velha: LinhaAcervo, nova: LinhaAcervo, soVazios = false): LinhaAcervo {
  // soVazios: resultado de pesquisa paga só completa o que faltava; quem manda é o lote importado
  const mais = (a: string[], b: string[]) => (soVazios ? (a.length ? a : b) : b.length && b.length >= a.length ? b : a);
  const semNotas = !velha.notas_saida.length && !velha.notas_coracao.length && !velha.notas_fundo.length;
  // nível estimado (calculado, não votado) cede lugar ao nível real que chegar
  const trocaNivel = nivelEstimado(velha) && !nivelEstimado(nova) && Boolean(nova.fixacao_nivel || nova.projecao_nivel);
  const junta: LinhaAcervo = {
    ...velha,
    fragrantica: velha.fragrantica ?? nova.fragrantica,
    notas_saida: mais(velha.notas_saida, nova.notas_saida), notas_coracao: mais(velha.notas_coracao, nova.notas_coracao), notas_fundo: mais(velha.notas_fundo, nova.notas_fundo),
    acordes: mais(velha.acordes, nova.acordes),
    fixacao_nivel: trocaNivel ? nova.fixacao_nivel ?? velha.fixacao_nivel : velha.fixacao_nivel ?? nova.fixacao_nivel,
    projecao_nivel: trocaNivel ? nova.projecao_nivel ?? velha.projecao_nivel : velha.projecao_nivel ?? nova.projecao_nivel,
    concentracao: velha.concentracao ?? nova.concentracao, ano: velha.ano ?? nova.ano, genero: velha.genero ?? nova.genero,
  };
  if (trocaNivel || (!velha.fixacao_nivel && !velha.projecao_nivel && (nova.fixacao_nivel || nova.projecao_nivel))) junta.fonte_niveis = nova.fonte_niveis ?? "fragrantica";
  if (semNotas && (nova.notas_saida.length || nova.notas_coracao.length || nova.notas_fundo.length)) junta.fonte_notas = nova.fonte_notas ?? velha.fonte_notas ?? null;
  return junta;
}

/** Lê texto colado ou arquivo: JSON Lines, lista JSON ou um objeto só. */
export function lerImport(texto: string): { itens: { linha: number; obj: Record<string, unknown> }[]; erros: { linha: number; motivo: string }[] } {
  const t = texto.replace(/^﻿/, "").replace(/^```(?:json|jsonl)?\s*/i, "").replace(/```\s*$/i, "").trim();
  if (t.startsWith("[")) {
    try { return { itens: (JSON.parse(t) as Record<string, unknown>[]).map((obj, i) => ({ linha: i + 1, obj })), erros: [] }; } catch { /* cai para linha a linha */ }
  }
  const itens: { linha: number; obj: Record<string, unknown> }[] = [], erros: { linha: number; motivo: string }[] = [];
  t.split(/\r?\n/).forEach((l, i) => {
    const s = l.trim().replace(/,$/, "");
    if (!s || s === "[" || s === "]") return;
    try { itens.push({ linha: i + 1, obj: JSON.parse(s) }); } catch { erros.push({ linha: i + 1, motivo: "linha não é JSON" }); }
  });
  return { itens, erros };
}

export const notasSemTraducao = (l: LinhaAcervo) => [...l.notas_saida, ...l.notas_coracao, ...l.notas_fundo].filter((n) => !notaConhecida(n));

const NORMAL = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const trigramas = (s: string) => { const t = `  ${s} `; const g = new Set<string>(); for (let i = 0; i < t.length - 2; i++) g.add(t.slice(i, i + 3)); return g; };
/** Semelhança de trigramas entre a busca e o melhor trecho do alvo (como o word_similarity do Postgres). */
function parecido(q: string, alvo: string) {
  const a = trigramas(q); if (!a.size) return 0;
  const pal = alvo.split(" ");
  let melhor = 0;
  for (let i = 0; i < pal.length; i++) for (let j = i + 1; j <= Math.min(pal.length, i + q.split(" ").length + 1); j++) {
    const b = trigramas(pal.slice(i, j).join(" "));
    let comum = 0; a.forEach((x) => { if (b.has(x)) comum++; });
    melhor = Math.max(melhor, (2 * comum) / (a.size + b.size)); // coeficiente de Dice
  }
  return melhor;
}
/**
 * Nota de 0 a 99 para o quanto o perfume bate com o que foi digitado. Ordem das palavras não importa
 * ("lattafa khamrah" = "khamrah lattafa"); erro de digitação ganha nota pela semelhança ("kamrah").
 */
export function pontuar(texto: string, nome: string, casa: string): number {
  const q = NORMAL(texto), n = NORMAL(nome), alvo = `${n} ${NORMAL(casa)}`;
  const pal = q.split(" ").filter((w) => w.length > 1);
  if (!pal.length) return 0;
  if (q === n || q === alvo || q === `${NORMAL(casa)} ${n}`) return 99;
  const acertos = pal.filter((w) => alvo.includes(w)).length;
  if (acertos === pal.length) return n.startsWith(pal[0]) || n.startsWith(q) ? 96 : 92;
  const parcial = Math.round((acertos / pal.length) * 80);
  return Math.max(parcial, Math.min(88, Math.round(parecido(q, alvo) * 92)));
}

/** Busca por nome/casa no acervo (sem IA). Usa a função do banco (rápida e tolerante a erro); sem ela, a busca antiga. */
export async function buscarNoAcervo(texto: string, max = 5): Promise<(LinhaAcervo & { pct: number })[]> {
  if (!supabaseConfigurado()) return [];
  const pal = tira(texto).split(" ").filter((w) => w.length > 1);
  if (!pal.length) return [];
  try {
    const sb = await createClient();
    let linhas: LinhaAcervo[] = [];
    const rpc = await sb.rpc("buscar_acervo", { q: texto, lim: Math.max(12, max * 3) });
    if (!rpc.error) linhas = (rpc.data ?? []) as LinhaAcervo[];
    else {
      // migração 0005 ainda não rodada: procura pelas palavras mais longas (qualquer ordem)
      const maiores = [...pal].sort((a, b) => b.length - a.length).slice(0, 3);
      const { data } = await sb.from("acervo").select("*").or(maiores.flatMap((w) => [`nome.ilike.%${w}%`, `casa.ilike.%${w}%`]).join(",")).limit(80);
      linhas = (data ?? []) as LinhaAcervo[];
    }
    return linhas
      .map((r) => ({ ...r, pct: pontuar(texto, r.nome, r.casa) }))
      .filter((r) => r.pct >= 40).sort((a, b) => b.pct - a.pct || a.nome.length - b.nome.length).slice(0, max);
  } catch {
    return []; // tabela ainda não criada: segue sem o acervo
  }
}

/** Perfumes do acervo que têm todas estas notas (aba Notas da busca). */
export async function buscarNoAcervoPorNotas(notas: string[], max = 12): Promise<LinhaAcervo[]> {
  if (!supabaseConfigurado() || !notas.length) return [];
  try {
    const sb = await createClient();
    const rpc = await sb.rpc("buscar_acervo_notas", { notas, lim: max });
    if (!rpc.error) return (rpc.data ?? []) as LinhaAcervo[];
    // sem a migração 0005: as notas de uma camada só
    const { data } = await sb.from("acervo").select("*").or(["notas_saida", "notas_coracao", "notas_fundo"].map((c) => `${c}.cs.{${notas.map((n) => `"${n.replace(/"/g, "")}"`).join(",")}}`).join(",")).limit(max);
    return (data ?? []) as LinhaAcervo[];
  } catch {
    return [];
  }
}

export async function acharNoAcervo(nome: string, casa: string): Promise<LinhaAcervo | null> {
  if (!supabaseConfigurado() || !nome) return null;
  try {
    const sb = await createClient();
    const { data } = await sb.from("acervo").select("*").eq("chave", chaveAcervo(nome, casa)).maybeSingle();
    return (data as LinhaAcervo | null) ?? null;
  } catch {
    return null;
  }
}

export const fotoDoLink = (url?: string | null) => {
  const id = url?.match(/fragrantica\.com(?:\.br)?\/perfume\/[^?#]*-(\d+)\.html/i)?.[1];
  return id ? `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg` : null;
};

/**
 * Ficha montada só com o acervo, sem IA. Votos sem distribuição inventada: só o nível mais votado
 * vira horas/metros pela régua do Atlas (origem "acervo"). Ano, concentração, país e "quando usar" ficam para revisar.
 */
export function fichaDoAcervo(r: LinhaAcervo, forcar = false): FichaIA | null {
  const temNotas = r.notas_saida.length + r.notas_coracao.length + r.notas_fundo.length > 0;
  // forcar: ficha-base mesmo vazia, para a IA completar (Completar acervo com IA)
  if (!temNotas && !r.acordes.length && !forcar) return null;
  const acordes = r.acordes.map((nome, i) => ({ nome, valor: Math.max(30, 100 - i * 12) }));
  const f = NIVEIS_FIXACAO.find((n) => n.nome === r.fixacao_nivel), p = NIVEIS_PROJECAO.find((n) => n.nome === r.projecao_nivel);
  return {
    nome: r.nome, casa: r.casa, concentracao: r.concentracao ?? "", ano: r.ano ?? undefined, perfumistas: [], genero: r.genero ?? "", pais: paisDaCasa(r.casa) ?? "", descricao: "",
    familia: familiaAtlas(r.acordes.join(" "), acordes[0]?.nome),
    acorde: acordes[0] ? acordePrincipal(acordes[0].nome) : "Amadeirado",
    notas: { saida: notasPT(r.notas_saida), coracao: notasPT(r.notas_coracao), fundo: notasPT(r.notas_fundo) },
    acordes,
    fixacaoH: f?.h, projecaoM: p?.m,
    votos: {
      total: 0, fixacao: [0, 0, 0, 0, 0], projecao: [0, 0, 0, 0],
      estacoes: { primavera: 0, verao: 0, outono: 0, inverno: 0 }, dia: 0, noite: 0, ocasioes: [],
      origem: "acervo", nivelFixacao: r.fixacao_nivel ?? undefined, nivelProjecao: r.projecao_nivel ?? undefined,
      // nível calculado (planilha/modelo), não votado: a ficha mostra "estimativa" e a IA pode trocar pelo real
      ...(nivelEstimado(r) && (r.fixacao_nivel || r.projecao_nivel) ? { estimado: true } : {}),
    },
    imagem: fotoDoLink(r.fragrantica), forma: "ret", tampa: "#141B18",
    fragrantica: r.fragrantica ?? undefined,
    // o que falta vai para a IA completar em segundo plano (completarDoAcervo, só os campos vazios).
    // Sempre há o que completar: descrição e "quando usar" não vêm no lote.
    completar: true,
    revisar: [...(r.ano ? [] : ["ano"]), ...(r.concentracao ? [] : ["concentracao"]), ...(r.genero ? [] : ["genero"]), ...(paisDaCasa(r.casa) ? [] : ["pais"]), "votos"],
  };
}

/**
 * Perfume que não estava no acervo e foi pesquisado (pago): o resultado entra no acervo (origem "pesquisa"),
 * para a próxima vez sair de graça. Mescla sem apagar o que veio da importação. O nível só entra quando
 * há votos (o mais votado); sem votos fica vazio. Falha aqui nunca derruba o cadastro.
 */
export async function guardarNoAcervo(f: FichaIA): Promise<void> {
  try {
    if (!f?.nome || !f?.casa) return;
    const { clienteServico } = await import("@/lib/supabase/servico");
    const sb = clienteServico();
    if (!sb) return;
    const fx = f.votos?.fixacao ?? [], pj = f.votos?.projecao ?? [];
    const maisVotado = (l: number[]) => (l.some((x) => x > 0) ? l.indexOf(Math.max(...l)) : -1);
    const linkFr = linhaDoImport({ n: f.nome, c: f.casa, u: f.fragrantica ?? f.imagem ?? "" }) as LinhaAcervo;
    const nova: LinhaAcervo = {
      chave: chaveAcervo(f.nome, f.casa), nome: f.nome, casa: f.casa,
      fragrantica: linkFr.fragrantica,
      notas_saida: f.notas?.saida ?? [], notas_coracao: f.notas?.coracao ?? [], notas_fundo: f.notas?.fundo ?? [],
      acordes: (f.acordes ?? []).map((a) => a.nome).filter(Boolean),
      fixacao_nivel: f.votos?.estimado ? null : f.votos?.origem === "acervo" ? f.votos.nivelFixacao ?? null : NIVEIS_FIXACAO[maisVotado(fx)]?.nome ?? null,
      projecao_nivel: f.votos?.estimado ? null : f.votos?.origem === "acervo" ? f.votos.nivelProjecao ?? null : NIVEIS_PROJECAO[maisVotado(pj)]?.nome ?? null,
      concentracao: concentracaoPT(f.concentracao ?? "") || null, ano: anoValido(f.ano), genero: generoPT(f.genero) || f.genero || null,
      fonte_notas: "pesquisa",
      fonte_niveis: temVotosL(fx) ? "fragrantica (votos)" : "fragrantica (nível mais votado)",
    };
    if (!nova.notas_saida.length && !nova.notas_coracao.length && !nova.notas_fundo.length && !nova.acordes.length) return;
    const { data: velha } = await sb.from("acervo").select("*").eq("chave", nova.chave).maybeSingle();
    const r = velha ? mesclar(velha as LinhaAcervo, nova, true) : nova;
    if (!r.fixacao_nivel && !r.projecao_nivel) r.fonte_niveis = null;
    // "busca" é coluna calculada pelo banco (0005): não pode ir no upsert
    const { busca: _b, ...gravar } = r as LinhaAcervo & { busca?: string };
    void _b;
    let { error } = await sb.from("acervo").upsert({ ...gravar, ...(velha ? {} : { origem: "pesquisa" }), atualizado_em: new Date().toISOString() }, { onConflict: "chave" });
    // sem a migração 0005 as colunas de fonte não existem: grava sem elas
    if (error && /fonte_|tentado_em|column/i.test(error.message)) {
      const { fonte_notas: _fn, fonte_niveis: _fv, tentado_em: _t, ...antigo } = gravar;
      void _fn; void _fv; void _t;
      ({ error } = await sb.from("acervo").upsert({ ...antigo, ...(velha ? {} : { origem: "pesquisa" }), atualizado_em: new Date().toISOString() }, { onConflict: "chave" }));
    }
    if (error) console.error("[atlas:acervo] guardar", error.message);
  } catch (e) {
    console.error("[atlas:acervo] guardar", e instanceof Error ? e.message : e);
  }
}
