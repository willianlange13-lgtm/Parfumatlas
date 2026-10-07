import Link from "next/link";
import { connection } from "next/server";
import { carregarAcervo } from "@/lib/dados";
import { glifo, EC } from "@/desenho/h2";
import { hm, naColecao, similaridade, vetor } from "@/lib/analise";
import { Btn, Camadas, Card, Cartaz, MONO, OURO, PalcoC, Rot, Topo } from "@/cel/kit";
import type { Perfume } from "@/lib/tipos";
import { dnaMini } from "@/lib/dna-mini";
import { territorio } from "@/lib/territorio";
import { coordenadas, paisDaCasa } from "@/data/casas";

export const metadata = { title: "Comparar" };

const melhorEm = (p: Perfume) => {
  const e = p.votos?.estacoes;
  return `${(p.votos?.noite ?? 50) > (p.votos?.dia ?? 50) ? "Noite" : "Dia"} e ${e && e.inverno + e.outono > e.verao + e.primavera ? "frio" : "calor"}`;
};

export default async function Comparar({ searchParams }: PageProps<"/comparar">) {
  await connection();
  const sp = await searchParams;
  const acervo = await carregarAcervo();
  const meus = naColecao(acervo.colecao).map((e) => e.perfume);
  const a = acervo.perfumes.get(String(sp.a ?? "")) ?? meus[0];
  if (!a) return <div className="c-tela"><Topo titulo="Comparar" voltar /><p>Cadastre perfumes para comparar.</p></div>;
  const opcoes = [...meus, ...acervo.perfumes.values()].filter((p, i, l) => p.id !== a.id && l.findIndex((x) => x.id === p.id) === i).map((p) => ({ p, s: similaridade(a, p) })).sort((x, y) => y.s - x.s);
  const b = acervo.perfumes.get(String(sp.b ?? "")) ?? opcoes.find((o) => meus.some((m) => m.id === o.p.id))?.p ?? opcoes[0]?.p;
  if (!b) return null;
  const sim = similaridade(a, b);
  const na = [...a.notas.saida, ...a.notas.coracao, ...a.notas.fundo], nb = [...b.notas.saida, ...b.notas.coracao, ...b.notas.fundo];
  const comuns = na.filter((n) => nb.includes(n));
  const linhas: [string, string, string][] = [
    ["Casa", a.casa, b.casa], ["Família", a.familia, b.familia], ["Ano", String(a.ano ?? "—"), String(b.ano ?? "—")],
    ["Fixação", a.fixacaoH ? hm(a.fixacaoH) : "—", b.fixacaoH ? hm(b.fixacaoH) : "—"],
    ["Projeção", a.projecaoM ? `${a.projecaoM.toFixed(1).replace(".", ",")} m` : "—", b.projecaoM ? `${b.projecaoM.toFixed(1).replace(".", ",")} m` : "—"],
    ["Melhor em", melhorEm(a), melhorEm(b)],
    ["Só nele", na.filter((n) => !nb.includes(n)).slice(0, 4).join(", ") || "—", nb.filter((n) => !na.includes(n)).slice(0, 4).join(", ") || "—"],
  ];
  const ga = glifo(vetor(a), EC, true), gb = glifo(vetor(b), EC, true);
  const fotoDe = (p: Perfume) => acervo.colecao.find((e) => e.perfumeId === p.id)?.foto ?? p.imagem ?? null;
  return (
    <>
    <div className="so-computador"><CompararDesktop a={a} b={b} sim={sim} linhas={linhas} na={na} nb={nb} comuns={comuns} fotoA={fotoDe(a)} fotoB={fotoDe(b)} opcoes={opcoes.slice(0, 12).map((o) => ({ id: o.p.id, nome: o.p.nome, s: o.s }))} /></div>
    <div className="so-celular">
    <div className="c-tela sem-barra tela-tecnica" style={{ maxWidth: 620, margin: "0 auto" }}>
      <Topo titulo="Comparar" voltar />
      <Cartaz rot={`${sim}% de semelhança`} a={a.nome} b={`× ${b.nome}`} />
      <div className="c-grade2">
        {[a, b].map((p) => (
          <Link key={p.id} href={`/colecao/${p.id}`} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PalcoC nome={p.nome} casa={p.casa} acorde={p.acorde} forma={p.forma} tampa={p.tampa} foto={acervo.colecao.find((e) => e.perfumeId === p.id)?.foto ?? p.imagem} altura={150} k={0.8} raio={18} />
            <span style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.15 }}>{p.nome}</span>
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".08em", color: "var(--ink-3)" }}>{p.casa.toUpperCase()}</span>
          </Link>
        ))}
      </div>
      <Card fundo="destaque" pad={16}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
            <div style={{ position: "absolute", inset: 0 }}><Camadas camadas={ga} tam={120} /></div>
            <div style={{ position: "absolute", inset: 0, filter: "hue-rotate(160deg)", opacity: 0.85 }}><Camadas camadas={gb.slice(1)} tam={120} /></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Rot>Semelhança</Rot>
            <span style={{ fontSize: 34, color: OURO, lineHeight: 1 }}>{sim}%</span>
            <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{comuns.length ? `Em comum: ${comuns.slice(0, 4).join(", ").toLowerCase()}` : "Nenhuma nota em comum"}</span>
          </div>
        </div>
      </Card>
      <Card pad={16} gap={0}>
        {linhas.map(([l, x, y], i) => (
          <div key={l} style={{ display: "grid", gridTemplateColumns: "84px 1fr 1fr", gap: 10, padding: "10px 0", borderTop: i ? "1px solid var(--line)" : "none", fontSize: 13.5 }}>
            <span style={{ color: "var(--ink-3)" }}>{l}</span><span>{x}</span><span>{y}</span>
          </div>
        ))}
      </Card>
      <Rot>Trocar o segundo</Rot>
      <div className="c-rolar" style={{ gap: 6 }}>
        {opcoes.slice(0, 10).map((o) => (
          <Link key={o.p.id} href={`/comparar?a=${a.id}&b=${o.p.id}`} className={`c-pill ${o.p.id === b.id ? "on" : ""}`} style={{ height: 34, borderRadius: "var(--r-ctl)", fontSize: 12.5 }}>{o.p.nome} · {o.s}%</Link>
        ))}
      </div>
      <Btn href={`/sommelier?perfume=${a.id}&q=${encodeURIComponent(`Entre o ${a.nome} e o ${b.nome}, qual vai melhor hoje?`)}`}>Perguntar ao sommelier qual usar hoje</Btn>
    </div>
    </div>
    </>
  );
}

