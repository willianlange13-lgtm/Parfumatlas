"use client";
import Link from "next/link";
import { useState } from "react";
import { Icone } from "@/components/Icone";
import { Anel, Btn, Card, Circ, MONO, OURO, PalcoC, Pill, Qtd, Rolar, Rot, Secao, TituloAba } from "./kit";
import type { DadosColecao } from "@/montar/colecao";
import { ouvirUmaVez } from "./voz";

type Item = DadosColecao["itens"][number];
type Grupo = { nome: string; n: string; cor: string; itens: Item[] };

export type EstadoColecao = {
  modo: string; setModo: (m: string) => void;
  sit: string; setSit: (s: string) => void;
  busca: string; setBusca: (s: string) => void;
  ordem: string; setOrdem: (s: string) => void;
  secoes: Grupo[]; total: number;
};

const GN: [string, string][] = [["acorde", "Acorde"], ["familia", "Família"], ["marca", "Marca"], ["genero", "Gênero"], ["az", "A–Z"]];
const SIT: [string, string][] = [["tenho", "Tenho"], ["tive", "Tive"], ["quero", "Quero"], ["assinatura", "Assinatura"]];
const ORD: [string, string][] = [["usados", "Mais usados"], ["recentes", "Mais recentes"], ["esquecidos", "Esquecidos"]];

function CardP({ p }: { p: Item }) {
  return (
    <Link href={p.href} style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <PalcoC nome={p.nome} casa={p.marca} acorde={p.acorde} forma={p.forma} tampa={p.tampa} foto={p.foto} oficial={p.oficial} altura={140} k={0.78} raio={18}>
        {p.rel ? <span style={{ position: "absolute", left: 9, top: 9, padding: "3px 8px", borderRadius: 9, background: "var(--bg)", color: "var(--prata)", fontSize: 10 }}>{p.rel}</span> : null}
        {p.assin ? <span style={{ position: "absolute", right: 9, top: 9 }}><svg viewBox="0 0 24 24" style={{ width: 15, height: 15, fill: OURO, stroke: OURO, strokeWidth: 1 }}><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2 6.1 20.5l1.3-6.6L2.5 9.4l6.6-.8z" /></svg></span> : null}
      </PalcoC>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "0 2px" }}>
        <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nome}</span>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".08em", color: "var(--ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.marcaUp}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--ink-2)" }}><span style={{ width: 6, height: 6, borderRadius: 3, background: p.corFam, flexShrink: 0 }} />{p.fam}</span>
        <span style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.35 }}>{p.notas}</span>
      </div>
    </Link>
  );
}

