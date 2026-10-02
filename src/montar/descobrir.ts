import { carregarAcervo } from "@/lib/dados";
import { naColecao } from "@/lib/analise";
import { CASAS, ENCICLOPEDIA, LICOES, LICOES_CONCLUIDAS, nota as refNota } from "@/data/referencia";
import { corDoAcorde } from "@/lib/cores";
import base from "@/data/desenho/DescobrirPreto.json";
import { hexA, P, t } from "@/desenho/h2";
import type { Perfume } from "@/lib/tipos";

const vidro = (cor: string) => `linear-gradient(115deg, rgba(255,255,255,.35) 0%, ${hexA(cor, 0.32)} 45%, ${hexA(cor, 0.55)} 100%)`;
const iniciais = (n: string) => n.split(" ").filter((x) => x.length > 2 || /^[A-Z]/.test(x)).map((x) => x[0]).slice(0, 2).join("").toUpperCase();

export async function montarDescobrir(notaPedida?: string) {
  const acervo = await carregarAcervo();
  const itens = naColecao(acervo.colecao);
  const meus = new Set(itens.map((e) => e.perfume.id));
  const todos = [...acervo.perfumes.values()];

  // escola do nariz: 4 lições à vista, a partir da próxima
  const licoes = LICOES.slice(0, 4).map((l, i) => {
    const ex = itens.filter((e) => l.familia && (e.perfume.familia.toLowerCase().includes(l.familia.toLowerCase()) || e.perfume.acordes.some((a) => a.nome.toLowerCase() === l.familia.toLowerCase()) || e.perfume.notas.coracao.concat(e.perfume.notas.fundo).some((n) => n.toLowerCase() === l.familia.toLowerCase()))).map((e) => e.perfume.nome).slice(0, 2);
    const feita = i < LICOES_CONCLUIDAS;
    return { n: l.n, titulo: l.titulo, txt: l.txt, ex: ex.join(", ") || "—", status: feita ? "✓ Concluída" : i === LICOES_CONCLUIDAS ? "Próxima" : `${l.min} min`, stCor: feita ? t.sup[0] : i === LICOES_CONCLUIDAS ? t.sup[1] : t.ink3, bg: feita ? t.chip : "rgba(255,255,255,.04)", borda: feita ? t.line2 : t.line };
  });

  // enciclopédia
  const contaNota = new Map<string, number>();
  itens.forEach((e) => new Set([...e.perfume.notas.saida, ...e.perfume.notas.coracao, ...e.perfume.notas.fundo]).forEach((n) => contaNota.set(n, (contaNota.get(n) ?? 0) + 1)));
  const comFoto = [...contaNota.keys()].filter((n) => refNota(n).foto && ENCICLOPEDIA[n]);
  const atual = notaPedida && contaNota.has(notaPedida) ? notaPedida : comFoto[0] ?? [...contaNota.keys()][0] ?? "Abacaxi";
  const info = ENCICLOPEDIA[atual];
  const naCol = itens.filter((e) => [...e.perfume.notas.saida, ...e.perfume.notas.coracao, ...e.perfume.notas.fundo].includes(atual)).map((e) => e.perfume.nome);
  const conhecer = todos.filter((p) => !meus.has(p.id) && [...p.notas.saida, ...p.notas.coracao, ...p.notas.fundo].includes(atual)).map((p) => p.nome).slice(0, 2);

  // árvore: originais com releituras ligadas à coleção
  const originais = todos.filter((o) => todos.some((x) => x.inspiradoEm === o.id) && (meus.has(o.id) || todos.some((x) => x.inspiradoEm === o.id && meus.has(x.id))));
  const nos: ReturnType<typeof no>[] = [];
  const pares: [number, number][] = [];
  function no(x: number, y: number, w: number, p: Perfume, original: boolean) {
    const tem = meus.has(p.id);
    return { x, y, w, nome: p.nome, sub: [p.casa.toUpperCase(), p.ano, original ? "ORIGINAL" : ""].filter(Boolean).join(" · "), bg: tem ? t.chip2 : "transparent", borda: tem ? t.amber : t.ink3, estilo: tem ? "solid" : "dashed", vidro: vidro(corDoAcorde(p.acorde)), tampa: p.tampa, href: `/colecao/${p.id}` };
  }
  originais.slice(0, 2).forEach((o, k) => {
    const cx = k === 0 ? 300 : 960;
    const filhos = todos.filter((x) => x.inspiradoEm === o.id).slice(0, 3);
    const i0 = nos.push(no(cx, 70, 230, o, true)) - 1;
    const larg = 215;
    filhos.forEach((f, j) => {
      const x = cx - ((filhos.length - 1) * larg) / 2 + j * larg;
      const i1 = nos.push(no(x, 250, 190, f, false)) - 1;
      pares.push([i0, i1]);
    });
  });
  const liga = ([a, b]: [number, number]) => { const A = nos[a], B = nos[b], my = (A.y + B.y) / 2; return `M ${A.x} ${A.y + 30} C ${A.x} ${my} ${B.x} ${my} ${B.x} ${B.y - 30} `; };

  // linha do tempo
  const anosLanc = itens.filter((e) => e.perfume.ano).sort((a, b) => (a.perfume.ano ?? 0) - (b.perfume.ano ?? 0) || a.perfume.nome.localeCompare(b.perfume.nome));
  const a0 = Math.min(...anosLanc.map((e) => e.perfume.ano!), 2006) - 1, a1 = Math.max(...anosLanc.map((e) => e.perfume.ano!), 2024) + 1;
  const tx = (a: number) => 20 + ((a - a0) / (a1 - a0)) * 770;
  const niveis = [-1, 1, -2, 2];
  const pts = anosLanc.map((e, i) => {
    const lv = niveis[i % 4], up = lv < 0, dist = Math.abs(lv) * 52, ty = 151 + (up ? -dist : dist + 18);
    return { nome: e.perfume.nome.replace("Acqua di Giò Profondo", "ADG Profondo"), ano: e.perfume.ano, x: P(tx(e.perfume.ano!)), cor: corDoAcorde(e.perfume.acorde), ty: P(ty), ly: P(up ? ty + 14 : 157), lh: P(up ? 151 - (ty + 14) : ty - 14 - 157) };
  });
  const passo = (a1 - a0) > 30 ? 8 : 4;
  const marcas: number[] = [];
  for (let a = Math.ceil((a0 + 1) / passo) * passo; a < a1; a += passo) marcas.push(a);
  const depois2014 = anosLanc.filter((e) => (e.perfume.ano ?? 0) > 2014).length;
  const antigo = anosLanc[0];

  // perfumistas
  const perf = new Map<string, string>();
  itens.forEach((e) => e.perfume.perfumistas.slice(0, 1).forEach((n) => { if (!perf.has(n)) perf.set(n, e.perfume.nome); }));

  // mapa das casas
  const porCidade = new Map<string, { x: number; y: number; n: number; casas: Set<string> }>();
  const porPais = new Map<string, { n: number; casas: Map<string, string[]> }>();
  itens.forEach((e) => {
    const c = CASAS[e.perfume.casa];
    const pais = c?.pais ?? e.perfume.pais ?? "—";
    if (c) { const k = porCidade.get(c.cidade) ?? { x: c.x, y: c.y, n: 0, casas: new Set() }; k.n++; k.casas.add(e.perfume.casa); porCidade.set(c.cidade, k); }
    const pp = porPais.get(pais) ?? { n: 0, casas: new Map() }; pp.n++; pp.casas.set(e.perfume.casa, [...(pp.casas.get(e.perfume.casa) ?? []), e.perfume.nome]); porPais.set(pais, pp);
  });
  const desloc: Record<string, [number, number]> = { Paris: [18, -34], "Turim e Milão": [18, 8], "Dubai e Sharjah": [-150, -10], "Nova York": [18, -12] };

  return {
    ...base,
    t,
    demo: acervo.demo,
    licoes,
    licoesTxt: `${LICOES_CONCLUIDAS} de ${LICOES.length} lições concluídas`,
    notasTxt: `${contaNota.size} notas na sua coleção`,
    enc: { nome: atual, foto: refNota(atual).foto ?? "", tipo: info?.tipo ?? "Nota da sua coleção", origem: info?.origem ?? "—", como: info?.como ?? "—", naColecao: naCol.join(" · ") || "—", conhecer: (info?.conhecer?.length ? info.conhecer : conhecer).join(" · ") || "—" },
    notasMini: comFoto.filter((n) => n !== atual).slice(0, 6).map((n) => ({ nome: n, img: refNota(n).foto, href: `/descobrir?nota=${encodeURIComponent(n)}` })),
    arvore: { nos, linhas: pares.map(liga).join("") },
    tempo: { pts, anos: marcas.map((a) => ({ x: P(tx(a)), t: String(a) })) },
    tempoTxt: antigo ? `Sua coleção é ${depois2014 > anosLanc.length / 2 ? "recente" : "clássica"}: ${depois2014} dos ${anosLanc.length} frascos saíram depois de 2014. O mais antigo é o ${antigo.perfume.nome}, de ${antigo.perfume.ano}.` : "",
    perfumistas: [...perf.entries()].slice(0, 6).map(([nome, obra]) => ({ ini: iniciais(nome), nome, obra })),
    mapa: {
      grade: base.mapa.grade,
      pts: [...porCidade.entries()].map(([cidade, c]) => { const [dx, dy] = desloc[cidade] ?? [18, -12]; return { cidade, n: `${c.n} ${c.n === 1 ? "PERFUME" : "PERFUMES"}`, x: P(c.x), y: P(c.y), r: 24 + c.n * 10, halo: "radial-gradient(circle, rgba(201,209,222,.35) 0%, rgba(201,209,222,0) 70%)", lx: P(c.x + dx), ly: P(c.y + dy) }; }),
      paises: [...porPais.entries()].sort((a, b) => b[1].n - a[1].n).map(([nome, p]) => ({ nome, n: String(p.n), casas: [...p.casas.entries()].map(([casa, ps]) => (p.casas.size === 1 && ps.length > 1 ? `${casa} (${ps.join(" e ")})` : casa)).join(", ") })),
    },
  };
}
