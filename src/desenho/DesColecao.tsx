"use client";
/* Coleção do computador, Atlas Vivo (docs/DECISOES.md §28.2). Escrita à mão: não é mais gerada da prancha. */
import Link from "next/link";
import type { CSSProperties } from "react";
import { Icone } from "@/components/Icone";
import { PalcoC } from "@/cel/kit";
import type { DadosColecao } from "@/montar/colecao";
import type { EstadoColecao } from "@/cel/CelColecao";
import "./colecao.css";

type Item = DadosColecao["itens"][number];
const GN: [string, string][] = [["acorde", "Acorde"], ["familia", "Família"], ["marca", "Marca"], ["genero", "Gênero"], ["az", "A–Z"]];
const SIT: [string, string][] = [["tenho", "Tenho"], ["tive", "Tive"], ["quero", "Quero"], ["assinatura", "Assinatura"]];
const ORD: [string, string][] = [["recentes", "Mais recentes"], ["usados", "Mais usados"], ["esquecidos", "Esquecidos"]];
const n3 = (n: number) => String(n).padStart(3, "0");

function Cartao({ p, grande, k }: { p: Item; grande?: boolean; k: number }) {
  return (
    <Link href={p.href} className={`dc-cartao ${grande ? "grande" : ""}`} style={{ ["--terr" as string]: p.corTerr, ["--i" as string]: k } as CSSProperties}>
      <div className="dc-cartao-palco">
        <PalcoC nome={p.nome} casa={p.marca} acorde={p.acorde} forma={p.forma} tampa={p.tampa} foto={p.foto} oficial={p.oficial} altura={280} k={1.3} raio={28} transparente semBorda />
        {p.numero ? <span className="dc-num">Nº {n3(p.numero)}</span> : null}
        {p.rel ? <span className="dc-rel">{p.rel}</span> : null}
        {p.assin ? <span className="dc-assin" title="Assinatura"><Icone nome="estrela" tamanho={16} /></span> : null}
        {p.dna ? (
          <svg className="dc-dna" viewBox="0 0 100 100" aria-hidden="true">
            <path d={p.dna.aro} /><path d={p.dna.eixos} /><path className="forma" d={p.dna.forma} />
          </svg>
        ) : null}
      </div>
      <div className="dc-cartao-txt">
        <strong>{p.nome}</strong>
        <span className="dc-marca">{p.marcaUp}</span>
        <span className="dc-fam"><i style={{ background: p.corFam }} />{p.fam}</span>
        {grande && p.notas ? <span className="dc-notas">{p.notas}</span> : null}
      </div>
    </Link>
  );
}

export default function DesColecao({ d, s }: { d: DadosColecao; s: EstadoColecao }) {
  const c = d.classe;
  const conta = d.contagem as Record<string, number>;
  const frac = c.total / Math.max(1, c.total + c.faltam);
  const R = 92, L = 2 * Math.PI * R;
  return (
    <div className="dc">
      {/* ---------- cabeçalho: título enorme + classe do colecionador ---------- */}
      <header className="dc-cab">
        <div className="dc-cab-txt">
          <h1 className="dc-h1 palavras"><span style={{ ["--i" as string]: 0 } as CSSProperties}>Coleção</span><sup>{c.total}</sup></h1>
          <p>Seu arquivo de frascos: o que você tem, o que já teve e o que ainda quer.</p>
          <div className="dc-resumo">
            {d.resumo.map((r) => <span key={r.l}><b>{r.v}</b> {r.l}</span>)}
          </div>
        </div>
        <div className="dc-classe">
          <svg viewBox="0 0 220 220" className="dc-anel" aria-hidden="true">
            <defs>
              <linearGradient id="dc-anel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--acento)" /><stop offset="1" stopColor="var(--musgo)" /></linearGradient>
            </defs>
            <circle cx="110" cy="110" r={R} className="trilho" />
            <circle cx="110" cy="110" r={R} className="arco" style={{ strokeDasharray: L, ["--fim" as string]: L * (1 - frac) } as CSSProperties} />
          </svg>
          <div className="dc-classe-txt">
            <span className="rotulo">Classe do colecionador</span>
            <strong>{c.nome}</strong>
            {c.faltam > 0 ? <span>Faltam <b>{c.faltam} frascos</b> para {c.prox}</span> : <span>Classe máxima alcançada</span>}
            <div className="dc-niveis">
              {c.niveis.map((n) => <span key={n.nome} style={{ color: n.txt }}><i style={{ background: n.cor }} />{n.nome}</span>)}
            </div>
          </div>
        </div>
      </header>

      {/* ---------- marcos: fileira de selos ---------- */}
      <section className="dc-marcos">
        <span className="dc-marcos-tit">Marcos <b>{d.marcosN}/{d.marcosT}</b></span>
        {d.marcosL.map((m) => {
          const ok = m.op === 1;
          return (
            <span key={m.nome} className={`dc-marco ${ok ? "ok" : ""}`} title={m.sub}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d={m.d} /></svg>{m.nome}
            </span>
          );
        })}
      </section>

      {/* ---------- barra de ferramentas presa ao topo ---------- */}
      <div className="dc-barra">
        <div className="dc-seg">
          {SIT.map(([k, nome]) => <button key={k} type="button" className={s.sit === k ? "on" : ""} onClick={() => s.setSit(k)}>{nome}<small>{conta[k] ?? 0}</small></button>)}
        </div>
        <label className="campo dc-busca">
          <Icone nome="busca" tamanho={18} />
          <input value={s.busca} onChange={(e) => s.setBusca(e.target.value)} placeholder="Nome, marca ou nota" aria-label="Buscar na coleção" />
        </label>
        <div className="dc-seg leve">
          {GN.map(([k, nome]) => <button key={k} type="button" className={s.modo === k ? "on" : ""} onClick={() => s.setModo(k)}>{nome}</button>)}
        </div>
        <select className="dc-ordem" value={s.ordem} onChange={(e) => s.setOrdem(e.target.value)} aria-label="Ordenar">
          {ORD.map(([k, nome]) => <option key={k} value={k}>{nome}</option>)}
        </select>
      </div>

      {/* ---------- grupos: o primeiro de cada grupo ganha destaque ---------- */}
      <main className="dc-grupos">
        {s.secoes.length === 0 && (
          <div className="dc-vazio">
            <strong>Nada por aqui.</strong>
            <span>{s.busca ? "Tente outro nome, marca ou nota." : "Cadastre um frasco para começar esta prateleira."}</span>
            <Link href="/adicionar" className="btn">Adicionar perfume</Link>
          </div>
        )}
        {s.secoes.map((g) => (
          <section key={g.nome} className="dc-grupo" style={{ ["--cor" as string]: g.cor } as CSSProperties}>
            <header>
              <h2>{g.nome}</h2>
              <span>{g.n}</span>
            </header>
            <div className="dc-grade">
              {g.itens.map((p, k) => <Cartao key={p.id} p={p} k={k} grande={k === 0 && g.itens.length >= 3} />)}
            </div>
          </section>
        ))}
      </main>

      {d.demo ? <span className="tracejado dc-demo">DADOS ILUSTRATIVOS</span> : null}
    </div>
  );
}
