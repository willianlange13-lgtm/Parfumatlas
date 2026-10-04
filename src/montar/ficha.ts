import { buscarEntrada } from "@/lib/dados";
import { semelhantes, naColecao } from "@/lib/analise";
import { CASAS, nota as refNota } from "@/data/referencia";
import { coordenadas, origemCasa, paisDaCasa } from "@/data/casas";
import { territorio } from "@/lib/territorio";
import { NIVEIS_FIXACAO, NIVEIS_PROJECAO, SOBRE_FAMILIA, type Familia } from "@/lib/normalizar";
import { corDoAcorde } from "@/lib/cores";
import base from "@/data/desenho/FichaAzulPreto.json";
import { arc, circ, glifo, hexA, P, t } from "@/desenho/h2";
import type { Entrada, Perfume } from "@/lib/tipos";

const PALETA = ["#D8B970", "#DCECFD", "#9099AC", "#B4BDCC", "#7F8AA0", "#A3ADBE", "#6E7A90", "#C9D1DE"];
const dominio = (u?: string | null) => { try { return u ? new URL(u).hostname.replace(/^www\./, "") : ""; } catch { return ""; } };
const idade = (a: number) => (a <= 0 ? "lançamento deste ano" : a === 1 ? "há 1 ano" : `há ${a} anos`);
const hm = (h: number) => { let hh = Math.floor(h), mm = Math.round((h - hh) * 60); if (mm === 60) { hh++; mm = 0; } return `${hh}h${mm < 10 ? "0" : ""}${mm}`; };

function notaCor(n: string, cor: string) {
  const r = refNota(n);
  return { nome: n, d: r.icone, cor, bg: r.foto ? "#FFFFFF" : hexA(cor, 0.14), borda: hexA(cor, 0.45), img: r.foto ?? "", semImg: !r.foto, foto: r.foto ? "#FFFFFF" : `radial-gradient(circle at 35% 30%, ${hexA(cor, 0.95)} 0%, ${hexA(cor, 0.55)} 45%, #050506 100%)` };
}

/** "Abre em mandarina e hortelã, passa por manjericão e termina em figo e ambroxan." */
function frase(p: Perfume) {
  const junta = (l: string[]) => { const x = l.slice(0, 2).map((n) => n.toLowerCase()); return x.join(" e "); };
  const partes = [
    p.notas.saida.length ? `Abre em ${junta(p.notas.saida)}` : "",
    p.notas.coracao.length ? `passa por ${junta(p.notas.coracao)}` : "",
    p.notas.fundo.length ? `termina em ${junta(p.notas.fundo)}` : "",
  ].filter(Boolean);
  if (!partes.length) return "";
  const t = partes.length > 1 ? partes.slice(0, -1).join(", ") + " e " + partes[partes.length - 1] : partes[0];
  return t.charAt(0).toUpperCase() + t.slice(1) + ".";
}

const FORM: Record<string, [number, number, string]> = { alto: [30, 50, "6px"], ret: [38, 44, "7px"], redondo: [44, 40, "20px"], largo: [46, 36, "8px"] };
function sem(p: Perfume, sim: number, por: string, tag: string, tagCor: string, corN: string) {
  const f = FORM[p.forma] ?? FORM.ret, cor = corDoAcorde(p.acorde);
  return {
    sim, nome: p.nome, marca: p.casa, por, tag, tagCor, corN, bw: f[0], bh: f[1], br: f[2], lw: f[0] - 8, capW: Math.round(f[0] * 0.5), tampa: p.tampa, rot: p.casa.split(" ")[0].toUpperCase().slice(0, 7),
    fundo: `linear-gradient(160deg, ${hexA(cor, 0.22)} 0%, ${hexA(cor, 0.04)} 100%)`, vidro: `linear-gradient(160deg, rgba(255,255,255,.3) 0%, ${hexA(cor, 0.25)} 50%, ${hexA(cor, 0.45)} 100%)`,
    href: `/colecao/${p.id}`,
  };
}

