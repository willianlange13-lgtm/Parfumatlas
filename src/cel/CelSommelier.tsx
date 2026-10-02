"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icone } from "@/components/Icone";
import { Logo } from "@/components/Logo";
import { Card, Circ, FrascoMedidas, MONO, OURO, Rot } from "./kit";

type Sug = { rotulo: string; nome: string; marca: string; porque: string; dados: string[]; href: string; bw: number; bh: number; br: string; capW: number; tampa: string; vidro: string; palco: string; borda: string; rotCor: string };
type Msg = { eu?: boolean; som?: boolean; texto: string; foto?: string | null; semFoto?: boolean; sugestoes?: Sug[] | null; look?: { nome: string; cor: string }[] | null; layering?: { base: string; toque: string; porque: string; baseRot: string; toqueRot: string } | null; demo?: boolean };
type Op = { nome: string; bg: string; pick: () => void };
export type VSom = {
  msgs: Msg[]; pensando: boolean; vazio: boolean; demo: boolean; nova: () => void; enviar: (e: React.FormEvent<HTMLFormElement>) => void; escolherFoto: () => void; falar: () => void; vozRotulo: string;
  atalhos: { nome: string; d: string; pick: (e: React.MouseEvent) => void }[]; rapidas: { t: string; pick: () => void }[]; filtros: { nome: string; opcoes: Op[] }[];
  historico: { titulo: string; quando: string; href: string }[]; clima: { titulo: string; temp: string; sub: string }; subtitulo: string; t: Record<string, string>;
};

const SOL = "M12 8a4 4 0 1 0 .01 0 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4";

function Rico({ t }: { t: string }) {
  return <>{t.split(/(\*\*[^*]+\*\*)/).map((x, i) => (x.startsWith("**") ? <b key={i}>{x.slice(2, -2)}</b> : <span key={i}>{x}</span>))}</>;
}

function Entrada({ v }: { v: VSom }) {
  return (
    <div className="c-rodape" style={{ flexDirection: "column", gap: 10, paddingTop: 26 }}>
      {!v.vazio && (
        <div className="c-rolar" style={{ gap: 6, margin: "0 -20px", padding: "0 20px" }}>
          {v.rapidas.map((r) => <button key={r.t} type="button" onClick={r.pick} className="c-pill" style={{ height: 34, borderRadius: 17, fontSize: 12.5, border: "1px solid var(--line-2)", background: "rgba(5,5,6,.8)" }}>{r.t}</button>)}
        </div>
      )}
      <form onSubmit={v.enviar} className="c-campo" style={{ height: 52, borderRadius: 26, background: "#141417", border: "1px solid var(--line-2)" }}>
        <input name="q" placeholder={v.vozRotulo === "Parar de ouvir" ? "Ouvindo…" : "Pergunte ou toque no microfone"} aria-label="Mensagem para o sommelier" autoComplete="off" enterKeyHint="send" />
        <button type="button" className="c-circ" style={{ width: 36, height: 36, background: "var(--chip-2)" }} onClick={v.escolherFoto} aria-label="Foto do look"><Icone nome="camera" tamanho={16} /></button>
        <button type="button" className="c-circ" style={{ width: 40, height: 40, background: v.vozRotulo === "Parar de ouvir" ? OURO : "var(--btn)", color: "var(--on-btn)" }} onClick={v.falar} aria-label={v.vozRotulo}><Icone nome="mic" tamanho={17} /></button>
      </form>
    </div>
  );
}

