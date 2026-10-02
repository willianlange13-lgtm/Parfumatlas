/** Peças do app (celular), fiéis às pranchas App*. */
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Icone } from "@/components/Icone";
import { Frasco, type Forma } from "@/components/Frasco";
import { nota as refNota } from "@/data/referencia";
import { corDoAcorde, hexA } from "@/lib/cores";
import { VoltarHist } from "./VoltarHist";

export const OURO = "#D8B970";
export const MONO = "var(--mono)";

export function Rot({ children, cor, style }: { children: ReactNode; cor?: string; style?: CSSProperties }) {
  return <div className="c-rot" style={{ color: cor, ...style }}>{children}</div>;
}

export function Card({ children, fundo, pad = 18, gap = 14, style, className = "" }: { children: ReactNode; fundo?: "destaque" | "vinho" | "sup"; pad?: number | string; gap?: number; style?: CSSProperties; className?: string }) {
  return (
    <section className={`c-card ${fundo ?? ""} ${className}`} style={{ padding: pad, gap, ...style }}>
      {children}
    </section>
  );
}

export function Secao({ titulo, dir, children }: { titulo: string; dir?: ReactNode; children?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: 10 }}>
      <Rot>{titulo}</Rot>
      <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{dir}</span>
      {children}
    </div>
  );
}

/** Cabeçalho de bloco com rótulo e subtítulo à direita. */
export function Bloco({ titulo, sub, children, fundo, gap = 12, pad = 16 }: { titulo: string; sub?: ReactNode; children: ReactNode; fundo?: "destaque" | "vinho"; gap?: number; pad?: number }) {
  return (
    <Card fundo={fundo} pad={pad} gap={gap}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <Rot>{titulo}</Rot>
        {sub ? <span style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "right" }}>{sub}</span> : null}
      </div>
      {children}
    </Card>
  );
}

type BtnProps = { children: ReactNode; href?: string; sec?: boolean; altura?: number; style?: CSSProperties; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; form?: string };
export function Btn({ children, href, sec, altura = 46, style, onClick, type = "button", disabled }: BtnProps) {
  const st: CSSProperties = { height: altura, borderRadius: altura / 2, ...style };
  const cl = `c-btn ${sec ? "sec" : ""}`;
  if (href) return <Link href={href} className={cl} style={st}>{children}</Link>;
  return <button type={type} className={cl} style={st} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function Circ({ icone, href, tamanho = 40, rotulo, onClick, badge, children, style }: { icone?: string; href?: string; tamanho?: number; rotulo: string; onClick?: () => void; badge?: boolean; children?: ReactNode; style?: CSSProperties }) {
  const st: CSSProperties = { width: tamanho, height: tamanho, ...style };
  const dentro = (
    <>
      {icone ? <Icone nome={icone} tamanho={tamanho >= 40 ? 20 : 18} /> : null}
      {children}
      {badge ? <span style={{ position: "absolute", right: 7, top: 7, width: 8, height: 8, borderRadius: 4, background: OURO, boxShadow: "0 0 0 2px var(--bg)" }} /> : null}
    </>
  );
  if (href) return <Link href={href} className="c-circ" style={st} aria-label={rotulo}>{dentro}</Link>;
  return <button type="button" className="c-circ" style={st} aria-label={rotulo} onClick={onClick}>{dentro}</button>;
}

/** Topo das telas internas: voltar, título central e ação à direita. */
export function Topo({ titulo, voltar, direita, grande }: { titulo: string; voltar?: string | true; direita?: ReactNode; grande?: boolean }) {
  return (
    <div className={`c-topo ${grande ? "grande" : ""}`}>
      {voltar ? (
        typeof voltar === "string" ? <Circ icone="voltar" href={voltar} tamanho={36} rotulo="Voltar" /> : <VoltarHist />
      ) : (
        <span style={{ width: 36 }} />
      )}
      <span className="c-topo-tit">{titulo}</span>
      {direita ?? <span style={{ width: 36 }} />}
    </div>
  );
}


/** Título grande das abas (Coleção, Buscar, Novidades). */
export function TituloAba({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, height: 56, flexShrink: 0 }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 500, letterSpacing: "-.02em" }}>{titulo}</h1>
      <span style={{ flexGrow: 1 }} />
      {children}
    </div>
  );
}