/** Histórico pessoal (bloco 7 da ficha): só existe para quem está na coleção. */
function historico(e: Entrada | null | undefined, cor: string) {
  if (!e) return null;
  const hoje = Date.now(), dia = 864e5;
  const usos = (e.usos ?? []).filter(Boolean);
  const dias = (d?: string | null) => (d ? Math.max(0, Math.floor((hoje - new Date(d).getTime()) / dia)) : null);
  const desdeEntrada = dias(e.adicionadoEm) ?? 0;
  const ultimo = usos[0] ?? (e.ultimoUso && e.ultimoUso !== e.adicionadoEm ? e.ultimoUso : null);
  const dUlt = dias(ultimo);
  const meuF = e.minhaFixacao ? NIVEIS_FIXACAO[e.minhaFixacao - 1] : null, meuP = e.minhaProjecao ? NIVEIS_PROJECAO[Math.min(4, e.minhaProjecao) - 1] : null;
  return {
    cor,
    vezes: String(Math.max(usos.length, ultimo ? 1 : 0)),
    vezesTxt: Math.max(usos.length, ultimo ? 1 : 0) === 1 ? "vez usado" : "vezes usado",
    ultimo: dUlt == null ? "ainda não usado" : dUlt === 0 ? "usado hoje" : dUlt === 1 ? "usado ontem" : `último uso há ${dUlt} dias`,
    entrada: `ENTRADA Nº ${String(e.numero).padStart(3, "0")}`,
    chegou: `na coleção há ${desdeEntrada >= 365 ? `${Math.floor(desdeEntrada / 365)} ano${desdeEntrada >= 730 ? "s" : ""}` : `${desdeEntrada} dia${desdeEntrada === 1 ? "" : "s"}`}`,
    situacao: { tenho: "Tenho", tive: "Tive", quero: "Quero", assinatura: "★ Assinatura" }[e.situacao] ?? e.situacao,
    nota: e.minhaNota ? "★".repeat(e.minhaNota) + "☆".repeat(5 - e.minhaNota) : "",
    emVoce: [meuF ? `fixação ${meuF.nome.toLowerCase()}` : "", meuP ? `projeção ${meuP.nome.toLowerCase()}` : ""].filter(Boolean).join(" · "),
    // usos dos últimos 90 dias numa régua (0% = hoje à direita)
    marcas: usos.map((d) => dias(d) ?? 999).filter((n) => n <= 90).map((n) => ({ x: `${(100 - (n / 90) * 100).toFixed(1)}%` })),
  };
}