export function CelColecao({ d, s }: { d: DadosColecao; s: EstadoColecao }) {
  const [folha, setFolha] = useState(false);
  const [nota, setNota] = useState("");
  const c = d.classe;
  const conta = d.contagem as Record<string, number>;
  const abas = (
    <Rolar gap={6}>
      {SIT.map(([k, nome]) => (
        <Pill key={k} on={s.sit === k} onClick={() => s.setSit(k)}>{nome} <Qtd n={conta[k] ?? 0} /></Pill>
      ))}
    </Rolar>
  );
  const ouvir = () => ouvirUmaVez((txt) => s.setBusca(txt));
  return (
    <div className="c-tela">
      <TituloAba titulo="Coleção">
        <Circ icone="filtro" rotulo="Organizar" onClick={() => setFolha(true)} />
      </TituloAba>
      <label className="c-campo">
        <Icone nome="busca" tamanho={18} />
        <input value={s.busca} onChange={(e) => s.setBusca(e.target.value)} placeholder="Nome, marca ou nota" aria-label="Buscar na coleção" />
        <button type="button" className="c-circ" style={{ width: 32, height: 32, background: "var(--chip-2)" }} onClick={ouvir} aria-label="Buscar por voz"><Icone nome="mic" tamanho={15} /></button>
      </label>

      <Card fundo="destaque" pad={16}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Anel valor={c.total / Math.max(1, c.total + c.faltam)} txt={String(c.total)} sub="FRASCOS" tam={76} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Rot>Classe do colecionador</Rot>
            <span style={{ fontSize: 23, fontFamily: "var(--marca)", fontWeight: 500, lineHeight: 1 }}>{c.nome}</span>
            {c.faltam > 0 ? <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>Faltam <b style={{ color: "var(--ink)" }}>{c.faltam} frascos</b> para {c.prox}</span> : null}
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {d.resumo.map((r) => <span key={r.l} style={{ padding: "4px 9px", borderRadius: 10, background: "var(--chip)", fontSize: 11.5, whiteSpace: "nowrap" }}><b>{r.v}</b> {r.l}</span>)}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {c.niveis.map((n) => (
            <div key={n.nome} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
              <span style={{ height: 4, borderRadius: 2, background: n.cor }} />
              <span style={{ fontSize: 9.5, color: n.txt, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.nome}</span>
            </div>
          ))}
        </div>
      </Card>

      <Secao titulo="Marcos da coleção" dir={`${d.marcosN} de ${d.marcosT}`} />
      <Rolar>
        {d.marcosL.map((m) => {
          const ok = m.op === 1;
          return (
            <div key={m.nome} style={{ width: 136, flexShrink: 0, borderRadius: 16, padding: 12, background: ok ? "var(--chip)" : "transparent", border: `1px ${ok ? "solid" : "dashed"} ${ok ? "var(--line-2)" : "var(--line)"}`, display: "flex", flexDirection: "column", gap: 8, opacity: ok ? 1 : 0.75 }}>
              <span style={{ width: 28, height: 28, borderRadius: 14, background: ok ? "var(--prata)" : "var(--chip)", color: ok ? "var(--on-btn)" : "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "none", stroke: "currentColor", strokeWidth: ok ? 2.2 : 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}><path d={m.d} /></svg>
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.2 }}>{m.nome}</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.3 }}>{m.sub}</span>
            </div>
          );
        })}
      </Rolar>

      {abas}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".08em", color: "var(--ink-3)" }}>AGRUPAR</span>
        <button type="button" onClick={() => setFolha(true)} className="c-pill" style={{ height: 32, borderRadius: 16, fontSize: 13, color: "var(--ink)" }}>
          {GN.find((g) => g[0] === s.modo)?.[1]}
          <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: "none", stroke: "currentColor", strokeWidth: 2 }}><path d="M6 9l6 6 6-6" /></svg>
        </button>
        <span style={{ flexGrow: 1 }} />
        <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{s.total} {s.total === 1 ? "frasco" : "frascos"}</span>
      </div>

      {s.secoes.length === 0 && (
        <Card><span style={{ color: "var(--ink-2)", fontSize: 14 }}>Nada por aqui. {s.busca ? "Tente outro nome ou nota." : "Toque no + para cadastrar."}</span></Card>
      )}
      {s.secoes.map((g) => (
        <div key={g.nome} style={{ display: "flex", flexDirection: "column", gap: 14, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 9, height: 9, borderRadius: 5, background: g.cor }} />
            <span style={{ fontSize: 18, fontWeight: 500 }}>{g.nome}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: "var(--ink-3)" }}>{g.n}</span>
            <span style={{ flexGrow: 1, height: 1, background: "var(--line)" }} />
          </div>
          <div className="c-grade2">{g.itens.map((p) => <CardP key={p.id} p={p} />)}</div>
        </div>
      ))}

      {folha && (
        <>
          <div className="c-folha-fundo" onClick={() => setFolha(false)} />
          <div className="c-folha" role="dialog" aria-label="Organizar">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 20, fontWeight: 500 }}>Organizar</span>
              <button type="button" style={{ background: "none", border: "none", color: "var(--ink-2)", fontSize: 14 }} onClick={() => { s.setModo("acorde"); s.setSit("tenho"); s.setOrdem("recentes"); s.setBusca(""); setNota(""); }}>Limpar</button>
            </div>
            {([["Agrupar por", GN, s.modo, s.setModo], ["Mostrar", SIT, s.sit, s.setSit], ["Ordenar", ORD, s.ordem, s.setOrdem]] as const).map(([tit, ops, atual, set]) => (
              <div key={tit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Rot>{tit}</Rot>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ops.map(([k, nome]) => <Pill key={k} on={atual === k} altura={36} fs={14} onClick={() => set(k)}>{nome}</Pill>)}
                </div>
              </div>
            ))}
            <label className="c-campo">
              <Icone nome="busca" tamanho={18} />
              <input value={nota} onChange={(e) => { setNota(e.target.value); s.setBusca(e.target.value); }} placeholder="Filtrar por nota: bétula, baunilha…" />
            </label>
            <Btn altura={52} onClick={() => setFolha(false)}>Ver {s.total} {s.total === 1 ? "frasco" : "frascos"}</Btn>
          </div>
        </>
      )}
    </div>
  );
}