export function CelSommelier({ v }: { v: VSom }) {
  const [historico, setHistorico] = useState(false);
  const [verExemplo, setVerExemplo] = useState(false);
  const soExemplo = v.msgs.length > 0 && v.msgs.every((m) => m.demo) && !v.pensando;
  const fim = useRef<HTMLDivElement>(null);
  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [v.msgs.length, v.pensando]);
  const temp = v.clima.temp.replace(" °C", "°");

  if (historico) {
    return (
      <div className="c-tela sem-barra">
        <div className="c-topo">
          <Circ icone="voltar" tamanho={36} rotulo="Voltar" onClick={() => setHistorico(false)} />
          <span className="c-topo-tit">Conversas</span>
          <button type="button" onClick={() => { v.nova(); setHistorico(false); }} style={{ background: "none", border: "none", color: "var(--ink-2)", fontSize: 14 }}>+ Nova</button>
        </div>
        <Rot>Conversas</Rot>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
          {v.historico.length === 0 && <span style={{ color: "var(--ink-3)", fontSize: 14 }}>Nenhuma conversa ainda.</span>}
          {v.historico.map((h, i) => (
            <Link key={i} href={h.href} onClick={() => setHistorico(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 16, background: i === 0 ? "var(--chip-2)" : "transparent" }}>
              <span style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15 }}>{h.titulo}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: "var(--ink-3)" }}>{h.quando}</span>
              </span>
              <Icone nome="seta" tamanho={16} />
            </Link>
          ))}
        </div>
        <Card pad={16} gap={12}>
          <Rot>O sommelier considera</Rot>
          {[v.subtitulo.replace("Conhece seus ", "Seus ").replace(", seu DNA e o clima de agora", " e o DNA"), "Clima e previsão da noite", "Reviews por temperatura", "O que você usou recentemente", "Suas anotações pessoais"].map((x) => (
            <div key={x} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14.5 }}>
              <span style={{ width: 22, height: 22, borderRadius: 11, background: "var(--prata)", color: "var(--on-btn)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icone nome="check" tamanho={13} traco={2.4} /></span>{x}
            </div>
          ))}
        </Card>
        <Card pad={16}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-2)" }}>
            <Icone nome="mic" tamanho={18} />
            <span>Diga <b style={{ color: "var(--ink)" }}>“Alexa, pergunte ao Parfum Atlas o que eu uso hoje”</b> no celular ou na Alexa.</span>
          </div>
        </Card>
      </div>
    );
  }

  if (v.vazio || (soExemplo && !verExemplo)) {
    return (
      <div className="c-tela sem-barra" style={{ paddingBottom: 150 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, height: 60, flexShrink: 0 }}>
          <Circ icone="voltar" href="/" tamanho={36} rotulo="Voltar" />
          <span style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-.01em", flexGrow: 1 }}>Sommelier</span>
          <Circ icone="chat" tamanho={40} rotulo="Conversas" onClick={() => setHistorico(true)} />
          <button type="button" className="c-pill on" style={{ height: 40, borderRadius: 20, fontSize: 14 }} onClick={v.nova}>+ Nova</button>
        </div>
        <Card fundo="destaque" pad="14px 16px">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg viewBox="0 0 24 24" style={{ width: 36, height: 36, fill: "none", stroke: "var(--ink)", strokeWidth: 1.3, flexShrink: 0 }}><path d={SOL} /></svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Rot>{v.clima.titulo}</Rot>
              <span style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.1 }}>{v.clima.temp}</span>
              <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{v.clima.sub}</span>
            </div>
          </div>
        </Card>
        <Rot>Atalhos</Rot>
        <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {v.atalhos.map((a) => (
            <button key={a.nome} type="button" onClick={(e) => a.pick(e)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: "1px solid var(--line)", background: "none", borderLeft: "none", borderRight: "none", borderBottom: "none", color: "var(--ink)", textAlign: "left", fontSize: 15 }}>
              <span style={{ width: 34, height: 34, borderRadius: 17, background: "var(--chip)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" }}><path d={a.d} /></svg>
              </span>
              <span style={{ flexGrow: 1 }}>{a.nome}</span>
              <Icone nome="seta" tamanho={16} />
            </button>
          ))}
        </div>
        <Card pad={16} gap={14}>
          {v.filtros.map((f) => (
            <div key={f.nome} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".12em", color: "var(--ink-3)", textTransform: "uppercase" }}>{f.nome}</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {f.opcoes.map((o) => <button key={o.nome} type="button" onClick={o.pick} className={`c-pill ${o.bg === v.t.btn ? "on" : ""}`} style={{ height: 30, borderRadius: 15, fontSize: 13, background: o.bg === v.t.btn ? undefined : "var(--chip)" }}>{o.nome}</button>)}
              </div>
            </div>
          ))}
        </Card>
        {soExemplo && <button type="button" onClick={() => setVerExemplo(true)} style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, color: "var(--ink-2)", fontSize: 13.5, borderBottom: "1px solid var(--prata)" }}>Ver uma conversa de exemplo</button>}
        <Entrada v={{ ...v, vazio: true }} />
      </div>
    );
  }

  return (
    <div className="c-tela sem-barra" style={{ paddingBottom: 170 }}>
      <div className="c-topo" style={{ height: 60 }}>
        <Circ icone="voltar" tamanho={36} rotulo="Voltar" onClick={() => { setVerExemplo(false); v.nova(); }} />
        <span style={{ width: 34, height: 34, borderRadius: 17, border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Logo tamanho={22} traco={1.6} /></span>
        <span style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Sommelier do Atlas</span>
          <span style={{ fontSize: 11.5, color: "var(--ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.subtitulo.replace("Conhece ", "").replace(" de agora", "")}</span>
        </span>
        <button type="button" onClick={() => setHistorico(true)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 13, background: "var(--chip)", border: "none", color: "var(--ink)", fontSize: 12 }}>
          <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: "none", stroke: OURO, strokeWidth: 1.6 }}><path d={SOL} /></svg>{temp}
        </button>
      </div>
      {v.msgs.map((m, i) =>
        m.eu ? (
          <div key={i} style={{ alignSelf: "flex-end", maxWidth: "86%", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
            {m.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.foto} alt="Foto do look" style={{ width: 170, height: 150, objectFit: "cover", borderRadius: 18, border: "1px solid var(--line-2)" }} />
            ) : m.semFoto ? (
              <div style={{ width: 170, height: 150, borderRadius: 18, border: "1px solid var(--line-2)", background: "var(--surface)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <svg viewBox="0 0 24 24" style={{ width: 34, height: 34, fill: "none", stroke: "currentColor", strokeWidth: 1.3 }}><path d="M8 3l-5 3 2 4 2-1v12h10V9l2 1 2-4-5-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z" /></svg>
                <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: ".14em", color: "var(--ink-3)" }}>FOTO DO SEU LOOK</span>
              </div>
            ) : null}
            <div style={{ padding: "11px 15px", borderRadius: "20px 20px 6px 20px", background: "var(--chip-2)", fontSize: 14.5, lineHeight: 1.45 }}>{m.texto}</div>
          </div>
        ) : (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
            {m.look ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {m.look.map((l) => <span key={l.nome} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 10px 4px 5px", borderRadius: 14, background: "var(--chip)", fontSize: 12.5 }}><span style={{ width: 16, height: 16, borderRadius: 8, background: l.cor, border: "1px solid var(--line-2)" }} />{l.nome}</span>)}
              </div>
            ) : null}
            <div style={{ fontSize: 15, lineHeight: 1.55 }}><Rico t={m.texto} /></div>
            {m.sugestoes ? (
              <div className="c-rolar" style={{ gap: 10 }}>
                {m.sugestoes.map((s) => (
                  <Link key={s.nome} href={s.href || "/colecao"} style={{ width: 216, flexShrink: 0, borderRadius: 20, border: `1px solid ${s.borda}`, background: s.borda === OURO ? "var(--tile)" : "var(--surface)", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ width: 46, height: 52, borderRadius: 12, background: s.palco, border: "1px solid var(--line)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4, flexShrink: 0 }}>
                        <FrascoMedidas bw={s.bw} bh={s.bh} br={s.br} capW={s.capW} tampa={s.tampa} vidro={s.vidro} rot="" k={0.85} />
                      </span>
                      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                        <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: ".12em", color: s.rotCor }}>{s.rotulo}</span>
                        <span style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.15 }}>{s.nome}</span>
                        <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{s.marca}</span>
                      </span>
                    </div>
                    <span style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--ink-2)" }}>{s.porque}</span>
                    <span style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{s.dados.map((d) => <span key={d} style={{ padding: "2px 7px", borderRadius: 7, background: "var(--chip-2)", fontFamily: MONO, fontSize: 9.5 }}>{d}</span>)}</span>
                  </Link>
                ))}
              </div>
            ) : null}
            {m.layering ? (
              <Card fundo="destaque" pad={14} gap={10}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: ".1em", color: "var(--ink-3)" }}>{m.layering.baseRot}</span><span style={{ fontSize: 15 }}>{m.layering.base}</span></span>
                  <span style={{ width: 28, height: 28, borderRadius: 14, background: "var(--chip-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icone nome="mais" tamanho={14} /></span>
                  <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: ".1em", color: "var(--ink-3)" }}>{m.layering.toqueRot}</span><span style={{ fontSize: 15 }}>{m.layering.toque}</span></span>
                </div>
                <span style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--ink-2)" }}>{m.layering.porque}</span>
              </Card>
            ) : null}
          </div>
        ),
      )}
      {v.pensando && <div style={{ fontSize: 14, color: "var(--ink-3)" }}>O sommelier está pensando…</div>}
      {v.demo && <span className="tracejado" style={{ alignSelf: "flex-start", fontSize: 9.5 }}>CONVERSA DE EXEMPLO</span>}
      <div ref={fim} />
      <Entrada v={v} />
    </div>
  );
}
