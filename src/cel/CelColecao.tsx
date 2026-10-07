"use client";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import "./cel-colecao.css";
import { Icone } from "@/components/Icone";
import { Anel, Btn, Card, Circ, MONO, PalcoC, Pill, Qtd, Rolar, Rot } from "./kit";
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

function CardP({ p, grande }: { p: Item; grande?: boolean }) {
  return (
    <Link href={p.href} className={`cc-cartao ${grande ? "grande" : ""}`} style={{ ["--terr" as string]: p.corTerr } as CSSProperties}>
      <div className="cc-palco">
        <PalcoC nome={p.nome} casa={p.marca} acorde={p.acorde} forma={p.forma} tampa={p.tampa} foto={p.foto} oficial={p.oficial} altura={grande ? 300 : 190} k={grande ? 1.45 : 0.95} raio={26} transparente semBorda />
        {p.rel ? <span className="cc-rel">{p.rel}</span> : null}
        {p.assin ? <span className="cc-assin"><Icone nome="estrela" tamanho={15} /></span> : null}
      </div>
      <strong>{p.nome}</strong>
      <span className="cc-marca">{p.marcaUp}</span>
      <span className="cc-fam"><i style={{ background: p.corFam }} />{p.fam}</span>
      {grande && p.notas ? <span className="cc-notas">{p.notas}</span> : null}
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
      <header className="cc-cab">
        <h1>Coleção<sup>{d.total}</sup></h1>
        <Circ icone="filtro" rotulo="Organizar" onClick={() => setFolha(true)} tamanho={44} />
      </header>
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

      <div className="cc-marcos-tit"><span className="c-rot">Marcos da coleção</span><span>{d.marcosN} de {d.marcosT}</span></div>
      <Rolar gap={6}>
        {d.marcosL.map((m) => (
          <span key={m.nome} className={`cc-marco ${m.op === 1 ? "ok" : ""}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={m.d} /></svg>{m.nome}
          </span>
        ))}
      </Rolar>

      {abas}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", color: "var(--ink-3)" }}>AGRUPAR</span>
        <button type="button" onClick={() => setFolha(true)} className="c-pill" style={{ height: 32, borderRadius: "var(--r-ctl)", fontSize: 13, color: "var(--ink)" }}>
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
          <div className="cc-grupo" style={{ ["--cor" as string]: g.cor } as CSSProperties}>
            <h2>{g.nome}</h2>
            <span>{g.n}</span>
          </div>
          <div className="c-grade2">{g.itens.map((p, k) => <CardP key={p.id} p={p} grande={k === 0 && g.itens.length >= 3} />)}</div>
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
