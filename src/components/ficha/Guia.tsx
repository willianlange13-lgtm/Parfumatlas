"use client";
/** Blocos da ficha no formato guia: pirâmide em trapézio, performance, dia ou noite, classificação em abas e ocasiões. Identidade do Atlas (cantos retos, acento verde). */
import { useState, type ReactNode } from "react";
import { NotaChip, OURO, MONO } from "@/cel/kit";

export type EixoGuia = { nome: string; v: number; cor?: string };
export type DadosGuia = {
  piramide: { nome: string; notas: string[] }[];
  fixacao: string;
  projecao: number;
  periodo: "Diurno" | "Noturno" | "Dia e noite";
  diaNoite: { pos: number; legenda: string };
  classif: {
    tipo: EixoGuia[]; ocasiao: EixoGuia[]; estacao: EixoGuia[]; publico: string | null;
    ficha?: { familia?: string | null; acorde?: string | null; subfamilias?: string[]; concentracao?: string | null; genero?: string | null; origem?: string | null; casa?: string | null; ano?: number | null; perfumista?: string | null };
  };
  marcadas: string[];
  fonte: string;
};

const tr = (c: string, a: number) => `color-mix(in oklab, ${c} ${Math.round(a * 100)}%, transparent)`;

function Titulo({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center" }}>
      <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".18em", color: "var(--ink-3)", textTransform: "uppercase" }}>{children}</span>
      {sub ? <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{sub}</span> : null}
    </div>
  );
}

const ROTULO_NIVEL: Record<string, string> = { Topo: "Notas de topo", Coração: "Notas de coração", Base: "Notas de base" };

function Nota({ nome, tam }: { nome: string; tam: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: tam + 18, textAlign: "center" }}>
      <span style={{ display: "flex", borderRadius: "50%", boxShadow: `0 0 0 1.5px var(--line-2), 0 4px 12px rgba(0,0,0,.35)` }}><NotaChip nome={nome} tam={tam} rotulo={false} /></span>
      <span style={{ fontSize: 10.5, lineHeight: 1.2, color: "var(--ink)" }}>{nome}</span>
    </div>
  );
}

/** Pirâmide olfativa em trapézio, com a alternativa "vista de cima" (anéis concêntricos). */
export function PiramideGuia({ niveis, tam = 46 }: { niveis: DadosGuia["piramide"]; tam?: number }) {
  const [modo, setModo] = useState<"piramide" | "cima">("piramide");
  const com = niveis.filter((n) => n.notas.length);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", width: "100%" }}>
      <Titulo>Pirâmide olfativa</Titulo>
      <div style={{ display: "flex", gap: 8 }}>
        {([["piramide", "Pirâmide"], ["cima", "Vista de cima"]] as const).map(([k, nome]) => (
          <button key={k} type="button" aria-pressed={modo === k} onClick={() => setModo(k)} style={{ height: 30, padding: "0 14px", borderRadius: "var(--r-ctl)", fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer", background: "transparent", color: modo === k ? OURO : "var(--ink-2)", border: `1px solid ${modo === k ? OURO : "var(--line-2)"}` }}>
            {nome}
          </button>
        ))}
      </div>
      {com.length === 0 ? (
        <span style={{ fontSize: 13, color: "var(--ink-3)" }}>As notas ainda não foram encontradas.</span>
      ) : modo === "piramide" ? (
        <div style={{ position: "relative", width: "100%", maxWidth: 520, padding: "22px 0 18px" }}>
          <div aria-hidden style={{ position: "absolute", inset: 0, clipPath: "polygon(24% 0, 76% 0, 100% 100%, 0 100%)", background: `linear-gradient(180deg, ${tr(OURO, 0.4)} 0%, ${tr(OURO, 0.14)} 55%, ${tr(OURO, 0.05)} 100%)` }} />
          <span aria-hidden style={{ position: "absolute", left: "50%", top: 6, transform: "translateX(-50%)", color: OURO, fontSize: 12 }}>✦</span>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 14 }}>
            {niveis.map((nv, i) => nv.notas.length ? (
              <div key={nv.nome} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, margin: "0 auto", width: `${[50, 74, 96][i] ?? 96}%` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                  <span style={{ flex: 1, height: 1, background: "var(--line-2)" }} />
                  <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".16em", color: "var(--ink-2)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{ROTULO_NIVEL[nv.nome] ?? nv.nome}</span>
                  <span style={{ flex: 1, height: 1, background: "var(--line-2)" }} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 4px" }}>
                  {nv.notas.map((nt) => <Nota key={nt} nome={nt} tam={tam} />)}
                </div>
              </div>
            ) : null)}
          </div>
        </div>
      ) : (
        <VistaDeCima niveis={niveis} />
      )}
    </div>
  );
}

