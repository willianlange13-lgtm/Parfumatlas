import Link from "next/link";
import { connection } from "next/server";
import { carregarAcervo } from "@/lib/dados";
import { naColecao } from "@/lib/analise";
import { CURIOSIDADES, ENCICLOPEDIA, nota as refNota } from "@/data/referencia";
import { Card, NotaChip, Rot, Topo } from "@/cel/kit";

export const metadata = { title: "Curiosidade" };

export default async function Curiosidade({ searchParams }: PageProps<"/curiosidade">) {
  await connection();
  const sp = await searchParams;
  const nome = typeof sp.nota === "string" ? sp.nota : CURIOSIDADES[0].nota;
  const c = CURIOSIDADES.find((x) => x.nota === nome) ?? { nota: nome, titulo: nome, texto: "" };
  const enc = ENCICLOPEDIA[nome];
  const acervo = await carregarAcervo();
  const meus = naColecao(acervo.colecao);
  const tem = meus.filter((e) => [...e.perfume.notas.saida, ...e.perfume.notas.coracao, ...e.perfume.notas.fundo].includes(nome)).map((e) => e.perfume.nome);
  const todasNotas = new Set(meus.flatMap((e) => [...e.perfume.notas.saida, ...e.perfume.notas.coracao, ...e.perfume.notas.fundo]));
  const outras = Object.keys(ENCICLOPEDIA).filter((n) => n !== nome);
  const linhas: [string, string][] = enc
    ? [["Origem", enc.origem], ["Como se obtém", enc.como], ["Na coleção", tem.join(" · ") || "Nenhum frasco seu tem essa nota"], ["Para conhecer", enc.conhecer.join(" · ")]]
    : [["Na coleção", tem.join(" · ") || "Nenhum frasco seu tem essa nota"]];
  return (
    <div className="c-tela sem-barra" style={{ maxWidth: 560, margin: "0 auto" }}>
      <Topo titulo="Curiosidade" voltar />
      <Card fundo="vinho">
        <Rot>Curiosidade do dia</Rot>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <NotaChip nome={nome} tam={46} rotulo={false} />
          <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.25 }}>{c.titulo}</div>
        </div>
        {c.texto ? <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)" }}>{c.texto}</div> : null}
      </Card>
      <Card>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <Rot>Enciclopédia de notas</Rot>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{todasNotas.size} notas na sua coleção</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <NotaChip nome={nome} tam={86} rotulo={false} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 26, fontWeight: 500, lineHeight: 1 }}>{nome}</span>
            <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{enc?.tipo ?? (refNota(nome).foto ? "Nota olfativa" : "Nota olfativa")}</span>
          </div>
        </div>
        <div>
          {linhas.map(([l, v]) => (
            <div key={l} style={{ padding: "10px 0", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".08em", color: "var(--ink-3)", textTransform: "uppercase" }}>{l}</span>
              <span style={{ fontSize: 14, lineHeight: 1.45 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {outras.map((n) => (
            <Link key={n} href={`/curiosidade?nota=${encodeURIComponent(n)}`}><NotaChip nome={n} tam={26} fs={13} /></Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
