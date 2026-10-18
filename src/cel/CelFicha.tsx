import Link from "next/link";
import type React from "react";
import "./cel-ficha.css";
import { Icone } from "@/components/Icone";
import type { montarFicha } from "@/montar/ficha";
import { Barra, Btn, Camadas, Card, Demo, MONO, OURO, PalcoC, Rot, Topo } from "./kit";
import { OpcoesPerfume } from "./OpcoesPerfume";
import { LogoMarca } from "@/components/LogoMarca";
import { ClassificacaoGuia, DiaNoiteGuia, OcasioesGuia, PerformanceGuia, PiramideGuia } from "@/components/ficha/Guia";
import type { Perfume } from "@/lib/tipos";

type V = NonNullable<Awaited<ReturnType<typeof montarFicha>>>;
export type ExtraFicha = { p: Perfume; entradaId: string | null; numero?: number; situacao: string | null; foto: string | null; hoje: { cidade: string; temp: number; horas: string } | null };

const SIT: [string, string][] = [["tenho", "Tenho"], ["tive", "Tive"], ["quero", "Quero"], ["assinatura", "★ Assinatura"]];

export function CelFicha({ v, x }: { v: V; x: ExtraFicha }) {
  const p = x.p;
  const cab = v.cab;
  const n = v.eixos.length;
  return (
    <div className="c-tela">
      <Topo titulo={`Coleção / ${p.acorde}`} voltar direita={<OpcoesPerfume id={p.id} nome={p.nome} casa={p.casa} entradaId={x.entradaId} situacao={x.situacao} numero={x.numero} />} />

      {/* 01 · identidade */}
      <div className="cf-palco" style={{ ["--terr" as string]: v.terr.a } as React.CSSProperties}>
      <PalcoC nome={p.nome} casa={p.casa} acorde={p.acorde} forma={p.forma} tampa={p.tampa} foto={x.foto ?? p.imagem} oficial={!x.foto && Boolean(p.imagem)} altura={340} k={1.6} raio={32} transparente semBorda>
        {x.situacao === "assinatura" ? <span style={{ position: "absolute", right: 14, top: 14 }}><svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: OURO, stroke: OURO }}><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2 6.1 20.5l1.3-6.6L2.5 9.4l6.6-.8z" /></svg></span> : null}
        <span style={{ position: "absolute", left: 14, bottom: 12, fontFamily: MONO, fontSize: 9.5, letterSpacing: ".14em", color: !x.foto && p.imagem ? "rgba(0,0,0,.45)" : "var(--ink-3)", textShadow: x.foto ? "0 1px 3px rgba(0,0,0,.6)" : "none" }}>{x.foto ? "FOTO DO SEU FRASCO" : p.imagem ? "FOTO OFICIAL" : "FRASCO ILUSTRATIVO"}</span>
        {p.fonteFicha && <span style={{ position: "absolute", right: 14, bottom: 12, fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", color: !x.foto && p.imagem ? "rgba(0,0,0,.45)" : p.fonteFicha === "ia" ? OURO : "var(--ink-3)", textShadow: x.foto ? "0 1px 3px rgba(0,0,0,.6)" : "none" }}>{p.fonteFicha === "ia" ? "FICHA POR IA" : "FICHA DO ACERVO"}</span>}
      </PalcoC>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoMarca casa={p.casa} tam={26} />
          <Rot style={{ color: "var(--ink-2)" }}>{cab.casaCidade}</Rot>
        </div>
        <h1 className="cf-nome palavras">{p.nome.split(" ").map((w, k) => <span key={k} style={{ ["--i" as string]: k } as React.CSSProperties}>{w}&nbsp;</span>)}</h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: "var(--ink-2)" }}>{cab.desc}</p>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
        {v.topFam.map((f) => (
          <span key={f.nome} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 12, background: f.bg, fontSize: 13 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: f.cor }} />{f.nome}</span>
        ))}
        {cab.relacao ? <span style={{ padding: "4px 10px", borderRadius: 12, border: "1px solid var(--line-2)", fontSize: 13 }}>{cab.relacao}</span> : null}
      </div>
      <form action="/api/situacao" method="post" className="c-seg">
        <input type="hidden" name="perfume" value={p.id} />
        {SIT.map(([k, nome]) => (
          <button key={k} type="submit" name="situacao" value={k} className={x.situacao === k ? "on" : ""} style={{ fontSize: 12.5, whiteSpace: "nowrap", padding: "0 6px" }}>
            {x.situacao === k && k !== "assinatura" ? "✓ " : ""}{nome}
          </button>
        ))}
      </form>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Btn href={cab.voz} altura={44} style={{ flexGrow: 1, padding: "0 14px" }}><Icone nome="mic" tamanho={16} />Sommelier</Btn>
        <Btn sec href={cab.comparar} altura={44} style={{ padding: "0 12px" }}>Comparar</Btn>
        <Btn sec href={cab.blind} altura={44} style={{ padding: "0 12px" }}>Blind test</Btn>
      </div>

      {/* 02 · perfil e fatos */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, marginTop: 8 }}>
        <Rot>Perfil de acordes</Rot>
        <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{v.demo ? "Votos e semelhanças ilustrativos" : "Votos da comunidade"}</span>
      </div>
      <div style={{ position: "relative", width: 330, height: 330, alignSelf: "center", flexShrink: 0 }}>
        <div style={{ position: "absolute", left: 50, top: 50 }}><Camadas camadas={v.glifo} tam={230} /></div>
        {v.semAcordes && <a href={`/editar/${encodeURIComponent(v.cab.id)}`} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 2, padding: "10px 14px", borderRadius: "var(--r-ctl)", background: "var(--bg)", border: "1px solid var(--line-2)", color: "var(--ink)", fontSize: 13, textDecoration: "none", textAlign: "center", lineHeight: 1.4 }}>Sem acordes nesta ficha<br /><span style={{ color: "var(--ouro, #7FE3C4)" }}>Marcar em Editar →</span></a>}
        {v.eixos.map((e, i) => {
          const a = (i * 2 * Math.PI) / n - Math.PI / 2;
          return (
            <div key={i} style={{ position: "absolute", left: 165 + Math.cos(a) * 146, top: 165 + Math.sin(a) * 140, transform: "translate(-50%, -50%)", textAlign: "center", fontFamily: MONO, fontSize: 9.5, letterSpacing: ".08em", color: "var(--ink-3)", lineHeight: 1.3, whiteSpace: "nowrap" }}>
              {e.nome}<br /><span style={{ color: i === 0 ? OURO : "var(--ink-2)", fontSize: 10.5 }}>{e.v}</span>
            </div>
          );
        })}
      </div>
      <div className="c-grade2" style={{ gap: 10 }}>
        {v.fatos.map((f) => (
          <div key={f.l} style={{ borderRadius: 18, border: "1px solid var(--line)", background: "var(--surface)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".12em", color: "var(--ink-3)" }}>{f.l}</span>
            <span style={{ fontSize: 16, lineHeight: 1.2 }}>{f.v}</span>
            <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{f.c}</span>
          </div>
        ))}
      </div>

      {/* 03 · formato guia: pirâmide, performance, dia ou noite, classificação e ocasiões */}
      <Card pad={16}><PiramideGuia niveis={v.guia.piramide} tam={44} /></Card>
      <Card pad={16} gap={18}>
        <PerformanceGuia g={v.guia} />
        <DiaNoiteGuia g={v.guia} />
      </Card>
      <Card pad={16}><ClassificacaoGuia g={v.guia} /></Card>
      {v.guia.marcadas.length > 0 && <Card pad={16}><OcasioesGuia g={v.guia} /></Card>}

      {/* 06 · votos */}
      <Card pad={16} gap={12}>
        <Rot>Votos</Rot>
        {v.votos.map((g) => (
          <div key={g.nome} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 15, marginBottom: 2 }}>{g.nome}</span>
            {g.itens.map((it) => (
              <div key={it.nome} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                <span style={{ width: 86, color: it.txt }}>{it.nome}</span>
                <Barra v={it.pct} cor={it.cor} altura={4} />
                <span style={{ width: 22, textAlign: "right", fontFamily: MONO, fontSize: 10.5, color: "var(--ink-3)" }}>{it.pct}</span>
              </div>
            ))}
          </div>
        ))}
      </Card>

      {/* 08 · sommelier */}
      <Card pad={16} gap={12}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><Rot>Sommelier</Rot><span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>pergunte sobre o {p.nome}</span></div>
        {v.conv ? (
          <>
            <div style={{ alignSelf: "flex-end", maxWidth: "88%", padding: "10px 14px", borderRadius: "18px 18px 4px 18px", background: "var(--chip-2)", fontSize: 13.5, lineHeight: 1.45 }}>{v.conv.p}</div>
            <div style={{ maxWidth: "92%", padding: "12px 14px", borderRadius: "18px 18px 18px 4px", background: "var(--bg)", border: "1px solid var(--line)", fontSize: 13.5, lineHeight: 1.5 }}>{v.conv.r}</div>
          </>
        ) : null}
        <div className="c-rolar" style={{ gap: 6 }}>
          {v.perguntas.map((q) => <Link key={q.t} href={q.href} className="c-pill" style={{ height: 34, borderRadius: "var(--r-ctl)", fontSize: 12.5, border: "1px solid var(--line-2)", background: "transparent" }}>{q.t}</Link>)}
        </div>
        <form action="/sommelier" method="get" className="c-campo" style={{ height: 48 }}>
          <input type="hidden" name="perfume" value={p.id} />
          <input name="q" placeholder="Escreva ou toque no microfone" aria-label="Pergunta para o sommelier" />
          <Link href={cab.voz} className="c-circ" style={{ width: 36, height: 36, background: "var(--btn)", color: "var(--on-btn)" }} aria-label="Falar"><Icone nome="mic" tamanho={16} /></Link>
        </form>
      </Card>
      {v.demo && <Demo />}
    </div>
  );
}