/** Comparar no computador: laudo técnico com os dois DNAs sobrepostos (docs/DECISOES.md §18). */
function CompararDesktop({ a, b, sim, linhas, na, nb, comuns, fotoA, fotoB, opcoes }: { a: Perfume; b: Perfume; sim: number; linhas: [string, string, string][]; na: string[]; nb: string[]; comuns: string[]; fotoA: string | null; fotoB: string | null; opcoes: { id: string; nome: string; s: number }[] }) {
  const ta = territorio(a.familia, a.acordes), tb = territorio(b.familia, b.acordes);
  const da = dnaMini(a.acordes), db = dnaMini(b.acordes);
  const rot: React.CSSProperties = { fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".14em", color: "var(--ink-3)" };
  const tit: React.CSSProperties = { ...rot, color: "var(--ouro-txt)", margin: 0, fontWeight: 400, fontSize: 12 };
  const lado = (p: Perfume, foto: string | null, cor: string, alinhar: "left" | "right") => (
    <Link href={`/colecao/${p.id}`} style={{ display: "flex", flexDirection: "column", alignItems: alinhar === "left" ? "flex-start" : "flex-end", textAlign: alinhar, gap: 10 }}>
      <div style={{ width: 220, height: 260, display: "flex", alignItems: "flex-end", justifyContent: "center", borderRadius: "var(--r-ed)", background: `radial-gradient(ellipse at 50% 90%, ${cor}33 0%, rgba(0,0,0,0) 70%)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {foto ? <img src={foto} alt={p.nome} style={{ maxWidth: 200, maxHeight: 240, objectFit: "contain", filter: "drop-shadow(0 16px 18px rgba(0,0,0,.55))" }} /> : <span style={{ ...rot, marginBottom: 100 }}>SEM FOTO</span>}
      </div>
      <span style={{ ...rot, color: cor }}>{p.casa.toUpperCase()}</span>
      <span style={{ fontFamily: "var(--marca)", fontSize: 40, fontWeight: 500, lineHeight: 1.02, letterSpacing: "-.02em" }}>{p.nome}</span>
      <span style={rot}>{[p.concentracao, p.ano, coordenadas(null, p.pais || paisDaCasa(p.casa))].filter(Boolean).join(" · ").toUpperCase()}</span>
    </Link>
  );
  const so = (l: string[], outro: string[]) => l.filter((n) => !outro.includes(n));
  const lista = (titulo: string, notas: string[], cor: string) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h3 style={tit}>{titulo}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {notas.length ? notas.slice(0, 14).map((n) => <span key={n} style={{ padding: "5px 10px", borderRadius: "var(--r-ctl)", border: `1px solid ${cor}`, fontSize: 13 }}>{n}</span>) : <span style={{ color: "var(--ink-3)", fontSize: 13 }}>—</span>}
      </div>
    </div>
  );
  const nomesAc = [...new Set([...a.acordes, ...b.acordes].sort((x, y) => y.valor - x.valor).map((x) => x.nome))].slice(0, 7);
  const valor = (p: Perfume, n: string) => p.acordes.find((x) => x.nome === n)?.valor ?? 0;
  return (
    <div className="pagina tela-tecnica" style={{ paddingTop: 32, gap: 28 }}>
      <h1 style={{ ...tit, fontSize: 12 }}>COMPARAÇÃO TÉCNICA</h1>
      <section style={{ display: "grid", gridTemplateColumns: "1fr 420px 1fr", gap: 32, alignItems: "end" }}>
        {lado(a, fotoA, ta.a, "left")}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <svg viewBox="0 0 100 100" style={{ width: 300, height: 300, overflow: "visible" }} aria-label="Os dois DNAs sobrepostos">
            {da && <><path d={da.aro} style={{ fill: "none", stroke: "var(--line-2)", strokeWidth: 0.4 }} /><path d={da.eixos} style={{ fill: "none", stroke: "var(--line)", strokeWidth: 0.4 }} /></>}
            {[25, 50, 75].map((r) => <circle key={r} cx={50} cy={50} r={(44 * r) / 100} style={{ fill: "none", stroke: "var(--line)", strokeWidth: 0.3, strokeDasharray: "1 1.5" }} />)}
            {da && <path d={da.forma} style={{ fill: ta.a, fillOpacity: 0.22, stroke: ta.a, strokeWidth: 0.9, strokeLinejoin: "round" }} />}
            {db && <path d={db.forma} style={{ fill: tb.a, fillOpacity: 0.18, stroke: tb.a, strokeWidth: 0.9, strokeLinejoin: "round", strokeDasharray: "2 1.2" }} />}
          </svg>
          <span style={{ fontFamily: "var(--marca)", fontSize: 64, fontWeight: 500, lineHeight: 1, color: "var(--ouro)" }}>{sim}%</span>
          <span style={rot}>SEMELHANÇA · {comuns.length} NOTA{comuns.length === 1 ? "" : "S"} EM COMUM</span>
        </div>
        {lado(b, fotoB, tb.a, "right")}
      </section>
      <section style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 24 }}>
        <article className="card" style={{ borderRadius: "var(--r-ed)", gap: 0 }}>
          <h2 style={{ ...tit, marginBottom: 10 }}>FICHA LADO A LADO</h2>
          {linhas.map(([l, x, y]) => (
            <div key={l} style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr", gap: 18, padding: "12px 0", borderTop: "1px solid var(--line)", fontSize: 14.5 }}>
              <span style={rot}>{l.toUpperCase()}</span><span>{x}</span><span>{y}</span>
            </div>
          ))}
        </article>
        <article className="card" style={{ borderRadius: "var(--r-ed)" }}>
          <h2 style={tit}>ACORDES</h2>
          {nomesAc.map((n) => (
            <div key={n} style={{ display: "grid", gridTemplateColumns: "1fr 110px 1fr", gap: 10, alignItems: "center", fontSize: 13 }}>
              <div style={{ height: 6, borderRadius: 3, background: "var(--chip)", display: "flex", justifyContent: "flex-end" }}><div style={{ width: `${valor(a, n)}%`, borderRadius: 3, background: ta.a }} /></div>
              <span style={{ textAlign: "center", color: "var(--ink-2)" }}>{n}</span>
              <div style={{ height: 6, borderRadius: 3, background: "var(--chip)" }}><div style={{ width: `${valor(b, n)}%`, height: 6, borderRadius: 3, background: tb.a }} /></div>
            </div>
          ))}
        </article>
      </section>
      <section className="card" style={{ borderRadius: "var(--r-ed)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28 }}>
        {lista(`SÓ NO ${a.nome.toUpperCase()}`, so(na, nb), ta.a)}
        {lista("EM COMUM", comuns, "var(--ouro)")}
        {lista(`SÓ NO ${b.nome.toUpperCase()}`, so(nb, na), tb.a)}
      </section>
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={tit}>TROCAR O SEGUNDO</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {opcoes.map((o) => <Link key={o.id} href={`/comparar?a=${a.id}&b=${o.id}`} style={{ padding: "8px 14px", borderRadius: "var(--r-ctl)", border: `1px solid ${o.id === b.id ? "var(--ouro)" : "var(--line-2)"}`, fontSize: 13.5, color: o.id === b.id ? "var(--ouro)" : "var(--ink-2)" }}>{o.nome} · {o.s}%</Link>)}
        </div>
      </section>
      <Link href={`/sommelier?perfume=${a.id}&q=${encodeURIComponent(`Entre o ${a.nome} e o ${b.nome}, qual vai melhor hoje?`)}`} className="btn" style={{ alignSelf: "flex-start", borderRadius: "var(--r-ctl)" }}>Perguntar ao sommelier qual usar hoje</Link>
    </div>
  );
}