export async function montarFicha(id: string) {
  const { acervo, entrada, perfume: p } = await buscarEntrada(id);
  if (!p) return null;
  const todos = [...acervo.perfumes.values()];
  const meus = naColecao(acervo.colecao);

  // radar e espectro com os 8 acordes mais fortes
  // acordes sem força (fichas antigas): usa a ordem do Fragrantica, do maior para o menor
  const acs = p.acordes.length && p.acordes.every((a) => !a.valor) ? p.acordes.map((a, i) => ({ ...a, valor: Math.max(30, 100 - i * 12) })) : p.acordes;
  const AC = [...acs].sort((a, b) => b.valor - a.valor).slice(0, 8);
  while (AC.length < 3) AC.push({ nome: "—", valor: 10 });
  // território olfativo: a família do perfume tinge a ficha (luz, DNA, medidores), docs/DECISOES.md §18
  const terr = territorio(p.familia, p.acordes);
  const cores = AC.map((a, i) => (i === 0 ? terr.a : corDoAcorde(a.nome) === "#9099AC" ? PALETA[(i + 1) % PALETA.length] : corDoAcorde(a.nome)));
  const n = AC.length;
  const eixos = AC.map((a, i) => { const an = (i * 2 * Math.PI) / n - Math.PI / 2; return { x: P(250 + Math.cos(an) * 232), y: P(250 + Math.sin(an) * 226), nome: a.nome.toUpperCase(), v: a.valor, cor: cores[i] }; });

  // desempenho
  const VF = p.votos?.fixacao ?? [3, 8, 32, 41, 16], HF = [1, 2.5, 5, 9, 13];
  const VP = p.votos?.projecao ?? [10, 46, 34, 10], MP = [0.3, 1, 2, 3];
  const horas = p.fixacaoH ?? VF.reduce((s, v, i) => s + (v / 100) * HF[i], 0);
  const metros = p.projecaoM ?? VP.reduce((s, v, i) => s + (v / 100) * MP[i], 0);
  const mesmaFam = todos.filter((x) => x.familia.split(" ")[0] === p.familia.split(" ")[0] && x.fixacaoH);
  const hFam = mesmaFam.length ? mesmaFam.reduce((s, x) => s + (x.fixacaoH ?? 0), 0) / mesmaFam.length - 0.4 : 6.8;
  const mFam = mesmaFam.length ? mesmaFam.reduce((s, x) => s + (x.projecaoM ?? 1.2), 0) / mesmaFam.length - 0.15 : 1.2;
  const gauge = (frac: number, fracRef: number, cor: string) => { const cx = 120, cy = 118, r = 96, aC = Math.PI + Math.PI * Math.min(1, fracRef); return { trilho: arc(cx, cy, r, Math.PI, 2 * Math.PI), valor: arc(cx, cy, r, Math.PI, Math.PI + Math.PI * Math.min(0.999, frac)), marca: `M ${P(cx + Math.cos(aC) * (r - 14))} ${P(cy + Math.sin(aC) * (r - 14))} L ${P(cx + Math.cos(aC) * (r + 14))} ${P(cy + Math.sin(aC) * (r + 14))}`, cor }; };
  const nivelP = metros < 0.8 ? "Íntima" : metros < 1.6 ? "Moderada" : metros < 2.5 ? "Forte" : "Enorme";
  const temF = VF.some((x) => x > 0), temP = VP.some((x) => x > 0);
  // ajuste pessoal ("como fica em você") vale no medidor; a média da comunidade aparece junto
  const minhaF = entrada?.minhaFixacao ? NIVEIS_FIXACAO[entrada.minhaFixacao - 1] : null;
  const minhaP = entrada?.minhaProjecao ? NIVEIS_PROJECAO[Math.min(4, entrada.minhaProjecao) - 1] : null;
  const doAcervo = p.votos?.origem === "acervo";
  const comunidadeF = doAcervo ? `comunidade: ${p.votos?.nivelFixacao ?? "—"}` : !temF ? "sem votos da comunidade" : `comunidade: ${hm(horas)}${p.votos?.origem === "estimativa" ? " (estimativa)" : ""}`;
  const comunidadeP = `comunidade: ${nivelP}, ${metros.toFixed(1).replace(".", ",")} m`;
  const g1 = gauge((minhaF?.h ?? horas) / 12, hFam / 12, terr.a), g2 = gauge((minhaP?.m ?? metros) / 3, mFam / 3, terr.b);

  // quando funciona
  const e = p.votos?.estacoes ?? { primavera: 60, verao: 50, outono: 60, inverno: 50 };
  const rc = 140, rcy = 130, ri = 34, rmax = 104;
  const saz: [string, number, string][] = [["Primavera", e.primavera, t.saz[0]], ["Verão", e.verao, t.saz[1]], ["Outono", e.outono, t.saz[2]], ["Inverno", e.inverno, t.saz[3]]];
  const seg = saz.map((s, i) => {
    const a0 = -Math.PI / 2 + (i * Math.PI) / 2 + 0.02, a1 = a0 + Math.PI / 2 - 0.04, ro = ri + (s[1] / 100) * (rmax - ri);
    const d = `M ${P(rc + Math.cos(a0) * ri)} ${P(rcy + Math.sin(a0) * ri)} L ${P(rc + Math.cos(a0) * ro)} ${P(rcy + Math.sin(a0) * ro)} A ${P(ro)} ${P(ro)} 0 0 1 ${P(rc + Math.cos(a1) * ro)} ${P(rcy + Math.sin(a1) * ro)} L ${P(rc + Math.cos(a1) * ri)} ${P(rcy + Math.sin(a1) * ri)} A ${ri} ${ri} 0 0 0 ${P(rc + Math.cos(a0) * ri)} ${P(rcy + Math.sin(a0) * ri)} Z`;
    const am = a0 + Math.PI / 4 - 0.02;
    return { d, cor: s[2], nome: s[0], v: s[1], lx: P(rc + Math.cos(am) * 120), ly: P(rcy + Math.sin(am) * 112) };
  });
  const votos = (nomes: string[], pcts: number[], cor: string) => { const mx = Math.max(...pcts); return nomes.map((nm, i) => ({ nome: nm, pct: pcts[i], cor: pcts[i] === mx ? cor : t.ink3, txt: pcts[i] === mx ? t.ink : t.ink2 })); };

  // fixação × temperatura
  const raw = (p.clima?.pontos ?? []).map((x, i) => [x.t, x.h, x.seco ? 0 : 1, 10 + ((i * 7) % 9)] as [number, number, number, number]);
  const W = 640, px = (tc: number) => 44 + ((tc - 12) / 24) * W, py = (h: number) => 236 - ((Math.max(3, Math.min(11, h)) - 3) / 8) * 226;
  const media = (a: typeof raw) => (a.length ? a.reduce((s2, x) => s2 + x[1], 0) / a.length : horas);
  const nR = raw.length || 1;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  raw.forEach((x) => { sx += x[0]; sy += x[1]; sxy += x[0] * x[1]; sxx += x[0] * x[0]; });
  const bb = (nR * sxy - sx * sy) / Math.max(1e-6, nR * sxx - sx * sx), a0 = (sy - bb * sx) / nR;
  const clima = {
    n: p.clima?.n ?? 0,
    frio: hm(media(raw.filter((x) => x[0] < 25))), quente: hm(media(raw.filter((x) => x[0] > 28))),
    faixaF: P(px(25) - 44), qx: P(px(28)), faixaQ: P(px(36) - px(28)),
    tend: raw.length ? `M ${P(px(13))} ${P(py(a0 + bb * 13))} L ${P(px(35.5))} ${P(py(a0 + bb * 35.5))}` : "",
    pts: raw.map((x) => ({ x: P(px(x[0])), y: P(py(x[1])), cor: x[2] ? t.umido : t.seco, r: x[3] })),
    gy: [4, 6, 8, 10].map((h) => ({ y: P(py(h)), t: h + "h" })),
    gx: [15, 20, 25, 30, 35].map((tc) => ({ x: P(px(tc)), t: tc + "°" })),
  };

  // semelhantes
  const s = semelhantes(p, todos, acervo.colecao);
  const quero = new Set(acervo.colecao.filter((x) => x.situacao === "quero").map((x) => x.perfumeId));
  const porQue = (x: Perfume) => [x.notas.saida[0], x.notas.coracao[0]].filter(Boolean).map((y) => y.toLowerCase()).join(" e ");
  const colunas = [
    { nome: "INSPIRADOS NELE", sub: "contratipos e releituras", bg: t.surface, borda: t.line, itens: s.inspirados.slice(0, 3).map((x) => sem(x.p, x.sim, porQue(x.p), x.tem ? "Na sua coleção" : "", t.ink, t.sup[1])) },
    { nome: "NA SUA COLEÇÃO", sub: "semelhantes que você já tem", bg: t.bg, borda: t.line2, itens: s.naColecao.map((x) => sem(x.p, x.sim, porQue(x.p), "", t.ink, t.ink)) },
    { nome: "FORA DA COLEÇÃO", sub: "para conhecer", bg: t.surface, borda: t.line, itens: s.fora.map((x) => sem(x.p, x.sim, x.p.descricao?.split(".")[0].toLowerCase().slice(0, 40) || porQue(x.p), quero.has(x.p.id) ? "Quero" : "", t.sup[1], t.sup[2])) },
  ];
  if (!colunas[0].itens.length) { colunas[0].nome = "INSPIROU-SE EM"; colunas[0].sub = "o original e as releituras"; const orig = p.inspiradoEm ? acervo.perfumes.get(p.inspiradoEm) : null; colunas[0].itens = orig ? [sem(orig, 94, porQue(orig), meus.some((m) => m.perfumeId === orig.id) ? "Na sua coleção" : "", t.ink, t.sup[1])] : []; }

  // parecidos que a IA trouxe do Fragrantica e da comunidade (podem não estar no catálogo)
  const norm = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  // com parecidos pesquisados para este perfume, a lista "fora da coleção" usa só eles
  // (o cálculo pelo catálogo de exemplo trazia perfumes sem relação); "na sua coleção" só mostra os bem próximos
  const pesquisados = (p.parecidos ?? []).filter((x) => (Number(x.pct) || 0) >= 60);
  if (pesquisados.length) {
    colunas[2].itens = [];
    colunas[1].itens = colunas[1].itens.filter((i) => i.sim >= 80);
  }
  // quando há um original, os clones são "irmãos" dele, não cópias deste perfume
  const origPesq = pesquisados.find((x) => x.tipo === "inspirou");
  const jaListado = new Set(colunas.flatMap((c) => c.itens.map((i) => norm(i.nome))));
  for (const pr of pesquisados) {
    if (jaListado.has(norm(pr.nome))) continue;
    jaListado.add(norm(pr.nome));
    const achado = todos.find((x) => norm(x.nome) === norm(pr.nome) && (!pr.casa || norm(x.casa) === norm(pr.casa)));
    const tem = achado ? meus.some((m) => m.perfumeId === achado.id) : false;
    const base: Perfume = achado ?? { id: "", nome: pr.nome, casa: pr.casa, perfumistas: [], familia: "", acorde: p.acorde, notas: { saida: [], coracao: [], fundo: [] }, acordes: [], forma: "ret", tampa: "#141417" };
    const item = { ...sem(base, pr.pct, [pr.tipo === "inspirou" ? "o original" : pr.tipo === "clone" ? (origPesq ? `clone do ${origPesq.nome}` : "inspirado nele") : "parecido", dominio(pr.fonte)].filter(Boolean).join(" · "), tem ? "Na sua coleção" : pr.tipo === "inspirou" ? "Original" : "", t.ink, t.sup[1]), href: achado ? `/colecao/${achado.id}` : `/buscar/resultado?nome=${encodeURIComponent(pr.nome)}&casa=${encodeURIComponent(pr.casa)}` };
    if (pr.tipo !== "parecido") colunas[0].itens.push(item);
    else if (tem) colunas[1].itens.push(item);
    else colunas[2].itens.push(item);
  }
  if (pesquisados.some((x) => x.tipo === "inspirou") && !s.inspirados.length) { colunas[0].nome = "INSPIROU-SE EM"; colunas[0].sub = "o original e as releituras"; }
  colunas.forEach((c) => { c.itens.sort((a, b) => b.sim - a.sim); c.itens = c.itens.slice(0, 15); });

  // semelhantes salvos na ficha (busca sob demanda + edição da pessoa), com foto do frasco
  // trava de casas: só brasileiras, americanas e árabes (o original e os que você adicionou ficam)
  const semelhantesLista = (p.parecidos ?? []).filter((pr) => pr.tipo === "inspirou" || pr.trecho === "adicionado por você" || origemCasa(pr.casa) !== "outra").map((pr) => {
    const achado = todos.find((x) => norm(x.nome) === norm(pr.nome) && (!pr.casa || norm(x.casa) === norm(pr.casa)));
    return {
      nome: pr.nome, casa: pr.casa, pct: pr.pct, original: pr.tipo === "inspirou", imagem: pr.imagem ?? achado?.imagem ?? null,
      faixa: pr.faixa ?? (pr.tipo === "inspirou" ? "" : `${pr.pct}%`), relacao: pr.relacao ?? null, radar: Boolean(pr.radar), semelhanca: pr.semelhanca ?? null, diferenca: pr.diferenca ?? null,
      manual: pr.trecho === "adicionado por você",
      href: achado ? `/colecao/${achado.id}` : `/buscar/resultado?nome=${encodeURIComponent(pr.nome)}&casa=${encodeURIComponent(pr.casa)}`,
    };
  }).sort((a, b) => Number(b.original) - Number(a.original)) // a ordem salva já é a do ranking
    .map((x, _i, l) => (x.radar && l.filter((y) => y.radar).indexOf(x) >= 2 ? { ...x, radar: false } : x)); // no máximo 2 ⭐

  const inspNaColecao = s.inspirados.filter((x) => x.tem).length;
  const relacao = s.inspirados.length ? `Original · ${inspNaColecao || s.inspirados.length} inspirado${(inspNaColecao || s.inspirados.length) > 1 ? "s" : ""} ${inspNaColecao ? "na sua coleção" : "conhecidos"}` : p.inspiradoEm ? `Inspirado em ${acervo.perfumes.get(p.inspiradoEm)?.nome ?? "outro perfume"}` : "";
  const original = (p.parecidos ?? []).find((x) => x.tipo === "inspirou");
  const relacaoFinal = relacao || (original ? `Inspirado no ${original.nome}${original.casa ? ` (${original.casa})` : ""}` : "");
  const casaInfo = CASAS[p.casa];
  const sitAtual = entrada?.situacao ?? null;
  const cor = corDoAcorde(p.acorde);
  const melhorFora = s.fora[0]?.p.nome.split(" ").slice(0, 2).join(" ");
  const qs = (q: string) => `/sommelier?perfume=${p.id}&q=${encodeURIComponent(q)}`;
  const perguntas = ["Faz layering com o que eu tenho?", s.inspirados.length ? "Qual inspirado chega mais perto?" : "O que combina com ele?", melhorFora ? `Vale comprar o ${melhorFora}?` : "Para que ocasião ele vai melhor?"];

  const dia = p.votos?.dia ?? 70, noite = p.votos?.noite ?? 60;
  return {
    ...base,
    t,
    demo: acervo.demo,
    clima,
    ocasioes: (p.votos?.ocasioes ?? base.ocasioes).map((o, i) => ({ nome: o.nome, v: o.v, cor: i < 2 ? t.sup[0] : i < 4 ? t.sup[1] : t.sup[2] })),
    glifo: glifo(AC.map((a) => a.valor), cores, false, terr.a),
    terr: { ...terr, glowB: hexA(terr.b, 0.16), linha: hexA(terr.a, 0.35) },
    eixos,
    topFam: AC.slice(0, 3).map((a, i) => ({ nome: a.nome, cor: cores[i], bg: hexA(cores[i], 0.22) })),
    marcas: [["tenho", "Tenho"], ["tive", "Tive"], ["quero", "Quero"], ["assinatura", "★ Assinatura"]].map(([k, nm]) => ({ chave: k, nome: sitAtual === k ? (k === "assinatura" ? nm : "✓ " + nm) : nm, bg: sitAtual === k ? t.btn : "transparent", cor: sitAtual === k ? t.onBtn : t.ink2 })),
    fatos: [
      { l: "FAMÍLIA", v: p.familia, c: SOBRE_FAMILIA[p.familia as Familia] ?? "família olfativa" },
      { l: "CONCENTRAÇÃO", v: p.concentracao ?? "—", c: p.concentracao === "Eau de Parfum" ? "a versão mais comum" : "concentração da casa" },
      { l: "LANÇAMENTO", v: p.ano ? String(p.ano) : "—", c: p.ano ? idade(new Date().getFullYear() - p.ano) : "ano a confirmar" },
      // origem da casa no lugar de "inspirados" (semelhantes saíram da ficha)
      { l: "ORIGEM", v: p.pais || paisDaCasa(p.casa) || "a confirmar", c: casaInfo?.cidade ? `${p.casa} · ${casaInfo.cidade}` : p.casa },
    ],
    piramide: [
      { nome: "Saída", tempo: "PRIMEIROS 30 MIN", notas: p.notas.saida.slice(0, 8).map((x, i) => notaCor(x, PALETA[i % PALETA.length])) },
      { nome: "Coração", tempo: "30 MIN A 3 H", notas: p.notas.coracao.slice(0, 8).map((x, i) => notaCor(x, PALETA[(i + 3) % PALETA.length])) },
      { nome: "Fundo", tempo: "DEPOIS DE 3 H", notas: p.notas.fundo.slice(0, 8).map((x, i) => notaCor(x, PALETA[(i + 5) % PALETA.length])) },
    ],
    gauges: [
      minhaF ? { nome: "Fixação · em você", txt: minhaF.nome, sub: `${minhaF.faixa} · ${comunidadeF}`, ref: `Média da família: ${hm(hFam)}`, trilho: g1.trilho, valor: g1.valor, marca: g1.marca, cor: g1.cor } :
      { nome: "Fixação", txt: horas > 0 ? hm(horas) : "—", sub: doAcervo ? `${p.votos?.nivelFixacao ?? "nível"}: o mais votado no Fragrantica` : !temF ? "estimativa (votos do Fragrantica não encontrados)" : p.votos?.origem === "estimativa" ? "estimativa pelas resenhas" : `média ponderada de ${(p.votos?.total ?? 0).toLocaleString("pt-BR")} votos`, ref: `Média da família: ${hm(hFam)}`, trilho: g1.trilho, valor: g1.valor, marca: g1.marca, cor: g1.cor },
      minhaP ? { nome: "Projeção · em você", txt: minhaP.nome, sub: `${minhaP.faixa} · ${comunidadeP}`, ref: `Média da família: ${mFam.toFixed(1).replace(".", ",")} metro${mFam >= 2 ? "s" : ""}`, trilho: g2.trilho, valor: g2.valor, marca: g2.marca, cor: g2.cor } :
      { nome: "Projeção", txt: nivelP, sub: `alcança cerca de ${metros.toFixed(1).replace(".", ",")} metro${metros >= 2 ? "s" : ""} de distância nas 2 primeiras horas`, ref: `Média da família: ${mFam.toFixed(1).replace(".", ",")} metro${mFam >= 2 ? "s" : ""}`, trilho: g2.trilho, valor: g2.valor, marca: g2.marca, cor: g2.cor },
    ],
    espectro: AC.map((a, i) => ({ curto: a.nome, v: a.valor, h: Math.round((a.valor / 100) * 190), cor: cores[i] })),
    roda: { guia: circ(rc, rcy, ri) + " " + circ(rc, rcy, rmax), seg },
    votos: [
      { nome: doAcervo ? "Fixação · só o nível mais votado" : !temF ? "Fixação · votos não encontrados" : p.votos?.origem === "estimativa" ? "Fixação · estimativa" : "Fixação", itens: votos(["Muito fraca", "Fraca", "Moderada", "Longa", "Eterna"], VF, t.sup[0]) },
      { nome: !temP ? "Projeção · votos não encontrados" : p.votos?.origem === "estimativa" ? "Projeção · estimativa" : "Projeção", itens: votos(["Íntima", "Moderada", "Forte", "Enorme"], VP, t.sup[1]) },
    ],
    colunas: [] as typeof colunas, // no computador a seção usa a lista do celular
    semelhantes: semelhantesLista,
    buscandoSemelhantes: Boolean(p.buscaParecidos),
    perguntas: perguntas.map((q) => ({ t: q, href: qs(q) })),
    // da mesma casa: os que já estão no Atlas e os da seção "Designer" do Fragrantica
    casa: [
      ...todos.filter((x) => x.casa === p.casa && x.id !== p.id).slice(0, 4).map((x) => ({ nome: x.nome, fam: x.familia, href: `/colecao/${x.id}`, imagem: x.imagem ?? null })),
      ...(p.mesmaCasa ?? []).filter((m) => !todos.some((x) => x.casa === p.casa && norm(x.nome) === norm(m.nome))).map((m) => ({ nome: m.nome, fam: "", href: `/buscar/resultado?nome=${encodeURIComponent(m.nome)}&casa=${encodeURIComponent(p.casa)}`, imagem: m.imagem ?? null })),
    ].slice(0, 0), // "da mesma casa" saiu da ficha
    historico: historico(entrada, terr.a),
    cab: {
      id: p.id, nome: p.nome, nomeUp: p.nome.toUpperCase(), acordeUp: p.acorde.toUpperCase(), tampa: p.tampa,
      vidro: `linear-gradient(160deg, rgba(255,255,255,.28) 0%, ${hexA(cor, 0.2)} 45%, ${hexA(cor, 0.4)} 100%)`,
      rot: p.casa.split(" ")[0].toUpperCase(), rotNome: p.nome.length > 14 ? p.nome.split(" ").slice(0, 2).join(" ") : p.nome,
      casaCidade: [p.casa.toUpperCase(), (casaInfo?.cidade ?? p.pais ?? "").toUpperCase()].filter(Boolean).join(" · "),
      // linha cartográfica: entrada · ano · cidade · coordenadas
      coord: [entrada?.numero ? `ENTRADA Nº ${String(entrada.numero).padStart(3, "0")}` : "", p.ano ? String(p.ano) : "", coordenadas(casaInfo?.cidade, p.pais || paisDaCasa(p.casa))].filter(Boolean).join(" · "),
      desc: p.descricao ?? `${p.familia}${p.ano ? ` de ${p.ano}` : ""}.`,
      relacao: relacaoFinal, som: `/sommelier?perfume=${p.id}`, comparar: `/comparar?a=${p.id}`, blind: `/blind?a=${p.id}`,
      frase: frase(p), dia, noite, pergunte: `pergunte sobre o ${p.nome}, por texto ou voz`, voz: `/sommelier?perfume=${p.id}&voz=1`,
      anotacao: entrada?.anotacao ?? "",
      foto: entrada?.foto ?? p.imagem ?? null, fotoOficial: !entrada?.foto && Boolean(p.imagem),
    },
    conv: acervo.demo && p.id === "aventus"
      ? { p: "Serve para um jantar hoje à noite? Vai fazer uns 18 °C.", r: "Serve. Com 18 °C o abacaxi abre mais contido e a bétula aparece cedo, o que deixa o Aventus mais sério. Se quiser algo mais quente para a mesma noite, o Layton da sua coleção vai melhor." }
      : null,
  };
}
