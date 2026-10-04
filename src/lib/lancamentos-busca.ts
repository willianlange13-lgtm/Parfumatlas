import "server-only";
import { geminiConfigurado, geminiJSON } from "@/lib/gemini";
import { acordePT, familiaAtlas, notasPT } from "@/lib/normalizar";
import { linhaDoPerfume } from "@/lib/dados";
import type { Perfume, Lancamento } from "@/lib/tipos";

type Cliente = NonNullable<ReturnType<typeof import("@/lib/supabase/servico").clienteServico>>;

/** Casas árabes grandes que sempre entram na busca, além das casas da coleção. */
const ARABES_FIXAS = ["Lattafa", "Maison Alhambra", "Afnan", "Armaf", "Rasasi", "Al Haramain", "Rayhaan", "French Avenue", "Swiss Arabian", "Ajmal"];

type Achado = {
  nome: string; casa: string; ano?: number | null; mes?: number | null;
  tipo?: "FLANKER" | "VERSÃO NOVA" | "INSPIRADO" | "PARECIDO" | null;
  inspirado_em?: string | null; concentracao?: string | null; descricao?: string | null; fragrantica?: string | null;
  saida?: string[] | null; coracao?: string[] | null; fundo?: string[] | null; acordes?: string[] | null;
};

const L = { type: "ARRAY", items: { type: "STRING" } }, S = { type: "STRING" };
const SCHEMA = {
  type: "OBJECT",
  properties: {
    lancamentos: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { nome: S, casa: S, ano: { type: "INTEGER" }, mes: { type: "INTEGER" }, tipo: { type: "STRING", enum: ["FLANKER", "VERSÃO NOVA", "INSPIRADO", "PARECIDO"] }, inspirado_em: S, concentracao: S, descricao: S, fragrantica: S, saida: L, coracao: L, fundo: L, acordes: L },
        required: ["nome", "casa"],
      },
    },
  },
  required: ["lancamentos"],
};

/**
 * Busca semanal de lançamentos (docs/DECISOES.md §19): uma chamada por casa (até 3 pesquisas), 12 casas em paralelo.
 * Procura nas casas da coleção e nas árabes grandes; grava cada achado como perfume + lançamento.
 * O aviso diário (/api/avisos) é quem decide o que vira notificação, pela afinidade.
 */
export async function buscarLancamentos(sb: Cliente): Promise<{ novos: string[]; vistos: number; erro?: string }> {
  if (!geminiConfigurado()) return { novos: [], vistos: 0, erro: "IA não configurada" };
  const { data: col } = await sb.from("colecao").select("perfume:perfumes(casa)");
  const contagem = new Map<string, number>();
  for (const r of (col ?? []) as unknown as { perfume: { casa: string } | null }[]) if (r.perfume?.casa) contagem.set(r.perfume.casa, (contagem.get(r.perfume.casa) ?? 0) + 1);
  const minhas = [...contagem.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 10);
  const casas = [...new Set([...minhas, ...ARABES_FIXAS])].slice(0, 12);
  const hoje = new Date();
  const desde = new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1);
  const mesAno = (d: Date) => d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  // uma busca por casa (até 3 pesquisas), todas em paralelo: com todas numa chamada só, os recentes escapavam
  const pedir = (casa: string) => geminiJSON<{ lancamentos: Achado[] }>([{ text: `Liste os perfumes da casa "${casa}" LANÇADOS de ${mesAno(desde)} até ${mesAno(hoje)}, incluindo os deste mês.
Primeiro abra a página da casa no Fragrantica (fragrantica.com.br/designers/...), que lista do mais novo para o mais antigo; depois procure notícias de lançamento de ${mesAno(hoje)}.
Só perfumes que existem de verdade e saíram nesse período; nada anterior.
Para cada um: nome (sem a casa), casa, ano e mês de lançamento, tipo (FLANKER se for versão de uma linha existente, VERSÃO NOVA se for reformulação/concentração nova, INSPIRADO se for clone de um original famoso, PARECIDO nos demais casos), inspirado_em (o original, se for clone), concentração, uma descrição de até 15 palavras em português, o link da página no Fragrantica, as notas de saída/coração/fundo e os acordes principais, em português.
O que não encontrar fica vazio. Se a casa não lançou nada no período, devolva a lista vazia.` }], { schema: SCHEMA, pesquisar: true, maxBuscas: 3, tempo: 100000, tarefa: "lancamentos" }).then((x) => x.lancamentos ?? []).catch(() => [] as Achado[]);
  const listas = await Promise.all(casas.map(pedir)); // todas juntas: em lotes passaria do tempo da Vercel
  const r = { lancamentos: listas.flat() };

  const novos: string[] = [];
  const achados = r.lancamentos.filter((x) => x?.nome && x?.casa).slice(0, 60);
  for (const x of achados) {
    const ano = Number(x.ano) || hoje.getFullYear();
    if (ano < desde.getFullYear()) continue;
    const acordes = (x.acordes ?? []).map(acordePT).filter(Boolean).map((nome, i) => ({ nome, valor: Math.max(30, 100 - i * 12) }));
    const p: Perfume = {
      id: "", nome: x.nome.trim(), casa: x.casa.trim(), ano, concentracao: x.concentracao ?? "", perfumistas: [],
      familia: familiaAtlas(acordes.map((a) => a.nome).join(" "), acordes[0]?.nome), acorde: acordes[0]?.nome ?? "Amadeirado",
      genero: "", pais: "", descricao: (x.descricao ?? "").split(/\s+/).slice(0, 15).join(" "),
      notas: { saida: notasPT(x.saida ?? []), coracao: notasPT(x.coracao ?? []), fundo: notasPT(x.fundo ?? []) }, acordes,
      imagem: fotoDoLink(x.fragrantica), forma: "ret", tampa: "#141417",
    };
    // não duplica: se a ficha já existe (mesma casa e nome), só liga o lançamento
    const { data: ja } = await sb.from("perfumes").select("id").ilike("nome", p.nome).ilike("casa", p.casa).limit(1).maybeSingle();
    let id = ja?.id as string | undefined;
    if (!id) {
      const { data: ins, error } = await sb.from("perfumes").insert(linhaDoPerfume(p)).select("id").single();
      if (error || !ins) continue;
      id = ins.id as string;
    }
    const tipo: Lancamento["tipo"] = x.tipo ?? "PARECIDO";
    const lancado = `${ano}-${String(Math.min(12, Math.max(1, Number(x.mes) || hoje.getMonth() + 1))).padStart(2, "0")}-01`;
    const { error: e2 } = await sb.from("lancamentos").upsert({ perfume_id: id, tipo, lancado_em: lancado }, { onConflict: "perfume_id", ignoreDuplicates: true });
    if (!e2 && !ja) novos.push(`${p.nome} (${p.casa})`);
  }
  return { novos, vistos: achados.length };
}

const fotoDoLink = (url?: string | null) => {
  const id = url?.match(/fragrantica\.com(?:\.br)?\/perfume\/[^?#]*-(\d+)\.html/i)?.[1];
  return id ? `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg` : null;
};
