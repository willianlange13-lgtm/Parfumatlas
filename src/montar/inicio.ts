import { carregarAcervo } from "@/lib/dados";
import { obterClima, descricaoAr } from "@/lib/clima";
import { adequacao, diasDesde, dna, esquecidos, naColecao, semana } from "@/lib/analise";
import { CURIOSIDADES, CASAS, nota } from "@/data/referencia";
import { corDoAcorde } from "@/lib/cores";
import base from "@/data/desenho/InicioPreto.json";
import { EC, glifo, frascoMini, ICONE_CLIMA, t, dataBR, mesAno, n3 } from "@/desenho/h2";
import type { Entrada } from "@/lib/tipos";
import { NIVEIS_FIXACAO } from "@/lib/normalizar";

// foto do seu frasco (preenche o quadro) ou a oficial do Fragrantica (fundo branco); sem nenhuma, o desenho.
// No destaque grande do topo vale só a oficial (decisão do Willian).
const fr = (e: Entrada) => ({ ...frascoMini(e.perfume.nome, e.perfume.casa, e.perfume.acorde, e.perfume.forma, e.perfume.tampa, corDoAcorde(e.perfume.acorde)), foto: e.foto ?? e.perfume.imagem ?? null, oficial: !e.foto });
/** Quanto dura, com dado real: o ajuste "em você" ou a média da comunidade (nunca uma conta inventada). */
function duracao(e: Entrada) {
  const meu = e.minhaFixacao ? NIVEIS_FIXACAO[e.minhaFixacao - 1] : null;
  if (meu) return { longo: `em você a fixação é ${meu.nome.toLowerCase()} (${meu.faixa})`, curto: `Em você: ${meu.nome.toLowerCase()}, ${meu.faixa}.` };
  const h = e.perfume.fixacaoH;
  if (!h) return null;
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  const txt = `${hh}h${mm ? String(mm).padStart(2, "0") : ""}`;
  return { longo: `a comunidade dá cerca de ${txt} de fixação`, curto: `Comunidade: cerca de ${txt}.` };
}

