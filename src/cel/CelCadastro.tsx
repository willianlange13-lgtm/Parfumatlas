"use client";
import { useEffect, useRef, useState } from "react";
import { Icone } from "@/components/Icone";
import { Frasco } from "@/components/Frasco";
import type { Perfume } from "@/lib/tipos";
import { Anel, Card, Circ, MONO, NotaChip, OURO, Rot } from "./kit";

type Modo = "foto" | "link" | "nome" | "voz";
type Cand = { nome: string; casa: string; concentracao: string; por: string; pct: number; link?: string; imagem?: string | null };
type Ficha = Omit<Perfume, "id" | "clima"> & { revisar: string[]; completar?: boolean; fragrantica?: string };
type Campo = { l: string; v: string; st: string; mudar: (e: React.ChangeEvent<HTMLInputElement>) => void };
export type CadCel = {
  modo: Modo; setModo: (m: Modo) => void; foto: string | null; lido: string[]; cands: Cand[]; sel: number; ficha: Ficha | null; setFicha: (f: Ficha) => void;
  situacao: string; setSituacao: (s: string) => void; anotacao: string; setAnotacao: (s: string) => void; ocupado: string; ouvindo: boolean; fala: string; erro: string;
  identificar: (m: "foto" | "link" | "nome", texto?: string, f?: undefined, rapido?: boolean) => void; pesquisou: boolean; completando: boolean; escolher: (c: Cand, i: number) => void; ouvir: () => void; salvar: () => void;
  fotoEscolhida: (e: React.ChangeEvent<HTMLInputElement>) => void; campos: Campo[]; prog: { pct: number; ok: number; tot: number; rev: number }; fontes: { nome: string; info: string }[]; desemp: { l: string; seg: string[]; v: string }[]; quando: [string, number][];
};

const MODOS: [Modo, string, string][] = [["foto", "Foto", "camera"], ["link", "Link", "link"], ["nome", "Nome", "texto"], ["voz", "Voz", "mic"]];
const TIT: Record<Modo, string> = { foto: "Adicionar perfume", link: "Adicionar por link", nome: "Adicionar por nome", voz: "Adicionar por voz" };

function Passos({ n, txt }: { n: number; txt: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, flexShrink: 0 }}>
      <div style={{ display: "flex", gap: 5 }}>{[1, 2, 3, 4].map((i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < n ? "var(--prata)" : i === n ? OURO : "var(--chip-2)" }} />)}</div>
      <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Passo {n} de 4 · {txt}</span>
    </div>
  );
}

