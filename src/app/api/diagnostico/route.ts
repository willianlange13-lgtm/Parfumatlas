import { NextResponse } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { geminiConfigurado, geminiJSON, nomeIA } from "@/lib/gemini";
import { completarFicha, gerarFicha, ultimoErroFicha } from "@/lib/ficha";
import { perfumeDaLinha } from "@/lib/dados";
import { clienteServico } from "@/lib/supabase/servico";
import { horasDosVotos, metrosDosVotos, temVotos, votosDe } from "@/lib/normalizar";
import type { Votos } from "@/lib/tipos";
import { lerPagina } from "@/lib/pagina";
import type { NextRequest } from "next/server";

export const maxDuration = 120;

/** Mostra o que está ligado (sem revelar chaves). Abra /api/diagnostico no navegador. */
export async function GET(request: NextRequest) {
  const votos = request.nextUrl.searchParams.get("votos");
  if (votos === "gravar") return gravarVotosReais(request);
  const dup = request.nextUrl.searchParams.get("duplicados");
  if (dup) return duplicados(dup === "juntar");
  if (votos) return votosSuspeitosNoBanco(votos === "corrigir");
  // ?completar=Nome&casa=Casa : mostra o que a IA completa numa ficha do acervo (gasta uma pesquisa)
  const comp = request.nextUrl.searchParams.get("completar");
  if (comp) {
    const t0 = Date.now();
    const base = await gerarFicha({ nome: comp, casa: request.nextUrl.searchParams.get("casa") ?? "" });
    if (!base) return NextResponse.json({ erro: `não achei a ficha: ${ultimoErroFicha}` });
    const p = await completarFicha(base);
    return NextResponse.json({
      fonte: base.fonteFicha ?? "ia", segundos: Math.round((Date.now() - t0) / 1000),
      erro: (p as { erroComplemento?: string }).erroComplemento ?? null,
      antes: { fixacaoH: base.fixacaoH ?? null, projecaoM: base.projecaoM ?? null, votos: base.votos ?? null },
      depois: { fixacaoH: p.fixacaoH ?? null, projecaoM: p.projecaoM ?? null, votos: p.votos ?? null, ano: p.ano, genero: p.genero, concentracao: p.concentracao, pais: p.pais, acordes: p.acordes, notas: p.notas },
    });
  }
  const r: Record<string, string> = {};
  r.supabase = supabaseConfigurado() ? "chaves ok" : "FALTA NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY";
  if (supabaseConfigurado()) {
    const sb = await createClient();
    const { data: u } = await sb.auth.getUser();
    r.login = u.user ? `logado como ${u.user.email}` : "não logado";
    const { error } = await sb.from("perfumes").select("id").limit(1);
    r.banco = error ? `ERRO: ${error.message} (rodou o SQL 0001_inicial.sql?)` : "tabelas ok";
    const { data: b, error: eb } = await sb.storage.from("frascos").list("", { limit: 1 });
    r.fotos = eb ? `ERRO: ${eb.message}` : `pasta de fotos ok${b ? "" : ""}`;
  }
  r.ia = geminiConfigurado() ? nomeIA() : "nenhuma";
  if (!geminiConfigurado()) r.gemini = "FALTA OPENAI_API_KEY (ou GEMINI_API_KEY)";
  else if (!request.nextUrl.searchParams.get("ia")) r.gemini = "chave ok (para testar a IA, abra com ?ia=1; o teste gasta um pouco)";
  else {
    try {
      const t = await geminiJSON<{ ok: string }>([{ text: 'Responda {"ok":"sim"}' }], { schema: { type: "OBJECT", properties: { ok: { type: "STRING" } }, required: ["ok"] } });
      r.gemini = t.ok === "sim" ? `${nomeIA()} respondendo` : "IA respondeu algo estranho";
    } catch (e) {
      r.gemini = `ERRO: ${e instanceof Error ? e.message.slice(0, 200) : "desconhecido"}`;
    }
  }
  // teste da leitura de página (não gasta a cota da IA): /api/diagnostico?pagina=https://...
  const url = request.nextUrl.searchParams.get("pagina");
  if (url) {
    const pg = await lerPagina(url);
    r.pagina = pg ? `lida: ${pg.texto.length} letras, foto ${pg.imagem ? "achada" : "não achada"}, início: ${pg.texto.slice(0, 120).replace(/\s+/g, " ")}` : "o site bloqueou a leitura";
    return NextResponse.json(r, { headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } });
  }
  // teste da foto de uma nota: /api/diagnostico?nota=Bergamota
  const nota = request.nextUrl.searchParams.get("nota");
  if (nota) {
    const { WIKI_NOTA } = await import("@/data/referencia");
    const t = WIKI_NOTA[nota];
    if (!t) r.nota = "nota sem foto cadastrada";
    else {
      const w = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`, { headers: { "User-Agent": "ParfumAtlas/1.0 (https://atlas-system-three.vercel.app)", "Api-User-Agent": "ParfumAtlas/1.0 (https://atlas-system-three.vercel.app)" } }).catch((e) => e as Error);
      r.nota = w instanceof Error ? `ERRO: ${w.message}` : `Wikipédia ${w.status}: ${w.ok ? ((await w.json()).thumbnail?.source ?? "sem imagem") : (await w.text()).slice(0, 120)}`;
    }
  }
  // teste da ficha: /api/diagnostico?ficha=Pacific Aura|Rayhaan
  const teste = request.nextUrl.searchParams.get("ficha");
  if (teste && geminiConfigurado()) {
    const [nome, casa = ""] = teste.split("|");
    const f = await gerarFicha({ nome, casa });
    r.ficha = f ? `ok: ${f.nome} (${f.casa}), ${f.notas.saida.length + f.notas.coracao.length + f.notas.fundo.length} notas, ${f.acordes.length} acordes` : `ERRO: ${ultimoErroFicha || "sem detalhe"}`;
  }
  r.avisos = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY ? "chaves ok" : "desligado (faltam as chaves VAPID)";
  r.servico = process.env.SUPABASE_SERVICE_ROLE_KEY ? "chave ok" : "FALTA SUPABASE_SERVICE_ROLE_KEY (avisos e Alexa)";
  r.alexa = process.env.ALEXA_SKILL_ID && process.env.ATLAS_USER_ID ? "configurada" : "não configurada (opcional)";
  return NextResponse.json(r, { headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } });
}

/**
 * Limpeza histórica dos votos copiados (ver docs/DECISOES.md).
 * /api/diagnostico?votos=1 → só lista, sem IA e sem alterar nada.
 * /api/diagnostico?votos=corrigir → busca de novo SÓ os votos do próximo perfume da lista (até 3 buscas)
 * e grava o resultado em todas as cópias dele. A ficha não é refeita. Recarregue até a lista zerar.
 */
async function votosSuspeitosNoBanco(corrigir: boolean) {
  const json = (x: unknown) => NextResponse.json(x, { headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } });
  if (!supabaseConfigurado()) return json({ erro: "Banco não configurado." });
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return json({ erro: "Entre no Atlas antes de abrir este endereço." });
  const { data, error } = await sb.from("perfumes").select("*");
  if (error) return json({ erro: error.message });
  const n = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const ass = (l: unknown) => (Array.isArray(l) ? l.map((x) => Math.round(Number(x) || 0)).join(",") : "");
  // assinatura do Pacific Aura já normalizada em porcentagem por votosDe() (é assim que fica no banco)
  const PACIFIC = "3,15,66,14,2|12,61,24,3";
  const PADRAO = new Set(["0,0,100,0,0", "5,15,55,20,5"]);
  type Item = { id: string; nome: string; casa: string; fixacao: string; projecao: string; total: number; origem: string };
  const itens: Item[] = (data ?? []).map((p) => {
    const v = (p.votos ?? {}) as Record<string, unknown>;
    return { id: p.id as string, nome: p.nome as string, casa: p.casa as string, fixacao: ass(v.fixacao), projecao: ass(v.projecao), total: Number(v.total) || 0, origem: String(v.origem ?? "") };
  });
  const comVotos = itens.filter((x) => /[1-9]/.test(x.fixacao) && /[1-9]/.test(x.projecao));
  const dono = (x: Item) => n(x.nome) === "pacific aura" && n(x.casa).includes("rayhaan");
  const grupos = new Map<string, Item[]>();
  for (const x of comVotos) grupos.set(`${x.fixacao}|${x.projecao}`, [...(grupos.get(`${x.fixacao}|${x.projecao}`) ?? []), x]);
  const suspeitos = comVotos.flatMap((x) => {
    const chave = `${x.fixacao}|${x.projecao}`;
    const motivo = chave === PACIFIC && !dono(x) ? "cópia do Pacific Aura"
      : PADRAO.has(x.fixacao) ? "vetor padrão do prompt antigo"
      : (grupos.get(chave)?.filter((y) => n(y.nome) !== n(x.nome) || n(y.casa) !== n(x.casa)).length ?? 0) > 0 && !dono(x) ? "votos idênticos a outro perfume"
      : null;
    return motivo ? [{ ...x, motivo }] : [];
  });
  const repetidos = [...grupos.entries()].filter(([, l]) => new Set(l.map((y) => `${n(y.nome)}|${n(y.casa)}`)).size > 1)
    .map(([chave, l]) => ({ fixacao: chave.split("|")[0], projecao: chave.split("|")[1], perfumes: l.map((y) => `${y.nome} (${y.casa}) · ${y.origem || "sem origem"} · total ${y.total}`) }));
  if (!corrigir || !suspeitos.length) return json({ analisados: itens.length, comVotos: comVotos.length, suspeitos: suspeitos.length, lista: suspeitos, gruposRepetidos: repetidos });

  const alvo = suspeitos[0];
  const copias = suspeitos.filter((x) => n(x.nome) === n(alvo.nome) && n(x.casa) === n(alvo.casa));
  const linha = (data ?? []).find((x) => x.id === alvo.id)!;
  const p = perfumeDaLinha(linha);
  const out = await completarFicha({ ...p, revisar: ["votos"] }, { forte: true, soReal: true });
  const v = out.votos;
  const ok = v && temVotos(v.fixacao) && temVotos(v.projecao) && ass(v.fixacao) !== alvo.fixacao;
  const restantes = suspeitos.filter((x) => !copias.includes(x)).map((x) => `${x.nome} (${x.casa})`);
  if (!ok) return json({ perfume: `${alvo.nome} (${alvo.casa})`, resultado: "não achei votos confiáveis agora; nada foi alterado", restantes: [...new Set(restantes)] });
  for (const c of copias) {
    const atual = (data ?? []).find((x) => x.id === c.id)!;
    const { error: e } = await sb.from("perfumes").update({ votos: { ...((atual.votos ?? {}) as object), ...v }, fixacao_h: out.fixacaoH ?? null, projecao_m: out.projecaoM ?? null }).eq("id", c.id);
    if (e) return json({ erro: e.message });
  }
  return json({ perfume: `${alvo.nome} (${alvo.casa})`, copiasCorrigidas: copias.length, fixacao: v.fixacao, projecao: v.projecao, total: v.total, origem: v.origem, horas: out.fixacaoH, metros: out.projecaoM, restantes: [...new Set(restantes)] });
}

/**
 * Grava contagens reais conferidas à mão (custo zero), em todas as cópias do perfume.
 * /api/diagnostico?votos=gravar&nome=Pacific Aura&casa=Rayhaan&fx=42,194,855,179,23&pj=120,610,240,35&total=1971
 */
async function gravarVotosReais(request: NextRequest) {
  const json = (x: unknown) => NextResponse.json(x, { headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } });
  const q = request.nextUrl.searchParams;
  const lista = (s: string | null) => (s ?? "").split(",").map((x) => Number(x.trim())).filter((x) => Number.isFinite(x) && x >= 0);
  const fx = lista(q.get("fx")), pj = lista(q.get("pj"));
  const nome = q.get("nome") ?? "", casa = q.get("casa") ?? "";
  if (!nome || fx.length !== 5 || pj.length !== 4) return json({ erro: "Informe nome, casa, fx (5 números) e pj (4 números)." });
  if (!supabaseConfigurado()) return json({ erro: "Banco não configurado." });
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return json({ erro: "Entre no Atlas antes de abrir este endereço." });
  const { data, error } = await sb.from("perfumes").select("id, nome, casa, votos").ilike("nome", nome).ilike("casa", casa || "%");
  if (error) return json({ erro: error.message });
  if (!data?.length) return json({ erro: "Perfume não encontrado." });
  const novos = votosDe({ fixacao: fx, projecao: pj, total: Number(q.get("total")) || 0, origem: "fragrantica" } as Partial<Votos>, []);
  if (!novos) return json({ erro: "Números inválidos." });
  for (const row of data) {
    const atual = (row.votos ?? {}) as Record<string, unknown>;
    const votos = { ...atual, fixacao: novos.fixacao, projecao: novos.projecao, total: novos.total || atual.total || 0, origem: "fragrantica" };
    const { error: e } = await sb.from("perfumes").update({ votos, fixacao_h: horasDosVotos(novos.fixacao), projecao_m: metrosDosVotos(novos.projecao) }).eq("id", row.id);
    if (e) return json({ erro: e.message });
  }
  return json({ perfume: `${data[0].nome} (${data[0].casa})`, copiasGravadas: data.length, fixacao: novos.fixacao, projecao: novos.projecao, horas: horasDosVotos(novos.fixacao), metros: metrosDosVotos(novos.projecao) });
}

/**
 * Fichas repetidas do mesmo perfume (mesmo nome + casa, concentração escrita de outro jeito).
 * /api/diagnostico?duplicados=1 → só lista.
 * /api/diagnostico?duplicados=juntar → fica a ficha que está na coleção (ou a mais recente); coleção,
 * lançamentos e "inspirado em" passam para ela e as cópias são apagadas. Usa a chave de serviço.
 */
async function duplicados(juntar: boolean) {
  const json = (x: unknown) => NextResponse.json(x, { headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } });
  if (!supabaseConfigurado()) return json({ erro: "Banco não configurado." });
  const sessao = await createClient();
  const { data: u } = await sessao.auth.getUser();
  if (!u.user) return json({ erro: "Entre no Atlas antes de abrir este endereço." });
  const sb = clienteServico();
  if (!sb) return json({ erro: "Falta SUPABASE_SERVICE_ROLE_KEY na Vercel." });
  const n = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const [{ data: ps, error }, { data: col }, { data: lan }] = await Promise.all([
    sb.from("perfumes").select("id, nome, casa, concentracao, atualizado_em"),
    sb.from("colecao").select("id, user_id, perfume_id"),
    sb.from("lancamentos").select("id, perfume_id"),
  ]);
  if (error) return json({ erro: error.message });
  const grupos = new Map<string, NonNullable<typeof ps>>();
  for (const p of ps ?? []) grupos.set(`${n(p.nome)}|${n(p.casa)}`, [...(grupos.get(`${n(p.nome)}|${n(p.casa)}`) ?? []), p]);
  const repetidos = [...grupos.values()].filter((g) => g.length > 1).map((g) => {
    const naColecao = (id: string) => (col ?? []).filter((c) => c.perfume_id === id);
    const fica = [...g].sort((a, b) => naColecao(b.id).length - naColecao(a.id).length || String(b.atualizado_em).localeCompare(String(a.atualizado_em)))[0];
    return { fica, sai: g.filter((x) => x.id !== fica.id), naColecao };
  });
  const resumo = repetidos.map((r) => ({ perfume: `${r.fica.nome} (${r.fica.casa})`, fica: `${r.fica.id} · ${r.fica.concentracao ?? "sem concentração"} · ${r.naColecao(r.fica.id).length} na coleção`, sai: r.sai.map((x) => `${x.id} · ${x.concentracao ?? "sem concentração"} · ${r.naColecao(x.id).length} na coleção`) }));
  if (!juntar) return json({ grupos: resumo.length, lista: resumo });

  const feito: string[] = [], pulado: string[] = [];
  for (const r of repetidos) {
    const donosFica = new Set(r.naColecao(r.fica.id).map((c) => c.user_id));
    // mesma pessoa com as duas fichas na coleção: juntar mexeria nos registros de uso; fica para decisão manual
    if (r.sai.some((x) => r.naColecao(x.id).some((c) => donosFica.has(c.user_id)))) { pulado.push(`${r.fica.nome}: a mesma pessoa tem as duas fichas na coleção`); continue; }
    for (const x of r.sai) {
      await sb.from("colecao").update({ perfume_id: r.fica.id }).eq("perfume_id", x.id);
      if ((lan ?? []).some((l) => l.perfume_id === r.fica.id)) await sb.from("lancamentos").delete().eq("perfume_id", x.id);
      else await sb.from("lancamentos").update({ perfume_id: r.fica.id }).eq("perfume_id", x.id);
      await sb.from("perfumes").update({ inspirado_em: r.fica.id }).eq("inspirado_em", x.id);
      const { error: e } = await sb.from("perfumes").delete().eq("id", x.id);
      if (e) return json({ erro: `${r.fica.nome}: ${e.message}`, feito });
    }
    feito.push(`${r.fica.nome} (${r.fica.casa}): ${r.sai.length} cópia(s) juntada(s)`);
  }
  return json({ feito, pulado });
}