export async function montarInicio(outra = 0) {
  const acervo = await carregarAcervo();
  const clima = await obterClima();
  const itens = naColecao(acervo.colecao);
  const temp = clima.agora.temp, umid = clima.agora.umidade;

  // perfume do dia: melhor pontuação, "outra sugestão" pula para a próxima
  const ranking = itens
    .map((e) => ({ e, s: adequacao(e.perfume, temp, umid) * 0.75 + Math.min(1, diasDesde(e.ultimoUso) / 30) * 0.25 }))
    .sort((a, b) => b.s - a.s);
  const escolhido = ranking[outra % Math.max(1, ranking.length)]?.e ?? itens[0];
  const quente = temp >= 28;
  const dias = diasDesde(escolhido?.ultimoUso);
  const n = escolhido?.perfume.notas;
  const porque = escolhido
    ? `${quente ? (umid < 45 ? "Calor seco" : "Calor úmido") : temp >= 20 ? "Tempo ameno" : "Frio"} ${quente ? "pede algo luminoso que segure a tarde toda" : temp >= 20 ? "deixa espaço para algo com mais corpo" : "pede um fundo quente"}. O ${escolhido.perfume.nome} abre em ${[n!.saida[0], n!.coracao[0]].filter(Boolean).map((x) => x.toLowerCase()).join(" e ")}${duracao(escolhido) ? `; ${duracao(escolhido)!.longo}` : ""}.${dias >= 10 ? ` Está há ${dias} dias sem sair do armário.` : ""}`
    : "Cadastre o primeiro frasco para receber a sugestão do dia.";
  const fd = escolhido ? fr(escolhido) : null;

  // curiosidade: uma nota que está nos seus frascos, muda a cada dia
  const notasMinhas = new Set(itens.flatMap((e) => [...e.perfume.notas.saida, ...e.perfume.notas.coracao, ...e.perfume.notas.fundo]));
  const possiveis = CURIOSIDADES.filter((c) => notasMinhas.has(c.nota));
  const diaAno = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 864e5);
  const c = (possiveis.length ? possiveis : CURIOSIDADES)[diaAno % Math.max(1, possiveis.length || CURIOSIDADES.length)];
  const comNota = itens.filter((e) => [...e.perfume.notas.saida, ...e.perfume.notas.coracao, ...e.perfume.notas.fundo].includes(c.nota)).map((e) => e.perfume.nome);
  const curTexto = comNota.length ? `${c.texto} Está ${comNota.length > 1 ? "nos seus" : "no seu"} ${comNota.slice(0, 2).join(" e ")}.` : c.texto;

  // semana pelo clima
  const sem = semana(acervo.colecao, clima.dias.map((d) => ({ temp: d.temp, umidade: d.umidade })));
  const resgatados = sem.filter((s) => s?.esquecido).length;

  // destaque: a assinatura (ou a última entrada)
  const destaque = acervo.colecao.find((e) => e.situacao === "assinatura") ?? [...itens].sort((a, b) => b.numero - a.numero)[0];
  const nomeH = (destaque?.perfume.nome ?? "Parfum Atlas").toUpperCase().split(" ");
  const meio = Math.ceil(nomeH.length / 2);

  const d = dna(acervo.colecao);
  const paises = new Set(itens.map((e) => CASAS[e.perfume.casa]?.pais ?? e.perfume.pais).filter(Boolean));

  return {
    ...base,
    t,
    anel: glifo(d.vetor.map((x) => Math.max(18, x)), EC),
    dia: fd ? { ...fd, fundo: fd.fundo, vidro: fd.vidro, id: escolhido!.id, porque, href: `/colecao/${escolhido!.perfumeId}`, outra: `/?outra=${outra + 1}`, clima: [clima.cidade, `${temp} °C`, descricaoAr(umid)].filter(Boolean).join(" · ") } : { ...base.dia, nome: "—", id: "", href: "/adicionar", outra: "/", clima: "" },
    hero: destaque
      ? { foto: destaque.perfume.imagem ?? null, nome: destaque.perfume.nome, casaUp: destaque.perfume.casa.toUpperCase(), l1: nomeH.slice(0, meio).join(" "), l2: nomeH.slice(meio).join(" "), conc: (destaque.perfume.concentracao ?? "").toUpperCase(), entrada: `ENTRADA Nº ${n3(destaque.numero)} · ADICIONADO EM ${mesAno(destaque.adicionadoEm)}` }
      : { foto: null, nome: "Parfum Atlas", casaUp: "", l1: "PARFUM", l2: "ATLAS", conc: "", entrada: "" },
    cur: { nota: c.nota, foto: nota(c.nota).foto ?? "", titulo: c.titulo, texto: curTexto, link: `Ver a nota ${c.nota.toLowerCase()}`, href: `/descobrir?nota=${encodeURIComponent(c.nota)}` },
    previsao: `previsão para ${clima.cidade}, um perfume da sua coleção para cada dia`,
    resgata: resgatados ? `Resgata ${resgatados} esquecido${resgatados > 1 ? "s" : ""}` : "",
    semana: clima.dias.map((dd, i) => {
      const e = sem[i]?.entrada;
      const f = e ? fr(e) : frascoMini("—", "", "", "ret", "#141417", "#9099AC");
      return { ...f, dia: dd.rotulo, temp: dd.temp, icone: ICONE_CLIMA[dd.icone], cor: t.amber, tag: sem[i]?.esquecido ? "Esquecido" : "", bg: i === 0 ? t.tileFeature : t.bg, borda: i === 0 ? t.line2 : t.line, nome: e?.perfume.nome ?? "—" };
    }),
    numeros: [
      { ...base.numeros[0], v: String(itens.length) },
      { ...base.numeros[1], v: String(new Set(itens.map((e) => e.perfume.casa)).size) },
      { ...base.numeros[2], v: String(notasMinhas.size) },
      { ...base.numeros[3], v: String(paises.size) },
    ],
    esquecidos: esquecidos(acervo.colecao).map((e) => ({ ...fr(e), dias: e.dias })),
    ultimas: [...itens].sort((a, b) => b.numero - a.numero).slice(0, 4).map((e) => ({ ...fr(e), num: n3(e.numero), data: `ADICIONADO ${dataBR(e.adicionadoEm)}` })),
    demo: acervo.demo,
    // dados crus para o app (celular)
    cel: {
      dia: escolhido ? { e: escolhido, curto: `${quente ? (umid < 45 ? "Calor seco" : "Calor úmido") : temp >= 20 ? "Tempo ameno" : "Frio"} pede ${quente ? "algo luminoso" : temp >= 20 ? "algo com mais corpo" : "um fundo quente"}.${duracao(escolhido) ? ` ${duracao(escolhido)!.curto}` : ""}${dias >= 10 ? ` Está há ${dias} dias parado.` : ""}`, notas: [escolhido.perfume.notas.saida[0], escolhido.perfume.notas.coracao[0]].filter(Boolean), temp, ar: descricaoAr(umid), dias } : null,
      cur: { nota: c.nota, titulo: c.titulo, texto: c.texto, onde: comNota.length ? `Está no ${comNota.slice(0, 2).join(" e no ")}` : "Ainda não está na sua coleção" },
      saudacao: saudacao(),
      data: new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Campo_Grande" }).format(new Date()).replace(/^./, (x) => x.toUpperCase()).replace("-feira", ""),
      cidade: clima.cidade,
      semana: clima.dias.map((dd, i) => ({ dia: dd.rotulo, temp: dd.temp, icone: dd.icone, e: sem[i]?.entrada ?? null, esquecido: Boolean(sem[i]?.esquecido) })),
      esquecidos: esquecidos(acervo.colecao),
      ultimas: [...itens].sort((a, b) => b.numero - a.numero).slice(0, 6),
    },
  };
}

function saudacao() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Campo_Grande" }).format(new Date()));
  return h < 5 ? "Boa noite" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}
