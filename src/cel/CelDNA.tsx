/* DNA olfativo no celular, Atlas Vivo (docs/DECISOES.md §28.10). */
import Link from "next/link";
import type { CSSProperties } from "react";
import { Camadas, PalcoC } from "./kit";
import type { montarDNA } from "@/montar/dna";
import "./cel-dna.css";

type V = Awaited<ReturnType<typeof montarDNA>>;

export function CelDNA({ v }: { v: V }) {
  return (
    <div className="c-tela cd">
      <header className="cd-topo">
        <span className="c-rot">Seu DNA olfativo{v.demo ? " · ilustrativo" : ""}</span>
        <h1>{v.tit.a}<br /><em>{v.tit.b}</em></h1>
        <p>{v.tit.texto}</p>
      </header>

      <div className="cd-radar">
        <div className="dna-respira"><Camadas camadas={v.glifo} tam={300} /></div>
        {v.eixos.map((e, k) => (
          <span key={k} style={{ left: `${(+e.x / 560) * 100}%`, top: `${(+e.y / 560) * 100}%` }}>{e.nome}<b style={{ color: e.cor }}>{e.v}%</b></span>
        ))}
      </div>

      <div className="cd-tracos">{v.tracos.map((t) => <span key={t.nome}><i style={{ background: t.cor }} />{t.nome}</span>)}</div>

      <div className="cd-cifras">
        {v.cifras.map((c, k) => <div key={k}><span>{c.l}</span><b>{c.v}</b><small>{c.c}</small></div>)}
      </div>

      <section className="cd-bloco">
        <h2>As notas que voltam</h2>
        <div className="cd-notas">
          {v.notas.slice(0, 8).map((n) => (
            <div key={n.nome} style={{ ["--tam" as string]: `${40 + n.pct * 0.4}px`, ["--cor" as string]: n.cor } as CSSProperties}>
              <span style={{ background: n.img ? "#fff" : n.bg }}>
                {n.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.img} alt={n.nome} />
                ) : <svg viewBox="0 0 24 24" aria-hidden="true"><path d={n.d} /></svg>}
              </span>
              <strong>{n.nome}</strong><small>{n.qtd}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="cd-bloco cd-cartao">
        <h2>Caráter</h2>
        {v.carater.map((c) => (
          <div key={c.a} className="cd-escala"><span>{c.a}</span><div><i style={{ left: `${c.v}%` }} /></div><span>{c.b}</span></div>
        ))}
        <p>{v.caraterTxt}</p>
      </section>

      <section className="cd-bloco">
        <h2>Em cada estação</h2>
        <div className="cd-estacoes">{v.estacoes.map((e) => <div key={e.nome}><b>{e.n}</b><span>{e.nome}</span></div>)}</div>
        <p>{v.estacoesTxt}</p>
      </section>

      {v.lacunas.length > 0 && (
        <section className="cd-bloco">
          <h2>O que falta no seu mapa</h2>
          <div className="c-rolar cd-lacunas">
            {v.lacunas.map((l) => (
              <Link key={l.falta} href={l.href} style={{ ["--cor" as string]: l.cor } as CSSProperties}>
                <span className="cd-falta">{l.falta}</span>
                <PalcoC nome={l.nome} casa={l.casa} acorde="" tampa={l.tampa} foto={l.foto} oficial={Boolean(l.foto)} altura={150} k={0.8} raio={20} transparente semBorda />
                <strong>{l.nome}</strong><small>{l.por}</small>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
