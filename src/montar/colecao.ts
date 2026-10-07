import { carregarAcervo } from "@/lib/dados";
import { classe, diasDesde } from "@/lib/analise";
import { circ, P, t } from "@/desenho/h2";
import { itemVitrine, rotuloRelacao } from "./vitrine";

const OK = "M5 12.5l4.5 4.5L19 7.5", LOCK = "M7 11V8a5 5 0 0 1 10 0v3 M6 11h12v9H6z";

function arcoC(fr: number) {
  const c = 52, r = 44, a0 = -Math.PI / 2, a1 = a0 + Math.max(0.02, fr) * 2 * Math.PI * 0.9999;
  return `M ${P(c + Math.cos(a0) * r)} ${P(c + Math.sin(a0) * r)} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${P(c + Math.cos(a1) * r)} ${P(c + Math.sin(a1) * r)}`;
}

export async function montarColecao() {
  const acervo = await carregarAcervo();
  const c = classe(acervo.colecao);
  const ci = c.niveis.findIndex((n) => n.estado === "atual");
  const itens = acervo.colecao.map((e) =>
    itemVitrine(e.perfume, { rel: rotuloRelacao(e, acervo.colecao), assin: e.situacao === "assinatura", href: `/colecao/${e.perfumeId}`, situacao: e.situacao === "assinatura" ? "tenho assinatura" : e.situacao, foto: e.foto, numero: e.numero, adicionado: e.adicionadoEm, dias: diasDesde(e.ultimoUso) }),
  );
  const conta = (s: string) => itens.filter((i) => i.situacao.split(" ").includes(s)).length;
  return {
    t,
    demo: acervo.demo,
    classe: {
      total: c.total, nome: c.nome, prox: c.prox, faltam: c.faltam, trilho: circ(52, 52, 44), arco: arcoC(c.frac),
      niveis: c.niveis.map((n, i) => ({ nome: n.nome, cor: i < ci ? t.amber : i === ci ? `linear-gradient(90deg, ${t.amber} ${Math.round(c.frac * 100)}%, ${t.chip2} ${Math.round(c.frac * 100)}%)` : t.chip2, txt: i === ci ? t.ink : t.ink3 })),
    },
    marcosL: c.marcos.map((m) => ({ nome: m.nome, sub: m.sub, d: m.ok ? OK : LOCK, bg: m.ok ? t.chip : "transparent", borda: m.ok ? t.line2 : t.line, estilo: m.ok ? "solid" : "dashed", ibg: m.ok ? t.amber : t.chip, icor: m.ok ? t.onBtn : t.ink3, op: m.ok ? 1 : 0.7 })),
    marcosN: c.marcos.filter((m) => m.ok).length,
    marcosT: c.marcos.length,
    total: c.total,
    resumo: c.resumo,
    contagem: { tenho: conta("tenho"), tive: conta("tive"), quero: conta("quero"), assinatura: conta("assinatura") },
    itens,
  };
}
export type DadosColecao = Awaited<ReturnType<typeof montarColecao>>;