export function Pill({ children, on, altura = 34, fs = 13.5, href, onClick, style }: { children: ReactNode; on?: boolean; altura?: number; fs?: number; href?: string; onClick?: () => void; style?: CSSProperties }) {
  const st: CSSProperties = { height: altura, borderRadius: altura / 2, fontSize: fs, ...style };
  const cl = `c-pill ${on ? "on" : ""}`;
  if (href) return <Link href={href} className={cl} style={st}>{children}</Link>;
  if (onClick) return <button type="button" className={cl} style={st} onClick={onClick}>{children}</button>;
  return <span className={cl} style={st}>{children}</span>;
}

export function Qtd({ n }: { n: number | string }) {
  return <span style={{ fontFamily: MONO, fontSize: 11, opacity: 0.7 }}>{n}</span>;
}

/** Bolinha da nota (foto real ou ícone) com ou sem nome. */
export function NotaChip({ nome, tam = 28, rotulo = true, fs = 13 }: { nome: string; tam?: number; rotulo?: boolean; fs?: number }) {
  const r = refNota(nome);
  const bola = r.foto ? (
    <span style={{ width: tam, height: tam, borderRadius: "50%", overflow: "hidden", background: "#FFFFFF", flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={r.foto} alt={nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </span>
  ) : (
    <span style={{ width: tam, height: tam, borderRadius: "50%", background: "var(--chip-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg viewBox="0 0 24 24" style={{ width: tam * 0.55, height: tam * 0.55, fill: "none", stroke: "var(--prata)", strokeWidth: 1.6 }}><path d={r.icone} /></svg>
    </span>
  );
  if (!rotulo) return bola;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "3px 11px 3px 3px", borderRadius: 20, background: "var(--chip)", fontSize: fs, whiteSpace: "nowrap" }}>
      {bola}
      {nome}
    </span>
  );
}

/** Palco com frasco desenhado ou foto. */
export function PalcoC({ nome, casa, acorde, forma = "ret", tampa = "#141417", altura, k, raio = 20, foto, oficial, children, semBorda, transparente }: { nome: string; casa: string; acorde?: string | null; forma?: Forma | string; tampa?: string; altura: number; k?: number; raio?: number; foto?: string | null; oficial?: boolean; children?: ReactNode; semBorda?: boolean; transparente?: boolean }) {
  const cor = corDoAcorde(acorde);
  const esc = k ?? Math.round((altura / 150) * 100) / 100;
  return (
    <div style={{ position: "relative", height: altura, borderRadius: raio, overflow: "hidden", border: semBorda ? "none" : "1px solid var(--line)", background: `radial-gradient(ellipse at 50% 85%, ${hexA(cor, 0.22)} 0%, ${hexA(cor, 0.06)} 55%, ${transparente ? "rgba(0,0,0,0)" : "var(--surface)"} 100%)`, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: Math.round(22 * esc), flexShrink: 0 }}>
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt={nome} style={oficial ? { position: "absolute", inset: 10, width: "calc(100% - 20px)", height: "calc(100% - 20px)", objectFit: "contain", background: "#FFFFFF", borderRadius: Math.max(8, raio - 8) } : { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <Frasco nome={nome} casa={casa} acorde={acorde} forma={(forma as Forma) ?? "ret"} tampa={tampa} escala={esc} />
      )}
      {children}
      {!foto && <div style={{ position: "absolute", left: "50%", bottom: Math.round(12 * esc), width: Math.round(110 * esc), height: 10, marginLeft: -Math.round(55 * esc), borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,0,0,.5), rgba(0,0,0,0) 70%)" }} />}
    </div>
  );
}

/** Frasco pequeno em quadrado (listas). */
export function Mini(p: { nome: string; casa: string; acorde?: string | null; forma?: string; tampa?: string; foto?: string | null; oficial?: boolean; w?: number; h?: number; raio?: number }) {
  const w = p.w ?? 52, h = p.h ?? 58;
  return (
    <div style={{ width: w, flexShrink: 0 }}>
      <PalcoC {...p} altura={h} k={Math.round((h / 150) * 100) / 100} raio={p.raio ?? 12} />
    </div>
  );
}

export function Linha({ esq, children, dir, borda = true, href, style }: { esq?: ReactNode; children: ReactNode; dir?: ReactNode; borda?: boolean; href?: string; style?: CSSProperties }) {
  const st: CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: borda ? "1px solid var(--line)" : "none", color: "inherit", ...style };
  const corpo = (
    <>
      {esq}
      <div style={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>{children}</div>
      {dir}
    </>
  );
  return href ? <Link href={href} style={st}>{corpo}</Link> : <div style={st}>{corpo}</div>;
}

export function NomeSub({ nome, sub, fs = 15 }: { nome: string; sub: string; fs?: number }) {
  return (
    <>
      <span style={{ fontSize: fs, fontWeight: 500, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis" }}>{nome}</span>
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".08em", color: "var(--ink-3)", textTransform: "uppercase" }}>{sub}</span>
    </>
  );
}

const arcP = (c: number, r: number, a0: number, a1: number) => {
  const x0 = c + Math.cos(a0) * r, y0 = c + Math.sin(a0) * r, x1 = c + Math.cos(a1) * r, y1 = c + Math.sin(a1) * r;
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};

/** Anel de progresso com número no meio. */
export function Anel({ valor, txt, sub, tam = 64, sw = 6, cor = "var(--prata)" }: { valor: number; txt: string; sub?: string; tam?: number; sw?: number; cor?: string }) {
  const r = tam / 2 - sw, c = tam / 2;
  return (
    <div style={{ position: "relative", width: tam, height: tam, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${tam} ${tam}`} style={{ position: "absolute", inset: 0, width: tam, height: tam }}>
        <circle cx={c} cy={c} r={r} style={{ fill: "none", stroke: "var(--chip-2)", strokeWidth: sw }} />
        <path d={arcP(c, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * Math.max(0.01, Math.min(valor, 0.999)))} style={{ fill: "none", stroke: cor, strokeWidth: sw, strokeLinecap: "round" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
        <span style={{ fontSize: Math.round(tam * 0.3), fontWeight: 500 }}>{txt}</span>
        {sub ? <span style={{ fontSize: 9.5, color: "var(--ink-3)", marginTop: 2 }}>{sub}</span> : null}
      </div>
    </div>
  );
}

/** Desenho em camadas (glifo/radar) já calculado no servidor. */
export function Camadas({ camadas, tam, vb = "-12 -12 344 344", op = 1 }: { camadas: { d: string; st: string }[]; tam: number; vb?: string; op?: number }) {
  return (
    <svg viewBox={vb} style={{ width: tam, height: tam, overflow: "visible", opacity: op, display: "block" }}>
      {camadas.map((L, i) => (
        <path key={i} d={L.d} style={cssDe(L.st)} />
      ))}
    </svg>
  );
}

export function cssDe(s: string): CSSProperties {
  const o: Record<string, string> = {};
  s.split(";").forEach((par) => {
    const i = par.indexOf(":");
    if (i < 0) return;
    const k = par.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    o[k] = par.slice(i + 1).trim();
  });
  return o as CSSProperties;
}

export function Demo({ children = "DADOS ILUSTRATIVOS" }: { children?: ReactNode }) {
  return <span className="tracejado" style={{ alignSelf: "flex-start", fontSize: 9.5, padding: "5px 10px" }}>{children}</span>;
}

/** Barra horizontal (ocasiões, votos). */
export function Barra({ v, cor = "var(--prata)", altura = 6 }: { v: number; cor?: string; altura?: number }) {
  return (
    <span style={{ flexGrow: 1, height: altura, borderRadius: altura / 2, background: "var(--chip)", overflow: "hidden", display: "flex" }}>
      <span style={{ width: `${Math.max(2, Math.min(100, v))}%`, background: cor, borderRadius: altura / 2 }} />
    </span>
  );
}

export function Rolar({ children, gap = 8 }: { children: ReactNode; gap?: number }) {
  return <div className="c-rolar" style={{ gap }}>{children}</div>;
}

/** Frasco desenhado a partir das medidas que o servidor já calculou. */
export function FrascoMedidas({ bw, bh, br, capW, tampa, vidro, rot, nome, k = 1 }: { bw: number; bh: number; br: string; capW: number; tampa: string; vidro: string; rot: string; nome?: string; k?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }} aria-hidden="true">
      <span style={{ width: capW * k, height: 22 * k, borderRadius: 3, background: tampa, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)" }} />
      <span style={{ width: bw * 0.22 * k, height: Math.max(3, 6 * k), background: "#8E99AD" }} />
      <span style={{ width: bw * k, height: bh * k, borderRadius: br, background: vidro, border: "1px solid var(--line-2)", boxShadow: "0 14px 26px rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ width: (bw - 14) * k, height: Math.min(40, bh * 0.42) * k, borderRadius: "50%", background: "#F4F7FC", color: "#0A0A0C", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.05, textAlign: "center", overflow: "hidden" }}>
          <span style={{ fontSize: 5.5 * k, letterSpacing: ".12em" }}>{rot}</span>
          {nome ? <span style={{ fontSize: 8 * k, fontWeight: 600 }}>{nome.length > 13 ? nome.split(" ").slice(0, 2).join(" ") : nome}</span> : null}
        </span>
      </span>
    </div>
  );
}