function VistaDeCima({ niveis }: { niveis: DadosGuia["piramide"] }) {
  const L = 300, c = L / 2;
  const aneis = [{ r: 0, max: 1, tam: 40 }, { r: 40, max: 4, tam: 30 }, { r: 82, max: 6, tam: 34 }, { r: 124, max: 8, tam: 36 }];
  const [topo, coracao, base] = [niveis[0]?.notas ?? [], niveis[1]?.notas ?? [], niveis[2]?.notas ?? []];
  const pos: { nome: string; x: number; y: number; tam: number }[] = [];
  const espalhar = (lista: string[], r: number, tam: number, giro = 0) => lista.forEach((nome, i) => {
    const a = -Math.PI / 2 + giro + (i * 2 * Math.PI) / lista.length;
    pos.push({ nome, x: c + Math.cos(a) * r, y: c + Math.sin(a) * r, tam });
  });
  if (topo.length === 1) espalhar(topo, 0, aneis[0].tam); else espalhar(topo.slice(0, aneis[1].max), aneis[1].r, aneis[1].tam);
  espalhar(coracao.slice(0, aneis[2].max), aneis[2].r, aneis[2].tam, 0.3);
  espalhar(base.slice(0, aneis[3].max), aneis[3].r, aneis[3].tam, 0.15);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" }}>
      <div style={{ position: "relative", width: L, height: L, maxWidth: "100%" }}>
        {[aneis[3].r + 26, aneis[2].r + 22, aneis[1].r + 20].map((r, i) => (
          <span key={r} aria-hidden style={{ position: "absolute", left: c - r, top: c - r, width: 2 * r, height: 2 * r, borderRadius: "50%", border: "1px solid var(--line-2)", background: tr(OURO, [0.05, 0.1, 0.18][i]) }} />
        ))}
        {pos.map((p) => (
          <span key={p.nome} title={p.nome} style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%, -50%)", display: "flex", borderRadius: "50%", boxShadow: `0 0 0 1.5px var(--line-2)` }}>
            <NotaChip nome={p.nome} tam={p.tam} rotulo={false} />
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", color: "var(--ink-3)", textTransform: "uppercase", flexWrap: "wrap", justifyContent: "center" }}>
        <span>Centro · topo</span><span>Meio · coração</span><span>Fora · base</span>
      </div>
    </div>
  );
}

const Sol = ({ tam = 18 }: { tam?: number }) => <svg viewBox="0 0 24 24" aria-hidden style={{ width: tam, height: tam, fill: "none", stroke: OURO, strokeWidth: 1.5, strokeLinecap: "round" }}><path d="M12 8a4 4 0 1 0 .01 0 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4" /></svg>;
const Lua = ({ tam = 18 }: { tam?: number }) => <svg viewBox="0 0 24 24" aria-hidden style={{ width: tam, height: tam, fill: "none", stroke: OURO, strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" }}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>;

function Quadro({ valor, rotulo }: { valor: ReactNode; rotulo: string }) {
  return (
    <div style={{ borderRadius: "var(--r-ctl)", border: "1px solid var(--line)", background: "var(--chip)", padding: "14px 6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, minWidth: 0, minHeight: 74 }}>
      <div style={{ color: OURO, fontSize: 22, lineHeight: 1, display: "flex", alignItems: "center", minHeight: 24, fontWeight: 500 }}>{valor}</div>
      <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".14em", color: "var(--ink-3)", textTransform: "uppercase" }}>{rotulo}</span>
    </div>
  );
}

/** Três quadros: fixação, projeção em pontos e período. */
export function PerformanceGuia({ g }: { g: DadosGuia }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <Titulo sub={g.fonte}>Performance</Titulo>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        <Quadro valor={g.fixacao} rotulo="Fixação" />
        <Quadro rotulo="Projeção" valor={
          <span aria-label={`${g.projecao} de 5`} style={{ display: "flex", gap: 3 }}>
            {[1, 2, 3, 4, 5].map((i) => <span key={i} style={{ width: 7, height: 7, borderRadius: 4, background: i <= g.projecao ? OURO : "var(--chip-2)" }} />)}
          </span>
        } />
        <Quadro rotulo={g.periodo} valor={g.periodo === "Diurno" ? <Sol tam={22} /> : g.periodo === "Noturno" ? <Lua tam={22} /> : <span style={{ display: "flex", gap: 2 }}><Sol /><Lua /></span>} />
      </div>
    </div>
  );
}

/** Barra do dia à noite com o marcador na posição dos votos. */
export function DiaNoiteGuia({ g }: { g: DadosGuia }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
      <Titulo>Dia ou noite</Titulo>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Sol />
        <div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={g.diaNoite.pos} aria-label={g.diaNoite.legenda} style={{ position: "relative", flex: 1, height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${tr(OURO, 0.22)} 0%, var(--chip-2) 50%, var(--surface-2) 100%)`, border: "1px solid var(--line)" }}>
          <span style={{ position: "absolute", top: "50%", left: `${g.diaNoite.pos}%`, width: 18, height: 18, borderRadius: 9, transform: "translate(-50%, -50%)", background: OURO, boxShadow: "0 2px 8px rgba(0,0,0,.4)" }} />
        </div>
        <Lua />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 9, letterSpacing: ".14em", color: "var(--ink-3)", textTransform: "uppercase" }}>
        <span>Dia</span><span>{g.diaNoite.legenda}</span><span>Noite</span>
      </div>
    </div>
  );
}

function Radar({ eixos }: { eixos: EixoGuia[] }) {
  const W = 320, H = 270, cx = W / 2, cy = H / 2 + 4, R = 88, n = eixos.length;
  const pt = (i: number, f: number) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f]; };
  const poli = (f: (i: number) => number) => eixos.map((_, i) => pt(i, f(i)).map((x) => x.toFixed(1)).join(",")).join(" ");
  const mx = Math.max(...eixos.map((e) => e.v));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label={eixos.map((e) => `${e.nome} ${e.v}`).join(", ")}>
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={poli(() => f)} style={{ fill: "none", stroke: "var(--line-2)", strokeWidth: 1 }} />)}
      {eixos.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} style={{ stroke: "var(--line)", strokeWidth: 1 }} />; })}
      <polygon points={poli((i) => Math.max(0.04, eixos[i].v / 100))} style={{ fill: tr(OURO, 0.26), stroke: OURO, strokeWidth: 2, strokeLinejoin: "round" }} />
      {eixos.map((e, i) => { const [x, y] = pt(i, Math.max(0.04, e.v / 100)); return <circle key={i} cx={x} cy={y} r={4} style={{ fill: e.cor ?? OURO, stroke: "var(--surface)", strokeWidth: 1.5 }} />; })}
      {eixos.map((e, i) => {
        const [x, y] = pt(i, 1.24);
        const anc = Math.abs(x - cx) < 8 ? "middle" : x > cx ? "start" : "end";
        return <text key={e.nome} x={x} y={y + 4} textAnchor={anc} style={{ fontSize: 11.5, fill: e.v === mx ? "var(--ink)" : "var(--ink-2)", fontWeight: e.v === mx ? 600 : 400, fontFamily: "var(--sans)" }}>{e.nome}</text>;
      })}
    </svg>
  );
}

type Aba = "tipo" | "ocasiao" | "estacao" | "publico";

/** Classificação com abas: tipo (acordes), ocasião, estação e público. */
export function ClassificacaoGuia({ g }: { g: DadosGuia }) {
  const [aba, setAba] = useState<Aba>("tipo");
  const c = g.classif;
  const lista = aba === "tipo" ? c.tipo : aba === "ocasiao" ? c.ocasiao : aba === "estacao" ? c.estacao : [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <Titulo>Classificação</Titulo>
      {c.ficha && (() => {
        const f = c.ficha;
        const linhas: [string, string][] = [];
        if (f.concentracao) linhas.push(["Concentração", f.concentracao]);
        if (f.genero) linhas.push(["Gênero", f.genero]);
        if (f.origem) linhas.push(["Origem", f.origem]);
        else if (f.casa) linhas.push(["Casa", f.casa]);
        if (f.ano) linhas.push(["Lançamento", String(f.ano)]);
        if (f.perfumista) linhas.push(["Perfumista", f.perfumista]);
        if (!f.familia && linhas.length === 0) return null;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {f.familia ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", color: "var(--ink-3)", textTransform: "uppercase" }}>Família olfativa</span>
                  <span style={{ fontSize: 16, color: "var(--ink)" }}>{f.familia}</span>
                </div>
                {(f.acorde || (f.subfamilias && f.subfamilias.length > 0)) ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {f.acorde ? <span style={{ padding: "4px 12px", borderRadius: "var(--r-ctl)", fontSize: 12.5, border: `1px solid ${OURO}`, background: tr(OURO, 0.16), color: "var(--ink)" }}>{f.acorde}</span> : null}
                    {(f.subfamilias ?? []).map((s) => <span key={s} style={{ padding: "4px 12px", borderRadius: "var(--r-ctl)", fontSize: 12.5, border: "1px solid var(--line-2)", color: "var(--ink-2)" }}>{s}</span>)}
                  </div>
                ) : null}
              </div>
            ) : null}
            {linhas.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
                {linhas.map(([l, v]) => (
                  <div key={l} style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                    <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".12em", color: "var(--ink-3)", textTransform: "uppercase" }}>{l}</span>
                    <span style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.3, overflowWrap: "anywhere" }}>{v}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div style={{ height: 1, background: "var(--line)" }} />
          </div>
        );
      })()}
      <div role="tablist" aria-label="Classificação" className="c-seg" style={{ width: "100%" }}>
        {([["tipo", "Tipo"], ["ocasiao", "Ocasião"], ["estacao", "Estação"], ["publico", "Público"]] as [Aba, string][]).map(([k, nome]) => (
          <button key={k} type="button" role="tab" aria-selected={aba === k} className={aba === k ? "on" : ""} onClick={() => setAba(k)} style={aba === k ? { background: OURO, color: "var(--on-acento, var(--on-btn))", fontSize: 13 } : { fontSize: 13 }}>
            {nome}
          </button>
        ))}
      </div>
      <span style={{ alignSelf: "flex-end", fontSize: 11.5, color: "var(--ink-3)" }}>✦ {g.fonte}</span>
      {aba === "publico" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "18px 0 24px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {["Masculino", "Unissex", "Feminino"].map((x) => {
              const on = (c.publico ?? "").toLowerCase().startsWith(x.toLowerCase().slice(0, 4));
              return <span key={x} style={{ padding: "8px 16px", borderRadius: "var(--r-ctl)", fontSize: 13.5, border: `1px solid ${on ? OURO : "var(--line-2)"}`, background: on ? tr(OURO, 0.16) : "transparent", color: on ? "var(--ink)" : "var(--ink-3)" }}>{on ? "● " : ""}{x}</span>;
            })}
          </div>
          <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{c.publico ? "classificação da casa" : "a casa ainda não informou"}</span>
        </div>
      ) : lista.length >= 3 ? (
        <Radar eixos={lista} />
      ) : (
        <span style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "center", padding: "24px 0" }}>Ainda não há votos suficientes.</span>
      )}
    </div>
  );
}

/** Etiquetas com as ocasiões mais votadas. */
export function OcasioesGuia({ g }: { g: DadosGuia }) {
  if (!g.marcadas.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <Titulo>Ocasiões marcadas</Titulo>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {g.marcadas.map((o) => (
          <span key={o} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: "var(--r-ctl)", border: `1px solid ${OURO}`, fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink)" }}>
            <span style={{ width: 5, height: 5, borderRadius: 3, background: OURO }} />{o}
          </span>
        ))}
      </div>
    </div>
  );
}
