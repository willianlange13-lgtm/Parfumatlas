import Link from "next/link";
import { connection } from "next/server";
import { carregarAcervo } from "@/lib/dados";
import { glifo, EC } from "@/desenho/h2";
import { hm, naColecao, similaridade, vetor } from "@/lib/analise";
import { Btn, Camadas, Card, MONO, OURO, PalcoC, Rot, Topo } from "@/cel/kit";
import type { Perfume } from "@/lib/tipos";

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
  return (
    <div className="c-tela sem-barra tela-tecnica" style={{ maxWidth: 620, margin: "0 auto" }}>
      <Topo titulo="Comparar" voltar />
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
          <Link key={o.p.id} href={`/comparar?a=${a.id}&b=${o.p.id}`} className={`c-pill ${o.p.id === b.id ? "on" : ""}`} style={{ height: 34, borderRadius: 17, fontSize: 12.5 }}>{o.p.nome} · {o.s}%</Link>
        ))}
      </div>
      <Btn href={`/sommelier?perfume=${a.id}&q=${encodeURIComponent(`Entre o ${a.nome} e o ${b.nome}, qual vai melhor hoje?`)}`}>Perguntar ao sommelier qual usar hoje</Btn>
    </div>
  );
}
