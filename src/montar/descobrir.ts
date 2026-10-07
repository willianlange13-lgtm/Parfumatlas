import { carregarAcervo } from "@/lib/dados";
import { naColecao } from "@/lib/analise";
import { CASAS, ENCICLOPEDIA, LICOES, LICOES_CONCLUIDAS, nota as refNota } from "@/data/referencia";
import { corDoAcorde } from "@/lib/cores";
import base from "@/data/desenho/DescobrirPreto.json";
import { P, t } from "@/desenho/h2";
import { after } from "next/server";
import { createClient, supabaseConfigurado } from "@/lib/supabase/server";
import { gerarLicao, lerEscola, semanaAtual, type Licao } from "@/lib/escola";

/** Número do dia em Campo Grande: o que "gira por dia" muda à meia-noite local. */
const hojeN = () => Math.floor((Date.now() - 4 * 36e5) / 864e5);
const girar = <T,>(lista: T[], n: number, k = 1) => (lista.length ? Array.from({ length: Math.min(k, lista.length) }, (_, i) => lista[(n + i) % lista.length]) : []);
const notasDe = (e: { perfume: { notas: { saida: string[]; coracao: string[]; fundo: string[] } } }) => [...e.perfume.notas.saida, ...e.perfume.notas.coracao, ...e.perfume.notas.fundo];


