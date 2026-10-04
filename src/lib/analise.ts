import { ACORDE_EIXO, EIXOS, CASAS, nota } from "@/data/referencia";
import { SUGESTAO_LACUNA } from "@/data/catalogo";
import { corDoAcorde, OURO } from "@/lib/cores";
import type { Entrada, Perfume } from "@/lib/tipos";

export const naColecao = (c: Entrada[]) => c.filter((e) => e.situacao === "tenho" || e.situacao === "assinatura");
const DIA = 864e5;
export const diasDesde = (iso?: string | null) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DIA)) : 0);

const PESO: Record<string, number> = { Almíscar: 0, Especiado: 0.55, Tabaco: 0.7, Fresco: 0.6, Esfumaçado: 0.7, Couro: 0.7, Incenso: 0.7, Patchouli: 0.7, Doce: 0.9, Mineral: 0.5, Lavanda: 0.8, Amadeirado: 0.7 };

/** Vetor de 8 eixos (0–100) de um perfume. */
export function vetor(p: Perfume): number[] {
  const v = EIXOS.map(() => 0);
  p.acordes.forEach((a) => {
    const eixo = ACORDE_EIXO[a.nome];
    if (!eixo) return;
    const i = EIXOS.indexOf(eixo);
    v[i] = Math.max(v[i], a.valor * (PESO[a.nome] ?? 1));
  });
  return v;
}

function cosseno(a: number[], b: number[]) {
  const dot = a.reduce((s, x, i) => s + x * b[i], 0);
  const na = Math.hypot(...a), nb = Math.hypot(...b);
  return na && nb ? dot / (na * nb) : 0;
}

export function similaridade(a: Perfume, b: Perfume) {
  let s = cosseno(vetor(a), vetor(b));
  const na = new Set([...a.notas.saida, ...a.notas.coracao, ...a.notas.fundo]);
  const comuns = [...b.notas.saida, ...b.notas.coracao, ...b.notas.fundo].filter((n) => na.has(n)).length;
  s = s * 0.8 + Math.min(1, comuns / 4) * 0.2;
  if (a.inspiradoEm === b.id || b.inspiradoEm === a.id) s = Math.max(s, 0.94);
  return Math.round(s * 100);
}

// ---------------- DNA ----------------
const NOME_TOPO: Record<string, string> = { Cítrico: "Frescor cítrico", Frutado: "Frescor frutado", Aromático: "Aromático clássico", Aquático: "Brisa aquática", Floral: "Floral", Amadeirado: "Madeira seca", Âmbar: "Âmbar quente", Gourmand: "Doce envolvente" };
const NOME_FUNDO: Record<string, string> = { Gourmand: "com fundo doce", Âmbar: "com fundo quente", Amadeirado: "com fundo amadeirado", Aromático: "com toque aromático", Cítrico: "com toque cítrico", Frutado: "com toque frutado", Aquático: "com toque aquático", Floral: "com toque floral" };