function CandLista({ c }: { c: CadCel }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
      {c.cands.map((x, i) => {
        const s = i === c.sel || (c.sel < 0 && i === 0);
        return (
          <button key={i} type="button" onClick={() => c.escolher(x, i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 18, background: s ? "var(--chip-2)" : "transparent", border: `1px solid ${s ? OURO : "var(--line)"}`, color: "var(--ink)", textAlign: "left" }}>
            <span style={{ width: 40, height: 48, borderRadius: 10, background: "var(--surface)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4, flexShrink: 0, overflow: "hidden" }}><Frasco nome={x.nome} casa={x.casa} acorde="Frutado" forma="ret" tampa="#C9A227" escala={0.36} /></span>
            <span style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: ".1em", color: "var(--ink-3)" }}>{x.casa.toUpperCase()}{x.concentracao ? ` · ${x.concentracao}` : ""}</span>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{x.nome}</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{c.ocupado === "ficha" && i === c.sel ? "Montando a ficha…" : x.por}</span>
            </span>
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <span style={{ fontSize: 15, color: s ? OURO : "var(--ink-3)" }}>{x.pct}%</span>
              <span style={{ width: 34, height: 3, borderRadius: 2, background: "var(--chip-2)", display: "flex" }}><span style={{ width: `${x.pct}%`, background: s ? OURO : "var(--ink-3)", borderRadius: 2 }} /></span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function CelCadastro({ c, modoInicial }: { c: CadCel; modoInicial?: string }) {
  const [passo, setPasso] = useState<"id" | "revisar" | "salvar">("id");
  const [q, setQ] = useState("");
  const fichaAntes = useRef<Ficha | null>(null);
  const iniciou = useRef(false);

  // quando a ficha chega, segue para a revisão
  useEffect(() => {
    if (c.ficha && !fichaAntes.current) setPasso("revisar");
    fichaAntes.current = c.ficha;
  }, [c.ficha]);
  // segurar o + abre direto na voz
  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;
    if (modoInicial === "voz" && window.matchMedia("(max-width: 900px)").matches) c.ouvir();
  }, [modoInicial, c]);
  // na busca por nome, procura enquanto digita
  useEffect(() => {
    if (c.modo !== "nome" || q.trim().length < 3) return;
    const t = setTimeout(() => c.identificar("nome", q.trim(), undefined, true), 650);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, c.modo]);

  const fotografar = () => document.getElementById("foto-frasco-cel")?.click();
  const f = c.ficha;
  const sel = c.cands[c.sel] ?? c.cands[0];

  const rodape = (principal: React.ReactNode, secundario?: React.ReactNode) => (
    <div className="c-rodape">{secundario}{principal}</div>
  );
  const btnP = (txt: string, fn: () => void, off?: boolean) => <button type="button" className="c-btn" style={{ height: 52, borderRadius: 26, flexGrow: 1 }} onClick={fn} disabled={off}>{txt}</button>;
  const btnS = (txt: string, fn: () => void) => <button type="button" className="c-btn sec" style={{ height: 52, borderRadius: 26 }} onClick={fn}>{txt}</button>;

  // ---------- passo 3: revisar ficha ----------
  if (passo === "revisar" && f) {
    const tira = (k: "saida" | "coracao" | "fundo", n: string) => c.setFicha({ ...f, notas: { ...f.notas, [k]: f.notas[k].filter((x) => x !== n) } });
    const poe = (k: "saida" | "coracao" | "fundo") => { const n = prompt("Nome da nota"); if (n?.trim()) c.setFicha({ ...f, notas: { ...f.notas, [k]: [...f.notas[k], n.trim()] } }); };
    return (
      <div className="c-tela sem-barra">
        <input id="foto-frasco-cel" type="file" accept="image/*" capture="environment" hidden onChange={c.fotoEscolhida} />
        <div className="c-topo"><Circ icone="voltar" tamanho={36} rotulo="Voltar" onClick={() => setPasso("id")} /><span className="c-topo-tit">Revisar ficha</span><span style={{ width: 36 }} /></div>
        <Passos n={3} txt="Revisar ficha" />
        {c.completando && <span style={{ fontSize: 13, color: "var(--ink-3)", flexShrink: 0 }}>Buscando os votos de fixação e projeção… pode revisar e salvar, eles entram na ficha quando chegarem.</span>}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
          <span style={{ width: 46, height: 52, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4, overflow: "hidden" }}>
            {c.foto || f.imagem ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.foto ?? f.imagem ?? ""} alt="" style={{ width: "100%", height: "100%", objectFit: c.foto ? "cover" : "contain", background: c.foto ? "transparent" : "#FFFFFF" }} />
            ) : <Frasco nome={f.nome} casa={f.casa} acorde={f.acorde} forma={f.forma} tampa={f.tampa} escala={0.4} />}
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 19, fontWeight: 500 }}>{f.nome}</span>
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", color: "var(--ink-3)" }}>{`${f.casa} · ${f.familia}`.toUpperCase()}</span>
          </span>
        </div>
        <Card pad={14}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Anel valor={c.prog.pct / 100} txt={`${c.prog.pct}%`} tam={52} sw={4} cor={OURO} />
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 16 }}>{c.prog.ok} de {c.prog.tot} campos</span>{c.prog.rev ? <span style={{ fontSize: 12.5, color: OURO }}>{c.prog.rev} para revisar</span> : <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>tudo conferido</span>}</span>
          </div>
        </Card>
        <div style={{ display: "flex", justifyContent: "space-between" }}><Rot>Ficha preenchida</Rot><span style={{ fontSize: 12, color: "var(--ink-3)" }}>toque para corrigir</span></div>
        <div className="c-grade2" style={{ gap: 8 }}>
          {c.campos.map((x) => {
            const rev = x.st === "REVISAR";
            return (
              <label key={x.l} style={{ borderRadius: 14, border: `1px solid ${rev ? OURO : "var(--line)"}`, background: "var(--surface)", padding: "8px 11px", display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <span style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 8.5, letterSpacing: ".1em", color: "var(--ink-3)" }}><span>{x.l}</span><span style={{ color: rev ? OURO : "var(--ink-3)" }}>{rev ? "REVISAR" : "✓"}</span></span>
                <input defaultValue={x.v === "a confirmar" ? "" : x.v} placeholder="a confirmar" onChange={x.mudar} style={{ background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontSize: 14, padding: 0, minWidth: 0 }} />
              </label>
            );
          })}
        </div>
        <Card pad={14} gap={12}>
          <Rot>Pirâmide</Rot>
          {([["SAÍDA", "saida"], ["CORAÇÃO", "coracao"], ["FUNDO", "fundo"]] as const).map(([nome, k]) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "var(--ink-3)" }}>{nome}</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {f.notas[k].map((n) => (
                  <button key={n} type="button" onClick={() => tira(k, n)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 9px 2px 2px", borderRadius: 16, background: "var(--chip)", border: "none", color: "var(--ink)", fontSize: 12 }} aria-label={`Tirar ${n}`}>
                    <NotaChip nome={n} tam={22} rotulo={false} />{n}<span style={{ color: "var(--ink-3)" }}>×</span>
                  </button>
                ))}
                <button type="button" onClick={() => poe(k)} className="tracejado" style={{ background: "none", padding: "3px 10px", borderRadius: 14 }}>+ nota</button>
              </div>
            </div>
          ))}
          {c.desemp.map((d) => (
            <div key={d.l} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "var(--ink-3)" }}>{d.l}</span>{d.v}</span>
              <span style={{ display: "flex", gap: 4 }}>{d.seg.map((cor, i) => <span key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: cor === "#C9D1DE" ? OURO : cor }} />)}</span>
            </div>
          ))}
        </Card>
        {f.acordes.length > 0 && (
          <Card pad={14} gap={8}>
            <Rot>Principais acordes</Rot>
            {f.acordes.slice(0, 8).map((a) => (
              <div key={a.nome} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                <span style={{ width: 118, color: "var(--ink-2)" }}>{a.nome}</span>
                <span style={{ flexGrow: 1, height: 6, borderRadius: 3, background: "var(--chip)", display: "flex" }}><span style={{ width: `${a.valor}%`, borderRadius: 3, background: a === f.acordes[0] ? OURO : "var(--prata)" }} /></span>
              </div>
            ))}
          </Card>
        )}
        {c.quando.length > 0 && (
          <Card pad={14} gap={8}>
            <Rot>Quando usar</Rot>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 6, alignItems: "end", height: 90 }}>
              {c.quando.map(([nome, v]) => (
                <div key={nome} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ width: "70%", height: `${Math.max(4, v * 0.6)}px`, borderRadius: 4, background: v >= 80 ? OURO : "var(--prata)" }} />
                  <span style={{ fontSize: 10, color: "var(--ink-3)" }}>{nome}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
        {c.fontes.length > 0 && (
          <Card pad={14} gap={10}>
            <Rot>Fontes lidas</Rot>
            {c.fontes.map((x) => (
              <div key={x.nome} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                <span style={{ width: 20, height: 20, borderRadius: 10, background: "var(--prata)", color: "var(--on-btn)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icone nome="check" tamanho={12} traco={2.4} /></span>
                <span style={{ flexGrow: 1 }}>{x.nome}</span><span style={{ fontSize: 11, color: "var(--ink-3)" }}>{x.info}</span>
              </div>
            ))}
          </Card>
        )}
        {c.erro && <span style={{ color: "var(--erro)", fontSize: 13.5 }}>{c.erro}</span>}
        {rodape(btnP("Continuar", () => setPasso("salvar")))}
      </div>
    );
  }

  // ---------- passo 4: salvar ----------
  if (passo === "salvar" && f) {
    return (
      <div className="c-tela sem-barra">
        <div className="c-topo"><Circ icone="voltar" tamanho={36} rotulo="Voltar" onClick={() => setPasso("revisar")} /><span className="c-topo-tit">Salvar</span><span style={{ width: 36 }} /></div>
        <Passos n={4} txt="Salvar" />
        <div style={{ alignSelf: "center", width: 170, height: 190, borderRadius: 22, border: "1px solid var(--line)", background: "radial-gradient(ellipse at 50% 85%, rgba(216,185,112,.18) 0%, var(--surface) 75%)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 18, overflow: "hidden", position: "relative" }}>
          {c.foto || f.imagem ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.foto ?? f.imagem ?? ""} alt="Seu frasco" style={{ position: "absolute", inset: c.foto ? 0 : 10, width: c.foto ? "100%" : "calc(100% - 20px)", height: c.foto ? "100%" : "calc(100% - 20px)", objectFit: c.foto ? "cover" : "contain", background: c.foto ? "transparent" : "#FFFFFF", borderRadius: 14 }} />
          ) : <Frasco nome={f.nome} casa={f.casa} acorde={f.acorde} forma={f.forma} tampa={f.tampa} escala={1} />}
        </div>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 24, fontWeight: 500 }}>{f.nome}</span>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", color: "var(--ink-3)" }}>{f.casa.toUpperCase()}</span>
        </div>
        <Rot>Adicionar como</Rot>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[["tenho", "Tenho"], ["quero", "Quero"], ["tive", "Tive"], ["assinatura", "★ Assinatura"]].map(([k, nome]) => (
            <button key={k} type="button" className={`c-pill ${c.situacao === k ? "on" : ""}`} style={{ height: 36, borderRadius: 18 }} onClick={() => c.setSituacao(k)}>{nome}</button>
          ))}
        </div>
        <Rot>Anotação (opcional)</Rot>
        <label className="c-campo" style={{ height: "auto", minHeight: 90, alignItems: "flex-start", padding: 14, borderRadius: 18, border: "1px solid var(--line-2)", background: "transparent" }}>
          <textarea value={c.anotacao} onChange={(e) => c.setAnotacao(e.target.value)} placeholder="Ex.: presente de aniversário" rows={3} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontSize: 14.5, resize: "none", fontFamily: "var(--sans)" }} />
        </label>
        {c.prog.rev > 0 && (
          <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 16, background: "var(--chip)", fontSize: 12.5, lineHeight: 1.45, color: "var(--ink-2)" }}>
            <Icone nome="check" tamanho={16} />Ficha com {c.prog.ok} de {c.prog.tot} campos. Os campos marcados para revisar ficam guardados para você conferir depois.
          </div>
        )}
        {c.erro && <span style={{ color: "var(--erro)", fontSize: 13.5 }}>{c.erro}</span>}
        {rodape(btnP(c.ocupado === "salvando" ? "Salvando…" : "Salvar na coleção", c.salvar, c.ocupado === "salvando"))}
      </div>
    );
  }

  // ---------- passos 1 e 2: identificar e confirmar ----------
  const etapa = c.cands.length ? 2 : 1;
  return (
    <div className="c-tela sem-barra">
      <input id="foto-frasco-cel" type="file" accept="image/*" capture="environment" hidden onChange={c.fotoEscolhida} />
      <div className="c-topo"><Circ icone="voltar" href="/" tamanho={36} rotulo="Voltar" /><span className="c-topo-tit">{TIT[c.modo]}</span><span style={{ width: 36 }} /></div>
      {c.modo !== "voz" && <Passos n={etapa} txt={etapa === 1 ? "Identificar" : "Confirmar"} />}
      <div className="c-seg">
        {MODOS.map(([m, nome, ic]) => (
          <button key={m} type="button" className={c.modo === m ? "on" : ""} style={{ fontSize: 13, gap: 5 }} onClick={() => { c.setModo(m); if (m === "voz") c.ouvir(); if (m === "foto" && !c.foto) fotografar(); }}>
            <Icone nome={ic} tamanho={13} />{nome}
          </button>
        ))}
      </div>

      {c.modo === "foto" && (
        <>
          <button type="button" onClick={fotografar} style={{ position: "relative", height: 240, borderRadius: 22, border: "1px solid var(--line)", background: "radial-gradient(ellipse at 50% 70%, rgba(216,185,112,.14) 0%, var(--surface) 75%)", overflow: "hidden", flexShrink: 0, color: "var(--ink)", padding: 0 }}>
            {c.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.foto} alt="Foto do frasco" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--ink-2)" }}>
                <Icone nome="camera" tamanho={34} traco={1.3} />
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".14em" }}>TOQUE PARA FOTOGRAFAR</span>
              </span>
            )}
            {[["left", "top"], ["right", "top"], ["left", "bottom"], ["right", "bottom"]].map(([h, v]) => (
              <span key={h + v} style={{ position: "absolute", [h]: 14, [v]: 14, width: 26, height: 26, [`border${h === "left" ? "Left" : "Right"}`]: "2px solid var(--ink)", [`border${v === "top" ? "Top" : "Bottom"}`]: "2px solid var(--ink)", [`border${v === "top" ? "Top" : "Bottom"}${h === "left" ? "Left" : "Right"}Radius`]: 8 } as React.CSSProperties} />
            ))}
            {c.foto && <span style={{ position: "absolute", left: 14, bottom: 12, padding: "3px 8px", borderRadius: 6, background: "rgba(5,5,6,.7)", fontFamily: MONO, fontSize: 9, letterSpacing: ".1em" }}>{c.ocupado === "lendo" ? "LENDO…" : "SUA FOTO"}</span>}
          </button>
          {c.lido.length > 0 && (
            <>
              <Rot>O que a IA leu no frasco</Rot>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{c.lido.map((x) => <span key={x} style={{ padding: "4px 10px", borderRadius: 10, background: "var(--chip)", fontSize: 12 }}>{x}</span>)}</div>
            </>
          )}
          {c.cands.length > 0 && <><Rot>É este?</Rot><CandLista c={c} /></>}
        </>
      )}

      {c.modo === "link" && (
        <>
          <Rot>Cole o link</Rot>
          <form className="c-campo" style={{ height: 50, border: "1px solid var(--line-2)" }} onSubmit={(e) => { e.preventDefault(); if (q.trim()) c.identificar("link", q.trim()); }}>
            <Icone nome="link" tamanho={17} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="fragrantica.com/perfume/…" inputMode="url" aria-label="Link do perfume" />
            <button type="button" className="c-pill" style={{ height: 32, borderRadius: 16, fontSize: 12.5, background: "var(--chip-2)", color: "var(--ink)" }} onClick={async () => { try { const t = await navigator.clipboard.readText(); setQ(t); if (/^https?:\/\//.test(t)) c.identificar("link", t); } catch { /* sem permissão */ } }}>Colar</button>
          </form>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Vale link de qualquer site de perfume:</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{["Fragrantica", "Parfumo", "Site da marca", "Loja"].map((x) => <span key={x} style={{ padding: "4px 10px", borderRadius: 10, background: "var(--chip)", fontSize: 12 }}>{x}</span>)}</div>
          {sel && (
            <Card pad={14} gap={10}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ width: 40, height: 48, borderRadius: 10, background: "var(--surface)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4, overflow: "hidden" }}><Frasco nome={sel.nome} casa={sel.casa} forma="ret" tampa="#C9A227" escala={0.36} /></span>
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: ".1em", color: "var(--ink-3)" }}>{sel.casa.toUpperCase()}</span>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{sel.nome}</span>
                  <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Página encontrada</span>
                </span>
              </div>
              {["Lendo a página", "Nome, casa e ano", "Pirâmide e acordes", "Votos de fixação e projeção"].map((x, i) => {
                const feito = Boolean(c.ficha) || (c.ocupado === "ficha" && i < 2);
                return <span key={x} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: feito ? "var(--ink)" : "var(--ink-3)" }}><span style={{ width: 18, height: 18, borderRadius: 9, background: feito ? OURO : "transparent", border: feito ? "none" : "1.5px solid var(--ink-3)", color: "#1A1407", display: "flex", alignItems: "center", justifyContent: "center" }}>{feito ? <Icone nome="check" tamanho={11} traco={2.6} /> : null}</span>{x}</span>;
              })}
            </Card>
          )}
          {c.cands.length > 1 && <CandLista c={c} />}
        </>
      )}

      {c.modo === "nome" && (
        <>
          <form className="c-campo" style={{ height: 50, border: "1px solid var(--line-2)" }} onSubmit={(e) => { e.preventDefault(); if (q.trim()) c.identificar("nome", q.trim()); }}>
            <Icone nome="busca" tamanho={17} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome e casa, ex.: Blue Talisman" aria-label="Nome do perfume" autoFocus enterKeyHint="search" />
            <button type="button" className="c-circ" style={{ width: 34, height: 34, background: "var(--chip-2)" }} onClick={() => { c.setModo("voz"); c.ouvir(); }} aria-label="Falar"><Icone nome="mic" tamanho={15} /></button>
          </form>
          {c.ocupado === "lendo" && <span style={{ fontSize: 13.5, color: "var(--ink-3)" }}>Procurando…</span>}
          {c.pesquisou && c.cands.length > 0 && c.ocupado !== "ficha" && <span style={{ fontSize: 13, color: "var(--ink-3)" }}>Escolha o perfume certo para eu montar a ficha.</span>}
          {c.cands.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
              {c.cands.map((x, i) => (
                <button key={i} type="button" onClick={() => c.escolher(x, i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", background: "none", border: "none", borderTop: i ? "1px solid var(--line)" : "none", color: "var(--ink)", textAlign: "left" }}>
                  {x.imagem
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={x.imagem} alt="" style={{ width: 36, height: 42, borderRadius: 10, background: "#fff", objectFit: "contain", flexShrink: 0 }} />
                    : <span style={{ width: 36, height: 42, borderRadius: 10, background: "var(--surface)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 3, overflow: "hidden" }}><Frasco nome={x.nome} casa={x.casa} forma="ret" tampa="#141417" escala={0.3} /></span>}
                  <span style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 15, color: i === 0 ? OURO : "var(--ink)" }}>{x.nome}</span>
                    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "var(--ink-3)" }}>{x.casa.toUpperCase()}{x.concentracao ? ` · ${x.concentracao}` : ""}</span>
                    {c.pesquisou && x.por && <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{x.por}</span>}
                  </span>
                  {c.ocupado === "ficha" && c.sel === i ? <span style={{ fontSize: 12, color: "var(--ink-3)" }}>montando…</span> : <Icone nome="seta" tamanho={16} />}
                </button>
              ))}
            </div>
          )}
          {!c.pesquisou && q.trim().length >= 3 && c.ocupado !== "lendo" && c.ocupado !== "ficha" && (
            <button type="button" className="c-btn sec" style={{ height: 44, borderRadius: 22, flexShrink: 0 }} onClick={() => c.identificar("nome", q.trim())}>
              {c.cands.length ? "Não está aqui? Procurar no Fragrantica" : "Procurar no Fragrantica"}
            </button>
          )}
        </>
      )}

      {c.modo === "voz" && (
        <>
          <button type="button" onClick={c.ouvir} aria-label="Falar" style={{ alignSelf: "center", width: 200, height: 200, borderRadius: 100, border: "1px solid var(--line)", background: "radial-gradient(circle, rgba(216,185,112,.1) 0%, rgba(0,0,0,0) 70%)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 10, padding: 0 }}>
            <span style={{ width: 140, height: 140, borderRadius: 70, border: `1px solid ${c.ouvindo ? OURO : "var(--line-2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ width: 84, height: 84, borderRadius: 42, background: "var(--btn)", color: "var(--on-btn)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: c.ouvindo ? `0 0 0 6px rgba(216,185,112,.25)` : "none" }}><Icone nome="mic" tamanho={30} /></span>
            </span>
          </button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, height: 50, flexShrink: 0 }} aria-hidden="true">
            {Array.from({ length: 27 }, (_, i) => <span key={i} className={c.ouvindo ? "onda" : ""} style={{ width: 3, height: 8 + Math.round(Math.abs(Math.sin(i * 0.9)) * 36), borderRadius: 2, background: i > 9 && i < 17 ? OURO : "var(--prata)", opacity: c.ouvindo ? 1 : 0.4, animationDelay: `${(i % 7) * 0.08}s` }} />)}
          </div>
          <div style={{ textAlign: "center", fontSize: 19, lineHeight: 1.35, minHeight: 50 }}>{c.fala || "Toque e diga o nome do perfume e da casa."}</div>
          {sel && (
            <Card pad={14} gap={8}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 40, height: 46, borderRadius: 10, background: "var(--surface)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4, overflow: "hidden" }}><Frasco nome={sel.nome} casa={sel.casa} forma="redondo" tampa="#B08D3C" escala={0.3} /></span>
                <span style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 16, fontWeight: 500 }}>{sel.nome}</span><span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "var(--ink-3)" }}>{sel.casa.toUpperCase()}</span></span>
                <Anel valor={sel.pct / 100} txt={String(sel.pct)} tam={40} sw={3} cor={OURO} />
              </div>
              {f && [["Marca", f.casa], ["Família", f.familia]].map(([l, val]) => <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--line)" }}><span style={{ color: "var(--ink-3)" }}>{l}</span><span>{val} ✓</span></div>)}
              {c.ocupado === "ficha" && <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Montando a ficha…</span>}
            </Card>
          )}
          {c.cands.length > 1 && <CandLista c={c} />}
        </>
      )}

      {c.erro && <span style={{ color: "var(--erro)", fontSize: 13.5 }}>{c.erro}</span>}
      {c.modo === "foto" && c.cands.length > 0 && rodape(btnP(c.ocupado === "ficha" ? "Montando a ficha…" : "É este", () => (f ? setPasso("revisar") : sel && c.escolher(sel, c.sel < 0 ? 0 : c.sel)), c.ocupado === "ficha"), btnS("Outra foto", fotografar))}
      {c.modo === "foto" && !c.cands.length && rodape(btnP(c.ocupado === "lendo" ? "Lendo o frasco…" : "Fotografar o frasco", fotografar, c.ocupado === "lendo"))}
      {c.modo === "link" && rodape(btnP(c.ocupado ? "Lendo…" : "Continuar", () => (f ? setPasso("revisar") : sel ? c.escolher(sel, 0) : q.trim() && c.identificar("link", q.trim())), Boolean(c.ocupado)))}
      {c.modo === "voz" && sel && rodape(btnP(f ? "Continuar" : "Montando…", () => setPasso("revisar"), !f), btnS("Falar de novo", c.ouvir))}
    </div>
  );
}
