import { carregarAcervo } from "@/lib/dados";
import { dna, fluxo, naColecao } from "@/lib/analise";
import { nota as refNota, tipoNota } from "@/data/referencia";
import { corDoAcorde } from "@/lib/cores";
import { FAMCOR, glifo, hexA, P, t } from "@/desenho/h2";

const EIXO_COR: Record<string, string> = { ...FAMCOR, Floral: corDoAcorde("Floral") };
const NCOR: Record<string, string> = { fruta: "#F2949A", baga: "#E58FA0", citrico: "#F2D06B", flor: "#E58FA0", folha: "#94B86E", madeira: "#B08E6A", gota: "#6FA9C4", especiaria: "#D9663F", resina: "#E0A04A", baunilha: "#EBCB98", nuvem: "#9DB2A7" };
const PLURAL: Record<string, string> = { Frutado: "frutados", Amadeirado: "amadeirados", Cítrico: "cítricos", Aquático: "aquáticos", Especiado: "especiados", Âmbar: "âmbares", Baunilha: "gourmands" };
const CORF: Record<string, string> = { Frutado: corDoAcorde("Frutado"), Amadeirado: corDoAcorde("Amadeirado"), Cítrico: corDoAcorde("Cítrico"), Aquático: corDoAcorde("Aquático"), Especiado: corDoAcorde("Especiado"), Âmbar: corDoAcorde("Âmbar"), Baunilha: corDoAcorde("Baunilha") };

export async function montarDNA() {
  const acervo = await carregarAcervo();
  const d = dna(acervo.colecao);
  const itens = naColecao(acervo.colecao);
  const cores = d.eixos.map((e) => EIXO_COR[e.nome]);
  const eixos = d.eixos.map((a, i) => { const an = (i * 2 * Math.PI) / 8 - Math.PI / 2; return { x: P(280 + Math.cos(an) * 258), y: P(280 + Math.sin(an) * 250), nome: a.nome.toUpperCase(), v: a.v, cor: cores[i] }; });
  const mx = d.notas[0]?.qtd ?? 1;
  const notas = d.notas.map((n) => { const c = NCOR[tipoNota(n.nome)]; const r = refNota(n.nome); return { nome: n.nome, d: r.icone, cor: c, bg: r.foto ? "#FFFFFF" : hexA(c, 0.14), borda: hexA(c, 0.45), img: r.foto ?? "", semImg: !r.foto, qtd: n.qtd, pct: Math.round((n.qtd / mx) * 100) }; });
  const lacunas = d.lacunas.map((l) => {
    const p = acervo.perfumes.get(l.perfumeId)!;
    const cor = l.falta === "Floral" ? corDoAcorde("Floral") : l.falta === "Couro" ? corDoAcorde("Couro") : l.falta === "Verde" ? corDoAcorde("Verde") : "#C9D6CF";
    return { foto: p.imagem ?? null, falta: l.falta.toUpperCase(), cor, nome: p.nome, casa: p.casa, por: l.por, tampa: p.tampa, fundo: `linear-gradient(160deg, ${hexA(cor, 0.22)} 0%, ${hexA(cor, 0.04)} 100%)`, vidro: `linear-gradient(115deg, rgba(255,255,255,.35) 0%, ${hexA(cor, 0.32)} 45%, ${hexA(cor, 0.55)} 100%)`, href: `/colecao/${p.id}` };
  });
  const N = Math.max(13, itens.length);
  const estacoes = d.estacoes.map((e) => ({ nome: e.nome, n: e.n, blocos: Array.from({ length: N }, (_, i) => (i < e.n ? t.amber : t.chip2)) }));

  // gráfico do gosto, com cores e rótulos do desenho
  const f = fluxo(acervo.colecao, 1000, 230, 30, 6);
  const camadas = f.camadas.map((c) => ({ d: c.d, cor: CORF[c.nome] ?? corDoAcorde(c.nome), op: c.nome === "Frutado" ? 1 : 0.9 }));
  let acum = 0;
  const rotulos = f.rotulos.map((r) => { const y = 236 - (acum + r.pct / 200) * 230; acum += r.pct / 100; return { nome: r.nome, cor: CORF[r.nome] ?? corDoAcorde(r.nome), pct: r.pct, y }; });
  for (let q = 1; q < rotulos.length; q++) if (rotulos[q].y > rotulos[q - 1].y - 16) rotulos[q].y = rotulos[q - 1].y - 16;
  const primeiro = f.rotulos.length ? [...acervo.colecao].sort((a, b) => a.adicionadoEm.localeCompare(b.adicionadoEm))[0]?.perfume.acorde : "";
  const ultimos = naColecao(acervo.colecao).sort((a, b) => b.adicionadoEm.localeCompare(a.adicionadoEm)).slice(0, 4);
  const recentes = [...new Set(ultimos.map((e) => e.perfume.acorde))].slice(0, 2).map((x) => x.toLowerCase());
  const anoRec = ultimos.length ? new Date(ultimos[ultimos.length - 1].adicionadoEm).getFullYear() : new Date().getFullYear();

  const antigos = itens.filter((e) => (e.perfume.ano ?? 2020) < 2005).length;
  const leves = itens.filter((e) => (e.perfume.fixacaoH ?? 7) < 6).length;
  const c = d.carater;

  return {
    t,
    demo: acervo.demo,
    tit: { a: d.titulo[0], b: d.titulo[1], texto: d.texto },
    glifo: glifo(d.eixos.map((e) => e.v), cores),
    eixos,
    tracos: d.tracos.map((x) => ({ nome: x.nome, cor: x.cor, bg: hexA(x.cor, 0.2) })),
    cifras: d.cifras,
    notas,
    carater: c.map((x) => ({ ...x, ce: x.v < 50 ? t.ink : t.ink3, cd: x.v >= 50 ? t.ink : t.ink3 })),
    caraterTxt: [`Coleção ${c[4].v >= 60 ? "moderna" : "clássica"}, ${c[1].v >= 55 ? "intensa" : "leve"} e mais ${c[3].v < 50 ? "diurna" : "noturna"}.`, !antigos ? `Quase nada lançado antes de 2005${leves <= 1 ? " e poucos perfumes leves" : ""}.` : leves <= 1 ? "Poucos perfumes leves." : ""].filter(Boolean).join(" "),
    lacunas,
    estacoes,
    verao: d.estacoes[1].n,
    estacoesTxt: d.resumoEstacoes,
    fluxo: { camadas, rotulos: rotulos.map((r) => ({ ...r, y: P(r.y) })), anos: f.anos.map((a) => ({ x: P(a.x), t: a.t })) },
    gostoTxt: primeiro ? `Você começou pelos ${PLURAL[primeiro] ?? primeiro.toLowerCase()} e, desde ${anoRec}, vem puxando para ${recentes.join(" e ")}.` : "",
  };
}