export async function montarDescobrir(notaPedida?: string) {
  const acervo = await carregarAcervo();
  const itens = naColecao(acervo.colecao);
  const tive = acervo.colecao.filter((e) => e.situacao === "tive");
  const historia = [...itens, ...tive]; // linha do tempo, notas e mapa contam também os que você teve
  const foiTive = new Set(tive.map((e) => e.perfume.id));
  const meus = new Set(historia.map((e) => e.perfume.id));
  const todos = [...acervo.perfumes.values()];
  const dia = hojeN();

  // escola do nariz (docs/DECISOES.md §20): lição semanal da IA; sem banco, as lições fixas de exemplo
  let escola: Licao[] | null = null;
  if (!acervo.demo && supabaseConfigurado()) {
    const sb = await createClient();
    escola = await lerEscola(sb);
    if (escola && !escola.some((l) => l.semana === semanaAtual())) {
      const antigas = escola, col = acervo.colecao;
      after(() => gerarLicao(sb, col, antigas).catch(() => null)); // gera depois de mostrar a página; aparece na próxima visita
    }
  }
  const licoesIA = escola?.slice(0, 4).map((l, i) => ({
    n: i === 0 && l.semana === semanaAtual() ? "DA SEMANA" : l.semana.replace(/^\d{4}-S/, "SEMANA "),
    titulo: l.titulo, txt: l.txt, exercicio: l.exercicio, ex: l.perfumes.join(", ") || "—", semana: l.semana, feita: l.feita,
    status: l.feita ? "✓ Concluída" : `${l.min} min`, stCor: l.feita ? t.sup[0] : i === 0 ? t.sup[1] : t.ink3, bg: l.feita ? t.chip : "rgba(242,238,227,.04)", borda: i === 0 && !l.feita ? "var(--ouro-linha)" : l.feita ? t.line2 : t.line,
  }));
  const gerando = escola !== null && !escola.some((l) => l.semana === semanaAtual()) && itens.length > 0;
  const licoes = licoesIA ?? LICOES.slice(0, 4).map((l, i) => {
    const ex = itens.filter((e) => l.familia && (e.perfume.familia.toLowerCase().includes(l.familia.toLowerCase()) || e.perfume.acordes.some((a) => a.nome.toLowerCase() === l.familia.toLowerCase()) || e.perfume.notas.coracao.concat(e.perfume.notas.fundo).some((n) => n.toLowerCase() === l.familia.toLowerCase()))).map((e) => e.perfume.nome).slice(0, 2);
    const feita = i < LICOES_CONCLUIDAS;
    return { n: `LIÇÃO ${l.n}`, titulo: l.titulo, txt: l.txt, exercicio: "", semana: "", feita, ex: ex.join(", ") || "—", status: feita ? "✓ Concluída" : i === LICOES_CONCLUIDAS ? "Próxima" : `${l.min} min`, stCor: feita ? t.sup[0] : i === LICOES_CONCLUIDAS ? t.sup[1] : t.ink3, bg: feita ? t.chip : "rgba(242,238,227,.04)", borda: feita ? t.line2 : t.line };
  });

  // enciclopédia
  const contaNota = new Map<string, number>();
  historia.forEach((e) => new Set(notasDe(e)).forEach((n) => contaNota.set(n, (contaNota.get(n) ?? 0) + 1)));
  const comFoto = [...contaNota.keys()].filter((n) => refNota(n).foto && ENCICLOPEDIA[n]).sort((a, b) => a.localeCompare(b));
  // nota do dia: gira entre as notas da sua história que têm verbete
  const atual = notaPedida && contaNota.has(notaPedida) ? notaPedida : girar(comFoto, dia)[0] ?? [...contaNota.keys()][0] ?? "Abacaxi";
  const info = ENCICLOPEDIA[atual];
  const naCol = historia.filter((e) => notasDe(e).includes(atual)).map((e) => (foiTive.has(e.perfume.id) ? `${e.perfume.nome} (tive)` : e.perfume.nome));
  // para conhecer: verbete + catálogo, sem o que você tem ou teve, girando por dia
  const poolConhecer = [...new Set([...(info?.conhecer ?? []), ...todos.filter((p) => !meus.has(p.id) && [p.notas.saida, p.notas.coracao, p.notas.fundo].flat().includes(atual)).map((p) => p.nome)])]
    .filter((n) => !historia.some((e) => e.perfume.nome.toLowerCase() === n.toLowerCase()));
  const conhecer = girar(poolConhecer, dia, 2);

  // linha do tempo
  const anosLanc = historia.filter((e) => e.perfume.ano).sort((a, b) => (a.perfume.ano ?? 0) - (b.perfume.ano ?? 0) || a.perfume.nome.localeCompare(b.perfume.nome));
  const a0 = Math.min(...anosLanc.map((e) => e.perfume.ano!), 2006) - 1, a1 = Math.max(...anosLanc.map((e) => e.perfume.ano!), 2024) + 1;
  const tx = (a: number) => 20 + ((a - a0) / (a1 - a0)) * 770;
  const niveis = [-1, 1, -2, 2];
  const pts = anosLanc.map((e, i) => {
    const lv = niveis[i % 4], up = lv < 0, dist = Math.abs(lv) * 52, ty = 151 + (up ? -dist : dist + 18);
    return { nome: e.perfume.nome.replace("Acqua di Giò Profondo", "ADG Profondo"), ano: e.perfume.ano, x: P(tx(e.perfume.ano!)), cor: corDoAcorde(e.perfume.acorde), tive: foiTive.has(e.perfume.id), ty: P(ty), ly: P(up ? ty + 14 : 157), lh: P(up ? 151 - (ty + 14) : ty - 14 - 157) };
  });
  const passo = (a1 - a0) > 30 ? 8 : 4;
  const marcas: number[] = [];
  for (let a = Math.ceil((a0 + 1) / passo) * passo; a < a1; a += passo) marcas.push(a);
  const atuaisAno = anosLanc.filter((e) => !foiTive.has(e.perfume.id));
  const depois2014 = atuaisAno.filter((e) => (e.perfume.ano ?? 0) > 2014).length;
  const antigo = atuaisAno[0];
  const nTive = anosLanc.length - atuaisAno.length;

  // mapa das casas
  const porCidade = new Map<string, { x: number; y: number; n: number; casas: Set<string> }>();
  const porPais = new Map<string, { n: number; casas: Map<string, string[]> }>();
  historia.forEach((e) => {
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
    licoesTxt: escola ? `${escola.filter((l) => l.feita).length} de ${escola.length} ${escola.length === 1 ? "lição concluída" : "lições concluídas"}` : `${LICOES_CONCLUIDAS} de ${LICOES.length} lições concluídas`,
    licoesPct: `${Math.round((escola ? (escola.length ? escola.filter((l) => l.feita).length / escola.length : 0) : LICOES_CONCLUIDAS / LICOES.length) * 100)}%`,
    licoesAviso: escola === null && !acervo.demo && supabaseConfigurado() ? "Lições de exemplo: falta rodar supabase/migrations/0004_escola.sql no Supabase para a IA gerar a lição da semana." : gerando ? "A lição desta semana está sendo preparada. Volte em alguns instantes." : "",
    licoesIA: Boolean(escola),
    notasTxt: `${contaNota.size} notas na sua coleção${tive.length ? " e nos que você teve" : ""}`,
    enc: { nome: atual, foto: refNota(atual).foto ?? "", tipo: info?.tipo ?? "Nota da sua coleção", origem: info?.origem ?? "—", como: info?.como ?? "—", naColecao: naCol.join(" · ") || "—", conhecer: (info?.conhecer?.length ? info.conhecer : conhecer).join(" · ") || "—" },
    notasMini: comFoto.filter((n) => n !== atual).slice(0, 6).map((n) => ({ nome: n, img: refNota(n).foto, href: `/descobrir?nota=${encodeURIComponent(n)}` })),
    tempo: { pts, anos: marcas.map((a) => ({ x: P(tx(a)), t: String(a) })) },
    tempoTxt: antigo ? `Sua coleção é ${depois2014 > anosLanc.length / 2 ? "recente" : "clássica"}: ${depois2014} dos ${anosLanc.length} frascos saíram depois de 2014. O mais antigo é o ${antigo.perfume.nome}, de ${antigo.perfume.ano}.${nTive ? ` Os ${nTive} apagados são frascos que você já teve.` : ""}` : "",
    mapa: {
      grade: base.mapa.grade,
      pts: [...porCidade.entries()].map(([cidade, c]) => { const [dx, dy] = desloc[cidade] ?? [18, -12]; return { cidade, n: `${c.n} ${c.n === 1 ? "PERFUME" : "PERFUMES"}`, x: P(c.x), y: P(c.y), r: 24 + c.n * 10, halo: "radial-gradient(circle, rgba(201,214,207,.35) 0%, rgba(201,214,207,0) 70%)", lx: P(c.x + dx), ly: P(c.y + dy) }; }),
      paises: [...porPais.entries()].sort((a, b) => b[1].n - a[1].n).map(([nome, p]) => ({ nome, n: String(p.n), casas: [...p.casas.entries()].map(([casa, ps]) => (p.casas.size === 1 && ps.length > 1 ? `${casa} (${ps.join(" e ")})` : casa)).join(", ") })),
    },
  };
}
