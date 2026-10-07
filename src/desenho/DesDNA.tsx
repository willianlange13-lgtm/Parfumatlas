/* DNA olfativo do computador, Atlas Vivo (docs/DECISOES.md §28.5). Escrito à mão: não é mais gerado da prancha. */
import Link from "next/link";
import type { CSSProperties } from "react";
import { Camadas, PalcoC } from "@/cel/kit";
import type { montarDNA } from "@/montar/dna";
import "./dna.css";

type V = Awaited<ReturnType<typeof montarDNA>>;
const i = (n: number) => ({ ["--i" as string]: n }) as CSSProperties;

function Palavras({ texto, de = 0 }: { texto: string; de?: number }) {
  return <>{texto.split(" ").map((w, k) => <span key={k} style={i(de + k)}>{w}&nbsp;</span>)}</>;
}

export default function DesDNA({ v }: { v: V }) {
  const totalA = v.tit.a.split(" ").length;
  return (
    <div className="dd">
      {/* ---------- topo: título do seu gosto + radar grande ---------- */}
      <section className="dd-topo">
        <div className="dd-topo-txt">
          <span className="rotulo">Seu DNA olfativo{v.demo ? " · dados ilustrativos" : ""}</span>
          <h1 className="palavras"><Palavras texto={v.tit.a} /><br /><em><Palavras texto={v.tit.b} de={totalA} /></em></h1>
          <p>{v.tit.texto}</p>
          <div className="dd-tracos">
            {v.tracos.map((t) => <span key={t.nome}><i style={{ background: t.cor }} />{t.nome}</span>)}
          </div>
        </div>
        <div className="dd-radar">
          <div className="dd-radar-luz" aria-hidden="true" />
          <div className="dd-radar-giro dna-respira"><Camadas camadas={v.glifo} tam={520} /></div>
          {v.eixos.map((e, k) => (
            <span key={k} className="dd-eixo" style={{ left: `${(+e.x / 560) * 100}%`, top: `${(+e.y / 560) * 100}%` }}>
              {e.nome}<b style={{ color: e.cor }}>{e.v}%</b>
            </span>
          ))}
        </div>
      </section>

      {/* ---------- cifras: três números grandes, sem cartões ---------- */}
      <section className="dd-cifras">
        {v.cifras.map((c, k) => (
          <div key={k}>
            <span>{c.l}</span>
            <b>{c.v}</b>
            <small>{c.c}</small>
          </div>
        ))}
      </section>

      {/* ---------- notas: constelação de bolhas pelo número de frascos ---------- */}
      <section className="dd-bloco">
        <header><h2>As notas que voltam</h2><span>em quantos frascos cada uma aparece</span></header>
        <div className="dd-notas">
          {v.notas.map((n, k) => (
            <div key={n.nome} className="dd-nota" style={{ ["--tam" as string]: `${48 + n.pct * 0.7}px`, ["--cor" as string]: n.cor, ...i(k) } as CSSProperties}>
              <span className="dd-nota-bola" style={{ background: n.img ? "#fff" : n.bg }}>
                {n.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.img} alt={n.nome} />
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={n.d} /></svg>
                )}
              </span>
              <strong>{n.nome}</strong>
              <small>{n.qtd} frascos</small>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- caráter + estações lado a lado ---------- */}
      <section className="dd-duplo">
        <div className="dd-bloco dd-carater">
          <header><h2>Caráter da coleção</h2></header>
          {v.carater.map((c) => (
            <div key={c.a} className="dd-escala">
              <span style={{ color: c.ce }}>{c.a}</span>
              <div className="dd-escala-trilho"><i style={{ left: `${c.v}%` }} /></div>
              <span style={{ color: c.cd }}>{c.b}</span>
            </div>
          ))}
          <p>{v.caraterTxt}</p>
        </div>
        <div className="dd-bloco dd-estacoes">
          <header><h2>Em cada estação</h2></header>
          <div className="dd-estacoes-grade">
            {v.estacoes.map((e) => (
              <div key={e.nome}>
                <b>{e.n}</b>
                <span>{e.nome}</span>
                <div className="dd-blocos">{e.blocos.map((cor, k) => <i key={k} style={{ background: cor }} />)}</div>
              </div>
            ))}
          </div>
          <p>{v.estacoesTxt}</p>
        </div>
      </section>

      {/* ---------- gosto ao longo do tempo ---------- */}
      <section className="dd-bloco dd-fluxo">
        <header><h2>Como o seu gosto mudou</h2><span>{v.gostoTxt}</span></header>
        <div className="dd-fluxo-graf">
          <svg viewBox="0 0 1000 240" preserveAspectRatio="none" aria-hidden="true">
            {v.fluxo.camadas.map((c, k) => <path key={k} d={c.d} fill={c.cor} fillOpacity={0.75 * c.op} style={i(k)} />)}
          </svg>
          {v.fluxo.rotulos.map((r) => (
            <span key={r.nome} className="dd-fluxo-rot" style={{ top: `${(+r.y / 240) * 100}%`, color: r.cor }}>{r.nome} <b>{r.pct}%</b></span>
          ))}
          <div className="dd-fluxo-anos">{v.fluxo.anos.map((a) => <span key={a.t} style={{ left: `${(+a.x / 1000) * 100}%` }}>{a.t}</span>)}</div>
        </div>
      </section>

      {/* ---------- lacunas: o que falta no seu mapa ---------- */}
      {v.lacunas.length > 0 && (
        <section className="dd-bloco">
          <header><h2>O que falta no seu mapa</h2><span>um perfume para cada lacuna</span></header>
          <div className="dd-lacunas">
            {v.lacunas.map((l) => (
              <Link key={l.falta} href={l.href} className="dd-lacuna" style={{ ["--cor" as string]: l.cor } as CSSProperties}>
                <span className="dd-falta">{l.falta}</span>
                <PalcoC nome={l.nome} casa={l.casa} acorde="" tampa={l.tampa} foto={l.foto} oficial={Boolean(l.foto)} altura={200} k={1} raio={24} transparente semBorda />
                <strong>{l.nome}</strong>
                <small>{l.casa} · {l.por}</small>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