export function dna(colecao: Entrada[]) {
  const itens = naColecao(colecao);
  const n = Math.max(1, itens.length);
  const soma = EIXOS.map(() => 0);
  itens.forEach((e) => vetor(e.perfume).forEach((x, i) => (soma[i] += x)));
  const bruto = soma.map((s) => s / n);
  const max = Math.max(...bruto, 1);
  const eixos = EIXOS.map((nome, i) => ({ nome, v: Math.round((bruto[i] / max) * 88) }));
  const ordem = [...eixos].sort((a, b) => b.v - a.v);
  // o fundo é o eixo mais forte entre os "de base"
  const BASES = ["Gourmand", "Âmbar", "Amadeirado"];
  const abertura = ordem.filter((e) => !BASES.includes(e.nome));
  const fundos = ordem.filter((e) => BASES.includes(e.nome));
  // o fundo vem das notas de fundo mais comuns nos frascos (doce, quente ou amadeirado)
  const TIPO_FUNDO: [string, RegExp][] = [
    ["Gourmand", /baunilha|tonka|pralin|caramel|mel\b|chocolate|cacau|tâmara|açúcar|benjoim/i],
    ["Âmbar", /^(âmbar|ambar)$|ambrox|ambrofix|resina|incenso|labdano|olíbano|mirra/i],
    ["Amadeirado", /madeira|cedro|sândalo|vetiver|oud|bétula|musgo|patchouli|guaiaco|cashmeran/i],
  ];
  const votoFundo = new Map<string, number>();
  // a primeira nota de fundo pesa mais: é a que a casa destaca
  itens.forEach((e) => e.perfume.notas.fundo.forEach((x, i) => TIPO_FUNDO.forEach(([nome, re]) => { if (re.test(x)) votoFundo.set(nome, (votoFundo.get(nome) ?? 0) + (i === 0 ? 3 : i === 1 ? 2 : 1)); })));
  const fundoNome = [...votoFundo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const base = fundos.find((f) => f.nome === fundoNome) ?? fundos[0];

  const contaAcorde = new Map<string, number>();
  itens.forEach((e) => contaAcorde.set(e.perfume.acorde, (contaAcorde.get(e.perfume.acorde) ?? 0) + 1));
  const lider = [...contaAcorde.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["—", 0];

  const contaNota = new Map<string, number>();
  itens.forEach((e) => new Set([...e.perfume.notas.saida, ...e.perfume.notas.coracao, ...e.perfume.notas.fundo]).forEach((x) => contaNota.set(x, (contaNota.get(x) ?? 0) + 1)));
  const notas = [...contaNota.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8).map(([nome, qtd]) => ({ ...nota(nome), qtd }));

  const familias = ["Cítrico", "Frutado", "Aromático", "Aquático", "Floral", "Amadeirado", "Âmbar", "Baunilha", "Especiado"];
  const cobertas = familias.filter((f) => contaAcorde.has(f)).length;

  const v = (nome: string) => eixos.find((e) => e.nome === nome)!.v;
  const tracos = [
    { nome: `${abertura.find((e) => e.nome === lider[0])?.nome ?? ordem[0].nome} dominante`, cor: OURO },
    notas[0] ? { nome: `Fundo de ${notas[0].nome.toLowerCase()}`, cor: corDoAcorde("Baunilha") } : null,
    v("Amadeirado") >= 40 ? { nome: "Madeira de apoio", cor: corDoAcorde("Amadeirado") } : null,
    v("Floral") < 25 ? { nome: "Quase sem floral", cor: "#8E99AD" } : null,
  ].filter(Boolean) as { nome: string; cor: string }[];

  const media = (f: (p: Perfume) => number) => itens.reduce((s, e) => s + f(e.perfume), 0) / n;
  const pct = (x: number) => Math.max(4, Math.min(96, Math.round(x)));
  const quente = media((p) => { const vv = vetor(p); return (vv[6] + vv[7]) / 2 - (vv[0] + vv[3]) / 2; });
  const carater = [
    { a: "Fresco", b: "Quente", v: pct(50 + quente * 0.6) },
    { a: "Leve", b: "Intenso", v: pct(((media((p) => p.fixacaoH ?? 7) - 4.5) / 5) * 100) },
    { a: "Simples", b: "Complexo", v: pct(media((p) => p.notas.saida.length + p.notas.coracao.length + p.notas.fundo.length) * 6) },
    { a: "Dia", b: "Noite", v: pct(media((p) => ((p.votos?.noite ?? 50) / ((p.votos?.dia ?? 50) + (p.votos?.noite ?? 50))) * 100)) },
    { a: "Clássico", b: "Moderno", v: pct(((media((p) => p.ano ?? 2015) - 1990) / 36) * 100) },
  ];

  const lacunas: { falta: string; perfumeId: string; por: string }[] = [];
  if (!itens.some((e) => e.perfume.acorde === "Floral")) lacunas.push({ falta: "Floral", perfumeId: SUGESTAO_LACUNA.Floral, por: "rosa com patchouli" });
  if (!itens.some((e) => e.perfume.acordes.some((a) => a.nome === "Couro" && a.valor >= 60))) lacunas.push({ falta: "Couro", perfumeId: SUGESTAO_LACUNA.Couro, por: "couro e cardamomo" });
  if (!itens.some((e) => e.perfume.acorde === "Verde")) lacunas.push({ falta: "Verde", perfumeId: SUGESTAO_LACUNA.Verde, por: "folhas e violeta" });
  if (!itens.some((e) => (e.perfume.ano ?? 2020) < 2000)) lacunas.push({ falta: "Clássico antes de 2000", perfumeId: SUGESTAO_LACUNA.Clássico, por: "cítrico de 1966" });

  const est = (k: "primavera" | "verao" | "outono" | "inverno") => itens.filter((e) => (e.perfume.votos?.estacoes[k] ?? 0) >= 60).length;
  const estacoes = [
    { nome: "Primavera", n: est("primavera") },
    { nome: "Verão", n: est("verao") },
    { nome: "Outono", n: est("outono") },
    { nome: "Inverno", n: est("inverno") },
  ];
  const fraca = [...estacoes].sort((a, b) => a.n - b.n)[0];

  return {
    eixos,
    titulo: [NOME_TOPO[abertura.find((e) => e.nome === lider[0])?.nome ?? abertura[0].nome], NOME_FUNDO[base.nome]] as [string, string],
    texto: textoDna([...abertura].sort((a, b) => Number(b.nome === lider[0]) - Number(a.nome === lider[0])).map((e) => e.nome), [base, ...fundos.filter((f) => f !== base)].map((e) => e.nome), lacunas),
    tracos,
    cifras: [
      { l: "FAMÍLIA LÍDER", v: lider[0], c: `${lider[1]} de ${itens.length} frascos` },
      { l: "NOTA LÍDER", v: notas[0]?.nome ?? "—", c: `${notas[0]?.qtd ?? 0} frascos` },
      { l: "DIVERSIDADE", v: `${cobertas} / ${familias.length}`, c: "famílias cobertas" },
    ],
    notas,
    carater,
    lacunas,
    estacoes,
    resumoEstacoes: `O ${fraca.nome.toLowerCase()} é o ponto fraco: só ${fraca.n} frascos funcionam bem nessa estação.`,
    total: itens.length,
    casas: new Set(itens.map((e) => e.perfume.casa)).size,
    vetor: eixos.map((e) => e.v),
  };
}

function textoDna(abre: string[], fundo: string[], lacunas: { falta: string }[]) {
  const l = (s: string) => s.toLowerCase();
  const faltam = lacunas.filter((x) => ["Floral", "Couro"].includes(x.falta)).map((x) => (x.falta === "Floral" ? "flores" : "couro"));
  return `A sua coleção abre com ${l(abre[0])} e ${l(abre[1])} e termina em ${l(fundo[0])} e ${l(fundo[1])}.${faltam.length ? ` Faltam ${faltam.join(" e ")}.` : ""}`;
}

/** Afinidade de um perfume com o DNA (0–100). */
export function afinidade(p: Perfume, colecao: Entrada[]) {
  const d = dna(colecao).vetor;
  const c = cosseno(vetor(p), d);
  const parente = naColecao(colecao).some((e) => e.perfume.id === p.inspiradoEm || e.perfume.inspiradoEm === p.id || similaridade(e.perfume, p) > 85);
  return Math.max(40, Math.min(97, Math.round(48 + c * 46 + (parente ? 6 : 0))));
}

/** Composição da coleção ano a ano, em camadas suaves (gráfico "como seu gosto mudou"). */
export function fluxo(colecao: Entrada[], W = 1000, H = 230, x0 = 30, y0 = 6) {
  const itens = naColecao(colecao).sort((a, b) => a.adicionadoEm.localeCompare(b.adicionadoEm));
  if (!itens.length) return { camadas: [], anos: [], rotulos: [] };
  const anoIni = new Date(itens[0].adicionadoEm).getFullYear();
  const anoFim = Math.max(new Date().getFullYear(), anoIni + 1);
  const anos: number[] = [];
  for (let a = anoIni; a <= anoFim; a++) anos.push(a);
  const acordes = [...new Set(itens.map((e) => e.perfume.acorde))];
  const fim = acordes.map((a) => itens.filter((e) => e.perfume.acorde === a).length);
  const ordem = acordes.map((a, i) => ({ a, n: fim[i] })).sort((x, y) => y.n - x.n).map((x) => x.a);
  // participação acumulada até o fim de cada ano
  const partes = anos.map((ano) => {
    const ate = itens.filter((e) => new Date(e.adicionadoEm).getFullYear() <= ano);
    const t = Math.max(1, ate.length);
    return ordem.map((a) => ate.filter((e) => e.perfume.acorde === a).length / t);
  });
  const X = (i: number) => x0 + (i / (anos.length - 1)) * W;
  const curva = (pts: [number, number][]) => pts.map(([x, y], i) => (i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `C ${((pts[i - 1][0] + x) / 2).toFixed(1)} ${pts[i - 1][1].toFixed(1)} ${((pts[i - 1][0] + x) / 2).toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`)).join(" ");
  const camadas = ordem.map((a, k) => {
    const baixo: [number, number][] = partes.map((p, i) => [X(i), y0 + H - p.slice(0, k).reduce((s, x) => s + x, 0) * H]);
    const cima: [number, number][] = partes.map((p, i) => [X(i), y0 + H - p.slice(0, k + 1).reduce((s, x) => s + x, 0) * H]);
    const vol = [...baixo].reverse();
    const d = curva(cima) + " L " + vol.map(([x, y], i) => (i === 0 ? `${x.toFixed(1)} ${y.toFixed(1)}` : `C ${((vol[i - 1][0] + x) / 2).toFixed(1)} ${vol[i - 1][1].toFixed(1)} ${((vol[i - 1][0] + x) / 2).toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`)).join(" ") + " Z";
    return { d, cor: corDoAcorde(a), nome: a };
  });
  const ult = partes[partes.length - 1];
  return {
    camadas,
    anos: anos.map((a, i) => ({ x: X(i), t: String(a) })),
    rotulos: ordem.map((a, k) => ({ nome: a, cor: corDoAcorde(a), pct: Math.round(ult[k] * 100) })),
  };
}

// ---------------- Coleção ----------------
const NIVEIS: [string, number][] = [["Iniciante", 1], ["Entusiasta", 10], ["Colecionador", 25], ["Aficionado", 50], ["Connoisseur", 100]];
const NICHO = new Set(["Creed", "Ex Nihilo", "Xerjoff", "Parfums de Marly", "Maison Francis Kurkdjian", "Tom Ford", "Kilian", "Frédéric Malle"]);

export function classe(colecao: Entrada[]) {
  const itens = naColecao(colecao);
  const total = itens.length;
  let i = 0;
  NIVEIS.forEach(([, min], k) => { if (total >= min) i = k; });
  const ini = NIVEIS[i][1], fim = NIVEIS[Math.min(i + 1, NIVEIS.length - 1)][1];
  const frac = i === NIVEIS.length - 1 ? 1 : (total - ini) / (fim - ini);
  const casas = new Set(itens.map((e) => e.perfume.casa)).size;
  const ids = new Set(itens.map((e) => e.perfume.id));
  const par = itens.find((e) => e.perfume.inspiradoEm && ids.has(e.perfume.inspiradoEm));
  const nicho = itens.filter((e) => NICHO.has(e.perfume.casa)).sort((a, b) => a.numero - b.numero)[0];
  const extrait = itens.find((e) => /extrait|elixir|parfum$/i.test(e.perfume.concentracao ?? ""));
  const classico = itens.find((e) => (e.perfume.ano ?? 2020) < 2000);
  const familias = ["Cítrico", "Frutado", "Aromático", "Aquático", "Floral", "Amadeirado", "Âmbar", "Baunilha", "Especiado", "Couro"];
  const faltamF = familias.filter((f) => !itens.some((e) => e.perfume.acorde === f));
  const paises = new Set(itens.map((e) => CASAS[e.perfume.casa]?.pais ?? e.perfume.pais));
  const continentes = new Set([...paises].map((p) => (p === "Estados Unidos" ? "América" : p === "Emirados Árabes" ? "Ásia" : "Europa")));
  const marcos = [
    { nome: "Primeiro nicho", sub: nicho?.perfume.nome ?? "ainda não", ok: !!nicho },
    { nome: "10 casas", sub: `${casas} casas na coleção`, ok: casas >= 10 },
    { nome: "Original e inspirado", sub: par ? `${par.perfume.inspiradoEm === "aventus" ? "Aventus" : ""} e ${par.perfume.nome.split(" ").slice(0, 3).join(" ")}`.replace(/^ e /, "") : "um original e um inspirado nele", ok: !!par },
    { nome: "Primeiro extrait", sub: extrait?.perfume.nome ?? "ainda não", ok: !!extrait },
    { nome: "Todas as famílias", sub: faltamF.length ? `faltam ${faltamF.slice(0, 2).join(" e ").toLowerCase()}` : "completo", ok: !faltamF.length },
    { nome: "Um clássico", sub: classico?.perfume.nome ?? "lançado antes de 2000", ok: !!classico },
    { nome: "25 frascos", sub: total >= 25 ? "completo" : `faltam ${25 - total}`, ok: total >= 25 },
    { nome: "Volta ao mundo", sub: `${continentes.size} de 6 continentes`, ok: continentes.size >= 6 },
  ];
  return {
    total, nome: NIVEIS[i][0], prox: NIVEIS[Math.min(i + 1, NIVEIS.length - 1)][0], faltam: Math.max(0, fim - total), frac,
    niveis: NIVEIS.map(([nome], k) => ({ nome, estado: k < i ? "feito" : k === i ? "atual" : "falta", frac: k === i ? frac : k < i ? 1 : 0 })),
    marcos,
    resumo: [
      { v: casas, l: "casas" },
      { v: new Set(itens.map((e) => e.perfume.acorde)).size, l: "acordes" },
      { v: itens.filter((e) => e.perfume.inspiradoEm).length, l: "inspirados" },
      { v: colecao.filter((e) => e.situacao === "assinatura").length, l: "assinatura" },
    ],
  };
}

export function esquecidos(colecao: Entrada[], n = 3) {
  return naColecao(colecao).map((e) => ({ ...e, dias: diasDesde(e.ultimoUso) })).sort((a, b) => b.dias - a.dias).slice(0, n);
}

/** Adequação de um perfume à temperatura e à umidade do dia (0–1). */
export function adequacao(p: Perfume, temp: number, umidade = 50) {
  const e = p.votos?.estacoes ?? { primavera: 60, verao: 50, outono: 60, inverno: 50 };
  const base = temp >= 28 ? e.verao : temp >= 23 ? (e.primavera + e.verao) / 2 : temp >= 18 ? (e.primavera + e.outono) / 2 : e.inverno;
  const secoBonus = umidade < 45 && (p.acorde === "Frutado" || p.acorde === "Cítrico") ? 8 : 0;
  return (base + secoBonus) / 100;
}

export function perfumeDoDia(colecao: Entrada[], temp: number, umidade: number) {
  const itens = naColecao(colecao);
  if (!itens.length) return null;
  const pont = itens.map((e) => ({ e, s: adequacao(e.perfume, temp, umidade) * 0.75 + Math.min(1, diasDesde(e.ultimoUso) / 30) * 0.25 }));
  pont.sort((a, b) => b.s - a.s);
  const e = pont[0].e;
  const dias = diasDesde(e.ultimoUso);
  const n = e.perfume.notas;
  const quente = temp >= 28;
  const clima = quente ? (umidade < 45 ? "Calor seco" : "Calor úmido") : temp >= 20 ? "Tempo ameno" : "Frio";
  const pede = quente ? "pede algo luminoso que segure a tarde toda" : temp >= 20 ? "deixa espaço para algo com mais corpo" : "pede um fundo quente";
  // duração real: o ajuste "em você" ou a média da comunidade (nunca uma conta inventada)
  const NIV = ["até 2h", "2 a 4h", "4 a 7h", "7 a 12h", "mais de 12h"];
  const hh = e.perfume.fixacaoH ? `${Math.floor(e.perfume.fixacaoH)}h${String(Math.round((e.perfume.fixacaoH % 1) * 60)).padStart(2, "0")}` : "";
  const dura = e.minhaFixacao ? ` Em você dura ${NIV[e.minhaFixacao - 1]}.` : hh ? ` A comunidade dá cerca de ${hh} de fixação.` : "";
  return {
    entrada: e,
    porque: `${clima} ${pede}. O ${e.perfume.nome} abre em ${[n.saida[0], n.coracao[0]].filter(Boolean).map((x) => x.toLowerCase()).join(" e ")}.${dura}${dias >= 10 ? ` Está há ${dias} dias sem sair do armário.` : ""}`,
  };
}

export function semana(colecao: Entrada[], dias: { temp: number; umidade: number }[]) {
  const itens = naColecao(colecao);
  const usados = new Set<string>();
  return dias.map((d) => {
    const melhor = itens
      .filter((e) => !usados.has(e.id))
      .map((e) => ({ e, s: adequacao(e.perfume, d.temp, d.umidade) * 0.7 + Math.min(1, diasDesde(e.ultimoUso) / 40) * 0.3 }))
      .sort((a, b) => b.s - a.s)[0]?.e;
    if (melhor) usados.add(melhor.id);
    return melhor ? { entrada: melhor, esquecido: diasDesde(melhor.ultimoUso) >= 30 } : null;
  });
}

export function semelhantes(p: Perfume, todos: Perfume[], colecao: Entrada[]) {
  const meus = new Set(naColecao(colecao).map((e) => e.perfume.id));
  const outros = todos.filter((x) => x.id !== p.id).map((x) => ({ p: x, sim: similaridade(p, x) })).sort((a, b) => b.sim - a.sim);
  return {
    inspirados: todos.filter((x) => x.inspiradoEm === p.id).map((x) => ({ p: x, sim: similaridade(p, x), tem: meus.has(x.id) })).sort((a, b) => b.sim - a.sim),
    naColecao: outros.filter((x) => meus.has(x.p.id) && x.p.inspiradoEm !== p.id).slice(0, 3),
    fora: outros.filter((x) => !meus.has(x.p.id) && x.p.inspiradoEm !== p.id && x.p.id !== p.inspiradoEm).slice(0, 3),
  };
}

/** Pontos do gráfico fixação × temperatura e as médias de frio e calor. */
export function graficoClima(p: Perfume) {
  const pts = p.clima?.pontos ?? [];
  const frio = pts.filter((x) => x.t < 25), calor = pts.filter((x) => x.t > 28);
  const m = (a: typeof pts) => (a.length ? a.reduce((s, x) => s + x.h, 0) / a.length : 0);
  const hm = (h: number) => `${Math.floor(h)}h${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
  // regressão linear simples para a linha de tendência
  const n = pts.length || 1, sx = pts.reduce((s, x) => s + x.t, 0), sy = pts.reduce((s, x) => s + x.h, 0);
  const sxx = pts.reduce((s, x) => s + x.t * x.t, 0), sxy = pts.reduce((s, x) => s + x.t * x.h, 0);
  const b = (n * sxy - sx * sy) / Math.max(1e-6, n * sxx - sx * sx), a = (sy - b * sx) / n;
  return { pts, frio: hm(m(frio)), quente: hm(m(calor)), n: p.clima?.n ?? 0, estimar: (t: number) => a + b * t };
}

export const hm = (h: number) => `${Math.floor(h)}h${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
