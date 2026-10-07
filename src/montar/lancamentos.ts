import { carregarAcervo } from "@/lib/dados";
import { afinidade, naColecao } from "@/lib/analise";
import { nota as refNota } from "@/data/referencia";
import { corDoAcorde } from "@/lib/cores";
import base from "@/data/desenho/LancamentosPreto.json";
import { circ, hexA, P, t as t0 } from "@/desenho/h2";

const OURO = "#FF6B3D";
const F: Record<string, [number, number, string]> = { alto: [58, 100, "9px"], ret: [74, 84, "11px"], redondo: [88, 78, "40px"], largo: [96, 70, "12px"] };
const NICHO = new Set(["Creed", "Ex Nihilo", "Xerjoff", "Parfums de Marly", "Maison Francis Kurkdjian", "Tom Ford", "Kilian", "Frédéric Malle"]);
const ARABE = new Set(["Lattafa", "Armaf", "Afnan"]);
const FILTROS: [string, string][] = [["voce", "Para você"], ["todos", "Todos"], ["casas", "Casas da coleção"], ["nicho", "Nicho"], ["designer", "Designer"], ["arabe", "Árabe"]];

function arcoR(c: number, r: number, fr: number) {
  const a0 = -Math.PI / 2, a1 = a0 + fr * 2 * Math.PI * 0.9999;
  return `M ${P(c + Math.cos(a0) * r)} ${P(c + Math.sin(a0) * r)} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${P(c + Math.cos(a1) * r)} ${P(c + Math.sin(a1) * r)}`;
}

export async function montarLancamentos(filtro = "voce", limite = 80) {
  const acervo = await carregarAcervo();
  const t = { ...t0, ouro: OURO } as typeof t0 & { ouro: string };
  const meus = naColecao(acervo.colecao);
  const casasMinhas = new Set(meus.map((e) => e.perfume.casa));
  const quero = new Set(acervo.colecao.filter((e) => e.situacao === "quero").map((e) => e.perfumeId));

  let lista = acervo.lancamentos.map((l) => ({ ...l, pct: afinidade(l.perfume, acervo.colecao) }));
  lista = lista.filter((l) => filtro === "todos" || (filtro === "voce" ? l.pct >= 70 : filtro === "casas" ? casasMinhas.has(l.perfume.casa) : filtro === "nicho" ? NICHO.has(l.perfume.casa) : filtro === "arabe" ? ARABE.has(l.perfume.casa) : !NICHO.has(l.perfume.casa) && !ARABE.has(l.perfume.casa)));
  lista.sort((a, b) => b.pct - a.pct);
  const [d, ...resto] = lista;
  const ligado = d ? acervo.perfumes.get(d.ligacao) : undefined;

  const card = (l: (typeof lista)[number]) => {
    const p = l.perfume, f = F[p.forma] ?? F.ret, cor = corDoAcorde(p.acorde), q = quero.has(p.id);
    return {
      foto: p.imagem ?? null, id: p.id, tipo: l.tipo, nome: p.nome, casaUp: p.casa.toUpperCase(), ano: p.ano ?? "", pct: l.pct, corPct: l.pct >= 90 ? OURO : t.ink, porque: l.porque,
      notas: [p.notas.saida[0], p.notas.coracao[0], p.notas.fundo[0]].filter(Boolean).join(" · "),
      bw: f[0], bh: f[1], br: f[2], capW: Math.round(f[0] * 0.48), lw: f[0] - 14, tampa: p.tampa, rot: p.casa.split(" ")[0].toUpperCase().slice(0, 8),
      vidro: `linear-gradient(115deg, rgba(255,255,255,.35) 0%, ${hexA(cor, 0.32)} 45%, ${hexA(cor, 0.6)} 100%)`, palco: `radial-gradient(ellipse at 50% 85%, ${hexA(cor, 0.3)} 0%, ${t.surface} 72%)`,
      btn: q ? "✓ No seu Quero" : "Adicionar ao Quero", btnBg: q ? t.chip2 : "transparent", btnCor: t.ink, // secundário: o metálico fica só na ação principal da tela
      href: `/colecao/${p.id}`,
    };
  };

  const porCasa = new Map<string, string[]>();
  acervo.lancamentos.filter((l) => casasMinhas.has(l.perfume.casa)).forEach((l) => porCasa.set(l.perfume.casa, [...(porCasa.get(l.perfume.casa) ?? []), l.perfume.nome]));

  const dp = d?.perfume;
  const cor = dp ? corDoAcorde(dp.acorde) : "#8AA094";
  return {
    ...base,
    t,
    demo: acervo.demo,
    n: lista.filter((l) => l.pct >= limite).length || lista.length,
    limite,
    filtros: FILTROS.map(([k, nome]) => ({ nome, bg: k === filtro ? t.btn : "transparent", cor: k === filtro ? t.onBtn : t.ink2, href: `/novidades?filtro=${k}` })),
    dest: dp
      ? {
          foto: dp.imagem ?? null, id: dp.id, nome: dp.nome, rot: dp.casa.split(" ")[0].toUpperCase(), linha: [dp.casa.toUpperCase(), dp.ano, d.tipo].filter(Boolean).join(" · "), porque: d.porque, pct: d.pct,
          tampa: dp.tampa, vidro: `linear-gradient(115deg, rgba(255,255,255,.35) 0%, ${hexA(cor, 0.35)} 40%, ${hexA(cor, 0.7)} 100%)`,
          comparar: ligado ? `/comparar?a=${dp.id}&b=${ligado.id}` : `/comparar?a=${dp.id}`, som: `/sommelier?perfume=${dp.id}`,
        }
      : { id: "", nome: "Nenhum lançamento", rot: "", linha: "", porque: acervo.lancamentos.length ? "Nada novo neste filtro." : "Ainda sem lançamentos. A busca automática roda toda segunda; em Ajustes › Notificações dá para buscar agora.", pct: 0, tampa: "#141B18", vidro: "transparent", comparar: "#", som: "/sommelier" },
    destaque: dp
      ? {
          notas: [...dp.notas.saida.slice(0, 2), ...dp.notas.coracao.slice(0, 1), ...dp.notas.fundo.slice(0, 1)].map((n) => { const r = refNota(n); return { nome: n, d: r.icone, cor: t.amber, bg: r.foto ? "#FFFFFF" : hexA(t.amber, 0.14), borda: hexA(t.amber, 0.45), img: r.foto ?? "", semImg: !r.foto }; }),
          trilho: circ(95, 95, 80), arco: arcoR(95, 80, d.pct / 100),
          porque: [
            { l: d.tipo === "FLANKER" ? "Flanker de" : "Ligado a", v: ligado ? `${ligado.nome}${meus.some((e) => e.perfumeId === ligado.id) ? " (você tem)" : ""}` : "—" },
            { l: "Família", v: dp.familia },
            { l: "Preenche lacuna", v: dp.acordes.find((a) => ["Esfumaçado", "Couro", "Floral", "Verde", "Incenso"].includes(a.nome))?.nome ?? "—" },
          ],
        }
      : base.destaque,
    cards: resto.map(card),
    casas: [...porCasa.entries()].map(([casa, ns]) => ({ casa, txt: ns.length > 1 ? `${ns[0]} e outros ${ns.length - 1}` : ns[0], n: `${ns.length} ${ns.length > 1 ? "novos" : "novo"}` })),
  };
}
