import "server-only";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { acordePT, acordePrincipal, familiaAtlas, NIVEIS_FIXACAO, NIVEIS_PROJECAO, notaConhecida, notasPT } from "@/lib/normalizar";
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
};

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
  };
}

/**
 * Junta com o que já existe. Lista nova com pelo menos o mesmo tamanho substitui (é assim que um lote
 * corrigido entra por cima); lista menor ou vazia nunca apaga a que estava. Link e níveis só preenchem o vazio.
 */
export function mesclar(velha: LinhaAcervo, nova: LinhaAcervo): LinhaAcervo {
  const mais = (a: string[], b: string[]) => (b.length && b.length >= a.length ? b : a);
  return {
    ...velha,
    fragrantica: velha.fragrantica ?? nova.fragrantica,
    notas_saida: mais(velha.notas_saida, nova.notas_saida), notas_coracao: mais(velha.notas_coracao, nova.notas_coracao), notas_fundo: mais(velha.notas_fundo, nova.notas_fundo),
    acordes: mais(velha.acordes, nova.acordes),
    fixacao_nivel: velha.fixacao_nivel ?? nova.fixacao_nivel, projecao_nivel: velha.projecao_nivel ?? nova.projecao_nivel,
  };
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

/** Busca por palavras no acervo (sem IA). */
export async function buscarNoAcervo(texto: string, max = 5): Promise<(LinhaAcervo & { pct: number })[]> {
  if (!supabaseConfigurado()) return [];
  const pal = tira(texto).split(" ").filter((w) => w.length > 1);
  if (!pal.length) return [];
  try {
    const sb = await createClient();
    const maior = [...pal].sort((a, b) => b.length - a.length)[0];
    const { data } = await sb.from("acervo").select("*").or(`nome.ilike.%${maior}%,casa.ilike.%${maior}%`).limit(60);
    return ((data ?? []) as LinhaAcervo[])
      .map((r) => {
        const alvo = tira(`${r.nome} ${r.casa}`);
        const acertos = pal.filter((w) => alvo.includes(w)).length;
        return { ...r, pct: Math.round((acertos / pal.length) * (tira(r.nome).startsWith(pal[0]) ? 96 : 82)) };
      })
      .filter((r) => r.pct >= 40).sort((a, b) => b.pct - a.pct).slice(0, max);
  } catch {
    return []; // tabela ainda não criada: segue sem o acervo
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
export function fichaDoAcervo(r: LinhaAcervo): FichaIA | null {
  const temNotas = r.notas_saida.length + r.notas_coracao.length + r.notas_fundo.length > 0;
  if (!temNotas && !r.acordes.length) return null;
  const acordes = r.acordes.map((nome, i) => ({ nome, valor: Math.max(30, 100 - i * 12) }));
  const f = NIVEIS_FIXACAO.find((n) => n.nome === r.fixacao_nivel), p = NIVEIS_PROJECAO.find((n) => n.nome === r.projecao_nivel);
  return {
    nome: r.nome, casa: r.casa, concentracao: "", perfumistas: [], genero: "", pais: "", descricao: "",
    familia: familiaAtlas(r.acordes.join(" "), acordes[0]?.nome),
    acorde: acordes[0] ? acordePrincipal(acordes[0].nome) : "Amadeirado",
    notas: { saida: notasPT(r.notas_saida), coracao: notasPT(r.notas_coracao), fundo: notasPT(r.notas_fundo) },
    acordes,
    fixacaoH: f?.h, projecaoM: p?.m,
    votos: {
      total: 0, fixacao: [0, 0, 0, 0, 0], projecao: [0, 0, 0, 0],
      estacoes: { primavera: 0, verao: 0, outono: 0, inverno: 0 }, dia: 0, noite: 0, ocasioes: [],
      origem: "acervo", nivelFixacao: r.fixacao_nivel ?? undefined, nivelProjecao: r.projecao_nivel ?? undefined,
    },
    imagem: fotoDoLink(r.fragrantica), forma: "ret", tampa: "#141417",
    fragrantica: r.fragrantica ?? undefined,
    revisar: ["ano", "concentracao", "pais", "votos"],
    completar: false,
  };
}
